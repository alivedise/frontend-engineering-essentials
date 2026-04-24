---
id: 1711
title: Decorators (Stage 3 ECMAScript)
state: draft
slug: decorators-stage-3
category: TypeScript
level: senior
allow_no_custom_section: true
# reason: decorator mechanics fill the standard sections end-to-end; no stage-specific subtopic warrants its own heading beyond what Deep Dive already covers.
---

# [FEE-1711] Decorators (Stage 3 ECMAScript)

:::info
Decorators are functions that customize classes and their members. TypeScript 5.0 shipped the stage-3 ECMAScript proposal as a standard language feature, so `@decorator` syntax now compiles without the `--experimentalDecorators` flag. The stage-3 form uses a different API from the earlier experimental decorators: each decorator receives the decorated value plus a typed context object, and the set of legal targets is narrower. This article covers the stage-3 semantics, the application model, and the migration gap from experimental decorators.
:::

## Context

Decorators have a long history in TypeScript. The original implementation, available behind `--experimentalDecorators`, tracked an early draft of the TC39 decorators proposal and predated its stabilization. The TC39 proposal went through several rewrites before settling on the current stage-3 design (TC39, proposal-decorators).

TypeScript 5.0 shipped the stage-3 form as a non-experimental language feature, with support for "customizing classes and their members in a reusable way" (TypeScript, 5.0 release notes). Under TS 5.0 and later, writing `@decorator` is valid syntax by default: "Previously, any attempt to use decorators without `--experimentalDecorators` prompted an error. Now decorators are valid for all new code by default" (Microsoft DevBlog, "Announcing TypeScript 5.0"). The flag still exists and opts into the old behavior, but the default is now stage-3.

One documentation hazard remains. The Handbook page at `/docs/handbook/decorators.html` still documents experimental stage-2 decorators and carries an explicit notice: "This document refers to an experimental stage 2 decorators implementation. Stage 3 decorator support is available since Typescript 5.0" (TypeScript Handbook, Decorators). When reading decorator tutorials, confirm whether they target the stage-2 or stage-3 API before copying code. The canonical stage-3 reference is the TS 5.0 release-notes page.

## Visual

Stacked decorators apply bottom-up: the decorator closest to the member wraps first, and each outer decorator wraps the result of the one below. The spec splits this into three phases run during class definition (TC39, proposal-decorators).

| Phase | What happens | Source |
| --- | --- | --- |
| 1. Evaluate | Decorator expressions are evaluated left-to-right (top-to-bottom in source order) to produce the decorator functions. | TC39 proposal-decorators |
| 2. Call | Each decorator is called during class definition, after the methods have been evaluated but before the constructor and prototype are assembled. Innermost (closest to the member) is called first; outer decorators receive the result of the inner call. | TC39 proposal-decorators |
| 3. Apply | All decorator results are applied together, mutating the constructor and prototype after every decorator has been called. | TC39 proposal-decorators |

For the canonical stacked example `@bound @loggedMethod greet()`: `@loggedMethod` is applied first to the original method, then `@bound` is applied to the result of `@loggedMethod` (TypeScript 5.0 release notes).

## Example

A method decorator under stage-3 receives the original method plus a `ClassMethodDecoratorContext`. The context carries `name`, `private`, `static`, and `addInitializer`, so a logger that prints entry and exit can be typed precisely:

```ts
function loggedMethod(
  originalMethod: any,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }

  return replacementMethod;
}

class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}
```

The return value replaces the method. Because the decorator returns a function with the same call signature, the replacement satisfies the "matching semantics" rule the spec requires of returned replacements.

A `@bound` decorator shows the second half of the context API: `addInitializer` registers code that runs during construction, which is where per-instance binding belongs:

```ts
function bound(
  originalMethod: any,
  context: ClassMethodDecoratorContext
) {
  const methodName = context.name;
  if (context.private) {
    throw new Error("'bound' cannot decorate private methods.");
  }
  context.addInitializer(function () {
    (this as any)[methodName] = (this as any)[methodName].bind(this);
  });
}
```

Stacked as `@bound @loggedMethod greet()`, the logger wraps the original method first, then `@bound` registers an initializer that binds the logged version to each instance.

## Best Practices

