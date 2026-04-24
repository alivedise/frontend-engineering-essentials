---
topic: The `satisfies` Operator
id: 1709
slug: satisfies-operator
sources_reviewed: 6
claims: 15
---

# Findings: The `satisfies` Operator

**Generated:** 2026-04-24
**Target article:** FEE-1709 — satisfies-operator
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** `satisfies` addresses a tension between validating that an expression matches a type and preserving the expression's more specific inferred type for later use.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/
- **Pulled quote:** "TypeScript developers are often faced with a dilemma: we want to ensure that some expression _matches_ some type, but also want to keep the _most specific_ type of that expression for inference purposes."

### Claim 2

- **Text:** The `satisfies` operator validates that an expression matches a given type without changing the expression's resulting type.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/
- **Pulled quote:** "The new `satisfies` operator lets us validate that the type of an expression matches some type, without changing the resulting type of that expression."

### Claim 3

- **Text:** `satisfies` shipped in TypeScript 4.9 (November 2022) after a feature request that had been open since 2016.
- **Target section:** Context
- **Source URL:** https://github.com/microsoft/TypeScript/issues/7481
- **Pulled quote:** "Operator to ensure an expression is contextually typed by, and satisfies, some type"

### Claim 4

- **Text:** The original 2016 proposal asked for an operator that permits only implicit conversions (type compatibility), unlike `as`, which permits unsafe downcasting.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/microsoft/TypeScript/issues/7481
- **Pulled quote:** "allow implicit conversions only (type compatibility)"

### Claim 5

- **Text:** Applying a `Record<Colors, string | RGB>` annotation widens each property, so member access like `palette.green.toUpperCase()` fails because TypeScript no longer knows the value is a string.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- **Pulled quote:** "Error: 'palette.green' \"could\" be of type RGB and property 'toUpperCase' does not exist on type 'string | RGB'"

### Claim 6

- **Text:** With `satisfies`, the same object keeps its narrow per-property types, so `palette.green.toUpperCase()` is still valid while typos and value-shape errors are still caught.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- **Pulled quote:** "} satisfies Record<Colors, string | RGB>; // toUpperCase() method is still accessible!"

### Claim 7

- **Text:** `satisfies` catches stray property names against a constraint like `Record<Colors, unknown>`, flagging e.g. `\"platypus\"` as not listed in `Colors`.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- **Pulled quote:** "\"platypus\": false //  ~~~~~~~~~~ error - \"platypus\" was never listed in 'Colors'."

### Claim 8

- **Text:** `as` and `satisfies` have fundamentally different safety profiles: `as` can change the left-hand side's type, while `satisfies` does not change the type and runs a stricter assignability check.
- **Target section:** Best Practices
- **Source URL:** https://2ality.com/2025/02/satisfies-operator.html
- **Pulled quote:** "On one hand, `as` generally changes the type of its left-hand side. On the other hand, it doesn't type-check as thoroughly as `satisfies`."

### Claim 9

- **Text:** `as` can mask missing required properties whereas `satisfies` reports them, shown by `{ x: 2 } as const as Point` type-checking while `{ x: 2 } as const satisfies Point` errors.
- **Target section:** Best Practices
- **Source URL:** https://2ality.com/2025/02/satisfies-operator.html
- **Pulled quote:** "const point5 = { x: 2 } as const as Point; // OK (problematic) / const point6 = { x: 2 } as const satisfies Point; // Error (correct)"

### Claim 10

- **Text:** A type annotation discards narrow literal types, while `satisfies` retains them; `{ x: 2, y: 5 } as const satisfies Point` keeps the type as `{ readonly x: 2, readonly y: 5 }` rather than widening to `Point`.
- **Target section:** Best Practices
- **Source URL:** https://2ality.com/2025/02/satisfies-operator.html
- **Pulled quote:** "the type of `point4` retains `{ readonly x: 2, readonly y: 5 }` rather than widening to `Point`."

### Claim 11

