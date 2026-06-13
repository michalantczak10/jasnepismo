# add_vercel_env.ps1 — add OPENAI_FALLBACK_MODEL to Vercel (production + preview)
# Usage: PowerShell: .\scripts\add_vercel_env.ps1 -Model gpt-3.5-turbo
param(
  [string]$Model = 'gpt-3.5-turbo'
)

Set-StrictMode -Version Latest

# Ensure vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "vercel CLI not found — installing globally (requires npm)..."
  npm i -g vercel
}

Write-Host "Ensure you're logged in to Vercel. If not, the CLI will prompt you."
vercel login | Out-Null

# Link project
try {
  vercel link --yes | Out-Null
} catch { }

# Add env vars — piping value to interactive prompt
$addProd = "$Model`n" | vercel env add OPENAI_FALLBACK_MODEL production
if ($LASTEXITCODE -ne 0) {
  Write-Host "Interactive add failed. Run: vercel env add OPENAI_FALLBACK_MODEL production and enter: $Model"
}

$addPrev = "$Model`n" | vercel env add OPENAI_FALLBACK_MODEL preview
if ($LASTEXITCODE -ne 0) {
  Write-Host "Interactive add failed. Run: vercel env add OPENAI_FALLBACK_MODEL preview and enter: $Model"
}

Write-Host "Redeploying production..."
vercel deploy --prod --confirm

Write-Host "Done. Check Vercel dashboard -> Project -> Settings -> Environment Variables."