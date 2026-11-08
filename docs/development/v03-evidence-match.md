# v0.3 — Evidence Match development map

## Product goal

The Continental should answer one inspectable question: **For each saved job requirement, what career evidence might support it, and what is missing or uncertain?** A recruiter should understand the workflow from one screenshot: **Job requirement → relevant evidence → linked project/experience → explicit gap.**

This is not an applicant-tracking product, a qualification-certification service, or a hiring prediction system. Evidence is owner-entered; source URLs and owner-applied "verified" labels are not independent verification.

## Non-negotiable behavior

- Preserve the original job posting and v0.2 extraction/approval boundaries.
- Candidate evidence must have a concrete route back to a saved Evidence record, supporting Skill tag, and any linked Projects/Experiences. Never create imaginary proof.
- Separate a *matching candidate* from an *approved/confirmed evidence association*. No match percentage or made-up confidence.
- Distinguish **candidate found**, **known skill tag without linked evidence**, and **no recognizable skill tag**. The last two are different problems.
- Keep demo data explicitly fictional, with plausible roles, companies, work artifacts, and technologies. Do not replace the user's real records without a backup and an explicit choice.
- Keep a polished and cohesive UI, including empty/loading/error states, before calling v0.3 complete.

## Scope and release slices

| Slice | Deliverable | Validation |
| --- | --- | --- |
| 3A — Deterministic match preview | Read-only endpoint matching literal requirement phrases to the existing Skill → Evidence relationships; include project/experience context | API regression, false-positive boundaries, no database writes |
| 3B — Demo data CLI | Plausible fictional cloud-security, AppSec, and platform jobs plus matching evidence, seeded through documented terminal commands with dry-run/opt-in and idempotency | Backup, dry-run, isolated fixture records, repeat-seed validation |
| 3C — Match workspace | Add understandable match summary to each Dossier: requirement cards, candidate records, actionable links, explicit unmatched states | Frontend tests, lint, build, keyboard/mobile checks, meaningful screenshots |
| 3D — Human-reviewed links | Explicitly confirm/reject an evidence association without overstating the automatic match, persist review decisions with provenance | Transactional API tests, migration if required, no overwrite of manual data |
| 3E — v0.3.0 release | Focused E2E acceptance, screenshots with sanitized realistic demo records, recruiter-first README rewrite, CI, release notes, tag | Final regression, data integrity, clear boundary claims |

## 3A contract

`GET /opportunities/{opportunity_id}/evidence-match-preview`

- Read-only; no new table, migration, model call, key, or write.
- Current candidate discovery uses *literal whole-tag* matching of **saved requirement text** against existing Skill names. Case-insensitive for tags longer than two characters; very short tags (e.g. `Go`) require exact case to reduce common-word false positives. No synonyms/semantic inference.
- A matched skill only yields a candidate when an Evidence record is already tagged with that exact Skill record.
- Every candidate contains its Evidence ID, original title, owner-entered status/source metadata, matched Skill IDs, and linked Project/Experience identities.
- Ordered deterministically, returning at most 25 candidate records per requirement with `candidateCount` and `truncated` to disclose additional results. No hidden scoring.
- A requirement with no recognized Skill is labeled `no_explicit_skill_tag` (do **not** call it a confirmed gap). A recognized skill with no Evidence is `no_linked_evidence` (still not proof the applicant lacks the ability). With saved evidence it is `candidates_found`.
- The API explicitly states that candidates must be human reviewed; even a saved Evidence `verified` label remains owner-entered.

### Concrete example

Saved job requirement: `Build Python APIs and Terraform controls`.

- If `Python` and `Terraform` exist in the saved Skill inventory, identify the literal phrases.
- If an Evidence item is tagged with either Skill, expose it as a **candidate**, grouped once even when both tags match.
- Show its linked project(s) and experience record(s) when those relationships exist.
- If `Terraform` has no Evidence linked, report that gap separately; no fabrication and no automatic changes to the original Dossier.

