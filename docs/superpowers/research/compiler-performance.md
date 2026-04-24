---
topic: TypeScript Compiler Performance
id: 1716
slug: compiler-performance
sources_reviewed: 7
claims: 16
---

# Findings: TypeScript Compiler Performance

**Generated:** 2026-04-24
**Target article:** FEE-1716 — compiler-performance
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** Enabling `skipLibCheck` tells the compiler to skip type-checking every `.d.ts` file, trading some declaration-file safety for substantial compile-time savings.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/tsconfig/
- **Pulled quote:** "Skip type checking of all declaration files (*.d.ts files). … This can save time during compilation at the expense of type safety."

### Claim 2

- **Text:** The TypeScript Performance wiki explicitly recommends `skipLibCheck` as a build-speed lever and warns it can mask misconfiguration between conflicting `.d.ts` files.
- **Target section:** Best Practices
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "you can also enable the `skipLibCheck` flag to skip checking *all* `.d.ts` files in a compilation. … these options can often hide misconfiguration and conflicts in `.d.ts` files, so we suggest using them *only* for faster builds."

### Claim 3

- **Text:** The `--incremental` flag persists a `.tsbuildinfo` file so subsequent runs only re-check the smallest set of changed files.
- **Target section:** Best Practices
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "The `--incremental` flag allows TypeScript to save state from the last compilation to a `.tsbuildinfo` file. This file is used to figure out the smallest set of files that might to be re-checked/re-emitted since it last ran."

### Claim 4

- **Text:** The `incremental` compiler option writes `.tsbuildinfo` sidecar files and defaults on whenever `composite` is enabled.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/compiler-options.html
- **Pulled quote:** "Save .tsbuildinfo files to allow for incremental compilation of projects. … Default: `true` if `composite`; `false` otherwise."

### Claim 5

- **Text:** Project references break a codebase into smaller sub-projects so type-checking, emission, and editor memory all benefit from per-project boundaries.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/project-references.html
- **Pulled quote:** "By separating into multiple projects, you can greatly improve the speed of typechecking and compiling, reduce memory usage when using an editor, and improve enforcement of the logical groupings of your program."

### Claim 6

- **Text:** Referenced projects must set `composite: true`, which also requires `declaration: true` and an explicit include list.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/project-references.html
- **Pulled quote:** "Referenced projects must have the new `composite` setting enabled. This setting is needed to ensure TypeScript can quickly determine where to find the outputs of the referenced project. … `declaration` must be turned on."

### Claim 7

- **Text:** `tsc --build` (or `tsc -b`) is a build orchestrator that walks the project-reference graph, skipping up-to-date projects and only rebuilding what changed.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/project-references.html
- **Pulled quote:** "Running `tsc --build` … will do the following: Find all referenced projects, detect if they are up-to-date, build out-of-date projects in the correct order"

### Claim 8

- **Text:** Running `tsc --extendedDiagnostics` prints a breakdown of where the compiler spent its time (parse, bind, check, emit).
- **Target section:** Best Practices
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "You can run TypeScript with `--extendedDiagnostics` to get a printout of where the compiler is spending its time."

### Claim 9

- **Text:** `tsc --generateTrace <dir>` writes a `trace.json` plus `types.json` that can be loaded into Edge/Chrome's `about://tracing` or the DevTools Performance tab.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance-Tracing
- **Pulled quote:** "You should now have a directory structure like this: trace +- trace.json +- types.json … Navigate to `about://tracing` and click `Load`."

### Claim 10

- **Text:** `@typescript/analyze-trace` distills a raw trace into a ranked list of compilation hot-spots.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "To quickly list performance hot-spots, you can install and run @typescript/analyze-trace from npm."

### Claim 11

- **Text:** Prefer `interface`/`extends` over intersection types because interfaces produce a single flat object type and cache their type-relationship results.
- **Target section:** Best Practices
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "Interfaces create a single flat object type that detects property conflicts, which are usually important to resolve! Type relationships between interfaces are also cached, as opposed to intersection types as a whole."

### Claim 12

- **Text:** Extracting intermediate types with a named `type` alias lets TypeScript cache the result, avoiding re-running the same conditional logic on every reference.
- **Target section:** Best Practices
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "If the return type in this example was extracted out to a type alias, more information can be cached by the compiler"

### Claim 13

- **Text:** Large unions cost real compile time because each argument is compared against every constituent, and de-duplication inside a union is quadratic in its size.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "to eliminate redundant members from a union, the elements have to be compared pairwise, which is quadratic."

### Claim 14

- **Text:** By default TypeScript loads every `@types` package visible in any enclosing `node_modules/@types`; `"types": []` or a narrow list stops pulling in ambient globals the project does not need.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/tsconfig/
- **Pulled quote:** "By default all *visible* '@types' packages are included in your compilation. Packages in `node_modules/@types` of any enclosing folder are considered *visible*."

### Claim 15

- **Text:** Editor responsiveness is bound by `tsserver` performance, which is itself bound by how much type-checking the compiler must perform for the file you are editing.
- **Target section:** Context
- **Source URL:** https://github.com/microsoft/TypeScript/wiki/Performance
- **Pulled quote:** "In-editor diagnostics are typically fetched a few seconds after typing stops. `ts-server`'s performance characteristics will always be related to the performance of type-checking."

### Claim 16

- **Text:** In March 2025 Microsoft announced a Go rewrite of the TypeScript compiler targeting roughly 10x faster builds; VS Code's self-compile dropped from 77.8s to 7.5s. It will ship as TypeScript 7.0.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/typescript-native-port/
- **Pulled quote:** "The native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage."

## Reference URLs

- https://github.com/microsoft/TypeScript/wiki/Performance
- https://github.com/microsoft/TypeScript/wiki/Performance-Tracing
- https://www.typescriptlang.org/tsconfig/
- https://www.typescriptlang.org/docs/handbook/compiler-options.html
- https://www.typescriptlang.org/docs/handbook/project-references.html
- https://devblogs.microsoft.com/typescript/typescript-native-port/

## Rejected sources

- Wikipedia, Medium, non-vendor agency blogs — rejected per source tier rule.
- Vendor tool READMEs (npm packages) — redundant with wiki pages; kept as indirect references.

## Research notes

- TS Performance wiki is the richest source; cite once in References.
- Type-instantiation-depth limits are real but not in a dedicated wiki section; treat as symptom of "prefer interfaces over intersections" guidance rather than inventing depth-limit quote.
- Native port ships as TypeScript 7.0; current JS codebase continues as 6.x. Frame as Context, not Best Practice (user cannot adopt it yet in April 2026 outside previews).
- `tsserver` cache-sharing with `tsc --build` is implicit but not a verbatim quote — frame as "both run the same project graph".
