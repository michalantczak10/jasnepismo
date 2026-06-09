<#
Enhanced PowerShell script to rewrite Git history to remove sensitive/large files.
Non-interactive mode available for local use when you want to force-push automatically.

Usage examples:
  # Interactive (safe, default)
  .\scripts\clean-history-auto.ps1

  # Non-interactive: provide remote URL and auto-confirm push
  .\scripts\clean-history-auto.ps1 -RemoteUrl "https://github.com/you/repo.git" -ForcePush -Paths @('.claude','*.duckdb')

Parameters:
  -RemoteUrl <string>   : Optional. Remote repo URL to mirror. If omitted, will read from origin.
  -Paths <string[]>     : Optional array of paths/globs to remove from history. Defaults included.
  -PathsFile <string>   : Optional path to a newline-separated file with paths to remove.
  -BfgJar <string>      : Optional path to bfg.jar if git-filter-repo isn't available.
  -ForcePush            : Switch. If set, will push rewritten history to origin without interactive prompt.
  -Verbose              : PowerShell verbose output.

Important: this script performs destructive, history-rewriting operations. Run locally, test on mirror, and only push when you're ready.
#>

param(
  [string] $RemoteUrl = $null,
  [string[]] $Paths = $null,
  [string] $PathsFile = $null,
  [string] $BfgJar = $null,
  [switch] $ForcePush,
  [switch] $Verbose
)

set -e

function ExitWithError($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  ExitWithError "git nie jest zainstalowany lub nie jest w PATH. Zainstaluj git przed uruchomieniem." 
}

$repoRoot = (Get-Location).Path
if (-not $RemoteUrl) {
  try { $RemoteUrl = git remote get-url origin 2>$null } catch {}
}
if (-not $RemoteUrl) {
  $RemoteUrl = Read-Host "Nie znaleziono remote 'origin'. Podaj URL repozytorium (np. https://github.com/you/repo.git)"
}

# default paths
if (-not $Paths) {
  $Paths = @(
    ".MyOllamaEnhancer",
    ".claude",
    "scripts/vendor",
    "test-results",
    "styles.v16.css",
    "styles.v17.css",
    "styles.v18.css",
    "resources",
    "*.duckdb",
    "*.log"
  )
}

# if provided a PathsFile, append its contents
if ($PathsFile) {
  if (-not (Test-Path $PathsFile)) { ExitWithError "PathsFile nie istnieje: $PathsFile" }
  $extra = Get-Content $PathsFile | Where-Object { $_ -and $_.Trim() -ne '' }
  $Paths = $Paths + $extra
}

$tempDir = Join-Path $env:TEMP "jasnepismo-git-mirror-$(Get-Random)"
Write-Host "Tworzę mirror repozytorium w: $tempDir"

git clone --mirror $RemoteUrl $tempDir || ExitWithError "git clone --mirror nie powiodło się"

# write paths to file in mirror
$pathsFileMirror = Join-Path $tempDir "paths-to-remove.txt"
$Paths | Set-Content -Path $pathsFileMirror -Encoding UTF8
Write-Host "Plik ścieżek do usunięcia: $pathsFileMirror"

function HasGitFilterRepo() {
  try { git filter-repo --help > $null 2>&1; return $LASTEXITCODE -eq 0 } catch { return $false }
}

Push-Location $tempDir
try {
  if (HasGitFilterRepo) {
    Write-Host "Używam git-filter-repo do przefiltrowania historii..."
    git filter-repo --invert-paths --paths-from-file "$pathsFileMirror" --force || ExitWithError "git filter-repo nie powiódł się"
    Write-Host "git-filter-repo zakończony."
  } else {
    Write-Host "git-filter-repo nie jest dostępny. Sprawdzam BFG..."
    if (-not $BfgJar) {
      # try common locations
      $bfgCandidates = @(Join-Path $repoRoot 'bfg.jar', Join-Path $repoRoot 'lib\bfg.jar')
      $BfgJar = $bfgCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    }
    if (-not $BfgJar) {
      Write-Host "BFG nie znaleziony. Proszę zainstalować git-filter-repo (pip install git-filter-repo) lub podać -BfgJar ścieżkę do bfg.jar. Skipping rewrite.";
      exit 0
    }

    Write-Host "Używam BFG ($BfgJar) do usuwania..."
    foreach ($p in $Paths) {
      if ($p -like '*/*') {
        # treat as folder
        Write-Host "BFG: usuwam folder lub wzorzec: $p"
        java -jar "$BfgJar" --delete-folders "$p" . || Write-Host "BFG zwrócił błąd dla $p (może być ok)"
      } else {
        Write-Host "BFG: usuwam pliki matching: $p"
        java -jar "$BfgJar" --delete-files "$p" . || Write-Host "BFG zwrócił błąd dla $p"
      }
    }

    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    Write-Host "BFG zakończony."
  }

  Write-Host "Przejrzyj mirror w: $tempDir przed push."

  if (-not $ForcePush) {
    $confirm = Read-Host "Czy chcesz teraz wypchnąć przepisane gałęzie do origin (FORCE PUSH)? (tak/nie)"
    if ($confirm -ne 'tak') { Write-Host "Anulowano push. Mirror pozostaje w: $tempDir"; exit 0 }
  } else {
    Write-Host "-ForcePush ustawiony: wykonuję push bez potwierdzenia."
  }

  Write-Host "Wypycham wszystkie gałęzie i tagi z mirroru do origin (FORCE)..."
  git push --force --all origin || ExitWithError "git push --force --all nie powiódł się"
  git push --force --tags origin || ExitWithError "git push --force --tags nie powiódł się"
  Write-Host "Push zakończony. Poinformuj współpracowników by zaktualizowali lokalne klony (reclone zalecany)."
} finally {
  Pop-Location
}

Write-Host "Gotowe. Mirror znajduje się w: $tempDir"
Write-Host "Zalecenie: Powiadom zespół, poproś o re-clone lub wykonanie: git fetch origin --prune; git reset --hard origin/main (dla każdej gałęzi), aby uniknąć divergencji."