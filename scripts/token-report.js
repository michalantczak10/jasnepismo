#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const MON_DIR = path.join(__dirname, '..', 'monitoring');
const TOKENS = path.join(MON_DIR, 'tokens_total.txt');
const THEO = path.join(MON_DIR, 'theoretical_tokens_total.txt');
const COMP = path.join(MON_DIR, 'compressed_tokens_total.txt');
const REPORTS = path.join(MON_DIR, 'reports');

const argv = process.argv.slice(2);
const mock = argv.includes('--mock') || process.env.MOCK_TOKENS === '1';

if (mock) {
  // Provide a dummy API key so generateExplanation doesn't abort early
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'mock';
}

function ensureFiles() {
  fs.mkdirSync(MON_DIR, { recursive: true });
  if (!fs.existsSync(TOKENS)) fs.writeFileSync(TOKENS, '0', 'utf8');
  if (!fs.existsSync(THEO)) fs.writeFileSync(THEO, '0', 'utf8');
  if (!fs.existsSync(COMP)) fs.writeFileSync(COMP, '0', 'utf8');
  fs.mkdirSync(REPORTS, { recursive: true });
}

function readNum(p) {
  try {
    return Number(fs.readFileSync(p, 'utf8').trim()) || 0;
  } catch (e) {
    return 0;
  }
}

function writeReportFiles(json, csv) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const jpath = path.join(REPORTS, `token-report-${ts}.json`);
  const cpath = path.join(REPORTS, `token-report-${ts}.csv`);
  fs.writeFileSync(jpath, JSON.stringify(json, null, 2), 'utf8');
  fs.writeFileSync(cpath, csv, 'utf8');
  return { jpath, cpath };
}

async function main() {
  ensureFiles();

  const openai = require('../api/openai.js');

  // Load samples: if samples/ exists, use .txt files, else built-ins
  const samplesDir = path.join(__dirname, 'samples');
  let samples = [];
  if (fs.existsSync(samplesDir)) {
    const files = fs.readdirSync(samplesDir).filter((f) => f.endsWith('.txt'));
    samples = files.map((f) => ({ name: f.replace(/\.txt$/, ''), text: fs.readFileSync(path.join(samplesDir, f), 'utf8') }));
  }
  if (!samples.length) {
    samples = [
      { name: 'short', text: 'To jest krótki przykładowy tekst.' },
      { name: 'medium', text: Array(50).fill('To jest przykładowe zdanie.').join(' ') },
      { name: 'long', text: Array(300).fill('To jest przykładowe zdanie.').join(' ') },
    ];
  }

  // Optional mock: simple usage simulator that returns two calls per generateExplanation
  if (mock) {
    let callCount = 0;
    global.fetch = async () => {
      callCount += 1;
      // For extract (first call) return small usage; for explain (second) larger
      if (callCount % 2 === 1) {
        return { ok: true, json: async () => ({ choices: [{ message: { content: 'extract' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }) };
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'explain' } }], usage: { prompt_tokens: 40, completion_tokens: 20, total_tokens: 60 } }) };
    };
  }

  const results = [];

  for (const s of samples) {
    console.log('Processing sample:', s.name);
    const beforeTheo = readNum(THEO);
    const beforeComp = readNum(COMP);
    const beforeAct = readNum(TOKENS);

    let out = null;
    try {
      out = await openai.generateExplanation(s.text);
      // allow some time for persistence if needed
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.error('generateExplanation failed for', s.name, e && e.message ? e.message : e);
    }

    const afterTheo = readNum(THEO);
    const afterComp = readNum(COMP);
    const afterAct = readNum(TOKENS);

    const deltaTheo = afterTheo - beforeTheo;
    const deltaComp = afterComp - beforeComp;
    const deltaAct = afterAct - beforeAct;

    const savedByCompression = deltaTheo > 0 ? ((deltaTheo - deltaComp) / deltaTheo) * 100 : 0;
    const savedVsActual = deltaTheo > 0 ? ((deltaTheo - deltaAct) / deltaTheo) * 100 : 0;

    const row = {
      name: s.name,
      length: s.text.length,
      delta_theoretical: deltaTheo,
      delta_compressed: deltaComp,
      delta_actual: deltaAct,
      saved_by_compression_pct: Number(savedByCompression.toFixed(2)),
      saved_vs_actual_pct: Number(savedVsActual.toFixed(2)),
    };
    results.push(row);

    // write debug entry per-sample so live runs can be inspected
    try {
      const dbg = {
        sample: s.name,
        before: { theoretical: beforeTheo, compressed: beforeComp, actual: beforeAct },
        after: { theoretical: afterTheo, compressed: afterComp, actual: afterAct },
        delta: { theoretical: deltaTheo, compressed: deltaComp, actual: deltaAct },
        saved_by_compression_pct: row.saved_by_compression_pct,
        saved_vs_actual_pct: row.saved_vs_actual_pct,
        api_response: out || null,
        timestamp: new Date().toISOString(),
      };
      fs.appendFileSync(path.join(REPORTS, 'debug-log.jsonl'), JSON.stringify(dbg) + '\n', 'utf8');
    } catch (e) {
      console.warn('Failed to write debug log for', s.name, e && e.message ? e.message : e);
    }

    console.log(`  theoretical: ${deltaTheo}, compressed: ${deltaComp}, actual: ${deltaAct}`);
  }

  // Build CSV
  const headers = ['name','length','delta_theoretical','delta_compressed','delta_actual','saved_by_compression_pct','saved_vs_actual_pct'];
  const csv = [headers.join(',')].concat(results.map((r) => headers.map((h) => r[h]).join(','))).join('\n') + '\n';

  const { jpath, cpath } = writeReportFiles(results, csv);
  console.log('Report written:', jpath);
  console.log('CSV written:', cpath);
}

main().catch((e) => { console.error(e); process.exit(1); });
