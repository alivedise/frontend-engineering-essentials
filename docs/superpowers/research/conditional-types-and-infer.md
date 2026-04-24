---
topic: Conditional Types and `infer`
id: 1715
slug: conditional-types-and-infer
sources_reviewed: 6
claims: 15
---

# Findings: Conditional Types and `infer`

**Generated:** 2026-04-24
**Target article:** FEE-1715 — conditional-types-and-infer
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** Conditional types were introduced in TypeScript 2.8 and select between two types based on a type-relationship test.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- **Pulled quote:** "TypeScript 2.8 introduces _conditional types_ which add the ability to express non-uniform type mappings. A conditional type selects one of two possible types based on a condition expressed as a type relationship test"

### Claim 2

- **Text:** The syntax `T extends U ? X : Y` yields `X` when `T` is assignable to `U`, and `Y` otherwise.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- **Pulled quote:** "When the type on the left of the `extends` is assignable to the one on the right, then you'll get the type in the first branch (the \"true\" branch); otherwise you'll get the type in the latter branch (the \"false\" branch)."

### Claim 3

- **Text:** When the checked type is a naked type parameter, a conditional type distributes over union members at instantiation time.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- **Pulled quote:** "Conditional types in which the checked type is a naked type parameter are called _distributive conditional types_. Distributive conditional types are automatically distributed over union types during instantiation."

### Claim 4

- **Text:** Wrapping both sides in a one-tuple — `[T] extends [U]` — suppresses distribution so the union is compared as a single unit.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- **Pulled quote:** "Typically, distributivity is the desired behavior. To avoid that behavior, you can surround each side of the `extends` keyword with square brackets."

### Claim 5

- **Text:** The `infer` keyword introduces a type variable inside the `extends` clause that can be referenced in the true branch.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- **Pulled quote:** "Within the `extends` clause of a conditional type, it is now possible to have `infer` declarations that introduce a type variable to be inferred. Such inferred type variables may be referenced in the true branch of the conditional type."

### Claim 6

- **Text:** A canonical use of `infer` is extracting an array's element type: `T extends Array<infer Item> ? Item : T`.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- **Pulled quote:** "Here, we used the `infer` keyword to declaratively introduce a new generic type variable named `Item` instead of specifying how to retrieve the element type of `Type` within the true branch."

### Claim 7

- **Text:** TypeScript 2.8 ships predefined conditional types including `Exclude`, `Extract`, `NonNullable`, `ReturnType`, and `InstanceType`.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- **Pulled quote:** "TypeScript 2.8 adds several predefined conditional types to `lib.d.ts`: `Exclude<T, U>`, `Extract<T, U>`, `NonNullable<T>`, `ReturnType<T>`, `InstanceType<T>`."

### Claim 8

- **Text:** Multiple `infer` sites for the same type variable in covariant positions produce a union.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- **Pulled quote:** "multiple candidates for the same type variable in co-variant positions causes a union type to be inferred"

### Claim 9

- **Text:** Multiple `infer` sites in contravariant positions (such as function parameters) produce an intersection.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- **Pulled quote:** "multiple candidates for the same type variable in contra-variant positions causes an intersection type to be inferred"

### Claim 10

- **Text:** TypeScript 4.1 added template literal types and allows `infer` in substitution positions to parse strings at the type level.
- **Target section:** Topic-Specific
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/
- **Pulled quote:** "We can also do something special in template literal types: we can _infer_ from substitution positions."

### Claim 11

- **Text:** TypeScript 4.1 also enabled recursive conditional types, allowing a conditional type to reference itself in its branches.
- **Target section:** Deep Dive
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/
- **Pulled quote:** "In TypeScript 4.1, conditional types can now immediately reference themselves within their branches, making it easier to write recursive type aliases."

### Claim 12

- **Text:** Recursive conditional types have an internal recursion depth limit and can hit a compile-time error on sufficiently complex inputs.
- **Target section:** Best Practices
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/
- **Pulled quote:** "these types can hit an internal recursion depth limit on sufficiently-complex inputs. When that recursion limit is hit, that results in a compile-time error."

### Claim 13

- **Text:** TypeScript 4.5 added the built-in `Awaited<T>` utility that recursively unwraps `Promise` types using conditional types with `infer`.
- **Target section:** Example
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- **Pulled quote:** "TypeScript 4.5 introduces a new utility type called the `Awaited` type. This type is meant to model operations like `await` in `async` functions, or the `.then()` method on `Promise`s – specifically, the way that they recursively unwrap `Promise`s."

### Claim 14

- **Text:** TypeScript 4.7 lets you attach a constraint directly to an `infer` variable with `infer X extends U`.
- **Target section:** Topic-Specific
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- **Pulled quote:** "TypeScript 4.7 now allows you to place a constraint on any `infer` type."

### Claim 15

- **Text:** TypeScript 5.4 added `NoInfer<T>`, a utility that tells the compiler to skip the wrapped position when picking inference candidates.
- **Target section:** Topic-Specific
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
- **Pulled quote:** "Surrounding a type in `NoInfer<...>` gives a signal to TypeScript not to dig in and match against the inner types to find candidates for type inference."

## Reference URLs

- https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/
- https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

## Rejected sources

- Personal blogs (sandromaglione, shaky.sh, dmitripavlutin) — rejected per source tier rule; TS 2.8 release notes cover same ground.
- Dev.to — rejected.

## Research notes

- TS 2.8 release notes are the single most authoritative source; cover distributive conditionals, `infer`, variance (union vs intersection), predefined utilities in one page.
- Readability guidance "name intermediate steps with type aliases" is not quoted in any authoritative source. Frame as editorial advice, not cite-backed doctrine.
- Tuple-head/tuple-tail pattern is conventional TS folklore; TS 4.7 blog post uses `[infer S extends string, ...unknown[]]` as the closest authoritative touchstone.
- Parameters<T> is TS 3.1; not named in the 2.8 quote list; add if writer cites specifically.
- TS 4.1 blog post does not give a numeric recursion-depth value — stay qualitative.
