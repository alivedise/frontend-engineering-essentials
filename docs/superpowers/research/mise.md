---
topic: mise (and asdf) for Polyglot Tool and Env Version Management
id: 1613
slug: mise
sources_reviewed: 11
claims: 16
---

# Findings: mise (and asdf) for Polyglot Tool and Env Version Management

**Proposed topic-specific section:** `## mise vs asdf vs nvm/fnm`.

## Claims

### Claim 1
- **Text:** mise is a polyglot dev-tools, env vars, and tasks CLI that prepares the development environment before each command runs.
- **Target section:** Context
- **Source URL:** https://github.com/jdx/mise
- **Pulled quote:** "Dev tools, env vars, and tasks in one CLI" / "`mise` prepares your development environment before each command runs."

### Claim 2
- **Text:** mise installs and switches hundreds of dev tools, including Node, Python, CMake, and Terraform.
- **Target section:** Context
- **Source URL:** https://github.com/jdx/mise
- **Pulled quote:** "Install and switch between dev tools like node, python, cmake, terraform, and hundreds more."

### Claim 3
- **Text:** `mise.toml` has three first-class sections: `[tools]` for dev tools, `[env]` for environment variables, and `[tasks.*]` for runnable scripts.
- **Target section:** Visual
- **Source URL:** https://mise.jdx.dev/configuration.html
- **Pulled quote:** "`[tools]` - Dev tools" / "`[env]` - Arbitrary Environment Variables" / "`[tasks.*]` - Run files or shell scripts"

### Claim 4
- **Text:** `mise.toml` files are hierarchical: configuration in a directory closer to CWD overrides parent-directory configuration.
- **Target section:** Best Practices
- **Source URL:** https://mise.jdx.dev/configuration.html
- **Pulled quote:** "`mise.toml` files are hierarchical. The configuration in a file in the current directory will override conflicting configuration in parent directories."

### Claim 5
- **Text:** mise reads asdf's `.tool-versions` files but the maintainer states asdf compatibility is no longer a design goal.
- **Target section:** mise vs asdf vs nvm/fnm
- **Source URL:** https://mise.jdx.dev/faq.html
- **Pulled quote:** "mise should be able to read/install any `.tool-versions` file used by asdf." / "that said, in general compatibility with asdf is no longer a design goal."

### Claim 6
- **Text:** mise is documented as a drop-in replacement for nvm: it supports `.nvmrc` and `.node-version` files in addition to its own `mise.toml`.
- **Target section:** mise vs asdf vs nvm/fnm
- **Source URL:** https://mise.jdx.dev/lang/node.html
- **Pulled quote:** "Like `nvm`, (or `volta`, `fnm` or `asdf`...), `mise` can manage multiple versions of Node.js on the same system." / "It also supports `.tool-versions`, `.nvmrc` or `.node-version` file ... This makes it a drop-in replacement for `nvm`."

### Claim 7
- **Text:** mise has two activation modes: `mise activate` injects PATH on every prompt, and shims intercept commands via symlinks to the mise binary.
- **Target section:** Deep Dive
- **Source URL:** https://mise.jdx.dev/dev-tools/shims.html
- **Pulled quote:** "When using shims, `mise` places small executables (`shims`) in a directory that is included in your `PATH`." / "updates environment variables every time the prompt is displayed. In particular, it updates the `PATH` environment variable."

### Claim 8
- **Text:** The maintainer recommends `mise activate` (PATH injection) over shims for interactive shells; shims break `which`, env vars for non-mise tools, and most hooks.
- **Target section:** Best Practices
- **Source URL:** https://mise.jdx.dev/dev-tools/shims.html
- **Pulled quote:** "In general, using PATH (`mise activate`) instead of shims for _interactive_ situations is recommended." / "Env vars defined in mise are only available to mise tools" / "Most hooks won't trigger" / "The unix `which` command points to the shim, obscuring the real executable"

### Claim 9
- **Text:** mise reshims automatically when tools are installed, updated, or removed; manual `mise reshim` is only needed for repair.
- **Target section:** Deep Dive
- **Source URL:** https://mise.jdx.dev/dev-tools/shims.html
- **Pulled quote:** "`mise reshim` only creates/removes the shims. Some users sometimes use it as a 'fix it' button, but it is only necessary if `~/.local/share/mise/shims` doesn't contain something it should." / "`mise` already runs a reshim anytime a tool is installed/updated/removed."

### Claim 10
- **Text:** When activated, mise auto-loads the `[env]` block on `cd` into a project directory, eliminating the need for a separate direnv.
- **Target section:** Best Practices
- **Source URL:** https://mise.jdx.dev/environments/
- **Pulled quote:** "Load the right _environment variables_ automatically for each project directory." / "If mise is activated, it will automatically set environment variables in the current shell session when you `cd` into a directory."

