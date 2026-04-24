---
title: Expand TypeScript Category — 8 Adoptable Gap Articles
date: 2026-04-24
status: Approved for writing
category: TypeScript
id_range: 1709-1716
branch: expand/typescript-2026-04-24
---

# Expand TypeScript Category — 8 Adoptable Gap Articles

## Problem

The FEE TypeScript category currently covers nine articles (1700-1708): Overview,
Type System Fundamentals, Generics, Utility Types, Narrowing, Declaration Files,
tsconfig, React integration, and Runtime Validation. Gap discovery against
TypeScript Handbook and Microsoft DevBlogs release notes identified eight
adoptable gaps — topics that are essential to TypeScript practice in 2026,
backed by tier-1/2 sources, and not covered (or only mentioned in a single
bullet) by any existing article.

## Scope

Add eight new articles, one per gap, under `docs/en/TypeScript/` and
`docs/zh-tw/TypeScript/`. Each article follows the
`expanding-category-articles` skill's canonical template at
`/Users/alive/.claude/skills/expanding-category-articles/templates/article.md`,
adapted only for the `FEE-` id prefix.

Filenames use semantic kebab slugs (not numeric ids), matching the skill
template and the planned id-to-slug migration signalled by the
`vitepress-id-to-slug-migration` skill in this repo's available-skills list.

## Confirmed Topics

| ID   | Slug / Filename                        | Title                                                     | Level  |
|------|----------------------------------------|-----------------------------------------------------------|--------|
| 1709 | `satisfies-operator`                   | The `satisfies` Operator                                  | mid    |
| 1710 | `classes-and-private-fields`           | Classes, Access Modifiers & `#` Private Fields            | mid    |
| 1711 | `decorators-stage-3`                   | Decorators (Stage 3 ECMAScript)                           | senior |
| 1712 | `type-only-imports`                    | Type-Only Imports & `verbatimModuleSyntax`                | mid    |
| 1713 | `enums-and-as-const`                   | Enums and the `as const` Alternative                      | mid    |
| 1714 | `node-esm-and-nodenext`                | Node.js ESM, `.mts`/`.cts` & `nodenext` Module Resolution | senior |
| 1715 | `conditional-types-and-infer`          | Conditional Types and `infer`                             | senior |
| 1716 | `compiler-performance`                 | TypeScript Compiler Performance                           | senior |

Each article file lives at
`docs/<locale>/TypeScript/<slug>.md` with frontmatter `id: <id>` and
`slug: <slug>`. The `slug` field matches the filename basename (required by
`scripts/validate-frontmatter.sh`).

## Article Structure (skill template, FEE prefix)

Required sections, in order:

- YAML frontmatter: `id`, `title`, `state: draft`, `slug`
- `# [FEE-<ID>] <Title>` (skill placeholder `BEE-` adapted to `FEE-`)
- `:::info` block — one-paragraph summary, 3-5 sentences, every claim traceable
  to the findings doc.
- `## Context`
- `## Visual` — required; one Mermaid diagram OR one structured table.
- `## Example`
- `## Best Practices` — MUST/SHOULD/MAY bullets, each tied to a finding.
- Optional: `## Design Thinking`, `## Deep Dive`, a topic-specific section.
- `## Related Topics` — kebab-slug URLs.
- `## References` — every URL must appear in the findings doc's Reference URLs
  list.

## Pipeline (per topic, sequential)

1. Research subagent (PER-ARTICLE mode) — produces findings doc at
   `docs/superpowers/research/<slug>.md` with claims, pulled quotes, and
   URL list.
2. Writer subagent — EN article from findings + skill template + FEE prefix.
3. Translator subagent — zh-TW counterpart, preserving structure, code
   blocks, URLs, frontmatter `id` and `slug`.
4. `polish-documents` skill on both EN and zh-TW files.
5. Gates: `validate-frontmatter.sh` (both locales), `check-references.sh` (EN),
   findings URL coverage (≥3 URLs appear in both findings and `## References`).
6. One atomic commit per article: EN file, zh-TW file, findings doc.
7. After all eight land: regenerate `docs/en/list.md` +
   `docs/zh-tw/list.md` sidebar as a final commit.

## Sources Per Topic (tier-1/2, verified during gap discovery)

- 1709 satisfies-operator: devblogs/typescript/announcing-typescript-4-9,
  handbook/release-notes/typescript-4-9,
  devblogs/announcing-typescript-5-0.
- 1710 classes-and-private-fields: handbook/2/classes,
  devblogs/announcing-typescript-5-0,
  handbook/release-notes/typescript-3-8.
- 1711 decorators-stage-3: devblogs/announcing-typescript-5-0,
  handbook/decorators, tc39/proposal-decorators.
- 1712 type-only-imports: handbook/modules/reference,
  devblogs/announcing-typescript-5-0,
  tsconfig#verbatimModuleSyntax.
- 1713 enums-and-as-const: handbook/enums,
  devblogs/announcing-typescript-3-4, tsconfig#isolatedModules.
- 1714 node-esm-and-nodenext: handbook/modules/reference,
  handbook/modules/theory,
  handbook/modules/guides/choosing-compiler-options.
- 1715 conditional-types-and-infer: handbook/2/conditional-types,
  handbook/release-notes/typescript-2-8,
  devblogs/announcing-typescript-4-1.
- 1716 compiler-performance: github.com/microsoft/TypeScript/wiki/Performance,
  tsconfig#skipLibCheck, devblogs/typescript/typescript-native-port.

## Writer & Translator Constraints

- No claim outside the findings doc; no invented URLs.
- Style prohibitions from user global `CLAUDE.md`: no contrastive negation, no
  em-dash filler chains, no unanchored superlatives, no puffery preambles, no
  "可以 X 可以 Y 可以 Z" stacking in zh-TW.
- Template is canonical; writer MUST NOT peek at existing FEE TypeScript
  articles to infer structure.
- Translator preserves heading hierarchy exactly, Mermaid diagram count and
  position (translating only node label text), non-Mermaid code blocks
  verbatim, every URL verbatim, frontmatter `id` and `slug`.
