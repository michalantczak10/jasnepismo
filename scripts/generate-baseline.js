const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve(__dirname, '..', 'index.html');
const url = 'file://' + filePath.replaceAll('\\', '/');
const outDir = path.resolve(__dirname, '..', 'e2e', 'baseline');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'hero.png');

console.log('Generating baseline screenshot to', outPath);
try {
  // Use Playwright CLI to take a screenshot of the hero element
  execSync(
    `npx playwright screenshot "${url}" "${outPath}" --selector="[data-testid=\\"header-hero\\"]"`,
    { stdio: 'inherit' }
  );
  console.log('Baseline generated.');
} catch (err) {
  console.error('Failed to generate baseline:', err);
  process.exit(1);
}
