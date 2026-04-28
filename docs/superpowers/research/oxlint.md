---
topic: Oxlint — Rust-based ESLint Successor and Migration Path
id: 1610
slug: oxlint
sources_reviewed: 8
claims: 16
---

# Findings: Oxlint — Rust-based ESLint Successor and Migration Path

**Proposed topic-specific section:** `## Migration from ESLint`.

## Claims

### Claim 1
- **Text:** Oxlint is a Rust-implemented JavaScript and TypeScript linter built on the Oxc compiler stack, positioned as a high-performance alternative to ESLint.
- **Target section:** Context
- **Source URL:** https://oxc.rs/docs/guide/usage/linter
- **Pulled quote:** "Oxlint is a high-performance linter for JavaScript and TypeScript built on the Oxc compiler stack."

### Claim 2
- **Text:** Oxlint reached its first stable release on 10 June 2025 after being initially announced in late 2023.
- **Target section:** Context
- **Source URL:** https://voidzero.dev/posts/announcing-oxlint-1-stable
- **Pulled quote:** "JUN 10, 2025 ... The first stable version Oxlint has been released!"

### Claim 3
- **Text:** Oxlint claims roughly 50-100x faster lint runs than ESLint on equivalent setups, attributed to its Rust foundation and shared Oxc parser.
- **Target section:** Context
- **Source URL:** https://oxc.rs/blog/2025-06-10-oxlint-stable
- **Pulled quote:** "Around 50~100 times faster than ESLint with the same setup."

### Claim 4
- **Text:** Independent reporting corroborates Oxlint's release date and performance positioning, including a 2x advantage over Biome cited by InfoQ.
- **Target section:** Context
- **Source URL:** https://www.infoq.com/news/2025/08/oxlint-v1-released/
- **Pulled quote:** "Oxlint's performance is attributed to its Rust-based architecture and shared Oxc parser, which is 50-100x faster than ESLint and even 2x faster than Biome."

### Claim 5
- **Text:** Oxlint's architecture is positioned as fundamentally different from ESLint: rather than tuning ESLint, the team rebuilt the lint pipeline to remove ESLint's structural ceiling.
- **Target section:** Design Thinking
- **Source URL:** https://oxc.rs/docs/guide/usage/linter
- **Pulled quote:** "Its architecture removes structural bottlenecks that limit performance in ESLint."

### Claim 6
- **Text:** Oxlint runs at roughly 10,000 files per second; on a sample 264k-file repo it finishes in 22.5 seconds with 101 rules across 10 threads.
- **Target section:** Visual
- **Source URL:** https://voidzero.dev/posts/announcing-oxlint-1-stable
- **Pulled quote:** "Oxlint runs at approximately 10,000 files per second, depending on the total number of threads used ... Finished in 22.5s on 264925 files with 101 rules using 10 threads."

### Claim 7
- **Text:** Concrete head-to-head benchmark on a real repo: Oxlint multi-threaded finishes in 615.3 ms where ESLint takes 33.481 s on the same project.
- **Target section:** Visual
- **Source URL:** https://oxc.rs/blog/2025-06-10-oxlint-stable
- **Pulled quote:** "oxlint (multi thread): 615.3 ms ... eslint: 33.481 s"

### Claim 8
- **Text:** Airbnb runs Oxlint's multi-file analysis across 126,000+ files in 7 seconds in CI, where the equivalent ESLint rules time out.
- **Target section:** Context
- **Source URL:** https://oxc.rs/blog/2025-06-10-oxlint-stable
- **Pulled quote:** "they use multi-file analysis on their 126,000+ files, which completes in 7s on CI. ESLint's implementation of these rules times out."

### Claim 9
- **Text:** Installation is a standard dev-dependency add and the binary is invoked via the `oxlint` script with a `--fix` flag mirroring ESLint's CLI surface.
- **Target section:** Example
- **Source URL:** https://oxc.rs/docs/guide/usage/linter
- **Pulled quote:** "pnpm add -D oxlint" with scripts: `"lint": "oxlint"` and `"lint:fix": "oxlint --fix"`.

### Claim 10
- **Text:** Oxlint is designed to be useful with no configuration: by default it enables only rules in the `correctness` category, prioritising high-signal checks.
- **Target section:** Best Practices
- **Source URL:** https://oxc.rs/docs/guide/usage/linter/config
- **Pulled quote:** "Categories let you enable or disable sets of rules with similar intent. By default, Oxlint enables rules in the correctness category."

