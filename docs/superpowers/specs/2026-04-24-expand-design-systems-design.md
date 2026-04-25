---
title: Expand Design Systems & UI Libraries — 8 Adoptable Gap Articles
date: 2026-04-24
status: Approved for writing
category: Design Systems and UI Libraries
id_range: 910-917
branch: expand/design-systems-2026-04-24
---

# Expand Design Systems & UI Libraries — 8 Adoptable Gap Articles

## Confirmed Topics

| ID  | Slug / Filename                | Title                                                                  | Level  |
|-----|--------------------------------|------------------------------------------------------------------------|--------|
| 910 | `dtcg-token-format-spec`       | W3C DTCG Format Module — Complete Token Spec Reference                 | mid    |
| 911 | `style-dictionary-4-pipeline`  | Style Dictionary 4 Build Pipeline — Transforms, Formats, Hooks         | senior |
| 912 | `storybook-vitest-addon`       | Storybook Vitest Addon & Component Testing Stack                       | mid    |
| 913 | `react-aria-components`        | React Aria Components — Adobe's Contexts & Slots Composition Model     | senior |
| 914 | `zag-and-ark-ui`               | Framework-Agnostic State Machines — Zag.js and Ark UI                  | senior |
| 915 | `motion-tokens`                | Motion & Animation Tokens — Duration, Easing, Reduced-Motion           | mid    |
| 916 | `fluid-typography-tokens`      | Fluid Typography & Type Scale Tokens                                   | mid    |
| 917 | `tailwind-v4-theme-directive`  | Tailwind CSS v4 `@theme` Directive — CSS-First Design Tokens           | mid    |

## Pipeline (per topic, sequential)

1. Research subagent (PER-ARTICLE mode) → findings doc.
2. Writer subagent → EN article.
3. Translator subagent → zh-TW article.
4. **Polish — `Skill(polish-documents, ...)` on EN, then on zh-TW.** Per
   the post-Phase-4d-tightening rule, this MUST be the full skill
   invocation; inline grep-and-edit substitution is forbidden.
5. Gates: validate-frontmatter (both), validate-structure (both), check-references
   (EN), findings URL coverage ≥3.
6. One atomic commit per article: `docs(design-systems): add <title> (FEE-<id>)`.
7. After all 8: regenerate `list.md` via `pnpm docs:build`, commit.

## Source Tier Summary

- **Tier 2 (Standards):** W3C DTCG draft (910).
- **Tier 3 (Vendor docs by named authors / teams):** Style Dictionary docs
  (911), Storybook docs (912), React Aria / React Spectrum (913), Zag.js
  + Ark UI (914), Tailwind CSS docs (917).
- **Tier 3-4 (Editorial / educational with named authors):** web.dev fluid
  type (916, Adam Argyle), Utopia.fyi (916, Trys Mudford), Material 3
  motion + type tokens (915, 916), Carbon Design System (915),
  designsystems.com (915).

## Constraints

- Every article MUST have a topic-specific `##` section. Given the
  gap-discovery topics, this should be naturally easy:
  - 910 → `## DTCG Composite Type Reference`
  - 911 → `## Hook System Reference`
  - 912 → `## Migration from test-runner`
  - 913 → `## Slot Props & Render Props Reference`
  - 914 → `## Cross-Framework Adapter Comparison`
  - 915 → `## Reduced-Motion Token Strategy`
  - 916 → `## Fluid Type Scale Calculator Walkthrough`
  - 917 → `## Migration from Style-Dictionary Pipeline`
- Style prohibitions per user global CLAUDE.md (no contrastive negation,
  no em-dash filler chains, no unanchored superlatives, no puffery
  preambles, no 「可以 X 可以 Y 可以 Z」 stacking).
- Filenames use semantic kebab slugs.
