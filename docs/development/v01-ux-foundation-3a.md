# v0.1 UX Foundation — Slice 3A: Clear Destinations

Status: implementation candidate (not a v0.1 release). Based on `main` commit `0a751e129702fb18c4ea8fb05cf4b216b6010c3e`.

## Problem

Users could not find the Project Registry because it was hidden beneath Armory. Both Project Registry records and project-type Evidence records appeared to be the same feature. The sidebar's prefix-based active logic marked Armory selected even when a user was working in Projects.

## Scope

- Three explicit primary destinations: **Overview**, **Projects**, **Evidence**.
- Keep the known working routes `/`, `/armory/projects`, and `/armory`; preserve detail/new/edit URLs.
- Use one route resolver so Projects is active at `/armory/projects`, Evidence is active on its other `/armory/*` pages, and Overview only on `/`.
- Rename ambiguous page headings and buttons; add a short three-step Projects guide and explanation on Evidence.
- Improve mobile link targets, project evidence selector wrapping and navigation context.
- Include Projects in the guarded screenshot helper's default route list.
- Update documentation to match the actual navigation. No database or API changes.

## Acceptance checks (required before PR)

1. `npm.cmd run test:navigation`, `npm.cmd run lint`, and `npm.cmd run build` pass.
2. API tests remain passing: run `.\.venv\Scripts\python.exe -m pytest tests/test_projects.py -q` from `apps/api` on Windows.
3. Desktop: Overview highlights only Overview; Projects highlights only Projects; Evidence and evidence detail/new/edit highlight only Evidence.
4. Projects: create, edit, attach and detach existing evidence, and delete an isolated QA project. Real evidence stays saved.
5. Mobile (390 × 844 and 320 × 700): open menu, navigate all three destinations, dismiss menu, inspect Project selector and action buttons, no sideways scrolling.
6. Confirm direct URL visits and back navigation still work, including existing `/armory/*` URLs.
7. Use only sanitized demo records for any screenshot intended for the public README; if personal records are present, store QA screenshots privately and do not publish them.

## Deferred deliberately

- Route renames/redirects and database schema changes.
- Connected create-evidence-and-attach flow (requires persistence-safe project context).
- Dedicated skills and experience screens, until those features are functional.
- Full visual/mobile regression suite; do not claim mobile pass until tested.

This slice establishes distinct navigation and terminology, but it is not the complete UX overhaul.
