const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { extractTextFromFile } = require('../../api/extract-utils');

describe('extract-utils filepath validation', () => {
  it('rejects filepath outside tmpdir', async () => {
    const fake = {
      filepath: '/etc/passwd',
      originalFilename: 'passwd',
      mimetype: 'text/plain',
    };
    const txt = await extractTextFromFile(fake);
    assert.equal(txt, '');
  });
});
