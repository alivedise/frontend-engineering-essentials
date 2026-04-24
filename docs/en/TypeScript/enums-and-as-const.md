---
id: 1713
title: "Enums and the `as const` Alternative"
state: draft
slug: enums-and-as-const
category: TypeScript
level: mid
---

# [FEE-1713] Enums and the `as const` Alternative

:::info
TypeScript offers numeric, string, and heterogeneous `enum` declarations plus a `const enum` form that inlines values at each use site. Regular enums emit a runtime object; `const enum` declarations leave nothing behind. The handbook itself now points readers toward `as const` on a plain object as an alternative, deriving the member union with `keyof typeof`. TypeScript 5.0 also changed enum semantics so every member gets a unique literal type, closing a long-standing gap in how enums narrowed. This article covers when each shape fits, which pitfalls to avoid, and how `isolatedModules` reshapes the decision.
:::

## Context

TypeScript's `enum` predates most of the type system's literal-union machinery. The handbook describes three shapes: numeric enums with auto-incrementing members, string enums where each member is assigned a literal string, and heterogeneous enums that mix both (the handbook notes string enums "allow you to give a meaningful and readable value when your code runs, independent of the name of the enum member itself" and discourages mixing numbers and strings).

The runtime emit separates the two major modes. A regular numeric or string enum compiles to a runtime object that participates in module exports. A `const enum` behaves differently: the handbook states that "const enums can only use constant enum expressions and unlike regular enums they are completely removed during compilation. Const enum members are inlined at use sites." That inlining is the source of both the performance appeal and the tooling pain that later sections address.

## Visual

| Feature | `enum` (regular) | `const enum` | `as const` object | Literal union |
| --- | --- | --- | --- | --- |
| Runtime emit | Object with members | None (inlined) | Plain object literal | None |
| Reverse mapping | Numeric only | Numeric only | No | No |
| Bundler DCE friendliness | Object export is harder for DCE | Inlined, but version-skew risk | Plain object literals play more nicely with bundler dead-code elimination | Nothing to eliminate |
| `isolatedModules` compatible | Yes | No for ambient imports | Yes | Yes |
| Nominal vs structural | Behaves nominally | Behaves nominally | Structural | Structural |

## Example

### A `const enum` and its inlined output

```ts
const enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}

function move(d: Direction) {
  if (d === Direction.Up) return [0, -1];
  if (d === Direction.Down) return [0, 1];
  return [0, 0];
}

move(Direction.Up);
```

After compilation, references to `Direction.Up` are replaced with the numeric literal `1` at every call site; no `Direction` object exists at runtime. That is the handbook's stated behaviour: const enum members are inlined at use sites and the declaration itself is removed.

### The `as const` alternative with `keyof typeof`

```ts
const Direction = {
  Up: 1,
  Down: 2,
  Left: 3,
  Right: 4,
} as const;

type DirectionKey = keyof typeof Direction;
// "Up" | "Down" | "Left" | "Right"

type DirectionValue = (typeof Direction)[keyof typeof Direction];
// 1 | 2 | 3 | 4

function move(d: DirectionValue) {
  if (d === Direction.Up) return [0, -1];
  return [0, 0];
}
```

The `as const` assertion freezes the literal types; the handbook's `keyof typeof` idiom (shown there as `type LogLevelStrings = keyof typeof LogLevel`) extracts the key union. Values are a plain object at runtime with `readonly` properties, exportable through the same module system as any other constant.

## Best Practices

- **MUST NOT** export `const enum` from a published library. Consumers using `isolatedModules` or a single-file transpiler such as Babel cannot read the declaring module to resolve the inlined value; the referenced blog post by Jamieson documents how "TypeScript will have to read both modules to determine" the value, which isolated transpilers refuse to do.
- **MUST** avoid comparing enum values against non-enum primitives of the same underlying type. The TypeScript compiler permits such comparisons, which is the reason `@typescript-eslint/no-unsafe-enum-comparison` exists; the rule documentation notes "it is allowed to compare enum values against non-enum values."
- **SHOULD** prefer an `as const` object or a literal union over a new `enum` declaration in fresh code. The handbook states that "in modern TypeScript, you may not need an enum when an object with `as const` could suffice."
- **SHOULD** reach for a literal union such as `"left" | "right" | "center"` when the fixed set carries no runtime object responsibilities. The handbook's everyday-types page frames unions as expressing "functions that only accept a certain set of known values."
- **MAY** keep existing `enum` declarations in application code where the ergonomic benefits (autocomplete on `Enum.Member`, grouped namespace) outweigh the migration cost; the TS 5.0 literal-type upgrade closes most of the earlier narrowing gaps.

