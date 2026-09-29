# The Continental — Product Vision

## What I Am Building

The Continental is an AI career intelligence and operations platform.

The core idea is that a person's career should be represented as evidence, not a pile of resumes and vague skill claims. The application builds a living picture of what the user has actually done, then uses that evidence to understand opportunities, prepare applications, identify gaps, organize recruiting work, and eventually help the user close those gaps.

The John Wick inspiration gives the product a useful language for dossiers, an armory, contracts, an archive, a concierge, and an orchestrator. The theme should remain subtle. The Continental must still feel like a serious professional product to somebody who has never seen the films.

## One Sentence

The Continental turns verified experience into a living evidence graph and uses AI to research opportunities, prepare grounded application material, manage recruiting workflows, and identify what the user should build or learn next.

## North Star

Turn real career evidence into useful, grounded actions.

The Continental is not another resume scorer and it is not another generic AI chat box.

## The Problem

Career information becomes scattered across:

- resumes
- work experience
- GitHub repositories
- personal projects
- certifications
- school work
- job postings
- application trackers
- interview notes
- recruiting emails
- personal notes

Existing tools often reduce this information to keyword matching or generic AI-generated advice.

The Continental should instead help answer questions such as:

- What evidence do I actually have for this requirement?
- Where did that evidence come from?
- Which requirements are well demonstrated?
- Which requirements are only partially demonstrated?
- Which gaps appear repeatedly across the jobs I am targeting?
- What is the smallest useful thing I could build or learn to create evidence for that gap?
- What happened the last time I applied for a similar role?
- What interview lessons should I remember?
- What should I do next?

## Core Product Loop

Evidence

→ Understand Opportunity

→ Take Grounded Action

→ Create Better Evidence

→ Remember the Outcome

Everything in the product should strengthen this loop.

## Product Principles

### Evidence Before Generation

If The Continental says I know something, it should be able to explain why.

Generated claims should point back to inspectable evidence.

### No Fake Precision

Avoid arbitrary match percentages such as "87% match."

Prefer:

- Supported
- Partial
- Not Demonstrated

with explanations and evidence.

### Human Approval for Consequential Actions

The application may research, analyze, prepare, and draft.

Actions that change external systems or communicate on the user's behalf should require explicit approval.

### Useful Without AI

The underlying data model, evidence system, application tracking, and browsing experience should remain useful even if the AI provider is unavailable.

### Small Releases

Each version should introduce one coherent capability.

Do not build the final vision all at once.

### Privacy Is a Feature

Career data can contain personal information.

Collect the minimum necessary data, protect secrets, support deletion and export, and avoid exposing private information in logs.

### Observability Matters

Important workflows, AI calls, failures, latency, and cost should eventually be explainable.

The system should be able to answer:

"What did it do and why?"

### Theme Stays Subtle

The John Wick / Continental influence should appear through terminology, typography, materials, tone, and restrained visual details.

Do not build a fan site.

Do not rely on copyrighted movie artwork.

### Dogfood First

I am User #1.

The product should solve problems in my real career and job-search workflow before expanding for hypothetical users.

### No Framework Collecting

Do not add technologies simply because they are fashionable.

Redis, Kubernetes, vector databases, workflow frameworks, agents, MCP, and other infrastructure must earn their place by solving a real product problem.

## Product Language

| Term | Meaning |
| --- | --- |
| Lobby | Home and current priorities |
| Dossier | Structured opportunity and job analysis |
| Evidence | A fact or artifact supporting a career claim |
| Evidence Graph | Relationships between experience, skills, projects, and evidence |
| Armory | Career evidence, projects, stories, and application material |
| Contract | A bounded mission that closes an evidence or skill gap |
| Archive | Applications, interviews, outcomes, and long-term career memory |
| High Table | Aggregated intelligence across saved opportunities |
| Sommelier | Opportunity analysis and research capability |
| Armorer | Grounded application-preparation capability |
| Charon | External integration layer |
| Winston | Workflow and orchestration layer |
| Mission Control | Visible workflow execution, approvals, failures, and retries |

## What Success Looks Like

Early success is simple:

I can enter my real career evidence, paste a real job description, and receive a Dossier that is more useful than manually comparing a resume against the posting.

Later, The Continental should help with:

- evidence-grounded job analysis
- application preparation
- recurring skill-gap discovery
- portfolio planning
- application tracking
- interview preparation
- recruiting memory
- market intelligence
- safe workflow automation

The long-term product may become a career operating system.

That complexity has to be earned one release at a time.