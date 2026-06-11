#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPDIR = path.join(__dirname, '..', 'monitoring', 'reports');
const argv = process.argv.slice(2);
let days = null; // last N days
let fromDate = null;
let toDate = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--days' && argv[i+1]) { days = Number(argv[i+1]); i++; }
  else if (a === '--from' && argv[i+1]) { fromDate = new Date(argv[i+1]); i++; }
  else if (a === '--to' && argv[i+1]) { toDate = new Date(argv[i+1]); i++; }
}
if (days && !fromDate) {
  toDate = toDate || new Date();
  fromDate = new Date(toDate.getTime() - Math.max(0, days) * 24 * 3600 * 1000);
}
if (!fromDate && !toDate) {
  // default to last 30 days
  toDate = new Date();
  fromDate = new Date(toDate.getTime() - 30 * 24 * 3600 * 1000);
}

function listReports() {
  if (!fs.existsSync(REPDIR)) return [];
  return fs.readdirSync(REPDIR).filter(f => f.startsWith('token-report-') && f.endsWith('.json')).sort();
}

function parseTimestampFromFilename(fname) {
  const m = fname.match(/token-report-(.+)Z.json$/);
  if (!m) return null;
  const s = m[1];
  const parts = s.split('T');
  if (parts.length !== 2) return null;
  const date = parts[0];
  const timeParts = parts[1].split('-');
  const hh = timeParts[0] || '00';
  const mm = timeParts[1] || '00';
  const ss = timeParts[2] || '00';
  const ms = timeParts.slice(3).join('') || '000';
  const iso = `${date}T${hh.padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'0')}.${ms}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }

function summarize(reportData) {
  // reportData is array of sample rows (concatenate all reports)
  const sum = { delta_theoretical: 0, delta_compressed: 0, delta_actual: 0 };
  for (const r of reportData) {
    sum.delta_theoretical += Number(r.delta_theoretical || 0);
    sum.delta_compressed += Number(r.delta_compressed || 0);
    sum.delta_actual += Number(r.delta_actual || 0);
  }
  sum.saved_by_compression_pct = sum.delta_theoretical > 0 ? ((sum.delta_theoretical - sum.delta_compressed) / sum.delta_theoretical) * 100 : 0;
  sum.saved_vs_actual_pct = sum.delta_theoretical > 0 ? ((sum.delta_theoretical - sum.delta_actual) / sum.delta_theoretical) * 100 : 0;
  return sum;
}

function writeSummaryFiles(summary, srcFiles) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outJson = path.join(REPDIR, `summary-${ts}.json`);
  const outCsv = path.join(REPDIR, `summary-${ts}.csv`);
  fs.writeFileSync(outJson, JSON.stringify({ source: srcFiles, summary }, null, 2), 'utf8');
  const csv = `metric,value\n` + Object.entries(summary).map(([k,v]) => `${k},${v}`).join('\n') + '\n';
  fs.writeFileSync(outCsv, csv, 'utf8');
  return { outJson, outCsv };
}

function prettyPrint(summary) {
  console.log('\nToken usage summary (aggregated across selected reports):');
  console.log(`  theoretical total: ${summary.delta_theoretical}`);
  console.log(`  compressed total:  ${summary.delta_compressed}`);
  console.log(`  actual total:      ${summary.delta_actual}`);
  console.log(`  saved by compression: ${summary.saved_by_compression_pct.toFixed(2)}%`);
  console.log(`  saved vs actual:       ${summary.saved_vs_actual_pct.toFixed(2)}%\n`);
}

function main() {
  const files = listReports();
  if (!files.length) {
    console.error('No token-report JSON files found in', REPDIR);
    process.exit(1);
  }
  // map to {file, ts}
  const items = files.map(f => ({ file: f, ts: parseTimestampFromFilename(f) || fs.statSync(path.join(REPDIR,f)).mtime })).filter(it => it.ts);
  const filtered = items.filter(it => it.ts >= fromDate && it.ts <= toDate);
  if (!filtered.length) {
    console.error('No reports in the requested date range', fromDate.toISOString(), '->', toDate.toISOString());
    process.exit(1);
  }
  const allRows = [];
  for (const it of filtered) {
    const data = readJson(path.join(REPDIR, it.file));
    if (data && Array.isArray(data)) allRows.push(...data);
  }
  const summary = summarize(allRows);
  prettyPrint(summary);
  const written = writeSummaryFiles(summary, filtered.map(f => f.file));
  console.log('Wrote summary files:', written.outJson, written.outCsv);
}

main();
