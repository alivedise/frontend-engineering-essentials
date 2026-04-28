---
topic: Development Containers (devcontainer.json) for Reproducible Environments
id: 1612
slug: devcontainers
sources_reviewed: 10
claims: 16
---

# Findings: Development Containers (devcontainer.json) for Reproducible Environments

**Proposed topic-specific section:** `## CI Integration`.

## Claims

### Claim 1
- **Text:** The Development Containers Specification is an open spec for enriching containers with development-specific metadata so the same image can power a developer's IDE, a teammate's IDE, and CI.
- **Target section:** Context
- **Source URL:** https://containers.dev/
- **Pulled quote:** "An open specification for enriching containers with development specific content and settings."

### Claim 2
- **Text:** The spec deliberately does not replace existing container orchestration formats; it adds a layer of dev-time metadata on top, with a single-container option for projects that don't need orchestration.
- **Target section:** Context
- **Source URL:** https://github.com/devcontainers/spec
- **Pulled quote:** "The Development Container Specification seeks to find ways to enrich existing formats with common development specific settings, tools, and configuration while still providing a simplified, un-orchestrated single container option."

### Claim 3
- **Text:** `devcontainer.json` is JSON with Comments (jsonc) and lives at `.devcontainer/devcontainer.json`, `.devcontainer.json`, or `.devcontainer/<folder>/devcontainer.json`.
- **Target section:** Context
- **Source URL:** https://containers.dev/implementors/spec/
- **Pulled quote:** "The metadata can be stored in a `devcontainer.json` file located at `.devcontainer/devcontainer.json`, `.devcontainer.json`, or `.devcontainer/<folder>/devcontainer.json`."

### Claim 4
- **Text:** A dev container is a container that can run the application, isolate the toolchain, and serve as a CI runtime — the same artifact across all three.
- **Target section:** Context
- **Source URL:** https://github.com/devcontainers/spec
- **Pulled quote:** "It can be used to run an application, to separate tools, libraries, or runtimes needed for working with a codebase, and to aid in continuous integration and testing."

### Claim 5
- **Text:** The lifecycle has five distinct command hooks. `onCreateCommand`, `updateContentCommand`, `postCreateCommand` run once when the container is created (in that order); `postStartCommand` runs every start; `postAttachCommand` runs every time a tool attaches.
- **Target section:** Visual
- **Source URL:** https://containers.dev/implementors/json_reference/
- **Pulled quote:** "`onCreateCommand` … This command is the first of three (along with `updateContentCommand` and `postCreateCommand`) that finalizes container setup when a dev container is created." / "`postStartCommand` … A command to run each time the container is successfully started." / "`postAttachCommand` … A command to run each time a tool has successfully attached to the container."

### Claim 6
- **Text:** `containerEnv` and `remoteEnv` differ in scope: `containerEnv` is visible to every process in the container, while `remoteEnv` only modifies the environment of the supporting tool's processes.
- **Target section:** Best Practices
- **Source URL:** https://containers.dev/implementors/json_reference/
- **Pulled quote:** "`containerEnv` … A set of name-value pairs that sets or overrides environment variables for the container. All processes spawned in the container will have access to it." / "`remoteEnv` … A set of name-value pairs that sets or overrides environment variables for the `devcontainer.json` supporting service / tool (or sub-processes) but not the container as a whole."

### Claim 7
- **Text:** The `features` property pulls reusable installation units from container registries (canonical: `ghcr.io/devcontainers/features/`), with semver-style tags such as `:1`, `:1.0`, `:1.0.0`.
- **Target section:** Example
- **Source URL:** https://github.com/devcontainers/features
- **Pulled quote:** "'Features' are self-contained units of installation code and development container configuration." / "Features are designed to install atop a wide-range of base container images."

### Claim 8
- **Text:** `forwardPorts` keeps service ports reachable on the host without requiring `docker run -p` flags, because the supporting tool watches the list and re-establishes forwards as the container restarts.
- **Target section:** Example
- **Source URL:** https://containers.dev/implementors/json_reference/
- **Pulled quote:** "`forwardPorts` … An array of port numbers or host:port values that should always be forwarded from inside the primary container to the local machine."

### Claim 9
- **Text:** The `@devcontainers/cli` is the open-source reference implementation of the spec; `devcontainer up`, `devcontainer build`, `devcontainer exec`, and `devcontainer run-user-commands` are its core verbs.
- **Target section:** Best Practices
- **Source URL:** https://github.com/devcontainers/cli
- **Pulled quote:** "A reference implementation for the specification that can create and configure a dev container from a devcontainer.json." / "`devcontainer up` … Spins up containers with `devcontainer.json` settings applied" / "`devcontainer run-user-commands` … Runs lifecycle commands like `postCreateCommand`."

### Claim 10
- **Text:** VS Code's Dev Containers extension uses `devcontainer.json` as the contract for "how to access (or create)" the dev container, and recommends pre-building the image with the CLI or the GitHub Action.
- **Target section:** Context
- **Source URL:** https://code.visualstudio.com/docs/devcontainers/containers
- **Pulled quote:** "A `devcontainer.json` file in your project tells VS Code how to access (or create) a development container." / "We recommend using the Dev Container CLI (or other specification supporting utilities like the GitHub Action) to pre-build your images."

