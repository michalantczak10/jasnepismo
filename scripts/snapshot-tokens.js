const fs = require('fs');
const path = require('path');

const TOKENS_DIR = path.join(__dirname, '..', 'monitoring');
const SNAP_DIR = path.join(TOKENS_DIR, 'snapshots');

function readNumber(file) {
  try {
    return Number(fs.readFileSync(file, 'utf8').trim()) || 0;
  } catch (e) {
    return 0;
  }
}

function snapshot() {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const total = readNumber(path.join(TOKENS_DIR, 'tokens_total.txt'));
  const theoretical = readNumber(path.join(TOKENS_DIR, 'theoretical_tokens_total.txt'));
  const compressed = readNumber(path.join(TOKENS_DIR, 'compressed_tokens_total.txt'));
  const now = new Date();
  const fname = `${now.toISOString().replace(/[:.]/g, '-')}.json`;
  const out = {
    timestamp: now.toISOString(),
    tokens_total: total,
    theoretical_tokens_total: theoretical,
    compressed_tokens_total: compressed,
  };
  fs.writeFileSync(path.join(SNAP_DIR, fname), JSON.stringify(out, null, 2), 'utf8');
  console.log('Snapshot written to', path.join(SNAP_DIR, fname));
}

if (require.main === module) snapshot();
module.exports = { snapshot };
