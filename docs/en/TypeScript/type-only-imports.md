---
id: 1712
title: "Type-Only Imports & `verbatimModuleSyntax`"
state: draft
slug: type-only-imports
category: TypeScript
level: mid
---

# [FEE-1712] Type-Only Imports & `verbatimModuleSyntax`

:::info
TypeScript 3.8 shipped `import type` and `export type` as dedicated syntax for imports and exports that are stripped at emit time. TypeScript 4.5 added inline `type` modifiers on named specifiers so value and type bindings can share a single import statement. TypeScript 5.0 then shipped `verbatimModuleSyntax`, a single option that replaces the older `importsNotUsedAsValues` and `preserveValueImports` flags and makes emit follow a simple rule: whatever lacks a `type` marker is kept, whatever has one is dropped.
:::

## Context

TypeScript 3.8 introduced dedicated syntax for type-only module bindings. The 3.8 release notes describe `import type` as a form that "only imports declarations to be used for type annotations and declarations" and note that it "always gets fully erased, so there's no remnant of it at runtime." `export type` is symmetric: the same release notes describe it as an export that "can be used for type contexts, and is also erased from TypeScript's output."

TypeScript 4.5 loosened the statement-level restriction. The 4.5 announcement states that "TypeScript 4.5 allows a `type` modifier on individual named imports, so that you can mix and match as needed," so a single `import` line can carry both value specifiers and type specifiers.

TypeScript 5.0 consolidated the configuration surface. The 5.0 announcement frames the new option plainly: "With this new option, what you see is what you get. The rules are much simpler — any imports or exports without a `type` modifier are left around. Anything that uses the `type` modifier is dropped entirely." The same post notes that "because `--verbatimModuleSyntax` provides a more consistent story than `--importsNotUsedAsValues` and `--preserveValueImports`, those two existing flags are being deprecated in its favor."

## Visual

The table below compares how the same source behaves across three emit modes.

| Source syntax | Default TS emit (import elision) | Legacy `importsNotUsedAsValues: "preserve"` | `verbatimModuleSyntax: true` |
| --- | --- | --- | --- |
| `import { Car } from "./car"` used only as a type | Import dropped entirely, including module side effects (Claim 7) | Import preserved as written | Error unless the specifier is marked `type`; no silent elision |
| `import type { A } from "a"` | Erased from output (Claim 16) | Erased | Erased (Claim 11) |
| `import { b, type c, type d } from "bcd"` | `b` kept; `c`, `d` erased when TS detects them as types | Full import preserved including `c`, `d` as runtime bindings | Rewritten to `import { b } from "bcd"` (Claim 11) |
| Bare `import "./car"` (side effect only) | Preserved (no bindings to elide) | Preserved | Preserved |

The final column follows one rule: specifiers without a `type` marker survive; specifiers with a `type` marker do not (Claim 8).

## Example

Start with a module that mixes value and type exports, and a consumer that needs both.

```ts
// some-module.ts
export interface BaseType {
  id: string;
}

export function someFunc(x: BaseType): void {
  console.log(x.id);
}
```

```ts
// consumer.ts
import { someFunc, type BaseType } from "./some-module.js";

const record: BaseType = { id: "abc" };
someFunc(record);
```

The 4.5 announcement states that in this form "`BaseType` is always guaranteed to be erased and `someFunc` will be preserved." Under `verbatimModuleSyntax`, the TSConfig reference spells out the same rewrite: `import { b, type c, type d } from "bcd";` is "rewritten to `import { b } from \"bcd\";`." So the emitted JavaScript is:

```js
// consumer.js
import { someFunc } from "./some-module.js";

const record = { id: "abc" };
someFunc(record);
```

Now consider a module whose top level runs code for its side effects.

```ts
// car.ts
console.log("car module loaded");

export class Car {
  drive(): void {}
}
```

```ts
// garage.ts
import { Car } from "./car";

export function describe(c: Car): string {
  return c.constructor.name;
}
```

`Car` appears only in a type position inside `describe`. Under default TypeScript emit, the 5.0 release notes observe that "the import was dropped entirely. That actually makes a difference for modules that have side-effects." The `"car module loaded"` log silently disappears because the entire `import { Car } from "./car"` line is elided. Explicitly writing `import { type Car } from "./car"` signals intent; adding a bare `import "./car";` keeps the side effect; and `verbatimModuleSyntax` forces the author to mark the specifier as `type`, which still erases the import but makes the decision visible in the source.

## Best Practices

