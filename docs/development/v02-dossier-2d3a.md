# Dossier v0.2 — Slice 2D3A: Durable Source Citations

## Scope

Store **owner-approved, source-checked** excerpt citations for new metadata and technologies accepted through `POST /opportunities/{id}/apply-reviewed-extraction`.

- Add `opportunity_attributions` with `(opportunity_id, kind, field_name, value, source_excerpt, source_sha256, created_at)` and cascade deletion.
- Return `attributions[]` in `GET /opportunities`, `GET /opportunities/{id}`, and approval responses.
- Continue storing requirement citations in each requirement's existing `sourceExcerpt` field; do not duplicate them in the new table.
- A manual opportunity `PUT` that changes a cited field or removes a cited technology **removes** only those stale attribution rows. Merely refreshing or resaving the same value preserves them.
- Approval batches remain explicit, source-fingerprint checked, idempotent, and atomic; manual values always win.
- Existing opportunities and career records remain untouched. Earlier approvals without citations must remain uncited rather than retroactively inventing source evidence.
- Provenance label means **owner reviewed a verbatim excerpt from the saved posting**, not employer-verified, independently validated, or definitively produced by an AI provider.

## Migration / data safety

Revision `d39b2a4f7c61` follows `e42d1c8b90a7`. Back up PostgreSQL and existing table counts before upgrading; keep the backup **outside Git**. The migration adds one table only, without modifying any existing records. Verify before/after counts, schema revision and that the new table starts empty. Never casually downgrade a populated table.

## Validation gates

Offline backend regression tests must pass; tests use SQLite and include the actual additive Alembic migration. On Windows, run `pytest`, Python compilation and `alembic heads` on the feature branch before applying the local PostgreSQL migration. Before release, test the exact preview -> select -> approve -> reopen flow, and if an external provider is enabled, obtain explicit consent and separately validate one real request. No provider key or live usage is necessary for this slice.

## Next

Slice 2D3B: show retained attributions in the Dossier UI and perform controlled full-stack verification (offline first, live provider only if explicitly configured). Then release prep for v0.2.0.
