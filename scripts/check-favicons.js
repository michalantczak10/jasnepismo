const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const expected = [
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'favicon.ico'
];
const featureFlags = require('../lib/feature-flags');

if (!featureFlags.isEnabled('favicons')) {
  console.log('Feature "favicons" disabled (set FEATURE_FAVICONS=0 to disable). Exiting.');
  process.exit(0);
}

let missing = [];
for (const f of expected) {
  if (!fs.existsSync(path.join(root, f))) missing.push(f);
}

if (missing.length > 0) {
  console.error('Missing favicons:', missing.join(', '));
  process.exit(2);
}

console.log('All expected favicon files present.');
process.exit(0);

