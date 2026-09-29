# The Continental — Design System

## Status

Version: v0.0A

This document defines the initial visual and interaction system for The Continental.

These decisions are intentionally concrete so the application does not invent new spacing, colors, typography, or component behavior on every screen.

The system can evolve when real usage exposes a problem, but changes should be deliberate.

---

# 1. Visual Direction

The Continental is a dark, precise, information-dense professional application with subtle luxury hospitality influence.

The visual hierarchy should come primarily from:

- typography
- spacing
- alignment
- restrained surface changes
- thin borders
- selective accent color

The interface should not rely on:

- giant cards
- excessive shadows
- gradients
- glowing effects
- decorative animation
- large amounts of gold
- movie imagery

The overall feeling should be:

**calm, exact, dark, warm, intelligent, trustworthy**

---

# 2. Color System

Components must use semantic tokens.

Do not place arbitrary hex values throughout feature code.

## Core Dark Theme

| Token | Value | Purpose |
| --- | --- | --- |
| canvas | `#0B0D0E` | Main application background |
| sidebar | `#0E1012` | Primary navigation background |
| surface | `#131619` | Standard panel and grouped surface |
| surface-raised | `#181C20` | Drawers, menus, selected panels |
| surface-hover | `#1C2024` | Hovered interactive surface |
| surface-active | `#22272C` | Pressed / active surface |
| border-subtle | `#22272B` | Quiet separation |
| border | `#2C3237` | Standard border |
| border-strong | `#3A4248` | Strong separation or selected edge |

---

## Typography Colors

| Token | Value | Purpose |
| --- | --- | --- |
| text-primary | `#F1EEE7` | Primary text |
| text-secondary | `#B8B3AA` | Secondary text |
| text-muted | `#88847D` | Metadata and quiet labels |
| text-disabled | `#625F5A` | Disabled states |
| text-inverse | `#181714` | Text on light surfaces |

Primary text should be a slightly warm ivory rather than pure white.

---

## Continental Brand Accent

| Token | Value | Purpose |
| --- | --- | --- |
| gold | `#B89A5B` | Primary brand accent |
| gold-hover | `#C5A76A` | Hovered gold interaction |
| gold-active | `#A8894E` | Pressed gold interaction |
| gold-muted | `#756441` | Quiet gold detail |
| gold-surface | `#211D15` | Subtle gold-tinted surface |

Gold should be used sparingly.

Good uses:

- selected navigation detail
- primary focus moments
- small icons
- important active states
- branding
- subtle dividers
- selected tabs

Bad uses:

- all headings
- every border
- every icon
- success states
- large backgrounds

---

# 3. Semantic Status Colors

Brand colors and status colors are separate systems.

## Success

| Token | Value |
| --- | --- |
| success | `#6FAF87` |
| success-text | `#9FD0AF` |
| success-surface | `#14231A` |
| success-border | `#294936` |

Use for:

- Supported
- successful sync
- completed workflow
- successful operation

---

## Warning / Partial

| Token | Value |
| --- | --- |
| warning | `#D0A45D` |
| warning-text | `#E3BE7B` |
| warning-surface | `#271F13` |
| warning-border | `#554121` |

Use for:

- Partial
- needs attention
- stale
- incomplete

---

## Danger

| Token | Value |
| --- | --- |
| danger | `#C96E6E` |
| danger-text | `#E59A9A` |
| danger-surface | `#2A1718` |
| danger-border | `#5A2B2D` |

Use for:

- failure
- destructive action
- validation failure
- disconnected integration

---

## Information

| Token | Value |
| --- | --- |
| info | `#769AB5` |
| info-text | `#A1BED2` |
| info-surface | `#15202A` |
| info-border | `#2A4558` |

Use for:

- informational system state
- neutral processing
- external source state

---

## Not Demonstrated

Not Demonstrated should not look like a failure.

Use a neutral treatment.

| Token | Value |
| --- | --- |
| neutral-status | `#858A8E` |
| neutral-status-text | `#B6BABD` |
| neutral-status-surface | `#1A1D20` |
| neutral-status-border | `#353A3E` |

---

# 4. Reading Surface

Long-form source content may use a light surface inside the dark application.

