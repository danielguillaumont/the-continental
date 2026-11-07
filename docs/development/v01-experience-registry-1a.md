# v0.1 / Experience Registry — Slice 1A (backend foundation)

**Base commit:** `d9184372b46dbaefc7b15e00cc0a1daed7133a22`
**Branch:** `feat/v01-experience-registry-1a`
**Scope:** Additive schema, model, API, tests. No Experience UI, auth, deployment, AI, or automatic data import.

## Product model

`Experience` represents a real employment/engagement record. It is distinct from `Evidence.kind = "experience"`: that legacy evidence stays untouched. Required: organization, title, start date, description. Optional: employment type, location, end date (null = ongoing), up to 12 accomplishments (each 3–300 characters). Date validation rejects end dates before start dates. The API stores only user-supplied facts; no AI-inferred claims or inflated verification.

Many-to-many links: `experience_projects` and `experience_evidence`, with idempotent attach, explicit detach, cascade of link rows only. Deleting an Experience never deletes its linked Projects or Evidence. Deleting a linked Project/Evidence removes its links while leaving Experience intact. This is local single-user development code; it is not safe to publicly expose as a multi-user service.

## Routes (FastAPI docs at localhost:8000/docs)

- `GET/POST /experiences`
- `GET/PUT/DELETE /experiences/{experience_id}`
- `POST/DELETE /experiences/{experience_id}/projects/{project_id}`
- `POST/DELETE /experiences/{experience_id}/evidence/{evidence_id}`

Payload example (data is fictional):

```json
{
  "organization": "Example Labs",
  "title": "Security Analyst",
  "employmentType": "internship",
  "location": "Remote",
  "startDate": "2025-05-01",
  "endDate": "2025-08-31",
  "description": "Investigated issues and documented mitigation evidence.",
  "highlights": ["Reduced investigation turnaround through reporting automation"]
}
```

## Windows acceptance (do not commit before these pass)

1. Install guarded ZIP on clean expected branch; inspect `git diff --check`.
2. Run **API Server**: `& .\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt` if needed, then `& .\.venv\Scripts\python.exe -m pytest tests/test_projects.py tests/test_experiences.py -q` from `apps/api`. Tests use disposable in-memory SQLite; **not** local PostgreSQL.
3. In **DB**, ensure PostgreSQL is healthy; make and validate a fresh `pg_dump -Fc` backup to Documents outside repository. Check current revision `8d2e7af4c9b1` and existing row counts before proceeding.
4. In **API Server** from `apps/api`, run `& .\.venv\Scripts\python.exe -m alembic upgrade head`. Do **not** downgrade, stamp, or delete the Docker volume. Expect new revision `6b7e3a91c4d2`.
5. Confirm original evidence/projects untouched with before/after counts; optionally inspect local FastAPI `/docs`. No Web server or screenshot work for this backend-only slice.
6. Review Git diff, README, migration and tests; only then stage and commit the reviewed feature PR.

## Failure handling

- If Alembic current isn't expected or migration fails: **stop**, save full logs and investigate. Do not force the revision with `stamp` or reset the DB.
- If test failures happen: stop. In-memory tests exercise API behavior and the actual migration, but cannot substitute for PostgreSQL migration verification.
- ZIP installer never runs a migration or executes application code automatically.
- Existing evidence, projects and skills must remain intact; never test destructive endpoints against personal records.

## Next slice

Create Experience screens using the existing charcoal-and-gold visual system, with a dedicated Experience destination, list/detail/create/edit forms, responsive behavior, and proof linking; then add automated UI tests.
