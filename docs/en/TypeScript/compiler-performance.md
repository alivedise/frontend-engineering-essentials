---
id: 1716
title: TypeScript Compiler Performance
state: draft
slug: compiler-performance
category: TypeScript
level: senior
---

# [FEE-1716] TypeScript Compiler Performance

:::info
TypeScript compile time and editor responsiveness are shaped by a small set of build-time levers, a handful of diagnostic tools, and a few authoring habits. `skipLibCheck`, `incremental`, and project references cut work on the build side. `--extendedDiagnostics` and `--generateTrace` turn slow builds into measurable workloads. Preferring interfaces over intersections, naming intermediate types, and narrowing the `types` compiler option keeps the type-checker from doing avoidable work in the first place. In March 2025, Microsoft announced a Go rewrite of the compiler targeting a 10x reduction in most build times; it ships as TypeScript 7.0.
:::

## Context

Editor responsiveness in a TypeScript project is bound by `tsserver`, and `tsserver` is itself bound by how much type-checking the compiler must perform for the file being edited. The TypeScript Performance wiki puts it directly: "In-editor diagnostics are typically fetched a few seconds after typing stops. `ts-server`'s performance characteristics will always be related to the performance of type-checking." A slow build is almost always a slow editor.

Projects grow along three axes: more source files, more `.d.ts` surface pulled in through `@types` and dependencies, and more complex types with deep intersections, large unions, and conditional logic. Each axis compounds the others. At the scale of a mature monorepo, a full `tsc` run can take minutes and `tsserver` hover latency starts to be felt under the cursor.

Project references exist to break that growth curve. The handbook states: "By separating into multiple projects, you can greatly improve the speed of typechecking and compiling, reduce memory usage when using an editor, and improve enforcement of the logical groupings of your program." Combined with `incremental` output and `skipLibCheck`, they form the baseline performance posture of a modern TypeScript codebase.

Looking ahead, the compiler is being rewritten in Go. The TypeScript team announced in March 2025 that "the native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage." That port ships as TypeScript 7.0; the current JavaScript codebase continues as the 6.x line, so the guidance below remains load-bearing.

## Visual

| Lever | What it does | When to use | Safety note |
| --- | --- | --- | --- |
| `skipLibCheck` | Skips type-checking every `.d.ts` file. | Default on for application builds where third-party declarations are trusted. | Can hide misconfiguration and conflicts across `.d.ts` files; the Performance wiki suggests using it "only for faster builds." |
| `incremental` | Writes a `.tsbuildinfo` file so subsequent runs re-check only the smallest set of changed files. | Every non-trivial project; on by default when `composite` is enabled. | Sidecar files need a stable location; add to `.gitignore`. |
| Project references + `composite: true` | Splits the codebase into a graph of sub-projects that `tsc -b` builds in dependency order. | Monorepos and any codebase with clear internal boundaries. | Referenced projects require `declaration: true` and an explicit `include` list. |
| `--generateTrace <dir>` | Emits `trace.json` and `types.json` for Chrome `about://tracing` or DevTools Performance. | When a build is mysteriously slow and you need to see where time went. | Output grows with project size; generate into a scratch directory. |
| `types: []` (or a narrow list) | Prevents the compiler from including every visible `@types` package. | Projects that do not need ambient globals from every installed `@types/*`. | Anything the code actually relies on (for example `@types/node`) must be listed explicitly. |

## Example

### A minimal performance-conscious `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    "types": []
  }
}
```

`skipLibCheck` and `incremental` are the two cheapest wins. `types: []` opts out of the default behaviour where "all visible '@types' packages are included in your compilation" and forces each package to be added deliberately.

### A project-reference layout

Root `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" },
    { "path": "./packages/app" }
  ]
}
```

Leaf `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

Build the graph with:

```bash
tsc -b
```

`tsc --build` "will find all referenced projects, detect if they are up-to-date, build out-of-date projects in the correct order." Each leaf writes its own `.tsbuildinfo`, and an unchanged leaf is skipped entirely on the next run.

### Capturing a trace

```bash
tsc --generateTrace trace
```

This produces:

```
trace
├── trace.json
└── types.json
```

Load `trace.json` in Chrome or Edge at `about://tracing` (or drop it on the DevTools Performance tab). Wide bars are expensive phases or expensive files. Pair with `@typescript/analyze-trace` for a ranked list of hot-spots.

## Best Practices

- **MUST** enable `skipLibCheck` for application builds: `tsc` otherwise "type checks of all declaration files (*.d.ts files)," and the official option docs note the tradeoff is "time during compilation at the expense of type safety."
- **MUST** enable `incremental` (or rely on its implicit default under `composite`): the flag "allows TypeScript to save state from the last compilation to a `.tsbuildinfo` file" used "to figure out the smallest set of files that might to be re-checked/re-emitted."
- **SHOULD** split large codebases into project references: the handbook explicitly attributes "speed of typechecking and compiling" plus "reduce memory usage when using an editor" to this layout.
- **SHOULD** run `tsc --extendedDiagnostics` before optimising: the Performance wiki recommends it to "get a printout of where the compiler is spending its time" so changes are targeted instead of speculative.
- **SHOULD** prefer `interface` + `extends` over intersection types for object shapes: "Interfaces create a single flat object type … Type relationships between interfaces are also cached, as opposed to intersection types as a whole."
- **SHOULD** name intermediate types with a `type` alias when a conditional or computed type is referenced more than once: "more information can be cached by the compiler" once the result has a name.
- **MAY** set `"types": []` and list only the ambient packages the project needs: by default "all *visible* '@types' packages are included in your compilation," which can pull in many declarations the project never touches.
- **MAY** treat `skipLibCheck` as temporary for library authors: the Performance wiki cautions that "these options can often hide misconfiguration and conflicts in `.d.ts` files."

