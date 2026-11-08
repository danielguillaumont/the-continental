# v0.3E1 — Release acceptance and fictional screenshots

This is the first **v0.3E** release-preparation slice. It adds **only** an opt-in acceptance harness and screenshot capture script; it does not alter app logic, migration state, seeded records, or existing README visuals. It follows `docs/development/v03-evidence-match.md` and the UI/UX-revised build plan.

## Boundaries

- The backend must remain local to `127.0.0.1:8000`. The web app must remain local to `127.0.0.1:3000`. Do not publicly expose this unauthenticated development application.
- Database revision must already be `a1d8c4f60e32`. The gate stops if the revision differs; **it never migrates**.
- The release gate tests backend/frontend code, checks 13 read-only API routes, and compares record counts in nine existing database tables before/after. Count equality is useful but does not prove byte-for-byte DB equality. Run the separate v0.3 manual acceptance checklist as well.
- No tests here create or delete a review or seed records. Prior 3D2 review-cycle tests already covered PUT → revise → DELETE with cleanup.
- The screenshots are optional. They check fixed seeded opportunity IDs and job titles, display the actual company names for an explicit owner confirmation, and only then capture. Never trust guessed company names as a fixture identity check. They are saved under `Documents/Continental-Screenshot-Review/`, not in Git. Screenshots need human inspection for private data, layout, empty states, and loading errors. Prefer a separately seeded demo database when publishing images.

## Prerequisites

1. Branch `feat/v03-release-3e1` with both scripts present.
2. The **DB** terminal has PostgreSQL running (`continental-postgres`).
3. The **API Server** terminal is running FastAPI on 127.0.0.1:8000, **without `--reload`** during release checks.
4. Stop the **Web** development server during the release gate so `next build` does not contend with the `.next` directory. Start it again for screenshots afterward.
5. Python venv and Node dependencies are already installed.

## Run the gate (DB terminal, Windows PowerShell 5.1)

```powershell
cd "$HOME\Projects\the-continental"
& .\scripts\v03\Invoke-ContinentalV03ReleaseGate.ps1
```

It should end in **PASS: v0.3E1 regression and read-only acceptance gate**. Warnings about Node's experimental type stripping may appear; validation errors or failed tests are blockers.

## Optional: reproducible screenshots

Start the **Web** terminal:

```powershell
cd "$HOME\Projects\the-continental\apps\web"
npm.cmd run dev -- --hostname 127.0.0.1
```

Then use the **DB** terminal to inspect the three actual identities first (read-only):

```powershell
cd "$HOME\Projects\the-continental"
& .\scripts\v03\Save-ContinentalV03DemoScreenshots.ps1 -InspectOnly
```

Only when every ID/title/company is confirmed to be fictional, run:

```powershell
& .\scripts\v03\Save-ContinentalV03DemoScreenshots.ps1 -ConfirmFictionalDemo
```

Read the printed identities again and type `CAPTURE-FICTIONAL-ONLY` at the interactive prompt. Any other answer aborts with no screenshots. Do not try to fix a company mismatch by changing or reseeding live records.

Screenshot capture now prefers Microsoft Edge on Windows (`-Browser Edge` can select it explicitly). Edge and Chrome both run with a fresh temporary `--user-data-dir` and with background networking/component updates disabled; the script does not touch the user's everyday browser profile or request administrator rights. The `--virtual-time-budget` flag is intentionally omitted because the Next.js development server runs ongoing client-side tasks. If Edge is absent, `-Browser Auto` falls back to Chrome; `-Browser Chrome` allows an explicit diagnostic test. The current readiness-aware capture has a bounded 75-second deadline per page, including recovery retries. Browser stdout/stderr is written to a private `_browser-logs` directory. In Windows PowerShell 5.1, native browser messages must not be promoted to terminating PowerShell errors. Exit code, PNG existence, size, and signature are checked, but the owner must still visually verify the entire rendered page. If both browsers fail, stop attempting automated captures: they are optional for v0.3E1, and manual fictional-only screenshots are acceptable for review. Never reset the DB or turn off browser security protections (`--no-sandbox`) to make screenshots work. Logs and captures remain private until manually reviewed.

