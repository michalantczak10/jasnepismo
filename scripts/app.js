document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("explainForm");
  if (form) {
    // Prevent native form submission which can trigger a GET to /api/explain.
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  const freeButton = document.getElementById("freeButton");
  const clearButton = document.getElementById("clearButton");
  const removeFileButton = document.getElementById("removeFileButton");
  const fileInput = document.getElementById("documentFile");
  const fileDetails = document.getElementById("fileDetails");
  const resultCard = document.getElementById("resultCard");
  const downloadButton = document.getElementById("downloadButton");
  const statusMessage = document.getElementById("statusMessage");
  const errorMessage = document.getElementById("errorMessage");

  let extractInProgress = false;
  let lastFocusedElement = null;
  let currentMode = "explain"; // "explain" | "write"

  // Mode tab switching
  const modeTabs = document.querySelectorAll(".mode-tab");
  const fileSection = document.getElementById("fileSection");
  const appHeading = document.getElementById("app-heading");
  const appIntro = document.getElementById("app-intro");
  const resultHeading = document.getElementById("resultHeading");

  function setMode(mode) {
    currentMode = mode;
    if (form) form.dataset.mode = mode;

    // Update tabs
    modeTabs.forEach(function (tab) {
      var isActive = tab.dataset.mode === mode;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Update heading / intro / placeholder
    if (mode === "write") {
      if (appHeading) appHeading.textContent = "Opisz, a my napiszemy pismo";
      if (appIntro)
        appIntro.textContent =
          "Opisz własnymi słowami, czego potrzebujesz. My napiszemy oficjalne pismo.";
      var ta = document.getElementById("documentText");
      if (ta)
        ta.placeholder =
          "Opisz własnymi słowami, czego dotyczy twoja sprawa...";
      if (freeButton) freeButton.textContent = "Generuj pismo";
      if (resultHeading) resultHeading.textContent = "Twoje pismo";
      if (downloadButton) downloadButton.textContent = "Pobierz pismo";
      if (fileSection) fileSection.style.display = "none";
    } else {
      if (appHeading) appHeading.textContent = "Wklej pismo — my wyjaśniamy";
      if (appIntro)
        appIntro.textContent =
          "Wklej tekst lub prześlij plik. Kliknij „Wyjaśnij” — gotowe.";
      var ta2 = document.getElementById("documentText");
      if (ta2) ta2.placeholder = "Wklej tutaj tekst z pisma...";
      if (freeButton) freeButton.textContent = "Wyjaśnij";
      if (resultHeading) resultHeading.textContent = "Wyjaśnienie";
      if (downloadButton) downloadButton.textContent = "Pobierz odpowiedź";
      if (fileSection) fileSection.style.display = "";
    }

    // Clear previous result when switching modes
    if (resultCard) resultCard.hidden = true;
    var rText = document.getElementById("resultText");
    if (rText) rText.textContent = "";
    if (statusMessage) statusMessage.hidden = true;
    if (errorMessage) {
      errorMessage.hidden = true;
      errorMessage.textContent = "";
    }
    updateTextCount("");
    if (textarea) textarea.value = "";
    updateFreeButtonState();
  }

  modeTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var mode = tab.dataset.mode;
      if (mode && mode !== currentMode) setMode(mode);
    });
  });

  function updateTextCount(val) {
    const textCountEl = document.getElementById("textCount");
    if (textCountEl)
      textCountEl.textContent = `${(val || "").length} / 5000 znaków`;
  }

  function updateFreeButtonState() {
    const ta = document.getElementById("documentText");
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
      freeButton.textContent =
        currentMode === "write" ? "Generowanie pisma..." : "Wyjaśnianie...";
      freeButton.setAttribute("aria-busy", "true");
    } else {
      if (freeButton.dataset.orig)
        freeButton.textContent = freeButton.dataset.orig;
      freeButton.removeAttribute("aria-busy");
    }
  }

  function compressImageIfNeeded(file) {
    var imageExts = [".jpg", ".jpeg", ".png", ".bmp", ".gif"];
    var name = (file && file.name) || "";
    var isImage = imageExts.some(function (ext) { return name.toLowerCase().endsWith(ext); });
    if (!isImage) return Promise.resolve(file);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var MAX = 2000;
        var w = img.width, h = img.height;
        if (w <= MAX && h <= MAX && file.size < 1024 * 1024) {
          resolve(file);
          return;
        }
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (!blob) { resolve(file); return; }
          var newName = name.replace(/\.\w+$/, ".jpg");
          var newFile = new File([blob], newName, { type: "image/jpeg" });
          resolve(newFile);
        }, "image/jpeg", 0.8);
      };
      img.onerror = function () { resolve(file); };
      var url = URL.createObjectURL(file);
      img.src = url;
    });
  }

  if (fileInput && fileDetails && removeFileButton) {
    fileInput.addEventListener("change", async function () {
      var files = fileInput.files;
      extractInProgress = false;
      updateFreeButtonState();

      if (files && files.length > 0) {
        var fileArray = Array.prototype.slice.call(files);
        var MAX_SIZE = 5 * 1024 * 1024;
        var allowedExtensions = [
          ".doc",
          ".dotx",
          ".docx",
          ".odt",
          ".pdf",
          ".rtf",
          ".txt",
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".bmp",
        ];

        // Validate all files — collect errors but don't reject valid ones
        var validFiles = [];
        var errorMessages = [];

        for (var fi = 0; fi < fileArray.length; fi++) {
          var g = fileArray[fi];

          if (g.size > MAX_SIZE) {
            errorMessages.push(
              'Plik "' + g.name + '" jest za duży. Maksymalny rozmiar to 5 MB.',
            );
            continue;
          }

          var fname = g.name ? g.name.toLowerCase() : "";
          var validExt = allowedExtensions.some(function (ext) {
            return fname.endsWith(ext);
          });
          if (!validExt) {
            errorMessages.push(
              'Plik "' +
                g.name +
                '" ma nieobsługiwany format. Dozwolone: PDF, DOC, DOCX, ODT, RTF, TXT, JPG, PNG, BMP, GIF.',
            );
            continue;
          }

          validFiles.push(g);
        }

        if (errorMessages.length > 0) {
          if (errorMessage) {
            errorMessage.textContent = errorMessages.join(" ");
            errorMessage.hidden = false;
          }
        }

        if (validFiles.length === 0) {
          fileInput.value = "";
          updateFreeButtonState();
          return;
        }

        // Show file details
        fileDetails.hidden = false;
        if (validFiles.length === 1) {
          fileDetails.textContent =
            validFiles[0].name +
            " — " +
            Math.round(validFiles[0].size / 1024) +
            " KB";
        } else {
          var names = validFiles
            .map(function (x) {
              return x.name;
            })
            .join(", ");
          var totalSize = validFiles.reduce(function (sum, x) {
            return sum + x.size;
          }, 0);
          fileDetails.textContent =
            validFiles.length +
            " plików: " +
            names +
            " — " +
            Math.round(totalSize / 1024) +
            " KB łącznie";
        }
        removeFileButton.disabled = false;

        var textareaEl = document.getElementById("documentText");

        // Single .txt/.md/.csv file: read locally (instant)
        if (validFiles.length === 1) {
          var singleFile = validFiles[0];
          var lowerName = singleFile.name ? singleFile.name.toLowerCase() : "";
          if (
            (singleFile.type && singleFile.type.startsWith("text/")) ||
            lowerName.endsWith(".txt") ||
            lowerName.endsWith(".md") ||
            lowerName.endsWith(".csv")
          ) {
            (function (f) {
              var reader = new FileReader();
              extractInProgress = true;
              updateFreeButtonState();
              if (statusMessage) {
                statusMessage.hidden = false;
                statusMessage.textContent = "Wczytywanie pliku...";
              }
              reader.addEventListener("load", function (ev) {
                var content = ev.target.result || "";
                if (content.length > 5000) {
                  content = content.slice(0, 5000);
                  if (errorMessage) {
                    errorMessage.textContent =
                      "Plik został przycięty do 5000 znaków (maksymalny limit).";
                    errorMessage.hidden = false;
                  }
                }
                if (textareaEl) textareaEl.value = content;
                updateTextCount(content);
                extractInProgress = false;
                if (statusMessage) statusMessage.hidden = true;
                updateFreeButtonState();
              });
              reader.readAsText(f, "utf-8");
            })(singleFile);
            return;
          }
        }

        // Multiple files or binary files: send to server for extraction
        extractInProgress = true;
        updateFreeButtonState();
        if (statusMessage) {
          statusMessage.hidden = false;
          statusMessage.textContent = "Wczytywanie pliku...";
        }
        try {
          var formData = new FormData();
          for (var fi2 = 0; fi2 < validFiles.length; fi2++) {
            var compressedFile = await compressImageIfNeeded(validFiles[fi2]);
            formData.append("file", compressedFile, compressedFile.name || validFiles[fi2].name);
          }
          var resp = await fetch("/api/explain", {
            method: "POST",
            headers: { "X-Extract-Only": "1" },
            body: formData,
          });
          if (resp.ok) {
            var json = await resp.json().catch(function () {
              return null;
            });
            var extracted = (json && (json.extractedText || json.text)) || "";
            if (textareaEl && extracted) {
              if (extracted.length > 5000) {
                extracted = extracted.slice(0, 5000);
                if (errorMessage) {
                  errorMessage.textContent =
                    "Tekst został przycięty do 5000 znaków (maksymalny limit).";
                  errorMessage.hidden = false;
                }
              }
              textareaEl.value = extracted;
              updateTextCount(extracted);
              if (errorMessage) {
                errorMessage.hidden = true;
                errorMessage.textContent = "";
              }
            } else {
              if (errorMessage) {
                errorMessage.hidden = false;
                errorMessage.textContent =
                  "Nie udało się automatycznie wczytać tekstu z pliku. Wyślij plik do wyjaśnienia — OCR zostanie wykonany na serwerze. Możesz też wpisać tekst ręcznie.";
              }
            }
          } else {
            var errJson = await resp.json().catch(function () {
              return null;
            });
            if (errorMessage) {
              errorMessage.hidden = false;
              errorMessage.textContent =
                (errJson && errJson.error) || "Nie udało się wczytać pliku.";
            }
          }
        } catch (e) {
          if (errorMessage) {
            errorMessage.hidden = false;
            errorMessage.textContent = "Błąd wczytywania pliku.";
          }
        } finally {
          extractInProgress = false;
          if (statusMessage) statusMessage.hidden = true;
          updateFreeButtonState();
        }
      } else {
        fileDetails.hidden = true;
        fileDetails.textContent = "";
        removeFileButton.disabled = true;
        updateFreeButtonState();
      }
    });
  }

  if (removeFileButton) {
    removeFileButton.addEventListener("click", function () {
      if (fileInput) fileInput.value = "";
      if (fileDetails) {
        fileDetails.hidden = true;
        fileDetails.textContent = "";
      }
      removeFileButton.disabled = true;
      // Update UI state after removing file
      updateFreeButtonState();
    });
  }

  let modalCleanup = null;

  function closeModal() {
    const confirmModal = document.getElementById("confirmModal");
    if (confirmModal) confirmModal.hidden = true;
    if (lastFocusedElement) lastFocusedElement.focus();
    lastFocusedElement = null;
    if (modalCleanup) {
      modalCleanup();
      modalCleanup = null;
    }
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.removeAttribute("aria-hidden");
  }

  function openModal() {
    const confirmModal = document.getElementById("confirmModal");
    if (!confirmModal) return;
    lastFocusedElement = clearButton;

    // Customize modal text based on result state
    const modalText = document.getElementById("confirmModalText");
    const resultCard = document.getElementById("resultCard");
    if (modalText) {
      if (resultCard && !resultCard.hidden) {
        modalText.textContent =
          "Czy na pewno chcesz usunąć cały tekst? Zniknie też odpowiedź, którą dostaliśmy.";
      } else {
        modalText.textContent = "Czy na pewno chcesz usunąć cały tekst?";
      }
    }

    confirmModal.hidden = false;

    // Mark background content as inert for screen readers
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.setAttribute("aria-hidden", "true");

    function onKeydown(e) {
      if (e.key === "Escape") closeModal();
      // Focus trap
      if (e.key === "Tab") {
        const focusable = confirmModal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    function onOverlayClick(e) {
      if (e.target === e.currentTarget) closeModal();
    }

    document.addEventListener("keydown", onKeydown);
    confirmModal.addEventListener("click", onOverlayClick);
    modalCleanup = function () {
      document.removeEventListener("keydown", onKeydown);
      confirmModal.removeEventListener("click", onOverlayClick);
    };

    const firstFocusable = confirmModal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (firstFocusable) firstFocusable.focus();
  }

  if (clearButton) {
    clearButton.addEventListener("click", openModal);
  }

  const confirmClearButton = document.getElementById("confirmClearButton");
  const cancelClearButton = document.getElementById("cancelClearButton");

  if (confirmClearButton) {
    confirmClearButton.addEventListener("click", function () {
      if (textarea) textarea.value = "";
      if (fileInput) fileInput.value = "";
      if (fileDetails) {
        fileDetails.hidden = true;
        fileDetails.textContent = "";
      }
      if (removeFileButton) removeFileButton.disabled = true;
      updateTextCount("");
      updateFreeButtonState();
      closeModal();
    });
  }

  if (cancelClearButton) {
    cancelClearButton.addEventListener("click", closeModal);
  }

  // Wire download button
  if (downloadButton) {
    downloadButton.addEventListener("click", function () {
      const resultText = document.getElementById("resultText");
      const usedModelEl = document.getElementById("usedModel");
      const text = (resultText && resultText.textContent) || "";
      const modelInfo =
        (usedModelEl && !usedModelEl.hidden && usedModelEl.textContent) || "";
      const content = text + (modelInfo ? "\n\n---\n" + modelInfo : "");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        currentMode === "write"
          ? "jasnepismo-pismo.txt"
          : "jasnepismo-wyjasnienie.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 100);
    });
  }

  // Wire textarea input to update state
  const textarea = document.getElementById("documentText");
  if (textarea) {
    updateTextCount(textarea.value || "");
    textarea.addEventListener("input", function () {
      updateTextCount(this.value || "");
      updateFreeButtonState();
    });
  }

  // Evaluate initial button state
  updateFreeButtonState();

  if (freeButton) {
    freeButton.addEventListener("click", async function () {
      setLoading(true);
      if (statusMessage) {
        statusMessage.hidden = false;
        statusMessage.textContent = "Wysyłanie do serwera...";
      }
      if (errorMessage) {
        errorMessage.hidden = true;
        errorMessage.textContent = "";
      }
      if (resultCard) resultCard.hidden = true;

      try {
        const text = (textarea && textarea.value) || "";

        if (currentMode === "write") {
          if (!text.trim()) {
            throw new Error(
              "Opisz własnymi słowami, czego dotyczy twoja sprawa.",
            );
          }
          const response = await fetch("/api/write-letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: text }),
          });
          if (!response.ok) {
            const json = await response.json().catch(() => null);
            throw new Error((json && json.error) || "Błąd serwera");
          }
          const data = await response.json();
          const resultText = document.getElementById("resultText");
          if (resultText) resultText.textContent = data.letter || "";
          const usedModelEl = document.getElementById("usedModel");
          if (usedModelEl) {
            const model = data && data.usedModel;
            if (model) {
              usedModelEl.textContent = `Użyty model: ${model}`;
              usedModelEl.hidden = false;
            } else {
              usedModelEl.hidden = true;
            }
          }
          if (resultCard) resultCard.hidden = false;
          if (downloadButton) downloadButton.hidden = false;
          if (statusMessage) statusMessage.hidden = true;
        } else {
          const uploadFiles = fileInput && fileInput.files;

          let response;
          if (uploadFiles && uploadFiles.length > 0) {
            const formData = new FormData();
            if (text.trim()) formData.append("text", text);
            for (var fi3 = 0; fi3 < uploadFiles.length; fi3++) {
              var compressedFile = await compressImageIfNeeded(uploadFiles[fi3]);
              formData.append("file", compressedFile, compressedFile.name || uploadFiles[fi3].name);
            }
            response = await fetch("/api/explain", {
              method: "POST",
              body: formData,
            });
          } else {
            if (!text.trim()) {
              throw new Error(
                "Proszę wkleić treść pisma do przetworzenia lub dołączyć plik z tekstem.",
              );
            }
            response = await fetch("/api/explain", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
          }

          if (!response.ok) {
            const json = await response.json().catch(() => null);
            throw new Error((json && json.error) || "Błąd serwera");
          }

          const data = await response.json();
          const resultText = document.getElementById("resultText");
          if (resultText) resultText.textContent = data.explanation || "";
          const usedModelEl = document.getElementById("usedModel");
          if (usedModelEl) {
            const model = data && data.usedModel;
            const fallback = data && data.usedFallback ? " (fallback)" : "";
            if (model) {
              usedModelEl.textContent = `Użyty model: ${model}${fallback}`;
              usedModelEl.hidden = false;
            } else {
              usedModelEl.hidden = true;
            }
          }
          if (resultCard) resultCard.hidden = false;
          if (downloadButton) downloadButton.hidden = false;
          if (statusMessage) statusMessage.hidden = true;
        }
      } catch (err) {
        if (errorMessage) {
          errorMessage.hidden = false;
          errorMessage.textContent = (err && err.message) || "Wystąpił błąd";
        }
        if (statusMessage) statusMessage.hidden = true;
      } finally {
        setLoading(false);
      }
    });
  }

  const skip = document.querySelector(".skip-link");
  if (skip) {
    skip.addEventListener("click", function () {
      const target = document.querySelector(skip.getAttribute("href"));
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus();
        target.removeAttribute("tabindex");
      }
    });
  }

  // Register service worker for offline support (skip in automation/Playwright)
  if ("serviceWorker" in navigator && !navigator.webdriver) {
    navigator.serviceWorker.register("/sw.js").catch(function () {
      // SW registration failed silently (e.g. file protocol, no HTTPS)
    });
  }
});
