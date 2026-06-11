const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const fs = require('fs');
const path = require('path');
const openai = require('../api/openai.js');

const MON_DIR = path.join(__dirname, '..', 'monitoring');
const TOKENS = path.join(MON_DIR, 'tokens_total.txt');
const THEO = path.join(MON_DIR, 'theoretical_tokens_total.txt');
const COMP = path.join(MON_DIR, 'compressed_tokens_total.txt');

function ensureZeroFiles() {
  if (!fs.existsSync(MON_DIR)) fs.mkdirSync(MON_DIR, { recursive: true });
  fs.writeFileSync(TOKENS, '0', 'utf8');
  fs.writeFileSync(THEO, '0', 'utf8');
  fs.writeFileSync(COMP, '0', 'utf8');
}

describe('Token usage comparison', () => {
  const origFetch = global.fetch;
  const origKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    ensureZeroFiles();
    process.env.OPENAI_API_KEY = 'test-key';

    // Mock fetch to return plausible usage for both extraction and explanation calls
    let callIndex = 0;
    global.fetch = async () => {
      callIndex += 1;
      // first (extract) call: small usage, second (explain) call: larger usage
      if (callIndex === 1) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'extract' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }),
        };
      }
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'explain' } }], usage: { prompt_tokens: 40, completion_tokens: 20, total_tokens: 60 } }),
      };
    };
  });

  afterEach(() => {
    global.fetch = origFetch;
    process.env.OPENAI_API_KEY = origKey;
    try { fs.rmSync(MON_DIR, { recursive: true, force: true }); } catch (e) {}
  });

  it('reports theoretical vs compressed vs actual token usage and verifies compression saves tokens', async () => {
    // Prepare a long-ish input so compression has effect
    const text = Array(300).fill('To jest przykładowe zdanie.').join(' ');

    // Read initial counters
    const t0 = Number(fs.readFileSync(THEO, 'utf8').trim() || 0);
    const c0 = Number(fs.readFileSync(COMP, 'utf8').trim() || 0);
    const a0 = Number(fs.readFileSync(TOKENS, 'utf8').trim() || 0);

    // Run generation
    const res = await openai.generateExplanation(text);
    assert(res && res.usage, 'generateExplanation returned usage');

    // Read counters after run
    const t1 = Number(fs.readFileSync(THEO, 'utf8').trim() || 0);
    const c1 = Number(fs.readFileSync(COMP, 'utf8').trim() || 0);
    const a1 = Number(fs.readFileSync(TOKENS, 'utf8').trim() || 0);

    const deltaTheoretical = t1 - t0;
    const deltaCompressed = c1 - c0;
    const deltaActual = a1 - a0;

    // Basic sanity
    console.log('\nToken usage comparison (single request):');
    console.log(`  theoretical (no compression): ${deltaTheoretical}`);
    console.log(`  compressed (after local compression): ${deltaCompressed}`);
    console.log(`  actual (OpenAI reported total_tokens): ${deltaActual}`);

    // Compression should reduce estimated tokens
    assert(deltaCompressed > 0, 'compressed delta should be > 0');
    assert(deltaTheoretical > 0, 'theoretical delta should be > 0');
    assert(deltaCompressed <= deltaTheoretical, 'compressed should be <= theoretical');

    // Print savings (for human reading in CI logs)
    const savedByCompression = deltaTheoretical > 0 ? ((deltaTheoretical - deltaCompressed) / deltaTheoretical) * 100 : 0;
    const savedVsActual = deltaTheoretical > 0 ? ((deltaTheoretical - deltaActual) / deltaTheoretical) * 100 : 0;
    console.log(`  savings vs theoretical: ${savedByCompression.toFixed(1)}%`);
    console.log(`  savings vs theoretical (actual API): ${savedVsActual.toFixed(1)}%\n`);
  });
});