| Token | Value |
| --- | --- |
| document-bg | `#F1ECE1` |
| document-surface | `#F7F3EA` |
| document-text | `#26231E` |
| document-secondary | `#625C52` |
| document-border | `#D7CFC0` |
| document-accent | `#8C713D` |

Possible uses:

- original job posting
- resume preview
- imported document
- generated application material

The light surface should appear intentionally as a document.

Do not randomly alternate dark and light cards.

---

# 5. Typography

The application uses three typography roles.

## Primary UI Typeface

**Geist Sans**

Use for:

- navigation
- page titles
- body text
- forms
- tables
- buttons
- labels
- metadata

This should represent approximately 95% of interface text.

---

## Brand / Display Typeface

**Cormorant Garamond**

Use sparingly for:

- The Continental wordmark
- onboarding brand moments
- selected editorial headings
- future public landing page

Do not use the serif for normal working-interface headings.

---

## Technical Typeface

**Geist Mono**

Use for:

- IDs
- model names
- versions
- timestamps where appropriate
- trace information
- source references
- technical metadata

Do not use monospace simply to make something look technical.

---

# 6. Type Scale

Keep the scale compact.

## Display

### Brand Display

- size: 32px
- line-height: 38px
- weight: 500
- family: Cormorant Garamond

Use rarely.

---

## Application Headings

### Page Title

- size: 24px
- line-height: 30px
- weight: 600

### Section Title

- size: 16px
- line-height: 22px
- weight: 600

### Subsection Title

- size: 14px
- line-height: 20px
- weight: 600

---

## Body

### Body Large

- size: 15px
- line-height: 23px
- weight: 400

### Body

- size: 14px
- line-height: 21px
- weight: 400

### Compact Body

- size: 13px
- line-height: 19px
- weight: 400

---

## Labels / Metadata

### Label

- size: 12px
- line-height: 16px
- weight: 500

### Micro

- size: 11px
- line-height: 15px
- weight: 500

Micro text should only be used for nonessential metadata.

Never hide important information behind tiny typography.

---

# 7. Spacing Scale

Use a 4px base system.

| Token | Value |
| --- | --- |
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-5 | 20px |
| space-6 | 24px |
| space-8 | 32px |
| space-10 | 40px |
| space-12 | 48px |
| space-16 | 64px |

Do not introduce values such as 13px, 19px, or 27px because one screen happens to look slightly better.

If something repeatedly requires a new spacing value, update the system deliberately.

---

# 8. Layout

## Desktop App Shell

### Sidebar

Default width:

`232px`

Collapsed width later:

`64px`

Minimum useful desktop viewport:

`1024px`

The sidebar should:

- remain visually quiet
- use the sidebar background token
- have a subtle right border
- remain fixed while primary content scrolls

---

## Top Context Bar

Height:

`52px`

Purpose:

- breadcrumbs
- contextual navigation
- compact page-level actions
- optional search entry point

It should not become a second giant navigation bar.

---

## Main Content

Default page horizontal padding:

`32px`

Large desktop:

`40px`

Tablet:

`24px`

Mobile:

`16px`

---

## Content Width

Normal operational screens may use the available width.

Text-heavy content should generally use a readable maximum width.

Recommended reading width:

`760px`

Forms:

approximately `640px`

Do not constrain dense tables to an artificial centered column.

---

# 9. Responsive Breakpoints

Initial breakpoints:

| Name | Width |
| --- | --- |
| mobile | `< 640px` |
| tablet | `640px – 1023px` |
| desktop | `1024px – 1439px` |
| wide | `>= 1440px` |

These are starting rules, not device labels.

Components should respond to available space rather than assuming a specific device.

---

## Desktop

- persistent sidebar
- full table layouts
- multi-column layouts allowed
- detail drawer supported
- source/result split views supported

---

## Tablet

- sidebar may collapse
- reduce page gutters
- multi-column views may become stacked
- retain dense information where readable

---

## Mobile

At approximately 390px:

- sidebar becomes off-canvas navigation
- tables become responsive structured lists when necessary
- primary actions remain visible
- drawers may become full-screen sheets
- no horizontal page overflow

Do not add mobile bottom navigation in v0.0.

---

# 10. Shape

The Continental should feel slightly more architectural than a typical rounded SaaS interface.

## Border Radius

