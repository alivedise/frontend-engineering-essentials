---
topic: Renovate Configuration for Frontend Repositories
id: 1616
slug: renovate
sources_reviewed: 9
claims: 16
---

# Findings: Renovate Configuration for Frontend Repositories

**Proposed topic-specific section:** `## Renovate vs Dependabot`.

## Claims

### Claim 1
- **Text:** Renovate is an automated dependency-update tool that delivers update PRs across 90+ package managers.
- **Target section:** Context
- **Source URL:** https://github.com/renovatebot/renovate
- **Pulled quote:** "Renovate is an automated dependency update tool. It helps to update dependencies in your code without needing to do it manually." / "Supports over 90 different package managers" / "Delivers update PRs directly to your repo"

### Claim 2
- **Text:** `extends` references shareable presets (JSON-only) to inherit configuration; the canonical preset is `config:recommended`.
- **Target section:** Context
- **Source URL:** https://docs.renovatebot.com/configuration-options/
- **Pulled quote:** "Also, be sure to check out Renovate's shareable config presets to save yourself from reinventing any wheels." / "Shareable config presets only work with the JSON format."

### Claim 3
- **Text:** `config:recommended` bundles a Dependency Dashboard issue, semantic-prefix commits, ignored modules/tests, group:monorepos, group:recommended, age-confidence badges, and digest changelog helpers.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/presets-config/
- **Pulled quote:** "Recommended configuration for most users. It does not matter what programming language you use." (`config:recommended` lists `:dependencyDashboard`, `:semanticPrefixFixDepsChoreOthers`, `:ignoreModulesAndTests`, `group:monorepos`, `group:recommended`, etc.)

### Claim 4
- **Text:** `config:js-app` adds `:pinAllExceptPeerDependencies` for webapps; `config:js-lib` adds `:pinOnlyDevDependencies` for libraries.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/presets-config/
- **Pulled quote:** "Default configuration for webapps." / "Default configuration for libraries."

### Claim 5
- **Text:** `packageRules` is an array of conditional configuration objects with match attributes including `matchPackageNames`, `matchManagers`, `matchUpdateTypes`, `matchDepTypes`, `matchDatasources`.
- **Target section:** Example
- **Source URL:** https://docs.renovatebot.com/configuration-options/
- **Pulled quote:** "array of objects that allows you to apply conditional configuration." / "Allowed `matchUpdateTypes` values: `[\"major\", \"minor\", \"patch\", \"pin\", \"digest\"]`."

### Claim 6
- **Text:** `groupName` collapses related dependency updates into a single PR — Renovate's distinguishing capability over Dependabot.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/configuration-options/
- **Pulled quote:** "Descriptive name assigned to a grouped set of dependencies for PR organization."

### Claim 7
- **Text:** `schedule` accepts natural-language windows (e.g., "every weekend", "before 5am") to throttle PR creation off-hours.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/configuration-options/
- **Pulled quote:** "Limit branch/PR creation to specific times of day or week." (default `\"at any time\"`; example `\"every weekend\"`).

### Claim 8
- **Text:** `rangeStrategy` controls how range constraints are rewritten: `auto`, `bump`, `extend`, `pin`, `replace`, `widen`.
- **Target section:** Deep Dive
- **Source URL:** https://docs.renovatebot.com/configuration-options/
- **Pulled quote:** "Allowed `rangeStrategy` values: `[\"auto\", \"bump\", \"extend\", \"pin\", \"replace\", \"widen\"]`."

### Claim 9
- **Text:** `lockFileMaintenance` keeps `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock` fresh on a schedule.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/modules/manager/npm/
- **Pulled quote:** "Automatically maintain[s] lock files by updating them." / "supports lockFileMaintenance for the following file(s): `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`."

### Claim 10
- **Text:** `minimumReleaseAge` (renamed from `stabilityDays`) suppresses PR creation for a configurable window after a release ships, mitigating supply-chain risk from newly-published packages.
- **Target section:** Design Thinking
- **Source URL:** https://docs.renovatebot.com/configuration-options/
- **Pulled quote:** "Suppress branch/PR creation for X days." (formats: `\"3 days\"`, `\"2 weeks\"`).