## Design Thinking

`isolatedModules` exists because non-TypeScript transpilers such as Babel operate one file at a time. The tsconfig reference explains that these transpilers "only operate on a single file at a time, which means they can't apply code transforms that depend on understanding the full type system." A `const enum` import crosses that boundary: replacing `Direction.Up` with `1` requires reading the other module to look up the member's value. The tsconfig page is explicit: "without knowledge of the values of const enum members, other transpilers can't replace the references to Numbers, which would be a runtime error if left alone. Because of this, when isolatedModules is set, it is an error to reference an ambient const enum member."

The community reaction has been mixed. TypeScript issue #41641 proposed deprecating `const enum` and summarised the tooling costs: "const enum is uniquely problematic for tooling... it doesn't work with isolatedModules." The proposal was declined, so `const enum` remains supported, but the thread captured why many style guides steer away from it. The handbook's suggestion of `as const` objects reflects the same pressure from a different angle.

## Deep Dive

### Reverse mapping asymmetry

Numeric enums emit both a forward and a reverse mapping: `Direction[1]` returns `"Up"`. String enum members do not: the handbook states "string enum members _do not_ get a reverse mapping generated at all." Code that relies on `SomeEnum[value]` to recover a name works for numeric enums and silently returns `undefined` for string enums. Either pick one enum kind per codebase or avoid reverse-mapping lookups entirely.

### Version-skew footgun with `const enum`

The handbook warns that `const enum` "can easily inline values from version A of a dependency at compile time, and import version B at runtime. Version A and B's enums can have different values, if you are not very careful, resulting in surprising bugs, like taking the wrong branches of `if` statements." The inlining that makes `const enum` appealing is the same mechanism that lets the compiler and the runtime disagree about a numeric value. Regular enums and `as const` objects do not have this class of bug because the value read at runtime comes from the module that actually loaded.

### TypeScript 5.0 union-enum change

TypeScript 5.0 reworked how enum members are typed. The release announcement states that "TypeScript 5.0 manages to make all enums into union enums by creating a unique type for each computed member. That means that all enums can now be narrowed and have their members referenced as types as well." Before 5.0, "whenever TypeScript ran into these issues, it would quietly back out and use the old enum strategy. That meant giving up all the advantages of unions and literal types." A single computed member used to downgrade the entire enum to the old strategy, breaking narrowing inside `switch` statements and forbidding per-member type references. Code that depends on narrowing enums with computed members requires TS 5.0 or newer.

## Related Topics

- [Type System Fundamentals & Type Inference](/en/TypeScript/1701)
- [Utility Types & Type Manipulation](/en/TypeScript/1703)
- [The `satisfies` Operator](/en/TypeScript/satisfies-operator)

## References

- TypeScript Team, "Enums," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/enums.html
- TypeScript Team, "Everyday Types," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- TypeScript Team, "isolatedModules," TSConfig Reference. https://www.typescriptlang.org/tsconfig/isolatedModules.html
- Daniel Rosenwasser, "Announcing TypeScript 3.4," Microsoft DevBlogs (2019). https://devblogs.microsoft.com/typescript/announcing-typescript-3-4/
- Daniel Rosenwasser, "Announcing TypeScript 5.0," Microsoft DevBlogs (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- typescript-eslint, "no-unsafe-enum-comparison." https://typescript-eslint.io/rules/no-unsafe-enum-comparison/
- Nicholas Jamieson, "Don't Export Const Enums." https://ncjamieson.com/dont-export-const-enums/
- Ryan Cavanaugh, "Proposal: Deprecate `const enum`," TypeScript Issue #41641. https://github.com/microsoft/TypeScript/issues/41641