### Claim 11
- **Text:** JetBrains IDEs (e.g., IntelliJ IDEA) read the same `devcontainer.json` format and treat the dev container as the editing/build/run environment, so a single config powers VS Code and IntelliJ users on the same project.
- **Target section:** Context
- **Source URL:** https://www.jetbrains.com/help/idea/connect-to-devcontainer.html
- **Pulled quote:** "A Development Container (Dev Container) is a Docker container configured to be used as a fully functional development environment." / "IntelliJ IDEA lets you use such containers to edit, build, and run your projects."

### Claim 12
- **Text:** DevPod is an open-source client that adopts the spec to create dev containers on local Docker, remote SSH, or cloud backends, giving the same `devcontainer.json` portable cloud execution.
- **Target section:** Context
- **Source URL:** https://devpod.sh/docs/what-is-devpod
- **Pulled quote:** "DevPod reuses the open DevContainer standard to create a consistent developer experience no matter what backend you want to use." / "Each developer environment runs in a separate container and is specified through a devcontainer.json"

### Claim 13
- **Text:** GitHub Codespaces is essentially a dev container hosted on a VM; the same `devcontainer.json` defines both local and remote environments.
- **Target section:** CI Integration
- **Source URL:** https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers
- **Pulled quote:** "When you work in a codespace, the environment you are working in is created using a development container, or dev container, hosted on a virtual machine." / "The primary file in a dev container configuration is the `devcontainer.json` file."

### Claim 14
- **Text:** The `devcontainers/ci` GitHub Action runs your repo's dev container in CI, building the same image and executing arbitrary commands in it via `runCmd`.
- **Target section:** CI Integration
- **Source URL:** https://github.com/devcontainers/ci
- **Pulled quote:** "The Dev Container Build and Run GitHub Action is aimed at making it easier to re-use Dev Containers in a GitHub workflow." / "The Action supports using a Dev Container to run commands for CI, testing, and more, along with pre-building a Dev Container image."

### Claim 15
- **Text:** The Action's `imageName` + `cacheFrom` + `push` triplet enables a prebuild-once, reuse-everywhere pattern: a separate workflow builds and pushes the dev container image, then PR workflows reference `cacheFrom` to skip the build.
- **Target section:** CI Integration
- **Source URL:** https://github.com/devcontainers/ci
- **Pulled quote:** "Dev Container image building supports Dev Container Features and automatically places Dev Container metadata on an image label for simplified use." / "If you have a separate workflow like the one above to pre-build your container image, you can reference it here to speed up your application build workflows as well!"

### Claim 16
- **Text:** Codespaces Prebuilds applies the same caching idea at the platform level: GitHub runs a temporary codespace through `onCreateCommand` and `updateContentCommand`, then snapshots the result.
- **Target section:** CI Integration
- **Source URL:** https://docs.github.com/en/codespaces/prebuilding-your-codespaces/about-github-codespaces-prebuilds
- **Pulled quote:** "When a prebuild configuration workflow runs, GitHub creates a temporary codespace, performing setup operations up to and including any `onCreateCommand` and `updateContentCommand` commands in the `devcontainer.json` file." / "Since many operations have already been performed, such as cloning the repository, creating a codespace from a prebuild can be substantially quicker than creating one without a prebuild."

## Reference URLs

- https://containers.dev/
- https://containers.dev/implementors/spec/
- https://containers.dev/implementors/json_reference/
- https://github.com/devcontainers/spec
- https://github.com/devcontainers/cli
- https://github.com/devcontainers/features
- https://github.com/devcontainers/ci
- https://code.visualstudio.com/docs/devcontainers/containers
- https://www.jetbrains.com/help/idea/connect-to-devcontainer.html
- https://devpod.sh/docs/what-is-devpod
- https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers
- https://docs.github.com/en/codespaces/prebuilding-your-codespaces/about-github-codespaces-prebuilds

## Research notes

- The split between `onCreateCommand`, `updateContentCommand`, and `postCreateCommand` is the load-bearing distinction for prebuilds: Codespaces Prebuilds explicitly stops at `updateContentCommand`, so anything that depends on per-codespace credentials must move to `postCreateCommand` or later.
- Visual: lifecycle phase diagram (init → image build → container create → onCreate → updateContent → postCreate → start → postStart → attach → postAttach).
- Example: a concrete `devcontainer.json` showing `image` (or `build`), one `feature`, `forwardPorts`, `containerEnv`, and a two-step `postCreateCommand` (e.g., `npm ci`) — paired with a small `devcontainers/ci` workflow building + pushing that same image.
- Best Practices: pin Feature versions to a major (`:1`); keep `postCreateCommand` idempotent; use `cacheFrom` not local Docker layer cache; never put secrets in `containerEnv` — route through `remoteEnv` plus the host secret store.
- CI Integration: the prebuild-once-reuse-everywhere pattern; three-workflow shape: scheduled main-branch image build with `push: always`, PR workflow with `cacheFrom`, optional Codespaces Prebuilds for human devs.
- Adjacency: FEE-1609 Local Development Environment Setup covers Docker Compose for backing services. FEE-1612 should focus on `devcontainer.json` itself; cross-link to 1609 for service composition.

## Rejected sources

- Wikipedia, anonymous Medium / Dev.to walkthroughs — disallowed by source-tier rule.
- Microsoft Learn marketing pages — preferred maintainer-run code.visualstudio.com docs and containers.dev spec.
- Stack Overflow answers — secondary; json_reference page covers the same first-party.
- microsoft/vscode-dev-containers archived repo — superseded by current devcontainers/spec.
