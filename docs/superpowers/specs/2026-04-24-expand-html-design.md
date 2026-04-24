---
title: Expand HTML & Semantic Markup Category — 8 Adoptable Gap Articles
date: 2026-04-24
status: Approved for writing
category: HTML and Semantic Markup
id_range: 109-116
branch: expand/html-2026-04-24
---

# Expand HTML & Semantic Markup Category — 8 Adoptable Gap Articles

## Problem

The FEE HTML & Semantic Markup category covers 9 articles (100-108): Overview,
Document Structure & Metadata, Semantic Elements & Accessibility, Forms &
Validation, Media / Embedding / Interactive Elements, Web Components,
HTML APIs & Progressive Enhancement, Structured Data, Security Attributes.
Gap discovery against WHATWG HTML Living Standard, MDN, and web.dev /
Chrome Developers identified eight adoptable gaps — 2023-2026 platform
additions and underserved attribute references that are either absent
from the corpus or mentioned only in passing in a single existing article.

## Scope

Add eight new articles under `docs/en/HTML and Semantic Markup/` and
`docs/zh-tw/HTML and Semantic Markup/`. Each follows the
`expanding-category-articles` skill canonical template
(`/Users/alive/.claude/skills/expanding-category-articles/templates/article.md`),
adapted only for the `FEE-` id prefix. Each article MUST have a
topic-specific `##` section or carry the explicit
`allow_no_custom_section: true` + `# reason: ...` frontmatter escape
(new rule, landed earlier today).

Filenames use semantic kebab slugs.

## Confirmed Topics

| ID  | Slug / Filename                                | Title                                                               | Level  |
|-----|------------------------------------------------|---------------------------------------------------------------------|--------|
| 109 | `scroll-to-text-fragment`                      | Scroll-to-Text Fragment (URL Text Directives)                       | mid    |
| 110 | `hidden-until-found-and-beforematch`           | `hidden="until-found"` and the `beforematch` Event                  | mid    |
| 111 | `popover-states-and-anchor-positioning`        | Popover API States and Anchor Positioning Integration               | senior |
| 112 | `search-landmark-element`                      | The `<search>` Landmark Element                                     | mid    |
| 113 | `autocomplete-token-reference`                 | Autocomplete Attribute Token Reference (incl. `webauthn`)           | mid    |
| 114 | `virtual-keyboard-ux`                          | Virtual Keyboard UX: `inputmode`, `enterkeyhint`, and plaintext editing | mid    |
| 115 | `html-sanitizer-api`                           | HTML Sanitizer API (`setHTML()` vs `setHTMLUnsafe()` vs `innerHTML`) | senior |
| 116 | `datalist-combobox`                            | `<datalist>` and the Native Combobox Pattern                        | mid    |

Slug is the filename basename (no `.md`). Frontmatter `slug` mirrors the
filename so `scripts/validate-frontmatter.sh` passes.

## Article Structure (skill template, FEE prefix)

Required sections, in order:

- YAML frontmatter (`id`, `title`, `state`, `slug`)
- `# [FEE-<ID>] <Title>` (skill placeholder `BEE-` adapted to `FEE-`)
- `:::info` hook (3-5 sentences)
- `## Context`
- `## Visual`
- `## Example`
- `## Best Practices`
- `## Design Thinking` (optional)
- `## Deep Dive` (optional)
- `## <Topic-Specific Section>` — required; heading names the angle
- `## Related Topics`
- `## References`
- `## Changelog` (optional)

Each article's topic-specific section will be named concretely by the
writer based on the findings doc. Candidates: "Browser Support Matrix",
"Failure Modes", "Accessibility Interaction", "Version Reference",
"Focus Management", "Form Integration". If a topic truly has no angle
beyond the standard sections, the writer uses the
`allow_no_custom_section: true` + `# reason: ...` escape.

## Pipeline (per topic, sequential)

1. Research subagent (PER-ARTICLE mode) → findings doc at
   `docs/superpowers/research/<slug>.md`.
2. Writer subagent → EN article from findings + skill template +
   FEE prefix + topic-specific section rule.
3. Translator subagent → zh-TW counterpart; preserves structure,
   code, URLs, frontmatter `id` + `slug`.
4. `polish-documents` skill on both EN and zh-TW files (or inline
   polish for the same rule set).
5. Gates:
   - `validate-frontmatter.sh` (both locales)
   - `validate-structure.sh` (both locales)
   - `check-references.sh` (EN)
   - Findings URL coverage ≥3
6. One atomic commit per article:
   `docs(html): add <title> (FEE-<id>)`.
7. After all 8 land: regenerate `docs/en/list.md` +
   `docs/zh-tw/list.md` via `pnpm docs:build`, commit as cleanup.

## Sources Per Topic (tier-1/2, verified during gap discovery)

- 109 scroll-to-text-fragment: MDN Text fragments, WICG spec,
  web.dev articles/text-fragments.
- 110 hidden-until-found-and-beforematch: MDN hidden attribute,
  MDN beforematch event, Chrome Developers css-ui/hidden-until-found.
- 111 popover-states-and-anchor-positioning: MDN Popover API/Using,
  MDN popover attribute, MDN CSS Anchor Positioning.
- 112 search-landmark-element: MDN `<search>`, WHATWG spec search
  element, MDN search role.
- 113 autocomplete-token-reference: WHATWG form-control-infrastructure
  autofill, MDN autocomplete, MDN HTMLInputElement.autocomplete.
- 114 virtual-keyboard-ux: MDN inputmode, MDN enterkeyhint, MDN
  HTMLElement.enterKeyHint.
- 115 html-sanitizer-api: MDN HTML Sanitizer API, MDN setHTML,
  WICG sanitizer-api spec.
- 116 datalist-combobox: MDN `<datalist>`, WHATWG datalist element,
  W3C ARIA APG combobox pattern.

## Writer & Translator Constraints

- No claim outside the findings doc; no invented URLs.
- Style prohibitions from user global `CLAUDE.md`: no contrastive
  negation, no em-dash filler chains, no unanchored superlatives, no
  puffery preambles, no "可以 X 可以 Y 可以 Z" stacking in zh-TW.
- Template is canonical; writer MUST NOT peek at existing FEE HTML
  articles to infer structure.
- Translator preserves heading hierarchy, Mermaid positions, non-Mermaid
  code blocks verbatim, URLs verbatim, frontmatter `id` + `slug`.
- Each new article passes `validate-structure.sh` (topic-specific
  section or explicit escape).
