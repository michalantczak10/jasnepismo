const fs = require('fs');
const path = require('path');

// Validates that all required favicon files exist, are non-empty, and that
// the webmanifest references match the files present on disk.

const repoRoot = path.join(__dirname, '..');

const REQUIRED_FILES = [
  'favicon.ico',
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'site.webmanifest',
];

let hasError = false;

function fail(msg) {
  console.error('FAIL:', msg);
  hasError = true;
}

// 1. Check that each required file exists and is non-empty.
for (const file of REQUIRED_FILES) {
  const filePath = path.join(repoRoot, file);
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${file}`);
    continue;
  }
  const { size } = fs.statSync(filePath);
  if (size === 0) {
    fail(`File is empty: ${file}`);
  }
}

// 2. Validate that every icon listed in site.webmanifest exists on disk.
const manifestPath = path.join(repoRoot, 'site.webmanifest');
if (fs.existsSync(manifestPath)) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    fail(`Could not parse site.webmanifest: ${err.message}`);
  }

  if (manifest && Array.isArray(manifest.icons)) {
    for (const icon of manifest.icons) {
      if (!icon.src) {
        fail('icon entry in site.webmanifest is missing "src"');
        continue;
      }
      // src values start with '/' – strip the leading slash for path resolution
      const iconFile = icon.src.replace(/^\/+/, '');
      const iconPath = path.join(repoRoot, iconFile);
      if (!fs.existsSync(iconPath)) {
        fail(`site.webmanifest references missing file: ${icon.src}`);
      }
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All favicon checks passed.');
}
