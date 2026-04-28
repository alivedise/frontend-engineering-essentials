---
id: 1611
title: "Biome v2 — Type-Aware Linting + Formatting + Assists Toolchain"
state: draft
slug: biome-v2
---

# [FEE-1611] Biome v2 — Type-Aware Linting + Formatting + Assists Toolchain

:::info
Biome is a Rust toolchain that bundles a formatter, a linter, and (in v2) an Assists subsystem for JavaScript, TypeScript, JSX, JSON, CSS, and GraphQL. The formatter scores 97% Prettier compatibility; the linter ships 450+ rules sourced from ESLint and typescript-eslint. v2 ("Biotype") is the first JS/TS linter to provide type-aware lint rules without depending on the TypeScript compiler, gating that capability behind a `types` linter domain that boots a project-wide file scanner and a home-grown inference engine on demand. This article covers the v2 surface, how to opt into domains safely, and the v1 → v2 upgrade path driven by the built-in `migrate` command.
:::

## Context

Biome positions itself as "a performant toolchain for web projects" that aims "to provide developer tools to maintain the health of said projects" (biomejs/biome README). The single binary delivers three surfaces in one Rust process: a formatter, a linter, and (new in v2) Assists.

On the formatting axis, Biome targets Prettier parity: the README states it is "a fast formatter for JavaScript, TypeScript, JSX, JSON, CSS and GraphQL that scores 97% compatibility with Prettier." On the linting axis, the same README describes a linter that "features more than 450 rules from ESLint, typescript-eslint, and other sources."

v2 ("Biotype"), announced on the Biome blog, claims to be "the *first* JavaScript and TypeScript linter that provides type-aware linting rules that doesn't rely on the TypeScript compiler." That capability is paired with a project-wide file scanner described as scanning "all the files in your project and indexes them, similar to what an LSP service might do in your IDE," lifting Biome out of single-file-only checking and enabling cross-file analysis.

## Scenario

Consider a TypeScript repository running the conventional 2024-era stack: ESLint with `@typescript-eslint/parser`, `parserOptions.project` pointed at `tsconfig.json` to enable type-aware rules, Prettier for formatting, a custom `eslint-plugin-import` configuration for `organize-imports`, and a pre-commit hook running all of the above sequentially. CI lint time is dominated by typescript-eslint type-checking; the editor surfaces inconsistent diagnostics depending on which tool ran last; new contributors must learn three configuration files (`.eslintrc`, `.prettierrc`, `tsconfig.json`) before their first commit lands.

Biome v2 collapses that surface area into one binary and one config (`biome.json`), with type-aware checks gated behind a `types` domain that opts the project into the inference engine and file scanner only when those rules are enabled.

## Best Practices

- **MUST** declare framework-specific rule groups by enabling the matching linter domain rather than enabling rules ad-hoc. Domains "Use this domain inside Next.js projects," "Use this domain when linting test files," and so on (biomejs.dev/linter/domains/), so opting in by ecosystem keeps the active ruleset aligned with the runtime.
- **MUST** treat the `types` domain as a capability flag. The Biome domains page states that "When enabling rules that belong to this domain, Biome will scan the entire project, *and it will enable the inference engine to resolve and flat types*." Enabling `types` boots the scanner and the inference engine; leaving it off keeps Biome single-file-fast.
- **SHOULD** opt into the `project` domain when adding rules that need cross-file analysis. The domains page describes `project` as "rules that perform project-level analysis," so cross-file work belongs here instead of in `types`.
- **SHOULD** keep the formatter at default settings until a concrete reason to diverge appears. Biome's formatter advertises "97% compatibility with Prettier" (biomejs/biome README); divergence reduces that compatibility number for the repository in question.
- **MAY** add custom rules through the GritQL plugin system (biomejs.dev/linter/plugins/) when the built-in 450+ rules do not cover an internal pattern, accepting that v2 plugins emit diagnostics without autofix.

## Design Thinking

The headline trade-off in v2 is the home-grown inference engine versus reusing `tsc` through typescript-eslint. The Biome blog states that the engine "can detect floating promises in about 75% of the cases that would be detected by using `typescript-eslint`, at a fraction of the performance impact." That phrasing names what gets traded against what: a quantified recall gap (~75% on the `noFloatingPromises` case) is exchanged for runtime cost. Teams that need the missing 25% keep typescript-eslint for those rules; teams that prioritize wall-clock CI time accept the gap and let Biome's inference engine handle the bulk.

Domains encode the same trade-off at the configuration layer. Leaving `types` off keeps Biome in its single-file regime (no scanner, no inference engine). Turning `types` on pays the indexing cost up front and unlocks the type-aware rules the engine supports today.

## Deep Dive

**Inference engine.** The Biome v2 blog post anchors the inference engine to a specific quantitative claim: 75% of typescript-eslint's `noFloatingPromises` findings, "at a fraction of the performance impact." That is the only quoted recall number in the v2 announcement; other rules under the `types` domain inherit the engine but do not carry their own quoted percentages.

**GritQL plugins.** v2 ships a plugin system documented at biomejs.dev/linter/plugins/: "these plugins allow you to match specific code patterns and register customized diagnostic messages for them." Plugins are authored as `.grit` files (GritQL pattern syntax) and registered through `biome.json`. v2 plugins emit diagnostics; autofix support is not in v2.

**Roadmap context.** The 2025 roadmap post (biomejs.dev/blog/roadmap-2025/) commits to "ship a real version of `noFloatingPromises`, and hopefully dabble further into type inference," and to add "true Multi-file support to Biome 2.0. This means that our lint rules will be able to query information from other files." Both line items name the boundaries of what v2 currently delivers: the inference engine is the down payment, with broader type-awareness staked for later releases.

