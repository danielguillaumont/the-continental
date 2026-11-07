#requires -Version 5.1
[CmdletBinding()]
param([switch]$RequireClean)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path

Push-Location -LiteralPath $repo
try {
    $expected = @('apps\api', 'apps\web', 'README.md', 'docker-compose.yml')
    foreach ($path in $expected) {
        if (-not (Test-Path -LiteralPath (Join-Path $repo $path))) { throw "Missing expected project path: $path" }
    }
    $branch = (& git branch --show-current).Trim()
    $sha = (& git rev-parse HEAD).Trim()
    $status = @(& git status --porcelain)
    if ($LASTEXITCODE -ne 0) { throw 'Failed to inspect Git status.' }

    Write-Host "Repository: $repo"
    Write-Host "Branch:     $branch"
    Write-Host "Commit:     $sha"
    Write-Host "Changes:    $($status.Count)"
    if ($status.Count -gt 0) { $status | ForEach-Object { Write-Host "  $_" } }
    if ($RequireClean -and $status.Count -gt 0) { throw 'Workspace must be clean.' }

    foreach ($program in @('git', 'python', 'node', 'npm', 'docker')) {
        $command = Get-Command $program -ErrorAction SilentlyContinue
        $result = if ($null -ne $command) { $command.Source } else { 'NOT FOUND' }
        Write-Host ('{0,-8}: {1}' -f $program, $result)
    }
    Write-Host 'This checks files and tools, not running services or CI status.'
}
finally { Pop-Location }
