# v0.1 — Profile Management / Slice 1A

**Base commit:** `8bea4744ee035a92a74ddcf7a2e4a3f3c87e866c`
**Branch:** `feat/v01-profile-1a`
**Scope:** Backend and additive migration only. Profile 1B will implement the UI.

## Purpose

A single owner-entered career identity provides consistent context for future applications and dossiers. It is not itself evidence and never changes the proof relationships underpinning skills, projects, experiences or certifications.

## Working API

- `GET /profile`: returns the saved profile; 404 if no profile exists yet (not a server failure).
- `PUT /profile`: creates or fully replaces the single profile. Repeating PUT updates the same row. No DELETE route.
- Fields: `fullName` (required); `headline`, `professionalSummary`, `location`, `email`, `phone`, HTTP(S) `websiteUrl` / `githubUrl` / `linkedinUrl`, up to 12 normalized `targetRoles`, and optional ISO `availableFrom` date.
- Empty optional plain-text fields become null; blank or invalid names, malformed email, unsafe URL schemes, overlong text, invalid dates and unexpected keys return 422. Target role deduplication is case-insensitive.
- Timestamps: `createdAt` is preserved on updates; `updatedAt` reflects changes. The SQL check constraint restricts profile ID to 1.

## Database and tests

- Migration `b7c2e49a1d03`, parent `9f4c2e71b6a8`, adds only `profiles`. No backfills or changes to existing career tables.
- Run the new test suite and existing API tests using the disposable SQLite environment, **not** live PostgreSQL.
- Before migrating the real database, validate a custom-format `pg_dump` backup and capture existing table counts. Apply `alembic upgrade head`, assert the expected revision, compare the existing table counts, confirm exactly zero profile rows before first user save.
- Never run `alembic downgrade` on important data: its inverse deletes Profile data.

## Acceptance and deferred work

- Automated: absent record / creation / repeated update / optional clearing / validation / single-profile constraint / unrelated career-record preservation / actual additive migration.
- Profile 1B: expose a responsive create/edit Profile UI, handle first-run empty states and network errors, and add frontend tests. No Profile sidebar item in 1A.
- No authentication, tenant isolation, external verification, automatic user imports, or public deployment readiness in this slice. Contact data and URLs are **personal information**; keep the local API behind the developer environment until authentication and access controls are implemented.
