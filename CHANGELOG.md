# Changelog

## Unreleased

The next feature release is v0.2 — Dossier. No v0.2 functionality is included in this release candidate.

## v0.1.0 — My Evidence (release candidate)

- Completed the v0.1 career-record foundation across Profile, Experience, Projects, Evidence, Skills and Certifications, including reusable relationships and navigable proof.
- Added a GitHub Actions workflow for backend regression, frontend tests, lint, production build, and production dependency audit.
- Bound the development PostgreSQL published port to localhost instead of all interfaces to reduce accidental network exposure.
- Local release validation (2026-11-07): 38 backend tests, 51 frontend tests, ESLint and Next.js production build passed; npm production audit reported 0 vulnerabilities. The local PostgreSQL schema matched revision `b7c2e49a1d03`.
- Release notes and explicit local-only security limitations are documented in `docs/releases/v0.1.0-rc.md`.

- Added Profile Management Slice 1B: responsive owner-entered professional identity workspace, local-only contact and portfolio links, profile API integration, target role validation, clear unconfigured/error/edit/success states, navigation and frontend regression coverage. No schema or backend changes.

- Added Profile Management Slice 1A (backend only): singleton career profile, validated identity/contact/summary/role targets, additive PostgreSQL migration, and disposable regression tests. No frontend destination, new dependencies, authentication or data seeding. Personal data must remain local until authentication exists.

- Added Certifications Registry Slice 1B: standalone responsive credential inventory/details, create/edit/delete workflows, calendar-based expiry status, Skill/Evidence linking, navigation, and frontend regression checks. No schema or backend changes; credential data and URLs remain owner-entered.

- Added Certification Registry Slice 1A (backend only): standalone credential records, issuer and optional date/URL fields, data-preserving Alembic migration, independent links to existing Skills and Evidence, and disposable API/migration regression tests. No new dependencies or frontend destination. Credential URLs are owner-supplied; issuer verification is not automated.

- Added Skills & Proof Slice 1A: read-only FastAPI skill inventory/detail endpoints based on existing normalized evidence relationships, a searchable/filterable Skills workspace and proof drill-down, status-aware summaries, navigation, and regression tests. No schema migration, new dependencies, or fabricated skill scores.

- Added Experience Registry Slice 1B: dedicated Experience navigation, responsive list/detail and create/edit forms, accomplishments, project/evidence linking, deletion safeguards, and frontend regression checks. No backend or schema changes.

- Added Experience Registry backend foundation: dated roles, employer details, highlights, independent project/evidence links, API CRUD, migration and disposable integration tests. Experience frontend is a subsequent slice.

- Added UX Foundation Slice 3B2: project-aware evidence creation, automatic attachment/return, explicit partial-failure recovery and workflow tests; no backend/schema changes.

- Added UX Foundation Slice 3B1: a dedicated project detail workspace, clearer project index, reusable create/edit form, and supporting-evidence management with desktop/mobile acceptance checks. Backend routes and database schema unchanged.

- Started UX Foundation Slice 3A: separate Overview, Projects and Evidence in navigation, clarify pages and project/evidence workflow, and extend screenshot capture coverage.

- Added the project registry and project-to-evidence linking workflow.
- Added project CRUD and link/unlink API routes backed by an additive PostgreSQL migration.
- Added a responsive project workspace with loading, empty, error and delete confirmation states.
- Added disposable SQLite integration tests for project integrity and existing evidence CRUD.
- Corrected mobile navigation's release label to v0.1.

This is a release candidate, not a tagged v0.1.0 release. Tag only after GitHub Actions and final release review pass.
