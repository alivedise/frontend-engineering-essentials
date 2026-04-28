---
topic: Biome v2 — Type-Aware Linting + Formatting + Assists Toolchain
id: 1611
slug: biome-v2
sources_reviewed: 9
claims: 16
---

# Findings: Biome v2 — Type-Aware Linting + Formatting + Assists Toolchain

**Proposed topic-specific section:** `## v1 → v2 Upgrade Path`.

## Claims

### Claim 1
- **Text:** Biome positions itself as a single Rust toolchain that bundles a formatter, a linter, and (in v2) assists for the JavaScript/TypeScript ecosystem.
- **Target section:** Context
- **Source URL:** https://github.com/biomejs/biome
- **Pulled quote:** "Biome is a performant toolchain for web projects, it aims to provide developer tools to maintain the health of said projects."

### Claim 2
- **Text:** Biome's formatter targets near-parity with Prettier across multiple languages.
- **Target section:** Context
- **Source URL:** https://github.com/biomejs/biome
- **Pulled quote:** "Biome is a fast formatter for JavaScript, TypeScript, JSX, JSON, CSS and GraphQL that scores 97% compatibility with Prettier."

### Claim 3
- **Text:** Biome's linter ships hundreds of rules sourced from the ESLint and typescript-eslint ecosystems.
- **Target section:** Context
- **Source URL:** https://github.com/biomejs/biome
- **Pulled quote:** "Biome is a performant linter for JavaScript, TypeScript, JSX, JSON, CSS, and GraphQL that features more than 450 rules from ESLint, typescript-eslint, and other sources."

### Claim 4
- **Text:** v2 (codename "Biotype") is the first JS/TS linter offering type-aware rules without depending on the TypeScript compiler.
- **Target section:** Context
- **Source URL:** https://biomejs.dev/blog/biome-v2/
- **Pulled quote:** "the _first_ JavaScript and TypeScript linter that provides type-aware linting rules that doesn't rely on the TypeScript compiler"

### Claim 5
- **Text:** Biome v2's home-grown inference engine catches a meaningful share of typescript-eslint's floating-promise findings at lower runtime cost.
- **Target section:** Deep Dive
- **Source URL:** https://biomejs.dev/blog/biome-v2/
- **Pulled quote:** "can detect floating promises in about 75% of the cases that would be detected by using `typescript-eslint`, at a fraction of the performance impact."

### Claim 6
- **Text:** v2 introduces a project-wide file scanner that powers cross-file lint analysis, lifting Biome out of single-file-only checking.
- **Target section:** Visual
- **Source URL:** https://biomejs.dev/blog/biome-v2/
- **Pulled quote:** "a _file scanner_ to Biome that scans all the files in your project and indexes them, similar to what an LSP service might do in your IDE."

### Claim 7
- **Text:** Type-aware rules are gated behind the `types` linter domain, which boots the scanner and inference engine on demand.
- **Target section:** Best Practices
- **Source URL:** https://biomejs.dev/linter/domains/
- **Pulled quote:** "When enabling rules that belong to this domain, Biome will scan the entire project, *and it will enable the inference engine to resolve and flat types*."

### Claim 8
- **Text:** Linter "domains" group framework- and tooling-specific rules (React, Next, Vue, Solid, Qwik, Test, Project, Types, etc.) so users opt in by ecosystem.
- **Target section:** Best Practices
- **Source URL:** https://biomejs.dev/linter/domains/
- **Pulled quote:** "Use this domain inside Next.js projects." / "Use this domain when linting test files." / "This domain contains rules that perform project-level analysis."

### Claim 9
- **Text:** Assists are a separate Biome v2 surface that always emit a code action and have no diagnostics, distinguishing them from lint rules.
- **Target section:** Visual
- **Source URL:** https://biomejs.dev/assist/
- **Pulled quote:** "Contrary to linter rules, assist actions always offer a code fix. They might sort properties or fields, simplify binary expressions, perform refactorings, and more."

### Claim 10
- **Text:** Import organization moved from a dedicated `organizeImports` field into the new Assists subsystem and was rebuilt to merge same-module imports and support custom ordering.
- **Target section:** v1 → v2 Upgrade Path
- **Source URL:** https://biomejs.dev/blog/biome-v2/
- **Pulled quote:** "The Import Organizer became 'an assist' in a broader generalization providing 'actions, which are similar to the _fixes_ in lint rules, but without the diagnostics.'"

### Claim 11
- **Text:** v2 ships a GritQL-based plugin system that lets users add custom rules as `.grit` files registered through `biome.json`.
- **Target section:** Deep Dive
- **Source URL:** https://biomejs.dev/linter/plugins/
- **Pulled quote:** "these plugins allow you to match specific code patterns and register customized diagnostic messages for them."

