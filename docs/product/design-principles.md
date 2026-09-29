# The Continental — Design Principles

## Design North Star

The Continental should feel like a private intelligence desk inside a luxury hotel, built with the restraint of a serious modern SaaS product.

The product should be:

- professional first
- quietly premium
- information-dense without feeling crowded
- trustworthy
- fast
- calm
- visually distinctive without becoming themed software

A useful mental balance is:

**80% professional productivity software**  
**15% luxury hospitality and editorial design**  
**5% John Wick / Continental atmosphere**

The influence should be felt more than announced.

---

## 1. Professional Before Themed

The Continental is a career intelligence product first.

A user should never need to understand a John Wick reference to understand the interface.

Continental terminology can provide personality, but standard interface behavior must remain obvious.

Good:

- Lobby
- Dossier
- Armory
- Archive
- Contract
- High Table
- Mission Control

Avoid:

- obscure movie references used instead of understandable controls
- decorative weapons
- character artwork
- movie screenshots
- unnecessary quotes
- interface language that becomes role-play

The application should look credible enough to show to a recruiter, engineer, designer, or real user without explanation.

---

## 2. Dark, Not Black

The application should use a layered charcoal environment rather than pure black.

Visual hierarchy should come from subtle differences between:

- application canvas
- sidebar
- surfaces
- elevated surfaces
- borders
- typography

Warm ivory and restrained antique gold provide contrast and identity.

Gold is a brand accent.

Gold does not mean success.

Semantic states keep their own colors.

---

## 3. Quietly Premium

Premium does not mean decorative.

The interface should rely on:

- excellent typography
- alignment
- consistent spacing
- thin rules
- restrained borders
- subtle material differences
- intentional information hierarchy

Avoid:

- giant gradients
- excessive glow
- oversized cards
- glassmorphism everywhere
- decorative charts
- excessive animation
- large empty hero areas inside working screens

The product should feel expensive because it is precise.

---

## 4. Dense, Not Crowded

The Continental will eventually contain large amounts of information:

- evidence
- skills
- projects
- job requirements
- application history
- interviews
- workflow activity
- market analytics

The interface should support dense information without overwhelming the user.

Use:

- tables
- structured lists
- drill-downs
- drawers
- filters
- search
- progressive disclosure
- compact metadata
- strong section hierarchy

Do not place everything inside giant cards.

Whitespace should separate concepts.

Within a concept, information can remain compact.

---

## 5. One Obvious Next Action

Each primary screen should quickly answer:

1. Where am I?
2. What matters here?
3. What can I do next?
4. Why should I trust what I am seeing?

Where possible, a screen should have one obvious primary action.

Secondary actions should remain available without competing visually with the main task.

---

## 6. Evidence Is a First-Class Visual Object

Evidence is the foundation of The Continental.

Evidence should have a consistent visual representation throughout the product.

An evidence item may show:

- source
- title
- date
- related skill
- related project or experience
- verification state
- source type

Evidence should be inspectable with minimal friction.

The same evidence component should appear in:

- Armory
- Dossiers
- requirement assessments
- generated application material
- Contracts
- interview preparation
- workflow results

Users should develop an immediate understanding that:

**This is why The Continental believes this claim.**

---

## 7. AI Lives Inside Workflows

The main interface should not become a chatbot.

AI should appear where it provides a specific capability.

Examples:

- extracting a job description
- assessing a requirement
- preparing an application draft
- generating a Contract
- analyzing evidence
- coordinating a Winston workflow

AI interactions should expose useful state such as:

- processing
- progress
- complete
- approval required
- failed
- retrying

Avoid unexplained spinners followed by unexplained answers.

---

## 8. Provenance Beside Claims

Users should not need to visit a separate audit screen to understand where information came from.

When AI or the system makes an important claim, supporting evidence should be nearby.

For requirement assessment:

**Status + Requirement + Evidence + Explanation**

should form one understandable unit.

---

## 9. Status Must Work Without Color

