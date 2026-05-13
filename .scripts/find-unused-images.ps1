$ErrorActionPreference = 'Stop'
$cwd = (Get-Location).Path
Write-Output "Working directory: $cwd"

# File types to scan for references
$searchExts = @('*.html','*.css','*.ts','*.js','*.mjs','*.json','*.md')
$searchFiles = Get-ChildItem -Path $cwd -Recurse -Include $searchExts -File -ErrorAction SilentlyContinue
Write-Output "Scanning $($searchFiles.Count) files for image references..."

# Regex to capture img/... paths
$pattern = "img/[^\s\"'\)\(<>]+"

$matches = New-Object System.Collections.Generic.List[string]
foreach ($f in $searchFiles) {
    try {
        $content = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -ne $null) {
            $ms = [regex]::Matches($content, $pattern)
            foreach ($m in $ms) { $matches.Add($m.Value) | Out-Null }
        }
    } catch {
        Write-Output "ERR reading $($f.FullName): $($_.Exception.Message)"
    }
}

$refs = $matches | ForEach-Object {
    $r = $_ -replace "^[\"']+", "" -replace "[\"']+$", ""
    $r = $r -replace "^\.\./", "" -replace "^\./", "" -replace "^/", ""
    $r = $r -replace "\\", "/"
    $r
} | Select-Object -Unique

# Prepare archive folder for outputs
$archiveRoot = Join-Path $cwd "archive\assets"
if (!(Test-Path $archiveRoot)) { New-Item -ItemType Directory -Path $archiveRoot -Force | Out-Null }
$refs | Out-File -FilePath (Join-Path $cwd "archive\assets-references.txt") -Encoding utf8

# Ensure img directory exists
$imgDir = Join-Path $cwd "img"
if (!(Test-Path $imgDir)) { Write-Output "No img directory found. Exiting."; exit 0 }

$imgFiles = Get-ChildItem -Path $imgDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $rel = $_.FullName.Substring($cwd.Length + 1) -replace "\\","/"
    $rel
}

$unused = $imgFiles | Where-Object { $refs -notcontains $_ }
Write-Output "Found $($imgFiles.Count) images; $($refs.Count) referenced; $($unused.Count) unreferenced."

$moved = New-Object System.Collections.Generic.List[string]
foreach ($rel in $unused) {
    $src = Join-Path $cwd ($rel -replace '/','\\')
    $dest = Join-Path $archiveRoot ($rel -replace '/','\\')
    $destDir = Split-Path $dest -Parent
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    try {
        Move-Item -LiteralPath $src -Destination $dest -Force -ErrorAction Stop
        $moved.Add($rel) | Out-Null
        Write-Output "MOVED: $rel"
    } catch {
        Write-Output "FAILED: $rel -> $($_.Exception.Message)"
    }
}

if ($moved.Count -gt 0) {
    $moved | Out-File -FilePath (Join-Path $archiveRoot "moved-files.txt") -Encoding utf8
    Write-Output "Moved $($moved.Count) files to $archiveRoot"
} else {
    Write-Output "No files moved."
}

Write-Output "Done."