## Visual

Linter domains and what each one unlocks (biomejs.dev/linter/domains/):

| Domain    | Opts the project into                                                         |
|-----------|-------------------------------------------------------------------------------|
| `react`   | React-idiomatic rules (hooks, JSX, component patterns)                        |
| `next`    | Next.js-specific rules ("Use this domain inside Next.js projects")            |
| `vue`     | Vue-specific rules                                                            |
| `solid`   | Solid-specific rules                                                          |
| `qwik`    | Qwik-specific rules                                                           |
| `test`    | Test-file rules ("Use this domain when linting test files")                   |
| `project` | Cross-file project-level analysis ("rules that perform project-level analysis") |
| `types`   | Trigger: boots the file scanner and the inference engine for type-aware rules |

The `types` row is the trigger row: enabling any rule in the `types` domain causes Biome to "scan the entire project" and enable the "inference engine to resolve and flat types."

## Example

A `biome.json` for a React + TypeScript app, with type-aware lint, framework rules, and Assists for import organization:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "linter": {
    "enabled": true,
    "domains": {
      "react": "recommended",
      "types": "all",
      "project": "recommended"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": {
          "level": "on"
        }
      }
    }
  },
  "formatter": {
    "enabled": true
  }
}
```

For a monorepo with a per-package override, the nested `biome.json` extends the root config using the `"extends": "//"` microsyntax. The big-projects guide states that "Nested configurations 'must have the field `root` set to `false`,'" and that they can use the microsyntax `"extends": "//"` to "extend from the **root configuration**, regardless of where the nested configuration is" (biomejs.dev/guides/big-projects/):

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "root": false,
  "extends": "//",
  "linter": {
    "domains": {
      "test": "recommended"
    }
  }
}
```

Teams replacing both ESLint and Prettier should bootstrap the config from existing tools rather than authoring `biome.json` by hand. The migration guide at biomejs.dev/guides/migrate-eslint-prettier/ documents the dedicated subcommands `biome migrate eslint --write` and `biome migrate prettier --write`, which translate the source configurations into Biome equivalents.

## v1 → v2 Upgrade Path

The Biome v1 → v2 guide (biomejs.dev/guides/upgrade-to-biome-v2/) walks through four mechanical changes; each maps to a concrete config rewrite.

**1. Run `biome migrate`.** The upgrade guide instructs users to "Run the `migrate` command to update the configuration." The command rewrites `biome.json` in place to v2 schema, including the schema URL bump and any field renames covered below.

**2. `ignore` and `include` collapse into `includes`.** The same guide states: "The options `ignore` and `include` are removed, and replaced by `includes` with corrected glob behavior that no longer prepends `**/`." Two consequences:
- Anything that previously read `"include": ["src/**/*.ts"]` plus `"ignore": ["**/*.test.ts"]` becomes a single `"includes": ["src/**/*.ts", "!**/*.test.ts"]` field.
- v1 silently prepended `**/` to bare globs; v2 does not. Glob patterns that used to match anywhere in the tree (`"*.config.js"`) now match only at the root and need explicit `**/*.config.js` if the original behavior was intended.

**3. ESLint and Prettier configs port through dedicated subcommands.** Teams arriving from the conventional ESLint + Prettier stack run `biome migrate eslint --write` and `biome migrate prettier --write` (biomejs.dev/guides/migrate-eslint-prettier/) to translate existing configuration into Biome equivalents in a single step.

**4. Import Organizer moved into Assists.** The v2 blog post records that "The Import Organizer became 'an assist' in a broader generalization providing 'actions, which are similar to the _fixes_ in lint rules, but without the diagnostics.'" Two follow-ups for upgraders:
- The dedicated `organizeImports` top-level field is gone; configure the action under `assist.actions.source.organizeImports.level` instead (see Example).
- The v2 organizer was rebuilt to merge same-module imports and support custom ordering, so the output diff after upgrade may not be byte-identical to v1's organizer even at default settings.

## Internal References

- [FEE-1601 Linting & Static Analysis](/en/Developer%20Experience%20and%20Tooling/1601) — Biome v2 fits the type-aware linting category alongside ESLint + typescript-eslint; FEE-1611 is the canonical Biome v2 deep dive.
- [FEE-1602 Code Formatting & EditorConfig](/en/Developer%20Experience%20and%20Tooling/1602) — Biome's formatter targets 97% Prettier compatibility, the bridge for teams replacing Prettier in place.
- [FEE-1610 Oxlint](/en/Developer%20Experience%20and%20Tooling/1610) — sibling Rust linter with a different pitch: Oxlint is a drop-in fast ESLint replacement; Biome v2 is "one toolchain, type-aware."

## References

- biomejs, "biomejs/biome — README," GitHub (2025). https://github.com/biomejs/biome
- biomejs, "Biome v2," Biome blog (2025). https://biomejs.dev/blog/biome-v2/
- biomejs, "Roadmap 2025," Biome blog (2025). https://biomejs.dev/blog/roadmap-2025/
- biomejs, "Upgrade to Biome v2," Biome guides (2025). https://biomejs.dev/guides/upgrade-to-biome-v2/
- biomejs, "Migrate from ESLint and Prettier," Biome guides (2025). https://biomejs.dev/guides/migrate-eslint-prettier/
- biomejs, "Big projects," Biome guides (2025). https://biomejs.dev/guides/big-projects/
- biomejs, "Linter domains," Biome documentation (2025). https://biomejs.dev/linter/domains/
- biomejs, "Linter plugins," Biome documentation (2025). https://biomejs.dev/linter/plugins/
- biomejs, "Assist," Biome documentation (2025). https://biomejs.dev/assist/
