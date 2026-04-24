---
id: 1710
title: "Classes, Access Modifiers & `#` Private Fields"
state: draft
slug: classes-and-private-fields
category: TypeScript
level: mid
allow_no_custom_section: true
# reason: article fully covered by standard sections; soft-vs-hard privacy and the deep dive already occupy the topic-specific angle without needing a separate heading.
---

# [FEE-1710] Classes, Access Modifiers & `#` Private Fields

:::info
TypeScript classes carry two parallel privacy systems. The `public`, `protected`, and `private` keywords live at the type layer and vanish at emit. The `#`-prefixed field syntax, standardised by TC39 at Stage 4, enforces privacy at runtime with closure-like semantics. This article explains when each one applies, how they differ, and which guarantees libraries can actually rely on.
:::

## Context

TypeScript inherited a C#-flavoured class model well before JavaScript had one. The Handbook Classes reference describes `public`, `protected`, and `private` as compile-time visibility modifiers: "Like other aspects of TypeScript's type system, `private` and `protected` are only enforced during type checking." The emitted JavaScript contains ordinary properties with no runtime metadata about their declared visibility.

TC39 took a different path. The class fields proposal introduced a new syntactic form, `#name`, whose privacy is part of the language rather than the type system. TypeScript 3.8 (2020) adopted the feature: "TypeScript 3.8 brings support for ECMAScript's private fields, part of the stage-3 class fields proposal." The proposal has since advanced to Stage 4 on the TC39 tracker, which means `#` private fields are now part of the ECMAScript standard and ship in every modern engine.

The two systems now coexist. The TypeScript modifiers still exist for type-level intent and for subclass-facing contracts. The `#` syntax covers anything that must remain hidden from callers at runtime. Choosing between them is the central decision in modern TypeScript class design.

## Visual

| Axis                            | `public`        | `protected`             | `private` (TS)          | `#private` (ECMAScript)    |
| ------------------------------- | --------------- | ----------------------- | ----------------------- | -------------------------- |
| Enforced at runtime             | N/A (visible)   | No                      | No                      | Yes (TypeError)            |
| Enforced at compile time        | N/A             | Yes                     | Yes                     | Yes (SyntaxError)          |
| Visible to subclasses           | Yes             | Yes                     | No                      | No                         |
| Visible to sibling classes      | Yes             | No                      | No                      | No                         |
| On the prototype chain          | Yes (methods)   | Yes (methods)           | Yes (methods)           | No                         |
| Reflection-resistant            | No              | No                      | No                      | Yes                        |
| Erased from emitted JS          | N/A             | Yes                     | Yes                     | No                         |
| Allowed alongside the other set | Yes             | Yes                     | Yes (with `readonly`)   | Cannot combine with TS modifiers |

The last row reflects the rule that TypeScript accessibility modifiers cannot decorate a `#` field: "TypeScript accessibility modifiers like `public` or `private` can't be used on private fields."

## Example

### Parameter properties

Parameter properties compress the common "declare-then-assign" pattern into the constructor signature. The Handbook describes the rule: "TypeScript offers special syntax for turning a constructor parameter into a class property with the same name and value. These are called parameter properties and are created by prefixing a constructor argument with one of the visibility modifiers `public`, `private`, `protected`, or `readonly`."

```ts
class Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
    private label: string,
  ) {}

  describe() {
    return `${this.label}: (${this.x}, ${this.y})`;
  }
}

const p = new Point(1, 2, "origin");
p.describe(); // "origin: (1, 2)"
```

The emitted JavaScript assigns each parameter onto `this` inside the constructor body. The visibility modifiers do not survive into the output, so a plain JavaScript caller can still read `p.label` at runtime.

### `in` brand check with `#` fields

The `in` operator doubles as a brand check for private fields. MDN documents the behaviour: "You can use the `in` operator to check whether an externally defined object possesses a private element. This will return `true` if the private field or method exists, and `false` otherwise."

```ts
class Money {
  #amount: number;
  #currency: string;

  constructor(amount: number, currency: string) {
    this.#amount = amount;
    this.#currency = currency;
  }

  static isMoney(value: unknown): value is Money {
    return typeof value === "object" && value !== null && #amount in value;
  }

  add(other: Money): Money {
    if (this.#currency !== other.#currency) throw new Error("currency mismatch");
    return new Money(this.#amount + other.#amount, this.#currency);
  }
}

Money.isMoney(new Money(10, "USD")); // true
Money.isMoney({ amount: 10 });        // false — no #amount brand
```

The brand check succeeds for instances the class itself constructed and fails for any look-alike object, which gives user-defined type guards a runtime signal that ordinary structural typing cannot supply.

## Best Practices

