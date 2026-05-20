---
title: FEE-918 Interaction State Rosetta — Focused, Activated, Selected, Pressed, Current
date: 2026-05-20
status: Approved for planning
category: Design Systems and UI Libraries
id: 918
slug: interaction-state-rosetta
audience: frontend engineers
---

# FEE-918 Interaction State Rosetta — Focused, Activated, Selected, Pressed, Current

## Problem

Designers and frontend engineers routinely talk past each other on
interaction states. The word "active" alone covers four unrelated
concepts:

- **Material Design** uses "activated" as a persistent visual state for
  the current item in a list (cursor-like; survives blur).
- **CSS** has `:active`, a moment-bounded pseudo-class that lasts only
  while a pointer or activation key is held down.
- **ARIA** has `aria-activedescendant`, which moves *virtual* focus
  inside a composite widget without moving DOM focus.
- **Colloquial usage** treats "active" as "anything currently engaged"
  — selected, pressed, focused, current-page, hovered.

The most common failure mode: a mockup labelled "active state" gets
implemented as `:active` (mouse-down only), so the persistent visual
the designer wanted never ships. A second failure: engineers use
`aria-selected` for current-page navigation (semantically wrong;
should be `aria-current="page"`), causing screen readers to misannounce
position. A third failure: the multi-item case ("multiple items
activated at the same time") gets implemented with a single
`:focus`-driven cursor, breaking multi-select keyboard interaction.

There is no FEE article that maps designer vocabulary to CSS + ARIA
semantics. `Accessibility/1002` covers focus *management* (trapping,
restoration, order), not the state *vocabulary*. `Accessibility/1007`
covers component patterns but not the cross-disciplinary terminology
mismatch. This article fills that gap.

## Goals

- **G1** — Give frontend engineers a single, scannable mapping between
  designer terms (active / activated / selected / pressed / current /
  focused) and the corresponding CSS pseudo-classes and ARIA
  attributes.
- **G2** — Anchor the article on **state cardinality** as the
  underlying axis that explains why "activated" and "focus" cannot be
  the same concept: `:focus` is strictly singular per browsing
  context; "activated" permits plurality across items.
- **G3** — Address the multi-item activated case (multi-select,
  multi-cursor file pickers, multiple `aria-selected` items) as
  primary territory in the running example.
- **G4** — Address state stacking (focused + activated + selected +
  current overlapping on one element) in a Deep Dive subsection.

## Non-Goals

- **NG1** — Not a handoff checklist. No "ask the designer these
  questions on Monday" content. The user has explicitly directed the
  article away from reader-action prescriptions.
- **NG2** — Not a complete a11y reference. ARIA states beyond the
  five-state core (e.g., `aria-expanded`, `aria-busy`, `aria-disabled`,
  `aria-checked`) appear only in the appendix table without body
  word-count.
- **NG3** — Not a `:focus` vs `:focus-visible` history. The
  distinction is explained where it serves the cardinality argument
  and no further.
- **NG4** — Not a toggle-button (`aria-pressed`) deep dive. Covered as
  one row in the rosetta, not given its own section.
- **NG5** — Not retroactively rewriting `Accessibility/1002` or
  `Accessibility/1007`. Cross-link only.

## Article Specification

### Identity

- **FEE ID**: 918 (next available in Design Systems and UI Libraries;
  current high is 917 Tailwind v4 `@theme` directive)
- **Category**: Design Systems and UI Libraries
- **Slug**: `interaction-state-rosetta`
- **EN path**: `docs/en/Design Systems and UI Libraries/918.md`
- **zh-TW path**: `docs/zh-tw/Design Systems and UI Libraries/918.md`
- **State**: `draft` on first commit; promoted to `reviewing` after
  review pass; `approved` after polish gates pass.

### Title

- **EN**: `Interaction State Rosetta — Focused, Activated, Selected, Pressed, Current`
- **zh-TW**: `互動狀態對照表 — Focused、Activated、Selected、Pressed、Current`

The five state nouns stay in English in the zh-TW title because they
are the technical anchor terms readers will grep for; the surrounding
prose translates fully.

### Section Plan

Sections follow the FEE canonical template (CLAUDE.md), with the
topic-specific section renamed `State Cardinality Rules`.

#### Hook (`:::info` block)

Three to five sentences. Names the four meanings of "active",
identifies the cardinality axis as the resolution, previews the
rosetta table.

#### Context (3-5 sentences)

History of the vocabulary drift:

- Material Design introduced "activated" in 2014 (Material 1.0) as a
  distinct visual state for persistent list-cursor selection,
  separate from "selected" (chosen for an operation) and "pressed"
  (momentary mouse-down).
- ARIA's state attributes (`aria-selected`, `aria-pressed`,
  `aria-current`, `aria-activedescendant`) predate Material's term
  and were defined in WAI-ARIA 1.0 (2014) with their own semantics.
