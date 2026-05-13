/**
 * check-test-coverage.mjs
 *
 * Scans source files for data-testid attributes and checks that every one
 * has at least one reference in the test suite.
 * Exits with code 1 if untested testids are found so CI fails.
 *
 * Run: node scripts/check-test-coverage.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve('.');

// ── source files to scan for data-testid ─────────────────────────────────────
const SOURCE_GLOBS = [
  'index.html',
  'terms.html',
  'privacy.html',
  'app.ts',
  ...listFiles('modules', '.ts'),
];

// ── test files to scan for getByTestId references ────────────────────────────
const TEST_FILES = listFiles('tests', '.ts');

// ─────────────────────────────────────────────────────────────────────────────

function listFiles(dir, ext) {
  const abs = join(ROOT, dir);
  try {
    return readdirSync(abs, { recursive: true })
      .filter(f => f.endsWith(ext))
      .map(f => join(abs, f));
  } catch {
    return [];
  }
}

/** Extract all data-testid values from source content */
function extractSourceIds(content) {
  const ids = new Set();
  // HTML attribute: data-testid="foo"
  for (const m of content.matchAll(/data-testid=["']([^"']+)["']/g)) ids.add(m[1]);
  // JS setAttribute: .setAttribute("data-testid", "foo")
  for (const m of content.matchAll(/setAttribute\(["']data-testid["'],\s*["']([^"']+)["']\)/g)) ids.add(m[1]);
  return ids;
}

/** Extract all testid strings referenced in test files */
function extractTestedIds(content) {
  const ids = new Set();
  // getByTestId('foo') or getByTestId("foo")
  for (const m of content.matchAll(/getByTestId\(["']([^"']+)["']\)/g)) ids.add(m[1]);
  return ids;
}

// Collect all testids from source
const allSourceIds = new Set();
const sourceIdOrigin = {}; // id → file for reporting

for (const filePath of SOURCE_GLOBS) {
  const abs = filePath.startsWith(ROOT) ? filePath : join(ROOT, filePath);
  let content;
  try {
    content = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  for (const id of extractSourceIds(content)) {
    allSourceIds.add(id);
    sourceIdOrigin[id] = filePath.replace(ROOT + '\\', '').replace(ROOT + '/', '');
  }
}

// Collect all testids referenced in tests
const allTestedIds = new Set();
for (const filePath of TEST_FILES) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }
  for (const id of extractTestedIds(content)) allTestedIds.add(id);
}

// Report
const untested = [...allSourceIds].filter(id => !allTestedIds.has(id));
const obsolete = [...allTestedIds].filter(id => !allSourceIds.has(id));

console.log(`\n📋 data-testid coverage check`);
console.log(`   Source testids : ${allSourceIds.size}`);
console.log(`   Tested testids : ${allTestedIds.size}`);

if (untested.length === 0 && obsolete.length === 0) {
  console.log(`\n✅ All testids are covered by tests.\n`);
  process.exit(0);
}

if (untested.length > 0) {
  console.log(`\n❌ Untested data-testid attributes (${untested.length}):`);
  for (const id of untested) {
    console.log(`   - "${id}"  ←  ${sourceIdOrigin[id]}`);
  }
}

if (obsolete.length > 0) {
  console.log(`\n⚠️  Test references with no matching source testid (${obsolete.length}):`);
  for (const id of obsolete) {
    console.log(`   - "${id}"`);
  }
  console.log(`   (These may be dynamically generated — verify manually.)`);
}

console.log('');
// Fail only on untested ids (source has it, tests don't)
process.exit(untested.length > 0 ? 1 : 0);
