---
topic: Classes, Access Modifiers & `#` Private Fields
id: 1710
slug: classes-and-private-fields
sources_reviewed: 6
claims: 20
---

# Findings: Classes, Access Modifiers & `#` Private Fields

**Generated:** 2026-04-24
**Target article:** FEE-1710 — classes-and-private-fields
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** TypeScript's `public`, `protected`, and `private` access modifiers are enforced only during type checking and do not affect runtime behaviour.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "Like other aspects of TypeScript's type system, `private` and `protected` are only enforced during type checking."

### Claim 2

- **Text:** `public` is the default visibility on class members, so writing it is a style choice rather than a requirement.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "The default visibility of class members is `public`. A `public` member can be accessed anywhere."

### Claim 3

- **Text:** `protected` members are visible to subclasses of the declaring class, and a subclass may widen them to `public`, but sibling access is disallowed.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "`protected` members are only visible to subclasses of the class they're declared in." "TypeScript doesn't allow accessing `protected` members of a sibling class in a class hierarchy."

### Claim 4

- **Text:** TypeScript's `private` is "soft" privacy — the modifier is fully erased at emit, so JavaScript consumers can reach the field through bracket access at runtime.
- **Target section:** Design Thinking
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "TypeScript's `private` modifiers are fully erased — that means that at runtime, it acts entirely like a normal property and there's no way to tell that it was declared with a `private` modifier."

### Claim 5

- **Text:** ECMAScript `#`-prefixed private fields, adopted in TypeScript 3.8, enforce privacy at runtime as part of the stage-3 (now stage-4) class fields proposal.
- **Target section:** Context
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "TypeScript 3.8 brings support for ECMAScript's private fields, part of the stage-3 class fields proposal."

### Claim 6

- **Text:** Private fields are inaccessible and undetectable outside the containing class — a model the TypeScript team calls "hard privacy".
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "Private fields can't be accessed or even detected outside of the containing class - even by JS users! Sometimes we call this hard privacy."

### Claim 7

- **Text:** Accessing a `#` private field on an object that was not constructed by the declaring class throws a `TypeError` at runtime.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "Another thing worth noting is that accessing a private field on any other type will result in a `TypeError`!"

### Claim 8

- **Text:** The TC39 class fields proposal is Stage 4, meaning `#` private fields are part of the ECMAScript standard.
- **Target section:** Context
- **Source URL:** https://github.com/tc39/proposal-class-fields
- **Pulled quote:** "Stage 4"

### Claim 9

- **Text:** Private fields use closure-/WeakMap-like semantics that resist reflection and metaprogramming available to ordinary properties.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/tc39/proposal-class-fields
- **Pulled quote:** "This differs from JavaScript properties, which support various kinds of reflection and metaprogramming, and is instead analogous to mechanisms like closures and WeakMap."

### Claim 10

- **Text:** Because each `#name` is scoped to its declaring class, a subclass declaring `#foo` cannot collide with a parent's `#foo` — regular public properties have no such protection.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "When using ECMAScript `#` private fields, no subclass ever has to worry about collisions in field naming. Every private field name is uniquely scoped to its containing class."

### Claim 11

- **Text:** The `in` operator performs a brand check for private fields, letting code test whether an arbitrary object was constructed by the declaring class.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
- **Pulled quote:** "You can use the `in` operator to check whether an externally defined object possesses a private element. This will return `true` if the private field or method exists, and `false` otherwise."

### Claim 12

- **Text:** Private elements are not part of the prototype chain and are not inherited by subclasses; same-named `#x` declarations in two classes are unrelated.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
- **Pulled quote:** "Private elements are not part of the prototypical inheritance model since they can only be accessed within the current class's body and aren't inherited by subclasses. Private elements with the same name within different classes are entirely different and do not interoperate with each other."

### Claim 13

- **Text:** Parameter properties let the constructor signature declare and assign a field in one step by prefixing a parameter with `public`, `private`, `protected`, or `readonly`.
- **Target section:** Example
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "TypeScript offers special syntax for turning a constructor parameter into a class property with the same name and value. These are called parameter properties and are created by prefixing a constructor argument with one of the visibility modifiers `public`, `private`, `protected`, or `readonly`."

### Claim 14

- **Text:** The `readonly` modifier forbids reassignment of the field outside the constructor, giving properties a compile-time immutability contract.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "Fields may be prefixed with the `readonly` modifier. This prevents assignments to the field outside of the constructor."

### Claim 15

- **Text:** `abstract` classes declare members without implementations and cannot be instantiated directly; concrete subclasses must supply the missing implementations.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "An abstract method or abstract field is one that hasn't had an implementation provided. These members must exist inside an abstract class, which cannot be directly instantiated."

### Claim 16

- **Text:** Inside a class, the type `this` refers dynamically to the current class, enabling polymorphic fluent-builder return types that survive subclassing.
- **Target section:** Visual
- **Source URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Pulled quote:** "In classes, a special type called `this` refers dynamically to the type of the current class."

### Claim 17

- **Text:** TypeScript accessibility modifiers cannot be placed on `#` private fields — the `#` prefix is itself the sole visibility marker.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "TypeScript accessibility modifiers like `public` or `private` can't be used on private fields."

### Claim 18

- **Text:** Hard privacy is especially valuable for library authors, because renaming or removing a `#` field is not a breaking change to external callers.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- **Pulled quote:** "This hard privacy is really useful for strictly ensuring that nobody can take use of any of your internals. If you're a library author, removing or renaming a private field should never cause a breaking change."

### Claim 19

- **Text:** Referencing a `#name` from outside the class is a syntax error; the parser rejects the program before it can run.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
- **Pulled quote:** "It is a syntax error to refer to `#` names from outside of the class. It is also a syntax error to refer to private elements that were not declared in the class body, or to attempt to remove declared elements with delete."

### Claim 20

- **Text:** In TypeScript 5.0, decorators landed as a first-class, reusable way to customise classes, their methods, fields, accessors, and even the class itself.
- **Target section:** Related Topics
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "Decorators are an upcoming ECMAScript feature that allow us to customize classes and their members in a reusable way."

## Reference URLs

- https://www.typescriptlang.org/docs/handbook/2/classes.html
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-3-8/
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- https://github.com/tc39/proposal-class-fields
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties

## Rejected sources

None rejected — all six seed URLs resolved and matched expectations.

## Research notes

- TC39 proposal is now Stage 4. Frame the history as "landed in TS 3.8 when TC39 proposal was at Stage 3; subsequently standardised at Stage 4".
- Handbook Classes page is canonical "soft vs hard private"; TS 3.8 release notes add "fully erased" framing and `TypeError` runtime behaviour.
- MDN is cleanest source for `in` brand check and SyntaxError vs TypeError distinction.
- Parameter properties compile to constructor body assignments but no verbatim quote exists; the writer can show transpilation without a pulled quote.
- Polymorphic `this` coverage thin — lean on Handbook's `Box`/`ClearableBox` example.
- Do NOT over-cite TS 5.0 announce — only Claim 20 is supported by it.
