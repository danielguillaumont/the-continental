#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$OutputDirectory = (Join-Path $HOME 'Downloads')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path

Push-Location -LiteralPath $repo
try {
    $inside = (& git rev-parse --is-inside-work-tree 2>$null)
    if ($LASTEXITCODE -ne 0 -or $inside -ne 'true') { throw 'Not inside a Git working tree.' }

    $root = (& git rev-parse --show-toplevel).Trim()
    if ([IO.Path]::GetFullPath($root).TrimEnd('\') -ne [IO.Path]::GetFullPath($repo).TrimEnd('\')) {
        throw "Expected repository root $repo, but Git reported $root."
    }

    $changes = @(& git status --porcelain --untracked-files=no)
    if ($LASTEXITCODE -ne 0) { throw 'Could not read Git status.' }
    if ($changes.Count -gt 0) {
        throw 'Tracked changes are present. Commit or stash them first so the source ZIP matches a single commit.'
    }

    # A Git archive includes committed files only; untracked .env, DB data and node_modules are excluded.
    # Guard against a credential file that was accidentally committed before exporting.
    $tracked = @(& git ls-files)
    if ($LASTEXITCODE -ne 0) { throw 'Could not enumerate committed files.' }
    $sensitive = @($tracked | Where-Object {
        $_ -match '(^|/)(\.env($|\.)|id_rsa$|id_ed25519$|credentials\.json$|service-account[^/]*\.json$)' -and
        $_ -notmatch '(^|/)\.env\.example$'
    })
    if ($sensitive.Count -gt 0) {
        throw ('Potential committed secret files detected. Review before export: ' + ($sensitive -join ', '))
    }

    $sha = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $sha.Length -lt 8) { throw 'Could not determine Git commit.' }
    if (-not (Test-Path -LiteralPath $OutputDirectory -PathType Container)) {
        New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
    }

    $zipPath = Join-Path $OutputDirectory ('Continental-Source-{0}.zip' -f $sha.Substring(0, 8))
    if (Test-Path -LiteralPath $zipPath) {
        throw "Snapshot already exists: $zipPath. Move or delete the old snapshot if you need another copy."
    }

    & git archive '--format=zip' "--output=$zipPath" HEAD
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $zipPath)) {
        throw 'Git failed to generate the source ZIP.'
    }

    Write-Host "Source commit: $sha" -ForegroundColor Cyan
    Write-Host "Saved ZIP:     $zipPath" -ForegroundColor Green
    Write-Host 'This includes committed project files only, not the live database or ignored local files.'
    Write-Host 'Review the ZIP contents before sharing, especially for personal career data.'
}
finally { Pop-Location }
