# v0.3 curated demonstration story (fixture plan, not yet seeded)

All employers below are **fictional**. The positions and listings are original sample text, not real job advertisements or hiring claims. Project/evidence names below are fictional sample achievements used to exercise product relationships, not representations of the developer's employment history.

## Opportunity A — Cloud Security Engineer

- **Company:** Cedarline Cloud Operations (fictional)
- **Location:** Vancouver, BC · Hybrid
- **Tags:** Kubernetes, Terraform, AWS, Python, GitHub Actions, Linux
- **Required:** `Build and validate Kubernetes admission controls.` · `Automate cloud infrastructure with Terraform and AWS.` · `Use Python to develop security automation.`
- **Preferred:** `Experience with production incident response.` · `Build secure CI pipelines with GitHub Actions.`

## Opportunity B — Application Security Engineer

- **Company:** Harborlight Security Products (fictional)
- **Location:** Toronto, ON · Remote
- **Tags:** Python, .NET, REST APIs, OWASP ASVS, GitHub Actions, SAST
- **Required:** `Review REST APIs for authentication weaknesses.` · `Automate security regression tests in Python.` · `Use OWASP ASVS to structure application reviews.`
- **Preferred:** `Experience operating SAST pipelines.` · `Experience with binary exploitation.`

## Opportunity C — Platform Reliability Engineer

- **Company:** Westhaven Platform Collective (fictional)
- **Location:** Burnaby, BC · Hybrid
- **Tags:** Go, Kubernetes, Docker, Terraform, Prometheus, Linux
- **Required:** `Build Go services for Kubernetes environments.` · `Operate Linux workloads using Docker.` · `Implement monitoring with Prometheus.`
- **Preferred:** `Use Terraform for infrastructure changes.` · `Experience running large-scale disaster recovery exercises.`

## Fictional portfolio evidence (for a separate demo identity)

| Project | Evidence record | Explicit Skill tags |
| --- | --- | --- |
| Sentinel Ridge Cluster Lab | Kubernetes admission-policy regression suite | Kubernetes, Go, Terraform |
| Sentinel Ridge Cluster Lab | Terraform plan-control validation workflow | Terraform, AWS, GitHub Actions |
| Harborlight API Security Bench | API authorization regression suite | Python, REST APIs, OWASP ASVS |
| Harborlight API Security Bench | CI security-analysis integration notes | GitHub Actions, SAST, Python |
| Fieldstone Reliability Toolkit | Linux service restoration runbook | Linux, Docker, Prometheus |
| Copperline Windows Diagnostics | Windows configuration parser and diagnostic report | .NET, C#, static analysis |

## Good screenshots must demonstrate

- A cloud security requirement with several linked candidate proof records.
- A different requirement with **no linked evidence** even though the skill exists.
- A broad behavioral requirement with **no recognized skill tag** (distinct from insufficient evidence).
- A source link and project/experience context where available.
- Clear owner-review labels, not green "verified match" badges or artificial fit percentages.

## Seeding and cleanup rules

1. Use an opt-in, idempotent terminal seed script against the local API. Print a complete dry-run first.
2. No real employer/company URL, employee identity, or real credentials in demo fixtures.
3. Don't modify/delete existing Profile, Experiences, Projects, Evidence or Opportunities unless the user explicitly reviews those exact records.
4. Make a private backup before any actual data edit.
5. The seed script and its tests are **planned for Slice 3B**. This document alone does not add database records.
