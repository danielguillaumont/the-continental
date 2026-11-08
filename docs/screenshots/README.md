# Public portfolio screenshots

These screenshots were captured from The Continental v0.1.0 running locally at 1440x900. They are not a hosted demo.

- `overview-desktop.png` - Overview workspace
- `armory-desktop.png` - Evidence library
- `capture-manifest.json` - Capture routes, commit, timestamps, SHA-256 checksums and manual public-sharing review flags

Before publishing, inspect each screenshot for personal data, sensitive details, misleading records and loading/error states. A manual public-sharing review does **not** establish that records are synthetic or independently verified. Source files are never copied from PostgreSQL into this directory.

To recapture, use `scripts/zip-workflow/Capture-ContinentalPortfolioReady.ps1` with local API Server and Web running. It writes into `~/Pictures/Continental-Portfolio-Review` before images are selected for publication.

## v0.3 Evidence Match release-candidate gallery

- `dossier-v03-evidence-match-hero.png` — cropped, readable Dossier + Evidence Match view for the first README screen
- `dossier-v03-cloud-security-desktop.png` — full Cloud Security Engineer Dossier (Cedarline Cloud Operations, fictional)
- `dossier-v03-application-security-desktop.png` — full Application Security Engineer Dossier (Harborlight Security Products, fictional)
- `dossier-v03-platform-reliability-desktop.png` — full Platform Reliability Engineer Dossier (Westhaven Platform Collective, fictional)
- `v03-capture-manifest.json` — manual review confirmation, capture-source filenames, checksums and local commit

These four images are **not** included as pre-rendered substitutes in the source-change package. They must be generated from the locally running v0.3 release candidate after its version-label update, then visually reviewed and copied with `scripts/v03/Publish-ContinentalV03PortfolioScreenshots.ps1`.

The publishing script rejects loading/error captures by image dimensions only as a preliminary safeguard; a manual human review of text, fictional identities, rendered Evidence Match, stale version labels and private data is mandatory. Source images stay under `Documents/Continental-Screenshot-Review` and are never copied directly from PostgreSQL. Do not publish browser logs, real records or unreviewed screenshots.
