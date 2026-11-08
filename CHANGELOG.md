# Changelog

## Unreleased

- Slice 2D3B: displayed persisted owner-approved metadata/technology citations in the Dossier, checked original-text SHA-256 and citation/value consistency before presentation, updated approval disclosures, and added offline full-API preview/approval/reload regressions plus frontend provenance tests. No migration, new dependency, or live model request.

- Slice 2D3A: added additive owner-reviewed source attribution records for approved metadata and technologies, exposed on Dossier API reads. Manual edits invalidate outdated citations; requirements continue to retain their own excerpts. Existing data is never retroactively labeled with invented citations, and no live AI verification is claimed.

- Slice 2D2: added opt-in selection and correction of individual AI preview suggestions, source-checked approval confirmation, guarded apply API integration, manual conflict visibility, result summaries, and uncertain-write recovery. No new provider configuration, migration or dependencies.

- Slice 2D1: added a source-fingerprint-checked, explicitly approved selection API for opportunity metadata, technologies and requirements. Existing manual values are preserved, duplicate requirements are skipped, and invalid citations reject the entire batch. No migration or model call.

- Slice 2C2: added an explicit-consent, review-only AI extraction panel in each Dossier, with source fingerprint verification, exact supporting excerpts, disabled-provider and timeout states, plus offline frontend tests. No draft persistence, database migration, or new dependencies.

Slice 2C1: added opt-in AI extraction previews for saved Dossier postings, an optional OpenAI Responses provider, strict grounded-output validation, refusal and failure handling, and offline API/provider tests. Previews do not modify opportunities or requirements; the provider is disabled without local configuration. No migration or additional dependency.

Slice 2B: added the responsive Dossier opportunity registry, paste-and-save intake, manual metadata editing, read-only original source, required/preferred requirement management, confirmation flows, and new navigation/API/frontend regression tests. No further backend migration, AI extraction, or match score.

Started v0.2 Dossier Slice 2A: additive Opportunity/Requirement schema, source-preserving API, required/preferred editable requirements, provenance validation, and disposable integration/migration tests. AI extraction and UI are later slices.

## v0.1.0 — Career Record Foundation (released 2026-11-07)

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

v0.1.0 was tagged and released after backend/frontend CI checks passed.
