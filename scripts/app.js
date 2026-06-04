// ...existing code... (moved from index.html inline script)
// Przeniesione i lekko dostosowane do uruchomienia jako zewnętrzny skrypt.
'use strict';

const textarea = document.getElementById('documentText');
const documentFile = document.getElementById('documentFile');
const textCount = document.getElementById('textCount');
const freeButton = document.getElementById('freeButton');
const clearButton = document.getElementById('clearButton');
const confirmModal = document.getElementById('confirmModal');
const confirmClearButton = document.getElementById('confirmClearButton');
const cancelClearButton = document.getElementById('cancelClearButton');
const downloadButton = document.getElementById('downloadButton');
const statusMessage = document.getElementById('statusMessage');
const fileDetails = document.getElementById('fileDetails');
const removeFileButton = document.getElementById('removeFileButton');
const errorMessage = document.getElementById('errorMessage');
const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');

const MAX_TEXT_LENGTH = 5000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SCRIPT_LOAD_TIMEOUT_MS = 15000;
const JSZIP_CDN_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js',
  'https://ga.jspm.io/npm:jszip@3.10.1/dist/jszip.min.js',
];
const MAMMOTH_CDN_SOURCES = [
  'https://unpkg.com/mammoth@1.4.17/mammoth.browser.min.js',
  'https://cdn.jsdelivr.net/npm/mammoth@1.4.17/mammoth.browser.min.js',
  'https://ga.jspm.io/npm:mammoth@1.4.17/mammoth.browser.min.js',
];
const PDFJS_CDN_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
];
let extractedText = '';
let isLoading = false;

function updateActionButtons() {
  const hasText = textarea.value.trim().length > 0;
  freeButton.disabled = isLoading || !hasText;
  clearButton.disabled = isLoading || !hasText;
}

function openConfirmModal() {
  confirmModal.hidden = false;
  confirmModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  confirmClearButton.focus();
}

function closeConfirmModal() {
  confirmModal.hidden = true;
  confirmModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  clearButton.focus();
}

function performClear() {
  textarea.value = '';
  textCount.textContent = `0 / ${MAX_TEXT_LENGTH} znaków`;
  clearFileSelection();
  extractedText = '';
  resultCard.hidden = true;
  downloadButton.hidden = true;
  errorMessage.hidden = true;
  setStatus('', false);
  textarea.focus({ preventScroll: true });
}

function setLoading(loading) {
  isLoading = loading;
  statusMessage.classList.toggle('is-loading', loading);
  statusMessage.setAttribute('aria-busy', loading ? 'true' : 'false');
  updateActionButtons();
}

function formatSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function updateProgressStatus(percent, loaded, total) {
  let message = 'Wczytuję dokument DOCX...';
  if (typeof percent === 'number' && !Number.isNaN(percent)) {
    message += ` ${Math.round(percent)}%`;
  }
  if (typeof loaded === 'number' && loaded >= 0) {
    message += ` (${formatSize(loaded)}`;
    if (typeof total === 'number' && total > 0) {
      message += ` z ${formatSize(total)}`;
    }
    message += ')';
  }
  setStatus(message);
}

