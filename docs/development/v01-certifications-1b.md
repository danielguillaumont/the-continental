# v0.1 — Certifications Registry 1B (frontend)

## Scope

- Route `/certifications`: searchable credential inventory, expiry-status filtering, count summaries, creation form.
- Route `/certifications/[id]`: credential detail, edit form, deletion confirmation, independent Skill and Evidence attachments and detachments.
- Uses the Certifications 1A API and existing Skills/Evidence endpoints. No database migration or dependency changes.
- Record fields: name, issuer, optional credential ID and URL, issue date, expiration date, description.
- Status from entered dates: expired; expiring within 30 days (inclusive); not expired; no expiration recorded. These statuses are **not issuer verification**.
- Separate loading, empty, error and action-feedback states; responsive layouts and accessible form labels.

## Validation

Run in `apps/web`:

```powershell
npm.cmd run test:navigation
npm.cmd run test:projects
npm.cmd run test:workflow
npm.cmd run test:experiences
npm.cmd run test:skills
npm.cmd run test:certifications
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

For smoke testing, start the existing API on port 8000 and Web on 3000. Open `/certifications`; create a **temporary** credential with dates; open it, edit, link and detach one existing skill and evidence item, then delete the temporary credential. Confirm the original Skill/Evidence records are still present. Test at a narrow viewport if practical.

## Known constraints

- Single-user development application; no authentication or user/tenant isolation yet.
- Credential URLs are supplied by the owner; The Continental does not independently verify issuer status or check for renewals.
- Browser/client date-based status changes on navigation/refresh; no notification scheduling.
- The Skills inventory is evidence-derived. A credential can link an existing skill, but cannot mint a new Skill record by itself.
- Data and relationships are preserved by deleting a certification, apart from the certification's own links.
