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

function findJsonFiles(dir) {
  const res = [];
  if (!fs.existsSync(dir)) return res;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      res.push(...findJsonFiles(full));
    } else if (e.isFile() && e.name.endsWith('.json') && e.name.startsWith('token-report-')) {
      res.push(full);
    }
  }
  return res;
}

function readReports() {
  const files = findJsonFiles(REPDIR);
  const items = files.map(f => {
    try {
      const json = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (!Array.isArray(json)) return null;
      const fname = path.basename(f);
      const ts = parseTimestampFromFilename(fname) || fs.statSync(f).mtime;
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

function aggregateTotals(reports) {
  // For each report (per-run file), compute totals across samples
  const rows = [];
  for (const r of reports) {
    const totals = { theoretical: 0, compressed: 0, actual: 0 };
    for (const item of r.data) {
      totals.theoretical += Number(item.delta_theoretical || 0);
      totals.compressed += Number(item.delta_compressed || 0);
      totals.actual += Number(item.delta_actual || 0);
    }
    rows.push({ ts: r.ts ? r.ts.toISOString() : r.file, ...totals });
  }
  return rows;
}

function writeCsv(rows) {
  const headers = ['timestamp','theoretical','compressed','actual'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([r.ts, r.theoretical, r.compressed, r.actual].join(','));
  }
  fs.writeFileSync(OUT_CSV, lines.join('\n') + '\n', 'utf8');
}

function makeMultiSeriesSvg(rows) {
  if (!rows.length) return null;
  const w = 900, h = 360, pad = 60;
  // build series
  const xs = rows.map(r => r.ts);
  const series = {
    theoretical: rows.map(r => r.theoretical),
    compressed: rows.map(r => r.compressed),
    actual: rows.map(r => r.actual),
  };
  const allValues = [].concat(series.theoretical, series.compressed, series.actual);
  const max = Math.max(...allValues, 1);
  const stepX = (w - pad*2) / Math.max(1, rows.length - 1);

  function pathFor(values) {
    return values.map((v,i) => `${pad + i*stepX},${pad + (h - pad*2) * (1 - (v/max))}`).join(' ');
  }

  const cols = { theoretical: '#2b8aef', compressed: '#2ca02c', actual: '#d62728' };
  const svg = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`);
  svg.push('<rect width="100%" height="100%" fill="#ffffff"/>');

  // y grid and labels
  const ticks = 5;
  for (let t=0;t<=ticks;t++){
    const y = pad + (h - pad*2) * (t/ticks);
    const val = Math.round(max * (1 - t/ticks));
    svg.push(`<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#eee" stroke-width="1"/>`);
    svg.push(`<text x="${pad-8}" y="${y+4}" font-size="11" fill="#333" text-anchor="end">${val}</text>`);
  }

  // x labels
  const labelStep = Math.ceil(xs.length / 6) || 1;
  for (let i=0;i<xs.length;i+=labelStep){
    const x = pad + i*stepX;
    const lbl = xs[i].replace('T',' ').replace('Z','');
    svg.push(`<text x="${x}" y="${h-pad+20}" font-size="11" fill="#333" text-anchor="middle">${lbl}</text>`);
  }

  // draw lines
  for (const key of ['theoretical','compressed','actual']){
    const p = pathFor(series[key]);
    svg.push(`<polyline fill="none" stroke="${cols[key]}" stroke-width="2" points="${p}"/>`);
  }

  // legend
  const legendX = w - pad - 160;
  const legendY = pad - 20;
  let idx = 0;
  for (const key of ['theoretical','compressed','actual']){
    const y = legendY + idx*18;
    svg.push(`<rect x="${legendX}" y="${y}" width="12" height="12" fill="${cols[key]}"/>`);
    svg.push(`<text x="${legendX+18}" y="${y+10}" font-size="12" fill="#333">${key}</text>`);
    idx++;
  }

  svg.push(`</svg>`);
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
  const rows = aggregateTotals(reports);
  writeCsv(rows);
  const svgPath = makeMultiSeriesSvg(rows);
  if (svgPath) {
    const png = await convertSvgToPng(svgPath, OUT_PNG);
    if (png) console.log('Wrote', OUT_CSV, OUT_SVG, OUT_PNG);
    else console.log('Wrote', OUT_CSV, OUT_SVG);
  } else {
    console.log('Wrote', OUT_CSV);
  }
}

main().catch(e => { console.error(e); process.exit(1); });