Open the output directory and inspect each PNG. These are rough automated captures, not a declaration that everything is visually correct. The captured UI may depend on client rendering and the current local web server; if Chrome finishes before data loads, do not use that image. Re-run or capture manually after confirming the page is fully loaded. Never publish screenshots containing real names, resume details, URLs with secrets, or non-fictional records.

## Manual UI acceptance before 3E2

1. Dossier cloud-security requirement with candidates, link to Evidence and Project.
2. Distinct `no_linked_evidence` and `no_explicit_skill_tag` states, with no fabricated skill-gap assertion.
3. Saved owner review, edited decision and note, reload persistence, delete/undo, and stale review messaging.
4. `Refresh matches` and `Refresh reviews`, failed API state, timeouts and reconciliation messaging.
5. Keyboard Tab/Enter, focus indicators, mobile layout and long-text wrapping.
6. Inspect original job-posting source and provenance labels; no fake fit percentage or independent verification claim.
7. Confirm existing real database records were preserved; do not delete placeholder data without explicit owner approval.

## 3E2 (next)

Once acceptance/screenshots are reviewed, do the recruiter-first README update, current screenshot gallery, release notes/changelog/CI evidence, then tag **v0.3.0**. Retain historical screenshots lower down; don't headline earlier v0.1 screens. The next roadmap phase after release is **v0.4 Import** (resume and GitHub ingestion with explicit review).

## Windows PowerShell 5.1 Edge exit-code handling (v0.3E1 correction)

A Chromium screenshot process can finish without a populated `Start-Process -PassThru` `ExitCode` value. Never compare that unconditionally with zero: `$null -ne 0` evaluates true in PowerShell. The screenshot script now fails on a *known nonzero* exit code; when the exit code is missing, it verifies the PNG exists, has a valid signature, meaningful size, and usable dimensions before reporting success. A missing PNG or invalid PNG still fails. This does not certify that the page was fully rendered or free of private content; inspect every image before publishing.

If Edge fails to create a PNG, stop repeated headless-browser attempts for v0.3. Open each approved fictional Dossier in your regular browser and capture it using DevTools `Ctrl+Shift+P` > `Capture full size screenshot`, or use the browser screenshot UI. Store the images outside Git (for example under `Documents/Continental-Screenshot-Review/`), examine them for sensitive content and loading placeholders, and only then decide which to publish. Automated capture is optional and must not block the release when the API, tests, and manual review pass.

## v0.3E1 readiness-aware screenshot correction

A successful PNG write **does not** prove that the Next.js client application rendered. The first headless captures were 71,318 bytes each and byte-identical: all showed the transient `Loading the Dossier...` placeholder. These files **failed visual acceptance** and must not be used in README images.

The screenshot tool now calls `scripts/v03/Capture-ContinentalV03Dossier.mjs` (Node.js 22; built-in WebSocket only) to open an isolated Edge/Chrome browser profile through the local Chrome DevTools Protocol. It navigates to the exact fixed opportunity URL, waits until both the API-verified fictional company and job title are present in rendered page text and the loading placeholder has disappeared, double-checks readiness, then takes a full-page screenshot. It fails closed if the required content does not reach a ready state within the bounded deadline. The three screenshots must also have distinct SHA-256 hashes.

No new package dependencies, application-code changes, database writes, Git commits, or migrations are introduced. Browser diagnostic logs and screenshots remain only under the user's Documents folder. Never publish unreviewed images or substitute the previously captured loading-placeholder PNGs. If readiness checks fail, inspect the Dossier in a normal browser and use DevTools full-page capture, then log the automated capture gap as a non-release-blocking issue.

## Full Evidence Match + Human Review readiness gate (v0.3E1 final refinement)

Visual review of the first three **distinct** full-height screenshots found partial hydration: Cloud Security and Platform Reliability still displayed *Finding candidate evidence across saved skill records...*, while Application Security still displayed *Loading saved review decisions...*. The previous guard only checked the Dossier title/company and initial page placeholder, so those screenshots do **not** count as full release visuals.

