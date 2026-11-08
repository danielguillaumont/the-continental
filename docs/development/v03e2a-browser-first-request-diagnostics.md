# v0.3E2A — Evidence Match browser transport diagnostics

## Why this exists

The v0.3E1 direct API stability probe returned 27 HTTP 200 responses with zero curl failures. In an isolated Chromium screenshot session, the first Evidence Match or human review GET request sometimes failed and a manual read-only retry succeeded. The direct probe does not identify the browser failure mode.

This slice **does not attempt to cure an unverified cause**. It records bounded metadata about exactly three local Dossier GET endpoints in the existing CDP screenshot helper. A successful trace distinguishes HTTP response, network error, cancellation and CORS blocking. Application code and database contents are unchanged.

## Scope

- Existing `Capture-ContinentalV03Dossier.mjs`: attaches a metadata-only CDP event observer and writes its summary to the existing local private diagnostic report.
- New `BrowserRequestDiagnostics.mjs`: filters CDP requests to `http://127.0.0.1:8000` or `http://localhost:8000`, and only `/opportunities/{uuid}/evidence-match-preview`, `/evidence-review-options`, `/evidence-reviews` GET requests.
- New tests: verify path scoping, status/failure recognition, sanitization and bounded trace retention.

The report contains no response/request bodies, full URLs, query strings, credentials, headers or cookies. It may contain fictional Dossier IDs and local errors and **must be treated as private**. Never commit generated reports, screenshots or browser logs.

## Validation

Run `node --check scripts/v03/Capture-ContinentalV03Dossier.mjs` and `node --test scripts/v03/tests/browser-request-diagnostics.test.mjs` before any screenshot capture.

For the first observation, run the existing screenshot script with `-Only application-security` and choose Edge. Confirm all three fictional identities before capturing. The script writes diagnostics beneath `Documents/Continental-Screenshot-Review/<run>/_browser-logs/` even when capture passes.

Look for `Loopback Dossier GET transport diagnostics` in the log:

- `request` followed by `response` with HTTP 200 and `finished`: browser transport succeeded. A UI error then suggests post-response parsing/validation or component state, not a failed HTTP exchange.
- `failed` with `net::ERR_*`, `blockedReason`, `corsError` and `canceled`: identifies browser-level failure metadata.
- HTTP status other than 200: investigate API response/error handling, without copying response bodies.
- Request without a response or finish: request may have been interrupted, timed out, or the observation ended; compare the UI error and API Server log.

Do not adjust API origins, disable browser security, extend the 15-second Dossier timeout, or add automatic retries to application writes without evidence. Use a subsequent focused slice to address an observed cause.

## Release gate

The v0.3E2A diagnostics slice is not itself the v0.3 release. The follow-up should address a demonstrated problem, update stale v0.2.0 UI wording and README visuals, then pass final keyboard/mobile and regression acceptance before tagging v0.3.0.
