# v0.1 — Skills & Proof / Slice 1A

**Base commit:** `a4ef4678e5f3f27e729bf6f8cbbb6e868ef352d3`
**Branch:** `feat/v01-skills-proof-1a`
**Scope:** Backend + frontend read-only skill/proof inspection

## Objective

Expose the skill graph already represented in `skills` and `evidence_skills` without duplicating skill names, changing career records, introducing subjective skill scores, or adding a database migration. Evidence continues to own skill tagging; Skills is an inspection view. The first real consumer of this projection will be the explainable opportunity matching engine.

## Implemented

- `GET /skills`: sorted normalized skills with saved evidence, verified and unverified counts, and derived coverage status.
- `GET /skills/{uuid}`: each supporting record's title, description, kind, recorded status, source label/URL, evidence date, and timestamps.
- `verified`: at least one linked evidence record is marked verified; `unverified`: only unverified proof; `unsupported`: zero evidence links.
- Orphan skill names remain visible as unsupported when their last evidence is deleted or retagged. This makes absence of proof inspectable.
- `/skills` with name search, coverage filtering, counts, empty/loading/error states, and `/skills/[id]` drill-down.
- Skills destination in desktop/mobile navigation; existing Overview, Experience, Projects, and Evidence routes remain unchanged.
- No new write endpoints or database objects. Skills are automatically added/deduplicated by existing Evidence create/update logic.

## Validation

From `apps/api` (uses disposable SQLite tests; never live PostgreSQL):

```powershell
& .\.venv\Scripts\python.exe -m pytest tests/test_projects.py tests/test_experiences.py tests/test_skills.py -q
```

From `apps/web`:

```powershell
npm.cmd run test:navigation
npm.cmd run test:projects
npm.cmd run test:workflow
npm.cmd run test:experiences
npm.cmd run test:skills
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

Manual smoke test with existing data: open Skills, search an existing skill, inspect linked proof and source. Verify a skill with owner-marked verified evidence, a skill with only unverified evidence, and an unsupported orphan if present. Don't delete genuine records for QA. Any relevant new regression fixtures should remain in disposable tests.

## Constraints and deferred work

- This is **not a proficiency score**, AI analysis, certification verification, or third-party attestation. Existing `verified` evidence status is owner-controlled.
- No independent skill CRUD, alias merging, canonical taxonomy, skill confidence ranking, skills-from-experience inference, authentication, or tenant separation in this slice.
- Existing data must remain untouched: no `alembic upgrade`, migration, reset, or seed required.
- Proceed to dedicated certification/profile foundation, then v0.1 release validation. Polish can be grouped separately without blocking technical feature progress.
