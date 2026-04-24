---
id: 1715
title: "Conditional Types and `infer`"
state: draft
slug: conditional-types-and-infer
category: TypeScript
level: senior
---

# [FEE-1715] Conditional Types and `infer`

:::info
TypeScript 2.8 shipped conditional types of the form `T extends U ? X : Y` together with the `infer` keyword, which declares a fresh type variable inside the `extends` clause and binds it from the checked type. TypeScript 4.1 added template literal types and permitted conditional types to reference themselves in their branches, which unlocked recursive type-level parsing. TypeScript 5.4 added `NoInfer<T>`, a utility that instructs the compiler to skip a position when collecting inference candidates. Taken together, these features let a library author express non-uniform type mappings that vary by the structure of the input type, which is the backbone of utilities such as `ReturnType`, `Parameters`, and `Awaited`.
:::

## Context

A conditional type selects one of two types based on a type-relationship test. The TypeScript 2.8 release notes describe the feature as the ability "to express non-uniform type mappings. A conditional type selects one of two possible types based on a condition expressed as a type relationship test."

The syntax is `T extends U ? X : Y`. The handbook states the rule: "When the type on the left of the `extends` is assignable to the one on the right, then you'll get the type in the first branch (the \"true\" branch); otherwise you'll get the type in the latter branch (the \"false\" branch)."

Once the branch is chosen, the true branch can reference fresh type variables declared with `infer`. The 2.8 release notes: "Within the `extends` clause of a conditional type, it is now possible to have `infer` declarations that introduce a type variable to be inferred. Such inferred type variables may be referenced in the true branch of the conditional type." `infer` is what turns a conditional type from a binary selector into a structural pattern match.

## Visual

| Form | Behaviour when `T = A \| B \| C` | Use case |
| --- | --- | --- |
| `T extends U ? X : Y` (naked `T`) | Distributes: evaluates to `(A extends U ? X : Y) \| (B extends U ? X : Y) \| (C extends U ? X : Y)` | Per-member mapping over a union (e.g. `Exclude`, `Extract`) |
| `[T] extends [U] ? X : Y` | Non-distributive: compares the union as a single unit against `[U]` | Assignability test that treats the union atomically (e.g. "is `T` exactly `never`?") |

Distribution is triggered only when the checked type is a naked type parameter. The 2.8 release notes: "Conditional types in which the checked type is a naked type parameter are called _distributive conditional types_. Distributive conditional types are automatically distributed over union types during instantiation." The handbook gives the escape hatch: "Typically, distributivity is the desired behavior. To avoid that behavior, you can surround each side of the `extends` keyword with square brackets."

## Example

### (a) Extract an array element with `infer`

```ts
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type A = Flatten<string[]>;      // string
type B = Flatten<number>;        // number
type C = Flatten<Array<0 | 1>>;  // 0 | 1
```

The handbook explains the pattern: "Here, we used the `infer` keyword to declaratively introduce a new generic type variable named `Item` instead of specifying how to retrieve the element type of `Type` within the true branch."

### (b) `Parameters<T>` and `ReturnType<T>`

TypeScript ships predefined conditional types in `lib.d.ts`. The 2.8 notes list them: "TypeScript 2.8 adds several predefined conditional types to `lib.d.ts`: `Exclude<T, U>`, `Extract<T, U>`, `NonNullable<T>`, `ReturnType<T>`, `InstanceType<T>`." Their shapes combine a conditional test with `infer`:

```ts
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

type R = MyReturnType<(id: string) => number>; // number
type P = MyParameters<(id: string, n: 1 | 2) => void>; // [id: string, n: 1 | 2]
```

### (c) `Awaited<T>`: recursive unwrap

TypeScript 4.5 added the built-in `Awaited<T>` utility. The 4.5 blog post: "TypeScript 4.5 introduces a new utility type called the `Awaited` type. This type is meant to model operations like `await` in `async` functions, or the `.then()` method on `Promise`s – specifically, the way that they recursively unwrap `Promise`s."

```ts
type A = Awaited<Promise<string>>;                    // string
type B = Awaited<Promise<Promise<number>>>;           // number
type C = Awaited<boolean | Promise<boolean>>;         // boolean
```

A simplified sketch of the mechanism:

```ts
type MyAwaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(onfulfilled: infer F, ...args: infer _): any }
    ? F extends (value: infer V, ...args: infer _) => any
        ? MyAwaited<V>
        : never
    : T;
```

The recursion is what 4.1 enabled, and the `infer` positions are what 2.8 enabled.

## Best Practices

- **SHOULD** wrap both sides of `extends` in a one-tuple when the union is meant to be tested as a whole. The handbook states the mechanism: "to avoid that behavior, you can surround each side of the `extends` keyword with square brackets." A common case is checking whether a type is exactly `never`, where `[T] extends [never]` gives the correct answer and naked `T extends never` does not.
- **SHOULD** name intermediate results with type aliases when conditional chains nest deeply. Recursive conditionals have a ceiling: the TS 4.1 announcement notes that "these types can hit an internal recursion depth limit on sufficiently-complex inputs. When that recursion limit is hit, that results in a compile-time error." Breaking a chain into named steps keeps each recursion shallow and error messages readable.
- **MAY** lean on the predefined utilities in `lib.d.ts` before writing a bespoke conditional. `Exclude`, `Extract`, `NonNullable`, `ReturnType`, and `InstanceType` ship with the compiler (2.8 release notes) and cover many common shapes without a custom definition.

