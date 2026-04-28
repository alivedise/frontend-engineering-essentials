---
topic: Knip — Unused Files, Exports, and Dependency Detection
id: 1615
slug: knip
sources_reviewed: 11
claims: 16
---

# Findings: Knip — Unused Files, Exports, and Dependency Detection

**Proposed topic-specific section:** `## Configuration Anatomy`.

## Claims

### Claim 1
- **Text:** Knip finds and fixes unused dependencies, exports, and files in JavaScript and TypeScript projects.
- **Target section:** Context
- **Source URL:** https://github.com/webpro-nl/knip
- **Pulled quote:** "Knip finds and fixes **unused dependencies, exports and files** in your JavaScript and TypeScript projects." / "Less code and dependencies lead to improved performance, less maintenance and easier refactorings."

### Claim 2
- **Text:** Knip surfaces a typed taxonomy of issue kinds: files, dependencies, devDependencies, optionalPeerDependencies, unlisted, binaries, unresolved, exports, types, enumMembers, namespaceMembers, duplicates, catalog.
- **Target section:** Visual
- **Source URL:** https://knip.dev/features/rules-and-filters
- **Pulled quote:** "Unused enums and unused members of exported enums are reported by default."

### Claim 3
- **Text:** `entry` declares the roots of the import graph; `project` declares which files count as in-scope source.
- **Target section:** Configuration Anatomy
- **Source URL:** https://knip.dev/reference/configuration
- **Pulled quote:** "Array of glob patterns to find entry files. Prefix with `!` for negation." / "Array of glob patterns to find project files."

### Claim 4
- **Text:** Plugins auto-enable based on `package.json` membership and consume each tool's own config files (e.g., `vite.config`, `astro.config.mjs`).
- **Target section:** Configuration Anatomy
- **Source URL:** https://knip.dev/explanations/plugins
- **Pulled quote:** "Plugins are enabled if the related package is listed in the list of dependencies in `package.json`." / "Plugins load configuration files to find referenced dependencies, and determine unused and unlisted dependencies."

### Claim 5
- **Text:** Plugins ship for major frontend tools: ESLint, Vite, Vitest, Next.js, Storybook, Playwright, Angular, GitHub Actions, webpack.
- **Target section:** Best Practices
- **Source URL:** https://knip.dev/explanations/plugins
- **Pulled quote:** "ESLint (parses `.eslintrc.json`), Vitest (returns `@vitest/coverage-istanbul`), Next.js (adds `pages/**/*.{js,jsx,ts,tsx}`), Playwright (reads `testDir`/`testMatch`), Angular (parses `angular.json`), GitHub Actions (parses workflow YAML)."

### Claim 6
- **Text:** In monorepos, root-level `entry` and `project` are ignored; the workspace named `"."` carries them. Workspaces come from `package.json#workspaces`, `pnpm-workspace.yaml`, or Knip's own config.
- **Target section:** Configuration Anatomy
- **Source URL:** https://knip.dev/features/monorepos-and-workspaces
- **Pulled quote:** "In a project with workspaces, the `entry` and `project` options at the root level are ignored. Use the workspace named `\".\"` for those." / "Each workspace has the same default configuration."

### Claim 7
- **Text:** `--workspace` includes ancestors and dependents because ancestors may declare deps the linted workspace uses.
- **Target section:** Deep Dive
- **Source URL:** https://knip.dev/features/monorepos-and-workspaces
- **Pulled quote:** "This will include the target workspace(s), but also ancestor and dependent workspaces. For two reasons: Ancestor workspaces may list dependencies in `package.json` the linted workspace uses."

### Claim 8
- **Text:** Rules in `knip.json` accept `error` (counted toward exit code), `warn` (printed faded), or `off` (suppressed entirely).
- **Target section:** Best Practices
- **Source URL:** https://knip.dev/features/rules-and-filters
- **Pulled quote:** "error: Similar to the `--include` filter — printed and counted toward errors." / "warn: printed faded, not counted toward error count." / "off: Similar to the `--exclude` filter — neither printed nor counted."

### Claim 9
- **Text:** Knip's CLI exit codes form a CI gating contract: 0 clean, 1 lint issues, 2 internal error.
- **Target section:** Best Practices
- **Source URL:** https://knip.dev/reference/cli
- **Pulled quote:** "Code 0: Knip ran successfully, no lint issues" / "Code 1: Knip ran successfully, but there is at least one lint issue" / "Code 2: Knip did not run successfully due to bad input or internal error"

### Claim 10
- **Text:** `--production` excludes test files, configuration files, Storybook stories, and devDependencies; `--strict` adds workspace isolation.
- **Target section:** Best Practices
- **Source URL:** https://knip.dev/reference/cli
- **Pulled quote:** "`--production`: Lint only production source files. This excludes: entry files defined by plugins: test files, configuration files, Storybook stories; `devDependencies` from `package.json`" / "`--strict`: Isolate workspaces and consider only direct dependencies. Implies production mode."

