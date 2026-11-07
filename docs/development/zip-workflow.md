# The Continental — ZIP-based development workflow

## Goal

Keep development in small, source-reviewed slices. Each slice gets its own branch, exact source snapshot, additive/replacement ZIP, PowerShell commands, tests, and explicit merge approval. **A ZIP is a delivery format, not a substitute for Git history.**

## Workflow

1. `git switch main`, `git pull --ff-only origin main`, and confirm clean `git status`.
2. Create a feature branch for the next coherent v0.1 slice.
3. Create/upload a committed source snapshot with `scripts/zip-workflow/Export-ContinentalSource.ps1`. Never share `.env`, live database files, resumes, credentials, or personal evidence.
4. Generate a slice against that **exact source commit**. List files and expected actions (add/replace); include migrations and tests when necessary. Avoid unrelated refactors.
5. Verify branch, commit, clean worktree, and ZIP contents. Future slices use `Install-ContinentalSlice.ps1 -ZipPath <path>` with `continental-slice.json` and SHA256 hashes; extraction is blocked if the source commit, branch or file list differs. Never reset the user's worktree.
6. Run the release-specific API, database, frontend, and UX checks. Read failures before proceeding.
7. For UI slices, capture desktop and mobile screenshots of the real running application with sanitized demo data. Review visually; do not commit private data.
8. Commit and push a descriptively named branch; open a PR. Merge only when CI and manual checks pass.
9. Update the root README/CHANGELOG at **meaningful feature milestones**, and tag releases when the planned acceptance criteria are met.
10. End sessions with a clean working tree and a clear next slice.

## Named terminals

- **DB:** `cd "$HOME\Projects\the-continental"; docker compose up -d postgres`
- **API Server:** `cd "$HOME\Projects\the-continental\apps\api"; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000`
- **Web:** `cd "$HOME\Projects\the-continental\apps\web"; npm run dev`

## Source snapshot

From repository root:

```powershell
.\scripts\zip-workflow\Export-ContinentalSource.ps1
```

This archives **committed tracked files at HEAD**, not uncommitted work or ignored local databases/configuration. Check its contents before uploading. Keep local-only values private.

## Slice manifest (for feature ZIPs after this bootstrap)

The ZIP root contains `continental-slice.json` and only the files declared there. Manifest example:

```json
{
  "schema": "continental.slice.v1",
  "name": "v01-project-relations",
  "branch": "feat/v01-project-relations",
  "base_commit": "<exact full 40-character git SHA>",
  "files": [
    { "path": "apps/api/example.py", "mode": "replace", "sha256": "<file SHA256>" }
  ]
}
```

The installer refuses dirty worktrees, unexpected files, path traversal, mismatched hashes, wrong branches, and stale base commits. **It never runs migrations, tests, commits, or pushes.** The bootstrap archive itself is additive and installs with guarded `Expand-Archive` once; subsequent code slices will use the manifest installer.

## Screenshot capture

Capture only when **demo/sanitized data** are visible. Start **DB**, **API Server**, and **Web** first.

```powershell
npx --yes playwright@1.64.1 install chromium
.\scripts\zip-workflow\Capture-ContinentalScreenshots.ps1 -IConfirmDemoData
```

Defaults: `/` and `/armory`, each at 1440×900 and 390×844, saved under `docs/screenshots/`. Extra routes can be specified with `-Pages @('/', '/armory', '/new-route')` once implemented. Use `-DesktopOnly` or `-MobileOnly` to limit capture. Script checks that the app is reachable and writes a capture manifest. Screenshot generation is **not** visual-regression testing; inspect the results manually.

## Security and data rules

- Migrations must preserve existing evidence. No destructive/reset DB commands without explicit review.
- Use separate sanitized demo data when preparing public screenshots; never automatically publish actual job-search data.
- Protect `.env`, `.env.local`, credentials, personal resumes, and provider tokens.
- Keep the revised UI/UX build plan as the design acceptance standard: loading, success, empty, error; keyboard/focus; responsive behavior; trustworthy provenance.
- A status in documentation must describe what is actually implemented, not planned.

## Next product slice

Complete **v0.1 My Evidence**, starting with Project and Experience entities and their evidence relationships, using the current SQLAlchemy/Alembic/API/frontend patterns. Confirm existing schema and tests from the source snapshot before selecting exact files or migration changes. Then validate v0.1's remaining Profile/Certification requirements, dogfood, screenshot, document, and release.
