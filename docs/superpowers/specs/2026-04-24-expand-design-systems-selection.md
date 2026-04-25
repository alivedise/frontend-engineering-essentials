---
title: Category Selection — Expand Design Systems & UI Libraries Next
date: 2026-04-24
status: Approved for expansion
category: Design Systems and UI Libraries
successor_skill: expanding-category-articles
---

# Category Selection — Expand Design Systems & UI Libraries Next

## Problem

Two main categories were expanded earlier today: TypeScript (8 → 17) and
HTML (9 → 17). The next under-served main category needs to be picked so
the `expanding-category-articles` skill — now with the Phase 4d
MUST-invoke-polish-documents enforcement landed in the same session — can
run on it.

## Current main-category sizes

| Count | Category                                                                    |
|-------|-----------------------------------------------------------------------------|
| 10    | Design Systems, DX & Tooling, PWA                                           |
| 11    | Accessibility, Build Tooling, CI/CD, CSS, Observability, Security, State Mgmt |
| 12    | Rendering, Testing                                                          |
| 14    | Component Architecture, JavaScript Core                                     |
| 17    | HTML, TypeScript (expanded today)                                           |
| 18    | Browser APIs                                                                |

## Decision

Expand **Design Systems & UI Libraries** (main category 900).

## Rationale

- **Smallest non-empty main category** (tied with DX & Tooling and PWA at 10
  articles), strongest topic-specific-section fit of the three.
- **2024-2026 surface has matured.** W3C DTCG token format is becoming a
  real standard; Style Dictionary 4.x, Storybook 8, and the headless-library
  ecosystem (Radix, Ark UI, Reka, React Aria) have crystallized into stable
  patterns worth documenting.
- **Topic-specific section discipline shines here.** Every pattern in this
  space has a natural angle — transformer pipeline, theming inheritance,
  slot composition contract, brand override layer, accessibility tokens —
  so the new Phase 4d-adjacent rule (`allow_no_custom_section` only as a
  last resort) is unlikely to be triggered.
- **Source tiering.** W3C DTCG drafts are tier-2; vendor docs by named
  authors at Salesforce (Style Dictionary), Storybook, Radix, Adobe (React
  Spectrum/Aria) are tier-3/4. Coverage is sufficient and verifiable.

## Why not the other two 10-article candidates

- **DX & Tooling** is more vendor-doc-heavy with faster drift cycles
  (Biome/Oxc/Turborepo all version-churning). Worth a future expansion;
  not the right pick for the post-Phase-4d-tightening run.
- **PWA** is well-specified but smaller in surface area; better suited to
  a 4-5 article gap-fill than an 8-article expansion.

## Next step

Invoke the `expanding-category-articles` skill against the Design Systems
category with `--count=adoptable` (matching the TypeScript / HTML
convention). The research subagent in GAP-DISCOVERY mode will propose the
ranked topic list; the user reviews and confirms before any articles are
written.

All per-article research and writing artifacts land under
`docs/superpowers/research/` and
`docs/en/Design Systems and UI Libraries/` plus the zh-TW mirror, in a
fresh worktree at
`../frontend-engineering-essentials-expand-design-systems-2026-04-24/`
on branch `expand/design-systems-2026-04-24`.

## Constraints applied to this expansion

- **Each new article MUST have a topic-specific `##` section** (or carry
  the explicit `allow_no_custom_section: true` + `# reason: ...`
  frontmatter escape — but the rationale above suggests this won't be
  needed for any article in this batch).
- **Phase 4d polish-documents invocation is MUST**, not optional. The
  skill update landed earlier today closes the inline-polish shortcut.
  Each EN + zh-TW article gets `Skill(polish-documents, …)` invocation,
  not grep-and-Edit substitution.
- **FEE canonical template** from `CLAUDE.md` applies.
- **Filenames use semantic kebab slugs**, not numeric IDs.

## Existing articles in this category

901-909 (overview at 900):

- 900 Overview
- 901 Design Tokens
- 902 Headless Component Libraries
- 903 Copy-Paste Component Libraries
- 904 Storybook & Component Documentation
- 905 Theming & Dark Mode
- 906 Design System Versioning & Publishing
- 907 Icon Systems
- 908 Variant & Token Composition
- 909 Multi-Brand Design Systems

The gap-discovery subagent will look for 2024-2026 topics absent from this
list (W3C DTCG format details, Storybook 8 Test, slot composition across
frameworks, accessibility token patterns, transformer pipelines, etc.).
