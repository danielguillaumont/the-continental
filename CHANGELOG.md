# Changelog

## Unreleased — v0.1 My Evidence

- Added UX Foundation Slice 3B1: a dedicated project detail workspace, clearer project index, reusable create/edit form, and supporting-evidence management with desktop/mobile acceptance checks. Backend routes and database schema unchanged.

- Started UX Foundation Slice 3A: separate Overview, Projects and Evidence in navigation, clarify pages and project/evidence workflow, and extend screenshot capture coverage.

- Added the project registry and project-to-evidence linking workflow.
- Added project CRUD and link/unlink API routes backed by an additive PostgreSQL migration.
- Added a responsive project workspace with loading, empty, error and delete confirmation states.
- Added disposable SQLite integration tests for project integrity and existing evidence CRUD.
- Corrected mobile navigation's release label to v0.1.

This is not a tagged v0.1.0 release: the remainder of the evidence/profile foundation is still in progress.
