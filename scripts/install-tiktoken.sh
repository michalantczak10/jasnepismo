#!/usr/bin/env bash
set -euo pipefail

# Helper to install tiktoken locally. May fail on some platforms.
echo "Attempting to install tiktoken (optional)"
if [ -z "$(command -v npm)" ]; then
  echo "npm not found. Please install Node.js >=24 and re-run."
  exit 1
fi

# Try installing latest tiktoken. If it fails, show manual instructions.
if npm install tiktoken@latest --no-audit --no-fund; then
  echo "tiktoken installed successfully"
  echo "Set USE_TIKTOKEN=1 in your environment to enable accurate token estimation"
else
  echo "Automatic install failed. To install manually try one of these approaches depending on your OS:" 
  echo "- Linux (x86_64): npm i tiktoken --save"
  echo "- If prebuilt binaries not available, follow https://github.com/openai/tiktoken for build from source"
  exit 0
fi