- **MUST** mark every type-only specifier with `type` when `isolatedModules` or `verbatimModuleSyntax` is enabled. The TSConfig reference notes that `isolatedModules` "tells TypeScript to warn you if you write certain code that can't be correctly interpreted by a single-file transpilation process," which covers Babel, swc, and esbuild (Claim 12).
- **MUST** use `export type` when re-exporting a type. The TSConfig reference warns that "TypeScript allows you to import a type and then re-export it. However, TypeScript can't tell if `SomeType` is a type or a value, so it's possible that the re-export won't be preserved when the code is transpiled by another tool" (Claim 13).
- **SHOULD** enable `verbatimModuleSyntax` on new projects. The 5.0 announcement positions it as the replacement for both `importsNotUsedAsValues` and `preserveValueImports` (Claim 9), and it reduces emit to a single readable rule (Claim 8).
- **SHOULD** add an explicit bare `import "./side-effect-module";` whenever a consumer relies on a module's top-level effects. Claim 7 shows that a side-effectful module can have its import elided if every named binding is used only as a type.
- **MAY** keep using statement-level `import type { ... }` for files whose imports are uniformly types. Inline `type` specifiers exist to handle mixed cases, not to retire the statement form (Claim 3).

## Design Thinking

Import elision is the default because TypeScript's original emit goal was to produce idiomatic JavaScript: imports that survive only as type references should not appear in the output. The 5.0 release notes put the mechanic in plain terms: "By default, TypeScript does something called import elision. Basically, if you write something like … TypeScript detects that you're only using an import for types and drops the import entirely."

Elision is subtle because the compiler consults more than the local usage site. The 5.0 announcement notes that "TypeScript's emit strategy for JavaScript also has another few layers of complexity — import elision isn't always just driven by how an import is used — it often consults how a value is declared as well." Whether an import survives depends on the kind of declaration upstream (interface, type alias, class, function, `const`), so two imports that look identical at the call site can emit differently based on facts the reader cannot see.

`verbatimModuleSyntax` trades that cleverness for locality. The 5.0 announcement summarises the bargain as "what you see is what you get": the author, not the compiler, decides which specifiers are runtime values and which are types. Reviewers stop cross-checking declarations across files to predict emit, and external transpilers that cannot perform that cross-file analysis (Claim 12) produce the same output as `tsc`.

## Deep Dive

Side-effect elision is the headline edge case. Claim 7 records that a `Car` imported only for its type from a module whose top level runs code will see the entire import dropped, taking the side effects with it. The two safe fixes are marking the specifier `type` (making the intent to erase explicit) and adding a bare `import "./car";` when the side effect is wanted.

Under `verbatimModuleSyntax`, ECMAScript module syntax is never silently rewritten into CommonJS. The 5.0 announcement states that "under this flag, ECMAScript imports and exports won't be rewritten to require calls when your settings or file extension implied a different module system. Instead, you'll get an error." A file that should emit CommonJS under this flag must use the legacy `import foo = require(...)` and `export =` forms rather than ES `import`/`export` statements.

Statement-form `import type` has a small syntactic restriction. The modules reference in the handbook states that "a type-only import declaration may not declare both a default import and named bindings, since it appears ambiguous whether `type` applies to the default import or to the entire import declaration." A developer who needs both must split into two statements or use inline `type` markers on named specifiers.

Values can be imported via `import type`, but only in non-emitting positions. The handbook notes that "even values can be imported with `import type`, but since they won't exist in the output JavaScript, they can only be used in non-emitting positions," which covers `typeof`, generic arguments, and type references. Calling such a binding as a value is a compile error because the output JavaScript does not contain it.

## Related Topics

- [Node.js ESM, `.mts`/`.cts` & `nodenext` Module Resolution](/en/TypeScript/node-esm-and-nodenext)
- [tsconfig & Strict Mode](/en/TypeScript/1706)
- [Declaration Files & DefinitelyTyped](/en/TypeScript/1705)

## References

- Microsoft, "TypeScript 3.8 Release Notes," TypeScript Handbook (2020). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- Daniel Rosenwasser, "Announcing TypeScript 4.5," TypeScript Blog (2021). https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- Daniel Rosenwasser, "Announcing TypeScript 5.0," TypeScript Blog (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- Microsoft, "TypeScript 5.0 Release Notes," TypeScript Handbook (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- Microsoft, "TSConfig Reference: `verbatimModuleSyntax`," TypeScript Documentation (2023). https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html
- Microsoft, "TSConfig Reference," TypeScript Documentation (2023). https://www.typescriptlang.org/tsconfig/
- Microsoft, "Modules Reference," TypeScript Handbook (2023). https://www.typescriptlang.org/docs/handbook/modules/reference.html
