---
id: 1610
title: "Oxlint — Rust-based ESLint Successor and Migration Path"
state: draft
slug: oxlint
reviewed: hardened
reviewed_on: 2026-07-24
---

# [FEE-1610] Oxlint — Rust-based ESLint Successor and Migration Path

:::info
Oxlint is a Rust-implemented JavaScript and TypeScript linter built on the Oxc compiler stack, released as v1.0 stable on 10 June 2025 with claims of roughly 50-100x faster lint runs than ESLint on equivalent setups. It supports more than 800 rules from ESLint core and popular plugins as of mid-2026, ships an `@oxlint/migrate` CLI that converts an ESLint flat config to `.oxlintrc.json` in one shot, and has kept shipping through the 1.7x release line: a JavaScript-plugin runtime reached alpha in March 2026 with near-complete ESLint v9+ plugin API compatibility, and type-aware linting, the classic reason teams stay on ESLint plus typescript-eslint, went stable on 22 July 2026 powered by the Go-based tsgolint engine. Production evidence includes Airbnb running Oxlint's multi-file analysis across 126,000+ files in 7 seconds in CI where the equivalent ESLint rules time out. The article frames Oxlint as a third option alongside ESLint and Biome and walks through its migration path, including the type-aware and JS-plugin escape hatches, for teams whose lint step dominates CI wall-clock time.
:::

## Context

