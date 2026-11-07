[CmdletBinding()]
param(
    [ValidateRange(2000,30000)]
    [int]$WaitMilliseconds = 8000
)

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'DB'
$root = Join-Path $HOME 'Projects\the-continental'
Set-Location -LiteralPath $root

if ((git branch --show-current).Trim() -ne 'docs/v010-readme-release') {
    throw 'Expected docs/v010-readme-release branch. Stop.'
}

# The origin matters: localhost and 127.0.0.1 are distinct browser origins.
$baseUrl = 'http://localhost:3000'
foreach ($probe in @('http://localhost:3000/', 'http://127.0.0.1:8000/docs')) {
    try {
        $response = Invoke-WebRequest -Uri $probe -UseBasicParsing -TimeoutSec 12
        if ($response.StatusCode -ne 200) {
            throw "HTTP $($response.StatusCode)"
        }
    } catch {
        throw "App/server check failed at $probe. Confirm API Server and Web are running. $($_.Exception.Message)"
    }
}

$reviewDir = Join-Path $HOME 'Pictures\Continental-Portfolio-Review'
$stagingDir = Join-Path $HOME 'Pictures\Continental-Portfolio-Capture-Staging'
New-Item -ItemType Directory -Path $reviewDir -Force | Out-Null
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

$pages = @(
    @{ file = 'overview-desktop.png'; route = '/' },
    @{ file = 'armory-desktop.png'; route = '/armory' },
    @{ file = 'skills-desktop.png'; route = '/skills' }
)

foreach ($page in $pages) {
    $url = "$baseUrl$($page.route)"
    $out = Join-Path $stagingDir $page.file
    Write-Host "Capturing: $url (wait $WaitMilliseconds ms)" -ForegroundColor Cyan

    & npx.cmd --yes playwright@1.64.1 screenshot `
        --browser chromium `
        --viewport-size '1440,900' `
        --wait-for-timeout $WaitMilliseconds `
        $url $out

    if ($LASTEXITCODE -ne 0) {
        throw "Screenshot failed: $url"
    }
    if (-not (Test-Path -LiteralPath $out)) {
        throw "Screenshot missing: $out"
    }
    if ((Get-Item -LiteralPath $out).Length -lt 15000) {
        throw "Screenshot unusually small: $out"
    }
}

$commit = (git rev-parse --short HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git commit.' }
$manifest = @()
foreach ($page in $pages) {
    $source = Join-Path $stagingDir $page.file
    $target = Join-Path $reviewDir $page.file
    Copy-Item -LiteralPath $source -Destination $target -Force
    $manifest += [pscustomobject]@{
        file = $page.file
        route = $page.route
        viewport = '1440,900'
        commit = $commit
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
        demo_data_confirmed = $false
    }
}

$manifestPath = Join-Path $reviewDir 'capture-manifest.json'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, (($manifest | ConvertTo-Json -Depth 5) + "`n"), $utf8)

Write-Host ''
Write-Host 'PASS: New captures saved for review' -ForegroundColor Green
Write-Host "Folder: $reviewDir"
Write-Host 'Review all 3 PNG files at full size. Counts and lists must be loaded.' -ForegroundColor Yellow
Write-Host 'DO NOT publish if any screenshot says Loading, shows a request error, or contains private data.' -ForegroundColor Yellow
Start-Process explorer.exe -ArgumentList $reviewDir