- CSS pseudo-classes (`:active`, `:focus`, `:hover`) come from CSS 2.1
  (2011) and were designed before "interaction state" was a
  design-system concept.

The three vocabularies were never reconciled. This article reconciles
them.

#### Visual: Rosetta Table

The article's load-bearing artifact. Columns:

| Designer term | Material name | CSS pseudo-class | ARIA attribute | Cardinality | When to use |

Rows (five):

1. **Focused** — *Focused* — `:focus` / `:focus-visible` —
   no direct ARIA (DOM focus is the source of truth);
   `aria-activedescendant` for virtual focus —
   **strictly singular** — keyboard or programmatic focus target
2. **Activated** — *Activated* — no direct CSS pseudo-class
   (use `[aria-current]` / `[aria-selected]` attribute selector or
   a state class) — closest ARIA: `aria-current`,
   `aria-activedescendant` — **singular within a logical set;
   plural across independent sets** — persistent current-item
   indicator
3. **Selected** — *Selected* — no CSS pseudo-class
   (use `[aria-selected="true"]`) — `aria-selected` — **plural
   allowed in multi-select; singular in single-select** —
   chosen-for-operation
4. **Pressed** — *Pressed (toggle on)* — `:active` is the wrong
   match (moment-bounded); use `[aria-pressed="true"]` —
   `aria-pressed` — **singular per toggle button; independent
   across buttons** — toggle-button on-state
5. **Current** — *(no Material equivalent)* — no CSS pseudo-class
   (use `[aria-current]`) — `aria-current` (values: `page`, `step`,
   `location`, `date`, `time`, `true`) — **singular per logical
   set** — current-page / current-step

#### Example: Sidebar Nav + Multi-Select File List

Two concrete walkthroughs:

**Example A — Sidebar nav item.** Real HTML + CSS:

- Current page: `aria-current="page"` + visual highlight
- Keyboard focus on a non-current item: `:focus-visible` ring
- Hover: `:hover` background tint
- Active (mouse-down): `:active` momentary depression