| Token | Value |
| --- | --- |
| radius-sm | 4px |
| radius-md | 7px |
| radius-lg | 10px |
| radius-xl | 14px |
| radius-full | 999px |

Usage:

- buttons: 7px
- inputs: 7px
- cards/panels: 8–10px
- modal: 10px
- drawer: minimal radius depending on edge
- status chips: full radius where appropriate

Avoid 16–24px rounded rectangles throughout the application.

---

# 11. Borders

Default border:

`1px solid border`

Subtle separators:

`1px solid border-subtle`

Focused / selected objects may use:

- stronger border
- gold accent edge
- background change

Avoid heavy outlines.

---

# 12. Shadows

Most static surfaces should use no shadow.

Separation should come from:

- color
- border
- spacing

Shadows are reserved for floating objects.

## Floating Shadow

Use for:

- command palette
- popover
- dropdown
- modal
- floating menu

Direction:

soft, dark, low-spread.

Do not use bright or glowing shadows.

---

# 13. Icons

Use one icon family.

Initial choice:

**Lucide**

Default sizes:

| Context | Size |
| --- | --- |
| Micro metadata | 14px |
| Standard UI | 16px |
| Navigation | 17–18px |
| Large action | 20px |

Icons should normally inherit text color.

Avoid decorative icons.

Avoid emoji in production navigation.

Theme-specific symbols may be introduced only if their meaning remains obvious without the theme.

---

# 14. Navigation

## Sidebar Structure

Initial v0.0 / v0.1 navigation:

### Primary

- Lobby
- Armory

Only add:

- Dossiers
- Contracts
- Archive
- High Table
- Mission Control

when those features actually exist.

### Secondary / Bottom

- Settings

Charon terminology may appear once integrations exist.

---

## Navigation Item

Height:

`36px`

Padding:

`8px 10px`

Gap between icon and text:

`10px`

Active state should use:

- slightly raised surface
- stronger text
- restrained gold detail

Do not fill the entire active item bright gold.

---

# 15. Buttons

Button height:

Standard: `36px`

Compact: `30px`

Large: `40px`

Horizontal padding:

Standard: `14px`

---

## Primary Button

Use for the single most important action.

Dark theme:

- gold background
- dark text

Examples:

- Add Evidence
- Create Dossier
- Save Changes
- Approve

Avoid having three primary buttons visible together.

---

## Secondary Button

- subtle surface
- standard border
- primary text

---

## Ghost Button

- transparent
- no visible border by default
- hover surface appears

Good for low-emphasis actions.

---

## Destructive Button

Use danger tokens.

Never use gold for destructive actions.

---

## Loading Button

Preserve button width where practical.

Show:

- loading indicator
- action text or clear processing label

Avoid replacing text with only a spinner.

---

# 16. Inputs

Default height:

`36px`

Large multi-line inputs follow content needs.

Inputs use:

- surface background
- standard border
- primary text
- visible focus ring
- associated label
- inline error when invalid

Placeholder text uses muted text.

Do not rely on placeholder text as a label.

---

# 17. Focus Treatment

Keyboard focus must always be visible.

Initial focus treatment:

- 2px outer ring
- gold-muted / gold
- small offset from component edge

Focus should feel deliberate rather than neon.

Do not remove browser focus without replacing it.

---

# 18. Tables and Lists

Dense data should prefer rows.

## Standard Row

Height:

`44px`

Compact rows may use:

`40px`

Rows may expand when content genuinely requires it.

---

## Table Header

Height:

`36px`

Use:

- muted text
- 12px labels
- subtle bottom border

Avoid heavy table header backgrounds unless hierarchy requires one.

---

## Row Hover

Use:

`surface-hover`

Do not change layout or border width on hover.

---

## Selected Row

Use:

- raised surface
- optional subtle gold left edge
- clear text contrast

---

# 19. Cards and Surfaces

Cards are meaningful containers, not default layout primitives.

Use a card when it represents:

- a distinct object
- a meaningful grouped state
- an approval
- an empty state
- a summary object

Avoid wrapping every section in an independent card.

Standard card padding:

`16px`

Large panel padding:

`20px` or `24px`

---

# 20. Status Chips

Requirement states are always shown with text and icon.

## Supported

`✓ Supported`

