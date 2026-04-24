---
topic: Type-Only Imports & `verbatimModuleSyntax`
id: 1712
slug: type-only-imports
sources_reviewed: 7
claims: 16
---

# Findings: Type-Only Imports & `verbatimModuleSyntax`

**Generated:** 2026-04-24
**Target article:** FEE-1712 — type-only-imports
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** TypeScript 3.8 introduced `import type` and `export type` as dedicated syntax for imports and exports that are fully stripped at emit time, with no runtime remnant.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "TypeScript 3.8 adds a new syntax for type-only imports and exports. `import type` only imports declarations to be used for type annotations and declarations. It _always_ gets fully erased, so there's no remnant of it at runtime."

### Claim 2

- **Text:** `export type` is symmetric to `import type` — it produces an export usable only in type positions and is erased from the emitted JavaScript.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "Similarly, `export type` only provides an export that can be used for type contexts, and is also erased from TypeScript's output."

### Claim 3

- **Text:** TypeScript 4.5 added inline `type` modifiers on individual named imports, so value and type specifiers can coexist inside a single import statement.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- **Pulled quote:** "TypeScript 4.5 allows a `type` modifier on individual named imports, so that you can mix and match as needed."

### Claim 4

- **Text:** With the inline modifier, `import { someFunc, type BaseType } from "./some-module.js";` preserves `someFunc` in the emitted JS while erasing `BaseType`.
- **Target section:** Example
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- **Pulled quote:** "In the above example, `BaseType` is always guaranteed to be erased and `someFunc` will be preserved under `--preserveValueImports`"

### Claim 5

- **Text:** By default, TypeScript performs import elision — it silently drops imports it believes are used only in type positions.
- **Target section:** Design Thinking
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "By default, TypeScript does something called _import elision_. Basically, if you write something like ... TypeScript detects that you're only using an import for types and drops the import entirely."

### Claim 6

- **Text:** Import elision is driven by both how an import is used and how the imported value is declared upstream, which layers hidden complexity onto TypeScript's emit.
- **Target section:** Design Thinking
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "TypeScript's emit strategy for JavaScript also has another few layers of complexity – import elision isn't always just driven by how an import is used – it often consults how a value is declared as well."

### Claim 7

- **Text:** Elision is observable when a module has side effects: a bare `import "./car"` statement would be preserved, but `import { Car } from "./car"` used only as a type is dropped entirely, silently skipping any side effects.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "But it does add a layer of complexity for certain edge cases. For example, notice there's no statement like `import \"./car\";` - the import was dropped entirely. That actually makes a difference for modules that have side-effects or not."

### Claim 8

- **Text:** TypeScript 5.0 introduced `verbatimModuleSyntax` with a single rule that replaces the older, harder-to-reason-about flags.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "With this new option, what you see is what you get. ... The rules are much simpler – any imports or exports without a `type` modifier are left around. Anything that uses the `type` modifier is dropped entirely."

### Claim 9

- **Text:** `verbatimModuleSyntax` supersedes and deprecates both `importsNotUsedAsValues` and `preserveValueImports`.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "Because `--verbatimModuleSyntax` provides a more consistent story than `--importsNotUsedAsValues` and `--preserveValueImports`, those two existing flags are being deprecated in its favor."

### Claim 10

- **Text:** Under `verbatimModuleSyntax`, ECMAScript `import`/`export` syntax is never silently rewritten into CommonJS `require`/`module.exports` — the compiler errors instead, and CommonJS output requires the legacy `import foo = require(...)` / `export =` syntax.
- **Target section:** Deep Dive
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "Under this flag, ECMAScript `import`s and `export`s won't be rewritten to `require` calls when your settings or file extension implied a different module system. Instead, you'll get an error."

### Claim 11

- **Text:** With the flag on, every specifier behaves predictably: `import type { A } from "a"` is fully erased, and `import { b, type c, type d } from "bcd"` is rewritten to `import { b } from "bcd"`.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html
- **Pulled quote:** "// Erased away entirely. import type { A } from \"a\"; // Rewritten to 'import { b } from \"bcd\";' import { b, type c, type d } from \"bcd\";"

### Claim 12

- **Text:** `isolatedModules` exists because single-file transpilers (Babel, swc, esbuild) cannot perform the cross-file type analysis that TypeScript uses to decide what to erase.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/tsconfig/
- **Pulled quote:** "The `isolatedModules` flag tells TypeScript to warn you if you write certain code that can't be correctly interpreted by a single-file transpilation process."

### Claim 13

- **Text:** A classic `isolatedModules` failure is re-exporting a type without the `type` modifier — external transpilers cannot tell it's a type and may emit a broken value export.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/tsconfig/
- **Pulled quote:** "TypeScript allows you to import a type and then re-export it. However, TypeScript can't tell if `SomeType` is a type or a value, so it's possible that the re-export won't be preserved when the code is transpiled by another tool."

### Claim 14

- **Text:** `import type` declarations have a syntactic restriction: you cannot combine a default import and named bindings, because the `type` keyword's scope would be ambiguous.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **Pulled quote:** "A type-only import declaration may not declare both a default import and named bindings, since it appears ambiguous whether `type` applies to the default import or to the entire import declaration."

### Claim 15

- **Text:** Values imported via `import type` can still be referenced in non-emitting positions (e.g. `typeof`), but calling them as values is a compile error because they do not exist in the emitted JS.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **Pulled quote:** "Even values can be imported with `import type`, but since they won't exist in the output JavaScript, they can only be used in non-emitting positions"

### Claim 16

- **Text:** Explicit `type` markers make imports unambiguous for every downstream tool: `import { f, type SomeInterface } from "./module.js"` emits exactly `import { f } from "./module.js"` in JS, with `SomeInterface` fully stripped.
- **Target section:** Visual
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **Pulled quote:** "Import declarations written with `import type`, export declarations written with `export type { ... }`, and import or export specifiers prefixed with the `type` keyword are all guaranteed to be elided from the output JavaScript."

## Reference URLs

- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html
- https://www.typescriptlang.org/tsconfig/
- https://www.typescriptlang.org/docs/handbook/modules/reference.html

## Rejected sources

- Aggregate tsconfig page (`/tsconfig`) is kept only for the specific anchors needed; per-option pages preferred where they exist.

## Research notes

- Two TS official surfaces (TSConfig reference and 5.0 release notes) phrase the `verbatimModuleSyntax` rule identically — release-notes URL is the canonical announcement.
- The "CJS-consuming runtime importing a type-only module fails because TS stripped the import but the module had a side effect" bug is supported by Claim 7 (the `import "./car"` side-effect example in the 5.0 release notes). Fix: use `verbatimModuleSyntax` or add an explicit bare `import "./side-effect-module"`.
- Claim 6 explains why elision is subtle — it consults declaration of the imported symbol upstream. Strongest Design Thinking anchor.
- Claims 12 and 13 cover the `isolatedModules` interaction. `verbatimModuleSyntax` is strictly stronger: `isolatedModules` only warns; `verbatimModuleSyntax` changes emit.
- No authoritative third-party postmortem was found within the tier-1/2 bar for the side-effect scenario; build a minimal reproducible case from the `./car` example rather than citing a third-party postmortem.
