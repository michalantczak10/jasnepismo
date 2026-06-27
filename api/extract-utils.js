const fs = require('fs');
const path = require('path');
const os = require('os');
const formidable = require('formidable');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const metrics = require('./metrics');

function makeForm(options) {
  // support multiple formidable API shapes across versions
  try {
    if (typeof formidable === 'function') return formidable(options);
    if (formidable && typeof formidable.formidable === 'function')
      return formidable.formidable(options);
    if (formidable && typeof formidable.IncomingForm === 'function')
      return new formidable.IncomingForm(options);
  } catch (e) {
    // fallthrough
  }
  throw new Error('formidable library not available or has unexpected API shape');
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    let form;
    try {
      form = makeForm({
        multiples: false,
        maxFiles: 1,
        maxFileSize: 5 * 1024 * 1024,
        allowEmptyFiles: false,
      });
    } catch (e) {
      return reject(e);
    }
    // Some form implementations (IncomingForm) may not support .parse returning files in same shape
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// Simple semaphore to limit concurrent OCR work in this process.
const OCR_CONCURRENCY = Number(process.env.OCR_CONCURRENCY || 1);
let _ocrActive = 0;
async function withOcrLimit(fn) {
  while (_ocrActive >= OCR_CONCURRENCY) {
    // back off briefly
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 100));
  }
  _ocrActive++;
  try {
    metrics.set && metrics.inc && metrics.inc('ocr.concurrent');
    return await fn();
  } finally {
    _ocrActive--;
    metrics.set && metrics.dec && metrics.dec('ocr.concurrent');
  }
}

