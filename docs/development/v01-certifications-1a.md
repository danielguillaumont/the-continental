# v0.1 — Certifications Registry / Slice 1A

**Base commit:** `8232e0ee16891f21b739038757327b6d7b1f4637`
**Branch:** `feat/v01-certifications-1a`
**Scope:** Backend foundation + additive PostgreSQL migration only

## Purpose

A certification is a durable credential record, not an evidence artifact or a self-awarded proficiency score. Keep issuer identity, credential ID/URL, issue and expiration dates, and notes distinct from independently reusable proof. Unknown dates remain `null` rather than inventing a day. The first UI for these objects will follow in Slice 1B.

## Implemented

- `GET /certifications`, `GET /certifications/{uuid}`, `POST /certifications`, `PUT /certifications/{uuid}`, `DELETE /certifications/{uuid}`.
- Owner-entered `name`, `issuer`, optional `credentialId`, HTTP(S) `credentialUrl`, `issuedAt`, `expiresAt`, `description`; validation rejects invalid URLs, empty names, and expiry before issue.
- `POST/DELETE /certifications/{uuid}/skills/{skill_uuid}`: attach/detach existing normalized Skill entities without changing proof coverage or creating skills.
- `POST/DELETE /certifications/{uuid}/evidence/{evidence_uuid}`: attach/detach independent Evidence records without duplicating/deleting evidence.
- Additive migration `9f4c2e71b6a8` creates `certifications`, `certification_skills` and `certification_evidence`, with primary-key constraints, foreign keys, and date-order check.
- Idempotent attach; clear 404s for missing records; cascading relationship cleanup on credential deletion.
- Response returns issuer, date values, linked skills and evidence, timestamps. No computed external verification status.
- Root README and changelog updated to distinguish backend-only work from exposed UI.

## Validation (never run tests against the user's PostgreSQL)

From **API Server**, with development servers stopped:

```powershell
cd "$HOME\Projects\the-continental\apps\api"
& .\.venv\Scripts\python.exe -m pytest tests/test_projects.py tests/test_experiences.py tests/test_skills.py tests/test_certifications.py -q
```

The tests use disposable in-memory SQLite and exercise the real migration on a prior-schema fixture. Before applying the PostgreSQL migration to real data: back up and validate the backup; record counts of existing evidence, projects, experiences, skills and relationship tables. Then `alembic upgrade head`; assert revision `9f4c2e71b6a8`; compare old counts; inspect three new tables; never run downgrade on important data. The migration is additive, but the rollback would drop newly created certification records.

## Deferred to Slice 1B

- Certifications navigation and responsive list/details/create/edit/delete forms.
- Credential expiry / missing-date badges derived from calendar dates (not from fabricated state), optional issuer URL opening, clear owner-entered provenance.
- Existing Skill and Evidence selectors in the credential workspace.
- Frontend automated tests, mobile acceptance, and screenshot review.

## Limits

- A saved credential and a pasted URL do not mean a credential has been authenticated by the issuer. No automated issuer API verification, credential authenticity scoring or automatic skills proficiency claims.
- Existing `/skills` coverage remains exclusively based on saved Evidence verification status, even when a certification refers to that skill.
- No authentication/tenancy, file uploads, third-party integrations, new dependencies, or user-data seeding in this slice.
