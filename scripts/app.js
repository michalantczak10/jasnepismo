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

  function extractTextFromFile(file) {
    var name = (file && file.name || "").toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || name.endsWith(".rtf")) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) { resolve(e.target.result || ""); };
        reader.onerror = function () { reject(new Error("Nie udało się odczytać pliku.")); };
        reader.readAsText(file, "utf-8");
      });
    }
    if (name.endsWith(".docx") || name.endsWith(".dotx") || name.endsWith(".odt")) {
      return extractFromOfficeFile(file);
    }
    if (name.endsWith(".pdf")) {
      return extractPdfSimple(file);
    }
    if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".bmp") || name.endsWith(".gif")) {
      return extractImageText(file);
    }
    if (name.endsWith(".doc")) {
      return extractDocSimple(file);
    }
    return Promise.resolve(null);
  }

  var _pdfjs = null;
  async function getPdfjs() {
    if (_pdfjs) return _pdfjs;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    _pdfjs = pdfjsLib;
    return _pdfjs;
  }

  function extractPdfSimple(file) {
    return new Promise(async function (resolve) {
      try {
        var pdfjs = await getPdfjs();
        var buf = await file.arrayBuffer();
        var doc = await pdfjs.getDocument({ data: buf }).promise;
        var parts = [];
        for (var i = 1; i <= doc.numPages; i++) {
          var page = await doc.getPage(i);
          var content = await page.getTextContent();
          var lines = [];
          var lastY = null;
          for (var j = 0; j < content.items.length; j++) {
            var item = content.items[j];
            if (lastY != null && Math.abs(item.transform[5] - lastY) > 5) {
              lines.push("\n");
            }
            lines.push(item.str);
            lastY = item.transform[5];
          }
          parts.push(lines.join("").replace(/\n+/g, "\n"));
        }
        var text = parts.join("\n\n").trim();
        resolve(text || null);
      } catch (e) {
        console.warn("Lokalna ekstrakcja PDF nie powiodła się:", e);
        resolve(null);
      }
    });
  }

  var _Tesseract = null;
  async function getTesseract() {
    if (_Tesseract) return _Tesseract;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js");
    _Tesseract = Tesseract;
    return _Tesseract;
  }

  function extractImageText(file) {
    return new Promise(async function (resolve) {
      try {
        var tess = await getTesseract();
        if (statusMessage) statusMessage.textContent = "Rozpoznawanie tekstu z obrazu (OCR)...";
        var result = await tess.recognize(file, "pol", {
          logger: function () {},
        });
        var text = (result && result.data && result.data.text) || "";
        resolve(text.trim() || null);
      } catch (e) {
        console.warn("Lokalne OCR nie powiodło się:", e);
        resolve(null);
      }
    });
  }

  function extractDocSimple(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var buf = e.target.result;
          var view = new DataView(buf);
          var parts = [];
          var current = "";
          for (var i = 0; i < view.byteLength; i++) {
            var b = view.getUint8(i);
            if (b >= 32 && b <= 126 || b >= 0x80 || b === 9 || b === 10 || b === 13) {
              current += String.fromCharCode(b);
            } else {
              if (current.length >= 4) {
                var t = current.trim();
                if (t.length >= 4) parts.push(t);
              }
              current = "";
            }
          }
          var text = parts.join("\n").replace(/\n{4,}/g, "\n\n").trim();
          resolve(text.length > 20 ? text : null);
        } catch (e2) {
          resolve(null);
        }
      };
      reader.onerror = function () { resolve(null); };
      reader.readAsArrayBuffer(file);
    });
  }

  function getTextFromXml(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "text/xml");
    var parts = [];
    function walk(n) {
      if (n.nodeType === 3) { var t = (n.textContent || "").trim(); if (t) parts.push(t); }
      for (var i = 0; i < n.childNodes.length; i++) walk(n.childNodes[i]);
    }
    walk(doc);
    return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Nie udało się załadować biblioteki.")); };
      document.head.appendChild(s);
    });
  }

  var _JSZip = null;
  async function getJSZip() {
    if (_JSZip) return _JSZip;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    _JSZip = window.JSZip;
    return _JSZip;
  }

  async function extractFromOfficeFile(file) {
    try {
      var JSZip = await getJSZip();
      var buf = await file.arrayBuffer();
      var zip = await JSZip.loadAsync(buf);
      var xmlFile = zip.file("word/document.xml") || zip.file("word/document2.xml") || zip.file("content.xml");
      if (!xmlFile) return null;
      var xmlText = await xmlFile.async("string");
      return getTextFromXml(xmlText);
    } catch (e) {
      console.warn("Lokalna ekstrakcja nie powiodła się:", e);
      return null;
    }
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

        // Extract text locally from all files
        extractInProgress = true;
        updateFreeButtonState();
        if (statusMessage) {
          statusMessage.hidden = false;
          statusMessage.textContent = "Wczytywanie pliku...";
        }

        try {
          var allText = "";
          var fallbackFiles = [];
          for (var fi2 = 0; fi2 < validFiles.length; fi2++) {
            var extracted = await extractTextFromFile(validFiles[fi2]);
            if (extracted != null) {
              if (allText) allText += "\n\n---\n\n";
              allText += extracted;
            } else {
              fallbackFiles.push(validFiles[fi2]);
            }
          }

          // Put locally extracted text into textarea
          if (allText) {
            if (allText.length > 5000) {
              allText = allText.slice(0, 5000);
              if (errorMessage) {
                errorMessage.textContent = "Tekst został przycięty do 5000 znaków (maksymalny limit).";
                errorMessage.hidden = false;
              }
            }
            if (textarea) textarea.value = allText;
            updateTextCount(allText);
          }

          // For files that couldn't be extracted locally, send to server
          if (fallbackFiles.length > 0) {
            if (statusMessage) statusMessage.textContent = "Wysyłanie plików do ekstrakcji na serwerze...";
            var formData = new FormData();
            for (var fi3 = 0; fi3 < fallbackFiles.length; fi3++) {
              formData.append("file", fallbackFiles[fi3], fallbackFiles[fi3].name);
            }
            var resp = await fetch("/api/explain", {
              method: "POST",
              headers: { "X-Extract-Only": "1" },
              body: formData,
            });
            if (resp.ok) {
              var json = await resp.json().catch(function () { return null; });
              var serverText = (json && (json.extractedText || json.text)) || "";
              if (serverText) {
                if (allText) serverText = "\n\n---\n\n" + serverText;
                var combined = allText + serverText;
                if (combined.length > 5000) {
                  combined = combined.slice(0, 5000);
                  if (errorMessage) {
                    errorMessage.textContent = "Tekst został przycięty do 5000 znaków (maksymalny limit).";
                    errorMessage.hidden = false;
                  }
                }
                if (textarea) textarea.value = combined;
                updateTextCount(combined);
                allText = combined;
              }
            }
          }

          if (!allText && errorMessage && !errorMessage.hidden) {
            // Keep existing error, don't overwrite
          } else if (!allText && errorMessage) {
            errorMessage.textContent = "Nie udało się odczytać tekstu z żadnego pliku.";
            errorMessage.hidden = false;
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
          if (!text.trim()) {
            throw new Error(
              "Proszę wkleić treść pisma do przetworzenia lub dołączyć plik z tekstem.",
            );
          }
          const response = await fetch("/api/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

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
