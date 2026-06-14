const fs = require('fs');
const formidable = require('formidable');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

function makeForm(options) {
  // support multiple formidable API shapes across versions
  try {
    if (typeof formidable === 'function') return formidable(options);
    if (formidable && typeof formidable.formidable === 'function') return formidable.formidable(options);
    if (formidable && typeof formidable.IncomingForm === 'function') return new formidable.IncomingForm(options);
  } catch (e) {
    // fallthrough
  }
  throw new Error('formidable library not available or has unexpected API shape');
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    let form;
    try {
      form = makeForm({ multiples: false });
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
      if (!fs.existsSync(filepath)) {
        console.error('extractTextFromFile: filepath not found', filepath, 'file keys:', Object.keys(file));
        return '';
      }
      buffer = fs.readFileSync(filepath);
    } catch (e) {
      console.error('extractTextFromFile read error:', e);
      return '';
    }
  }

  if (!buffer) {
    console.error('extractTextFromFile: no buffer/path available', 'file keys:', Object.keys(file));
    return '';
  }

  // Detect by extension first, then by MIME type
  const lowerName = (name || '').toLowerCase();
  if (type.includes('pdf') || lowerName.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (e) {
      console.error('PDF parse error:', e);
      return '';
    }
  }

  if (lowerName.endsWith('.docx') || type.includes('word')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result && result.value ? result.value : '';
    } catch (e) {
      console.error('Mammoth parse error:', e);
      return '';
    }
  }

  if (type === 'text/plain' || lowerName.endsWith('.txt')) {
    try {
      return buffer.toString('utf8');
    } catch (e) {
      console.error('Text decode error:', e);
      return '';
    }
  }

  // Other types not supported here
  return '';
}

module.exports = { parseForm, extractTextFromFile };