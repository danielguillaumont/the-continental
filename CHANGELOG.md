# Changelog

## Unreleased — v0.1 My Evidence

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

This is not a tagged v0.1.0 release: the remainder of the evidence/profile foundation is still in progress.