async function extractTextFromFile(rawFile) {
  if (!rawFile) return '';

  // Handle array-of-files (some parsers return arrays)
  const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

  // Resolve common path/buffer fields across different multipart parsers
  const pathCandidates = ['filepath', 'path', 'filePath', 'tempFilePath', 'tempFile'];
  const name = file.originalFilename || file.name || file.filename || file.fileName || '';
  const type = (file.mimetype || file.type || '').toLowerCase();

  let buffer = null;
  let filepath = null;

  for (const k of pathCandidates) {
    if (file[k]) {
      filepath = file[k];
      break;
    }
  }

  // Some libs (busboy/multiparty) provide file.buffer or file.data
  if (!filepath && (file.buffer || file.data)) {
    buffer = file.buffer || file.data;
    if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  }

  // If we have a filepath, ensure it exists and read
  if (filepath) {
    try {
      // Validate that filepath is within the OS tmpdir to avoid path traversal
      const resolved = path.resolve(filepath);
      const tmpdir = path.resolve(os.tmpdir());
      if (!resolved.startsWith(tmpdir)) {
        console.error('extractTextFromFile: rejecting filepath outside tmpdir');
        return '';
      }
      if (!fs.existsSync(resolved)) {
        console.error('extractTextFromFile: filepath not found (safe log)');
        return '';
      }
      buffer = fs.readFileSync(resolved);
    } catch (e) {
      console.error('extractTextFromFile read error (safe):', e && e.message ? e.message : e);
      return '';
    }
  }

  if (!buffer) {
    console.error('extractTextFromFile: no buffer/path available', 'file keys:', Object.keys(file));
    return '';
  }

  // Detect by extension first, then by MIME type
  const lowerName = (name || '').toLowerCase();

  // PDF
  if (type.includes('pdf') || lowerName.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (e) {
      console.error('PDF parse error:', e);
      // Fallback: try to extract readable ASCII/UTF-8 fragments from the buffer
      try {
        const s = buffer.toString('utf8');
        const words = s.match(/[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż]{4,}/g) || [];
        const text = words.slice(0, 200).join(' ');
        if (text && text.length > 10) return text;
      } catch (e2) {
        // ignore
      }
      return '';
    }
  }

  // DOCX (exclude .doc which uses heuristic RTF below)
  if (lowerName.endsWith('.docx') || (type.includes('word') && !lowerName.endsWith('.doc'))) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result && result.value ? result.value : '';
    } catch (e) {
      console.error('Mammoth parse error:', e);
      return '';
    }
  }

  // TXT
  if (type === 'text/plain' || lowerName.endsWith('.txt')) {
    try {
      return buffer.toString('utf8');
    } catch (e) {
      console.error('Text decode error:', e);
      return '';
    }
  }

  // ODT
  if (lowerName.endsWith('.odt') || type.includes('opendocument')) {
    try {
      const AdmZip = require('adm-zip');
      const xml2js = require('xml2js');
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      let contentEntry = entries.find((e) => e.entryName && e.entryName.endsWith('content.xml'));
      if (!contentEntry) contentEntry = zip.getEntry('content.xml');
      if (contentEntry) {
        const contentXml = contentEntry.getData().toString('utf8');
        try {
          const parsed = await xml2js.parseStringPromise(contentXml, {
            explicitArray: false,
            ignoreAttrs: true,
          });
          const extract = (node) => {
            if (!node) return '';
            if (typeof node === 'string') return node;
            if (Array.isArray(node)) return node.map(extract).join(' ');
            let out = '';
            for (const k of Object.keys(node)) {
              out += extract(node[k]) + ' ';
            }
            return out;
          };
          const text = extract(parsed).replace(/\s+/g, ' ').trim();
          return text;
        } catch (e) {
          // fallback: strip tags
          return contentXml
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
    } catch (e) {
      console.error('ODT parse error:', e);
      return '';
    }
  }

  // Images (OCR)
  if (
    type.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.bmp', '.gif'].some((ext) => lowerName.endsWith(ext))
  ) {
    try {
      return await withOcrLimit(async () => {
        metrics.inc && metrics.inc('ocr.jobs.started');
        let imgBuffer = buffer;
        try {
          const sharpLib = require('sharp');
          imgBuffer = await sharpLib(buffer).png().toBuffer();
        } catch (e) {
          // sharp not available or conversion failed; continue with original buffer
        }

        const { createWorker } = require('tesseract.js');
        let worker = null;
        const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS || 20000);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);
        try {
          worker = await createWorker();
          try {
            await worker.reinitialize('pol');
          } catch (e) {
            try {
              await worker.reinitialize('eng');
            } catch (e2) {
              // languages not available
            }
          }
          // pass signal to recognize if supported (tesseract.js doesn't accept AbortSignal directly)
          const { data } = await worker.recognize(imgBuffer);
          await worker.terminate();
          clearTimeout(timeout);
          metrics.inc && metrics.inc('ocr.jobs.succeeded');
          return data && data.text ? data.text : '';
        } catch (e) {
          clearTimeout(timeout);
          if (worker) {
            try {
              await worker.terminate();
            } catch (terminateErr) {
              console.warn(
                'Worker terminate error:',
                terminateErr && terminateErr.message ? terminateErr.message : terminateErr
              );
            }
          }
          metrics.inc && metrics.inc('ocr.jobs.failed');
          console.error('Image OCR error (safe):', e && e.message ? e.message : e);
          return '';
        }
      });
    } catch (e) {
      console.error('Image OCR outer error:', e && e.message ? e.message : e);
      return '';
    }
  }

  // Heuristic for .doc and .rtf (RTF) — best-effort
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.rtf')) {
    try {
      const head = buffer.slice(0, 2000).toString('utf8');
      if (head.includes('{\\rtf')) {
        // naive RTF -> text conversion
        let s = buffer.toString('utf8');
        s = s.replace(/\\par[d]?/g, '\n');
        s = s.replace(/\\'[0-9a-fA-F]{2}/g, '');
        s = s.replace(/\\[a-zA-Z]+\d*/g, '');
        s = s.replace(/[{}\r]/g, '');
        s = s.replace(/\n\s+/g, '\n').replace(/\s+/g, ' ').trim();
        return s;
      }
    } catch (e) {
      console.error('DOC heuristic error:', e);
    }
    // unsupported
    return '';
  }

  // Other types not supported here
  return '';
}

module.exports = { parseForm, extractTextFromFile };
