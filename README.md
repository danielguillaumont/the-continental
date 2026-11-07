# The Continental

**Career intelligence built around evidence, not vague claims.**

The Continental is a career intelligence platform that turns projects, experience, certifications, skills, and other career evidence into structured data for opportunity analysis, applications, interview preparation, and future grounded AI workflows.

**Evidence → Understand Opportunity → Take Action → Create Better Evidence**

---

## Current Status

**v0.1 — My Evidence is in progress.**

The Continental now has database-backed Projects, Evidence, and Experience workspaces, with reusable proof connected across records. v0.1 remains in progress: Certifications have both an API and a credential workspace; Profile now has both a persisted API and frontend workspace; and Skills & Proof inspection is included.

### Working

- Responsive Next.js application shell with distinct Overview, Profile, Experience, Projects, Evidence, Skills, and Certifications navigation
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
- Skills & Proof inventory: searchable skill names, evidence coverage filters, record counts, and drill-down with provenance (read-only; no invented proficiency scores)
- Profile Management: owner-entered career identity with headline, summary, local contact details, portfolio links, target roles and availability; persistent API, responsive workspace and regression tests
- Certification Registry: create/edit/delete credentials; issuer, optional issue/expiration dates, credential URL, description; reusable Skill/Evidence links; and date-based status filtering
- Skill coverage derived from saved evidence status, including unsupported skills whose last evidence was removed
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
- Structured Experience API, PostgreSQL model, additive migration, and responsive Experience workspace (list, create, edit, detail, delete, project/evidence associations)

### Next

- Final v0.1 release validation, secure local-only usage review, and release tagging
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
| **Experience** | Roles, organizations, accomplishments, and supporting work |
| **Projects** | Project records grouped with supporting evidence |
| **Evidence** | Reusable records supporting projects, skills and experience |
| **Skills** | Inspect a skill and the exact evidence records that support it |
| **Certifications** | Store credentials, track date-based expiration, and link skills and supporting evidence |
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

Run API tests from `apps/api` with `python -m pytest tests/test_projects.py tests/test_experiences.py tests/test_skills.py tests/test_certifications.py tests/test_profile.py -q`. From `apps/web`, run `npm run test:navigation`, `npm run test:projects`, `npm run test:workflow`, `npm run test:experiences`, `npm run test:skills`, `npm run test:certifications`, `npm run test:profile`, `npm run lint` and `npm run build`.

Choose **Projects** in the main navigation to create project records, then open a project to view its dedicated workspace, edit details, and link saved proof from **Evidence**. Routes `/armory` and `/armory/projects` remain unchanged for compatibility; project details use `/armory/projects/[id]`. Unlinking or deleting a project preserves underlying evidence. Creating new evidence from within a project automatically attaches it and returns to the project; a failed attachment can be retried without duplicating evidence. Use **Experience** (`/experiences`) to create role records and link existing Projects or Evidence without transferring ownership. Use **Skills** (`/skills`) to inspect evidence-derived skill coverage, then open an individual skill to see the original records and their source information. Skill records are not edited independently; evidence tags control relationships. A "verified" tag is owner-provided, not third-party certification. The Certifications workspace (`/certifications`) lets you record credentials and their dates, then link or detach existing Skills and Evidence without modifying the originals. A credential URL is an owner-entered link, not proof of issuer verification. The **Profile** workspace (`/profile`) calls `GET /profile` (404 until configured) and `PUT /profile` (create/update one career identity). This is still a **local-only, unauthenticated single-user development application**: do not expose the API or personally identifiable profile data on the public internet. User authentication and tenant separation are not yet implemented.

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