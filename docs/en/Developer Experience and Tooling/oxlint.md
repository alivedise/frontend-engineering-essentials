---
id: 1610
title: "Oxlint — Rust-based ESLint Successor and Migration Path"
state: draft
slug: oxlint
---

# [FEE-1610] Oxlint — Rust-based ESLint Successor and Migration Path

:::info
Oxlint is a Rust-implemented JavaScript and TypeScript linter built on the Oxc compiler stack, released as v1.0 stable on 10 June 2025 with claims of roughly 50-100x faster lint runs than ESLint on equivalent setups. It already supports more than 700 rules from ESLint core and popular plugins, ships an `@oxlint/migrate` CLI that converts an ESLint flat config to `.oxlintrc.json` in one shot, and as of October 2025 includes a preview JavaScript-plugin runtime that lets teams keep custom ESLint plugins. Production evidence includes Airbnb running Oxlint's multi-file analysis across 126,000+ files in 7 seconds in CI where the equivalent ESLint rules time out. The article frames Oxlint as a third option alongside ESLint and Biome and walks through its migration path for teams whose lint step dominates CI wall-clock time.
:::

## Context

Oxlint is positioned by the Oxc project as a high-performance linter for JavaScript and TypeScript built on the Oxc compiler stack ([oxc.rs/docs/guide/usage/linter](https://oxc.rs/docs/guide/usage/linter)). The first stable version was released on 10 June 2025 after being announced in late 2023 ([voidzero.dev announcement](https://voidzero.dev/posts/announcing-oxlint-1-stable)). Performance is the headline claim: the official stable-release blog post states Oxlint runs "around 50~100 times faster than ESLint with the same setup" ([oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable)), and InfoQ's independent reporting attributes the gap to "its Rust-based architecture and shared Oxc parser" while citing a 2x advantage over Biome ([InfoQ, August 2025](https://www.infoq.com/news/2025/08/oxlint-v1-released/)). Production evidence accompanies the benchmarks: Airbnb runs Oxlint's multi-file analysis across 126,000+ files in 7 seconds in CI, where the equivalent ESLint rules time out ([Oxc stable announcement](https://oxc.rs/blog/2025-06-10-oxlint-stable)). For senior frontend engineers, this changes the cost calculus of static analysis on large codebases.

## Scenario

A frontend platform team owns a TypeScript monorepo with ~250k files across packages, apps, and generated sources. ESLint runs as the slowest CI step at 33 seconds on the affected file set in pre-merge checks, and the full repo lint pass takes minutes. The pre-commit hook that was meant to catch issues locally has been disabled in `.husky/` because contributors complained that hot-reload feedback loops broke during interactive work. Lint failures are now caught only at CI, and the team has been considering whether to drop a tier of rules to recover speed. Oxlint enters this scenario as a candidate that promises the same family of correctness rules at single-second wall-clock latency, with a config format and CLI surface that mirror ESLint v8 to keep the migration cognitive load small.

## Best Practices

- **MUST** start from Oxlint's `correctness` category default. By default Oxlint enables rules in the correctness category and is designed to be useful with no configuration ([linter config docs](https://oxc.rs/docs/guide/usage/linter/config)). Layering additional categories should be deliberate.
- **SHOULD** drive ESLint flat-config migrations through `@oxlint/migrate` rather than hand-translating rules. The official migration path is a single CLI invocation: `npx @oxlint/migrate <optional-eslint-flat-config-path>` ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)).
- **SHOULD** audit the rule set against Oxlint's coverage list before assuming feature parity. Oxlint already supports more than 700 rules from ESLint core and various popular plugins ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)), but coverage is not yet exhaustive.
- **MAY** run Oxlint and ESLint side by side when a required rule has not been ported. The recommended pattern is Oxlint first to fail fast on cheap checks, then ESLint as a fallback only when needed ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)).
- **MAY** adopt the JavaScript-plugin runtime preview when a custom or unported ESLint plugin is load-bearing. The preview lets teams keep those plugins inside Oxlint while preserving the speed advantage ([Oxlint JS plugins post, October 2025](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)).

## Design Thinking

