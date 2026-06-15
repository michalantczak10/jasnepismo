#!/usr/bin/env node
// Simple test runner for api/extract-utils.js
// Downloads sample files and generates images, then runs extractTextFromFile on each.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { extractTextFromFile } = require('./extract-utils');

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const ab = await res.arrayBuffer();
  return { buffer: Buffer.from(ab), contentType: res.headers.get('content-type') || '' };
}

function svgBuffer(text = 'Przykład OCR - Jasne pismo') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="110" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#000">${text}</text>\n</svg>`;
  return Buffer.from(svg);
}

async function makeImageBuffers() {
  const svg = svgBuffer('PRZYKŁAD OCR PNG');
  const png = await sharp(svg).png().toBuffer();
  const jpeg = await sharp(svg).jpeg().toBuffer();
  const bmp = await sharp(svg).bmp().toBuffer();
  return { png, jpeg, bmp };
}

const tests = [
  {
    name: 'txt',
    prepare: async () => ({ buffer: Buffer.from('To jest testowy plik tekstowy\nDruga linia tekstu.'), originalFilename: 'sample.txt', mimetype: 'text/plain' })
  },
  {
    name: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filename: 'sample.pdf'
  },
  {
    name: 'docx',
    url: 'https://file-examples.com/wp-content/uploads/2017/02/file-sample_100kB.docx',
    filename: 'sample.docx'
  },
  {
    name: 'doc',
    url: 'https://file-examples.com/wp-content/uploads/2017/02/file-sample_100kB.doc',
    filename: 'sample.doc'
  },
  {
    name: 'odt',
    url: 'https://file-examples.com/wp-content/uploads/2017/11/file_example_ODT_1MB.odt',
    filename: 'sample.odt'
  }
];

(async () => {
  console.log('Starting extract-utils tests...');

  try {
    const imgs = await makeImageBuffers();
    tests.push({ name: 'png', prepare: async () => ({ buffer: imgs.png, originalFilename: 'img.png', mimetype: 'image/png' }) });
    tests.push({ name: 'jpeg', prepare: async () => ({ buffer: imgs.jpeg, originalFilename: 'img.jpg', mimetype: 'image/jpeg' }) });
    tests.push({ name: 'bmp', prepare: async () => ({ buffer: imgs.bmp, originalFilename: 'img.bmp', mimetype: 'image/bmp' }) });
  } catch (e) {
    console.error('Image generation failed:', e && e.stack ? e.stack : e);
  }

  const results = [];
  for (const t of tests) {
    process.stdout.write(`Running test: ${t.name} ... `);
    try {
      let fileObj;
      if (t.prepare) {
        fileObj = await t.prepare();
      } else if (t.url) {
        try {
          const downloaded = await downloadToBuffer(t.url);
          fileObj = { buffer: downloaded.buffer, originalFilename: t.filename || t.name, mimetype: downloaded.contentType };
        } catch (e) {
          console.error(`download failed for ${t.name}:`, e && e.message ? e.message : e);
          results.push({ name: t.name, error: 'download_failed' });
          continue;
        }
      }

      const text = await extractTextFromFile(fileObj);
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
} )().catch((e) => { console.error('Fatal test runner error:', e && e.stack ? e.stack : e); process.exit(1); });
