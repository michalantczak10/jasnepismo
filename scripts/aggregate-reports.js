#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPDIR = path.join(__dirname, '..', 'monitoring', 'reports');
const OUT_CSV = path.join(REPDIR, 'aggregate.csv');
const OUT_SVG = path.join(REPDIR, 'aggregate.svg');
const OUT_PNG = path.join(REPDIR, 'aggregate.png');

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

function parseTimestampFromFilename(fname) {
  const m = fname.match(/token-report-(.+)Z.json$/);
  if (!m) return null;
  const s = m[1]; // example: 2026-06-11T15-41-24-808
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

function readReports() {
  if (!fs.existsSync(REPDIR)) return [];
  // Only consider per-run token-report JSON files
  const files = fs.readdirSync(REPDIR).filter(f => f.endsWith('.json') && f.startsWith('token-report-'));
  const items = files.map(f => {
    try {
      const json = JSON.parse(fs.readFileSync(path.join(REPDIR, f), 'utf8'));
      const ts = parseTimestampFromFilename(f) || fs.statSync(path.join(REPDIR,f)).mtime;
      // Expect json to be an array of sample objects; skip if not
      if (!Array.isArray(json)) return null;
      return { file: f, ts: ts || null, data: json };
    } catch (e) { return null; }
  }).filter(Boolean).sort((a,b) => (a.ts && b.ts) ? a.ts - b.ts : 0);

  // apply date filter
  const filtered = items.filter(it => {
    if (!it.ts) return false;
    if (fromDate && it.ts < fromDate) return false;
    if (toDate && it.ts > toDate) return false;
    return true;
  });
  return filtered;
}

function pivot(reports) {
  const rows = [];
  const samples = new Set();
  for (const r of reports) {
    for (const item of r.data) samples.add(item.name);
  }
  const sampleList = Array.from(samples).sort();
  for (const r of reports) {
    const row = { ts: r.ts ? r.ts.toISOString() : r.file };
    for (const s of sampleList) {
      const item = r.data.find(x => x.name === s);
      row[s] = item ? item.delta_actual || 0 : '';
    }
    rows.push(row);
  }
  return { sampleList, rows };
}

function writeCsv(pivoted) {
  const { sampleList, rows } = pivoted;
  const headers = ['timestamp'].concat(sampleList);
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = [r.ts].concat(sampleList.map(s => r[s] !== undefined ? r[s] : ''));
    lines.push(vals.join(','));
  }
  fs.writeFileSync(OUT_CSV, lines.join('\n') + '\n', 'utf8');
}

function makeSimpleSvg(pivoted) {
  const { sampleList, rows } = pivoted;
  if (!rows.length) return null;
  const w = 800, h = 240, pad = 40;
  // build series for first sample only (keep simple)
  const key = sampleList[0];
  const values = rows.map(r => Number(r[key] || 0));
  const max = Math.max(...values, 1);
  const stepX = (w - pad*2) / Math.max(1, values.length - 1);
  const points = values.map((v,i) => `${pad + i*stepX},${pad + (h - pad*2) * (1 - v/max)}`);
  const svg = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`);
  svg.push('<rect width="100%" height="100%" fill="#fff"/>');
  svg.push(`<polyline fill="none" stroke="#2b8aef" stroke-width="2" points="${points.join(' ')}"/>`);
  svg.push(`<text x="${pad}" y="${pad-8}" font-size="12" fill="#333">Series: ${key}</text>`);
  svg.push('</svg>');
  fs.writeFileSync(OUT_SVG, svg.join('\n'), 'utf8');
  return OUT_SVG;
}

async function convertSvgToPng(svgPath, outPng) {
  try {
    const sharp = require('sharp');
    const svgBuf = fs.readFileSync(svgPath);
    await sharp(svgBuf).png().toFile(outPng);
    return outPng;
  } catch (e) {
    console.warn('SVG->PNG conversion skipped (sharp missing or failed):', e && e.message ? e.message : e);
    return null;
  }
}

async function main() {
  const reports = readReports();
  const pivoted = pivot(reports);
  writeCsv(pivoted);
  const svgPath = makeSimpleSvg(pivoted);
  if (svgPath) {
    const png = await convertSvgToPng(svgPath, OUT_PNG);
    if (png) console.log('Wrote', OUT_CSV, OUT_SVG, OUT_PNG);
    else console.log('Wrote', OUT_CSV, OUT_SVG);
  } else {
    console.log('Wrote', OUT_CSV);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
