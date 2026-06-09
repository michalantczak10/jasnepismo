<#
PowerShell helper to safely rewrite Git history to remove sensitive/large files.
Usage: run this script locally (not on CI). It will:
  - create a mirror clone of your remote repo in %TEMP%
  - remove configured paths from history using git-filter-repo (preferred) or BFG (fallback)
  - keep the modified mirror for inspection
  - optionally push rewritten history back to origin after explicit confirmation

Important:
  - Requires git. Preferred tool: git-filter-repo (Python). Alternative: BFG (Java).
  - Do NOT run on a repo where you can't force-push or coordinate with collaborators.
  - This script does NOT push by default; you must confirm.

Paths removed by default (edit if needed):
  .MyOllamaEnhancer
  .claude
  scripts/vendor
  test-results
  styles.v16.css
  styles.v17.css
  styles.v18.css
  resources
  *.duckdb
  *.log
#>

set -e

function ExitWithError($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

# ensure git is present
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  ExitWithError "git nie jest zainstalowany lub nie jest w PATH. Zainstaluj git przed uruchomieniem." 
}

# gather repo info
$repoRoot = (Get-Location).Path
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
  $remoteUrl = Read-Host "Nie znaleziono remote 'origin'. Podaj URL repozytorium (np. https://github.com/you/repo.git)"
}

$tempDir = Join-Path $env:TEMP "jasnepismo-git-mirror-$(Get-Random)"
Write-Host "Tworzę mirror repozytorium w: $tempDir"

# clone mirror
git clone --mirror $remoteUrl $tempDir || ExitWithError "git clone --mirror nie powiodło się"

# create paths file
$pathsFile = Join-Path $tempDir "paths-to-remove.txt"
@(
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
) | Set-Content -Path $pathsFile -Encoding UTF8

Write-Host "Plik z listą ścieżek do usunięcia: $pathsFile"

# helper: check git-filter-repo
function HasGitFilterRepo() {
  try {
    # try calling the wrapper
    git filter-repo --help > $null 2>&1
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

# prefer git-filter-repo
if (HasGitFilterRepo) {
  Write-Host "Używam git-filter-repo do przefiltrowania historii..."
  Push-Location $tempDir
  try {
    git filter-repo --invert-paths --paths-from-file "$pathsFile" --force || ExitWithError "git filter-repo nie powiódł się"
  } finally {
    Pop-Location
  }
  Write-Host "git-filter-repo zakończony. Przejdź do $tempDir żeby przejrzeć zmiany."
} else {
  Write-Host "git-filter-repo nie jest dostępny. Spróbuję użyć BFG jeśli jest zainstalowany (wymaga Javy i pliku bfg.jar)."
  # look for bfg.jar in repo root or ask user for path
  $bfgJarCandidates = @(
    Join-Path $repoRoot 'bfg.jar',
    Join-Path $repoRoot 'lib\bfg.jar'
  )
  $bfgJar = $bfgJarCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $bfgJar) {
    $bfgJar = Read-Host "Podaj pełną ścieżkę do bfg.jar (puste -> abort)"
    if (-not $bfgJar) { ExitWithError "Ani git-filter-repo ani bfg.jar nie są dostępne. Zainstaluj git-filter-repo (pip install git-filter-repo) lub pobierz BFG i uruchom ponownie." }
  }

  # run BFG
  Write-Host "Używam BFG ($bfgJar) do usuwania folderów/pliki z mirroru..."
  Push-Location $tempDir
  try {
    # delete folders
    $folders = @('.MyOllamaEnhancer','.claude','scripts/vendor','test-results','resources')
    foreach ($f in $folders) {
      Write-Host "BFG: usuwam folder: $f"
      java -jar "$bfgJar" --delete-folders $f . || ExitWithError "BFG nie powiódł się dla folderu $f"
    }
    # delete files/globs
    $fileGlobs = @('styles.v16.css','styles.v17.css','styles.v18.css','*.duckdb','*.log')
    foreach ($g in $fileGlobs) {
      Write-Host "BFG: usuwam pliki: $g"
      java -jar "$bfgJar" --delete-files $g . || Write-Host "BFG zwrócił błąd dla $g (może to być ok)"
    }

    # housekeeping
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
  } finally {
    Pop-Location
  }
  Write-Host "BFG zakończony. Przejrzyj $tempDir przed wypchnięciem." 
}

Write-Host "
WAŻNE: Zmiany zostały zastosowane tylko w mirrorze: $tempDir
Przejrzyj historię lokalnie, sprawdź czy wszystko działa (git log --all -- <path>) i dopiero potem wykonaj push force.
"

$confirm = Read-Host "Czy chcesz teraz wypchnąć przepisane gałęzie do origin (FORCE PUSH)? (tak/nie)"
if ($confirm -ne 'tak') {
  Write-Host "Anulowano push. Mirror pozostaje w: $tempDir"
  exit 0
}

# final push
Write-Host "Wypycham wszystkie gałęzie i tagi z mirroru do origin (FORCE)..."
Push-Location $tempDir
try {
  git push --force --all origin || ExitWithError "git push --force --all nie powiódł się"
  git push --force --tags origin || ExitWithError "git push --force --tags nie powiódł się"
  Write-Host "Push zakończony. Poinformuj współpracowników by zaktualizowali lokalne klony (reclone zalecany)."
} finally {
  Pop-Location
}

Write-Host "Gotowe. Jeśli chcesz, możesz usunąć mirror: Remove-Item -Recurse -Force $tempDir"