Oxlint is positioned by the Oxc project as a high-performance linter for JavaScript and TypeScript built on the Oxc compiler stack ([oxc.rs/docs/guide/usage/linter](https://oxc.rs/docs/guide/usage/linter)). The first stable version was released on 10 June 2025 after being announced in late 2023 ([voidzero.dev announcement](https://voidzero.dev/posts/announcing-oxlint-1-stable)). Performance is the headline claim: the official stable-release blog post states Oxlint runs "around 50~100 times faster than ESLint with the same setup" ([oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable)), and InfoQ's coverage relays the Oxc team's own benchmark claim of a 2x advantage over Biome ([InfoQ, August 2025](https://www.infoq.com/news/2025/08/oxlint-v1-released/)). Production evidence accompanies the benchmarks: Airbnb runs Oxlint's multi-file analysis across 126,000+ files in 7 seconds in CI, where the equivalent ESLint rules time out ([Oxc stable announcement](https://oxc.rs/blog/2025-06-10-oxlint-stable)).

Lint wall-clock time grows with both file count and rule cost. The VoidZero benchmark measured Oxlint running 101 rules across 264,925 real files in 22.5 seconds on 10 threads ([voidzero.dev announcement](https://voidzero.dev/posts/announcing-oxlint-1-stable)), and Airbnb's 126,000-file case, documented in the same stable announcement, shows the same effect in production: a lint pass that used to time out finishes in 7 seconds in CI. At that wall-clock cost, the same pass would also fit a pre-commit hook budget. Oxlint has kept shipping since that June 2025 release; as of mid-2026 it is on the 1.7x release line, with a JavaScript-plugin runtime in alpha and type-aware linting now stable (see Design Thinking and Deep Dive below).

## Visual

| Tool / Mode | Benchmark result | Source |
|---|---|---|
| Oxlint (multi-thread) | 615.3 ms | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| ESLint | 33.481 s | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| Oxlint at scale (10 threads, 101 rules) | 22.5 s on 264,925 files (~10,000 files/sec) | [voidzero.dev announcement](https://voidzero.dev/posts/announcing-oxlint-1-stable) |
| Oxlint with JS plugins vs. ESLint, same rule set (Node.js repo, 202 rules: 104 built-in Rust + 75 JS-plugin + 23 custom JS, 6,298 files) | 21 s vs 1 m 43 s (~4.8x) | [Oxlint JS Plugins Alpha post](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha) |
| Oxlint + tsgolint (type-aware) vs. ESLint + typescript-eslint (VS Code, TypeORM benchmarks) | 12-18x faster | [Type-aware linting stable post](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable) |

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

Oxlint also accepts a typed TypeScript config file, `oxlint.config.ts` (or `.mts`), as an alternative to `.oxlintrc.json`; the two formats cannot coexist in the same directory ([linter config docs](https://oxc.rs/docs/guide/usage/linter/config)):

```ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: { correctness: 'error' },
});
```

## Best Practices

- **MUST** start from Oxlint's `correctness` category default. By default Oxlint enables rules in the correctness category and is designed to be useful with no configuration ([linter config docs](https://oxc.rs/docs/guide/usage/linter/config)). Layering additional categories should be deliberate.
- **SHOULD** drive ESLint flat-config migrations through `@oxlint/migrate` rather than hand-translating rules. The official migration path is a single CLI invocation: `npx @oxlint/migrate <optional-eslint-flat-config-path>` ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)).
- **SHOULD** audit the rule set against Oxlint's coverage list before assuming feature parity. Oxlint supports more than 800 rules from ESLint core and various popular plugins as of mid-2026 ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)), a number that grows with each release, so treat it as a floor rather than a fixed count.
- **SHOULD** enable `--type-aware` (backed by the `oxlint-tsgolint` package) when the ESLint config relies on typescript-eslint's type-aware rules. Coverage is 59 of the 61 type-aware rules in typescript-eslint ([type-aware usage docs](https://oxc.rs/docs/guide/usage/linter/type-aware.html)).
- **MAY** run Oxlint and ESLint side by side when a required rule has not been ported, with `eslint-plugin-oxlint` installed in the ESLint config to disable rules Oxlint already covers ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)).
- **MAY** adopt the JavaScript-plugin runtime, alpha since March 2026, when a custom or unported ESLint plugin is load-bearing. It targets the ESLint v9+ plugin API directly, so most existing plugins run without a rewrite ([JS Plugins Alpha post](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha); [JS plugins docs](https://oxc.rs/docs/guide/usage/linter/js-plugins)).

## Design Thinking

The Oxc team's framing is that Oxlint's architecture removes structural bottlenecks that limit performance in ESLint ([linter docs](https://oxc.rs/docs/guide/usage/linter)). The lint pipeline was rebuilt on the Oxc compiler stack rather than tuning ESLint in place. The trade is concrete: a Rust binary distribution in exchange for the multi-threaded parallelism, shared parser, and memory layout that yield the 50-100x figure. The cost showed up first at the plugin boundary. ESLint's plugin ecosystem is JS-native and every plugin runs inside the same Node process as the linter, a design Oxlint's native Rust rule set could not reuse directly.

The JavaScript-plugin runtime is the Oxc team's answer to that gap. It has been in alpha since March 2026, passing 99.6-100% of the original plugins' own test suites (33,006 ESLint core tests at 100%, ESLint Stylistic at 99.99%), with TypeScript plugin support, auto-fixes, and IDE integration; the Oxc team states most existing ESLint plugins now work out of the box ([JS Plugins Alpha post](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha); [JS plugins docs](https://oxc.rs/docs/guide/usage/linter/js-plugins)). Framework-specific plugins, such as Vue or Svelte support, are still pending. An earlier, October 2025 preview of this runtime published benchmark figures that an editor's note on the same post later called "way overestimated" because a bug in Oxlint caused JS plugins to be skipped on many files, invalidating the comparison ([Oxlint JS plugins preview post](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)); the alpha-era numbers above supersede it. Teams choosing Oxlint accept the remaining framework-plugin gap in exchange for the wall-clock budget the JS-plugin runtime and the Rust core together provide.

## Deep Dive

Type-aware linting is the rule category typescript-eslint uses for checks that need the full TypeScript type-checker output, such as `no-unsafe-assignment` and `no-floating-promises`, and it was the last major gap in an ESLint-to-Oxlint migration: a preview shipped in August 2025 and an alpha (43 rules) in December 2025, but it only went stable on 22 July 2026. Oxlint's answer is tsgolint v7, a separate Go binary built on typescript-go (the Go rewrite that underlies TypeScript v7), rather than the Rust core the rest of Oxlint runs on.

The split is architectural. Oxlint's Rust process handles file traversal, configuration, and the roughly 800 non-type-aware rules. tsgolint builds the TypeScript program once and runs the type-aware checks against it, then reports results back to the Oxlint process. Enabling it is a single flag, `oxlint --type-aware`, backed by the `oxlint-tsgolint@7` package. Coverage is 59 of the 61 type-aware rules in typescript-eslint, and the Oxc team's benchmarks on VS Code and TypeORM show the combination running 12-18x faster than ESLint with typescript-eslint on the same rule set ([type-aware linting stable post](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable); [type-aware usage docs](https://oxc.rs/docs/guide/usage/linter/type-aware.html); [tsgolint repository](https://github.com/oxc-project/tsgolint)).

## Migration from ESLint

The migration path depends on which ESLint config format the project uses.

**Flat config (ESLint v9+ or v8 with `eslint.config.js`).** Run the official migrator in one shot ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)):

```bash
npx @oxlint/migrate <optional-eslint-flat-config-path>
```

The command emits `.oxlintrc.json` derived from the flat config's rules and overrides.

**Legacy `.eslintrc.*`.** These configs cannot be migrated automatically by `@oxlint/migrate` ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)). Convert to flat config first (e.g. via `@eslint/migrate-config`), then run `@oxlint/migrate` against the resulting flat config.

**Coverage check.** Oxlint supports more than 800 rules from ESLint core and various popular plugins as of mid-2026 ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)). After running the migrator, diff the generated `.oxlintrc.json` against the original ESLint config to identify any rules that did not carry over.

**Type-aware rules.** If the ESLint config relies on typescript-eslint's type-aware rules, run `oxlint --type-aware` (requires the `oxlint-tsgolint` package) after the flat-config migration; it covers 59 of the 61 type-aware rules in typescript-eslint ([type-aware usage docs](https://oxc.rs/docs/guide/usage/linter/type-aware.html)). The remaining two rules, and anything else unported, fall to the side-by-side fallback below.

**Side-by-side fallback.** When required rules are still absent from Oxlint, the recommended pattern is to run Oxlint and ESLint side by side, with `eslint-plugin-oxlint` installed in the ESLint config to turn off every rule Oxlint already covers ([migrate-from-eslint docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint); [eslint-plugin-oxlint repository](https://github.com/oxc-project/eslint-plugin-oxlint)). Oxlint runs first to fail fast on cheap checks, and ESLint runs only the unported remainder instead of its full rule set. In package scripts:

```json
{
  "scripts": {
    "lint": "oxlint && eslint ."
  }
}
```

## Related Topics

- [FEE-1601 Linting & Static Analysis](/en/Developer%20Experience%20and%20Tooling/1601) — foundational linting article framing ESLint and Biome; Oxlint sits alongside them as a third option.
- [FEE-1611 Biome v2](/en/Developer%20Experience%20and%20Tooling/biome-v2) — parallel Rust-based toolchain article; Oxlint differentiates via ESLint-config compatibility and the JS plugin runtime.
- [FEE-1602 Code Formatting & EditorConfig](/en/Developer%20Experience%20and%20Tooling/1602) — the formatter concern is separate from the linter concern this article addresses.

## References

- Oxc project, "Linter," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter
- Oxc project, "Linter Configuration," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/config
- Oxc project, "Migrate from ESLint," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- Oxc project, "Announcing Oxlint 1.0 Stable," Oxc blog (2025). https://oxc.rs/blog/2025-06-10-oxlint-stable
- Oxc project, "Oxlint JavaScript Plugins," Oxc blog (2025; benchmark figures corrected 18 Oct 2025). https://oxc.rs/blog/2025-10-09-oxlint-js-plugins
- Oxc project, "Oxlint JS Plugins Alpha," Oxc blog (2026). https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha
- Oxc project, "JS Plugins," Oxc docs (2026). https://oxc.rs/docs/guide/usage/linter/js-plugins
- Oxc project, "Type-Aware Linting Stable," Oxc blog (2026). https://oxc.rs/blog/2026-07-22-type-aware-linting-stable
- Oxc project, "Type-Aware Linting," Oxc docs (2026). https://oxc.rs/docs/guide/usage/linter/type-aware.html
- Oxc project, "tsgolint," GitHub repository (2026). https://github.com/oxc-project/tsgolint
- Oxc project, "eslint-plugin-oxlint," GitHub repository (2026). https://github.com/oxc-project/eslint-plugin-oxlint
- VoidZero, "Announcing Oxlint 1 Stable," VoidZero blog (2025). https://voidzero.dev/posts/announcing-oxlint-1-stable
- InfoQ, "Oxlint v1 Released," InfoQ news (2025). https://www.infoq.com/news/2025/08/oxlint-v1-released/
- Oxc project, "oxlint-migrate," GitHub repository (2025). https://github.com/oxc-project/oxlint-migrate