### Claim 12
- **Text:** Monorepos can now layer biome.json files; nested configs must declare `"root": false` or use the `"extends": "//"` microsyntax to inherit from the root.
- **Target section:** Example
- **Source URL:** https://biomejs.dev/guides/big-projects/
- **Pulled quote:** "Nested configurations 'must have the field `root` set to `false`.' They can use the microsyntax `\"extends\": \"//\"` to 'extend from the **root configuration**, regardless of where the nested configuration is.'"

### Claim 13
- **Text:** v1 → v2 upgrades are driven by a built-in migrate command that rewrites the config in place.
- **Target section:** v1 → v2 Upgrade Path
- **Source URL:** https://biomejs.dev/guides/upgrade-to-biome-v2/
- **Pulled quote:** "Run the `migrate` command to update the configuration"

### Claim 14
- **Text:** v2 consolidates `ignore` and `include` into a single `includes` field and stops auto-prepending `**/` to globs, requiring path adjustments.
- **Target section:** v1 → v2 Upgrade Path
- **Source URL:** https://biomejs.dev/guides/upgrade-to-biome-v2/
- **Pulled quote:** "The options `ignore` and `include` are removed, and replaced by `includes` with corrected glob behavior that no longer prepends `**/`."

### Claim 15
- **Text:** Biome migrates ESLint and Prettier configs through dedicated subcommands, the recommended on-ramp for teams replacing both tools.
- **Target section:** Example
- **Source URL:** https://biomejs.dev/guides/migrate-eslint-prettier/
- **Pulled quote:** "biome migrate eslint --write" / "biome migrate prettier --write"

### Claim 16
- **Text:** The 2025 roadmap commits the project to shipping a real `noFloatingPromises`, real multi-file analysis, and HTML/embedded-language support beyond v2.
- **Target section:** References
- **Source URL:** https://biomejs.dev/blog/roadmap-2025/
- **Pulled quote:** "This year we want to ship a real version of `noFloatingPromises`, and hopefully dabble further into type inference." / "we're adding true Multi-file support to Biome 2.0. This means that our lint rules will be able to query information from other files."

## Reference URLs

- https://biomejs.dev/blog/biome-v2/
- https://biomejs.dev/blog/roadmap-2025/
- https://biomejs.dev/guides/upgrade-to-biome-v2/
- https://biomejs.dev/guides/migrate-eslint-prettier/
- https://biomejs.dev/guides/big-projects/
- https://biomejs.dev/linter/domains/
- https://biomejs.dev/linter/plugins/
- https://biomejs.dev/assist/
- https://github.com/biomejs/biome

## Research notes

- Editorial spine: v2 "Biotype" is type-aware lint without `tsc`, plus the Assists surface and GritQL plugins on top of a multi-file project scanner. Frame as the vertical move from "single-file fast linter" to "project-aware Rust toolchain"; topic-specific section is the upgrade path.
- Visual: small table mapping `react` / `next` / `vue` / `solid` / `qwik` / `test` / `project` / `types` → what each domain unlocks; `types` triggers the inference engine.
- Example: a real `biome.json` showing `"linter.domains.react": "recommended"`, `"linter.domains.types": "all"`, an Assists block, and a nested-config snippet using `"extends": "//"`.
- Performance: only the "75% of typescript-eslint cases" claim for `noFloatingPromises` is a quoted number; do not generalize.
- Adjacency: FEE-1601 Linting & Static Analysis already mentions Biome briefly; FEE-1611 should be the canonical Biome v2 home and FEE-1601 should link out.
- Adjacency: FEE-1602 Code Formatting & EditorConfig — Biome's formatter overlap with Prettier should cross-link with the 97%-compatibility number, not duplicate the formatting framing.
- Adjacency: FEE-1610 Oxlint is being authored in parallel — Biome v2's pitch is "one toolchain, type-aware"; Oxlint's is "drop-in fast ESLint replacement". Differentiate in Related Topics, not in body.
- Plugins surface: diagnostics only, no autofix in v2 — flag this in Deep Dive as a near-term limitation.

## Rejected sources

- Wikipedia, Dev.to, biomejs.cn mirror, infoq second-hand news — superseded by biomejs.dev primary sources.
- biomejs.dev/assist/actions/ — 404 at fetch time; index page + per-action pages cover the same content.
- biomejs.dev/guides/plugins/ — 404; canonical plugin docs at biomejs.dev/linter/plugins/.
