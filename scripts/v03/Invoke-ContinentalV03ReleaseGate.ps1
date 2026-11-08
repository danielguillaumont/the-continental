# The Continental v0.3E1 -- non-destructive release acceptance checks.
# Windows PowerShell 5.1. No migrations, seed writes, or review writes.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'DB'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$api = Join-Path $root 'apps\api'
$web = Join-Path $root 'apps\web'
$python = Join-Path $api '.venv\Scripts\python.exe'
$allowedBranches = @('feat/v03-release-3e2b-polish', 'main')
$container = 'continental-postgres'
$opportunityIds = @(
    '5c5827de-cfd4-48bc-9a08-fab046b5826b',
    'cb834bea-00f2-4cd3-9eb7-66fc42b4f6b1',
    'c2868c42-2450-4ac0-8718-1f0a188b9f85'
)

function Assert-Exit([string]$message) {
    if ($LASTEXITCODE -ne 0) { throw $message }
}
function Assert-Http200([string]$route) {
    $response = & curl.exe --noproxy '*' --connect-timeout 3 --max-time 20 `
        --silent --show-error --output NUL --write-out '%{http_code}' `
        "http://127.0.0.1:8000$route"
    $exit = $LASTEXITCODE
    if ($exit -ne 0 -or ($response -join '').Trim() -ne '200') {
        throw "Read-only API check failed: $route (HTTP $response, exit $exit)."
    }
    Write-Host "PASS: GET $route" -ForegroundColor Green
}
function Read-DbSnapshot {
    $sql = @'
SELECT 'certifications|' || count(*) FROM public.certifications
UNION ALL SELECT 'evidence|' || count(*) FROM public.evidence
UNION ALL SELECT 'evidence_reviews|' || count(*) FROM public.evidence_reviews
UNION ALL SELECT 'experiences|' || count(*) FROM public.experiences
UNION ALL SELECT 'opportunities|' || count(*) FROM public.opportunities
UNION ALL SELECT 'profiles|' || count(*) FROM public.profiles
UNION ALL SELECT 'projects|' || count(*) FROM public.projects
UNION ALL SELECT 'requirements|' || count(*) FROM public.requirements
UNION ALL SELECT 'skills|' || count(*) FROM public.skills
ORDER BY 1;
'@
    $rows = @(& docker.exe exec $container psql -X -q -t -A -v ON_ERROR_STOP=1 `
        -U $script:dbUser -d $script:dbName -c $sql)
    Assert-Exit 'Database count query failed. Stop.'
    return @($rows | Where-Object { $_ -match '^[a-z_]+\|\d+$' })
}

Push-Location $root
try {
    Write-Host 'THE CONTINENTAL v0.3E1 -- RELEASE GATE' -ForegroundColor Cyan
    $branch = (& git.exe branch --show-current).Trim()
    Assert-Exit 'Cannot read branch.'
    if ($branch -notin $allowedBranches) { throw "Wrong branch ($branch). Expected v0.3 release branch or main." }
    foreach ($required in @($python, (Join-Path $web 'package.json'))) {
        if (-not (Test-Path -LiteralPath $required)) { throw "Missing dependency: $required" }
    }
    if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) { throw 'curl.exe missing.' }
    if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) { throw 'docker.exe missing.' }

    $dbUser = @(& docker.exe exec $container printenv POSTGRES_USER)
    Assert-Exit 'PostgreSQL container not responding; start DB first.'
    $dbName = @(& docker.exe exec $container printenv POSTGRES_DB)
    Assert-Exit 'Cannot read PostgreSQL database name.'
    $script:dbUser = ($dbUser -join '').Trim()
    $script:dbName = ($dbName -join '').Trim()
    if (-not $script:dbUser -or -not $script:dbName) { throw 'Database credentials not set.' }

    Write-Host 'CHECKING READ-ONLY DATABASE REVISION...' -ForegroundColor Cyan
    $revision = @(& docker.exe exec $container psql -X -q -t -A -v ON_ERROR_STOP=1 `
        -U $script:dbUser -d $script:dbName -c 'SELECT version_num FROM alembic_version;')
    Assert-Exit 'Could not read migration revision.'
    if (($revision -join '').Trim() -ne 'a1d8c4f60e32') {
        throw "Unexpected revision ($revision); STOP. Do not migrate automatically."
    }
    Write-Host 'PASS: review migration a1d8c4f60e32' -ForegroundColor Green

    $before = @(Read-DbSnapshot)
    if ($before.Count -ne 9) { throw "Expected 9 existing table counts; got $($before.Count)." }
    Write-Host 'BEFORE (counts only):' -ForegroundColor Cyan
    $before | ForEach-Object { Write-Host "  $_" }

    Write-Host 'TESTING BACKEND...' -ForegroundColor Cyan
    Push-Location $api
    try {
        & $python -m pytest tests -q
        Assert-Exit 'Backend tests failed.'
        & $python -m compileall -q app migrations\versions
        Assert-Exit 'Python compilation failed.'
    }
    finally { Pop-Location }

    Write-Host 'TESTING FULL FRONTEND...' -ForegroundColor Cyan
    Push-Location $web
    try {
        $tests = @(Get-ChildItem '.\tests\*.test.mjs' -File | Sort-Object Name | ForEach-Object { $_.FullName })
        if ($tests.Count -lt 1) { throw 'No frontend tests found.' }
        & node.exe --experimental-strip-types --test $tests
        Assert-Exit 'Frontend regression tests failed.'
        & npm.cmd run lint -- --max-warnings 0
        Assert-Exit 'ESLint failed.'
        & npm.cmd run build
        Assert-Exit 'Production build failed.'
    }
    finally { Pop-Location }

    Write-Host 'READ-ONLY LIVE API ACCEPTANCE...' -ForegroundColor Cyan
    Assert-Http200 '/health'
    foreach ($id in $opportunityIds) {
        Assert-Http200 "/opportunities/$id"
        Assert-Http200 "/opportunities/$id/evidence-match-preview"
        Assert-Http200 "/opportunities/$id/evidence-review-options"
        Assert-Http200 "/opportunities/$id/evidence-reviews"
    }

    $after = @(Read-DbSnapshot)
    if (($before -join "`n") -ne ($after -join "`n")) {
        Write-Host 'AFTER (counts only):' -ForegroundColor Yellow
        $after | ForEach-Object { Write-Host "  $_" }
        throw 'Database record counts changed during release gate. Investigate before merging.'
    }
    Write-Host 'PASS: all 9 table counts unchanged.' -ForegroundColor Green
    Write-Host 'PASS: v0.3E1 regression and read-only acceptance gate.' -ForegroundColor Green
    Write-Host 'NOTE: This is not a substitute for keyboard/mobile/manual UI review.' -ForegroundColor Yellow
}
finally {
    Pop-Location
}