Important states must use:

- text
- iconography
- shape or structure

in addition to color.

Requirement assessment uses:

- ✓ Supported
- ◐ Partial
- — Not Demonstrated

Color may reinforce the state but should never be the only distinction.

---

## 10. Document Surfaces Can Feel Different

The primary application can remain dark while long-form source material may use a warm, light reading surface.

Possible uses include:

- original job descriptions
- resumes
- imported documents
- generated application material

This creates a subtle dossier or hotel-stationery feeling without imitating physical paper.

Readability comes first.

---

## 11. Components Should Feel Architectural

Avoid the default modern SaaS habit of placing every piece of information inside a large rounded rectangle.

The Continental should prefer:

- thin dividers
- aligned rows
- restrained surfaces
- compact panels
- detail drawers
- structured tables
- subtle borders

Cards should exist when they represent a meaningful object or grouping.

They should not be the default answer to every layout problem.

---

## 12. Motion Explains State

Motion should help the user understand what changed.

Use:

- short fades
- small slides
- drawer transitions
- loading transitions
- progress changes

Avoid:

- bouncing
- cinematic animations
- animated backgrounds
- glowing AI effects
- unnecessary parallax

Transitions should generally feel quick and precise.

Reduced-motion preferences must be respected.

---

## 13. Accessibility Is Part of the Design

Accessibility is not a later cleanup phase.

The foundation should include:

- keyboard navigation
- visible focus states
- semantic headings
- labeled form controls
- useful validation errors
- sufficient contrast
- reduced-motion support
- status communication beyond color

The critical workflow should be usable without a mouse.

---

## 14. Desktop First, Responsive Always

The Continental is primarily a desktop working environment.

Desktop can use:

- persistent navigation
- dense tables
- multi-column layouts
- side-by-side source and result views
- drawers

Narrow screens should still work cleanly.

At approximately 390px:

- navigation must remain usable
- content must not overflow
- actions must remain reachable
- dense layouts should collapse intentionally

The product does not need a mobile application in v0.0.

The web application simply must not break on a phone.

---

## 15. Build UI and API Together

For every feature:

1. define the user problem
2. study strong reference products
3. sketch the flow
4. define required UI states
5. define the API contract
6. build using shared components
7. test loading, empty, error, and unusual data
8. check responsive behavior
9. check accessibility
10. review the rendered screen
11. ship the complete vertical slice

A feature is not done because an endpoint works.

A feature is done when a user can understand it, use it, recover from errors, and understand what the system is doing.

---

## 16. Real Data Before Pretty Mock Data

Screens should be pressure-tested using realistic career information.

Test:

- long job titles
- long company names
- long evidence descriptions
- many skills
- many requirements
- missing fields
- empty states
- unusually long source text

Avoid designing screens around perfect lorem ipsum.

---

## 17. No Future Navigation

Only expose sections that actually work.

Do not fill the sidebar with disabled roadmap features.

Navigation grows with the product.

This keeps early versions understandable and prevents the interface from pretending the application is more complete than it is.

---

## 18. Signature Moments Get Extra Attention

Some screens deserve more visual design effort because they communicate what makes The Continental different.

Primary signature experiences:

1. Evidence provenance
2. Dossier requirement map
3. Import review
4. Mission Control workflow timeline
5. High Table analytics

Generic settings screens only need to be clear, polished, and consistent.

---

## 19. Reference Before Inventing

Before designing a major interaction, study several strong real products solving similar problems.

The goal is not to copy their branding.

Study:

- hierarchy
- spacing
- information density
- navigation
- interaction patterns
- loading behavior
- error recovery
- responsive behavior

Document what is being borrowed and why.

Do not design complicated product interfaces entirely from memory.

---

## 20. The Final Rule

The Continental should never have to choose between being beautiful and being technically honest.

Good design should make:

- evidence
- uncertainty
- provenance
- progress
- permissions
- failures
- approvals

easier to understand.

The product should look intentional because the system itself is understandable.