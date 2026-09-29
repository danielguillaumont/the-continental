# The Continental — Design References

## Purpose

This document records the real products, interfaces, and visual references that influence The Continental.

The goal is not to copy another product's branding.

The goal is to study proven solutions for:

- navigation
- information density
- records and tables
- search
- command interfaces
- detail views
- activity and provenance
- loading and system state
- responsive behavior
- visual hierarchy
- atmosphere

For every reference, I should be able to explain what I am borrowing and why.

---

# Reference Strategy

The Continental should combine three different visual worlds.

## 1. Professional Productivity Software

This is the largest influence.

The product should feel comfortable beside serious software such as:

- Linear
- Attio
- Vercel
- Stripe
- GitHub
- Raycast

These products provide the interaction patterns.

---

## 2. Luxury Hospitality and Editorial Design

This provides the sense of quality.

Useful characteristics:

- strong typography
- restrained color
- precise alignment
- thin rules
- warm materials
- generous section spacing
- quiet detail
- intentional hierarchy

The goal is refinement rather than decoration.

---

## 3. The Continental / John Wick Atmosphere

This provides personality.

Useful characteristics:

- deep dark environments
- warm amber and brass highlights
- ivory paper and stationery
- dark wood and leather
- symmetry
- formal composition
- elegant typography
- controlled color
- a sense of order and ritual

The movie influence should remain atmospheric.

The application must never become a John Wick fan site.

---

# Reference 01 — Linear

## What I Am Studying

Linear is the main reference for:

- application density
- sidebar restraint
- navigation hierarchy
- typography
- keyboard-friendly interaction
- compact lists
- subtle status treatment
- focus

Its interface handles large amounts of operational information without making every object visually loud.

## What I Want to Borrow

### Quiet Sidebar

The sidebar should be visually quieter than the main workspace.

Navigation exists to get the user somewhere.

Once the user arrives, it should stop competing for attention.

### Consistent Screen Structure

Major screens should share predictable:

- headers
- navigation
- filters
- view controls
- action placement

The user should not need to relearn the interface on every page.

### Compact Information

Rows can contain useful metadata without becoming large cards.

Use small typography and subtle hierarchy carefully rather than increasing component size.

### Fast Interaction

Important actions should be reachable through:

- keyboard navigation
- shortcuts
- command/search
- predictable controls

## What I Do Not Want to Copy

- Linear's branding
- purple accents
- exact component styling
- extreme minimalism where it harms Continental identity

## Continental Application

Best reference for:

- app shell
- Lobby
- Dossier lists
- Armory lists
- Archive lists
- keyboard interaction

---

# Reference 02 — Attio

## What I Am Studying

Attio is a strong reference because The Continental is also fundamentally a system of structured records and relationships.

Attio separates navigation from the main working area and allows complex records to remain understandable.

## What I Want to Borrow

### Record-Centric Design

A Project, Experience, Evidence item, Dossier, Contract, and Application should feel like durable objects rather than temporary screens.

A record should be something the user can:

- find
- inspect
- edit
- link
- filter
- revisit

### Sidebar + Workspace

Use a persistent navigation system with a large working region.

The navigation should provide orientation without reducing the useful workspace unnecessarily.

### Detail Without Navigation Loss

Where appropriate, selecting an object should expose detail without completely removing the surrounding context.

This may use:

- a detail drawer
- a split view
- a dedicated record page

depending on the task.

### Search and Quick Actions

Global search and a command interface can eventually provide fast access to:

- Evidence
- Projects
- Dossiers
- Contracts
- Applications
- actions

The keyboard should become a fast path, not a requirement.

### Tables and Views

Structured records should support:

- filtering
- sorting
- visible attributes
- compact rows
- saved views later if justified

## What I Do Not Want to Copy

- CRM language
- colorful tags everywhere
- excessive customization before the core workflow exists

## Continental Application

Best reference for:

- Armory
- Evidence records
- Experience records
- Dossier records
- detail drawers
- future global search

---

# Reference 03 — Vercel

## What I Am Studying

Vercel is useful for application-shell design and operational clarity.

Its interface gives technical information a clear structure without introducing unnecessary visual decoration.

## What I Want to Borrow

### Resizable / Collapsible Navigation

Desktop navigation may eventually collapse when additional workspace is useful.

The content should remain usable when navigation is reduced.

### Workflow-Based Navigation Order

Navigation should be ordered around what the user actually does most often.

Do not order sections because they sound impressive.

### Consistency

Navigation behavior should remain predictable across sections.

### Operational States

System state should be clearly visible.

Examples for The Continental:

- processing
- synced
- failed
- awaiting approval
- complete
- stale

## What I Do Not Want to Copy

- pure developer-tool aesthetic
- excessive monochrome
- making The Continental feel like a hosting dashboard

