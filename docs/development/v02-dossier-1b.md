# Dossier v0.2 - Slice 2B / Workspace

**Starting point:** Slice 2A merged as PR #15 (`c65fadb` on feature branch).
**Feature branch:** `feat/v02-dossier-1b`.

## Scope

Frontend-only workflow using the existing `/opportunities` and nested requirement endpoints. No backend migration or AI extraction; preserves the v0.1 evidence model.

- `/dossier`: responsive opportunity registry with search, empty/loading/error and manual-extraction status.
- `/dossier/new`: paste full job text and enter optional metadata, then save the unmodified text.
- `/dossier/[id]`: inspect original text alongside structured details; edit metadata without changing source; create/update/delete required and preferred requirements, with exact excerpt validation; delete Dossier with confirmation.
- Desktop and mobile sidebar get an independent Dossier destination.
- UI reflects truth: manual intake only, no ranking, match scores, or claims of automatic verification.

## Regression

- `npm.cmd run test:dossier` and `npm.cmd run test:navigation`
- All remaining frontend scripts, ESLint, production build and production dependency audit.
- Manual API/Web smoke: add a fictional posting, edit fields and requirements, refresh, confirm source remains identical, and delete the test record.
- PostgreSQL should already be at `e42d1c8b90a7`; do not run migrations or restore backups for this slice.

## Follow-up

Slice 2C introduces a validated, provider-abstracted AI extractor. Do not imply extraction exists until implemented and tested.
