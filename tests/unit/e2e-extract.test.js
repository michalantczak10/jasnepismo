const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const openai = require('../../api/openai.js');
// note: explain (handler) is required dynamically inside each test iteration so that
// it picks up the current stubbed parseForm from ./extract-utils

const extractUtils = require('../../api/extract-utils.js');
const sharp = require('sharp');
const AdmZip = require('adm-zip');

function createResponse() {
  let statusCode;
  const headers = {};
  let body;
  return {
    setHeader(key, value) { headers[key] = value; },
    status(code) { statusCode = code; return this; },
    json(data) { body = data; return this; },
    getStatus() { return statusCode; },
    getHeaders() { return headers; },
    getBody() { return body; },
  };
}

function makeDocxBuffer(text) {
  const zip = new AdmZip();
  const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>${text}</w:t></w:r></w:p>\n    <w:sectPr/>\n  </w:body>\n</w:document>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`;
  zip.addFile('[Content_Types].xml', Buffer.from(contentTypes));
  zip.addFile('_rels/.rels', Buffer.from(rels));
  zip.addFile('word/document.xml', Buffer.from(content));
  return zip.toBuffer();
}

function makeOdtBuffer(text) {
  const zip = new AdmZip();
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">\n  <office:body>\n    <office:text>\n      <text:p>${text}</text:p>\n    </office:text>\n  </office:body>\n</office:document-content>`;
  zip.addFile('content.xml', Buffer.from(content));
  return zip.toBuffer();
}

function makeRtfBuffer(text) {
  return Buffer.from(`{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 ${text}\\par }`);
}

function svgBuffer(text = 'PRZYKŁAD OCR PNG') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="110" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#000">${text}</text>\n</svg>`;
  return Buffer.from(svg);
}

async function makeImageBuffers() {
  const svg = svgBuffer('PRZYKŁAD OCR PNG');
  const png = await sharp(svg).png().toBuffer();
  const jpeg = await sharp(svg).jpeg().toBuffer();
  return { png, jpeg };
}

async function downloadPdf() {
  const res = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  if (!res.ok) throw new Error('Failed to download sample PDF');
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

describe('e2e: /api/explain file extraction and full flow', () => {
  const origParseForm = extractUtils.parseForm;
  const origGenerate = openai.generateExplanation;

  afterEach(() => {
    extractUtils.parseForm = origParseForm;
    openai.generateExplanation = origGenerate;
  });

  it('processes supported file types end-to-end', async () => {
    const imgs = await makeImageBuffers();
    const pdfBuf = await downloadPdf();

    const fixtures = [
      { name: 'txt', buffer: Buffer.from('To jest testowy plik tekstowy\nDruga linia.'), filename: 'sample.txt', mimetype: 'text/plain', expect: 'testowy' },
      { name: 'pdf', buffer: pdfBuf, filename: 'sample.pdf', mimetype: 'application/pdf', expect: 'Dummy PDF' },
      { name: 'docx', buffer: makeDocxBuffer('Sample DOCX text for testing - Jasne pismo'), filename: 'sample.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expect: 'Sample DOCX' },
      { name: 'doc', buffer: makeRtfBuffer('Sample RTF content for testing'), filename: 'sample.doc', mimetype: 'application/rtf', expect: 'Sample RTF' },
      { name: 'odt', buffer: makeOdtBuffer('Sample ODT text for testing - Jasne pismo'), filename: 'sample.odt', mimetype: 'application/vnd.oasis.opendocument.text', expect: 'Sample ODT' },
      { name: 'png', buffer: imgs.png, filename: 'img.png', mimetype: 'image/png', expect: 'PRZYKŁAD' },
      { name: 'jpeg', buffer: imgs.jpeg, filename: 'img.jpg', mimetype: 'image/jpeg', expect: 'PRZYKŁAD' },
      { name: 'bmp', buffer: imgs.png, filename: 'img.bmp', mimetype: 'image/bmp', expect: 'PRZYKŁAD' },
    ];

    for (const f of fixtures) {
      // stub form parsing to supply our buffer
      extractUtils.parseForm = async () => ({ fields: {}, files: { documentFile: { buffer: f.buffer, originalFilename: f.filename, mimetype: f.mimetype } } });

      let captured = null;
      openai.generateExplanation = async (text) => { captured = text; return { explanation: `expl:${f.name}`, usage: {} }; };

      // require handler after stubbing parseForm so it picks up the stub
      delete require.cache[require.resolve('../../api/explain.js')];
      const explain = require('../../api/explain.js');

      const req = { method: 'POST', headers: { 'content-type': 'multipart/form-data' } };
      const res = createResponse();

      await explain(req, res);

      assert.equal(res.getStatus(), 200, `status !== 200 for ${f.name}`);
      const body = res.getBody();
      assert.equal(body.explanation, `expl:${f.name}`);
      assert.ok(captured && captured.length > 0, `no extracted text for ${f.name}`);
      assert.ok(captured.includes(f.expect), `extracted text for ${f.name} doesn't contain expected substring. Got: ${captured.slice(0,100)}`);
    }
  });
});

