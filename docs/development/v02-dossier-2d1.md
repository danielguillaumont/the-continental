# v0.2 Dossier — Slice 2D1 (reviewed approval backend)

Adds `POST /opportunities/{id}/apply-reviewed-extraction` with an explicitly approved, strictly validated selection. **No model provider is called** by this endpoint.

- Requires `confirmApply: true` and an exact SHA-256 of the immutable saved original job posting.
- Takes selected `metadata` (`field`, `value`, `sourceExcerpt`), `technologies` (`value`, `sourceExcerpt`) and `requirements` (`text`, `kind`, `sourceExcerpt`). All excerpts must be verbatim substrings of the original before **any** write.
- Metadata is **fill-empty-only**. Existing manually entered title/company/location/employment type/salary are never overwritten.
- Technology names merge case-insensitively with the 40-item limit; repeated values are skipped.
- Requirements retain stable individual IDs and source excerpts. Equivalent text plus classification is deduplicated (including repeat requests).
- Invalid selected source citations, stale source hashes and malformed requests produce no partial application. A successful request commits once and returns skip/apply counts plus a refreshed Dossier record.
- **Important provenance limitation:** input is user-reviewed browser data, not cryptographically attested model output. Extraction model/provider/status remain untouched. Only requirement excerpts are persisted by the existing schema; citations for accepted metadata and technologies are checked at write-time but are not yet stored for later display.
- Local, unauthenticated single-user development app; do not expose the API publicly.

Run `cd apps/api && python -m pytest tests -q` and `python -m compileall -q app migrations/versions`. No migration or external API key is required.

Next 2D2: add selective approval controls to the 2C2 review UI, require explicit review confirmation, show conflicts and per-item results. After that, strengthen provenance retention and validate an optional live provider before claiming end-to-end AI extraction.
