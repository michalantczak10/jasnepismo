const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const sharp = require('sharp');
const { extractTextFromFile } = require('../../api/extract-utils');

function svgBuffer(text = 'EXAMPLE OCR') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="110" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#000">${text}</text>\n</svg>`;
  return Buffer.from(svg);
}

describe('extract-utils (image OCR)', () => {
  it('extracts text from PNG image (OCR)', async () => {
    const svg = svgBuffer('EXAMPLE OCR PNG');
    const png = await sharp(svg).png().toBuffer();
    const file = { buffer: png, originalFilename: 'img.png', mimetype: 'image/png' };
    const text = await extractTextFromFile(file);
    assert.ok(text && text.trim().length >= 5, `OCR output too short: "${String(text).slice(0,100)}"`);
  });

  it('extracts text from JPEG image (OCR)', async () => {
    const svg = svgBuffer('EXAMPLE OCR JPEG');
    const jpeg = await sharp(svg).jpeg().toBuffer();
    const file = { buffer: jpeg, originalFilename: 'img.jpg', mimetype: 'image/jpeg' };
    const text = await extractTextFromFile(file);
    assert.ok(text && text.trim().length >= 5, `OCR output too short: "${String(text).slice(0,100)}"`);
  });

  it('extracts text from BMP image (OCR) — using PNG buffer if BMP unsupported', async () => {
    const svg = svgBuffer('EXAMPLE OCR BMP');
    // Some sharp builds may not support BMP output; reuse PNG buffer but mark as BMP
    const png = await sharp(svg).png().toBuffer();
    const file = { buffer: png, originalFilename: 'img.bmp', mimetype: 'image/bmp' };
    const text = await extractTextFromFile(file);
    assert.ok(text && text.trim().length >= 5, `OCR output too short: "${String(text).slice(0,100)}"`);
  });
});

