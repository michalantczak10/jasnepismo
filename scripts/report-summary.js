#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPDIR = path.join(__dirname, '..', 'monitoring', 'reports');

function listReports() {
  if (!fs.existsSync(REPDIR)) return [];
  return fs.readdirSync(REPDIR).filter(f => f.startsWith('token-report-') && f.endsWith('.json')).sort();
}

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }

function summarize(reportData) {
  // reportData is array of sample rows
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

function writeSummaryFiles(summary, srcFile) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outJson = path.join(REPDIR, `summary-${ts}.json`);
  const outCsv = path.join(REPDIR, `summary-${ts}.csv`);
  fs.writeFileSync(outJson, JSON.stringify({ source: srcFile, summary }, null, 2), 'utf8');
  const csv = `metric,value\n` + Object.entries(summary).map(([k,v]) => `${k},${v}`).join('\n') + '\n';
  fs.writeFileSync(outCsv, csv, 'utf8');
  return { outJson, outCsv };
}

function prettyPrint(summary) {
  console.log('\nToken usage summary (aggregated across samples):');
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
  // pick latest
  const latest = files[files.length - 1];
  const data = readJson(path.join(REPDIR, latest));
  if (!data) { console.error('Failed to read', latest); process.exit(1); }
  const summary = summarize(data);
  prettyPrint(summary);
  const written = writeSummaryFiles(summary, latest);
  console.log('Wrote summary files:', written.outJson, written.outCsv);
}

main();
