---
id: 1709
title: The `satisfies` Operator
state: draft
slug: satisfies-operator
category: TypeScript
level: mid
---

# [FEE-1709] The `satisfies` Operator

:::info
`satisfies` validates that an expression is assignable to a target type without changing the expression's inferred type. It resolves a long-standing dilemma: developers often want to confirm an expression matches a type while also keeping the most specific inferred type for later use. TypeScript 4.9 shipped the operator in November 2022, and TypeScript 5.0 extended it to JSDoc. This article covers when to reach for `satisfies`, how it differs from type annotations and `as`, and the `as const satisfies T` pattern for literal narrowing with structural validation.
:::

## Context

Before `satisfies`, TypeScript developers had three tools for aligning an expression with a type: a type annotation (`const x: T = ...`), a type assertion (`... as T`), or no annotation at all. Each tool sacrificed something. A type annotation widens the expression to `T`, which loses literal information the compiler had already inferred. A type assertion can silently accept expressions that would otherwise fail assignability, because `as` permits unsafe casts in either direction.

The TypeScript 4.9 announcement describes the trap directly: "TypeScript developers are often faced with a dilemma: we want to ensure that some expression matches some type, but also want to keep the most specific type of that expression for inference purposes." The `satisfies` operator targets that dilemma. Per the same release, it "lets us validate that the type of an expression matches some type, without changing the resulting type of that expression."

The feature request lived in `microsoft/TypeScript#7481` from 2016, titled "Operator to ensure an expression is contextually typed by, and satisfies, some type." The issue sat open for six years before landing in 4.9 in November 2022.

## Visual

| Form | Widens to target type? | Validates shape? | Preserves literal types? | Allows unsafe cast? |
| --- | --- | --- | --- | --- |
| `const x = expr` (no annotation) | no | no | yes | n/a |
| `const x: T = expr` | yes | yes | no | no |
| `const x = expr as T` | yes | partial (bidirectional, loose) | no | yes |
| `const x = expr satisfies T` | no | yes (assignability) | yes | no |
| `const x = expr as const satisfies T` | no | yes | yes (readonly literals) | no |

The table tracks the axes called out by the TypeScript 4.9 and 5.0 release notes and by Rauschmayer's 2ality article. A plain literal gets maximum inference with zero validation. A type annotation trades inference for validation. `as` trades safety for type-shape control. `satisfies` keeps the narrow inferred type and adds assignability checking against the target. `as const satisfies T` adds literal narrowing on top.

## Example

The canonical example comes from the TypeScript 4.9 release notes. A palette is typed as `Record<Colors, string | RGB>`, and the code reads `palette.green.toUpperCase()` later on.

```ts
type Colors = "red" | "green" | "blue";
type RGB = [red: number, green: number, blue: number];

// Approach A: annotation widens each property.
const palette1: Record<Colors, string | RGB> = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};
// Error: 'palette1.green' could be of type RGB;
// property 'toUpperCase' does not exist on type 'string | RGB'.
palette1.green.toUpperCase();
```

With a type annotation, each property widens to `string | RGB`, so member access like `toUpperCase()` fails because the compiler no longer remembers that `green` was assigned a string.

```ts
// Approach B: satisfies validates without widening.
const palette2 = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<Colors, string | RGB>;

palette2.green.toUpperCase(); // OK: still typed as string.
```

Per the 4.9 release notes: `satisfies Record<Colors, string | RGB>; // toUpperCase() method is still accessible!`. The compiler also flags misspelled keys against the constraint: adding `"platypus": false` produces `error - "platypus" was never listed in 'Colors'`.

A second example from Rauschmayer's 2ality article (February 2025) illustrates the `as` vs `satisfies` safety gap:

```ts
interface Point {
  x: number;
  y: number;
}

const point5 = { x: 2 } as const as Point; // OK (problematic)
const point6 = { x: 2 } as const satisfies Point;
// Error: Property 'y' is missing in type '{ readonly x: 2 }'.
```

`as` masks the missing `y` property; `satisfies` reports it. Applied to a complete object, `satisfies` retains the narrow inferred type: `{ x: 2, y: 5 } as const satisfies Point` keeps the type as `{ readonly x: 2, readonly y: 5 }` rather than widening to `Point`.

## Best Practices

