# v0.1 / Experience Registry — Slice 1B (frontend workspace)

**Base commit:** `5f82ba44c1d62900babdf03cc27ba07d92545b01`
**Branch:** `feat/v01-experience-registry-1b`
**Scope:** Existing Experience CRUD/link API connected to new Next.js screens. No schema migrations, new packages, authentication, AI, or deployments.

## User experience

- Dedicated **Experience** navigation destination at `/experiences`, between Projects and Overview's other career record sections. The legacy `/armory` and `/armory/projects` routes remain unchanged.
- Career history index: current/previous role labels, employment type, date period, optional location, related-record count, and search of employer/title/location. Empty, loading, and API error states included.
- Add/edit experience in a shared form. Organization, title, start date, and a meaningful description required. Optional employment type, location, end date, and up to 12 line-separated accomplishments. Current role means `endDate: null`.
- Each Experience has a detailed workspace at `/experiences/[id]`, covering responsibilities, accomplishments, linked Projects, linked Evidence, and a deliberate delete confirmation.
- Project and evidence associations link *existing* source records. Detaching or deleting an Experience never deletes original Projects/Evidence. Add/edit payloads match the existing 1A API exactly.
- Important distinction: an Experience record is independent of older `Evidence.kind = "experience"` artifacts; existing data is preserved.

## Validation plan

1. Install guarded ZIP from a clean local branch at the expected base commit. Verify `git diff --check` and inspect changed files.
2. In **Web**, run `npm.cmd run test:navigation`, `npm.cmd run test:projects`, `npm.cmd run test:workflow`, and `npm.cmd run test:experiences` (25 tests in total), then `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd audit --omit=dev`.
3. In **DB**, ensure existing PostgreSQL is healthy; the `6b7e3a91c4d2` migration has *already been applied* in 1A. Do not re-run it solely for this frontend slice.
4. Start **API Server** (`.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000`) and **Web** (`npm.cmd run dev`) only after terminal validation.
5. Short manual acceptance: add one disposable Experience, edit an accomplishment, link existing Project/Evidence if available, detach, delete just the disposable Experience, and confirm original source record remains. Do not delete the two real Evidence records. Screenshots optional, for QA; don't commit personal career data.
6. Review staged change list and documentation, then commit/push PR after validation. Do not claim end-to-end tests were run by Node helper tests alone.

## Known limits and next slice

- No automatic project/evidence creation from an Experience; links are to saved records only. This keeps the new workflow small and explicit.
- No profile, certifications, or bulk-import work in this slice.
- Error/retry behavior, accessibility, and responsive screens should receive manual acceptance before merge; browser end-to-end automation is deferred to 1C.
- Local single-user development only. The API has no authentication or tenant isolation; do not publicly expose it.
