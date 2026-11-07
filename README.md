# The Continental

**Career intelligence built around evidence, not vague claims.**

The Continental is a career intelligence platform that turns projects, experience, certifications, skills, and other career evidence into structured data for opportunity analysis, applications, interview preparation, and future grounded AI workflows.

**Evidence → Understand Opportunity → Take Action → Create Better Evidence**

---

## Current Status

**v0.1 — My Evidence is in progress.**

The Continental now has a working database-backed evidence system and a project registry that groups supporting evidence without duplicating it. v0.1 is still in progress; profile, experience and certification domain records are not yet complete.

### Working

- Responsive Next.js application shell
- Lobby dashboard
- Armory evidence library
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
- Project registry: create, inspect, edit, and delete project records
- Projects can link and unlink existing evidence (without deleting original evidence)
- Project/evidence relational tables with additive Alembic migration
- API integration tests for project lifecycle and relationship integrity

### Next

- Experience and certification entities and relationships
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
| **Lobby** | Home workspace and current priorities |
| **Armory** | Career evidence, projects, experience, and skills |
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

Run the API tests from `apps/api` with `python -m pytest tests/test_projects.py -q`, and web checks from `apps/web` with `npm run lint` and `npm run build`.

In the Armory, select **Browse projects** to create project records and attach existing evidence. Unlinking or deleting a project preserves the underlying evidence. This is still a single-user development application; user authentication and tenant separation are not yet implemented.

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