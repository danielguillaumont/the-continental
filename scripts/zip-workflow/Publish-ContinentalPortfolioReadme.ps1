[CmdletBinding()]
param(
    [switch]$IReviewedScreenshots
)

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'DB'
$root = Join-Path $HOME 'Projects\the-continental'
Set-Location -LiteralPath $root

if (-not $IReviewedScreenshots) {
    throw 'Inspect the screenshots at full resolution and confirm public-sharing safety before using -IReviewedScreenshots.'
}
if ((git branch --show-current).Trim() -ne 'docs/v010-readme-release') {
    throw 'Wrong branch; expected docs/v010-readme-release.'
}

$reviewDir = Join-Path $HOME 'Pictures\Continental-Portfolio-Review'
$destDir = Join-Path $root 'docs\screenshots'
$manifestPath = Join-Path $reviewDir 'capture-manifest.json'
$readmePath = Join-Path $root 'README.md'
$publicNames = @('overview-desktop.png', 'armory-desktop.png')
$expectedNames = @('overview-desktop.png', 'armory-desktop.png', 'skills-desktop.png')

foreach ($path in @($readmePath, $manifestPath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Required file missing: $path"
    }
}

# Windows PowerShell 5.1: the pipeline form of ConvertFrom-Json can retain
# the JSON array as ONE pipeline item. Deserialize with -InputObject and
# explicitly iterate over the decoded array instead.
$raw = [System.IO.File]::ReadAllText($manifestPath)
$decoded = ConvertFrom-Json -InputObject $raw
$manifest = New-Object System.Collections.ArrayList
foreach ($entry in $decoded) {
    [void]$manifest.Add($entry)
}
if ($manifest.Count -ne 3) {
    throw "Expected three capture entries; found $($manifest.Count). No files changed."
}

$seen = @{}
$selected = New-Object System.Collections.ArrayList
foreach ($entry in $manifest) {
    $name = [string]$entry.file
    if ($expectedNames -notcontains $name) {
        throw "Unknown capture manifest filename: $name"
    }
    if ($seen.ContainsKey($name)) {
        throw "Duplicate capture manifest filename: $name"
    }
    $seen[$name] = $true
    $sourcePath = Join-Path $reviewDir $name
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Screenshot missing: $sourcePath"
    }
    if ((Get-Item -LiteralPath $sourcePath).Length -lt 15000) {
        throw "Screenshot is unexpectedly small: $sourcePath"
    }
    $actualHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne ([string]$entry.sha256).ToLowerInvariant()) {
        throw "Screenshot checksum mismatch: $name. Recapture before publishing."
    }
    if ($publicNames -contains $name) {
        [void]$selected.Add([pscustomobject]@{
            file = $name
            route = [string]$entry.route
            viewport = [string]$entry.viewport
            commit = [string]$entry.commit
            captured_at_utc = [string]$entry.captured_at_utc
            sha256 = $actualHash
            public_sharing_reviewed = $true
            demo_data_confirmed = [bool]$entry.demo_data_confirmed
        })
    }
}
foreach ($name in $expectedNames) {
    if (-not $seen.ContainsKey($name)) {
        throw "Missing entry in capture manifest: $name"
    }
}
if ($selected.Count -ne 2) {
    throw 'Expected exactly two approved screenshots.'
}

$content = [System.IO.File]::ReadAllText($readmePath)
if ($content -notmatch '(?m)^# The Continental\s*$') {
    throw 'Unexpected README title. No changes made.'
}
$nl = if ($content.Contains("`r`n")) { "`r`n" } else { "`n" }
$gallery = @'
<!-- continental-portfolio:begin -->
## See it in action

The Continental turns career evidence into structured, inspectable records. These screenshots are from the **v0.1.0 Career Record Foundation** running locally.

### Overview workspace

[![The Continental Overview workspace](docs/screenshots/overview-desktop.png)](docs/screenshots/overview-desktop.png)

### Evidence library

[![The Continental Evidence library](docs/screenshots/armory-desktop.png)](docs/screenshots/armory-desktop.png)

Evidence records can be reused across projects, experiences, certifications and skills without duplicating the originals. Verification labels are owner-entered, not independent assessments.

### What v0.1.0 delivers

- **Profile:** persistent professional identity, career direction and portfolio links.
- **Experience:** employment, engagements, accomplishments, linked projects and evidence.
- **Projects:** structured project records with attach/detach evidence workflows.
- **Evidence:** searchable records with sources, verification labels and skills.
- **Skills:** an evidence-derived inventory with inspectable supporting records.
- **Certifications:** credential metadata, date-aware status, linked skills and evidence.

**Engineering:** FastAPI, PostgreSQL, SQLAlchemy, Alembic, Next.js, React, TypeScript, regression tests, and GitHub Actions CI. Release checks included **38 backend tests and 51 frontend tests**, plus ESLint, a production build, and a production-dependency audit.

