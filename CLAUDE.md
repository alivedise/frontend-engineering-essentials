# CLAUDE.md

## Repository Overview

This is a VitePress-based bilingual (EN + zh-TW) documentation site for Frontend Engineering Essentials (FEE).

## Commands

- `pnpm docs:dev` -- Start VitePress development server
- `pnpm docs:build` -- Build documentation for production
- `pnpm docs:preview` -- Preview built documentation

## Architecture

- **VitePress 1.3.x** with custom theme (blue branding)
- **Bilingual**: EN content in `docs/en/`, zh-TW content in `docs/zh-tw/`
- **Dynamic sidebar**: Generated from markdown frontmatter at build time
- **Mermaid diagrams**: Used for architecture and flow diagrams
- **PWA support**: Offline-capable with service worker

## Content Conventions

- Each FEE file uses frontmatter: `id` (number), `title`, `state` (draft/reviewing/approved), `overview` (boolean)
- File names match the FEE id: e.g., `300.md` for FEE-300
- Uses RFC 2119 keywords (MUST, SHOULD, MAY) for guidance levels
- EN and zh-TW content are parallel -- every EN file has a zh-TW counterpart

## FEE Article Template

Current canonical template (supersedes all prior versions). Mirrors the
`expanding-category-articles` skill template with Changelog retained as an
optional trailing section.

```
---
id: {ID}
title: "{TITLE}"
state: draft
slug: {kebab-slug}
---

# [FEE-{ID}] {TITLE}

:::info
One-paragraph hook (3-5 sentences). Every claim traces to the findings doc.
:::

## Context
History, landscape, prior attempts, the gap this article fills. 3-5 sentences.

## Visual
One Mermaid diagram OR one structured table. Visualize the core mechanic.

## Example
Concrete walkthrough. Real code, real input/output, named systems. No pseudocode.

## Best Practices
MUST / SHOULD / MAY bullets. Each grounded in a specific finding.

## Design Thinking (optional)
Trade-offs, calibration choices. Name what gets traded against what.

## Deep Dive (optional)
Internals, edge cases, formal properties.

## {Topic-specific section}
REQUIRED. Rename the heading to name the angle (e.g. "Migration Guide",
"Version Reference", "Failure Modes", "Footgun Matrix"). If the topic
genuinely has no such angle, set `allow_no_custom_section: true` in
frontmatter with an adjacent `# reason: <prose>` comment.

## Related Topics
Cross-links to sibling articles. Format:
- [<Title>](/en/<category>/<slug>) or (/en/<category>/<id>) for pre-slug files.

## References
3+ verified URLs. Format: `- <Author>, "<Title>," <Venue> (<year>). <URL>`

## Changelog (optional)
Track significant spec or API changes over time. Include only when the
topic has had breaking changes.
```

**zh-TW section header map:**
- Context → 背景
- Visual → 視覺對比
- Example → 範例
- Best Practices → 最佳實踐
- Design Thinking → 設計思維
- Deep Dive → 深入探討
- Related Topics → 延伸閱讀
- References → 參考資料
- Changelog → 變更紀錄

The topic-specific section's heading is authored-specific — translate it
naturally alongside the prose (e.g. "Migration Guide" → 「遷移指南」,
"Version Reference" → 「版本對照」).

Retired sections (kept for pre-2026-04-24 articles; not used in new work):
- `## Scenario` — scenario content folds into `## Context` or the
  topic-specific section.
- `## Internal References` — renamed to `## Related Topics`.

## Content Quality

Every article MUST be researched against authoritative sources. AI internal knowledge alone is insufficient. References must contain real, verified URLs.

## Content Neutrality

This project is vendor-neutral. Do not include company-specific references, internal URLs, or product names.

## Markdown Authoring: Vue Template Safety

VitePress compiles every `.md` file into a Vue component. Vue's template compiler processes `{{ }}` everywhere in the rendered HTML -- including inside `<code>` elements. Violating these rules causes build failures or SSR errors.

**Rule 1: Never use backtick code spans for inline code containing `{{ }}`.**

This includes React JSX props (`style={{ color: 'red' }}`), GitHub Actions expressions (`${{ github.ref }}`), and any other `{{ }}` pattern. Use raw HTML instead:

```
<code v-pre>style={{ color: 'red' }}</code>
```

The `v-pre` directive tells Vue to skip template compilation for the element's content.

**Rule 2: HTML entities are required when `<TagName>` appears inside `<code v-pre>`.**

If the code example starts with an angle-bracket tag that looks like a Vue component (e.g. `<Context.Provider>`), escape `<` and `>` as `&lt;` and `&gt;`:

```
<code v-pre>&lt;Context.Provider value={{ user, setUser }}&gt;</code>
```

**Rule 3: Do not use `\`` to embed a backtick inside a backtick code span.**

Backslash is not an escape character inside code spans (CommonMark spec). Use double-backtick delimiters instead:

```
``type EventName = `on${Capitalize<string>}``
```

Single-backtick code spans that contain TypeScript generics like `Pick<T, K>` are fine because markdown-it HTML-escapes `<` and `>` inside code spans.
