---
id: 1711
title: Decorators (Stage 3 ECMAScript)
state: draft
slug: decorators-stage-3
category: TypeScript
level: senior
allow_no_custom_section: true
# reason: TypeScript-side gotchas (version-and-flag matrix, the Handbook trap, ClassMethodDecoratorContext typing) fill the standard sections; proposal-level mechanics live at FEE-10300.
---

# [FEE-1711] Decorators (Stage 3 ECMAScript)

:::info
TypeScript 5.0 shipped TC39 Stage 3 decorators as a non-experimental language feature, so `@decorator` syntax now compiles by default without `--experimentalDecorators`. This article covers the TypeScript-side concerns: the TS version × flag matrix that determines which decorator system is in effect, the lingering Handbook trap, the typed `ClassMethodDecoratorContext` API, and the migration gap from experimental decorators. The proposal-level treatment — all decorator kinds with full signatures, the `addInitializer` semantics, `Symbol.metadata`, and the cross-language history — lives at [FEE-10300](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10300.md).
:::

## Context

Decorators have a long history in TypeScript. The original implementation, available behind `--experimentalDecorators`, tracked an early draft of the TC39 decorators proposal and predated its stabilization. The TC39 proposal went through several rewrites before settling on the current stage-3 design (TC39, proposal-decorators).

TypeScript 5.0 shipped the stage-3 form as a non-experimental language feature, with support for "customizing classes and their members in a reusable way" (TypeScript, 5.0 release notes). Under TS 5.0 and later, writing `@decorator` is valid syntax by default: "Previously, any attempt to use decorators without `--experimentalDecorators` prompted an error. Now decorators are valid for all new code by default" (Microsoft DevBlog, "Announcing TypeScript 5.0"). The flag still exists and opts into the old behavior, but the default is now stage-3.

One documentation hazard remains. The Handbook page at `/docs/handbook/decorators.html` still documents experimental stage-2 decorators and carries an explicit notice: "This document refers to an experimental stage 2 decorators implementation. Stage 3 decorator support is available since Typescript 5.0" (TypeScript Handbook, Decorators). When reading decorator tutorials, confirm whether they target the stage-2 or stage-3 API before copying code. The canonical stage-3 reference is the TS 5.0 release-notes page.

## Visual

The decorator system in effect for a TypeScript project is determined by the TypeScript version and the `experimentalDecorators` setting in `tsconfig.json`:

| TypeScript version | `experimentalDecorators` in tsconfig | System in effect |
| --- | --- | --- |
| < 5.0 | `true` (required) | Legacy stage-2 |
| 5.0+ | `true` | Legacy stage-2 (flag overrides default) |
| 5.0+ | `false` or absent | **TC39 Stage 3 (default)** |

A library that ships TC39-style decorators (`(value, context) => …`) cannot be consumed under the legacy setting; the compiler will report incompatible signature errors. The reverse is also true: legacy decorators using `(target, key, descriptor)` will not type-check or run correctly under stage-3.

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
- **MUST NOT** rely on `reflect-metadata` or `--emitDecoratorMetadata` with stage-3 decorators. The stage-3 proposal "is not compatible with `--emitDecoratorMetadata`" (Microsoft DevBlog, "Announcing TypeScript 5.0"). Runtime type metadata is out of scope for stage-3 and is tracked as a separate TC39 proposal.
- **SHOULD** pick one position for decorators on exported classes. Stage-3 allows `@register export default class Foo {}` or `export default @register class Bar {}`, but a single class "before *and* after is not allowed" (TypeScript 5.0 release notes).
- **MAY** keep framework code that depends on parameter decorators or emitted metadata (for example, DI containers built on parameter injection) on `--experimentalDecorators`. Those frameworks cannot move to stage-3 without an upstream redesign.

## Related Topics

- [FEE-10300 Decorators — Class, Method, and Field Decorators](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10300.md) — proposal-level reference: all decorator kinds with full signatures, `addInitializer` rules, `Symbol.metadata`, and the cross-language history.
- [Classes, Access Modifiers & `#` Private Fields](/en/TypeScript/classes-and-private-fields)
- [Type System Fundamentals & Type Inference](/en/TypeScript/1701)
- [tsconfig & Strict Mode](/en/TypeScript/1706)

## References

- Microsoft, "Announcing TypeScript 5.0," Microsoft DevBlog (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- TypeScript Team, "TypeScript 5.0 Release Notes," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- TC39, "proposal-decorators," GitHub (2023). https://github.com/tc39/proposal-decorators
- TypeScript Team, "Decorators (Handbook)," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/decorators.html
