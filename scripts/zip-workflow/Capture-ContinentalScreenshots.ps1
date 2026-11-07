#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://127.0.0.1:3000',
    [string[]]$Pages = @('/', '/armory'),
    [string]$OutputDirectory = '',
    [switch]$IConfirmDemoData,
    [switch]$DesktopOnly,
    [switch]$MobileOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $IConfirmDemoData) {
    throw 'Screenshots may contain private career evidence. Populate the app with sanitized DEMO data, inspect it, then rerun with -IConfirmDemoData.'
}
if ($DesktopOnly -and $MobileOnly) { throw 'Specify at most one of -DesktopOnly and -MobileOnly.' }
if ($BaseUrl -notmatch '^http://(localhost|127\.0\.0\.1)(:\d+)?/?$') {
    throw 'Only a local localhost/127.0.0.1 web address is supported for screenshot capture.'
}

$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $repo 'docs\screenshots'
}
if (-not (Get-Command 'npx.cmd' -ErrorAction SilentlyContinue)) {
    throw 'npx.cmd not found. Install Node.js/npm first.'
}

try {
    $response = Invoke-WebRequest -Uri ($BaseUrl.TrimEnd('/') + '/') -TimeoutSec 12 -UseBasicParsing
    if ([int]$response.StatusCode -ge 400) { throw 'Web app returned HTTP error.' }
}
catch {
    throw "Cannot reach local web app at $BaseUrl. Start the Web terminal first. Details: $($_.Exception.Message)"
}

$playwrightPackage = 'playwright@1.64.1'
$viewports = @()
if (-not $MobileOnly) { $viewports += @{ name = 'desktop'; size = '1440,900' } }
if (-not $DesktopOnly) { $viewports += @{ name = 'mobile'; size = '390,844' } }

if (-not (Test-Path -LiteralPath $OutputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
}
$manifest = @()
$commit = (& git -C $repo rev-parse --short HEAD).Trim()

foreach ($route in $Pages) {
    if ($route -notmatch '^/[a-zA-Z0-9/_-]*$') { throw "Invalid relative route: $route" }
    $slug = if ($route -eq '/') { 'lobby' } else { ($route.Trim('/') -replace '/', '-') }
    $url = $BaseUrl.TrimEnd('/') + $route
    foreach ($viewport in $viewports) {
        $filename = '{0}-{1}.png' -f $slug, $viewport.name
        $output = Join-Path $OutputDirectory $filename
        Write-Host "Capturing $url ($($viewport.name))" -ForegroundColor Cyan
        & npx.cmd --yes $playwrightPackage screenshot `
            --browser chromium `
            --full-page `
            --wait-for-timeout '1200' `
            --viewport-size $viewport.size `
            $url $output
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $output)) {
            throw "Playwright screenshot failed for $url. Run: npx --yes $playwrightPackage install chromium"
        }
        $manifest += [pscustomobject]@{
            file = $filename
            route = $route
            viewport = $viewport.size
            commit = $commit
            captured_at_utc = [DateTime]::UtcNow.ToString('o')
            sha256 = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToLowerInvariant()
            demo_data_confirmed = $true
        }
    }
}

$manifestPath = Join-Path $OutputDirectory 'capture-manifest.json'
$manifest | ConvertTo-Json -Depth 4 | Out-File -FilePath $manifestPath -Encoding utf8
Write-Host "Screenshots saved to: $OutputDirectory" -ForegroundColor Green
Write-Host 'Inspect every generated image before committing or adding it to README.md.'
