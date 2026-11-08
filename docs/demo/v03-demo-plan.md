# v0.3 curated demonstration story — optional fictional seed

**All records are fictional.** The employers below are invented. The sample evidence and projects are illustrative artifacts, not demonstrations of actual completed work, external verification, or real job advertisements. No user Profile or employment record is modified.

The source of truth for exact names, posting text, requirements and skill relationships is [`../../scripts/demo/v03-demo-data.json`](../../scripts/demo/v03-demo-data.json). Run the dry-run-first PowerShell wrapper following [`v03-demo-seeding.md`](v03-demo-seeding.md). Nothing is seeded automatically by code installation.

## Opportunity A — Cloud Security Engineer

- **Company:** Cedarline Cloud Operations (fictional)
- **Location:** Vancouver, BC — Hybrid
- **Technology tags:** Kubernetes, Terraform, AWS, Python, GitHub Actions
- **Required:** Build and validate Kubernetes admission controls; automate cloud infrastructure with Terraform and AWS; use Python for security automation
- **Preferred:** Incident response coordination; secure CI using GitHub Actions

## Opportunity B — Application Security Engineer

- **Company:** Harborlight Security Products (fictional)
- **Location:** Toronto, ON — Remote
- **Technology tags:** Python, REST APIs, OWASP ASVS, GitHub Actions, SAST
- **Required:** Review REST APIs for auth weaknesses; Python security regression tests; OWASP ASVS-driven reviews
- **Preferred:** SAST pipelines; binary exploitation research

## Opportunity C — Platform Reliability Engineer

- **Company:** Westhaven Platform Collective (fictional)
- **Location:** Burnaby, BC — Hybrid
- **Technology tags:** Go, Kubernetes, Linux, Docker, Terraform, Prometheus
- **Required:** Go services in Kubernetes; Linux and Docker operations; Prometheus monitoring
- **Preferred:** Terraform changes; disaster recovery exercises

## Five fictional evidence records

| Fictional project | Sample evidence record | Explicit skills |
| --- | --- | --- |
| Sentinel Ridge Cluster Lab | Kubernetes admission-policy regression suite | Kubernetes, Go, Terraform |
| Sentinel Ridge Cluster Lab | Terraform plan-control validation workflow | Terraform, AWS, GitHub Actions |
| Harborlight API Security Bench | API authorization regression suite | Python, REST APIs, OWASP ASVS |
| Harborlight API Security Bench | CI security-analysis integration notes | GitHub Actions, SAST, Python |
| Fieldstone Reliability Toolkit | Linux service recovery runbook | Linux, Docker, Go |

The fictional evidence is always **unverified**. A keyword/skill link is only an inspectable candidate, not a job-fit score or qualification assertion. No standalone Skill is invented without an Evidence record; therefore, an unrecognized requirement should not automatically be called an unsupported skill.

## Desired product screenshots in v0.3C and later

- A cloud security requirement with one or more candidate evidence records from a clearly fictional project.
- A different requirement without an explicit skill-tag match, visibly marked as **needs interpretation**, not conclusively lacking qualification.
- The exact source posting and separate job requirements.
- Link back to the full Evidence/Project record, with owner-entered verification labels and no fabricated fit percentages.
- A clear note that this is fictional example data, not a personal employment history.

## Data handling and cleanup

- Slice 3B adds an **opt-in, idempotent** local seeding tool and an explicit pre-apply backup; no data is modified during installation or dry run.
- The seed **does not PUT or DELETE** anything. It creates only missing fictional sample entries and attaches its own evidence to its own projects.
- Existing user Profile, Experiences, Certifications, Projects, Evidence and Opportunities remain untouched, including earlier placeholder records.
- A separate demo database is preferable for public screenshots rather than mixing fictional and real records. Do not publicly deploy the local unauthenticated service.