The Oxc team's framing is that Oxlint's architecture removes structural bottlenecks that limit performance in ESLint ([linter docs](https://oxc.rs/docs/guide/usage/linter)). The lint pipeline was rebuilt on the Oxc compiler stack rather than tuning ESLint in place. The trade this design makes is concrete: a Rust binary distribution with a fixed plugin surface in exchange for the cross-process parallelism, shared parser, and memory layout that yield the 50-100x figure. The cost shows up at the plugin boundary. ESLint's plugin ecosystem is JS-native and relies on every plugin executing in the same Node process as the linter. Oxlint's JavaScript-plugin runtime preview ([October 2025 post](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)) is the explicit answer to that trade: JS plugins ride alongside the Rust core while keeping the speed envelope. Teams choosing Oxlint accept the binary-distribution surface area in exchange for a wall-clock budget that lets pre-commit hooks come back.

## Deep Dive

The October 2025 JavaScript-plugin runtime preview keeps custom and unported ESLint plugins inside Oxlint while preserving the speed advantage. The Oxc team's published numbers from that post show "Oxlint with custom JS plugin 236 ms ... ESLint multi-threaded 3,710 ms ... Oxlint is still 15x faster than ESLint, even using ESLint's new multi-threaded runner" ([Oxlint JS plugins post](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)). For senior engineers, the implication is that the previously-binary choice of keeping ESLint or losing plugin compatibility no longer holds: the JS-plugin runtime gives Oxlint an escape hatch for the long tail of internal lint rules, with a measured 15x margin even against ESLint's own multi-threaded runner. The preview status matters for risk-tolerance choices, but the architectural direction is established.

## Visual

| Tool / Mode | Wall-clock on the same repo | Source |
|---|---|---|
| Oxlint (multi-thread) | 615.3 ms | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| ESLint | 33.481 s | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| Oxlint at scale (10 threads, 101 rules) | 22.5 s on 264,925 files (~10,000 files/sec) | [voidzero.dev announcement](https://voidzero.dev/posts/announcing-oxlint-1-stable) |
| Oxlint with custom JS plugin (preview) | 236 ms | [Oxlint JS plugins post](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins) |
| ESLint multi-threaded (same repo as JS plugin row) | 3,710 ms | [Oxlint JS plugins post](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins) |

## Example

Install Oxlint as a dev dependency and wire it into npm scripts. The CLI surface mirrors ESLint's, including the `--fix` flag ([linter docs](https://oxc.rs/docs/guide/usage/linter)):

```bash
pnpm add -D oxlint
```

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

Configuration lives in `.oxlintrc.json`. The format intentionally mirrors ESLint v8's shape and supports JSONC comments ([linter config docs](https://oxc.rs/docs/guide/usage/linter/config)):

```jsonc
{
  // Categories enable rule sets with similar intent. By default Oxlint
  // enables rules in the correctness category.
  "categories": {
    "correctness": "error"
  },
  "rules": {
    // Override a single rule on top of the category default.
    "no-console": "warn"
  }
}
```

A first run with no `.oxlintrc.json` present still produces useful output because the correctness category is on by default ([linter config docs](https://oxc.rs/docs/guide/usage/linter/config)).

## Migration from ESLint

The migration path depends on which ESLint config format the project uses.

**Flat config (ESLint v9+ or v8 with `eslint.config.js`).** Run the official migrator in one shot ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)):

```bash
npx @oxlint/migrate <optional-eslint-flat-config-path>
```

The command emits `.oxlintrc.json` derived from the flat config's rules and overrides.

**Legacy `.eslintrc.*`.** These configs cannot be migrated automatically by `@oxlint/migrate` ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)). Convert to flat config first (e.g. via `@eslint/migrate-config`), then run `@oxlint/migrate` against the resulting flat config.

**Coverage check.** Oxlint already supports more than 700 rules from ESLint core and various popular plugins ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)). After running the migrator, diff the generated `.oxlintrc.json` against the original ESLint config to identify any rules that did not carry over.

**Side-by-side fallback.** When required rules are absent from Oxlint, the recommended pattern is to run Oxlint and ESLint side by side. Because Oxlint is significantly faster than ESLint, run Oxlint first to catch errors early, then fall back to ESLint only if needed ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)). In package scripts:

```json
{
  "scripts": {
    "lint": "oxlint && eslint ."
  }
}
```

## Internal References

- [FEE-1601 Linting & Static Analysis](/en/Developer%20Experience%20and%20Tooling/1601) — foundational linting article framing ESLint and Biome; Oxlint sits alongside them as a third option.
- [FEE-1611 Biome v2](/en/Developer%20Experience%20and%20Tooling/biome-v2) — parallel Rust-based toolchain article; Oxlint differentiates via ESLint-config compatibility and the JS plugin runtime.
- [FEE-1602 Code Formatting & EditorConfig](/en/Developer%20Experience%20and%20Tooling/1602) — the formatter concern is separate from the linter concern this article addresses.

## References

- Oxc project, "Linter," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter
- Oxc project, "Linter Configuration," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/config
- Oxc project, "Migrate from ESLint," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- Oxc project, "Announcing Oxlint 1.0 Stable," Oxc blog (2025). https://oxc.rs/blog/2025-06-10-oxlint-stable
- Oxc project, "Oxlint JavaScript Plugins," Oxc blog (2025). https://oxc.rs/blog/2025-10-09-oxlint-js-plugins
- VoidZero, "Announcing Oxlint 1 Stable," VoidZero blog (2025). https://voidzero.dev/posts/announcing-oxlint-1-stable
- InfoQ, "Oxlint v1 Released," InfoQ news (2025). https://www.infoq.com/news/2025/08/oxlint-v1-released/
- Oxc project, "oxlint-migrate," GitHub repository (2025). https://github.com/oxc-project/oxlint-migrate
