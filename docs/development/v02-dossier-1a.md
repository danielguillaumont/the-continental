# v0.2 Dossier / Slice 2A - Opportunity Registry API

**Branch:** `feat/v02-dossier-1a`
**Starting point:** `19c0d5f` (v0.1.0 released, plus README documentation)
**Scope:** additive backend and migration; no frontend destination or AI provider yet.

## Why this exists

Dossier starts from a **saved, source-preserving opportunity**, not an AI response. The record can be useful even if extraction fails. Future extraction and Evidence Match will use the same persisted requirement identities; neither is implemented in this slice.

## Contracts

- `GET /opportunities` - list saved opportunities newest-first (including requirement summaries).
- `POST /opportunities` - create with required `sourceText` (20-100000 characters); optional `title`, `company`, `location`, `employmentType`, `salaryText`, HTTP(S) `sourceUrl`, `technologies`. Returns 201.
- `GET /opportunities/{uuid}` - retrieve saved source, normalized fields, requirements, timestamps and extraction metadata.
- `PUT /opportunities/{uuid}` - replace **only editable metadata**, not original text, requirement IDs or extraction metadata.
- `DELETE /opportunities/{uuid}` - delete the opportunity and its dependent requirements only. Returns 204.
- `POST /opportunities/{uuid}/requirements` - append a required/preferred requirement (201).
- `PUT /opportunities/{uuid}/requirements/{requirement_uuid}` - correct its text, classification or source excerpt without changing ID.
- `DELETE /opportunities/{uuid}/requirements/{requirement_uuid}` - remove that requirement (204).

All routes are documented under **Dossier / Opportunities** at local `/docs` after applying the schema and starting the API.

### Data integrity

- `sourceText` is stored exactly as submitted; metadata PUT cannot overwrite it. Saving a different posting requires a new opportunity.
- Missing title, company, salary, location and employment type remain **null** rather than fabricated.
- Extraction status begins `not_run`; model/provider/prompt fields are null and not writable through user-facing endpoints.
- Requirements have stable UUIDs, positions, `required`/`preferred` classification and optional `sourceExcerpt`.
- Supplied `sourceExcerpt` must be an exact substring of the stored original posting. A freeform correction may omit the excerpt but must not masquerade as a quoted source.
- Requirements belong to exactly one opportunity. Cross-opportunity edits are rejected with 404.
- URL credentials, unsafe URL schemes, unknown JSON fields, blank descriptions and excessive lengths return 422.
- Deleting a requirement does not delete the opportunity. Deleting an opportunity cascades to **its** requirements only, never to career-profile data.
- No AI, matching, web requests, scraping, application decisions, third-party verification or public hosting in this slice.

## Database

Migration `e42d1c8b90a7`, parent `b7c2e49a1d03`, creates `opportunities` and `requirements` and an index on requirement ownership. No other table is altered. **Never downgrade an important database**: the inverse operation drops newly stored Dossier data.

### Deployment gate (local PostgreSQL)

1. Stop API and Web processes if running, check out the intended feature branch and run the disposable test suite first.
2. Use `docker compose up -d postgres`; verify the container is healthy.
3. Create and verify a **custom-format PostgreSQL dump outside this repository** before migration. The dump may contain sensitive career data. Never commit or upload it.
4. Record the current Alembic revision, expected `b7c2e49a1d03`, and existing table row counts **before** upgrade.
5. From `apps/api`, run `& .\.venv\Scripts\python.exe -m alembic upgrade head`; verify current revision becomes `e42d1c8b90a7`.
6. Verify the two new tables are present, older counts unchanged, and initial opportunity/requirement counts zero.
7. If anything fails, stop and diagnose; do not stamp, drop volumes, remove old tables or downgrade.

## Tests

Run from `apps/api`: `& .\.venv\Scripts\python.exe -m pytest tests -q`.

The new test suite uses disposable in-memory SQLite and tests lifecycle, nullability, exact source preservation, required/preferred classification, stable UUIDs, excerpt integrity, cross-record protection, cascade deletion, malformed input, preservation of existing career records and the **real migration code** against a prior-schema database. Expect **48 backend tests** when using the v0.1.0 baseline + this slice.

## Following slices

- **2B**: Dossier sidebar destination, opportunity listing, paste form, details and manual requirement editing.
- **2C**: extraction provider interface and strict `JobExtraction` schema; narrow single-purpose AI extraction, validated output, extraction version metadata, clear failure states.
- **2D**: extraction review/correction flow, source-vs-structured comparison, golden fixture tests.
- **2E**: release validation, CI, README and screenshot update, tag `v0.2.0`.

**Security:** The app remains a local-only, unauthenticated development system. A pasted job may contain identifying or confidential information. Do not publicly deploy it, log personal job text unnecessarily, or commit database dumps.