## 3B demo dataset concept

Use the fixture plan in `docs/demo/v03-demo-plan.md`. The scenario company names are invented; the postings are authored examples, not scraped vacancies. These records are for screenshots and tests, not claims about the developer's professional work.

Seed via repeatable CLI commands (not manual browser typing), with safe dry-run as the default; keep actual personal/profile data untouched. Back up the local database before any fixture modifications. Do not globally delete existing Dossiers or Skills merely to make a clean screenshot. Existing test records such as `QQQ Company` can be cleaned later only after confirming they are disposable.

## README direction at 3E

First screen: **One-line problem statement** and a realistic screenshot of an evidence-match report. Then a four-step annotated workflow, architecture/stack, technical highlights, validation evidence and limitations, followed by developer setup and roadmap. Retain the two released v0.1/v0.2 screenshots in a collapsed/history area or later in the gallery without letting old screenshots dominate the first fold.

**Do not claim** a live verified AI extraction, public hosting, authentication, independent proof verification, or semantic matching until those capabilities are actually implemented and validated.


## Slice 3C1 — read-only match workspace

The Dossier detail screen includes an Evidence Match panel powered by
`GET /opportunities/{id}/evidence-match-preview`. It does not mutate opportunities,
career records, skill links or reviewed match associations. The panel presents:

- A requirement total, requirements **with candidate evidence**, and requirements
  needing review. These are record counts, not suitability percentages.
- All / With candidates / Review needed filters and keyboard-accessible
  requirement selection. The latter includes **no linked evidence** and **no
  explicit skill tag** as separate explanations, never as confirmed lack of skill.
- Each candidate's exact saved evidence title, matched skill tags, related projects,
  related experience, owner-reported verification status, and a direct Evidence
  record link. External links are limited to safe HTTP(S) URLs without credentials.
- Boundaries for source provenance, returned-candidate truncation, unavailable API,
  empty requirements, and unsupported API versions.

The UI refetches when the saved Dossier revision is updated. If evidence links are
changed separately, the user can select **Refresh matches** to retrieve a fresh
preview. A candidate is not an owner-confirmed relationship and no AI inference
is performed.

### Local acceptance before merging

1. Use the clearly fictional, opt-in sample dataset (Slice 3B). Open a saved
   Dossier from the registry. The match panel should load above Requirements.
2. The three sample opportunities should report 4/5, 4/5, and 3/5 requirements
   with candidate evidence, respectively. These represent literal-tag matches,
   not verified job qualifications.
3. Select candidate and review-needed requirements, test filter buttons, and open
   a linked Evidence record and a linked Project record; verify the paths navigate.
4. Review a requirement with no explicit Skill tag. The UI must **not** call it a
   confirmed skills gap. Confirm owner-entered statuses aren't independent proof.
5. Use Refresh, check loading/error messaging, resize to phone width, and use
   Tab/Enter navigation on the requirement rail.
6. Run the complete frontend tests, ESLint with zero warnings, and Next production
   build. No new Alembic revision or backend work is required for 3C1.

### Still deferred

Slice 3D covers human confirmation/rejection and persistent review provenance.
A recruiter-first README/gallery rewrite, sanitized screenshot, and final product
polish remain part of Slice 3E, not this initial UI integration.


## Slice 3D1 — owner-reviewed evidence decisions (backend)

This slice is deliberately separate from automatic candidate discovery. A literal
Skill-tag match remains a **candidate**, even after a user saves their own
judgment. It is **not** an independently verified qualification or fit score.

- **GET** `/opportunities/{id}/evidence-review-options` returns current bounded
  candidate pairs and a fingerprint of the saved requirement and supporting
  Evidence material. `truncatedRequirementIds` discloses limits. No writes.
- **GET** `/opportunities/{id}/evidence-reviews` returns saved decisions, notes,
  original reviewed wording and `current`/`stale` status. No writes.
