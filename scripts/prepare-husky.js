#!/usr/bin/env node
// Install husky locally, but skip during CI builds (Vercel, GitHub Actions, Netlify etc.)
// This prevents noisy "husky - Git hooks installed" lines in CI logs and avoids creating hooks there.

const { execSync } = require('child_process');

const CI_ENV_VARS = [
  'CI',
  'GITHUB_ACTIONS',
  'VERCEL',
  'NETLIFY',
  'GITLAB_CI',
  'TF_BUILD',
  'CODESPACE',
];

const isCI = CI_ENV_VARS.some((name) => Boolean(process.env[name]));

if (isCI) {
  console.log('prepare-husky: CI environment detected — skipping Husky installation.');
  process.exit(0);
}

try {
  console.log('prepare-husky: installing Husky...');
  execSync('npx --yes husky install', { stdio: 'inherit' });
  console.log('prepare-husky: Husky installed.');
} catch (err) {
  console.error('prepare-husky: failed to install Husky.');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
}
