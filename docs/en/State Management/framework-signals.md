---
id: 611
title: "Framework Signals (Solid, Vue, Preact, Angular)"
state: draft
slug: framework-signals
---

# [FEE-611] Framework Signals (Solid, Vue, Preact, Angular)

:::info
Solid, Vue, Preact, and Angular each ship their own signal-style reactive primitive in userland. The shape converges (a value container with read-time tracking and write-time effect triggering) but the APIs diverge on read syntax, write syntax, equality default, and computed/effect names. This article is the API-surface reference for cross-framework library authors. The language-level proposal that aims to unify these implementations is covered in [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md).
:::

## Context

The cross-framework signal primitive — its history, glitch-free semantics, and the TC39 standardization effort — is treated at the proposal level in [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md). This article narrows to the userland APIs each framework ships today. Solid established the modern surface with `createSignal`, returning a getter/setter pair. Vue's Composition API exposes the same primitive shape through `ref()`. Preact ships signals as a framework-agnostic core (`@preact/signals-core`) with bindings for Preact and React. Angular shipped signals as a stable API in v17. Knowing where the four diverge — read syntax, equality default, naming — determines whether a single core can back four bindings or whether each framework needs its own adapter.

## Scenario

A library author building a state container for a shared design system needs to decide which reactive primitive to expose, since the same component logic may run inside a Solid app, a Vue app, a Preact app, or an Angular app.

## Best Practices

- **MUST** treat each framework's signal as a non-portable runtime primitive. Each implementation has its own auto-tracking mechanism, and signals from one framework do not subscribe consumers in another, which is the explicit motivation for the TC39 standardization effort.
- **MUST NOT** rely on the order in which subscribed effects fire on a signal update in Solid. The Solid documentation states "the order can vary" and "the order of execution of effects is not guaranteed and should not be relied upon."
- **SHOULD** prefer signal writes over Zone.js-patched async APIs to drive change detection in Angular. The Angular zoneless guide lists "updating a signal that's read in a template" as a zoneless trigger, eliminating Zone.js patching of browser APIs.
- **SHOULD** keep signal identity stable across mutations when designing a Preact-style API. A Preact signal is "an object with a `.value` property…a signal's value can change, but the signal itself always stays the same," which lets consumers hold a reference to the container instead of re-reading from a parent on every change.
- **MAY** rely on framework auto-tracking instead of declaring dependency arrays for derived computations. Solid's `createEffect` documentation states "Solid automatically tracks the dependencies of an effect, so you do not need to manually specify them."

## Example

Solid:

```js
import { createSignal } from "solid-js";
const [count, setCount] = createSignal(0);
console.log(count());        // 0
setCount(count() + 1);
```

Vue:

```js
import { ref } from "vue";
const count = ref(0);
console.log(count.value);    // 0
count.value++;
```

Preact:

```js
import { signal } from "@preact/signals-core";
const count = signal(0);
console.log(count.value);    // 0
count.value++;
```

Angular:

```ts
import { signal } from "@angular/core";
const count = signal(0);
console.log(count());        // 0
count.set(count() + 1);
```

Each snippet covers the read/write surface documented for its framework: Solid's getter/setter pair, Vue's `.value` accessor on a `ref`, Preact's `.value` on the signal object, and Angular's call-the-signal read with `set`/`update` writes.

## Cross-Framework API Comparison

| Aspect            | Solid                          | Vue                             | Preact                          | Angular                         |
| ----------------- | ------------------------------ | ------------------------------- | ------------------------------- | ------------------------------- |
| Read syntax       | `count()` (getter call)        | `count.value`                   | `count.value`                   | `count()` (signal call)         |
| Write syntax      | `setCount(next)` (setter)      | `count.value = next`            | `count.value = next`            | `count.set(next)` / `count.update(fn)` |
| Equality default  | Skips updates when memo value is unchanged | `ref` shallow / `reactive` deep | `.value` write triggers when assigned | `Object.is`-style: skips when unchanged |
| Computed primitive| `createMemo`                   | `computed`                      | `computed`                      | `computed`                      |
| Effect primitive  | `createEffect`                 | `watchEffect` / `watch`         | `effect`                        | `effect`                        |

The read and write rows are anchored in the Solid `createSignal` getter/setter contract, the Vue `ref` `.value` semantics, the Preact `.value` accessor on a stable signal object, and the Angular signals guide. The equality row reflects Solid memo skip-on-equal behavior and the documented reactivity behavior of each framework's container.

## Internal References

- [FEE-10005 Signals — Reactive Primitives in the Language](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) — the TC39 proposal-level treatment of this primitive: history, glitch-free invariant, polyfill internals.
- FEE-616 — React 19 form state, contrasting hook cooperation with the signal model.
- FEE-614 — XState v5 actor model, contrasting orchestrated state machines with fine-grained signal graphs.

## References

- Solid, "Signals," docs.solidjs.com. https://docs.solidjs.com/concepts/signals
- Solid, "Effects," docs.solidjs.com. https://docs.solidjs.com/concepts/effects
- Solid, "Memos," docs.solidjs.com. https://docs.solidjs.com/concepts/derived-values/memos
- Preact, "Signals," preactjs.com. https://preactjs.com/guide/v10/signals/
- Angular, "Signals," angular.dev. https://angular.dev/guide/signals
- Angular, "Zoneless," angular.dev. https://angular.dev/guide/zoneless
- Vue, "Reactivity API: Core," vuejs.org. https://vuejs.org/api/reactivity-core.html
- Vue, "Reactivity in Depth," vuejs.org. https://vuejs.org/guide/extras/reactivity-in-depth.html
