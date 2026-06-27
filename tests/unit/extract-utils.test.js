const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';

describe('extract-utils.js', () => {
  let extractUtils;

  before(() => {
    extractUtils = require('../../api/extract-utils');
  });

  describe('extractTextFromFile', () => {
    it('should return empty string for null input', async () => {
      const result = await extractUtils.extractTextFromFile(null);
      assert.strictEqual(result, '');
    });

    it('should return empty string for undefined input', async () => {
      const result = await extractUtils.extractTextFromFile(undefined);
      assert.strictEqual(result, '');
    });

    it('should extract text from TXT buffer', async () => {
      const file = {
        originalFilename: 'test.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('Sample text content for testing'),
      };

      const result = await extractUtils.extractTextFromFile(file);
      assert.strictEqual(result, 'Sample text content for testing');
    });

    it('should handle array of files (take first)', async () => {
      const file = [
        {
          originalFilename: 'first.txt',
          mimetype: 'text/plain',
          buffer: Buffer.from('First file content'),
        },
        {
          originalFilename: 'second.txt',
          mimetype: 'text/plain',
          buffer: Buffer.from('Second file content'),
        },
      ];

      const result = await extractUtils.extractTextFromFile(file);
      assert.strictEqual(result, 'First file content');
    });

    it('should return empty for unsupported format', async () => {
      const file = {
        originalFilename: 'test.exe',
        mimetype: 'application/octet-stream',
        buffer: Buffer.from('MZ\x90\x00'),
      };

      const result = await extractUtils.extractTextFromFile(file);
      assert.strictEqual(result, '');
    });

    it('should extract from TXT file with name field', async () => {
      const file = {
        name: 'document.txt',
        type: 'text/plain',
        buffer: Buffer.from('Name field test'),
      };

      const result = await extractUtils.extractTextFromFile(file);
      assert.strictEqual(result, 'Name field test');
    });

    it('should handle non-buffer data field', async () => {
      const file = {
        originalFilename: 'test.txt',
        mimetype: 'text/plain',
        data: 'string data',
      };

      const result = await extractUtils.extractTextFromFile(file);
      assert.strictEqual(result, 'string data');
    });

    it('should reject filepath outside tmpdir', async () => {
      const file = {
        originalFilename: 'test.txt',
        mimetype: 'text/plain',
        filepath: 'C:\\Windows\\system32\\config\\sample.txt',
      };

      const result = await extractUtils.extractTextFromFile(file);
      assert.strictEqual(result, '');
    });
  });
});