### Claim 11
- **Text:** Automerge waits for required tests to pass; `platformAutomerge` (default true) uses GitHub native merge queue.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/key-concepts/automerge/
- **Pulled quote:** "Renovate will wait for the required tests to pass before it automerges." / "By default, Renovate uses platform-native automerge to speed up automerging. If you don't want Renovate to use the platform-native automerge, then set `platformAutomerge` to `false`."

### Claim 12
- **Text:** Automerge guidance: enable for devDependencies non-major; for production deps require strong test coverage first.
- **Target section:** Design Thinking
- **Source URL:** https://docs.renovatebot.com/key-concepts/automerge/
- **Pulled quote:** "Automerge often works well for `devDependencies`. It can work for production `dependencies` too, but your project should have good test coverage."

### Claim 13
- **Text:** Renovate's npm manager surfaces the `packageManager` field as a dependency type and uses Corepack to install Yarn when it detects a `packageManager` setting.
- **Target section:** Best Practices
- **Source URL:** https://docs.renovatebot.com/modules/manager/npm/
- **Pulled quote:** "Listed under `packageManager`" / "If Renovate detects a `packageManager` setting for Yarn in `package.json` then it will use Corepack to install Yarn."

### Claim 14
- **Text:** Renovate ships dependency grouping out of the box; Dependabot requires custom group definitions.
- **Target section:** Renovate vs Dependabot
- **Source URL:** https://docs.renovatebot.com/bot-comparison/
- **Pulled quote:** "comes with community-provided groupings of dependencies. So Renovate groups common dependencies into a single PR, out-of-the-box." (Dependabot: "can group dependencies into a single PR too, but you must set your own groups first.")

### Claim 15
- **Text:** Renovate's monorepo preset, Dependency Dashboard, per-dep schedules, and platform support distinguish it from Dependabot's per-language scheduling.
- **Target section:** Renovate vs Dependabot
- **Source URL:** https://docs.renovatebot.com/bot-comparison/
- **Pulled quote:** "has a `group:monorepos` preset, that upgrades common monorepo packages in a single PR." / "One big feature of Renovate is the Dependency Dashboard, which is enabled by default." / "can set a schedule for Renovate, per dependency, manager, or even a global schedule" / "works on multiple platforms, including GitHub" / "needs app installation or self-hosting"

### Claim 16
- **Text:** Dependabot supports `npm`, `bun`, `yarn`, `docker`, `github-actions`, etc.; schedules are `daily`, `weekly`, or `monthly`; default open-PR cap is 5.
- **Target section:** Renovate vs Dependabot
- **Source URL:** https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file
- **Pulled quote:** "Use `daily` to run on every weekday, Monday to Friday. Use `weekly` to run once a week, by default on Monday. Use `monthly` to run on the first day of each month." / "If five pull requests with version updates are open, no further pull requests are raised until some of those open requests are merged or closed."

## Reference URLs

- https://docs.renovatebot.com/
- https://docs.renovatebot.com/configuration-options/
- https://docs.renovatebot.com/presets-config/
- https://docs.renovatebot.com/key-concepts/automerge/
- https://docs.renovatebot.com/bot-comparison/
- https://docs.renovatebot.com/modules/manager/npm/
- https://github.com/renovatebot/renovate
- https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file
- https://github.com/dependabot/dependabot-core

## Research notes

- `config:base` is the legacy preset name; current is `config:recommended`. Article MUST use `config:recommended`.
- `stabilityDays` was renamed to `minimumReleaseAge`. Use the new name.
- Renovate's npm manager updates `pnpm-lock.yaml` generically; do not over-claim version-specific awareness.
- Adjacency: FEE-1205 Supply Chain Security — vulnerability scanning is distinct from PR-automation. Cross-link.
- Adjacency: FEE-1507 Release Automation — semver/changelog are distinct. Renovate touches semver only via `rangeStrategy`/groups on the consumer side.
- The `bot-comparison` page is the canonical Renovate-published vs-Dependabot comparison.

## Rejected sources

- Wikipedia, Dev.to, vendor marketing blogs (turbostarter.dev, vife.ai, appsecsanta.com), AI-SEO comparison pages — banned by source-tier rule.
- github.com/renovatebot/renovate/blob/main/docs/usage/dependabot.md — 404; canonical comparison at docs.renovatebot.com/bot-comparison/.
- docs.github.com/code-security/dependabot index page — used the deeper configuration-options page for verbatim claims.
