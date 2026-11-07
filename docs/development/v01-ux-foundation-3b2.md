# v0.1 UX Foundation — Slice 3B2: Project-Aware Evidence Creation

## Goal

Remove the manual round-trip between a Project and Evidence when recording new supporting proof. The project is the starting point and final destination. Evidence remains an independent, reusable record in the Evidence library.

## Behavior

1. From a saved project, select **Create & attach evidence**. This opens the existing evidence form with `?project=<uuid>`.
2. Project context is restricted to a UUID and verified through `GET /projects/{id}` before showing the form. Invalid/missing project context does not silently create evidence linked to the wrong place.
3. Review and save evidence as usual. Upon successful `POST /evidence`, attach the returned evidence ID via existing `POST /projects/{id}/evidence/{evidenceId}`.
4. After both operations succeed, return to the same project details page, which loads the new relationship.
5. If the POST succeeds but attachment fails, remain on the form and show **Evidence saved; project attachment still needed**, with the saved evidence link and **Retry attachment**. Retry only performs the attachment; it does not send another evidence-creation request.
6. Regular Evidence -> New Evidence and Edit Evidence workflows stay unchanged. No database migration, new API endpoints or new runtime dependencies.

**Recovery boundary:** The saved record remains in the Evidence library even if the user leaves or reloads during partial failure. The one-click retry is available while the form stays open; after leaving, the existing project Attach saved evidence selector can reconnect the record. Full cross-session retry state is not persisted in this slice.

## Windows acceptance

Use **Web** for:

```powershell
npm.cmd run test:navigation
npm.cmd run test:projects
npm.cmd run test:workflow
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

Use **API Server** for its existing backend tests only if backend regression validation is necessary (no backend files changed).

Minimal browser acceptance: create disposable project, use Create & attach evidence, review/save one disposable record, confirm navigation back and one linked record. Delete only disposable test records after verifying the link. Never touch the original evidence in the database.

Test invalid project IDs and the failure recovery via the automated helper tests. Browser-based forced API failure testing is not required to merge this frontend-focused slice.

## Definition of done

Workflow tests and frontend checks pass, project context is accurate, one end-to-end create-and-return flow works, original evidence remains untouched, and PR checks pass. Do not publish screenshots containing real personal data. Root README stays accurate at this milestone.