**Release:** [v0.1.0 — Career Record Foundation](https://github.com/danielguillaumont/the-continental/releases/tag/v0.1.0) · **Next:** v0.2 Dossier — structured opportunity records from supplied job-posting text.

> **Scope:** local, unauthenticated, single-user development milestone. Not publicly hosted; no login, tenant isolation, AI matching or independent credential verification. Do not publicly deploy this API or database with personal data.
<!-- continental-portfolio:end -->
'@
$gallery = $gallery.Replace("`r`n", "`n").Replace("`n", $nl).Trim()
$startMarker = '<!-- continental-portfolio:begin -->'
$endMarker = '<!-- continental-portfolio:end -->'
if ($content.Contains($startMarker)) {
    $startIndex = $content.IndexOf($startMarker)
    $endIndex = $content.IndexOf($endMarker, $startIndex)
    if ($endIndex -lt 0) {
        throw 'An existing portfolio gallery is missing its closing marker. Stop.'
    }
    $content = $content.Substring(0, $startIndex) + $gallery + $content.Substring($endIndex + $endMarker.Length)
} else {
    $statusHeading = [regex]::Match($content, '(?m)^## Current Status\s*$')
    if (-not $statusHeading.Success) {
        throw 'Cannot find README Current Status section. Stop.'
    }
    $content = $content.Substring(0, $statusHeading.Index) + $gallery + $nl + $nl + $content.Substring($statusHeading.Index)
}

# Replace obsolete release-candidate language, retaining the detailed README.
$content = $content.Replace(
    '**v0.1.0 — My Evidence (release candidate; not tagged yet).**',
    '**v0.1.0 — Career Record Foundation (released November 7, 2026).** [GitHub Release](https://github.com/danielguillaumont/the-continental/releases/tag/v0.1.0).'
)
$content = $content.Replace(
    'The next step is release readiness, not new functionality.',
    'The next milestone is v0.2 — Dossier, starting with structured job opportunity records.'
)
$content = $content.Replace('### Release readiness', '### v0.1.0 release validation')
$content = $content.Replace(
    'GitHub Actions CI and a final clean-checkout review are the remaining release gates.',
    'Both GitHub Actions CI jobs passed on the v0.1.0 release commit.'
)

# Match the existing Overview table row without depending on spacing.
if ($content -notmatch '(?m)^\|[^\r\n]*\*\*Profile\*\*') {
    $overviewRow = [regex]::Match($content, '(?m)^\|[^\r\n]*\*\*Overview\*\*[^\r\n]*\r?\n')
    if (-not $overviewRow.Success) {
        throw 'Cannot find Overview row in product-area table. Stop.'
    }
    $offset = $overviewRow.Index + $overviewRow.Length
    $content = $content.Substring(0, $offset) + '| **Profile** | Professional identity, career direction and portfolio links |' + $nl + $content.Substring($offset)
}

# All checks passed; now write README and ONLY the two approved images.
New-Item -ItemType Directory -Path $destDir -Force | Out-Null
foreach ($name in $publicNames) {
    Copy-Item -LiteralPath (Join-Path $reviewDir $name) -Destination (Join-Path $destDir $name) -Force
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($readmePath, $content, $utf8)
$manifestJson = ConvertTo-Json -InputObject @($selected.ToArray()) -Depth 6
[System.IO.File]::WriteAllText((Join-Path $destDir 'capture-manifest.json'), ($manifestJson + $nl), $utf8)

$notes = @'
# Public portfolio screenshots

These screenshots were captured from The Continental v0.1.0 running locally at 1440x900. They are not a hosted demo.

- `overview-desktop.png` - Overview workspace
- `armory-desktop.png` - Evidence library
- `capture-manifest.json` - Capture routes, commit, timestamps, SHA-256 checksums and manual public-sharing review flags

Before publishing, inspect each screenshot for personal data, sensitive details, misleading records and loading/error states. A manual public-sharing review does **not** establish that records are synthetic or independently verified. Source files are never copied from PostgreSQL into this directory.

To recapture, use `scripts/zip-workflow/Capture-ContinentalPortfolioReady.ps1` with local API Server and Web running. It writes into `~/Pictures/Continental-Portfolio-Review` before images are selected for publication.
'@
[System.IO.File]::WriteAllText((Join-Path $destDir 'README.md'), ($notes.Trim() + $nl), $utf8)

& git diff --check
if ($LASTEXITCODE -ne 0) {
    throw 'Git whitespace check failed; inspect diff before committing.'
}

Write-Host ''
Write-Host 'PASS: Published-ready README and TWO screenshots prepared locally.' -ForegroundColor Green
Write-Host 'Skills screenshot intentionally excluded because its inventory contains test-like labels.' -ForegroundColor Yellow
Write-Host 'The published v0.1.0 release tag and application/database code were not changed.'
& git diff --stat -- README.md
& git diff -- README.md
& git status --short --branch
