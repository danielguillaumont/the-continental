# v0.1 / Project registry — slice acceptance

**Source**: `c86ee83142d1165fb5b8f396af614936e2241596` (after ZIP-workflow merge).
**Branch**: `feat/v01-project-registry`.
**Scope**: Project domain records and an evidence association, *not* experience or certification CRUD, AI, import, authentication or deployment.

## Design / semantics

An `Evidence` record may describe a project, artifact, or work achievement; that is **not** the same as a reusable `Project` entity. A `Project` groups existing evidence items through the `project_evidence` association table. Evidence can be attached to multiple projects. Project deletion and unlinking must not delete the source evidence, skills or audit fields. Historic evidence records remain unchanged, and **no automatic conversion** from `Evidence.kind = project` is attempted.

Project fields: name, summary, optional HTTPS/HTTP repository URL, status (`active`, `completed`, `paused`), created/updated timestamps. Relationships are through UUIDs; duplicate links are idempotent. No AI inference or manufactured verification is used. This is a single-user development build; it is not safe for public multi-user deployment.

## Install and validate on Windows PowerShell 5.1

1. Start with a clean `main` branch at the source commit; create `feat/v01-project-registry`.
2. Install the reviewed manifest ZIP with `scripts/zip-workflow/Install-ContinentalSlice.ps1 -ZipPath ...`. The installer does not run migrations or commit.
3. **DB**: start existing PostgreSQL `docker compose up -d postgres`. Existing Docker volume must be retained.
4. **API Server** (from `apps/api`): activate `.venv`; `python -m pip install -r requirements-dev.txt`; `python -m pytest tests/test_projects.py -q`; `alembic current`, then `alembic upgrade head` and `alembic current`. Upgrading creates `projects` and `project_evidence`; it does not delete existing rows.
5. **Web** (from `apps/web`): `npm ci`; `npm run lint`; `npm run build`; `npm run dev`.
6. **API Server**: launch the existing `uvicorn app.main:app --reload --port 8000` process if it is not running.
7. Open `http://localhost:3000/armory/projects`. Create a project, edit it, link a pre-existing evidence record, open the evidence link, detach it, then delete the project. Verify the evidence still exists under `/armory`.
8. Inspect on desktop and 390px mobile with sanitized data. Capture screenshots only after confirming privacy and reviewing runtime pages. Existing screenshot helper accepts `-Pages @('/', '/armory', '/armory/projects') -IConfirmDemoData`.
9. Review `git diff --check`, `git status`, CI, then commit/push and merge only if runtime checks pass. The README/CHANGELOG now describe this functional milestone.

## Failure / recovery

- If Alembic `current` is not at `1c496c7b1d73` or another expected revision, **stop** and inspect; never stamp/reset the database to force success.
- A failed `alembic upgrade head` needs diagnosis from its original error. Do not automatically downgrade or delete volumes.
- If frontend lint/build fails, stop before merging and share the complete errors. Missing installed dependencies are not evidence of an application bug; install from lockfile first.
- Do not expose personal career records in issue logs, screenshots or public docs.

## Acceptance gates

- Project create/list/read/edit/delete and evidence link/unlink/duplicate-link behavior work.
- Deleting a project leaves the original evidence accessible.
- Errors, loading, empty state, keyboard focus, and responsive UI are usable.
- API project tests pass, migrations run safely, frontend lint/build pass, and manual end-to-end flow succeeds.
- This slice does **not** complete all of v0.1.
