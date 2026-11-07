# v0.1 UX Foundation — Slice 3B1: Project Workspace

## Goal

Make Projects feel like a real, usable destination: browse your work, open a project, edit its details, and manage linked supporting evidence without confusing it with an evidence record of kind `project`.

## Change boundaries

- Adds a dedicated client-side project detail route at `/armory/projects/[id]`, using the existing `GET /projects/{id}` API endpoint.
- Reworks `/armory/projects` into a project list with clear states and a single creation path. A newly created project opens its own detail workspace.
- Extracts the create/edit project form for reuse with consistent validation.
- Keeps linking/detaching existing evidence on the project detail page; deleting a project still preserves all evidence.
- Adds route, status and proof-state tests and clearer navigation back to the index and evidence library.
- **No** database migrations, backend changes, automatic linking of newly created evidence, or new third-party dependencies.

## Verification — PowerShell 5.1

In the **Web** tab, from `apps/web`:

```powershell
npm.cmd run test:navigation
npm.cmd run test:projects
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

In the **API Server** tab, from `apps/api` with the existing virtual environment:

```powershell
& .\.venv\Scripts\python.exe -m pytest tests/test_projects.py -q
```

Backend tests here are regression checks; the backend was not modified.

## Browser acceptance (no production/personal screenshots)

1. Desktop: open Projects, check loading/empty states and the new project cards. From a project card, **Open project** must land on a dedicated URL with the correct title.
2. Create a disposable project, check that Save opens that project's detail workspace. Refresh, edit and confirm the persisted name/status; do not edit or delete original evidence.
3. Link one existing evidence record, refresh to check persistence, open its detail, return, then detach. Confirm the record remains in Evidence.
4. Test Cancel on the delete confirmation, then delete only the disposable project. Confirm the project list and original evidence remain intact.
5. Verify the direct detail URL when pasted into a fresh tab; verify a missing UUID shows an understandable error and a return link.
6. Test responsive widths **1440 × 900**, **390 × 844**, **320 × 740**. Inspect project cards, form inputs, summary, evidence selectors and confirmations for overflow and usable touch targets.
7. For evidence created through the generic Evidence form, returning to the project and attaching manually is still necessary. Automatic return-and-link belongs in 3B2.

## Screenshots

The existing screenshot script accepts `-Pages`, but the app must first use sanitized demo data. Project detail URLs include record IDs and should only be captured for disposable, non-sensitive demo projects. Use a private screenshot location for review; inspect every image before considering it for the public README.

## Definition of done

Project index, detail, create/edit, attach/detach, delete, navigation and responsive checks pass, original evidence remains intact, the repo is reviewed, and the PR is merged only after checks pass. No README screenshots are published with real career data.
