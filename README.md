# The Continental

**Career intelligence built around evidence, not vague claims.**

The Continental is a career intelligence platform that turns projects, experience, certifications, skills, and other career evidence into structured data for opportunity analysis, applications, interview preparation, and future grounded AI workflows.

**Evidence → Understand Opportunity → Take Action → Create Better Evidence**

---

<!-- continental-portfolio:begin -->
## See it in action

**A job description makes a claim. The Continental shows the evidence behind the answer.**

Save an opportunity, inspect each requirement, see which of your saved career records might support it, and review the evidence yourself. Candidate matches are deterministic Skill-tag links—not a fit score, prediction, or verified qualification.

### Evidence Match — v0.3.0 release candidate

[![The Continental Evidence Match workspace on a fictional Cloud Security Engineer posting, showing saved requirements, evidence candidates and an owner review ledger](docs/screenshots/dossier-v03-evidence-match-hero.png)](docs/screenshots/dossier-v03-cloud-security-desktop.png)

*Cloud Security Engineer — Cedarline Cloud Operations (fictional demo).* [Open the full Dossier](docs/screenshots/dossier-v03-cloud-security-desktop.png) · [Application Security example](docs/screenshots/dossier-v03-application-security-desktop.png) · [Platform Reliability example](docs/screenshots/dossier-v03-platform-reliability-desktop.png)

**A four-step, inspectable workflow**

1. **Save the source.** Capture the original job posting and organize its required and preferred qualifications without rewriting the source.
2. **Discover candidate evidence.** Match explicit requirement text against the saved Skill → Evidence relationships. Browse linked projects and experiences; unmatched requirements remain visible.
3. **Review the evidence.** Mark a candidate as *Supports requirement* or *Not relevant*, add your own reasoning, revise or remove the decision. Changes to underlying material can mark a saved review stale.
4. **Keep the distinction clear.** A candidate is a suggestion based on literal Skill tags. An owner decision is not independent verification, an employer assessment, or a model-generated fit score.

**Built with:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, FastAPI, Pydantic, SQLAlchemy, PostgreSQL and Alembic. The v0.3 release acceptance gate recorded **126 passing backend tests, 111 passing frontend tests, 13 read-only API checks**, plus lint and the Next.js production build. Additional browser-capture diagnostics distinguish development-mode cancellations from production behavior; they are not claims of deployment readiness.

### The foundation

The existing Dossier registry ([v0.2 screenshot](docs/screenshots/dossier-v02-desktop.png)) preserves job sources and supports optional, explicitly consented AI extraction previews with selective approval. Live external model integration is **not verified**. Earlier work includes [Overview](docs/screenshots/overview-desktop.png), [Evidence](docs/screenshots/armory-desktop.png), Profile, Experience, Projects, Skills and Certifications.