## Continental Application

Best reference for:

- application shell
- status design
- Mission Control
- Charon connections
- technical settings

---

# Reference 04 — Stripe

## What I Am Studying

Stripe is useful because it presents consequential technical and financial operations with strong clarity.

The user should understand:

- what happened
- what is happening
- what failed
- what action is available

without needing to inspect raw system information.

## What I Want to Borrow

### Clear Operational Hierarchy

Important state should appear before secondary metadata.

### Contextual Actions

Actions belong near the object or state they affect.

### Serious Error Design

Errors should look intentional rather than like broken UI.

A failed workflow should explain:

- what failed
- what was preserved
- what the user can do next

### Data With Explanation

Charts and metrics should have:

- a clear title
- context
- source
- drill-down

A chart should answer a question rather than decorate a dashboard.

## What I Do Not Want to Copy

- payment-dashboard aesthetics
- excessive numerical emphasis
- charts where lists or text are clearer

## Continental Application

Best reference for:

- High Table
- Mission Control
- errors
- approval states
- analytics
- system status

---

# Reference 05 — GitHub

## What I Am Studying

GitHub is one of the strongest references for connecting records, history, metadata, and provenance.

The Continental also needs to let a user inspect where information came from.

## What I Want to Borrow

### High-Density Tables

Large datasets should use rows rather than oversized cards.

Tables should eventually support:

- filtering
- sorting
- grouping
- configurable fields where useful

### Metadata Beside Objects

Useful metadata can remain visible without dominating the primary title.

Examples:

- source
- date
- verification
- related skill
- project
- status

### History and Provenance

An object should be able to show how it changed and where it originated.

This is especially relevant to Evidence.

### Multiple Views Over the Same Data

The underlying data should not depend on one presentation.

For example, Applications may eventually be viewed as:

- list
- stage board
- timeline

without becoming separate data models.

## What I Do Not Want to Copy

- developer-specific terminology
- visual clutter created by exposing every possible control

## Continental Application

Best reference for:

- Evidence provenance
- Archive timelines
- record metadata
- dense tables
- source history

---

# Reference 06 — Raycast

## What I Am Studying

Raycast is useful for understanding keyboard-first interaction and command discovery.

It makes advanced functionality fast without requiring large permanent controls.

## What I Want to Borrow

### Command Palette

A future Continental command interface could provide actions such as:

- Search evidence
- Open Dossier
- Add project
- Add evidence
- Create Contract
- Open application
- Start opportunity analysis

Possible shortcut:

Ctrl + K

### Visible Keyboard Hints

Shortcuts can appear subtly next to actions where useful.

### Search as an Action Surface

Search should eventually do more than filter a page.

It should help users quickly navigate the career graph.

## What I Do Not Want to Copy

- turning the whole application into a command launcher
- requiring keyboard knowledge
- floating command UI as the primary product experience

## Continental Application

Best reference for:

- global search
- command palette
- keyboard shortcuts
- quick actions

---

# Reference 07 — John Wick / The Continental

## What I Am Studying

The films provide atmosphere rather than software interaction patterns.

The useful elements are:

- darkness
- contrast
- warm light
- controlled color
- symmetry
- formality
- rich materials
- deliberate composition

The visual world often combines dark environments with concentrated amber, green, red, or other strong lighting.

For the software product, this should be translated rather than copied.

## What I Want to Borrow

### Dark Environment

Use layered charcoal rather than flat pure black.

### Warm Accent

Use restrained antique gold / brass as the primary brand accent.

It should appear in places such as:

- active navigation
- selected states
- focus moments
- small dividers
- signature controls
- branding

It should not appear everywhere.

### Warm Ivory

Paper, dossiers, hotel stationery, cards, and formal documents suggest a warm ivory reading surface.

This can provide contrast for:

- job source text
- resumes
- generated documents
- import review

### Symmetry and Alignment

The film world often feels deliberately composed.

The software equivalent is:

- strong grid alignment
- deliberate spacing
- clean column relationships
- consistent vertical rhythm

### Material Cues

Possible subtle cues:

- brass
- dark wood
- leather
- ivory paper
- ledger lines
- engraved typography

These should influence color and detail.

Do not literally texture the interface like wood or leather.

### Formal Typography

A restrained serif may appear for:

- the wordmark
- selected section moments
- onboarding
- major brand surfaces

The working UI remains primarily sans-serif.

## What I Do Not Want to Copy

- weapons
- blood
- characters
- movie stills
- quotes
- gold coins as UI controls
- constant neon
- assassin role-play
- cinematic HUD graphics
- copyrighted logos or artwork

## Continental Application

Best reference for:

- brand identity
- palette
- typography contrast
- document surfaces
- visual atmosphere

---

# Reference 08 — Professional Editorial / Luxury Hospitality

## What I Am Studying

