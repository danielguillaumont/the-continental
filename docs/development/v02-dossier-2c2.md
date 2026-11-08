# v0.2 Dossier - Slice 2C2: extraction review interface

**Base:** merged Slice 2C1 (`21f20aa`, PR #17). **Branch:** `feat/v02-dossier-2c2`.

## Implemented

- A review-only AI extraction panel on each `/dossier/[id]` page, visually consistent with the established Continental shell.
- Explicit, *unchecked by default* consent before every `POST /opportunities/{id}/extraction-preview`. Consent is reset immediately after a request starts. Nothing is sent on page load.
- Clear warning that the complete original posting goes to a configured external provider and may incur API charges. No client-side keys.
- An extraction request deadline of 45 seconds (separate from the existing 15-second Dossier CRUD request deadline); a timeout explicitly warns that the provider may still have processed the text.
- Source SHA-256 verification against the saved original posting, ID matching, and defense-in-depth checks for literal source excerpts before displaying results.
- Previewed metadata, technologies and required/preferred qualifications with exact excerpt citations. Missing facts remain unknown.
- Preview is transient in browser state. No approval, save, metadata rewrite, requirement creation, extraction status change, or PostgreSQL migration in this slice.
- Clear disabled-provider (503), timeout, validation error, empty-output and over-limit UX. Manual Dossier intake remains operational.

## Automated validation

Run `npm.cmd run test:dossier`, `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd audit --omit=dev` in `apps/web`.

Offline tests cover source limits, metadata contract, literal excerpt checking, original-source fingerprint comparison, invalid opportunity IDs, and no-findings previews. No live provider traffic is required for these tests.

## Later work

- **2D:** approve, correct, and selectively persist reviewed proposed requirements or metadata with explicit user actions; preserve manual edits, provenance and original posting.
- Real provider testing requires deliberate local configuration following `v02-dossier-2c1.md` and provider billing; this is not required to validate 2C2.
- Do not publish any unauthenticated local instance or share private job postings with a model provider without checking content and consenting.