## Design Thinking

Distribution-by-default reflects how developers reason about unions. A union `A | B | C` is usually read as "any of A, B, or C," and applying a mapping member-by-member matches that mental model: `Exclude<"a" | "b" | "c", "a">` should yield `"b" | "c"`, not a single membership test. The 2.8 release notes make the rule explicit: naked-type-parameter conditionals distribute during instantiation. The tuple trick `[T] extends [U]` exists for the remaining cases where the author wants assignability of the union as a whole, for example asking "is `T` assignable to `U` taken as one type" or probing for `never`. Having one default plus one syntactic escape hatch keeps the common case terse and makes the less common case visibly deliberate at the call site.

## Deep Dive

### Variance and multi-candidate `infer`

When the same `infer` variable appears in multiple positions, variance decides how the candidates combine. The 2.8 notes describe both sides: "multiple candidates for the same type variable in co-variant positions causes a union type to be inferred," and "multiple candidates for the same type variable in contra-variant positions causes an intersection type to be inferred."

```ts
// Covariant positions (return type occurs twice) -> union
type Co<T> = T extends { a: infer X; b: infer X } ? X : never;
type U = Co<{ a: string; b: number }>; // string | number

// Contravariant positions (function parameters) -> intersection
type Contra<T> = T extends ((a: infer X) => void) & ((b: infer X) => void) ? X : never;
type I = Contra<((a: string) => void) & ((b: number) => void)>; // string & number
```

This is what makes "last overload" and "union-to-intersection" tricks work and why they tend to be fragile: they depend on how the compiler places candidates in covariant versus contravariant slots.

### Recursive conditionals

Before 4.1 a conditional type could not refer to itself directly in a branch. The 4.1 announcement lifted that restriction: "In TypeScript 4.1, conditional types can now immediately reference themselves within their branches, making it easier to write recursive type aliases." This is how `Awaited` unwraps nested `Promise`s, how a deep-readonly utility descends into object types, and how template-literal parsers walk a string.

### Recursion depth

Recursive conditionals are bounded. The 4.1 announcement: "these types can hit an internal recursion depth limit on sufficiently-complex inputs. When that recursion limit is hit, that results in a compile-time error." The compiler does not expose a numeric limit in the release notes, so treat it as a qualitative budget: shorten recursion chains, split into named aliases, and prefer iterative tuple-walking patterns over deeply nested object recursion when inputs might be large.

## Template Literal Parsing

TypeScript 4.1 introduced template literal types and allowed `infer` to appear in substitution positions. The 4.1 announcement: "We can also do something special in template literal types: we can _infer_ from substitution positions." That turns string literal types into parseable tokens.

```ts
type Greeting<S extends string> =
  S extends `hello, ${infer Name}` ? Name : never;

type N = Greeting<"hello, world">; // "world"

type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];

type Parts = Split<"a,b,c", ",">; // ["a", "b", "c"]
```

## Version Reference

- **TypeScript 4.5** — built-in `Awaited<T>`. The 4.5 announcement: "TypeScript 4.5 introduces a new utility type called the `Awaited` type... specifically, the way that they recursively unwrap `Promise`s."
- **TypeScript 4.7** — constrained inference sites. The 4.7 announcement: "TypeScript 4.7 now allows you to place a constraint on any `infer` type." The `infer X extends U` form lets the compiler narrow the inferred type without a follow-up conditional, which is useful in template-literal parsers that want a numeric or string token.

  ```ts
  type FirstNumber<T> =
    T extends [infer N extends number, ...unknown[]] ? N : never;

  type X = FirstNumber<[42, "a"]>; // 42
  ```

- **TypeScript 5.4** — `NoInfer<T>`. The 5.4 announcement: "Surrounding a type in `NoInfer<...>` gives a signal to TypeScript not to dig in and match against the inner types to find candidates for type inference." Use it to pin one generic parameter to another argument while still typechecking the wrapped position.

  ```ts
  declare function createStreetLight<C extends string>(
    colors: C[],
    defaultColor?: NoInfer<C>,
  ): void;

  createStreetLight(["red", "yellow", "green"], "red");
  // createStreetLight(["red", "yellow", "green"], "blue"); // error
  ```

## Related Topics

- [Generics](/en/TypeScript/1702)
- [Utility Types & Type Manipulation](/en/TypeScript/1703)
- [The `satisfies` Operator](/en/TypeScript/satisfies-operator)

## References

- Microsoft, "TypeScript 2.8 Release Notes," TypeScript Handbook (2018). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- Microsoft, "Conditional Types," TypeScript Handbook (2024). https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- Daniel Rosenwasser, "Announcing TypeScript 4.1," TypeScript Blog (2020). https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/
- Daniel Rosenwasser, "Announcing TypeScript 4.5," TypeScript Blog (2021). https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- Daniel Rosenwasser, "Announcing TypeScript 4.7," TypeScript Blog (2022). https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- Daniel Rosenwasser, "Announcing TypeScript 5.4," TypeScript Blog (2024). https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