The Continental should feel more like a refined hotel, publication, or private members' environment than a gaming interface.

Useful visual ideas include:

- understated serif typography
- warm paper tones
- precise rules
- small uppercase labels
- generous section spacing
- narrow use of metallic accent colors
- carefully aligned information

## What I Want to Borrow

### Restraint

Luxury should come from fewer better details.

### Hierarchy Through Typography

Not every level needs a box or different background.

Typography can establish hierarchy.

### Rules and Dividers

Thin lines can separate information more elegantly than multiple nested cards.

### Editorial Reading Surfaces

Long-form material should be comfortable to read.

## Continental Application

Best reference for:

- Dossier source view
- generated materials
- brand moments
- document presentation
- onboarding

---

# Reference Matrix

| Continental Need | Primary Reference | Secondary Reference |
| --- | --- | --- |
| Application shell | Linear | Vercel |
| Sidebar | Linear | Attio |
| Global search | Raycast | Attio |
| Dense records | Attio | GitHub |
| Evidence detail | GitHub | Attio |
| Tables | GitHub | Linear |
| Dossier layout | Attio | Stripe |
| Requirement assessment | Linear | GitHub |
| Source document view | Editorial / Continental | Stripe |
| Import review | Attio | GitHub |
| Workflow status | Vercel | Stripe |
| Mission Control | Stripe | Vercel |
| Archive timeline | GitHub | Attio |
| High Table | Stripe | Linear |
| Brand atmosphere | Continental | Luxury editorial |

---

# Patterns We Are Committing To

These patterns are approved starting directions.

## Navigation

- persistent desktop sidebar
- visually quieter than the main workspace
- only current features appear
- global search becomes available when useful
- narrow screens use an intentional collapsed navigation pattern

## Screen Header

A normal application screen should generally contain:

1. location / breadcrumb if needed
2. title
3. one-line context when useful
4. primary action
5. local controls such as filter or search

Avoid giant marketing-style headings inside the product.

## Lists and Tables

Default to structured rows when many objects are displayed.

Use cards when an object genuinely benefits from a visual container.

## Detail

Use progressive disclosure.

Possible hierarchy:

List  
→ Selected object  
→ Detail  
→ Source / history

The user should not be forced through several pages to inspect supporting evidence.

## Search

Search should eventually support:

- filtering within a screen
- finding records globally
- launching common actions

These are separate capabilities and should not be confused.

## Status

Status always uses:

- text
- icon or shape
- optional color

Never color alone.

## Evidence

Evidence uses a recognizable reusable component throughout the application.

It should feel like a first-class object rather than a hyperlink footnote.

## AI

AI appears as part of a workflow.

Do not create a permanent generic chatbot as the main interface.

## Loading

Prefer:

- skeletons for predictable layouts
- explicit progress for long-running work
- preserved content during refreshes

Avoid blank screens and unexplained spinning indicators.

## Errors

Errors should explain:

- what failed
- what remains safe
- what the user can do next

## Empty States

Empty states should explain the next useful action.

Do not fill them with decorative illustrations unless the illustration genuinely helps.

---

# Visual Reference Capture List

Before the first UI implementation is considered complete, capture approximately 8–15 reference screenshots and store them under:

`docs/screenshots/references/`

Suggested screenshots:

1. Linear — main sidebar + dense issue/list view
2. Linear — detail view with metadata
3. Attio — sidebar + records table
4. Attio — record detail page or detail panel
5. Vercel — current sidebar navigation
6. Vercel — operational status/detail screen
7. Stripe — dense operational dashboard or Workbench
8. GitHub Projects — table view
9. GitHub — issue/activity or provenance view
10. Raycast — command/search interface
11. John Wick — Continental interior with dark wood, brass, and warm light
12. John Wick — composition showing strong dark/amber or green/amber contrast
13. Luxury hotel/editorial reference — typography and spacing
14. Editorial document reference — warm paper and thin rules

The screenshot itself is not the design decision.

Each screenshot should have a short note describing what is useful about it.

---

# Things We Should Actively Avoid

The final product should not resemble:

- a generic Tailwind admin template
- a crypto dashboard
- a gaming HUD
- a cyberpunk interface
- a movie fan website
- an AI chatbot wrapper
- a dashboard filled with meaningless charts
- a collection of giant rounded cards
- black backgrounds with gold applied to everything

---

# Overall Direction

The strongest combination for The Continental is:

**Linear**
for calm density and navigation

+

**Attio**
for structured records and detail

+

**GitHub**
for provenance and information-heavy views

+

**Vercel / Stripe**
for operational clarity

+

**Raycast**
for fast keyboard interaction

+

**The Continental**
for atmosphere and identity

The final result should feel familiar enough that the interface is immediately usable, but distinctive enough that it clearly belongs to The Continental.