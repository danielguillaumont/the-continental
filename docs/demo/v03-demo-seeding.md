# v0.3 Slice 3B — Fictional demonstration data (opt in)

The Continental is a real software project. These **sample records are fiction**, not the developer's job history, completed projects, verified evidence, or real job advertisements. The three invented employers deliberately resemble ordinary hiring scenarios but are not intended to imply an employment relationship.

## Dataset

- **3 fictional job opportunities**: Cedarline Cloud Operations (Vancouver), Harborlight Security Products (Toronto), Westhaven Platform Collective (Burnaby).
- **15 required/preferred job requirements**, copied verbatim from their own original sample postings; no AI calls.
- **3 fictional projects**: Sentinel Ridge Cluster Lab, Harborlight API Security Bench, Fieldstone Reliability Toolkit.
- **5 unverified, fictional evidence artifacts**, with reusable skill tags and project links.
- **No Experiences, Profile, Certifications, actual employment records, or external URLs** are seeded. No existing records are modified or deleted.

The seed is demonstrably idempotent: a second application does not create duplicate records/links. It stops on unexpected collisions or modifications to its previously created demo content. It can resume a partial write after inspecting a new dry run. Because the API is not transactional across multiple entities, a mid-run failure can leave a subset of clearly marked demo data; there is no automatic rollback or destructive cleanup.

## Windows PowerShell 5.1 sequence

1. Merge Slice 3B or remain on its `feat/v03-evidence-match-3b` branch during validation.
2. Start PostgreSQL from **DB** using `docker compose up -d postgres`; confirm `healthy`.
3. In **API Server**, start FastAPI on localhost:
   `cd "$HOME\Projects\the-continental\apps\api"` then
   `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.
   **Web** is not necessary for the seed.
4. In **DB**, after changing directory to repository root, run the read-only preview:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\demo\Seed-ContinentalV03Demo.ps1"
   ```

5. Review the printed CREATE/LINK/KEEP operations and read `scripts/demo/v03-demo-data.json` to understand exactly what will be inserted. The command never updates or deletes existing records.
6. To opt in, use this separate command **only after** reviewing the dry run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\demo\Seed-ContinentalV03Demo.ps1" -Apply -IReviewedFictionalData
   ```

   The wrapper checks the expected development branch, the running local API, healthy PostgreSQL and Alembic revision; creates a **private PostgreSQL custom dump outside Git** under `Documents\Continental-Database-Backups`; validates its archive and SHA-256; runs preflight again; performs the seed; validates opportunity match previews; and checks that unrelated career-table counts did not change.
7. Rerun the read-only preview. For a completed seed, every item should be `KEEP`, with no CREATE or LINK actions pending.

## Provenance and honesty

Evidence artifacts have `status=unverified` and `source.label` explicitly states they are fictional fixtures without an external link. The existing product's skill matching reports **candidates**, not true qualifications or a fit score. There is intentionally no fabricated resume, employment experience, real-company vacancy, salary, independent audit, API key, or model-generated content. Existing user profile and old opportunity records—including placeholder entries—remain untouched.

When capturing public screenshots, either use a separate demo database or ensure fictional fixture labels are readable, and never expose genuine personal records from the mixed local database. A future isolated demo database is preferable for polished portfolio screenshots.

## Failure and recovery

- If any check fails, stop. Do **not** run `docker compose down -v`, overwrite existing records, or downgrade the database.
- If a POST times out, its outcome is uncertain. Run the default dry-run to re-discover any completed writes before reapplying.
- Never commit the `.dump` backup or paste its contents into chats. The wrapper stores it under your local Documents folder, outside the repo.
- The script does not alter the `v0.2.0` tag or require a schema migration.

## Validate code without database writes

Run from **API Server** at `apps/api`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
.\.venv\Scripts\python.exe -m compileall -q app
```

The v0.3 seed tests use a disposable in-memory database with in-process HTTP API calls; they do not write to your real PostgreSQL service.
