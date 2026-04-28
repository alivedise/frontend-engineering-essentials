---
topic: Shared VS Code Workspace Settings and extensions.json Recommendations
id: 1617
slug: vscode-workspace
sources_reviewed: 7
claims: 16
---

# Findings: Shared VS Code Workspace Settings and extensions.json Recommendations

**Proposed topic-specific section:** `## .vscode/ File Reference`.

## Claims

### Claim 1
- **Text:** VS Code distinguishes User settings (apply globally) from Workspace settings (apply only when the workspace is opened).
- **Target section:** Context
- **Source URL:** https://code.visualstudio.com/docs/configure/settings
- **Pulled quote:** "Settings that apply globally to any instance of VS Code you open." / "Settings stored inside your workspace and only apply when the workspace is opened."

### Claim 2
- **Text:** Workspace settings live in `.vscode/` at the project root.
- **Target section:** Context
- **Source URL:** https://code.visualstudio.com/docs/configure/settings
- **Pulled quote:** "VS Code stores workspace settings at the root of the project in a `.vscode` folder."

### Claim 3
- **Text:** Settings precedence cascades User → Remote → Workspace → Workspace folder → Language-specific.
- **Target section:** Best Practices
- **Source URL:** https://code.visualstudio.com/docs/configure/settings
- **Pulled quote:** "In the following list, later scopes override earlier scopes" / "Language-specific editor settings always override non-language-specific editor settings, even if the non-language-specific setting has a narrower scope."

### Claim 4
- **Text:** Primitive and array values are overridden by precedence; object values are merged.
- **Target section:** Deep Dive
- **Source URL:** https://code.visualstudio.com/docs/configure/settings
- **Pulled quote:** "Values with primitive types and Array types are overridden, meaning a configured value in a scope that takes precedence over another scope is used instead of the value in the other scope. But, values with Object types are merged."

### Claim 5
- **Text:** Application-wide settings (updates and security) cannot be overridden at workspace scope, by design.
- **Target section:** Best Practices
- **Source URL:** https://code.visualstudio.com/docs/configure/settings
- **Pulled quote:** "Not all user settings are available as workspace settings. For example, application-wide settings related to updates and security can not be overridden by Workspace settings." / "For enhanced security, such settings can only be defined in user settings and not at workspace scope."

### Claim 6
- **Text:** `.vscode/extensions.json` lets a workspace recommend extensions to all developers opening it.
- **Target section:** Context
- **Source URL:** https://code.visualstudio.com/docs/configure/extensions/extension-marketplace
- **Pulled quote:** "A good set of extensions can make working with a particular workspace or programming language more productive and you'd often like to share this list with your team or colleagues." / "the command creates an `extensions.json` file located in the workspace `.vscode` folder where you can add a list of extensions identifiers ({publisherName}.{extensionName})."

### Claim 7
- **Text:** The `recommendations` field is an array of `${publisher}.${extension}` IDs.
- **Target section:** Example
- **Source URL:** https://code.visualstudio.com/docs/configure/extensions/extension-marketplace
- **Pulled quote:** Example: `{ "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"] }`

### Claim 8
- **Text:** VS Code prompts to install workspace recommendations when the workspace is opened for the first time.
- **Target section:** Best Practices
- **Source URL:** https://code.visualstudio.com/docs/configure/extensions/extension-marketplace
- **Pulled quote:** "VS Code prompts a user to install the recommended extensions when a workspace is opened for the first time."

### Claim 9
- **Text:** `unwantedRecommendations` lets a workspace mark VS-Code-suggested extensions as not-recommended-for-this-project; the field is workspace-scoped only.
- **Target section:** .vscode/ File Reference
- **Source URL:** https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/common/extensionsFileTemplate.ts
- **Pulled quote:** "List of extensions recommended by VS Code that should not be recommended for users of this workspace. The identifier of an extension is always '${publisher}.${name}'. For example: 'vscode.csharp'."

### Claim 10
- **Text:** `.vscode/launch.json` stores debugger configurations under `version: "0.2.0"` with required `type`, `request`, and `name` keys.
- **Target section:** Example
- **Source URL:** https://code.visualstudio.com/docs/debugtest/debugging-configuration
- **Pulled quote:** "VS Code stores debugging configuration information in a `launch.json` file located in the `.vscode` folder in your workspace" / "type — the type of debugger… request — the request type… name — the reader-friendly name"