### Claim 11
- **Text:** The `.oxlintrc.json` config format intentionally mirrors ESLint v8's shape and supports JSONC, easing the migration cognitive load.
- **Target section:** Example
- **Source URL:** https://oxc.rs/docs/guide/usage/linter/config
- **Pulled quote:** "`.oxlintrc.json` supports comments (like jsonc) ... The configuration format aims to be compatible with ESLint v8's format."

### Claim 12
- **Text:** Migration from an ESLint flat config to an `.oxlintrc.json` is a one-shot CLI invocation via the official `@oxlint/migrate` package.
- **Target section:** Migration from ESLint
- **Source URL:** https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- **Pulled quote:** "npx @oxlint/migrate <optional-eslint-flat-config-path>"

### Claim 13
- **Text:** Legacy `.eslintrc.*` configs cannot be migrated automatically; teams must first convert to flat config (e.g. via `@eslint/migrate-config`) before running `@oxlint/migrate`.
- **Target section:** Migration from ESLint
- **Source URL:** https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- **Pulled quote:** "If your project uses ESLint v8.x with legacy config files (such as `.eslintrc.js` or `.eslintrc.json`), they cannot be migrated automatically by `@oxlint/migrate`."

### Claim 14
- **Text:** Oxlint already covers more than 700 rules from ESLint core and popular plugins, removing the most common reason teams stay on ESLint.
- **Target section:** Migration from ESLint
- **Source URL:** https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- **Pulled quote:** "Oxlint already supports more than 700 rules from ESLint core and various popular plugins."

### Claim 15
- **Text:** When a project depends on a rule Oxlint has not natively reimplemented, the recommended pattern is running Oxlint and ESLint side by side, with Oxlint first to fail fast on cheap checks.
- **Target section:** Migration from ESLint
- **Source URL:** https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- **Pulled quote:** "If not all required rules are available in Oxlint, you can run Oxlint and ESLint side by side ... Because Oxlint is significantly faster than ESLint, it is recommended to run Oxlint first to catch errors early, then fall back to ESLint only if needed."

### Claim 16
- **Text:** A preview JavaScript-plugin runtime (October 2025) lets teams keep custom and unported ESLint plugins inside Oxlint while preserving the speed advantage.
- **Target section:** Deep Dive
- **Source URL:** https://oxc.rs/blog/2025-10-09-oxlint-js-plugins
- **Pulled quote:** "Oxlint with custom JS plugin 236 ms ... ESLint multi-threaded 3,710 ms ... Oxlint is still 15x faster than ESLint, even using ESLint's new multi-threaded runner."

## Reference URLs

- https://oxc.rs/docs/guide/usage/linter
- https://oxc.rs/docs/guide/usage/linter/config
- https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- https://oxc.rs/blog/2025-06-10-oxlint-stable
- https://oxc.rs/blog/2025-10-09-oxlint-js-plugins
- https://voidzero.dev/posts/announcing-oxlint-1-stable
- https://www.infoq.com/news/2025/08/oxlint-v1-released/
- https://github.com/oxc-project/oxlint-migrate

## Research notes

- Topic-specific section confirmed as `## Migration from ESLint`. The official migration page powers the section: `npx @oxlint/migrate` one-shot, flat-config-only support, JS plugin escape hatch, side-by-side ESLint+Oxlint pattern.
- Adjacency: FEE-1601 Linting & Static Analysis treats Biome as the Rust alternative to ESLint and explicitly omits Oxlint. This article should cross-link to FEE-1601 and frame Oxlint as a third option, leaning on three differentiators: ESLint-config compatibility, JS plugin runtime, and the type-aware rules path via TypeScript 7.
- Adjacency: FEE-1611 Biome v2 is being authored in parallel; cross-link rather than litigate the linter landscape in body prose.
- Topic-specific section heading should translate to zh-TW as 「從 ESLint 遷移」.

## Rejected sources

- en.wikipedia.org — banned by source tier.
- Anonymous Medium "Migrating from ESLint to Oxlint" walkthroughs — banned by source tier.
- skills.sh/oxc-project/oxc/migrate-oxlint — third-party scaffold mirror, superseded by oxc.rs/docs source.
- Pre-2024 blog posts — excluded under the 2024-2026 ground-truth rule unless canonical primary docs.
