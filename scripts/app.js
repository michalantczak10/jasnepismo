document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('explainForm');
  if (form) {
    // prevent native form submission which can trigger a GET to /api/explain
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

  function setLoading(isLoading) {
    if (!freeButton) return;
    freeButton.disabled = isLoading;
    clearButton.disabled = isLoading;
    if (isLoading) {
      freeButton.dataset.orig = freeButton.textContent;
      freeButton.textContent = 'Wyjaśnianie…';
      freeButton.setAttribute('aria-busy', 'true');
    } else {
      if (freeButton.dataset.orig) freeButton.textContent = freeButton.dataset.orig;
      freeButton.removeAttribute('aria-busy');
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      const f = fileInput.files && fileInput.files[0];
      if (f) {
        fileDetails.hidden = false;
        fileDetails.textContent = `${f.name} — ${Math.round(f.size/1024)} KB`;
        removeFileButton.disabled = false;
      } else {
        fileDetails.hidden = true;
        fileDetails.textContent = '';
        removeFileButton.disabled = true;
      }
    });
  }

  if (removeFileButton) {
    removeFileButton.addEventListener('click', function () {
      if (fileInput) {
        fileInput.value = '';
        fileDetails.hidden = true;
        removeFileButton.disabled = true;
      }
    });
  }

  if (freeButton) {
    freeButton.addEventListener('click', async function () {
      setLoading(true);
      statusMessage.hidden = false;
      statusMessage.textContent = 'Wysyłanie do serwera…';
      errorMessage.hidden = true;
      resultCard.hidden = true;
      try {
        const text = document.getElementById('documentText').value || '';
        const resp = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!resp.ok) throw new Error('Błąd serwera');
        const data = await resp.json();
        document.getElementById('resultText').textContent = data.explanation || '';
        resultCard.hidden = false;
        statusMessage.hidden = true;
      } catch (err) {
        errorMessage.hidden = false;
        errorMessage.textContent = err.message || 'Wystąpił błąd';
        statusMessage.hidden = true;
      } finally {
        setLoading(false);
      }
    });
  }

  // Skip-link focus support: focus main content when clicked
  const skip = document.querySelector('.skip-link');
  if (skip) {
    skip.addEventListener('click', function (e) {
      const target = document.querySelector(skip.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.removeAttribute('tabindex');
      }
    });
  }
});
