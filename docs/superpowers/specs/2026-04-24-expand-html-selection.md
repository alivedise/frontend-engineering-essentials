---
title: Category Selection — Expand HTML & Semantic Markup Next
date: 2026-04-24
status: Approved for expansion
category: HTML and Semantic Markup
successor_skill: expanding-category-articles
---

# Category Selection — Expand HTML & Semantic Markup Next

## Problem

After expanding the TypeScript category from 8 → 17 articles earlier today, the
next under-served main category needs to be chosen so the
`expanding-category-articles` skill can run its standard
research → write → translate → polish → gate pipeline against it.

## Current category sizes (main categories only)

| Count | Category                         |
|-------|----------------------------------|
| 9     | HTML & Semantic Markup           |
| 10    | Design Systems, DX & Tooling, PWA|
| 11    | Accessibility, Build Tooling, CI/CD, CSS, Observability, Security, State Management |
| 12    | Rendering, Testing               |
| 14    | Component Architecture, JavaScript Core |
| 17    | TypeScript (just expanded)       |
| 18    | Browser APIs                     |

## Decision

Expand **HTML & Semantic Markup** (main category 100).

## Rationale

- **Smallest non-empty main category.** The ratio of "this is essential frontend
  surface" to "we have articles covering it" is worst here.
- **Fundamental importance.** HTML is the substrate every other category builds
  on; a thin HTML category weakens the whole site.
- **Strongest authoritative sources.** WHATWG HTML Living Standard, MDN, Chrome
  Status, and spec PRs are all tier-1/2 and easy to cite without drift.
- **Strong fit for the new `allow_no_custom_section` / topic-specific-section
  rule.** HTML features typically have distinct quirks — focus management,
  accessibility semantics, form integration, CSS interaction, browser support
  matrix — any of which makes a natural topic-specific section. Articles that
  only use standard sections will be genuinely rare here.
- **Recent platform churn.** 2023-2026 landed Popover API, `<dialog>` with
  modal semantics, `inert`, `fetchpriority`, HTML Sanitizer API's progress,
  and more. Each is essential 2026 practice and currently absent from the FEE
  corpus.

## Next step

Invoke `expanding-category-articles` skill against the HTML category with
`--count=adoptable` (matching the TypeScript-expansion convention). The
research subagent in GAP-DISCOVERY mode will propose the ranked topic list;
the user reviews and confirms before any articles are written.

All per-article research and writing artifacts land under
`docs/superpowers/research/` and `docs/en/HTML and Semantic Markup/` plus
the zh-TW mirror, in a fresh worktree at
`../frontend-engineering-essentials-expand-html-2026-04-24/` on branch
`expand/html-2026-04-24`.

## Constraints applied to this expansion

- **Each new article MUST have a topic-specific `##` section** or an explicit
  `allow_no_custom_section: true` + `# reason: <prose>` frontmatter escape
  (per the skill update landed earlier today).
- **FEE canonical template** from `CLAUDE.md` applies; writer subagent receives
  the skill template and adapts the `BEE-` prefix to `FEE-`.
- **Filenames use semantic kebab slugs**, not numeric IDs (following the
  TypeScript-expansion convention and the VitePress route-by-basename
  sidebar generator that shipped in the same day's batch).
