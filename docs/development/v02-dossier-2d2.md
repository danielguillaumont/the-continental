# v0.2 Dossier - Slice 2D2 (reviewed approval interface)

The AI preview screen now includes an explicit selective-approval panel. The panel does **not** automatically select or write any proposed values. A configured provider and an opt-in preview from 2C1/2C2 are required to populate it; no live model result has been verified in this slice.

## Workflow and guardrails

1. After a preview has been returned, select only the supported fields, technologies and qualifications to add. Nothing is selected by default.
2. Existing manual opportunity fields cannot be selected. Already-saved technologies and requirements are visibly marked as duplicates.
3. Correct field/technology names only when the corrected value is present in its exact original citation. Qualification descriptions and required/preferred classification may be corrected by the owner; the original exact source excerpt remains fixed. These edits are owner review, not AI verification.
4. The separate approval checkbox and **Apply selected** action submit only selected additions to `POST /opportunities/{id}/apply-reviewed-extraction`. The request contains the posting SHA-256, precise excerpts and `confirmApply: true`; original posting text is never submitted in the approval body.
5. The backend revalidates source and excerpts, fills only empty manual fields, deduplicates technologies and requirements, and commits transactionally. On success the returned saved record updates the page without an additional create call.
6. A timeout on the **write** is an uncertain outcome. The UI blocks resubmission in that preview and directs the owner to refresh the Dossier to inspect saved data, rather than encouraging duplicates. A stale fingerprint conflict also requires refresh and a new preview.

## Tests and known limitations

- Added 10 unit tests covering default deselection, selection and correction, unsupported edits, manual-field preservation, deduplication, excerpt validation, and selection boundaries. Run `npm.cmd run test:dossier`, `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd audit --omit=dev` in `apps/web` on Windows.
- Provider remains disabled without local configuration. Offline tests do not verify a real model call or browser-to-API approval flow.
- This local single-user API has no authentication; do not publicly host it with personal career or job-posting data.
- Backend checks citations at save time but does not yet retain metadata/technology excerpts in dedicated persistent provenance records. Approval does not claim an attested model identity or mark extraction as completed. Provenance and integration validation remain release gates.
