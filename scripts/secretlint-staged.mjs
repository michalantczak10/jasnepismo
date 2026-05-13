import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';

const binaryExtensions = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.mp4',
  '.pdf',
  '.png',
  '.ttf',
  '.wav',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

const stagedOutput = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
  { encoding: 'utf8' },
);

const stagedFiles = stagedOutput
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => existsSync(file))
  .filter((file) => !binaryExtensions.has(extname(file).toLowerCase()));

if (stagedFiles.length === 0) {
  console.log('No staged text files to scan for secrets.');
  process.exit(0);
}

execFileSync(
  process.execPath,
  [
    './node_modules/secretlint/bin/secretlint.js',
    '--secretlintignore',
    '.secretlintignore',
    ...stagedFiles,
  ],
  { stdio: 'inherit' },
);