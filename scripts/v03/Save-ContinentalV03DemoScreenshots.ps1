# The Continental v0.3E1 -- OPTIONAL local review screenshots.
# Identity guard: fixed fixture IDs + roles, plus explicit human review of actual company names.
# No migrations/seed/review writes. Output stays in Documents, never in Git.
[CmdletBinding()]
param(
    [switch]$InspectOnly,
    [switch]$ConfirmFictionalDemo,
    [ValidateSet('Auto', 'Edge', 'Chrome')]
    [string]$Browser = 'Auto',
    [ValidateSet('All', 'cloud-security', 'application-security', 'platform-reliability')]
    [string]$Only = 'All'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'DB'

if ($InspectOnly -and $ConfirmFictionalDemo) {
    throw 'Choose either -InspectOnly or -ConfirmFictionalDemo, not both.'
}
if (-not $InspectOnly -and -not $ConfirmFictionalDemo) {
    throw 'Run -InspectOnly first. Captures require -ConfirmFictionalDemo and a typed confirmation.'
}

function Get-ApiTextProperty($record, [string[]]$names) {
    foreach ($name in $names) {
        $property = $record.PSObject.Properties[$name]
        if ($null -ne $property -and $null -ne $property.Value) {
            $value = [string]$property.Value
            if (-not [string]::IsNullOrWhiteSpace($value)) { return $value.Trim() }
        }
    }
    return ''
}

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location $root
try {
    $branch = (& git.exe branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'feat/v03-release-3e1') {
        throw 'Wrong branch for 3E1 screenshot capture.'
    }

    # IDs and titles come from the known v0.3 fictional fixture.
    # Do not hardcode made-up company names. Show the actual values to the owner.
    $demos = @(
        @{ id = '5c5827de-cfd4-48bc-9a08-fab046b5826b'; title = 'Cloud Security Engineer'; slug = 'cloud-security' },
        @{ id = 'cb834bea-00f2-4cd3-9eb7-66fc42b4f6b1'; title = 'Application Security Engineer'; slug = 'application-security' },
        @{ id = 'c2868c42-2450-4ac0-8718-1f0a188b9f85'; title = 'Platform Reliability Engineer'; slug = 'platform-reliability' }
    )

    Write-Host 'READ-ONLY: VERIFYING THREE KNOWN DEMO IDS AND JOB TITLES...' -ForegroundColor Cyan
    $identities = @()
    foreach ($demo in $demos) {
        $url = "http://127.0.0.1:8000/opportunities/$($demo.id)"
        $raw = @(& curl.exe --noproxy '*' --connect-timeout 3 --max-time 15 `
            --fail --silent --show-error $url)
        if ($LASTEXITCODE -ne 0) { throw "API lookup failed for $($demo.slug)." }
        try { $record = ($raw -join "`n") | ConvertFrom-Json }
        catch { throw "Invalid API response for $($demo.slug)." }

        $actualId = Get-ApiTextProperty $record @('id')
        $actualTitle = Get-ApiTextProperty $record @('title', 'job_title')
        $actualCompany = Get-ApiTextProperty $record @('company', 'company_name')

        if ($actualId -cne $demo.id) {
            throw "Opportunity ID mismatch for $($demo.slug). No screenshots taken."
        }
        if ($actualTitle -cne $demo.title) {
            throw "Opportunity title mismatch for $($demo.slug). Expected '$($demo.title)'; received '$actualTitle'. No screenshots taken."
        }
        if ([string]::IsNullOrWhiteSpace($actualCompany)) {
            throw "Company field missing for $($demo.slug). No screenshots taken."
        }
        $identities += [PSCustomObject]@{
            Demo = $demo.slug
            JobTitle = $actualTitle
            Company = $actualCompany
            Id = $actualId
        }
    }
    $identities | Format-Table -AutoSize | Out-Host
    Write-Host 'PASS: Fixed demo IDs and titles match; company names require human verification.' -ForegroundColor Green

    if ($InspectOnly) {
        Write-Host 'INSPECTION ONLY: No screenshots taken, no database writes.' -ForegroundColor Green
        return
    }

    Write-Host ''
    Write-Host 'Inspect every COMPANY above. Only continue if ALL THREE entries are fictional demo records.' -ForegroundColor Yellow
    Write-Host 'Do not capture real opportunities or other personal information for public README images.' -ForegroundColor Yellow
    $answer = Read-Host 'Type CAPTURE-FICTIONAL-ONLY to proceed, or press Enter to stop'
    if ($answer -cne 'CAPTURE-FICTIONAL-ONLY') {
        throw 'Capture cancelled; no screenshots taken.'
    }

    $status = @(& curl.exe --noproxy '*' --connect-timeout 3 --max-time 15 `
        --silent --show-error --output NUL --write-out '%{http_code}' `
        'http://127.0.0.1:3000/dossier')
    if ($LASTEXITCODE -ne 0 -or ($status -join '').Trim() -ne '200') {
        throw 'Web server not available at http://127.0.0.1:3000.'
    }

    # Microsoft Edge is available on most Windows 10/11 machines and does not
    # depend on Google Chrome's updater service. Never use the user's normal
    # browsing profile for automated screenshots.
    $browserCandidates = @()
    if ($Browser -ne 'Chrome') {
        $browserCandidates += @(
            @{ name = 'Edge'; path = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" },
            @{ name = 'Edge'; path = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" },
            @{ name = 'Edge'; path = "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe" }
        )
    }
    if ($Browser -ne 'Edge') {
        $browserCandidates += @(
            @{ name = 'Chrome'; path = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" },
            @{ name = 'Chrome'; path = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" },
            @{ name = 'Chrome'; path = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" }
        )
    }
    $captureBrowser = $browserCandidates | Where-Object {
        $_.path -and (Test-Path -LiteralPath $_.path -PathType Leaf)
    } | Select-Object -First 1
    if (-not $captureBrowser) {
        throw "No supported capture browser found (requested: $Browser). Capture is optional; do not change the database."
    }
    Write-Host "Browser: $($captureBrowser.name) (isolated headless session)" -ForegroundColor Cyan

    $captureHelper = Join-Path $PSScriptRoot 'Capture-ContinentalV03Dossier.mjs'
    if (-not (Test-Path -LiteralPath $captureHelper -PathType Leaf)) {
        throw 'Readiness-aware Node capture helper missing. Do not use the old screenshot path.'
    }
    $nodeCmd = Get-Command 'node.exe' -ErrorAction SilentlyContinue
    if (-not $nodeCmd) { throw 'Node.js is required for readiness-aware Dossier captures.' }
    $nodeExecutable = $nodeCmd.Source
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $output = Join-Path ([Environment]::GetFolderPath('MyDocuments')) "Continental-Screenshot-Review\v03e1-$stamp"
    New-Item -ItemType Directory -Path $output -Force | Out-Null
    $logDir = Join-Path $output '_browser-logs'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null

    # Always verify all three identities, even when retrying one failed capture.
    $captureDemos = @($demos)
    if ($Only -ne 'All') {
        $captureDemos = @($demos | Where-Object { $_.slug -ceq $Only })
        if ($captureDemos.Count -ne 1) { throw 'Unknown capture selector. Stop.' }
    }
    Write-Host "Capture scope: $Only" -ForegroundColor Cyan
    $hashes = @()
    foreach ($demo in $captureDemos) {
        $matchingIdentity = $identities | Where-Object { $_.Demo -ceq $demo.slug } | Select-Object -First 1
        if ($null -eq $matchingIdentity) { throw "Verified identity missing: $($demo.slug)" }
        $url = "http://127.0.0.1:3000/dossier/$($demo.id)"
        $filename = Join-Path $output ("v03-$($demo.slug)-desktop.png")
        $stderrLog = Join-Path $logDir "$($demo.slug)-browser-stderr.txt"
        Write-Host "WAITING FOR FULL DOSSIER RENDER: $($demo.slug)" -ForegroundColor Cyan
        # Node 22 provides native WebSocket + CDP; no npm installs required.
        # CDP waits for exact title/company after hydration and loading placeholder removal.
        & $nodeExecutable $captureHelper `
            --browser $captureBrowser.path `
            --url $url `
            --title $demo.title `
            --company $matchingIdentity.Company `
            --output $filename `
            --log $stderrLog
        if ($LASTEXITCODE -ne 0) {
            throw "Dossier did not reach a verified rendered state: $($demo.slug). See $stderrLog"
        }
        if (-not (Test-Path -LiteralPath $filename -PathType Leaf)) {
            throw "Expected screenshot missing: $filename"
        }
        $hashes += (Get-FileHash -LiteralPath $filename -Algorithm SHA256).Hash
    }
    if (@($hashes | Select-Object -Unique).Count -ne $captureDemos.Count) {
        throw 'Screenshot images are not all distinct. Reject capture and inspect manually.'
    }
    Write-Host "PASS: $($captureDemos.Count) rendered Dossier capture(s) complete; review visually before publishing." -ForegroundColor Green

    Write-Host "Screenshots saved locally at: $output" -ForegroundColor Green
    Write-Host 'REVIEW EACH PNG: fictional-only content, full render, readable UI, no sensitive details.' -ForegroundColor Yellow
    Write-Host 'No screenshots were staged or pushed to GitHub.' -ForegroundColor Green
}
finally { Pop-Location }
