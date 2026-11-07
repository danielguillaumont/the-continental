# The Continental

**Career intelligence built around evidence, not vague claims.**

The Continental is a career intelligence platform that turns projects, experience, certifications, skills, and other career evidence into structured data for opportunity analysis, applications, interview preparation, and future grounded AI workflows.

**Evidence → Understand Opportunity → Take Action → Create Better Evidence**

---

## Current Status

**v0.1 — My Evidence is in progress.**

The Continental now has a working database-backed evidence system and a project registry that groups supporting evidence without duplicating it. v0.1 is still in progress; profile and certification domain records are not yet complete; Experience API/storage is underway and its UI is not yet implemented.

### Working

- Responsive Next.js application shell with distinct Overview, Projects and Evidence navigation
- Overview dashboard (formerly Lobby)
- Evidence library (existing Armory URLs preserved)
- Add Evidence workflow
- Evidence detail views
- Edit Evidence workflow
- Delete Evidence workflow with confirmation
- Armory search and filtering
- Live filtered result counts
- Reusable skill entities
- Many-to-many evidence and skill relationships
- Case-insensitive skill reuse and normalization
- FastAPI backend
- PostgreSQL persistence
- SQLAlchemy relational data model
- Alembic migrations with data-preserving skill normalization
- Evidence validation with Pydantic
- Database-backed evidence summaries and skill counts
- Evidence provenance and record history
- Desktop and mobile navigation
- Project workspace: dedicated detail pages, clearer project list, shared create/edit form, and safe deletion confirmation
- Projects can link and unlink existing evidence (without deleting original evidence)
- Project-aware evidence creation: save, auto-attach and return to the project; attachment failures preserve the new evidence ID for safe retry
- Project/evidence relational tables with additive Alembic migration
- API integration tests for project lifecycle and relationship integrity
- Structured Experience API foundation (work roles, dates, accomplishments, project/evidence links) and additive migration; no Experience screens yet

### Next

- Experience Registry UI, then certification entities and relationships
- Profile/skill evidence inspection and remaining v0.1 release validation
- Screenshot review with sanitized demonstration data

---

## The Idea

Most career tools treat a resume as the database.

The Continental treats the resume as an output. The source of truth is the evidence behind a career:

- work completed
- projects built
- technologies used
- certifications earned
- artifacts created
- skills supported by real examples

Future AI features will operate on this evidence instead of inventing it.

---

## Product Areas

| Area | Purpose |
| --- | --- |
| **Overview** | Home workspace and next actions |
| **Projects** | Project records grouped with supporting evidence |
| **Evidence** | Reusable records supporting projects, skills and experience |
| **Dossier** | Opportunity analysis |
| **Contracts** | Bounded missions for closing evidence gaps |
| **Archive** | Applications, interviews, and outcomes |
| **High Table** | Career and opportunity intelligence |

Only working product areas are exposed in the application.

---

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL 17
- Alembic
- Docker Compose

---

## Run Locally

For a fresh checkout, create and activate the Python virtual environment and install dependencies from `apps/api/requirements.txt`. For development tests, use `apps/api/requirements-dev.txt` (includes `httpx` and `pytest`). Run `alembic upgrade head` from `apps/api` after starting PostgreSQL and before using new API routes. **Do not run `alembic downgrade` on an important database:** the project migration downgrade drops project records.


Start PostgreSQL:

```bash
docker compose up -d postgres
```

Start the API:

```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Start the web app:

```bash
cd apps/web
npm install
npm run dev
```

Web app:

```text
http://localhost:3000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

Run the API tests from `apps/api` with `python -m pytest tests/test_projects.py -q`, and web checks from `apps/web` with `npm run test:navigation`, `npm run test:projects`, `npm run lint` and `npm run build`.

Choose **Projects** in the main navigation to create project records, then open a project to view its dedicated workspace, edit details, and link saved proof from **Evidence**. Routes `/armory` and `/armory/projects` remain unchanged for compatibility; project details use `/armory/projects/[id]`. Unlinking or deleting a project preserves underlying evidence. Creating new evidence from within a project does not yet automatically attach it; the return-and-link workflow is planned for UX Foundation 3B2. This is still a single-user development application; user authentication and tenant separation are not yet implemented.

---

## Roadmap

| Version | Focus |
| --- | --- |
| v0.0 | Foundation |
| **v0.1** | **My Evidence** |
| v0.2 | Dossier |
| v0.3 | Evidence Match |
| v0.4 | Import |
| v0.5 | Armory Generation |
| v0.6+ | Contracts, Archive, workflows, integrations, intelligence |
| v1.0 | Reliable first major release |

---

## Product Principles

- Data first, AI second.
- Evidence is the source of truth.
- AI output should be grounded and inspectable.
- Only expose features that actually work.
- Add complexity only when the product requires it.

---

## Development

The Continental is under active development and intentionally public so its progression from structured career data to grounded AI workflows can be followed through the commit history.