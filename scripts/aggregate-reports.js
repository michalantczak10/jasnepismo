#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPDIR = path.join(__dirname, '..', 'monitoring', 'reports');
const OUT_CSV = path.join(REPDIR, 'aggregate.csv');
const OUT_SVG = path.join(REPDIR, 'aggregate.svg');

function readReports() {
  if (!fs.existsSync(REPDIR)) return [];
  const files = fs.readdirSync(REPDIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const json = JSON.parse(fs.readFileSync(path.join(REPDIR, f), 'utf8'));
      const m = f.match(/token-report-(.+)Z.json$/);
      const ts = m ? new Date(m[1].replace(/-/g, ':')) : null;
      return { file: f, ts: ts || null, data: json };
    } catch (e) { return null; }
  }).filter(Boolean).sort((a,b) => (a.ts && b.ts) ? a.ts - b.ts : 0);
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
  if (!rows.length) return;
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
}

function main() {
  const reports = readReports();
  const pivoted = pivot(reports);
  writeCsv(pivoted);
  makeSimpleSvg(pivoted);
  console.log('Wrote', OUT_CSV, 'and', OUT_SVG);
}

main();
