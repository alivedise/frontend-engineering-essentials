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
- FEE articles follow a template: Context, Principle, Visual, Example, Common Mistakes, Related FEEs, References
- Sections after "Principle" are optional
- Uses RFC 2119 keywords (MUST, SHOULD, MAY) for guidance levels
- EN and zh-TW content are parallel -- every EN file has a zh-TW counterpart

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
