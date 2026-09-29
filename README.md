# The Continental

**Career intelligence built around evidence, not vague claims.**

The Continental is a career intelligence platform that turns projects, experience, certifications, skills, and other career evidence into structured data for opportunity analysis, applications, interview preparation, and future grounded AI workflows.

**Evidence → Understand Opportunity → Take Action → Create Better Evidence**

---

## Current Status

**v0.1 — My Evidence is in progress.**

The visual foundation is complete and the first product area, the **Armory**, is working.

### Working

- Responsive Next.js application shell
- Lobby dashboard
- Armory evidence library
- Desktop and mobile navigation
- Structured `EvidenceRecord` model
- Verification states and skill summaries
- Reusable component architecture
- Frontend lint and production builds

### Next

- Add Evidence flow
- Projects and experience records
- Evidence detail views
- Skill relationships
- Search and filtering
- Backend persistence

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

### Current

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

### Planned

- Python + FastAPI
- PostgreSQL
- Pydantic
- GitHub Actions
- Grounded AI features after the evidence layer is reliable

---

## Run Locally

```bash
git clone https://github.com/danielguillaumont/the-continental.git
cd the-continental/apps/web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Checks:

```bash
npm run lint
npm run build
```

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

The Continental is under active development.

The repository is intentionally public so its progression from structured career data to grounded AI workflows can be followed through the commit history.