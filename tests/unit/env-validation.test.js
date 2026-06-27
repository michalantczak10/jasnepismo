const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

describe('env-validation.js', () => {
  let validateEnvironment;

  before(() => {
    process.env.NODE_ENV = 'test';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    validateEnvironment = require('../../api/env-validation').validateEnvironment;
  });

  it('should return valid when required vars are present', () => {
    const result = validateEnvironment();
    assert.ok(result.valid);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should set defaults for optional vars', () => {
    delete process.env.OPENAI_MODEL;
    delete process.env.OCR_CONCURRENCY;
    const result = validateEnvironment();
    assert.strictEqual(process.env.OPENAI_MODEL, 'gpt-4o-mini');
    assert.strictEqual(process.env.OCR_CONCURRENCY, '1');
  });

  it('should not override existing optional vars', () => {
    process.env.OPENAI_MODEL = 'gpt-4';
    const result = validateEnvironment();
    assert.strictEqual(process.env.OPENAI_MODEL, 'gpt-4');
  });

  it('should not require API key in test mode', () => {
    delete process.env.OPENAI_API_KEY;
    const result = validateEnvironment();
    assert.ok(result.valid);
    process.env.OPENAI_API_KEY = 'sk-test-key'; // restore
  });
});