function setStatus(message, isError = false, isSuccess = false) {
  if (!message) {
    statusMessage.hidden = true;
    statusMessage.textContent = '';
    statusMessage.classList.remove('error', 'is-success');
    return;
  }
  statusMessage.hidden = false;
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
  statusMessage.classList.toggle('is-success', isSuccess && !isError);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  resultCard.hidden = true;
  setStatus('', false);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

function showResult(text) {
  // Escape any HTML from the server/model before inserting into the DOM to prevent XSS
  const escaped = escapeHtml(text);
  resultText.innerHTML = escaped.replace(/\n/g, '<br>');
  resultCard.hidden = false;
  resultCard.classList.add('fade-in');
  errorMessage.hidden = true;
  downloadButton.hidden = false;
  setStatus('Wyjaśnienie gotowe. Możesz je pobrać lub wprowadzić kolejny dokument.', false, true);
}

function setFileDetails(message) {
  if (!message) {
    fileDetails.hidden = true;
    fileDetails.textContent = '';
    removeFileButton.disabled = true;
    return;
  }
  fileDetails.hidden = false;
  fileDetails.textContent = message;
  removeFileButton.disabled = false;
}

function clearFileSelection() {
  documentFile.value = '';
  setFileDetails('');
  if (extractedText && textarea.value.trim() === extractedText) {
    textarea.value = '';
    textCount.textContent = `0 / ${MAX_TEXT_LENGTH} znaków`;
    extractedText = '';
    setStatus('', false);
  }
  updateActionButtons();
}

function fillTextareaWithExtractedText(text) {
  textarea.value = text || '';
  extractedText = textarea.value.trim();
  textarea.dispatchEvent(new Event('input'));
  if (textarea.value) {
    textarea.focus({ preventScroll: true });
    textarea.select();
    setStatus(
      'Tekst z dokumentu został wczytany powyżej. Możesz go poprawić przed wysłaniem.',
      false
    );
  }
}

function normalizeExtractedText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\u0000')
    .join('')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getJSZipClass() {
  if (typeof JSZip !== 'undefined') return JSZip;
  if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
  if (typeof globalThis !== 'undefined' && globalThis.JSZip) return globalThis.JSZip;
  return null;
}

async function ensureJSZip() {
  let JSZipClass = getJSZipClass();
  if (JSZipClass) return JSZipClass;

  setStatus('Ładuję bibliotekę JSZip...', false);
  await loadExternalScript(JSZIP_CDN_SOURCES, () => getJSZipClass() !== null, 'JSZip');
  JSZipClass = getJSZipClass();
  if (!JSZipClass) {
    throw new Error('JSZip nie jest dostępny w tej przeglądarce.');
  }
  return JSZipClass;
}

async function extractTextFromTxt(file) {
  const text = await file.text();
  return normalizeExtractedText(text);
}

function parseRtf(rtf) {
  return rtf
    .replace(/\\par[d]? ?/g, '\n')
    .replace(/\\tab ?/g, '\t')
    .replace(/\\u(-?\d+)\??/g, (_, value) => {
      const code = Number(value);
      return String.fromCharCode(code < 0 ? 65536 + code : code);
    })
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractTextFromRtf(arrayBuffer) {
  const rtf = new TextDecoder('utf-8').decode(arrayBuffer);
  return normalizeExtractedText(parseRtf(rtf));
}

async function extractTextFromOdt(arrayBuffer) {
  const JSZipClass = await ensureJSZip();
  const zip = await JSZipClass.loadAsync(arrayBuffer);
  const contentXmlFile = zip.file('content.xml');
  if (!contentXmlFile) {
    throw new Error('Brak pliku content.xml w pliku ODT.');
  }
  const contentXml = await contentXmlFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(contentXml, 'application/xml');
  const paragraphs = Array.from(xmlDoc.getElementsByTagName('text:p'));
  const listItems = Array.from(xmlDoc.getElementsByTagName('text:list-item'));
  const textParts = paragraphs.map((node) => node.textContent || '');
  listItems.forEach((node) => {
    if (node.textContent) textParts.push(node.textContent);
  });
  return normalizeExtractedText(textParts.join('\n'));
}

function extractTextFromDoc(arrayBuffer) {
  const encodings = ['utf-16le', 'windows-1250', 'windows-1252'];
  let bestText = '';
  let bestScore = -1;

  for (const encoding of encodings) {
    try {
      const text = new TextDecoder(encoding).decode(arrayBuffer);
      const score = (text.match(/[\p{L}\p{N}]/gu) || []).length;
      if (score > bestScore) {
        bestScore = score;
        bestText = text;
      }
    } catch (error) {
      // ignore unsupported decoder
    }
  }

  if (bestScore <= 0) {
    const bytes = new Uint8Array(arrayBuffer);
    bestText = Array.from(bytes, (byte) => {
      if (byte === 9 || byte === 10 || byte === 13) return String.fromCharCode(byte);
      if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
      if (byte >= 160 && byte <= 255) return String.fromCharCode(byte);
      return ' ';
    }).join('');
  }

  return normalizeExtractedText(bestText);
}

async function loadExternalScript(urls, readyCheck, libraryName) {
  const sources = Array.isArray(urls) ? urls : [urls];

  for (const src of sources) {
    try {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        const cleanup = () => {
          if (script) {
            script.onload = null;
            script.onerror = null;
          }
        };
        let script = null;

        const resolveIfReady = () => {
          if (typeof readyCheck === 'function' && !readyCheck()) {
            return reject(new Error(`Skrypt załadował się, ale nie zainicjował poprawnie: ${src}`));
          }
          resolve();
        };

        if (existing) {
          if (existing.getAttribute('data-loaded') === 'true') {
            return resolveIfReady();
          }
          if (existing.getAttribute('data-failed') === 'true') {
            existing.remove();
          } else {
            const alreadyLoaded =
              existing.readyState === 'loaded' || existing.readyState === 'complete';
            if (alreadyLoaded) {
              existing.setAttribute('data-loaded', 'true');
              return resolveIfReady();
            }
          }
        }

        script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          if (typeof readyCheck === 'function') {
            setTimeout(resolveIfReady, 20);
          } else {
            resolve();
          }
        };
        script.onerror = () => {
          script.setAttribute('data-failed', 'true');
          cleanup();
          reject(new Error(`Nie udało się załadować skryptu ${src}`));
        };
        document.head.appendChild(script);

        setTimeout(() => {
          if (script.getAttribute('data-loaded') !== 'true') {
            script.setAttribute('data-failed', 'true');
            cleanup();
            reject(new Error(`Limit czasu przekroczony podczas ładowania skryptu ${src}`));
          }
        }, SCRIPT_LOAD_TIMEOUT_MS);
      });
      return;
    } catch (error) {
      console.warn('Nie udało się załadować skryptu:', src, error);
    }
  }

  const libraryLabel = libraryName
    ? `biblioteki ${libraryName}`
    : 'biblioteki z żadnego dostępnego źródła';
  throw new Error(
    `Nie udało się załadować ${libraryLabel}. Sprawdź połączenie internetowe lub spróbuj ponownie później.`
  );
}