- **MUST** target the stage-3 API when writing new decorators under TS 5.0 or later. The stage-3 signature and emit differ enough from experimental decorators that "any existing decorator functions are not likely" to work under both modes without rewriting (TypeScript 5.0 release notes).
- **MUST NOT** attempt to decorate constructor parameters or method parameters under stage-3. The proposal "does not allow decorating parameters" (Microsoft DevBlog, "Announcing TypeScript 5.0"); parameter decorators remain an experimental-only feature.
- **MUST** restrict stage-3 decorators to the six addressable element kinds: class, method, getter, setter, field, and auto-accessor (TC39 proposal-decorators).
- **MUST NOT** rely on `reflect-metadata` or `--emitDecoratorMetadata` with stage-3 decorators. The stage-3 proposal "is not compatible with `--emitDecoratorMetadata`" (Microsoft DevBlog, "Announcing TypeScript 5.0"). Runtime type metadata is out of scope for stage-3 and is tracked as a separate TC39 proposal.
- **SHOULD** pick one position for decorators on exported classes. Stage-3 allows `@register export default class Foo {}` or `export default @register class Bar {}`, but a single class "before *and* after is not allowed" (TypeScript 5.0 release notes).
- **MAY** keep framework code that depends on parameter decorators or emitted metadata (for example, DI containers built on parameter injection) on `--experimentalDecorators`. Those frameworks cannot move to stage-3 without an upstream redesign.

## Design Thinking

A stage-3 decorator is a function of the form `(value, context) => replacement | void`. The context object carries `kind`, `name`, `access`, and optional `private` / `static` flags, plus an `addInitializer` hook: "type Decorator = (value: Input, context: { kind: string; name: string | symbol; access: { get?(): unknown; set?(value: unknown): void }; private?: boolean; static?: boolean; addInitializer(initializer: () => void): void; }) => Output | void" (TC39 proposal-decorators). Every capability the decorator has is visible on that context, which makes the contract easy to reason about locally.

The stage-3 design is narrower than the stage-2 proposal that TypeScript originally implemented. Stage-2 allowed decorators to add arbitrary extra class elements and reshape the class in ways that were expensive for engines to model. Stage-3 removes those capabilities deliberately: the proposal is narrower "in order to keep the meaning of decorators 'well-scoped' and intuitive, and to simplify implementations" (TC39 proposal-decorators). The trade is flexibility against predictability: stage-3 decorators cannot rewrite a class into something structurally different, and in exchange readers and engines can reason about a decorated class by looking at the six element kinds it addresses.

Parameter decorators are the visible casualty of that narrowing. Frameworks that leaned on parameter decorators plus emitted metadata for dependency injection have nothing to migrate to; they need a different mechanism under stage-3, typically explicit registration via a class decorator.

## Deep Dive

Auto-accessors are a new class-member form introduced alongside stage-3 decorators. Writing `accessor foo = 0;` declares a storage slot with generated get and set methods. Decorating an auto-accessor provides typed `get`, `set`, and `init` hooks, which lets a decorator intercept reads, writes, and initialization without hand-writing accessor pairs. The spec lists auto-accessor alongside class, method, getter, setter, and field as one of the six decoratable kinds: "Decorators apply to these kinds: \"class\", \"method\", \"getter\", \"setter\", \"field\", and \"accessor\"" (TC39 proposal-decorators).

Return-value semantics are strict. A decorator "can replace the value that is being decorated with a matching value that has the same semantics" (TC39 proposal-decorators). A method decorator may return a function; a field decorator may return an initializer function; a class decorator may return a new class. Returning `undefined` leaves the original in place. Returning a shape that does not match the decorated kind is an error.

The three-phase application model matters when several decorators interact. All decorator expressions are evaluated before any decorator runs, so side effects in the expressions (for example, reading a decorator factory's argument) happen in source order regardless of how the decorators wrap each other. The decorators are then called during class definition, "after the methods have been evaluated but before the constructor and prototype have been put together." Finally, all results are applied together, mutating the constructor and prototype "all at once, after all of them have been called" (TC39 proposal-decorators). A decorator therefore cannot observe the partially decorated class mid-assembly; it only sees the value it was handed.

## Related Topics

- [Classes, Access Modifiers & `#` Private Fields](/en/TypeScript/classes-and-private-fields)
- [Type System Fundamentals & Type Inference](/en/TypeScript/1701)
- [tsconfig & Strict Mode](/en/TypeScript/1706)

## References

- Microsoft, "Announcing TypeScript 5.0," Microsoft DevBlog (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- TypeScript Team, "TypeScript 5.0 Release Notes," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- TC39, "proposal-decorators," GitHub (2023). https://github.com/tc39/proposal-decorators
- TypeScript Team, "Decorators (Handbook)," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/decorators.html
