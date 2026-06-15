#!/usr/bin/env node
// Test runner for api/extract-utils.js — run 3 (fix BMP/doc issues)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const AdmZip = require('adm-zip');
const { extractTextFromFile } = require('./extract-utils');

function svgBuffer(text = 'Przykład OCR - Jasne pismo') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="110" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#000">${text}</text>\n</svg>`;
  return Buffer.from(svg);
}

async function makeImageBuffers() {
  const svg = svgBuffer('PRZYKŁAD OCR PNG');
  const png = await sharp(svg).png().toBuffer();
  const jpeg = await sharp(svg).jpeg().toBuffer();
  // sharp in this environment doesn't support bmp output — reuse PNG for BMP test
  return { png, jpeg };
}

function escapeXml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
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

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const ab = await res.arrayBuffer();
  return { buffer: Buffer.from(ab), contentType: res.headers.get('content-type') || '' };
}

(async () => {
  console.log('Starting extract-utils tests (run 3)...');

  const tests = [
    {
      name: 'txt',
      prepare: async () => ({ buffer: Buffer.from('To jest testowy plik tekstowy\nDruga linia tekstu.'), originalFilename: 'sample.txt', mimetype: 'text/plain' })
    },
    {
      name: 'pdf',
      prepare: async () => {
        const d = await downloadToBuffer('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        return { buffer: d.buffer, originalFilename: 'sample.pdf', mimetype: d.contentType };
      }
    },
    {
      name: 'docx',
      prepare: async () => ({ buffer: makeDocxBuffer('Sample DOCX text for testing - Jasne pismo'), originalFilename: 'sample.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    },
    {
      name: 'doc',
      // mimic an RTF-based .doc file (heuristic extractor expects RTF header)
      prepare: async () => ({ buffer: Buffer.from('{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 Sample RTF content for testing\\par }'), originalFilename: 'sample.doc', mimetype: 'application/rtf' })
    },
    {
      name: 'odt',
      prepare: async () => ({ buffer: makeOdtBuffer('Sample ODT text for testing - Jasne pismo'), originalFilename: 'sample.odt', mimetype: 'application/vnd.oasis.opendocument.text' })
    }
  ];

  // add images
  try {
    const imgs = await makeImageBuffers();
    tests.push({ name: 'png', prepare: async () => ({ buffer: imgs.png, originalFilename: 'img.png', mimetype: 'image/png' }) });
    tests.push({ name: 'jpeg', prepare: async () => ({ buffer: imgs.jpeg, originalFilename: 'img.jpg', mimetype: 'image/jpeg' }) });
    // reuse PNG buffer for BMP test (sharp here doesn't support bmp output)
    tests.push({ name: 'bmp', prepare: async () => ({ buffer: imgs.png, originalFilename: 'img.bmp', mimetype: 'image/bmp' }) });
  } catch (e) {
    console.error('Image generation failed:', e && e.stack ? e.stack : e);
  }

  const results = [];
  for (const t of tests) {
    process.stdout.write(`Running test: ${t.name} ... `);
    try {
      const fileObj = await t.prepare();
      const inFile = { ...fileObj };
      const text = await extractTextFromFile(inFile);
      const sample = (text || '').trim().slice(0, 400);
      console.log(`ok (len=${(text||'').length})`);
      results.push({ name: t.name, length: (text||'').length, sample });
    } catch (e) {
      console.log('error');
      results.push({ name: t.name, error: e && e.message ? e.message : String(e) });
    }
  }

  console.log('\nTEST_RESULTS_START');
  console.log(JSON.stringify(results, null, 2));
  console.log('TEST_RESULTS_END');
})().catch((e) => { console.error('Fatal test runner error:', e && e.stack ? e.stack : e); process.exit(1); });
