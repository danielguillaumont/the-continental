# v0.1 — Profile Management 1B (frontend)

## Scope

- `/profile` is a dedicated Profile destination in desktop and mobile navigation.
- It uses the existing Profile 1A `GET /profile` and `PUT /profile` endpoints without changing the database.
- Unconfigured profiles (GET 404) display a blank creation form; other failures display an error and retry action.
- Owner-entered fields: full name, headline, summary, location, contact details, website, GitHub, LinkedIn, target roles, and available-from date.
- A persisted profile has a read-only overview with an explicit edit action. Saving updates the single profile; there is no delete or public publishing workflow.
- Trimmed strings, deduplicated target roles, URL scheme checks, optional date checks, and field lengths mirror the API contract.
- Only safe HTTP(S) profile links become clickable; links open with `noopener noreferrer`.
- Loading, empty, error, editing, saving, and success feedback states are present.

## Testing

In `apps/web`:

```powershell
npm.cmd run test:navigation
npm.cmd run test:profile
npm.cmd run test:projects
npm.cmd run test:workflow
npm.cmd run test:experiences
npm.cmd run test:skills
npm.cmd run test:certifications
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

With the existing PostgreSQL database and API running, open `/profile` in the local browser. An unconfigured profile should show a blank form. Use disposable **non-personal** data during QA, save, verify the overview, edit and save again, refresh and confirm persistence. Check browser narrow viewport; no existing records should change. Real profile information may be added later, after local-only validation.

## Constraints

- Single-user local development application. No authentication, access control, user/tenant isolation or public profile endpoint. **Do not expose the API or actual personal profile data to the public internet.**
- No file uploads, resume generation, AI, or automatic third-party verification in this slice.
- No new backend endpoints, migrations or production dependencies.
- Previous Profile 1A backend integration tests remain relevant; run before v0.1 release tagging.
