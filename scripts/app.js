document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('explainForm');
  if (form) {
    // Prevent native form submission which can trigger a GET to /api/explain.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
    });
  }

  const freeButton = document.getElementById('freeButton');
  const clearButton = document.getElementById('clearButton');
  const removeFileButton = document.getElementById('removeFileButton');
  const fileInput = document.getElementById('documentFile');
  const fileDetails = document.getElementById('fileDetails');
  const resultCard = document.getElementById('resultCard');
  const statusMessage = document.getElementById('statusMessage');
  const errorMessage = document.getElementById('errorMessage');

  let extractInProgress = false;

  function updateTextCount(val) {
    const textCountEl = document.getElementById('textCount');
    if (textCountEl) textCountEl.textContent = `${(val || '').length} / 5000 znaków`;
  }

  function updateFreeButtonState() {
    const ta = document.getElementById('documentText');
    const hasText = ta && ta.value && ta.value.trim().length > 0;
    if (freeButton) freeButton.disabled = extractInProgress || !hasText;
    if (clearButton) clearButton.disabled = extractInProgress;
  }

  function setLoading(isLoading) {
    if (!freeButton) return;
    freeButton.disabled = isLoading;
    if (clearButton) clearButton.disabled = isLoading;

    if (isLoading) {
      freeButton.dataset.orig = freeButton.textContent;
      freeButton.textContent = 'Wyjaśnianie…';
      freeButton.setAttribute('aria-busy', 'true');
    } else {
      if (freeButton.dataset.orig) freeButton.textContent = freeButton.dataset.orig;
      freeButton.removeAttribute('aria-busy');
    }
  }

  if (fileInput && fileDetails && removeFileButton) {
    fileInput.addEventListener('change', async function () {
      const f = fileInput.files && fileInput.files[0];
      // when file selection starts, mark extraction in progress and update button state
      extractInProgress = false; // reset then set if needed
      updateFreeButtonState();

      if (f) {
        fileDetails.hidden = false;
        fileDetails.textContent = `${f.name} — ${Math.round(f.size / 1024)} KB`;
        removeFileButton.disabled = false;

        // Try to populate textarea with file contents.
        const textareaEl = document.getElementById('documentText');

        const lowerName = f.name ? f.name.toLowerCase() : '';
        if ((f.type && f.type.startsWith('text/')) || lowerName.endsWith('.txt') || lowerName.endsWith('.rtf') || lowerName.endsWith('.md') || lowerName.endsWith('.csv')) {
          const reader = new FileReader();
          extractInProgress = true;
          updateFreeButtonState();
          if (statusMessage) {
            statusMessage.hidden = false;
            statusMessage.textContent = 'Wczytywanie pliku…';
          }
          reader.addEventListener('load', function (ev) {
            const content = ev.target.result || '';
            if (textareaEl) textareaEl.value = content;
            updateTextCount(content);
            extractInProgress = false;
            if (statusMessage) statusMessage.hidden = true;
            updateFreeButtonState();
          });
          reader.readAsText(f, 'utf-8');
        } else {
          // Fallback: ask server to extract text and return it (without generating explanation)
          extractInProgress = true;
          updateFreeButtonState();
          if (statusMessage) {
            statusMessage.hidden = false;
            statusMessage.textContent = 'Wczytywanie pliku…';
          }
          try {
            const formData = new FormData();
            formData.append('file', f, f.name);
            const resp = await fetch('/api/explain', { method: 'POST', headers: { 'X-Extract-Only': '1' }, body: formData });
            if (resp.ok) {
              const json = await resp.json().catch(() => null);
              const extracted = (json && (json.extractedText || json.text)) || '';
              if (textareaEl && extracted) {
                textareaEl.value = extracted;
                updateTextCount(extracted);
                if (errorMessage) { errorMessage.hidden = true; errorMessage.textContent = ''; }
              } else {
                if (errorMessage) {
                  errorMessage.hidden = false;
                  errorMessage.textContent = 'Nie udało się automatycznie wczytać tekstu z pliku. Jeśli to skan, włącz OCR (OCR_WORKER_URL) lub wpisz tekst ręcznie.';
                }
              }
            } else {
              const errJson = await resp.json().catch(() => null);
              if (errorMessage) {
                errorMessage.hidden = false;
                errorMessage.textContent = (errJson && errJson.error) || 'Nie udało się wczytać pliku.';
              }
            }
          } catch (e) {
            if (errorMessage) {
              errorMessage.hidden = false;
              errorMessage.textContent = 'Błąd wczytywania pliku.';
            }
          } finally {
            extractInProgress = false;
            if (statusMessage) statusMessage.hidden = true;
            updateFreeButtonState();
          }
        }
      } else {
        fileDetails.hidden = true;
        fileDetails.textContent = '';
        removeFileButton.disabled = true;
        updateFreeButtonState();
      }
    });
  }

  if (removeFileButton) {
    removeFileButton.addEventListener('click', function () {
      if (fileInput) fileInput.value = '';
      if (fileDetails) {
        fileDetails.hidden = true;
        fileDetails.textContent = '';
      }
      removeFileButton.disabled = true;
      // Update UI state after removing file
      updateFreeButtonState();
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      const confirmModal = document.getElementById('confirmModal');
      if (confirmModal) confirmModal.hidden = false;
    });
  }

  const confirmClearButton = document.getElementById('confirmClearButton');
  const cancelClearButton = document.getElementById('cancelClearButton');

  if (confirmClearButton) {
    confirmClearButton.addEventListener('click', function () {
      if (textarea) textarea.value = '';
      if (fileInput) fileInput.value = '';
      if (fileDetails) {
        fileDetails.hidden = true;
        fileDetails.textContent = '';
      }
      if (removeFileButton) removeFileButton.disabled = true;
      updateTextCount('');
      updateFreeButtonState();
      const confirmModal = document.getElementById('confirmModal');
      if (confirmModal) confirmModal.hidden = true;
    });
  }

  if (cancelClearButton) {
    cancelClearButton.addEventListener('click', function () {
      const confirmModal = document.getElementById('confirmModal');
      if (confirmModal) confirmModal.hidden = true;
    });
  }

  // Wire textarea input to update state
  const textarea = document.getElementById('documentText');
  if (textarea) {
    updateTextCount(textarea.value || '');
    textarea.addEventListener('input', function () {
      updateTextCount(this.value || '');
      updateFreeButtonState();
    });
  }

  // Evaluate initial button state
  updateFreeButtonState();

  if (freeButton) {
    freeButton.addEventListener('click', async function () {
      setLoading(true);
      if (statusMessage) {
        statusMessage.hidden = false;
        statusMessage.textContent = 'Wysyłanie do serwera…';
      }
      if (errorMessage) {
        errorMessage.hidden = true;
        errorMessage.textContent = '';
      }
      if (resultCard) resultCard.hidden = true;

      try {
        const text = (textarea && textarea.value) || '';
        const file = fileInput && fileInput.files && fileInput.files[0];

        let response;
        if (file) {
          const formData = new FormData();
          if (text.trim()) formData.append('text', text);
          formData.append('file', file, file.name);
          response = await fetch('/api/explain', { method: 'POST', body: formData });
        } else {
          if (!text.trim()) {
            throw new Error(
              'Proszę wkleić treść pisma do przetworzenia lub dołączyć plik z tekstem.'
            );
          }
          response = await fetch('/api/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
        }

        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error((json && json.error) || 'Błąd serwera');
        }

        const data = await response.json();
        const resultText = document.getElementById('resultText');
        if (resultText) resultText.textContent = data.explanation || '';
        // Show which model was used (if provided by backend)
        const usedModelEl = document.getElementById('usedModel');
        if (usedModelEl) {
          const model = data && data.usedModel;
          const fallback = data && data.usedFallback ? ' (fallback)' : '';
          if (model) {
            usedModelEl.textContent = `Użyty model: ${model}${fallback}`;
            usedModelEl.hidden = false;
          } else {
            usedModelEl.hidden = true;
          }
        }
        if (resultCard) resultCard.hidden = false;
        if (statusMessage) statusMessage.hidden = true;
      } catch (err) {
        if (errorMessage) {
          errorMessage.hidden = false;
          errorMessage.textContent = (err && err.message) || 'Wystąpił błąd';
        }
        if (statusMessage) statusMessage.hidden = true;
      } finally {
        setLoading(false);
      }
    });
  }

  const skip = document.querySelector('.skip-link');
  if (skip) {
    skip.addEventListener('click', function () {
      const target = document.querySelector(skip.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.removeAttribute('tabindex');
      }
    });
  }
});