## Design Thinking

Two authoring habits do more for compile time than any flag.

**Interfaces over intersections.** An intersection `A & B` is a structural request: the checker must reason about both sides on every use. The wiki observes that "Interfaces create a single flat object type that detects property conflicts," and, more importantly, "Type relationships between interfaces are also cached." At the scale of a shared `Props` type that flows through hundreds of components, the intersection form re-derives the same information on every reference while the interface form hits a cache.

**Name your intermediate types.** A conditional type inlined at every call site is a conditional type the compiler re-evaluates at every call site. Extracting it to a named alias lets the checker remember the answer: "If the return type in this example was extracted out to a type alias, more information can be cached by the compiler." The cost of a named alias is one line of code; the benefit is every downstream use paying lookup cost instead of recomputation cost.

The lesson behind both: give the compiler a stable identity to cache against.

## Deep Dive

### `incremental` and `.tsbuildinfo`

The `incremental` option persists build state as a `.tsbuildinfo` sidecar. The compiler-options reference states its default as "`true` if `composite`; `false` otherwise," so any composite leaf in a project-reference graph is already incremental without an explicit setting. The file records file hashes and dependency edges so a second `tsc` invocation can skip files that do not need to be re-checked.

### `--generateTrace` workflow

`tsc --generateTrace <dir>` emits a Chrome-tracing-compatible `trace.json` plus a companion `types.json`. The Performance-Tracing wiki spells out the loading ritual: "Navigate to `about://tracing` and click `Load`." The view is a flame chart over compilation phases and files. Hot files show up as wide bars; hot types show up as deep stacks inside `checkSourceFile` frames.

### `@typescript/analyze-trace`

A flame chart is useful once you know what to look for. For a first pass, `@typescript/analyze-trace` post-processes the trace into prose. The Performance wiki recommends it: "To quickly list performance hot-spots, you can install and run @typescript/analyze-trace from npm." It surfaces the files, types, and instantiations that dominated wall-clock time.

### Quadratic union de-duplication

A union `A | B | C | ...` is not free. To keep unions normalised, "to eliminate redundant members from a union, the elements have to be compared pairwise, which is quadratic." A union of 500 literal types performs on the order of 250,000 pairwise comparisons. Library APIs that expose huge string-literal unions, or codegen tools that generate deeply branching union trees, routinely show up as the top hot-spot in an analyze-trace report.

### Go native port

The native rewrite announced in March 2025 is framed by the TypeScript team as "drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage." The published VS Code self-compile number dropped from 77.8 seconds to 7.5 seconds. The port ships as TypeScript 7.0. The wiki's authoring advice is about the type system, not the host language, and `skipLibCheck`, `incremental`, and project references remain part of the compiler surface.

## Native Go Port (TypeScript 7.0)

In March 2025 Microsoft announced a port of the TypeScript compiler and language service from TypeScript to Go. The announcement states the target impact: "The native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage." The measured data point Microsoft cited in the same post is VS Code's self-compile dropping from 77.8 seconds to 7.5 seconds.

The port ships as TypeScript 7.0. The existing JavaScript-codebased compiler continues as the TypeScript 6.x line to give ecosystem tools time to migrate, so current projects do not have to adopt the Go-based build chain until they are ready.

What stays constant: the language surface is identical. tsconfig options, `@types` packages, declaration-file emission, and the editor integrations that consume `tsserver` all keep their shape. What changes: startup cost for large projects (previously dominated by JIT warmup on the TypeScript host) falls sharply, memory ceilings loosen, and end-to-end CI build times on large codebases compress into the same order as a `gopls` cycle rather than a `node --max-old-space-size` cycle.

Practical stance for 2026 projects: keep the TypeScript-6.x-based `tsc` in your build chain today. Watch the 7.0 preview release channel. When TypeScript 7.0 ships a stable tag, evaluate it first on non-critical builds (documentation pipelines, lint-only CI jobs) and migrate the hot path only once editor integrations you rely on have confirmed parity. The `--extendedDiagnostics` trace from your current build is directly comparable against a 7.0 trace, which is the cheapest way to confirm the expected speedup on a representative project.

## Related Topics

- [tsconfig & Strict Mode](/en/TypeScript/1706)
- [Type-Only Imports & `verbatimModuleSyntax`](/en/TypeScript/type-only-imports)
- [Conditional Types and `infer`](/en/TypeScript/conditional-types-and-infer)

## References

- TypeScript Team, "Performance," TypeScript Wiki. https://github.com/microsoft/TypeScript/wiki/Performance
- TypeScript Team, "Performance Tracing," TypeScript Wiki. https://github.com/microsoft/TypeScript/wiki/Performance-Tracing
- TypeScript Team, "TSConfig Reference," typescriptlang.org. https://www.typescriptlang.org/tsconfig/
- TypeScript Team, "Compiler Options," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/compiler-options.html
- TypeScript Team, "Project References," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/project-references.html
- Daniel Rosenwasser, "A 10x Faster TypeScript," Microsoft DevBlogs (2025). https://devblogs.microsoft.com/typescript/typescript-native-port/
