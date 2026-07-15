---
id: 611
title: "Framework Signals (Solid, Vue, Preact, Angular)"
state: draft
slug: framework-signals
---

# [FEE-611] Framework Signals (Solid, Vue, Preact, Angular)

:::info
Solid, Vue, Preact, and Angular each ship a signal-style reactive primitive, and the four arrived at the same shape: a value container that records its readers at read time and re-runs them on write. The differences that remain (getter call versus `.value`, equality defaults, effect semantics) are deliberate design decisions, and comparing them is the most direct way to understand both how fine-grained reactivity works and what the TC39 Signals proposal is trying to unify. This article covers the userland implementations and the shared algorithm underneath them; the language-level proposal itself is covered in [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md).
:::

## Context

The primitive is older than every framework in this article's title. Knockout.js shipped `observable` and `computed` in 2010, fine-grained reactivity is a variation of the classic Observer pattern, and the three-part vocabulary of state, derived state, and effect predates all four frameworks in the table below. S.js introduced reactive ownership in 2013 (a computation owns its child computations and disposes them when it re-runs), and MobX pioneered the push-pull hybrid in 2015 with the guarantee that "each part of the system would only run once" per change. Solid distilled that lineage into the modern surface with `createSignal`, returning a getter/setter pair. Vue's Composition API exposes the same primitive shape through `ref()`. Preact ships signals as a framework-agnostic core (`@preact/signals-core`) with bindings for Preact and React. Angular stabilized `signal()` and `computed()` in v17; `effect()` followed in v20. Svelte 5's runes run on the same model while treating signals as "an under-the-hood implementation detail," which is why Svelte offers no signal object to put in the comparison table. Four teams converging on one primitive by way of that shared lineage is what makes the remaining divergences worth studying: each is a considered design decision, and together they form the raw material for the TC39 unification effort whose proposal-level story belongs to [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md).

## Visual

| Aspect            | Solid                          | Vue                             | Preact                          | Angular                         |
| ----------------- | ------------------------------ | ------------------------------- | ------------------------------- | ------------------------------- |
| Read syntax       | `count()` (getter call)        | `count.value`                   | `count.value`                   | `count()` (signal call)         |
| Write syntax      | `setCount(next)` (setter)      | `count.value = next`            | `count.value = next`            | `count.set(next)` / `count.update(fn)` |
| Equality default  | Skips when new value `===` old; `equals` option overrides | Triggers only when the new value differs (`Object.is`-style check) | Skips when the assigned value equals the current one | `Object.is`-style: skips when unchanged |
| Computed primitive| `createMemo`                   | `computed`                      | `computed`                      | `computed`                      |
| Effect primitive  | `createEffect`                 | `watchEffect` / `watch`         | `effect`                        | `effect`                        |

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

One asymmetry worth noting: an Angular signal is itself the getter function, so it can be passed around like Solid's standalone getter, while `set` and `update` live as methods on that same function object rather than as a separate setter.

## Best Practices

- **MUST** treat each framework's signal as a non-portable runtime primitive. Each implementation has its own auto-tracking mechanism, and signals from one framework do not subscribe consumers in another, which is the explicit motivation for the TC39 standardization effort.
- **MUST NOT** rely on the order in which subscribed effects fire on a signal update in Solid. The `createEffect` reference states "The order of runs among multiple effects is not guaranteed."
- **SHOULD NOT** write to signals from inside an effect. Solid's effects guide flags signal writes inside effects as an infinite-loop risk, Angular's effect guide warns against using effects to propagate state changes, and React gives the equivalent advice for `useEffect`: "If your Effect only adjusts some state based on other state, you might not need an Effect."
- **SHOULD** prefer signal writes over Zone.js-patched async APIs to drive change detection in Angular. The Angular zoneless guide lists "updating a signal that's read in a template" as a zoneless trigger, and zoneless change detection is the default from Angular v21, so signal-driven updates are the baseline rather than a migration target.
- **SHOULD** keep signal identity stable across mutations when designing a Preact-style API. A Preact signal is "an object with a `.value` property…a signal's value can change, but the signal itself always stays the same," which lets consumers hold a reference to the container instead of re-reading from a parent on every change.
- **MAY** rely on framework auto-tracking instead of declaring dependency arrays for derived computations. Solid's `createEffect` documentation states "Solid automatically tracks the dependencies of an effect, so you do not need to manually specify them."

