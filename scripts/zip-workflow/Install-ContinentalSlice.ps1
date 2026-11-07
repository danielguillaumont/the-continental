#requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$ZipPath)

# Installs only a reviewed, commit-pinned Continental source slice.
# Nothing is committed, pushed, migrated, or executed by this script.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Assert-RelativeSourcePath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path) -or
        $Path.StartsWith('/') -or $Path.Contains('\') -or $Path.Contains(':') -or
        $Path -match '(^|/)\.\.(/|$)|(^|/)\.(/|$)|^[A-Za-z]:' -or
        $Path -match '(^|/)(\.git|node_modules|\.venv|__pycache__)(/|$)' -or
        $Path -match '(^|/)\.env($|\.)' -or
        $Path -match '[\x00-\x1F]' -or
        $Path.EndsWith('/')) {
        throw "Unsafe slice path: $Path"
    }
}

$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$zipFull = (Resolve-Path -LiteralPath $ZipPath).Path
$branch = (& git -C $repo branch --show-current).Trim()
$commit = (& git -C $repo rev-parse HEAD).Trim()
$changes = @(& git -C $repo status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Could not read Git status.' }
if ($changes.Count -gt 0) { throw 'Workspace must be completely clean before installing a slice.' }

$archive = [IO.Compression.ZipFile]::OpenRead($zipFull)
$stage = Join-Path ([IO.Path]::GetTempPath()) ('ContinentalSlice-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
$applied = New-Object 'System.Collections.Generic.List[object]'

try {
    $manifestEntry = @($archive.Entries | Where-Object { $_.FullName -ceq 'continental-slice.json' })
    if ($manifestEntry.Count -ne 1) { throw 'Exactly one continental-slice.json is required at ZIP root.' }
    $reader = New-Object IO.StreamReader($manifestEntry[0].Open())
    try { $manifest = ConvertFrom-Json ($reader.ReadToEnd()) }
    finally { $reader.Dispose() }

    if ($manifest.schema -cne 'continental.slice.v1') { throw 'Unrecognized slice manifest schema.' }
    if ($manifest.branch -cne $branch) { throw "Wrong branch: expected $($manifest.branch), got $branch." }
    if ($manifest.base_commit -cne $commit) { throw "Wrong commit: expected $($manifest.base_commit), got $commit." }
    if (@($manifest.files).Count -eq 0) { throw 'Slice manifest lists no files.' }

    $files = @($manifest.files)
    $allowedPaths = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($item in $files) {
        $relative = [string]$item.path
        Assert-RelativeSourcePath $relative
        if (-not $allowedPaths.Add($relative)) { throw "Duplicate file in manifest: $relative" }
        if ($item.mode -cne 'add' -and $item.mode -cne 'replace') { throw "Bad mode for $relative; use add or replace." }
        if ([string]$item.sha256 -notmatch '^[A-Fa-f0-9]{64}$') { throw "Invalid SHA256 for $relative" }
        $target = Join-Path $repo ($relative.Replace('/', '\'))
        if ($item.mode -ceq 'add' -and (Test-Path -LiteralPath $target)) { throw "Add would overwrite a file: $relative" }
        if ($item.mode -ceq 'replace' -and -not (Test-Path -LiteralPath $target -PathType Leaf)) { throw "Replace target does not exist: $relative" }
    }

    $actualEntries = @($archive.Entries | Where-Object { -not $_.FullName.EndsWith('/') })
    if ($actualEntries.Count -ne $files.Count + 1) { throw 'ZIP has files not listed in the manifest, or is missing files.' }
    foreach ($entry in $actualEntries) {
        if ($entry.FullName -cne 'continental-slice.json' -and -not $allowedPaths.Contains($entry.FullName)) {
            throw "Unexpected ZIP file: $($entry.FullName)"
        }
    }

    foreach ($item in $files) {
        $relative = [string]$item.path
        $matching = @($actualEntries | Where-Object { $_.FullName -ceq $relative })
        if ($matching.Count -ne 1) { throw "ZIP must contain exactly one copy of $relative" }
        $stageFile = Join-Path $stage ($relative.Replace('/', '\'))
        $folder = Split-Path -Parent $stageFile
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        [IO.Compression.ZipFileExtensions]::ExtractToFile($matching[0], $stageFile)
        $hash = (Get-FileHash -LiteralPath $stageFile -Algorithm SHA256).Hash
        if ($hash -ine [string]$item.sha256) { throw "SHA256 mismatch: $relative" }
    }

    # All validation, path checks, and hashes pass before any destination file is changed.
    $backupRoot = Join-Path $stage '__backup__'
    foreach ($item in $files) {
        $relative = [string]$item.path
        $sourceFile = Join-Path $stage ($relative.Replace('/', '\'))
        $target = Join-Path $repo ($relative.Replace('/', '\'))
        $backup = Join-Path $backupRoot ($relative.Replace('/', '\'))
        $wasExisting = (Test-Path -LiteralPath $target -PathType Leaf)
        if ($wasExisting) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
            Copy-Item -LiteralPath $target -Destination $backup -Force
        }
        $applied.Add([pscustomobject]@{ Target = $target; Backup = $backup; Existed = $wasExisting })
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
        Copy-Item -LiteralPath $sourceFile -Destination $target -Force
    }

    Write-Host "Installed slice: $($manifest.name)" -ForegroundColor Green
    Write-Host 'No tests or database migrations have been run yet.'
    & git -C $repo status --short
    Write-Host 'Review the changes, then run the slice-specific tests before committing.'
}
catch {
    for ($i = $applied.Count - 1; $i -ge 0; $i--) {
        $change = $applied[$i]
        if ($change.Existed) {
            Copy-Item -LiteralPath $change.Backup -Destination $change.Target -Force
        }
        elseif (Test-Path -LiteralPath $change.Target) {
            Remove-Item -LiteralPath $change.Target -Force
        }
    }
    throw
}
finally {
    $archive.Dispose()
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
}