async function extractTextFromDocx(arrayBuffer) {
  const isMammothReady = () => typeof mammoth !== 'undefined' && mammoth?.extractRawText;
  setStatus('Wczytuję dokument DOCX...');

  if (!isMammothReady()) {
    setStatus('Ładuję bibliotekę Mammoth...');
    try {
      await loadExternalScript(MAMMOTH_CDN_SOURCES, isMammothReady, 'Mammoth');
    } catch (error) {
      console.warn('Nie udało się załadować Mammoth:', error);
    }
  }

  if (isMammothReady()) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return normalizeExtractedText(result.value || '');
    } catch (error) {
      console.warn('Mammoth DOCX parse failed, falling back do JSZip parser:', error);
    }
  }

  const getJSZipClass = () => {
    if (typeof JSZip !== 'undefined') return JSZip;
    if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
    if (typeof globalThis !== 'undefined' && globalThis.JSZip) return globalThis.JSZip;
    return null;
  };

  let JSZipClass = getJSZipClass();
  if (!JSZipClass) {
    setStatus('Ładuję bibliotekę JSZip...');
    await loadExternalScript(JSZIP_CDN_SOURCES, () => getJSZipClass() !== null, 'JSZip');
    JSZipClass = getJSZipClass();
  }

  if (!JSZipClass) {
    throw new Error('JSZip nie jest dostępny w tej przeglądarce.');
  }

  try {
    setStatus('Wczytuję zawartość pliku DOCX...');
    const zip = await JSZipClass.loadAsync(arrayBuffer, {
      onProgress(metadata) {
        const percent =
          typeof metadata.percent === 'number'
            ? metadata.percent
            : typeof metadata.current === 'number' &&
                typeof metadata.total === 'number' &&
                metadata.total > 0
              ? (metadata.current / metadata.total) * 100
              : undefined;
        const loaded =
          typeof metadata.current === 'number'
            ? metadata.current
            : typeof metadata.loaded === 'number'
              ? metadata.loaded
              : undefined;
        const total = typeof metadata.total === 'number' ? metadata.total : undefined;
        if (typeof percent === 'number') {
          updateProgressStatus(percent, loaded, total);
        }
      },
    });
    setStatus('Parsuję dokument DOCX...');
    const documentXmlFile = zip.file('word/document.xml');
    if (!documentXmlFile) {
      throw new Error('Brak pliku word/document.xml w pliku DOCX.');
    }
    const documentXml = await documentXmlFile.async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
    const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));
    const text = paragraphs
      .map((paragraph) => {
        const nodes = Array.from(paragraph.getElementsByTagName('w:t'));
        return nodes.map((node) => node.textContent || '').join('');
      })
      .join('\n');
    return normalizeExtractedText(text);
  } catch (error) {
    throw new Error(error?.message || 'Nie udało się odczytać pliku DOCX.');
  }
}

function normalizePdfLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}

async function extractTextFromPdf(arrayBuffer) {
  if (typeof pdfjsLib === 'undefined') {
    setStatus('Ładuję bibliotekę PDF.js...', false);
    try {
      await loadExternalScript(PDFJS_CDN_SOURCES, () => typeof pdfjsLib !== 'undefined', 'PDF.js');
    } catch (error) {
      console.warn('Nie udało się załadować PDF.js:', error);
    }
  }

  if (typeof pdfjsLib === 'undefined') {
    throw new Error('Biblioteka PDF.js nie jest dostępna. Odśwież stronę i spróbuj ponownie.');
  }

  const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  setStatus('Parsuję plik PDF...', false);

  const parsePdf = async (options) => {
    const loadingTask = pdfjsLib.getDocument(options);
    const pdf = await loadingTask.promise;
    let extractedText = '';

    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const content = await page.getTextContent();
      setStatus(`Parsuję PDF… ${pageIndex} / ${pdf.numPages}`, false);

      const lines = [];
      content.items.forEach((item) => {
        const str = item.str || '';
        const transform = item.transform || [1, 0, 0, 1, 0, 0];
        const x = transform[4] || 0;
        const y = transform[5] || 0;
        const key = Math.round(y / 2) * 2;

        const line = lines.find((row) => Math.abs(row.y - key) < 3);
        if (line) {
          line.items.push({ x, str });
        } else {
          lines.push({ y: key, items: [{ x, str }] });
        }
      });

      lines.sort((a, b) => b.y - a.y);
      const pageText = lines
        .map((line) =>
          line.items
            .sort((a, b) => a.x - b.x)
            .map((item) => item.str)
            .join(' ')
        )
        .map(normalizePdfLine)
        .filter(Boolean)
        .join('\n');

      extractedText += `${pageText}\n\n`;
    }

    return normalizeExtractedText(extractedText);
  };

  try {
    return await parsePdf({ data: arrayBuffer });
  } catch (error) {
    console.warn('PDF extraction with worker failed, retrying without worker:', error);
    try {
      const result = await parsePdf({ data: arrayBuffer, disableWorker: true });
      return result;
    } catch (fallbackError) {
      console.error('PDF extraction failed:', fallbackError);
      const message = fallbackError?.message || 'Nie udało się odczytać pliku PDF.';
      throw new Error(message);
    }
  }
}

async function sendRequest(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.message || data.error?.type || 'Nie udało się przetworzyć żądania.';
    throw new Error(message);
  }

  return data;
}