Use success tokens.

## Partial

`◐ Partial`

Use warning tokens.

## Not Demonstrated

`— Not Demonstrated`

Use neutral status tokens.

Status chip height:

approximately `24px`

Text:

12px / medium

Padding:

`4px 8px`

Color is reinforcement, not meaning.

---

# 21. Evidence Component

Evidence is a signature component.

It must remain visually consistent throughout the product.

## Compact Evidence Chip

May display:

- source icon
- evidence title or abbreviated source
- verification state

Example:

`◆ MCAP · Shodan Automation`

---

## Evidence Source Card

May display:

- evidence title
- source type
- related project / experience
- date
- skills
- verification status
- short excerpt
- inspect action

Recommended structure:

```text
SOURCE TYPE                         VERIFIED

MCAP · Shodan Automation

Automated recurring external exposure reporting using
Python and Azure DevOps.

Python · Azure DevOps · Security Automation

Jul 2026                              View source →
```

The component should communicate:

**This is evidence, and I can inspect it.**

---

# 22. Drawers

Use a drawer when the user needs detail without losing the surrounding context.

Good uses:

- evidence inspection
- requirement detail
- activity history
- record preview

Desktop width:

approximately `440px – 520px`

Large detail drawer:

up to `640px`

Mobile:

full-width sheet.

Drawers should preserve browser/back navigation behavior when appropriate.

---

# 23. Modals

Use a modal for a bounded decision or short task.

Good uses:

- confirm deletion
- small create form
- approval decision
- dangerous action confirmation

Do not use a modal for reading large records or long workflows.

Use a page or drawer instead.

---

# 24. Toasts

Use toasts for brief confirmation.

Examples:

- Evidence saved
- Changes updated
- Import rejected
- Connection revoked

Toasts should not contain information the user must remember.

Critical errors belong inline or in a persistent error panel.

---

# 25. Empty States

Every data-driven screen needs an intentional empty state.

An empty state should contain:

1. what this area is for
2. why it is empty
3. the next useful action

Example:

```text
No evidence yet

Evidence is the source material The Continental uses to
support your skills and career claims.

[ Add your first evidence ]
```

Avoid unnecessary illustrations.

---

# 26. Loading States

Use skeletons when the final structure is predictable.

Use explicit progress when work has meaningful stages.

Examples:

```text
Extracting requirements
12 of 18 processed
```

or:

```text
Analyzing opportunity

✓ Source accepted
✓ Requirements extracted
◌ Retrieving evidence
○ Assessing requirements
```

Do not show an indefinite spinner for a long-running workflow if progress can be described.

---

# 27. Error States

Errors should answer:

1. What failed?
2. Was anything saved?
3. What can I do next?

Example:

```text
Evidence assessment failed

Your Dossier and extracted requirements are safe.
No assessment results were saved.

[ Try again ]
```

Do not show raw stack traces to users.

---

# 28. Approval Cards

Approval becomes important when Winston or Charon can take consequential actions.

Approval cards should clearly display:

- proposed action
- target
- reason
- data involved
- permission level
- approve action
- reject action

The user should never approve an ambiguous action.

---

# 29. Command Palette

Not required for the first v0.0 screen.

Reserve:

`Ctrl + K`

Potential future actions:

- Search evidence
- Open Dossier
- Add Evidence
- Add Project
- Create Contract
- Open application

The command palette supplements navigation.

It does not replace it.

---

# 30. Motion

Motion should be fast and functional.

## Timing

Micro interaction:

`100–140ms`

Standard transition:

`160–180ms`

Drawer / modal:

`180–220ms`

Avoid transitions longer than approximately 250ms during routine work.

---

## Easing

Use a simple ease-out style for entering UI and a slightly faster exit.

Motion should never become part of the visual spectacle.

---

## Reduced Motion

Respect:

`prefers-reduced-motion`

Animations should collapse to immediate or minimal state changes when requested.

---

# 31. Z-Index Scale

Use a small predictable scale.

| Layer | Value |
| --- | --- |
| base | 0 |
| sticky | 10 |
| dropdown | 30 |
| drawer | 40 |
| modal | 50 |
| toast | 60 |
| command palette | 70 |

Avoid arbitrary values such as `z-index: 99999`.

