#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDirectory,
    [switch]$ConfirmFictionalOnly
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location $root
try {
    $branch = (& git.exe branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'feat/v03-release-3e2b-polish') {
        throw 'Wrong release-polish branch. Stop.'
    }
    if (-not $ConfirmFictionalOnly) {
        throw 'Explicit -ConfirmFictionalOnly is required. Stop.'
    }
    if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) {
        throw 'Capture source directory not found. Stop.'
    }
    $inputRoot = (Resolve-Path -LiteralPath $SourceDirectory).Path
    $outputRoot = Join-Path $root 'docs\screenshots'
    $manifest = Join-Path $outputRoot 'v03-capture-manifest.json'
    $hero = Join-Path $outputRoot 'dossier-v03-evidence-match-hero.png'
    if (Test-Path -LiteralPath $manifest) { throw 'v0.3 manifest already exists. Stop.' }
    if (Test-Path -LiteralPath $hero) { throw 'v0.3 hero image already exists. Stop.' }
    Add-Type -AssemblyName System.Drawing

    $targets = @(
        @{ Name = 'v03-cloud-security-desktop.png'; Company = 'Cedarline Cloud Operations (fictional)'; Route = '/dossier/5c5827de-cfd4-48bc-9a08-fab046b5826b' },
        @{ Name = 'v03-application-security-desktop.png'; Company = 'Harborlight Security Products (fictional)'; Route = '/dossier/cb834bea-00f2-4cd3-9eb7-66fc42b4f6b1' },
        @{ Name = 'v03-platform-reliability-desktop.png'; Company = 'Westhaven Platform Collective (fictional)'; Route = '/dossier/c2868c42-2450-4ac0-8718-1f0a188b9f85' }
    )
    $observed = @()
    foreach ($entry in $targets) {
        $src = Join-Path $inputRoot $entry.Name
        $dst = Join-Path $outputRoot ('dossier-' + $entry.Name)
        if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { throw "Missing capture: $($entry.Name)" }
        if (Test-Path -LiteralPath $dst) { throw "Destination already exists: $dst" }
        $img = [System.Drawing.Image]::FromFile($src)
        try {
            if ($img.Width -lt 1400 -or $img.Height -lt 2200) { throw "Capture too small; possible placeholder: $($entry.Name) $($img.Width)x$($img.Height)" }
            $observed += [pscustomobject]@{
                name = $entry.Name
                source = $src
                destination = $dst
                route = $entry.Route
                company = $entry.Company
                width = $img.Width
                height = $img.Height
                source_sha256 = (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash.ToLowerInvariant()
            }
        }
        finally { $img.Dispose() }
    }
    if (@($observed | Select-Object -ExpandProperty source_sha256 -Unique).Count -ne 3) {
        throw 'The three source screenshots are not distinct. Stop.'
    }
    $observed | Select-Object name,company,width,height,source_sha256 | Format-Table -AutoSize
    Write-Host ''
    Write-Host 'OPEN AND INSPECT ALL THREE SOURCE PNGS BEFORE PROCEEDING.' -ForegroundColor Yellow
    Write-Host 'Confirm: fictional-only identities; v0.3 labels; full Evidence Match and review ledger; no loading/errors or private data.'
    Write-Host 'Only use captures from the current candidate version, not old v0.2 images or placeholder screenshots.'
    $answer = Read-Host 'Type REVIEWED-FICTIONAL-V03 to publish reviewed images (Enter to cancel)'
    if ($answer -cne 'REVIEWED-FICTIONAL-V03') { throw 'Human publication review not confirmed. Stop.' }

    foreach ($item in $observed) { Copy-Item -LiteralPath $item.source -Destination $item.destination }
    # Focused README image: upper portion of the Cloud Dossier, excluding most navigation.
    $cloud = [System.Drawing.Image]::FromFile($observed[0].source)
    try {
        $left = 245
        $top = 88
        $width = $cloud.Width - $left - 25
        $height = [Math]::Min(1800, $cloud.Height - $top - 30)
        if ($width -lt 850 -or $height -lt 1200) { throw 'Insufficient Cloud screenshot area for hero.' }
        $crop = [System.Drawing.Bitmap]::new($width, $height)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($crop)
            try {
                $graphics.DrawImage(
                    $cloud,
                    ([System.Drawing.Rectangle]::new(0, 0, $width, $height)),
                    ([System.Drawing.Rectangle]::new($left, $top, $width, $height)),
                    [System.Drawing.GraphicsUnit]::Pixel
                )
            }
            finally { $graphics.Dispose() }
            $crop.Save($hero, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally { $crop.Dispose() }
    }
    finally { $cloud.Dispose() }

    $items = @()
    foreach ($item in $observed) {
        $items += [ordered]@{
            file = (Split-Path $item.destination -Leaf)
            route = $item.route
            company = $item.company
            width = $item.width
            height = $item.height
            sha256 = (Get-FileHash -LiteralPath $item.destination -Algorithm SHA256).Hash.ToLowerInvariant()
            manually_reviewed = $true
            fictional_demo_confirmed = $true
        }
    }
    $items += [ordered]@{
        file = (Split-Path $hero -Leaf)
        source = 'dossier-v03-cloud-security-desktop.png'
        sha256 = (Get-FileHash -LiteralPath $hero -Algorithm SHA256).Hash.ToLowerInvariant()
        manually_reviewed = $true
        fictional_demo_confirmed = $true
    }
    $document = [ordered]@{
        version = 'v0.3.0-rc'
        captured_at_utc = [DateTime]::UtcNow.ToString('o')
        based_on_commit = (& git.exe rev-parse --short HEAD).Trim()
        note = 'Explicitly fictional local demo, manually inspected after full rendering; not an independently verified career record.'
        images = $items
    }
    [System.IO.File]::WriteAllText($manifest, ($document | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding($false)))
    foreach ($item in $items) {
        Write-Host "PASS: $($item.file) - $($item.sha256)" -ForegroundColor Green
    }
    Write-Host 'PASS: Four reviewed public v0.3 images and manifest prepared. Review git status and gallery tests before commit.' -ForegroundColor Green
}
finally { Pop-Location }
