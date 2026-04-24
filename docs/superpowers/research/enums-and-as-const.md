---
topic: Enums and the `as const` Alternative
id: 1713
slug: enums-and-as-const
sources_reviewed: 8
claims: 15
---

# Findings: Enums and the `as const` Alternative

**Generated:** 2026-04-24
**Target article:** FEE-1713 — enums-and-as-const
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** TypeScript supports numeric enums (the default, with auto-incrementing members), string enums, and heterogeneous enums that mix both, though mixing is discouraged.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/enums.html
- **Pulled quote:** "String enums allow you to give a meaningful and readable value when your code runs, independent of the name of the enum member itself."

### Claim 2

- **Text:** Regular numeric and string enums emit a runtime object, whereas `const enum` members are completely removed during compilation and inlined at each use site.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/enums.html
- **Pulled quote:** "Const enums can only use constant enum expressions and unlike regular enums they are completely removed during compilation. Const enum members are inlined at use sites."

### Claim 3

- **Text:** Numeric enums emit a reverse mapping from numeric values back to member names, but string enum members do not get a reverse mapping generated at all.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/enums.html
- **Pulled quote:** "Keep in mind that string enum members _do not_ get a reverse mapping generated at all."

### Claim 4

- **Text:** Under `isolatedModules`, referencing an ambient `const enum` member is an error because single-file transpilers cannot read other modules to inline the value.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/tsconfig/isolatedModules.html
- **Pulled quote:** "Without knowledge of the values of const enum members, other transpilers can't replace the references to Numbers, which would be a runtime error if left alone. Because of this, when isolatedModules is set, it is an error to reference an ambient const enum member."

### Claim 5

- **Text:** `isolatedModules` exists because non-TypeScript transpilers like Babel operate on one file at a time and cannot perform cross-file type-aware transforms.
- **Target section:** Design Thinking
- **Source URL:** https://www.typescriptlang.org/tsconfig/isolatedModules.html
- **Pulled quote:** "While TypeScript can transpile TypeScript to JavaScript, other transpilers... only operate on a single file at a time, which means they can't apply code transforms that depend on understanding the full type system."

### Claim 6

- **Text:** Exporting `const enum` from a library breaks consumers that use isolated-module compilation, because their transpiler cannot read the declaring module to resolve the inlined value.
- **Target section:** Best Practices
- **Source URL:** https://ncjamieson.com/dont-export-const-enums/
- **Pulled quote:** "if the `const enum` declaration is in a different module — and is imported into the module that contains the variable declaration — TypeScript will have to read both modules to determine" the value.

### Claim 7

- **Text:** `const enum` introduces a version-skew footgun: a consumer can inline values from version A of a dependency at build time while loading version B at runtime, silently taking wrong branches in `if` statements.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/enums.html
- **Pulled quote:** "You can easily inline values from version A of a dependency at compile time, and import version B at runtime. Version A and B's enums can have different values, if you are not very careful, resulting in surprising bugs, like taking the wrong branches of `if` statements."

### Claim 8

- **Text:** The TypeScript handbook itself recommends `as const` on a plain object as an alternative to enums, with the member type derived via `typeof Obj[keyof typeof Obj]`.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/enums.html
- **Pulled quote:** "In modern TypeScript, you may not need an enum when an object with `as const` could suffice"

### Claim 9

- **Text:** A `const` assertion tells TypeScript that literal types should not be widened, object literals gain `readonly` properties, and array literals become `readonly` tuples.
- **Target section:** Example
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-3-4/
- **Pulled quote:** "no literal types in that expression should be widened (e.g. no going from `\"hello\"` to `string`)"

### Claim 10

- **Text:** Plain literal-union types such as `"left" | "right" | "center"` provide type-safe fixed sets with zero runtime cost and no runtime object at all.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- **Pulled quote:** "But by _combining_ literals into unions, you can express a much more useful concept - for example, functions that only accept a certain set of known values"

### Claim 11

- **Text:** TypeScript 5.0 changed enum semantics so every member — including computed ones — has a unique literal type, meaning all enums are now union enums and can be narrowed or referenced as types.
- **Target section:** Deep Dive
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "TypeScript 5.0 manages to make all enums into union enums by creating a unique type for each computed member. That means that all enums can now be narrowed and have their members referenced as types as well."

### Claim 12

- **Text:** Before TS 5.0, when an enum had a computed member TypeScript silently reverted to the older non-union strategy, losing literal-type and narrowing benefits for the whole enum.
- **Target section:** Deep Dive
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "Whenever TypeScript ran into these issues, it would quietly back out and use the old enum strategy. That meant giving up all the advantages of unions and literal types."

### Claim 13

- **Text:** The TypeScript compiler permits comparing an enum value against a non-enum primitive of the same underlying type, which is why `@typescript-eslint/no-unsafe-enum-comparison` exists.
- **Target section:** Best Practices
- **Source URL:** https://typescript-eslint.io/rules/no-unsafe-enum-comparison/
- **Pulled quote:** "it is allowed to compare enum values against non-enum values"

### Claim 14

- **Text:** The TypeScript handbook demonstrates extracting the key union of an enum at type level with `keyof typeof`, the same idiom that `as const` objects use.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/enums.html
- **Pulled quote:** "`type LogLevelStrings = keyof typeof LogLevel;` // Equivalent to: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'"

### Claim 15

- **Text:** The TypeScript community has debated const enum's tooling compatibility; a (declined) deprecation proposal (issue #41641) summarises the tooling costs of const enum.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/microsoft/TypeScript/issues/41641
- **Pulled quote:** "const enum is uniquely problematic for tooling... it doesn't work with isolatedModules"

## Reference URLs

- https://www.typescriptlang.org/docs/handbook/enums.html
- https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- https://www.typescriptlang.org/tsconfig/isolatedModules.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-3-4/
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- https://typescript-eslint.io/rules/no-unsafe-enum-comparison/
- https://ncjamieson.com/dont-export-const-enums/
- https://github.com/microsoft/TypeScript/issues/41641

## Rejected sources

- https://github.com/microsoft/TypeScript/issues/40344 — available but thin maintainer commentary
- hackmd.io/@dzearing — personal note, unclear authorship
- runebook.dev — TS docs mirror; use canonical typescriptlang.org
- totaltypescript.com — commercial training; handbook covers same points

## Research notes

- Reverse-mapping quote was confirmed verbatim on the handbook enums page.
- The TS 5.5 "smoother const enum" narrative did not verify. TS 5.5 tightened `isolatedModules` checks, not relaxed them. Frame as: const enum + isolatedModules remains a footgun.
- Nominal-vs-structural framing: handbook does not use "nominal" explicitly. If included, frame as "behaves nominally".
- `as const` bundler/tree-shaking benefit: tier-1 sources don't quantify this. Defensible wording: plain object literals play more nicely with bundler dead-code elimination.
