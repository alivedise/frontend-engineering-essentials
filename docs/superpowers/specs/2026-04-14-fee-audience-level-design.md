---
name: FEE Audience Level Field and Badge
description: Add a `level` frontmatter field to all ~184 FEE articles and render a colored badge at the top of each article. Include a one-shot AI classification script to assign levels per category with confidence gating.
type: project
---

# FEE Audience Level Field and Badge

## Goal

Surface the intended audience difficulty of each FEE article as a frontmatter field (`level`) and render a colored badge immediately before the article heading, so readers can self-select content appropriate to their experience.

## Frontmatter Field

Every non-overview article gains a `level` field with one of four values:

| Value | Meaning |
|-------|---------|
| `entry` | Suitable for juniors and developers new to the topic |
| `mid` | Assumes solid fundamentals; targets mid-level engineers |
| `senior` | Advanced depth; targets senior / staff-level engineers |
| `???` | Classification uncertain; flagged for manual review |

Example:

```yaml
---
id: 301
title: "Event Loop & Async Model"
state: draft
level: entry
---
```

**Rules:**
- Both EN and zh-TW counterparts carry the same `level` value — it is a content-complexity signal, not language-specific.
- `state: overview` articles (FEE-0 category index pages) do not receive a `level` field; the badge component skips them.
- Web Platform Proposals (id 10000+) are always `senior` — set by the classification controller directly without AI inference.
- FEE-0 (`docs/en/FEE Overall/0.md`) gains a documentation entry describing the field and its four values.

## Badge Display

A `LevelBadge.vue` component is registered globally in the VitePress theme and injected via the `doc-before` layout slot so it appears immediately before the article `h1`.

**Color scheme (maps to VPBadge `type`):**

| Level | VPBadge type | Label |
|-------|-------------|-------|
| `entry` | `tip` (green) | Entry Level |
| `mid` | `warning` (amber) | Mid Level |
| `senior` | `danger` (red-orange) | Senior Level |
| `???` | `info` (gray) | Needs Review |

**Component behavior:**
- Reads `frontmatter.level` via VitePress `useData()`.
- Renders nothing when `level` is absent or the page has `state: overview`.
- Uses VitePress's built-in `VPBadge` component — no new dependencies.

**Files modified:**
- `docs/.vitepress/theme/LevelBadge.vue` — new component (~25 lines)
- `docs/.vitepress/theme/index.js` — register component; inject via `doc-before` slot in Layout
- `docs/.vitepress/theme/index.css` — margin tweak if needed (one selector)

## Classification Script

`scripts/classify-levels.js` is a one-shot local script that assigns `level` values to all unclassified articles using the Claude API. It is not part of the build pipeline.

### Controller flow

1. Glob all `docs/en/**/*.md`.
2. Parse frontmatter; skip articles where `level` is already set, and skip `state: overview` articles.
3. Hardcode `level: senior` for all articles with `id >= 10000` (Web Platform Proposals) without API calls.
4. Group remaining articles by category (derived from directory path).
5. For each category (~18 groups): build a prompt containing the full article list (id, title, first paragraph of body) with instructions to rank relative difficulty within the group and assign `entry`/`mid`/`senior` with a `confidence` score (0–1).
6. Parse the JSON response: `[{ id, level, confidence }]`.
7. For any entry where `confidence < 0.7`, replace `level` with `???`.
8. Write the resolved `level` value into both EN and zh-TW frontmatter counterparts atomically.
9. Collect all `???` results and write `scripts/classify-report.md` listing id, title, and the subagent's stated reasoning for each uncertain classification.

### Prompt contract

Each category subagent receives:
- The category name and a brief description of where it sits in the FEE curriculum.
- A JSON array of `{ id, title, intro }` objects (intro = first non-empty paragraph of the article body).
- Instruction to output a JSON array `[{ id, level, confidence }]` only — no prose.
- Calibration guidance: within the category, `entry` = foundational concept a junior would encounter first, `senior` = nuanced depth requiring prior mastery of most other articles in the group.

### Output artifacts

- Updated frontmatter in all `docs/en/**/*.md` and `docs/zh-tw/**/*.md` files.
- `scripts/classify-report.md` — list of articles assigned `???` with reasoning, for manual triage.

## Out of Scope

- Filtering or searching articles by level in the sidebar or search index.
- User-configurable level visibility preferences.
- Retroactive level history tracking.
