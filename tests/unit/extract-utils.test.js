const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const AdmZip = require('adm-zip');
const { extractTextFromFile } = require('../../api/extract-utils');

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function makeDocxBuffer(text) {
  const zip = new AdmZip();
  const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>\n    <w:sectPr/>\n  </w:body>\n</w:document>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`;
  zip.addFile('[Content_Types].xml', Buffer.from(contentTypes));
  zip.addFile('_rels/.rels', Buffer.from(rels));
  zip.addFile('word/document.xml', Buffer.from(content));
  return zip.toBuffer();
}

function makeOdtBuffer(text) {
  const zip = new AdmZip();
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">\n  <office:body>\n    <office:text>\n      <text:p>${escapeXml(text)}</text:p>\n    </office:text>\n  </office:body>\n</office:document-content>`;
  zip.addFile('content.xml', Buffer.from(content));
  return zip.toBuffer();
}

describe('extract-utils', () => {
  it('extracts text from TXT', async () => {
    const file = {
      buffer: Buffer.from('To jest testowy plik tekstowy\nDruga linia.'),
      originalFilename: 'sample.txt',
      mimetype: 'text/plain',
    };
    const text = await extractTextFromFile(file);
    assert.ok(typeof text === 'string' && text.length > 0);
  });

  it('extracts text from DOCX', async () => {
    const sample = 'Sample DOCX text for testing - Jasne pismo';
    const buf = makeDocxBuffer(sample);
    const file = {
      buffer: buf,
      originalFilename: 'sample.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const text = await extractTextFromFile(file);
    assert.ok(text && text.includes('Sample DOCX'));
  });

  it('extracts text from ODT', async () => {
    const sample = 'Sample ODT text for testing - Jasne pismo';
    const buf = makeOdtBuffer(sample);
    const file = {
      buffer: buf,
      originalFilename: 'sample.odt',
      mimetype: 'application/vnd.oasis.opendocument.text',
    };
    const text = await extractTextFromFile(file);
    assert.ok(text && text.includes('Sample ODT'));
  });

  it('extracts text from DOC (RTF heuristic)', async () => {
    const rtf =
      '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 RTF sample content for testing\\par }';
    const file = {
      buffer: Buffer.from(rtf),
      originalFilename: 'sample.doc',
      mimetype: 'application/rtf',
    };
    const text = await extractTextFromFile(file);
    assert.ok(typeof text === 'string');
  });
});