- **PUT** `/opportunities/{id}/requirements/{requirement_id}/evidence-reviews/{evidence_id}`
  requires an explicit `decision` of `supports` or `not_relevant`, an owner note
  (at least 10 characters for `supports`), and the current `expectedFingerprint`
  from review options. Only current literal-skill candidates can be reviewed.
  Repeated saves update the same record instead of creating duplicates.
- **DELETE** the same pair URL removes *only the review record*, never the
  Evidence record or its Skill/Project links.

The snapshot covers requirement wording and kind, Evidence title, description,
kind, owner-entered verification status, source, date, Skill tags, and related
Project/Experience IDs. If any material changes or a candidate disappears, the
prior review stays visible but is marked **stale**, requiring human re-review.
A stale fingerprint or noncandidate write fails with HTTP 409; cross-Dossier
requirement lookups return 404. Notes, decisions and current/stale state are
never interpreted as model-generated findings.

**Migration:** `a1d8c4f60e32`, parent `d39b2a4f7c61`, creates only the
`evidence_reviews` table and its constraints/indexes. Verify a private
PostgreSQL backup before running `alembic upgrade head`. Never downgrade
review data casually. Run backend tests plus local PostgreSQL migration checks
before merging. This slice adds no frontend action yet: 3D2 will integrate
review/undo controls and preserve the current read-only candidate experience.


## Slice 3D2 — Dossier owner review controls (frontend)

The existing Evidence Match panel now fetches the **review options** and **saved
reviews** independently from the deterministic candidate preview. If review
endpoints are unavailable, the original read-only preview remains useful.

- A candidate initially reads **Not reviewed** and must not be presented as a
  confirmed qualification. An owner can explicitly choose **Supports
  requirement** or **Not relevant** and leave a reviewer-authored explanation.
  Supporting decisions require at least 10 characters; notes are capped at 1,200.
- A saved decision and its explanation remain visible and can be edited or
  removed. Removing a decision never deletes the Evidence record, Project,
  Experience, or their Skill relationships.
- Before each save, the UI supplies the fingerprint from the live review
  options endpoint. The server rejects stale fingerprints with HTTP 409.
- Old decisions remain visible with a **Stale** state after relevant changes.
  Reviews no longer in the current bounded candidate list are surfaced as
  earlier decisions, rather than silently disappearing.
- Writes are serialized in the UI. A timeout or ambiguous network error
  blocks further writes until the user refreshes and reconciles saved reviews.
  There is **no automatic retry of an uncertain PUT or DELETE**.
- An owner decision does not change the Evidence owner-verification flag and
  does not establish an externally confirmed credential, proficiency, or job fit.

### 3D2 local acceptance

1. Check `git status` and migrate PostgreSQL to `a1d8c4f60e32` *before* using
   3D2 (migration was applied in the 3D1 validation phase).
2. Run all Dossier/frontend tests, ESLint (`--max-warnings 0`), and production
   Next.js build. No new migration or dependency is expected.
3. Open the fictional Cloud Security Engineer Dossier. Check the 5 / 4 / 1
   candidate summary remains unchanged before and after owner reviews.
4. Save a supporting decision **with a clear explanation**, refresh the page,
   and confirm the decision and note persist. Change it to **Not relevant** and
   confirm the change persists after refreshing.
5. Remove that test review and verify `GET /opportunities/{id}/evidence-reviews`
   contains no review for that pair; the Evidence record must remain intact.
6. Confirm a review for a requirement with no candidates cannot be fabricated.
   Inspect an older/stale review if one is available without modifying the
   underlying data merely to manufacture the condition.
7. Verify keyboard navigation, mobile layout, `Refresh reviews`, and a fallback
   message if the review API is temporarily unavailable. A timed-out write is
   *unknown* until the saved state is reconciled.

Slice 3E will finish the recruiter-oriented screenshot gallery, clean up
clearly disposable placeholders *after approval*, simplify the README's first
screen, and perform final regression/CI checks for `v0.3.0`.