### Claim 11
- **Text:** Compound launch configurations let a single `Run` action start multiple debug sessions.
- **Target section:** Deep Dive
- **Source URL:** https://code.visualstudio.com/docs/debugtest/debugging-configuration
- **Pulled quote:** "An alternative way to start multiple debug sessions is by using a compound launch configuration. You can define compound launch configurations in the `compounds` property in the `launch.json` file."

### Claim 12
- **Text:** `.vscode/tasks.json` defines tasks scoped to a workspace folder.
- **Target section:** Example
- **Source URL:** https://code.visualstudio.com/docs/debugtest/tasks
- **Pulled quote:** "Workspace or folder specific tasks are configured from the `tasks.json` file in the `.vscode` folder for a workspace."

### Claim 13
- **Text:** Tasks support `dependsOn` (parallel by default) and `dependsOrder: "sequence"` for serial composition.
- **Target section:** Deep Dive
- **Source URL:** https://code.visualstudio.com/docs/debugtest/tasks
- **Pulled quote:** "label: The task's label used in the user interface." / "type: The task's type. For a custom task, this can either be `shell` or `process`." / "You can also compose tasks out of simpler tasks with the `dependsOn` property." / "If you list more than one task in the `dependsOn` property, they are executed in parallel by default." / "If you specify `\"dependsOrder\": \"sequence\"`, then your task dependencies are executed in the order they are listed in `dependsOn`."

### Claim 14
- **Text:** `.code-workspace` files describe multi-root workspaces with `folders`, `settings`, and `extensions` keys.
- **Target section:** Visual
- **Source URL:** https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces
- **Pulled quote:** "A Visual Studio Code workspace is the collection of one or more folders that are opened in a VS Code window (instance)." / "Multi-root workspaces are an advanced capability of VS Code that allows you to configure multiple distinct folders to be part of the same workspace." / "The schema of `.code-workspace` is fairly straightforward. You have an array of folders with either absolute or relative paths."

### Claim 15
- **Text:** In multi-root workspaces, global Workspace settings override User; folder settings override Workspace; UI-layout settings are ignored at folder scope.
- **Target section:** Deep Dive
- **Source URL:** https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces
- **Pulled quote:** "Global Workspace settings override User settings and folder settings can override Workspace or User settings." / "only resource (file, folder) settings are applied when using a multi-root workspace. Settings that affect the entire editor (for example, UI layout) are ignored."

### Claim 16
- **Text:** Settings Sync syncs User-scope state only (User settings, snippets, tasks, UI state, extensions, profiles); workspace files (`.vscode/*`, `*.code-workspace`) are committed via VCS, not synced.
- **Target section:** Best Practices
- **Source URL:** https://code.visualstudio.com/docs/configure/settings-sync
- **Pulled quote:** "Settings, Keyboard shortcuts, User snippets, User tasks, UI State, Extensions, Profiles" / "Machine settings (with `machine` or `machine-overridable` scopes) are not synchronized by default, since their values are specific to a given machine."

## Reference URLs

- https://code.visualstudio.com/docs/configure/settings
- https://code.visualstudio.com/docs/configure/extensions/extension-marketplace
- https://code.visualstudio.com/docs/debugtest/debugging-configuration
- https://code.visualstudio.com/docs/debugtest/tasks
- https://code.visualstudio.com/docs/editing/workspaces/workspaces
- https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces
- https://code.visualstudio.com/docs/configure/settings-sync
- https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/common/extensionsFileTemplate.ts

## Research notes

- The public docs page for the marketplace omits any mention of `unwantedRecommendations`; the field's description came directly from the microsoft/vscode repo schema.
- Topic-specific section maps cleanly to five files (`settings.json`, `extensions.json`, `launch.json`, `tasks.json`, `*.code-workspace`); each gets a "what NOT to put here" column grounded in cited claims.
- Visual: precedence ladder (User → Remote → Workspace → Workspace-Folder → Language-specific) with a parallel Settings-Sync arrow that touches only User scope.
- Best Practices: MUST commit `.vscode/settings.json`, `.vscode/extensions.json`, `.vscode/launch.json`, `.vscode/tasks.json`; MUST NOT commit user-scope, security-scope, or machine-scope settings; SHOULD curate `recommendations`; MAY use `*.code-workspace` for multi-repo monorepos.
- Adjacency: FEE-1606 Editor & IDE Integration covers LSP/extension surface broadly; FEE-1617 narrows to the committed `.vscode/` repo contract.

## Rejected sources

- Wikipedia, Medium, Dev.to, Hashnode — banned by source tier.
- Third-party "vscode-unwanted-recommendations" community repos — not authoritative for the schema.
- Marketing pages outside `code.visualstudio.com/docs` — preferred maintainer-run docs.
