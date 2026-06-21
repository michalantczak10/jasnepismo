#!/usr/bin/env bash
set -euo pipefail

# Install Husky and configure lint-staged hooks. Run this script locally once
# after pulling to set up the git hooks.

npm install --save-dev husky lint-staged

# initialize husky
npx husky install

# add pre-commit hook
npx husky add .husky/pre-commit "npx --no-install lint-staged"

echo "Added Husky pre-commit hook and lint-staged."