async function handleAction() {
  const finalText = textarea.value.trim();

  if (!finalText) {
    showError('Proszę wkleić treść pisma lub przesłać skan dokumentu.');
    return;
  }

  if (finalText.length > MAX_TEXT_LENGTH) {
    showError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków.`);
    return;
  }

  setLoading(true);
  setStatus('Wysyłam treść do wyjaśnienia...', false);
  errorMessage.hidden = true;

  try {
    const data = await sendRequest('/api/explain', { text: finalText });
    showResult(data.explanation || 'Brak wyjaśnienia od serwera.');
  } catch (error) {
    showError(error.message || 'Wystąpił błąd. Spróbuj ponownie.');
  } finally {
    setLoading(false);
  }
}

textarea.addEventListener('input', () => {
  const length = textarea.value.length;
  textCount.textContent = `${length} / ${MAX_TEXT_LENGTH} znaków`;
  if (length > MAX_TEXT_LENGTH) {
    textCount.style.color = '#9b1d1d';
  } else {
    textCount.style.color = 'rgba(17, 17, 17, 0.78)';
  }
  updateActionButtons();
});

documentFile.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  extractedText = '';
  fillTextareaWithExtractedText('');
  clearFileSelection();
  if (!file) {
    return;
  }

  const fileName = file.name.toLowerCase();
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
  const isDocx = fileName.endsWith('.docx');
  const isDotx = fileName.endsWith('.dotx');
  const isDoc = fileName.endsWith('.doc');
  const isOdt = fileName.endsWith('.odt');
  const isRtf =
    file.type === 'application/rtf' || file.type === 'text/rtf' || fileName.endsWith('.rtf');
  const isTxt = file.type === 'text/plain' || fileName.endsWith('.txt');

  if (!isImage && !isPdf && !isDocx && !isDotx && !isDoc && !isOdt && !isRtf && !isTxt) {
    showError('Możesz przesłać tylko obraz, plik PDF, DOC / DOTX / DOCX, ODT, RTF lub TXT.');
    documentFile.value = '';
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showError('Plik musi mieć maksymalnie 5 MB.');
    documentFile.value = '';
    setFileDetails('');
    return;
  }

  setFileDetails(
    `Wybrano: ${file.name} • Rozmiar: ${formatSize(file.size)} • Typ: ${file.type || 'nieznany'}`
  );
  setLoading(true);
  errorMessage.hidden = true;

  if (isImage) {
    setStatus('Rozpoznawanie obrazu...', false);
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(file, 'pol');
      extractedText = text ? text.trim() : '';
      if (!extractedText) {
        showError('Nie udało się rozpoznać tekstu ze skanu.');
      } else {
        setStatus('OCR zakończony. Możesz wysłać rozpoznany tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      showError('Błąd OCR. Spróbuj inny skan lub wklej tekst ręcznie.');
    } finally {
      setLoading(false);
    }
  } else if (isPdf) {
    setStatus('Wczytywanie pliku PDF...', false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      extractedText = await extractTextFromPdf(arrayBuffer);
      if (!extractedText) {
        showError('Nie udało się odczytać tekstu z pliku PDF. Spróbuj inny plik.');
      } else {
        setStatus('Plik PDF wczytany. Możesz wysłać tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      console.error('PDF extraction error:', error);
      const isEncrypted = /password|secured|encrypted/i.test(error.message || '');
      showError(
        isEncrypted
          ? 'Plik PDF jest zabezpieczony lub wymaga hasła. Spróbuj inny plik.'
          : error.message || 'Błąd podczas odczytu pliku PDF. Spróbuj inny plik.'
      );
    } finally {
      setLoading(false);
    }
  } else if (isDocx || isDotx) {
    setStatus('Wczytywanie pliku DOCX / DOTX...', false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      extractedText = await extractTextFromDocx(arrayBuffer);
      if (!extractedText) {
        showError('Nie udało się odczytać tekstu z pliku DOCX / DOTX.');
      } else {
        setStatus('Plik DOCX / DOTX wczytany. Możesz wysłać tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      console.error('DOCX extraction error:', error);
      showError(error?.message || 'Błąd podczas odczytu pliku DOCX / DOTX. Spróbuj inny plik.');
    } finally {
      setLoading(false);
    }
  } else if (isOdt) {
    setStatus('Wczytywanie pliku ODT...', false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      extractedText = await extractTextFromOdt(arrayBuffer);
      if (!extractedText) {
        showError('Nie udało się odczytać tekstu z pliku ODT.');
      } else {
        setStatus('Plik ODT wczytany. Możesz wysłać tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      console.error('ODT extraction error:', error);
      showError(error?.message || 'Błąd podczas odczytu pliku ODT. Spróbuj inny plik.');
    } finally {
      setLoading(false);
    }
  } else if (isRtf) {
    setStatus('Wczytywanie pliku RTF...', false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      extractedText = extractTextFromRtf(arrayBuffer);
      if (!extractedText) {
        showError('Nie udało się odczytać tekstu z pliku RTF.');
      } else {
        setStatus('Plik RTF wczytany. Możesz wysłać tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      console.error('RTF extraction error:', error);
      showError(error?.message || 'Błąd podczas odczytu pliku RTF. Spróbuj inny plik.');
    } finally {
      setLoading(false);
    }
  } else if (isTxt) {
    setStatus('Wczytywanie pliku TXT...', false);
    try {
      extractedText = await extractTextFromTxt(file);
      if (!extractedText) {
        showError('Nie udało się odczytać tekstu z pliku TXT.');
      } else {
        setStatus('Plik TXT wczytany. Możesz wysłać tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      console.error('TXT extraction error:', error);
      showError(error?.message || 'Błąd podczas odczytu pliku TXT. Spróbuj inny plik.');
    } finally {
      setLoading(false);
    }
  } else {
    setStatus('Wczytywanie pliku DOC...', false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      extractedText = extractTextFromDoc(arrayBuffer);
      if (!extractedText) {
        showError('Nie udało się odczytać tekstu z pliku DOC.');
      } else {
        setStatus('Plik DOC wczytany. Możesz wysłać tekst do wyjaśnienia.', false);
      }
      fillTextareaWithExtractedText(extractedText);
    } catch (error) {
      showError('Błąd podczas odczytu pliku DOC. Spróbuj inny plik.');
    } finally {
      setLoading(false);
    }
  }
});

clearButton.addEventListener('click', (event) => {
  event.preventDefault();
  openConfirmModal();
});

confirmClearButton.addEventListener('click', () => {
  performClear();
  closeConfirmModal();
});

cancelClearButton.addEventListener('click', () => {
  closeConfirmModal();
});

document.addEventListener('keydown', (event) => {
  if (!confirmModal.hidden && event.key === 'Escape') {
    closeConfirmModal();
  }
});

downloadButton.addEventListener('click', () => {
  const content = resultText.innerText || resultText.textContent || 'Brak zawartości.';
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jasnepismo-wyjasnienie.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

removeFileButton.addEventListener('click', (event) => {
  event.preventDefault();
  clearFileSelection();
  removeFileButton.blur();
});
freeButton.addEventListener('click', handleAction);
updateActionButtons();

// Adjust footer button width so all footer buttons match the contact email button width
(function adjustFooterButtonWidth() {
  function updateFooterButtonWidth() {
    try {
      const email = document.querySelector('.footer-email-link');
      if (!email) return;

      // Temporarily unset inline width to measure natural content width
      const prevInlineWidth = email.style.width || '';
      email.style.width = 'auto';

      // Measure the element's rendered width
      const rect = email.getBoundingClientRect();
      let measured = Math.ceil(rect.width || 0);

      // Small buffer for borders/padding
      measured += 4;

      // Constrain measured width to sensible bounds
      const maxAllowed = Math.min(window.innerWidth - 40, 920);
      const minAllowed = 220; // keep buttons usable on narrow screens
      const finalWidth = Math.max(minAllowed, Math.min(measured, maxAllowed));

      // Apply as CSS variable so other buttons using --button-width match this width
      document.documentElement.style.setProperty('--button-width', finalWidth + 'px');

      // Restore previous inline width (let CSS variable control widths)
      email.style.width = prevInlineWidth;
    } catch (err) {
      // ignore measurement errors
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFooterButtonWidth);
  } else {
    updateFooterButtonWidth();
  }
  window.addEventListener('load', updateFooterButtonWidth);
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateFooterButtonWidth, 150);
  });
})();