## Design Thinking

Every signal core balances the same two failure modes. A push system evaluates as soon as a source changes; it over-recomputes, and diamond dependencies can glitch, because a node reachable from one source through two paths updates twice and briefly exposes an inconsistent intermediate value. A pull system evaluates only when read; it stays consistent but re-walks the dependency graph on every access. The hybrid MobX landed on in 2015 is what every framework in the table now runs, and Reactively later made the mechanism explicit with three-color marking (dirty, check, clean): a write pushes cheap flags down the graph, a read pulls values up, and only nodes whose inputs actually changed recompute.

The implementations diverge mainly in the data structures behind that hybrid. Preact Signals v1.2 replaced Set-based dependency tracking with doubly-linked lists of shared nodes, which makes subscribe and unsubscribe O(1) and lets nodes be recycled across re-runs. It also tracks staleness with version numbers (one per signal plus one global) instead of dirty flags, because a lazy computed "could hang on to outdated and potentially expensive values indefinitely"; when the global version has not moved since the last read, a computed skips its dependency check entirely. A node that has been notified but has not yet re-run does not forward notifications, which cuts off glitch cascades.

alien-signals, written by Vue language-tools author Johnson Chu, pushes the same ideas further. Its README describes it as exploring "a push-pull based signal algorithm" and names Vue 3, Preact, Svelte, and Reactively as influences. The core forbids Array, Set, and Map, forbids recursion (graph traversal is iterative), and represents every dependency relationship as a doubly-linked list; Chu's conclusion from benchmarking on the js-reactivity-benchmark suite (itself descended from Reactively's) is that "maintaining algorithmic simplicity offers more significant improvements than complex scheduling strategies." The algorithm flowed back into Vue through vuejs/core PR #12349, authored by Chu and merged by Evan You in December 2024, bringing roughly 13% lower memory usage and roughly 1x-3.6x speedups depending on operation, with over 30x (scaling with graph size) in the pathological many-computeds case. That rewritten core ships in Vue 3.6, which has moved through alpha and beta since July 2025 and remains in beta as of mid-2026 (the latest stable release is still on the 3.5 line); Vue 3.6's opt-in Vapor Mode, which compiles components to render without a virtual DOM, rides the same core. vuejs/language-tools depends on alien-signals directly, while XState ported the algorithm into @xstate/store's atom architecture, and the package is usable standalone (at v3.2.x it exports `signal`, `computed`, `effect`, and `effectScope` from its root, with the lower-level `createReactiveSystem()` available via the `alien-signals/system` entry point). Inside Vue it stays an internal detail: the public surface remains `ref`, `computed`, and `watchEffect`.

## Cross-Framework API Comparison

The table shows one shape wearing four surfaces: reads split between getter calls and `.value` access, writes between a dedicated setter, plain assignment, and `set`/`update` methods. Every cell in the read-syntax row is an interception point, because subscription in a signal system happens at read time. While an effect or computed runs, it is tracked globally as the currently-running computation, and any signal read during that window registers a subscription for it. This is why reads must happen inside a tracking scope; copying a signal's current value into a plain variable (or destructuring it) severs reactivity, since the plain variable no longer triggers a read on access, and this is also why auto-tracking distinguishes signals from event emitters, where subscriptions are registered explicitly instead of formed during execution.

Each runtime's tracking context only sees computations created inside that runtime, so a signal from one framework does not subscribe consumers in another. The ecosystem's working answer is Preact's package split: state logic lives in a framework-agnostic core (`@preact/signals-core`) and thin bindings map each framework's read/write surface onto it.

The equality cells in the table are defaults, and two of the four expose a public knob: Solid's `createSignal` accepts an `equals` option that replaces or disables the `===` check, and Angular's `signal()` and `computed()` accept a custom equality function. Vue and Preact document no override. Vue's `ref` additionally makes object values deeply reactive by default; `shallowRef` opts out when that depth is unwanted.

### Signal `effect` vs React `useEffect`

