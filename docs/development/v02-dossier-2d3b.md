# Dossier v0.2 — Slice 2D3B: Citation Display & Offline Integration

## Goal

Close the gap between durable server-side `attributions[]` (2D3A) and what the owner can inspect in the Dossier detail page. Validate preview -> deliberate selective approval -> reload against the actual application API, without a paid or real provider call.

## Changes

- Show **saved, owner-approved** metadata and technology citations beneath the Dossier's technologies, with verbatim excerpts and a jump to the immutable original posting.
- Verify the original posting's SHA-256 fingerprint via browser Web Crypto before showing citation claims. Hide an item if its value, field, exact excerpt, or fingerprint no longer matches what the current Dossier displays. No retroactive citations are manufactured for older entries.
- Preserve each saved requirement's existing `sourceExcerpt` in its own requirements panel; it is not duplicated in `opportunity_attributions`.
- Correct outdated approval disclosure text to accurately say that newly approved metadata/technology citations are persisted. These citations represent owner review, **not** independent employer or model verification.
- Add tests for valid/invalid/stale citation rendering rules and an offline, disposable FastAPI integration sequence that exercises opt-in preview, explicit selective approval, retrieval, repeat approval, stale preview rejection, and cleanup after manual edits.

## Validation

- Backend suite expected: **92 tests** (89 existing + 3 new full-API integration tests). SQLite / stubbed extractor; no network or real account data.
- Frontend suite expected: **92 tests** (87 existing + 5 new citation tests). Run all eight frontend test scripts plus ESLint, production build, and `npm audit --omit=dev` in the user's Windows workspace.
- Verify existing local Alembic revision stays at `d39b2a4f7c61` and the `opportunity_attributions` table still exists. **No migration** is introduced by 2D3B.
- Visually inspect the Dossier's citation panel using a fictional, locally saved record **after** integration; do not claim a live provider is verified from a stub test.

## Safety and scope

- Original posting remains immutable; manual metadata is never overwritten by a reviewed approval.
- Do not enable the AI provider by default. A real OpenAI call requires separate API billing, explicit user opt-in, local-only key configuration, and consent for the specific non-sensitive fictional posting.
- Tests run against disposable SQLite databases and mocked extraction; they do not edit or upload real Dossier records. No new Python/npm dependencies or PostgreSQL migration.
- In the absence of a real-provider test, describe AI extraction as *implemented with an offline-tested contract*, not as live end-to-end verified.

## Next

Slice 2E: final Windows regression, a narrow browser smoke check, deliberate optional live-provider integration gate, release documentation, CI review, and tag `v0.2.0` only after gating claims honestly.
