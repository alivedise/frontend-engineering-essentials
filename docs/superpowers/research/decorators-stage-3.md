---
topic: Decorators (Stage 3 ECMAScript)
id: 1711
slug: decorators-stage-3
sources_reviewed: 5
claims: 15
---

# Findings: Decorators (Stage 3 ECMAScript)

**Generated:** 2026-04-24
**Target article:** FEE-1711 — decorators-stage-3
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** TypeScript 5.0 shipped the stage-3 ECMAScript decorators proposal as a standard, non-experimental language feature that customizes classes and their members.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "Decorators are an upcoming ECMAScript feature that allow us to customize classes and their members in a reusable way."

### Claim 2

- **Text:** Prior to TS 5.0, decorators required the `--experimentalDecorators` flag; after TS 5.0, decorators are valid syntax by default and are type-checked and emitted under the stage-3 rules unless that flag is set.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "Previously, any attempt to use decorators without `--experimentalDecorators` prompted an error. Now decorators are valid for all new code by default."

### Claim 3

- **Text:** The official TypeScript Handbook "Decorators" page still documents the old (stage-2, experimental) implementation; stage-3 decorators are described on the TS 5.0 release-notes page.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/decorators.html
- **Pulled quote:** "NOTE  This document refers to an experimental stage 2 decorators implementation. Stage 3 decorator support is available since Typescript 5.0."

### Claim 4

- **Text:** A stage-3 decorator is a function that receives the decorated value plus a context object describing the element's kind, name, privacy, static-ness, access, and a hook for registering initializers.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/tc39/proposal-decorators
- **Pulled quote:** "type Decorator = (value: Input, context: { kind: string; name: string | symbol; access: { get?(): unknown; set?(value: unknown): void }; private?: boolean; static?: boolean; addInitializer(initializer: () => void): void; }) => Output | void;"

### Claim 5

- **Text:** Decorators can address classes, methods, getters, setters, fields, and auto-accessors; they cannot decorate constructor parameters.
- **Target section:** Best Practices
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "This new decorators proposal is not compatible with `--emitDecoratorMetadata`, and it does not allow decorating parameters."

### Claim 6

- **Text:** Auto-accessors (`accessor foo = 0;`) are a new class-member form introduced alongside stage-3 decorators; decorating them provides typed `get`/`set`/`init` hooks.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/tc39/proposal-decorators
- **Pulled quote:** "Decorators apply to these kinds: \"class\", \"method\", \"getter\", \"setter\", \"field\", and \"accessor\"."

### Claim 7

- **Text:** A decorator either returns a replacement value with matching semantics or returns nothing (leaving the original in place); returning an incompatible shape is an error.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/tc39/proposal-decorators
- **Pulled quote:** "They can replace the value that is being decorated with a matching value that has the same semantics."

### Claim 8

- **Text:** TypeScript's `ClassMethodDecoratorContext` is the precise context type for a method decorator and carries `name`, `private`, `static`, and `addInitializer`.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "function loggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) { const methodName = String(context.name); function replacementMethod(this: any, ...args: any[]) { console.log(`LOG: Entering method '${methodName}'.`) ... } return replacementMethod; }"

### Claim 9

- **Text:** `addInitializer` lets a decorator register code that runs during construction, which is how helpers like a `bound` decorator inject per-instance binding.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "context.addInitializer(function () { this[methodName] = this[methodName].bind(this); });"

### Claim 10

- **Text:** When decorators are stacked, they apply bottom-up: the innermost (closest to the member) wraps first, and the result is passed outward to the decorators above it.
- **Target section:** Visual
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "class Person { @bound  @loggedMethod  greet() { ... } }  // @bound — Applied second (to the result of @loggedMethod)  // @loggedMethod — Applied first (to the original method)"

### Claim 11

- **Text:** The spec splits decorator semantics into three phases: expressions are evaluated left-to-right, then each decorator is called during class definition, and finally all results are applied together to mutate the constructor and prototype.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/tc39/proposal-decorators
- **Pulled quote:** "Decorators are called (as functions) during class definition, after the methods have been evaluated but before the constructor and prototype have been put together... Decorators are applied (mutating the constructor and prototype) all at once, after all of them have been called."

### Claim 12

- **Text:** Stage-3 decorators can appear before or after `export` / `export default` on a class, but a single class cannot have both leading and trailing decorators around the export keyword.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "@register export default class Foo { ... }  export default @register class Bar { ... }  // error - before *and* after is not allowed   @before export @after class Bar { ... }"

### Claim 13

- **Text:** Existing decorator functions written for `experimentalDecorators` generally will not work under the stage-3 rules because the signatures and emit semantics differ.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- **Pulled quote:** "The type-checking rules and emit are sufficiently different that while decorators can be written to support both the old and new decorators behavior, any existing decorator functions are not likely to do so."

### Claim 14

- **Text:** Stage-3 decorators do not carry `reflect-metadata`-style runtime type metadata: the proposal is explicitly incompatible with `--emitDecoratorMetadata`.
- **Target section:** Best Practices
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "The new decorators proposal is not compatible with `--emitDecoratorMetadata`, and it does not allow decorating parameters."

### Claim 15

- **Text:** The stage-3 design is deliberately narrower than the earlier stage-2 proposal, trading flexibility for a well-scoped mental model and simpler implementation.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/tc39/proposal-decorators
- **Pulled quote:** "The previous Stage 2 decorators proposal was more full-featured than this proposal, including the ability of all decorators to add arbitrary 'extra' class elements... this design deliberately omits these features, in order to keep the meaning of decorators 'well-scoped' and intuitive, and to simplify implementations."

## Reference URLs

- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- https://github.com/tc39/proposal-decorators
- https://www.typescriptlang.org/docs/handbook/decorators.html

## Rejected sources

- https://www.typescriptlang.org/tsconfig#experimentalDecorators — WebFetch returned truncated content; same ground covered authoritatively by TS 5.0 announce and handbook pages.
- https://2ality.com/2022/10/javascript-decorators.html — Axel Rauschmayer personal blog; not cited in favor of standards-body and vendor docs.

## Research notes

- The handbook `/docs/handbook/decorators.html` page still documents **experimental stage-2** decorators. When the writer needs stage-3 content, link to the **TS 5.0 release-notes** page, not the handbook/decorators page. The handbook page itself is useful only to disambiguate the warning.
- Application order: decorators are called top-to-bottom in source but applied innermost-first. Use the `@bound @loggedMethod` handbook example: `@loggedMethod` wraps first, then `@bound` wraps the wrapped result.
- Parameter decorators remain experimental-only. If the article mentions NestJS/Angular/tsyringe, flag that they still rely on `experimentalDecorators` + `emitDecoratorMetadata` and cannot migrate to stage-3 without framework changes.
- `reflect-metadata` / `emitDecoratorMetadata` is out of scope. A separate TC39 "decorator metadata" proposal exists on its own track; don't conflate.
- Browser/runtime status: V8 (Chrome/Node) and Safari have been landing stage-3. Practical transpile paths: TS 5.0+, Babel `@babel/plugin-proposal-decorators` `"2023-05"` / `"2023-11"`.
- Addressable elements (canonical per TC39): class, method, getter, setter, field, auto-accessor. NOT: constructor parameter, method parameter, namespace, module, non-class function.