### Claim 11
- **Text:** Exports from entry files are ignored by default; `--include-entry-exports` opts in to checking them.
- **Target section:** Configuration Anatomy
- **Source URL:** https://knip.dev/guides/handling-issues
- **Pulled quote:** "They might be exported from an entry file. In that case, use `--include-entry-exports` to make Knip also report unused exports in entry files." / "Enums exported from entry files are ignored, and so are their members."

### Claim 12
- **Text:** `ignoreExportsUsedInFile` is a root-only option that suppresses reports for exports used internally within the same file.
- **Target section:** Best Practices
- **Source URL:** https://knip.dev/guides/handling-issues
- **Pulled quote:** "Ignore exports used in file for exports used internally."

### Claim 13
- **Text:** Reporters span symbols (default), compact, codeowners, json, codeclimate, markdown, disclosure, github-actions for CI fan-out.
- **Target section:** Best Practices
- **Source URL:** https://knip.dev/reference/cli
- **Pulled quote:** "Available reporters: `symbols` (default), `compact`, `codeowners`, `json`, `codeclimate`, `markdown`, `disclosure`, `github-actions`"

### Claim 14
- **Text:** `--fix` removes unused export keywords, drops unused dependencies/devDependencies, deletes unused files; it does NOT add unlisted deps or fix duplicate exports.
- **Target section:** Deep Dive
- **Source URL:** https://knip.dev/features/auto-fix
- **Pulled quote:** "Remove `export` keyword for unused exports, re-exports, and exported types" / "Remove unused `dependencies` and `devDependencies` from `package.json`" / "Remove unused files"

### Claim 15
- **Text:** ts-prune, depcheck, unimported, and tsr are archived; their authors recommend Knip as the successor.
- **Target section:** Context
- **Source URL:** https://knip.dev/explanations/comparison-and-migration
- **Pulled quote:** "ts-prune aims to find potentially unused exports in your TypeScript project with zero configuration." / "The project is archived and recommends Knip."

### Claim 16
- **Text:** Knip statically parses `package.json` scripts and CLI args to detect inputs without executing them: positional first-arg as entry, `-c`/`--config` as config, `--require`/`--loader`/`--import` as deps.
- **Target section:** Deep Dive
- **Source URL:** https://knip.dev/features/script-parser
- **Pulled quote:** "When parsing the `scripts` of `package.json` and other files, Knip detects various types of inputs." / "The first positional argument is usually an entry file" / "Configuration files are often in the `-c` or `--config` argument" / "The `--require`, `--loader` or `--import` arguments are often dependencies"

## Reference URLs

- https://knip.dev/overview/getting-started
- https://knip.dev/reference/configuration
- https://knip.dev/reference/cli
- https://knip.dev/features/rules-and-filters
- https://knip.dev/features/auto-fix
- https://knip.dev/features/script-parser
- https://knip.dev/features/monorepos-and-workspaces
- https://knip.dev/explanations/why-use-knip
- https://knip.dev/explanations/plugins
- https://knip.dev/explanations/comparison-and-migration
- https://knip.dev/guides/handling-issues
- https://github.com/webpro-nl/knip

## Research notes

- Four major detection axes for the article: unused files, unused dependencies (incl. unlisted/binaries), unused exports/types, unused members (enum + namespace). Brief mentioned "class members" but Knip's own taxonomy is `enumMembers` / `namespaceMembers`.
- The CI exit-code contract (0/1/2) plus `--reporter github-actions` and `--no-exit-code` are the key CI hooks.
- Plugin model is the article's most-distinctive angle vs ts-prune/depcheck — auto-enabled by `package.json` membership.
- `entry` vs `project` is foundational; mis-specifying these is the dominant cause of false positives.
- Monorepo footgun: root-level `entry`/`project` are ignored; must use `"."` workspace key.
- Adjacency: FEE-705 Tree Shaking — bundler-time elimination, distinct scope from project-graph dead-export detection. Cross-link once, explain boundary.
- Adjacency: FEE-1601 Linting & Static Analysis — `no-unused-vars` sees inside one file; Knip sees the whole project graph.
- Auto-fix scope is intentionally narrow: removing `export` keywords and dropping unused `package.json` entries is safe; adding unlisted deps requires intent.

## Rejected sources

- Smashing Magazine, Dev.to, pkgpulse.com AI-SEO, npm-compare.com, npmtrends.com — third-party or AI-generated.
- effectivetypescript.com — named author, but claims already covered by knip.dev sources.
- knip.dev/overview/plugins — 404; correct path is `explanations/plugins`.
- knip.dev/features/comparison — 404; correct path is `explanations/comparison-and-migration`.