The CDP helper has a bounded deadline (currently **75 seconds per page**), requiring all of the following simultaneously: the exact API-verified fictional title and company; disappearance of Dossier, candidate-match and saved-review loading messages; and the rendered **With evidence candidates**, **Review needed**, **Requirement navigator**, and **Human review ledger** sections. It confirms stability twice before capture. The checks are specific to the three existing seeded v0.3 Dossiers (which have evidence candidates), **not** a generic policy for legitimate empty-state Dossiers.

If any section is still pending after the limit, capture fails with individual readiness flags and does **not** save or publish a misleading partial screenshot. The browser and API remain local; there are no database writes or application changes. Human review of the three new images is still required for privacy, accessible layout, correctness and mobile/keyboard behavior. The application header/footer may still advertise v0.2.0; release-version copy should be addressed in v0.3E2, not mistaken for a functional screenshot failure.

## v0.3E1 resilient screenshot recovery and diagnostics

During the full-workspace acceptance attempt, Cloud Security captured successfully, but Application Security showed **`matchSummary=false` and `requirementNavigator=false` with no loading indicators**, while the review ledger had loaded. This can occur when the independent Evidence Match preview fetch enters its **`Evidence Match is unavailable`** error state. A timeout alone cannot distinguish slow hydration from this terminal UI error. Do **not** assume the application is fully healthy because the header and review ledger loaded, and do **not** weaken the success criteria to get a PNG.

The screenshot helper now distinguishes a real loading state, a completed workspace, and explicit Evidence Match/review fetch errors. Only in an explicit error state may it invoke the UI's known, read-only recovery controls: **`Try again`** for matches or **`Refresh reviews`** for the ledger. Each action is limited to **two retries per Dossier** and performs only the application's existing GET operations. The capture is accepted only after **both** workspaces are ready for two consecutive checks and the exact fictional Dossier identity still matches. The bounded page deadline is **75 seconds**, including read-only retries. It does not click any review, save, remove, or other data-changing action.

If recovery fails, the helper fails closed and writes `*_browser-stderr.txt` containing the last targeted UI readiness state, retry counters, and loopback API HTTP response statuses. If a fictional Dossier identity had loaded, it also saves an explicitly labeled `*-FAILED-DO-NOT-PUBLISH.png` alongside the log as a **private diagnostic**, not a valid visual proof or README asset. Normal capture PNGs are still written only when all readiness checks pass. Logs and screenshots must remain outside Git; inspect and sanitize before sharing.

Run deterministic, dependency-free tests after installing this patch:

```powershell
cd "$HOME\Projects\the-continental"
node.exe --check .\scripts\v03\Capture-ContinentalV03Dossier.mjs
node.exe --check .\scripts\v03\Capture-ContinentalV03Readiness.mjs
node.exe --test .\scripts\v03\tests\capture-readiness.test.mjs
```

Expected: **9 tests passed** (including mock DOM evaluation of the exact browser readiness expressions and the two safe retry buttons). This validates the local helper logic; it does not prove that Windows Edge or the API will be healthy in every run. For live acceptance, keep the API and Web servers running and run `Save-ContinentalV03DemoScreenshots.ps1 -ConfirmFictionalDemo -Browser Edge`. A persistent error in the UI is a real condition to diagnose from the API Server logs and the private capture logs, not something to bypass in screenshot automation. Never modify production or seeded database records to make a capture pass.

### Faster diagnosis of an individual flaky Dossier

The PowerShell wrapper also accepts `-Only application-security` (or either of the other two known fixture slugs), allowing a single failing Dossier to be retried without running the earlier captures again. **All three** API identities are still checked and the explicit fictional-record confirmation remains mandatory. A one-Dossier diagnostic PASS is not a substitute for a final three-Dossier capture. To test the previously failing page first:

```powershell
& .\scripts\v03\Save-ContinentalV03DemoScreenshots.ps1 -ConfirmFictionalDemo -Browser Edge -Only application-security
```

If that succeeds, perform the ordinary `-Browser Edge` full capture to verify all three. On failure, inspect the private `_browser-logs/application-security-browser-stderr.txt` file in the newly printed run folder and the `*-FAILED-DO-NOT-PUBLISH.png` file (if present), rather than guessing or modifying the database.
