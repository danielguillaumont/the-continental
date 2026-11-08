#Requires -Version 5.1
<#
.SYNOPSIS
    Dry-run or safely seed fictional Evidence Match v0.3 demo data.
.EXAMPLE
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo\Seed-ContinentalV03Demo.ps1
.EXAMPLE
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo\Seed-ContinentalV03Demo.ps1 -Apply -IReviewedFictionalData
.NOTES
    Requires PostgreSQL and the local v0.3 FastAPI server already running.
    No existing career/opportunity records are updated or deleted.
#>
param(
    [switch]$Apply,
    [switch]$IReviewedFictionalData
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "DB"
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path
Set-Location -LiteralPath $repo

if ((git branch --show-current).Trim() -notin @("feat/v03-evidence-match-3b", "main")) {
    throw "Expected v0.3 Slice 3B branch or main. Stop."
}

$python = Join-Path $repo "apps\api\.venv\Scripts\python.exe"
$seeder = Join-Path $repo "scripts\demo\seed_v03_demo.py"
if (-not (Test-Path -LiteralPath $python) -or -not (Test-Path -LiteralPath $seeder)) {
    throw "Python environment or seed utility is missing."
}

if (-not $Apply) {
    if ($IReviewedFictionalData) {
        throw "Review flag is only valid with -Apply."
    }
    Write-Host "READ-ONLY DRY RUN - no database changes" -ForegroundColor Cyan
    & $python $seeder --api-base "http://127.0.0.1:8000"
    if ($LASTEXITCODE -ne 0) { throw "Dry run failed; do not apply." }
    Write-Host "PASS: v0.3 demo dry run only" -ForegroundColor Green
    return
}

if (-not $IReviewedFictionalData) {
    throw "Apply requires explicit -IReviewedFictionalData acknowledgment."
}

# Keep unrelated local modifications out of the database workflow. The new
# uncommitted implementation itself is allowed on this feature branch.
if (@(git diff --name-only -- apps/api/app apps/api/migrations).Count -gt 0) {
    throw "Backend application/migration source has changed. Stop."
}

Write-Host "VERIFYING POSTGRESQL AND MIGRATION..." -ForegroundColor Cyan
$containerName = "continental-postgres"
$health = (docker inspect -f "{{.State.Health.Status}}" $containerName).Trim()
if ($LASTEXITCODE -ne 0 -or $health -ne "healthy") {
    throw "Expected healthy existing PostgreSQL container. Start it first."
}

$dbUser = (docker exec $containerName printenv POSTGRES_USER).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($dbUser)) {
    throw "Could not determine PostgreSQL user."
}
$dbName = (docker exec $containerName printenv POSTGRES_DB).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($dbName)) {
    throw "Could not determine PostgreSQL database."
}

$revision = (docker exec $containerName psql -X -q -t -A -v ON_ERROR_STOP=1 `
    -U $dbUser -d $dbName -c "SELECT version_num FROM alembic_version;").Trim()
if ($LASTEXITCODE -ne 0 -or $revision -ne "d39b2a4f7c61") {
    throw "Unexpected database revision: $revision. Do not seed."
}

# Values in this fixed list cannot be influenced by the user or fixture.
$protectedTables = @("profiles", "experiences", "experience_projects", `
    "experience_evidence", "certifications", "certification_skills", "certification_evidence")
$queries = @($protectedTables | ForEach-Object {
    "SELECT '$_' AS table_name, COUNT(*) AS record_count FROM public.$_"
})
$countSql = ($queries -join " UNION ALL ") + " ORDER BY table_name;"
$before = @(docker exec $containerName psql -X -q -t -A -F "|" -v ON_ERROR_STOP=1 `
    -U $dbUser -d $dbName -c $countSql)
if ($LASTEXITCODE -ne 0 -or $before.Count -ne $protectedTables.Count) {
    throw "Could not verify protected career record counts."
}

# Create a timestamped, private, verified PostgreSQL custom-format archive.
$backupDir = Join-Path $HOME "Documents\Continental-Database-Backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$filename = "continental-pre-v03-demo-$stamp.dump"
$containerBackup = "/tmp/$filename"
$hostBackup = Join-Path $backupDir $filename

if (Test-Path -LiteralPath $hostBackup) {
    throw "Backup target already exists; stop."
}

Write-Host "CREATING PRIVATE VERIFIED BACKUP..." -ForegroundColor Cyan
docker exec $containerName pg_dump --username=$dbUser --dbname=$dbName `
    --format=custom --no-owner --no-privileges --file=$containerBackup
if ($LASTEXITCODE -ne 0) { throw "Database backup failed. No seed was applied." }

docker exec $containerName pg_restore --list $containerBackup | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Backup archive validation failed. No seed was applied." }

docker cp "${containerName}:$containerBackup" "$hostBackup"
if ($LASTEXITCODE -ne 0) { throw "Backup copy failed. No seed was applied." }

if ((Get-Item -LiteralPath $hostBackup).Length -lt 100) {
    throw "Backup is unexpectedly small. No seed was applied."
}

$containerShaOutput = @(docker exec $containerName sha256sum $containerBackup)
if ($LASTEXITCODE -ne 0 -or $containerShaOutput.Count -ne 1) {
    throw "Container backup SHA-256 failed."
}
$containerSha = ($containerShaOutput[0] -split '\s+')[0]
$hostSha = (Get-FileHash -LiteralPath $hostBackup -Algorithm SHA256).Hash
if ($containerSha -ne $hostSha) {
    throw "Copied backup SHA-256 does not match. No seed was applied."
}
Write-Host "PASS: Private backup validated: $hostBackup" -ForegroundColor Green

# Make the dry-run visible again just before applying; failures do not write.
Write-Host "FINAL PRE-APPLY DRY RUN..." -ForegroundColor Cyan
& $python $seeder --api-base "http://127.0.0.1:8000"
if ($LASTEXITCODE -ne 0) { throw "Dry-run preflight failed. No seed was applied." }

Write-Host "APPLYING FICTIONAL DEMO RECORDS..." -ForegroundColor Cyan
& $python $seeder --api-base "http://127.0.0.1:8000" `
    --apply --backup-file $hostBackup --backup-sha256 $hostSha
if ($LASTEXITCODE -ne 0) {
    throw "Seed stopped. Keep backup private; rerun a dry run before considering another apply."
}

$after = @(docker exec $containerName psql -X -q -t -A -F "|" -v ON_ERROR_STOP=1 `
    -U $dbUser -d $dbName -c $countSql)
if ($LASTEXITCODE -ne 0) { throw "Could not verify protected tables after seed." }
if (@(Compare-Object -ReferenceObject $before -DifferenceObject $after).Count -gt 0) {
    throw "Unrelated career table counts changed. Preserve backup and inspect."
}

Write-Host ""
Write-Host "PASS: Fictional v0.3 demo seeded and unrelated career table counts preserved" -ForegroundColor Green
Write-Host "Private backup: $hostBackup"
Write-Host "Run without -Apply again to confirm that every fixture item is KEEP."