- **MUST** prefer `satisfies T` over `as T` when the goal is to validate shape without re-typing. `as` can mask missing required properties (`{ x: 2 } as const as Point` type-checks, `{ x: 2 } as const satisfies Point` does not), because `as` generally changes the type of its left-hand side and does not type-check as thoroughly as `satisfies` (Claims 8, 9).
- **MUST** write `as const` before `satisfies` when you want both literal narrowing and structural validation. `as const satisfies T` compiles; `satisfies T as const` does not, because `const` assertions can only be applied to references to enum members, or string, number, boolean, array, or object literals (Claim 11).
- **SHOULD** use `satisfies` when you need type-checking while keeping literal inference, particularly for optional properties, object literals passed to functions, and default exports that cannot carry an inline annotation (Claim 14).
- **SHOULD** use `satisfies` instead of a type annotation when downstream code depends on per-property narrow types. A `Record<Colors, string | RGB>` annotation widens each property and breaks `palette.green.toUpperCase()`; `satisfies` keeps the narrower inferred type and the call still type-checks (Claims 5, 6, 10).
- **MAY** use `satisfies` against a broad interface to retain structural detail the interface would otherwise erase. A `ConfigSettings` object with `extends` declared as an array keeps the array structure under `satisfies CompilerOptions`, because `satisfies` validates without changing the type (Claim 13).

## Design Thinking

The three tools trade along different axes. A type annotation offers clarity at the call site and guarantees the variable's type matches the declaration, at the cost of losing narrow literal inference. `as` gives the developer control over the resulting type but permits unsafe casts in both directions, so missing properties can slip through (Claims 4, 9). `satisfies` adds a check without a cast: assignability is tested, and the expression's original inferred type is kept.

The 2016 request framed the goal as "allow implicit conversions only (type compatibility)," which is what the operator ended up delivering six years later. The 4.9 release note pairs the check with the preservation guarantee: the operator lets developers "validate that the type of an expression matches some type, without changing the resulting type of that expression." The 5.0 announcement summarises the property as "it made sure that the type of an expression was compatible, without affecting the type itself" (Claim 15).

If you want both literal precision and contract checking at a declaration site, reach for `satisfies`. If you want the variable to have exactly the declared type regardless of the right-hand side's shape, use an annotation. If you already know the compiler cannot verify the shape, `as` exists; the bar for using it is higher because it bypasses checks `satisfies` would run.

## Deep Dive

`satisfies` does not confer `as const` behaviour. It does not convert properties to `readonly`, does not narrow primitive literals to their literal types, and does not fold array types to tuple types. Those effects come from `as const`. The combination `as const satisfies T` is therefore ordered: `as const` narrows and freezes the literal, then `satisfies T` validates the narrowed type against `T`.

Reversing the order fails. The TypeScript repo issue `#51173` records that `const` assertions can only be applied to references to enum members, or to string, number, boolean, array, or object literals. After `satisfies` runs, the expression is no longer treated as one of those forms, so `satisfies T as const` is rejected at parse/check time.

The order `as const satisfies T` is the correct sequence when you want narrow literal types and structural validation at once. Remove either operator and you lose the corresponding property.

## JSDoc @satisfies

TypeScript 5.0 added `@satisfies` as a JSDoc tag so JavaScript files checked with `// @ts-check` can validate object shapes while preserving inferred types. Per the release notes: "That's why TypeScript 5.0 is supporting a new JSDoc tag called `@satisfies` that does exactly the same thing." The tag mirrors the operator's behaviour for untyped JavaScript consumers.

```js
// @ts-check

/**
 * @satisfies {Record<"red" | "green" | "blue", string | number[]>}
 */
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};

palette.green.toUpperCase(); // OK, still string.
```

## Related Topics

- [Type System Fundamentals & Type Inference](/en/TypeScript/1701)
- [Utility Types & Type Manipulation](/en/TypeScript/1703)
- [Narrowing & Type Guards](/en/TypeScript/1704)

## References

- Microsoft TypeScript Team, "Announcing TypeScript 4.9," Microsoft DevBlogs (2022). https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/
- Microsoft TypeScript Team, "TypeScript 4.9," TypeScript Handbook Release Notes (2022). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- Microsoft TypeScript Team, "Announcing TypeScript 5.0," Microsoft DevBlogs (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- Microsoft TypeScript Team, "TypeScript 5.0," TypeScript Handbook Release Notes (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- Ryan Cavanaugh et al., "Operator to ensure an expression is contextually typed by, and satisfies, some type," microsoft/TypeScript Issue #7481, GitHub (2016). https://github.com/microsoft/TypeScript/issues/7481
- microsoft/TypeScript contributors, "`as const satisfies T` ordering," microsoft/TypeScript Issue #51173, GitHub (2022). https://github.com/microsoft/TypeScript/issues/51173
- Axel Rauschmayer, "The `satisfies` operator in TypeScript," 2ality (2025). https://2ality.com/2025/02/satisfies-operator.html