The name collides with React's `useEffect`, and the collision is misleading. React documents `useEffect` as a way to "run some code after rendering so that you can synchronize your component with some system outside of React"; effects "run at the end of a commit after the screen updates," and the dependency array is declared by hand and enforced by lint ("You can't 'choose' your dependencies"). A React effect re-runs only because a render happened and its declared dependencies changed between renders. It holds no subscription to anything.

A signal effect is a node in the reactivity graph. Solid's docs define effects as "functions that are triggered when the signals they depend on change": they run once on initialization, then re-run whenever a dependency changes. Angular defines an effect as "an operation that runs whenever one or more signal values change," runs it at least once, executes it asynchronously during change detection, and tracks only the signals read in the most recent execution. Preact's `effect()` runs immediately and auto-subscribes to every signal read inside it, and because Preact signals live outside the component tree, the effect needs no component to exist.

The distilled contrast: a signal effect is created once, subscribed through auto-tracked reads, re-run by data writes, and valid outside any component; `useEffect` is a post-commit callback, re-considered only when a render happens, gated by a manually declared dependency array, holding no subscription. The one point where every camp agrees is the anti-pattern: writing state from inside an effect, which Solid flags as an infinite-loop risk, Angular warns against for state propagation, and React answers with "you might not need an Effect." The TC39 proposal takes a position here too: effects are deliberately excluded from the proposed standard, which specifies only the low-level `Signal.subtle.Watcher` for frameworks to build their own effect scheduling on.

## Related Topics

- [FEE-10005 Signals — Reactive Primitives in the Language](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) — the TC39 proposal-level treatment of this primitive: history, glitch-free invariant, polyfill internals.
- [React 19 Form State](/en/State%20Management/react-19-form-state) — contrasting hook cooperation with the signal model.
- [XState v5 Actor Model](/en/State%20Management/xstate-v5-actor-model) — contrasting orchestrated state machines with fine-grained signal graphs.

## References

- Ryan Carniato, "The Evolution of Signals in JavaScript," dev.to (2023). https://dev.to/this-is-learning/the-evolution-of-signals-in-javascript-8ob
- Ryan Carniato, "A Hands-on Introduction to Fine-Grained Reactivity," dev.to (2021). https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf
- Joachim Viide, "Signal Boosting," preactjs.com (2022). https://preactjs.com/blog/signal-boosting/
- Lee Mighdoll, "Super Charging Fine-Grained Reactive Performance," dev.to (2022). https://dev.to/modderme123/super-charging-fine-grained-reactive-performance-47ph
- Johnson Chu, "alien-signals," GitHub (2026). https://github.com/stackblitz/alien-signals
- Johnson Chu, "vuejs/core PR #12349 (alien-signals reactivity port)," GitHub (2024). https://github.com/vuejs/core/pull/12349
- Vue.js, "v3.6.0-alpha.1," GitHub Releases (2025). https://github.com/vuejs/core/releases/tag/v3.6.0-alpha.1
- React, "Synchronizing with Effects," react.dev (2026). https://react.dev/learn/synchronizing-with-effects
- Angular, "Signal effects," angular.dev (2026). https://angular.dev/guide/signals/effect
- TC39, "JavaScript Signals standard proposal," GitHub (2026). https://github.com/tc39/proposal-signals
- Svelte, "Introducing runes," svelte.dev (2023). https://svelte.dev/blog/runes
- Solid, "Signals," docs.solidjs.com (2026). https://docs.solidjs.com/concepts/signals
- Solid, "Effects," docs.solidjs.com (2026). https://docs.solidjs.com/concepts/effects
- Solid, "createEffect," docs.solidjs.com (2026). https://docs.solidjs.com/reference/basic-reactivity/create-effect
- Solid, "Memos," docs.solidjs.com (2026). https://docs.solidjs.com/concepts/derived-values/memos
- Preact, "Signals," preactjs.com (2026). https://preactjs.com/guide/v10/signals/
- Angular, "Signals," angular.dev (2026). https://angular.dev/guide/signals
- Angular, "Zoneless," angular.dev (2026). https://angular.dev/guide/zoneless
- Vue, "Reactivity API: Core," vuejs.org (2026). https://vuejs.org/api/reactivity-core.html
- Vue, "Reactivity in Depth," vuejs.org (2026). https://vuejs.org/guide/extras/reactivity-in-depth.html
