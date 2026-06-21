#!/usr/bin/env bash
# Minimal husky shim for environments where husky isn't installed yet.
if [ -f ".husky/_/husky.sh" ]; then
  . ".husky/_/husky.sh"
fi