Shows what a screen reader announces ("Settings, current page,
link") versus what it would announce with the wrong implementation
(`aria-selected="true"`: "Settings, selected, link" — wrong
because the item is not "chosen for an operation").

**Example B — Multi-select file list.** Real HTML + CSS + JS sketch:

- Multiple items with `aria-selected="true"` (the multi-item
  activated case the user wants featured)
- One item with `aria-activedescendant` pointing at it (the
  keyboard cursor)
- DOM focus remains on the listbox container, not on individual
  items

Shows why this pattern needs `aria-activedescendant` rather than
moving DOM focus: roving tabindex would also work, but
`aria-activedescendant` is the canonical multi-select pattern.

#### Best Practices

MUST / SHOULD / MAY bullets, each traceable to the spec or example.
Selected guidance:

- **MUST** use `aria-current` for current-page nav, not
  `aria-selected`. Reason: screen reader semantics differ.
- **MUST** use `:focus-visible` rather than `:focus` for keyboard
  focus rings. Reason: `:focus` triggers on mouse click and shows
  rings to mouse users who don't want them.
- **MUST NOT** style "activated" with the `:active` pseudo-class.
  Reason: `:active` is moment-bounded; activated is persistent.
- **SHOULD** name component props by semantic intent, not by
  designer shorthand. `isCurrent`, `isSelected`, `isPressed` beat
  `isActive`. Reason: ambiguous prop names cause the
  designer-engineer confusion to leak into the codebase.
- **SHOULD** use `aria-activedescendant` for keyboard cursors
  inside multi-select widgets. Reason: avoids the need to move DOM
  focus item-by-item.
- **MAY** layer states (focused + activated + selected), but
  **MUST** define visual precedence in the design system. Reason:
  layered states without precedence produce inconsistent renders.

#### Design Thinking

Trade-offs:

- Why Material's "activated" has no ARIA equivalent: ARIA models
  semantics for assistive tech; Material models visual states for
  sighted users. They're orthogonal concerns that happen to share
  vocabulary.
- What naming a component prop `isActive` costs you: every consumer
  has to read the implementation to know which of the five states
  it represents. Linting and code review can't catch this.

#### Deep Dive: State Stacking

How focused + activated + selected + current layer on one element:

- **Independence** — most states are independent dimensions.
  Focused does not imply selected; selected does not imply current.
- **Visual precedence** — when two states want to show different
  visuals (e.g., focused border + selected background), the design
  system MUST specify which wins or how they compose.
- **ARIA pitfalls** —
  - `aria-selected` on a `<button>` is invalid (only allowed on
    role=`option`, `tab`, `row`, `gridcell`, `treeitem`).
  - `aria-activedescendant` does not move DOM focus; CSS rules
    that target `:focus` will not match the active descendant.
    Use `[aria-activedescendant=""] [id=""]` patterns or the
    `:has()` selector for visual sync.
  - `aria-current` and `aria-selected` should not both be true
    on the same element; they model different roles.

#### State Cardinality Rules (topic-specific)

The article's headline angle. Three cardinality classes:

**Class 1 — Strictly singular**

- `:focus` per browsing context (one element has DOM focus at a time)
- `aria-current` per logical set (one current page, one current step)
- DOM `activeElement` (the element that has DOM focus)

Implications: a designer asking for "focus on every selected row" is
asking for the wrong thing; they want `aria-selected` (plural) or a
visual ring on each, not literal focus.

**Class 2 — Plural-permissible**

- `aria-selected="true"` in multi-select listboxes, grids, trees
- "Activated" items in multi-cursor file pickers (e.g., Finder
  Cmd-click)
- `aria-pressed="true"` is independent per toggle button (many can
  be on at once across a toolbar)

Implications: a designer's "multiple activated items" mockup is
implementable when mapped to `aria-selected` plural, but not when
mapped to `:focus` (which is singular).

**Class 3 — Moment-bounded**

- `:active` (held during pointer-down / activation-key-down)
- `:hover` (held while pointer is over the element)
- `:focus-within` (held while a descendant has focus)

Implications: designers showing a "pressed" mockup almost always
mean the persistent toggle-on state (`aria-pressed`), not the
moment-bounded `:active`. The cardinality cue is "would a user
expect to release the mouse and still see this state?".

This is the angle that resolves the original designer/engineer
confusion: "activated" and "focus" are not the same concept because
they are in different cardinality classes (plural-permissible vs.
strictly singular).

#### Related Topics

- `Accessibility/1002` — Keyboard Navigation & Focus Management
- `Accessibility/1007` — Accessible Component Patterns
- `Design Systems and UI Libraries/913` — React Aria Components
- `Design Systems and UI Libraries/914` — Zag.js and Ark UI

#### References (3+ verified URLs required)

Minimum verified citations the writer must source:

- WAI-ARIA 1.2 spec — states and properties section (W3C)
- Material Design 3 — Interaction states / Selection states pages
- MDN — `:focus-visible`, `:active`, `:hover`, `:focus-within`
- MDN — `aria-current`, `aria-selected`, `aria-pressed`,
  `aria-activedescendant`
- Adobe React Aria documentation — Selection state primitives
- Open UI — Interaction state research (if available at time of
  writing)

The writer subagent verifies each URL during research; broken or
moved URLs are replaced or removed.

#### Appendix: Quick State Reference (compact table)

Lists remaining states without body word-count:

| State | CSS | ARIA | Cardinality | Notes |
|---|---|---|---|---|
| Hover | `:hover` | — | moment-bounded | pointer-only |
| Disabled | `:disabled`, `[aria-disabled]` | `aria-disabled` | per element | `:disabled` only matches form controls |
| Checked | `:checked` | `aria-checked` | per element | `:checked` only matches form controls |
| Target | `:target` | — | strictly singular | URL-fragment-driven |
| Focus-within | `:focus-within` | — | implied by descendant focus | propagates up |
| Expanded | `[aria-expanded]` | `aria-expanded` | per element | disclosure / combobox |

## Architecture

Single-article delivery. No new categories, no template changes, no
sidebar restructuring.

```
docs/
  en/
    Design Systems and UI Libraries/
      918.md   ← new (EN)
  zh-tw/
    Design Systems and UI Libraries/
      918.md   ← new (zh-TW)
```

`list.md` is regenerated by `pnpm docs:build` after the article lands.

## Pipeline

Single-article pipeline (no batch coordination needed):

1. **Research** — subagent gathers authoritative sources, produces a
   findings doc. Verifies every cited URL.
2. **EN writer** — produces `docs/en/Design Systems and UI Libraries/918.md`
   from findings + template. State `draft`.
3. **zh-TW translator** — produces parallel zh-TW file using the
   section header map from CLAUDE.md. The five state nouns stay in
   English; prose translates fully.
4. **Polish** — full `Skill(polish-documents, ...)` invocation on EN,
   then zh-TW. Inline grep-and-edit substitution is forbidden.
5. **Gates** —
   - `validate-frontmatter` on both files
   - `validate-structure` on both files
   - `check-references` on EN (3+ verified URLs)
   - findings URL coverage ≥3
   - Vue template safety: scan for `{{ }}` patterns in code spans
     and apply `<code v-pre>` per CLAUDE.md
6. **Commit** — one atomic commit:
   `docs(design-systems): add Interaction State Rosetta (FEE-918)`
7. **Sidebar regeneration** — `pnpm docs:build` to refresh
   `list.md`; commit as `docs(list): regenerate sidebar for FEE-918`.

## Acceptance Criteria

- **AC1** — Both EN and zh-TW files exist at the specified paths with
  matching section structure.
- **AC2** — YAML frontmatter on both files contains `id: 918`,
  `title`, `state: draft`, `slug: interaction-state-rosetta`.
- **AC3** — The rosetta table in `## Visual` has exactly the five
  state rows (Focused, Activated, Selected, Pressed, Current) with
  the six columns specified above.
- **AC4** — The `## Example` section contains both Example A
  (sidebar nav) and Example B (multi-select file list) with real
  HTML + CSS + screen-reader output annotations.
- **AC5** — The topic-specific section is titled `## State
  Cardinality Rules` in EN; in zh-TW the heading is translated
  naturally by the translator subagent (per CLAUDE.md: the
  topic-specific heading is author-specific and is translated
  naturally alongside the prose). The section contains the three
  cardinality classes (strictly singular, plural-permissible,
  moment-bounded).
- **AC6** — `## References` lists at least three verified URLs in
  the FEE-canonical format (`- <Author>, "<Title>," <Venue>
  (<year>). <URL>`).
- **AC7** — No content advocates a "handoff checklist" or "ask
  these questions on Monday" stance. Per non-goal NG1.
- **AC8** — `pnpm docs:build` succeeds; the article appears in
  `list.md` under Design Systems and UI Libraries.
- **AC9** — Vendor neutrality preserved: Material Design and Adobe
  React Aria are cited as established references, not endorsed as
  recommended choices. No internal company names or URLs.

## Risks

- **R1** — Material Design URL drift. Material's docs move
  frequently. Mitigation: writer verifies URLs at research time;
  prefer canonical material.io paths.
- **R2** — `aria-activedescendant` is one of the most
  misimplemented ARIA attributes. Mitigation: Example B is
  reviewed against a real screen-reader test, not just spec
  reading.
- **R3** — Translation precision in zh-TW. "Activated" vs
  "current" vs "selected" do not have well-established zh-TW
  translations in design-system literature. Mitigation: keep the
  five anchor terms in English in headings and tables; translate
  surrounding prose. Add a brief glossary if needed.

## Out of Scope (Explicit)

- Building or modifying a design-system component library
- Producing a Figma file
- Producing screen-reader testing automation
- Cross-references to vendor-specific design systems (Carbon,
  Polaris, Lightning, etc.) — vendor-neutral per CLAUDE.md

## Open Questions

None. All ambiguities resolved during brainstorming on 2026-05-20.