- **MAY** omit `public`: the default visibility is `public`, so writing the keyword is a style choice. The Handbook notes: "The default visibility of class members is `public`. A `public` member can be accessed anywhere."
- **SHOULD** use `protected` for base-class extension points. `protected` members are visible to subclasses of the declaring class and a subclass may widen them to `public`, but sibling access is disallowed.
- **MUST** reach for `#` private fields when the goal is true encapsulation. External JavaScript callers cannot read `#` fields through bracket access or any reflection API; TypeScript `private` is erased at emit.
- **MUST NOT** combine TypeScript modifiers with `#` syntax. "TypeScript accessibility modifiers like `public` or `private` can't be used on private fields" — the `#` prefix is already the sole visibility marker.
- **SHOULD** mark ingest-only properties with `readonly` to forbid reassignment outside the constructor: "Fields may be prefixed with the `readonly` modifier. This prevents assignments to the field outside of the constructor."
- **MAY** model open hierarchies with `abstract`. Abstract members have no implementation; the class cannot be instantiated directly, and a concrete subclass must supply the missing parts.
- **SHOULD** prefer `#` fields for library internals. The TS 3.8 release notes highlight the contract: "If you're a library author, removing or renaming a private field should never cause a breaking change."

## Design Thinking

TypeScript's original `private` sits on the type-checking side of the compiler. The type system knows a member is private; the runtime does not. The TS 3.8 release notes spell this out: "TypeScript's `private` modifiers are fully erased — that means that at runtime, it acts entirely like a normal property and there's no way to tell that it was declared with a `private` modifier." That design is usually called "soft privacy" because determined callers can still reach the field through bracket access or by dropping the type annotation.

The TC39 proposal made a different trade. Private fields use closure- or WeakMap-like semantics that resist reflection and metaprogramming: "This differs from JavaScript properties, which support various kinds of reflection and metaprogramming, and is instead analogous to mechanisms like closures and WeakMap." That closes the backdoor that soft privacy leaves open, at the cost of giving up features callers sometimes rely on — iteration via `Object.keys`, cloning via spread, and so on.

Stage 4 standardisation matters for two reasons. First, the feature is now part of the language rather than a transpiler affordance, so older down-level targets are no longer the baseline assumption. Second, downstream tooling — type-checkers, bundlers, debuggers — can rely on the semantics being stable. Use `#` when the field must never leak. Use TypeScript `private` when the goal is an API contract that code review can enforce without runtime support.

## Deep Dive

**`TypeError` vs `SyntaxError`.** Two different error classes guard `#` fields. Parsing detects references to names that the declaring class never introduces: "It is a syntax error to refer to `#` names from outside of the class. It is also a syntax error to refer to private elements that were not declared in the class body, or to attempt to remove declared elements with delete." The runtime guards the opposite case: a reference is syntactically valid inside the class, but the receiver is a stranger. The TS 3.8 notes describe that path: "accessing a private field on any other type will result in a `TypeError`!"

**Subclass collision immunity.** Every `#name` is scoped to its declaring class, which removes an entire category of inheritance bug. The TS 3.8 notes describe the property: "When using ECMAScript `#` private fields, no subclass ever has to worry about collisions in field naming. Every private field name is uniquely scoped to its containing class." Two classes in the same hierarchy can both declare `#state` and keep independent storage.

**Prototype non-inheritance.** Private elements are not part of the prototype chain and are not inherited by subclasses. MDN: "Private elements are not part of the prototypical inheritance model since they can only be accessed within the current class's body and aren't inherited by subclasses. Private elements with the same name within different classes are entirely different and do not interoperate with each other." A method that touches `this.#foo` only works on instances of the class that declared `#foo`.

**Hard privacy boundary.** The combination of the rules above produces what the TypeScript team labels "hard privacy": "Private fields can't be accessed or even detected outside of the containing class — even by JS users! Sometimes we call this hard privacy." No test from outside the class — `in`, `hasOwnProperty`, debugger inspection, `JSON.stringify` — can surface the field.

**Polymorphic `this`.** Separate from privacy, TypeScript provides a polymorphic `this` type inside class bodies: "In classes, a special type called `this` refers dynamically to the type of the current class." A builder method that returns `this` retains the subclass type when called on a subclass instance, which makes fluent APIs survive inheritance without generic gymnastics.

## Related Topics

- [Type System Fundamentals & Type Inference](/en/TypeScript/1701)
- [Decorators (Stage 3 ECMAScript)](/en/TypeScript/decorators-stage-3)
- [tsconfig & Strict Mode](/en/TypeScript/1706)

## References

- Microsoft, "Classes — TypeScript Handbook," TypeScript documentation (2024). https://www.typescriptlang.org/docs/handbook/2/classes.html
- Daniel Rosenwasser, "Announcing TypeScript 3.8 — ECMAScript Private Fields," TypeScript Release Notes (2020). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- Daniel Rosenwasser, "Announcing TypeScript 3.8," Microsoft DevBlogs (2020). https://devblogs.microsoft.com/typescript/announcing-typescript-3-8/
- Daniel Rosenwasser, "Announcing TypeScript 5.0," Microsoft DevBlogs (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- TC39, "Class field declarations for JavaScript (proposal-class-fields)," TC39 proposals (2021). https://github.com/tc39/proposal-class-fields
- MDN contributors, "Private properties — JavaScript," MDN Web Docs (2024). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
