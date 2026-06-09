Clean-history scripts

This repo includes two PowerShell helpers to safely rewrite Git history and remove large or sensitive files:

- scripts/clean-history.ps1 (original, interactive)
- scripts/clean-history-auto.ps1 (enhanced; supports -ForcePush and custom paths)

Recommended workflow

1. Run locally, not in CI. Clone your repo and run the script from the repo root.
2. Inspect mirror created in %TEMP% (the scripts create a mirror clone; they do not push by default unless -ForcePush).
3. Verify history and files removed: git log --all -- <path>
4. Only after manual verification, confirm push. Force-pushing rewrites history and requires all collaborators to reclone or hard-reset.

Rollback & team communication

- After force-push, tell collaborators to:
  1. Backup any local branches they need (git format-patch or push to a temporary remote).
  2. Re-clone the repository (recommended): git clone <remote>
  3. Or, for advanced users on specific branches: git fetch origin; git reset --hard origin/<branch>

- If anything goes wrong, you can restore from the mirror directory created by the script (it contains the original refs). If you accidentally pushed unwanted changes, you can push the mirror again or fetch refs from it.

Notes

- Preferred tool: git-filter-repo (Python). Install: pip install git-filter-repo
- Alternative: BFG Repo-Cleaner (requires Java and bfg.jar).
- Script is intentionally conservative: it writes a mirror and asks for confirmation before pushing unless -ForcePush is used.

If you want, I can also:

- Add a GitHub Action that runs diagnostics and detects large files in commits and opens an issue instead of rewriting history automatically.
- Add a list of files to remove tailored to your repo after a final scan.