- **Text:** `satisfies` does not itself produce immutability or `as const` behavior; to get both literal narrowing and structural validation the `as const` must come first, as in `as const satisfies T`.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/microsoft/TypeScript/issues/51173
- **Pulled quote:** "'const' assertions can only be applied to references to enum members, or string, number, boolean, array, or object literals."

### Claim 12

- **Text:** TypeScript 5.0 added `@satisfies` as a JSDoc tag so JavaScript files checked with `// @ts-check` can validate object shapes while preserving inferred types.
- **Target section:** Topic-Specific (JSDoc support)
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "That's why TypeScript 5.0 is supporting a new JSDoc tag called `@satisfies` that does exactly the same thing."

### Claim 13

- **Text:** `satisfies` preserves useful array/object structure information even when validated against a broader interface; e.g. a `ConfigSettings` object keeps the knowledge that `extends` was declared as an array.
- **Target section:** Visual
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "TypeScript knows that `myConfigSettings.extends` was declared with an array - because while `satisfies` validated the type of our object, it didn't bluntly change it to `CompilerOptions` and lose information."

### Claim 14

- **Text:** `satisfies` is the right tool when you need type-checking while keeping literal or specific type information, including for optional properties, object literals passed to functions, and default exports that cannot carry an inline annotation.
- **Target section:** Related Topics
- **Source URL:** https://2ality.com/2025/02/satisfies-operator.html
- **Pulled quote:** "`satisfies` becomes essential when you need type-checking while preserving literal or specific type information—particularly with optional properties, object literal validation before function calls, and default exports lacking inline annotations."

### Claim 15

- **Text:** The TypeScript 5.0 announcement reiterates that `satisfies` "made sure that the type of an expression was compatible, without affecting the type itself," summarizing the feature's guarantee.
- **Target section:** References
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "TypeScript 4.9 introduced the `satisfies` operator. It made sure that the type of an expression was compatible, without affecting the type itself."

## Reference URLs

- https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- https://github.com/microsoft/TypeScript/issues/7481
- https://github.com/microsoft/TypeScript/issues/51173
- https://2ality.com/2025/02/satisfies-operator.html

## Rejected sources

- https://en.wikipedia.org/wiki/TypeScript — Wikipedia; rejected per source-tier rule.
- https://dev.to/ayc0/typescript-49-satisfies-operator-1e4i — Dev.to community post; rejected per source-tier rule.
- https://dev.to/benarambide/understanding-typescripts-satisfies-vs-as-3d6 — Dev.to; same reason.
- https://medium.com/@cefn/typescript-satisfies-6ba52e74cb2f — Medium; rejected per source-tier rule.
- https://medium.com/lean-coders/understand-const-as-const-and-readonly-in-typescript — Medium; rejected.
- https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-satisfies — Vendor SEO-style docs page without named author; rejected.
- https://chrisvaillancourt.io/posts/combining-typescript-satisfies-and-const-assertion/ — Personal blog; rejected (2ality covers the same ground with higher authority).
- https://kevinqdam.com/blog/as-const-satisfies-type/ — Personal blog; rejected for the same reason.
- https://www.typescriptlang.org/docs/handbook/2/everyday-types.html — Live but does not mention `satisfies`; not useful as a source.

## Research notes

- The primary PR is microsoft/TypeScript#46827 (merged Aug 26, 2022, author a-tarasyuk). Issue #7481 is cited as it carries the original motivation prose.
- The canonical color-palette example from the 4.9 release notes is the best single runnable example. Rauschmayer's `Point` example illustrates narrowing preservation and the `as`-vs-`satisfies` safety gap.
- Visual candidate: four- or five-column comparison across "plain literal", "type annotation `: T`", "`as T`", "`satisfies T`", "`as const satisfies T`" — columns: widens type?, validates shape?, preserves literal types?, allows unsafe cast?.
- Gotcha to surface: ordering — `as const satisfies T` works; `satisfies T as const` does not (issue #51173). `satisfies` alone does not make properties `readonly` nor narrow primitive literals.
- The 5.0 `@satisfies` JSDoc tag is topic-specific (JS/`@ts-check` consumers) and deserves its own short section rather than being folded into Context.
