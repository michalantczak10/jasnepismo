const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const fs = require('fs');
const path = require('path');
const openai = require('../api/openai.js');

const MON_DIR = path.join(__dirname, '..', 'monitoring');
const TOKENS = path.join(MON_DIR, 'tokens_total.txt');
const THEO = path.join(MON_DIR, 'theoretical_tokens_total.txt');
const COMP = path.join(MON_DIR, 'compressed_tokens_total.txt');

describe('api/openai.js persistence', () => {
  const origFetch = global.fetch;
  const origKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    // ensure monitoring dir exists and files are reset
    if (!fs.existsSync(MON_DIR)) fs.mkdirSync(MON_DIR, { recursive: true });
    fs.writeFileSync(TOKENS, '0', 'utf8');
    fs.writeFileSync(THEO, '0', 'utf8');
    fs.writeFileSync(COMP, '0', 'utf8');

    process.env.OPENAI_API_KEY = 'test-key';

    // simple fetch mock that returns a valid OpenAI-like response for both calls
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    });
  });

  afterEach(() => {
    global.fetch = origFetch;
    process.env.OPENAI_API_KEY = origKey;
    // cleanup monitoring files
    try { fs.rmSync(MON_DIR, { recursive: true, force: true }); } catch (e) {}
  });

  it('persists token counters after generateExplanation', async () => {
    const text = 'To jest testowy tekst do kompresji i estymacji tokenów.';
    const res = await openai.generateExplanation(text);
    assert(res && res.usage, 'generateExplanation returned usage');

    // globals should be set
    const gTotal = Number(global.__jasnepismo_tokens_total || 0);
    const gTheo = Number(global.__jasnepismo_theoretical_total || 0);
    const gComp = Number(global.__jasnepismo_compressed_total || 0);

    // files should exist and contain same values
    const fTotal = Number(fs.readFileSync(TOKENS, 'utf8').trim() || 0);
    const fTheo = Number(fs.readFileSync(THEO, 'utf8').trim() || 0);
    const fComp = Number(fs.readFileSync(COMP, 'utf8').trim() || 0);

    assert.equal(fTotal, gTotal);
    assert.equal(fTheo, gTheo);
    assert.equal(fComp, gComp);
  });
});