### Claim 11
- **Text:** `env._.path` extends PATH and `env._.file` loads dotenv/json/yaml files; relative paths resolve against `config_root`.
- **Target section:** Example
- **Source URL:** https://mise.jdx.dev/environments/
- **Pulled quote:** "`PATH` is treated specially. Use `env._.path` to add extra directories to the `PATH`" / "`env._.file` can be used to specify a dotenv file to load." / "Relative paths in environment directives are resolved against `config_root`"

### Claim 12
- **Text:** mise has a built-in task runner with two task formats: TOML entries inside `mise.toml` and standalone shell-script files.
- **Target section:** Example
- **Source URL:** https://mise.jdx.dev/tasks/
- **Pulled quote:** "Define and run project _tasks_ for building, testing, linting, deploying, and everyday development workflows." / "There are 2 ways to define tasks: [inside of mise.toml files] or as [standalone shell scripts]."

### Claim 13
- **Text:** Tasks auto-install missing tools and inherit the mise environment, making them CI-portable without setup scripts.
- **Target section:** Best Practices
- **Source URL:** https://mise.jdx.dev/tasks/
- **Pulled quote:** "tasks launched with mise will include the mise environment—your tools and env vars defined in `mise.toml`"

### Claim 14
- **Text:** mise tasks support parallel dependency execution and last-modified incremental rebuild gating.
- **Target section:** Deep Dive
- **Source URL:** https://mise.jdx.dev/tasks/
- **Pulled quote:** "building dependencies in parallel—by default with no configuration required" / "last-modified checking to avoid rebuilding when there are no changes—requires minimal config"

### Claim 15
- **Text:** mise prefers non-asdf backends (aqua, ubi, npm, cargo, pipx, go); new asdf plugins are mostly rejected for supply-chain reasons.
- **Target section:** mise vs asdf vs nvm/fnm
- **Source URL:** https://mise.jdx.dev/registry.html
- **Pulled quote:** "aqua - offers the most features and security while not requiring plugins" / "New vfox and asdf tools are almost never accepted for supply-chain security reasons."

### Claim 16
- **Text:** `mise use --pin` resolves aliases like `lts` and `latest` to exact versions in the committed `mise.toml`.
- **Target section:** Best Practices
- **Source URL:** https://mise.jdx.dev/cli/use.html
- **Pulled quote:** "Save exact version to config file e.g.: `mise use --pin node@20` will save 20.0.0 as the version" / "Set `MISE_PIN=1` to make this the default behavior"

## Reference URLs

- https://mise.jdx.dev/about.html
- https://mise.jdx.dev/getting-started.html
- https://mise.jdx.dev/configuration.html
- https://mise.jdx.dev/lang/node.html
- https://mise.jdx.dev/dev-tools/shims.html
- https://mise.jdx.dev/environments/
- https://mise.jdx.dev/tasks/
- https://mise.jdx.dev/registry.html
- https://mise.jdx.dev/faq.html
- https://mise.jdx.dev/cli/use.html
- https://github.com/jdx/mise
- https://asdf-vm.com/
- https://asdf-vm.com/manage/configuration.html
- https://asdf-vm.com/manage/core.html

## Research notes

- "Compatibility with asdf is no longer a design goal" is a maintainer-stated direction shift; quote it directly in the comparison section.
- The Node-page line "drop-in replacement for `nvm`" is the cleanest single-source justification for cross-linking FEE-1609.
- mise's preferred backends are aqua / github / pipx / npm / cargo / go — different from asdf's plugin model. Many readers migrating from asdf will assume plugin compatibility carries over; it does not.
- Shim docs are unusually candid about footguns; surface them in Best Practices, not Deep Dive.
- Adjacency: FEE-1609 Local Dev Env Setup mentions nvm and fnm; FEE-1613 should be the polyglot version-manager home.
- Adjacency: FEE-1614 Corepack covers `packageManager` field pinning. mise pins runtimes; Corepack pins the package manager. They compose. Cross-link.
- For zh-TW translation: "drop-in replacement for nvm" → 「可直接替代 nvm」.
- The `node@lts/iron` syntax I asked about could not be verified from primary sources; recommend `node@lts` and `node@22` instead.

## Rejected sources

- mise.jdx.dev/IDE-integration.html — 404. IDE-shim angle sourced from `dev-tools/shims.html`.
- mise.jdx.dev/install.html — 404. Use getting-started instead.
- Wikipedia, anonymous Medium/Dev.to/Hashnode — banned by source tier.
- Reddit/HN threads — not citable as primary sources.
