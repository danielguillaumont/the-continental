# Dossier Slice 2B - Save recovery follow-up

The initial manual browser smoke test revealed a stalled **Saving...** state even though the opportunity had persisted. PostgreSQL and the direct FastAPI POST both worked. This repair is deliberately frontend-only.

- All Dossier requests have a 15-second client deadline, including response JSON parsing; an abort is best effort and does **not** establish that a write was rolled back.
- After an ambiguous new-opportunity POST, the frontend reads the registry once and reconciles **only one exact** posting identity (original source text plus manually-entered identity fields). No automatic retry or duplicate POST is performed.
- If the outcome cannot be confirmed, the form surfaces a warning, links to the registry, and requires the user to affirm that no copy exists before retrying.
- Requirement writes use the same deadline; an uncertain outcome locks the editor until the user refreshes the Dossier and checks the saved requirements. Completed HTTP 4xx validation rejections can still be corrected and retried.
- After a confirmed save, a direct link to the saved Dossier remains visible in case client-side navigation stalls.
- This repair does not add AI extraction, change migrations or touch existing career records.

Validation: `npm.cmd run test:dossier`, all other frontend tests, `npm.cmd run lint`, `npm.cmd run build`; then manual save with a **new fictional** posting and requirement persistence. Do not repeatedly submit while status is uncertain.