---

# 32. Accessibility Baseline

Minimum v0.0 requirements:

- keyboard navigation
- visible focus state
- semantic landmarks
- semantic headings
- labels for inputs
- understandable validation errors
- sufficient color contrast
- status communicated beyond color
- reduced-motion support
- usable interface at 200% zoom where practical
- no critical hover-only interaction

---

# 33. Initial Component Kit

The first shared component system should include:

- Button
- IconButton
- Input
- Textarea
- Select
- Search / Combobox
- Card / Surface
- PageHeader
- SectionHeader
- Badge
- StatusChip
- SidebarItem
- Breadcrumb
- Table
- EmptyState
- ErrorState
- Skeleton
- Toast
- Drawer
- Modal
- EvidenceChip
- EvidenceCard

Later additions:

- ApprovalCard
- Timeline
- Stepper
- ChartContainer
- CommandPalette

Do not build later components until a real feature needs them.

---

# 34. v0.0 App Shell Specification

The first implemented shell should contain:

```text
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR │ CONTEXT BAR                                   │
│         ├───────────────────────────────────────────────┤
│ Brand   │                                               │
│         │                                               │
│ Lobby   │              MAIN WORKSPACE                   │
│ Armory  │                                               │
│         │                                               │
│         │                                               │
│         │                                               │
│ Settings│                                               │
└─────────────────────────────────────────────────────────┘
```

Desktop:

- 232px sidebar
- 52px context bar
- dark canvas
- subtle sidebar border
- 32–40px page gutters

The Lobby becomes the first realistic screen used to pressure-test this system.

---

# 35. First Lobby Direction

The v0.0 Lobby is not a fake finished dashboard.

Its purpose is to prove the visual system.

It may contain seeded examples such as:

## Header

```text
Lobby

Your career intelligence workspace.
```

Primary action:

`Add Evidence`

---

## Current Focus

A restrained panel showing:

- evidence count
- recent project
- profile completeness or setup state
- one useful next action

Do not create fake analytics.

---

## Recent Evidence

Compact evidence rows.

This pressure-tests:

- metadata
- evidence chips
- row density
- typography
- hover states

---

## Getting Started

Small checklist:

```text
✓ Continental initialized
○ Add first experience
○ Add first project
○ Attach evidence
○ Link evidence to a skill
```

This gives the empty early product something useful to display without pretending advanced functionality exists.

---

# 36. Design QA Targets

Every important screen should eventually be checked at:

- 1440px desktop
- approximately 1024px
- approximately 768px
- approximately 390px

Test with:

- normal data
- no data
- long data
- loading
- error
- disabled state
- keyboard focus

---

# 37. Implementation Direction

Initial frontend direction:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui-style accessible primitives where useful
- Radix primitives where appropriate
- Lucide icons
- design tokens expressed through CSS variables

The purpose of the component foundation is accessibility and consistency.

The final application should not look like an untouched component-library demo.

---

# 38. Token Naming Rule

Implementation tokens should describe purpose rather than arbitrary appearance.

Good:

```text
--background
--surface
--surface-raised
--border
--text-primary
--text-muted
--accent
--success
--warning
--danger
```

Avoid feature code containing values such as:

```text
bg-zinc-900
text-yellow-600
border-gray-700
```

unless those classes resolve through an intentional component or token abstraction.

The UI should be able to evolve without searching hundreds of files for random color values.

---

# 39. Light Mode

Dark mode is the signature initial experience.

Light mode is not required for v0.0.

However:

- semantic tokens must be used
- components must not assume literal black backgrounds
- color names should describe purpose
- architecture should permit a future alternate theme

Do not spend v0.0 building light mode unless implementation makes it nearly free.

---

# 40. Definition of Done for the Visual Foundation

The visual foundation is ready when:

- design principles are documented
- design references are documented
- colors are tokenized
- typography is defined
- spacing is defined
- shape is defined
- application shell dimensions are defined
- navigation behavior is defined
- core component behavior is defined
- responsive behavior is defined
- loading, empty, and error patterns are defined
- Evidence has a recognizable visual pattern
- status treatments are accessible
- motion rules are defined

The next step is implementation.

Do not continue expanding the design document indefinitely.

The design system becomes real by testing it against actual screens.