**Published releases:** [v0.1.0 — Career Record Foundation](https://github.com/danielguillaumont/the-continental/releases/tag/v0.1.0) · [v0.2.0 — Dossier](https://github.com/danielguillaumont/the-continental/releases/tag/v0.2.0). **v0.3.0 is a release candidate until the final acceptance gate, tag and GitHub release are complete.**

> **Local-development boundary:** Single-user and unauthenticated; not publicly hosted. No tenant isolation, automated qualification assessment, semantic matching, verified live AI extraction, or independent credential validation. Never publish the local API or private career records. The v0.3 screenshots are explicitly fictional demos, not the developer's actual achievements.
<!-- continental-portfolio:end -->

## Current Status

> **v0.3.0 release candidate — Evidence Match:** Deterministic read-only candidate discovery, a requirement-by-requirement Dossier workspace, and explicit saved human review decisions are implemented and regression-tested. Candidates are not owner-confirmed automatically. A source-changing review can become stale; existing Evidence is not deleted when a review is removed. Release verification, sanitized visuals, and accessibility sign-off must finish before `v0.3.0` is tagged. v0.2.0 remains the latest published release until then.

**v0.2.0 — Dossier (released November 8, 2026).** The release is published on [GitHub](https://github.com/danielguillaumont/the-continental/releases/tag/v0.2.0). The final validation included 92 backend tests, 92 frontend tests, passing CI, and a local Dossier smoke check.

Dossier builds on the v0.1 career record foundation. It supports source-preserving manual job intake, editable opportunity metadata and required/preferred requirements, an optional explicitly consented AI extraction preview, owner-reviewed selective approval, and durable source citations for newly approved metadata and technologies. Existing manual values are protected, and the original posting stays read-only.

**Verification boundary:** The extraction and approval contracts are covered by offline tests using a simulated model provider. No successful live OpenAI extraction has been verified. The provider is disabled by default; no AI extraction occurs unless separately configured and explicitly requested. Citation labels indicate owner review, not independent employer verification. Extraction status/model tracking is not finalized. Evidence Match is added in v0.3; it does not imply application generation, public hosting, login, or tenant isolation.

**Release documentation:** See the [published v0.2.0 release notes](https://github.com/danielguillaumont/the-continental/releases/tag/v0.2.0) and the archived [release-candidate checklist](docs/releases/v0.2.0-rc.md) for validation and provenance boundaries. Keep `.env`, API keys, database dumps, and unsanitized career records private.

### v0.2 Dossier — released

- **2A / 2B:** PostgreSQL-backed opportunity registry, manual posting intake, source-preserving Dossier UI, metadata management, requirements management, and stalled-save recovery.
- **2C1 / 2C2:** Configurable opt-in AI extraction-preview endpoint, structured review UI, source-fingerprint and exact-excerpt checks; previews do not write to saved records.
- **2D1 / 2D2:** Guarded, explicit, selective approval of reviewed suggestions; no automatic overwrite of manual metadata, and duplicate approvals do not create duplicate requirements.
- **2D3A / 2D3B:** Persistent owner-approved metadata/technology attributions, cleanup of stale citations after manual changes, visible source citations, and offline preview-to-approval-to-reopen integration tests. Requirements maintain their own source excerpts.

The v0.2 schema head was `d39b2a4f7c61`; the v0.3 evidence-review migration advances it to `a1d8c4f60e32`. Older/manual data is not retroactively given invented citations. See the detailed notes in `docs/development/` and the [v0.2.0 release](https://github.com/danielguillaumont/the-continental/releases/tag/v0.2.0).

### Working

- Deterministic, read-only requirement-to-evidence candidate preview from literal saved Skill tags, with linked Projects/Experiences and explicit unmatched states
- Evidence Match navigator and human review ledger with owner-authored support/not-relevant decisions, reversible edits, stale-review detection and guarded write reconciliation
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

### v0.1.0 release validation

- Local acceptance on November 7, 2026: **38 backend tests and 51 frontend tests passed**; ESLint, the Next.js production build and a production-only npm audit passed (0 reported vulnerabilities).
- Database at Alembic revision `b7c2e49a1d03`, with existing records preserved through the Profile migration. These are **local checks**, not a claim of production readiness.
- Both GitHub Actions CI jobs passed on the v0.1.0 release commit. See [`docs/releases/v0.1.0-rc.md`](docs/releases/v0.1.0-rc.md).
- Screenshots must use sanitized demonstration records. Do not publish actual profile or career data.

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
| **Profile** | Professional identity, career direction and portfolio links |
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

Prerequisites: Python 3.12+, Node.js 22+, Docker Desktop with Compose, and Git. Use a fresh clone for these commands. They are Windows PowerShell instructions; the local `.env` is ignored by Git and must stay private.

From the repository root, in **DB**:

```powershell
Copy-Item .env.example .env
# If changing the sample password, update both POSTGRES_PASSWORD and the password in DATABASE_URL.
docker compose up -d postgres
```

In **API Server**, still from the repository root:

```powershell
cd apps/api
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In **Web**, from the repository root:

```powershell
cd apps/web
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```

For an existing local checkout, **do not overwrite `.env`, delete Docker volumes, or downgrade migrations**. Keep PostgreSQL data and private profile records out of public artifacts.

Web app:

```text
http://localhost:3000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

Run API tests from `apps/api` using `.\.venv\Scripts\python.exe -m pytest tests -q`. In `apps/web`, use `npm.cmd run test:navigation`, `test:projects`, `test:workflow`, `test:experiences`, `test:skills`, `test:certifications`, `test:profile`, then `npm.cmd run test:dossier`, `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd audit --omit=dev`. GitHub Actions runs the same suite on proposed changes.

The **Dossier** workspace (`/dossier`) supports local manual job intake, editable metadata and required/preferred requirements, and a read-only original posting. An optional extraction-preview endpoint and review interface require explicit consent and a separately configured provider. Proposals are not saved until the owner selectively approves them. Newly approved metadata and technologies retain inspectable source citations; requirements retain their own excerpts. The current v0.3 schema revision is `a1d8c4f60e32` (the v0.2 predecessor was `d39b2a4f7c61`). Offline integration tests cover preview, approval, reload and provenance; live provider integration is not yet verified. v0.3 adds deterministic Skill-tag-to-Evidence candidate discovery and separate owner reviews; there is no automated qualification or fit score. External job fetching is not implemented.

Choose **Projects** in the main navigation to create project records, then open a project to view its dedicated workspace, edit details, and link saved proof from **Evidence**. Routes `/armory` and `/armory/projects` remain unchanged for compatibility; project details use `/armory/projects/[id]`. Unlinking or deleting a project preserves underlying evidence. Creating new evidence from within a project automatically attaches it and returns to the project; a failed attachment can be retried without duplicating evidence. Use **Experience** (`/experiences`) to create role records and link existing Projects or Evidence without transferring ownership. Use **Skills** (`/skills`) to inspect evidence-derived skill coverage, then open an individual skill to see the original records and their source information. Skill records are not edited independently; evidence tags control relationships. A "verified" tag is owner-provided, not third-party certification. The Certifications workspace (`/certifications`) lets you record credentials and their dates, then link or detach existing Skills and Evidence without modifying the originals. A credential URL is an owner-entered link, not proof of issuer verification. The **Profile** workspace (`/profile`) calls `GET /profile` (404 until configured) and `PUT /profile` (create/update one career identity). This is still a **local-only, unauthenticated single-user development application**: do not expose the API or personally identifiable profile data on the public internet. User authentication and tenant separation are not yet implemented.

---

## Roadmap

| Version | Focus |
| --- | --- |
| v0.0 | Foundation |
| **v0.1** | **My Evidence** |
| **v0.2** | **Dossier — released** |
| **v0.3** | **Evidence Match — release candidate** |
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

> **Previous release — v0.2.0 Dossier (November 8, 2026):** manual opportunity intake, optional source-grounded extraction preview, explicit selective approval, and durable citations for newly approved metadata/technologies are implemented. Older manual records are not retroactively attributed. The offline preview-to-approval tests passed, and the local registry and saved-record smoke checks succeeded. Live-model integration remains unverified.
