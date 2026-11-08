# v0.2 Dossier - Slice 2C1: AI Extraction Preview Backend

**Branch:** `feat/v02-dossier-2c1`

## Scope

Implement the first real model-provider adapter for Dossier extraction, but keep all generated results **review-only**. The opportunity registry and original job text remain authoritative. No model output is silently persisted, no requirement is added automatically, and no schema migration is needed.

### Endpoint

`POST /opportunities/{opportunity_id}/extraction-preview`

Request body (explicit external-data-sharing consent):

```json
{"confirmExternalProcessing": true}
```

The endpoint loads the already-saved original posting (limit: 30,000 characters), requests a structured extraction from the configured provider, validates all fields and exact source excerpts, and returns a draft plus the SHA-256 of the source. The draft has `saved: false` and `reviewRequired: true`. Opportunity extraction status and previous manual records remain unchanged.

A missing, disabled or unsupported provider returns HTTP 503. Invalid or ungrounded model responses fail with HTTP 502; an oversized source is rejected with HTTP 413; a missing saved opportunity returns HTTP 404 when the extractor is available. No automatic retry is performed, to avoid accidental cost multiplication.

### Local configuration - optional

The provider is **disabled by default**, so backend tests work without external access or API charges. To enable later for explicitly authorized requests, configure these values in the existing repository-root `.env` (which must stay ignored by Git):

```dotenv
CONTINENTAL_EXTRACTION_PROVIDER=openai
CONTINENTAL_EXTRACTION_MODEL=gpt-4.1-mini
OPENAI_API_KEY=YOUR_KEY_HERE
```

Set an available structured-output-capable model for your API account; the model above is only an example. **An OpenAI API key and paid API access are separate from a ChatGPT subscription.** Never paste the real key into chats, screenshots or commit it to the repository. The API sends the posting to the provider only when the consented endpoint is explicitly invoked; it sets `store: false` on the Responses API request, but provider data processing is still subject to the provider's policies. Do not use sensitive real postings or personal career details for preliminary tests.

The provider uses the Responses API with strict JSON Schema and checks the returned content again using Pydantic and literal source-substring validation. A refusal, incomplete generation, timeout or invalid response returns a safe error without echoing the API key or source text. No new third-party Python dependency is added.

### Validation

- `cd apps/api`
- `./.venv/Scripts/python.exe -m pytest tests -q` (Windows PowerShell)
- `./.venv/Scripts/python.exe -m compileall -q app migrations/versions`

The new 2C1 offline tests fake the provider and assert consent, grounding, failure handling, JSON-schema closure, a `store:false` request, and database immutability. **Live paid API integration is not verified by those tests.**

### What follows

- 2C2: review interface for the returned draft; explicit operator approval before data is applied
- 2D: durable extraction/review lifecycle, correction tracking and idempotent acceptance
- v0.3: evidence-grounded requirement matching, not part of v0.2 extraction
