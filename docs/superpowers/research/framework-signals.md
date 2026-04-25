---
topic: Framework Signals — A Cross-Implementation Mental Model
id: 611
slug: framework-signals
sources_reviewed: 11
claims: 16
---

# Findings: Framework Signals — A Cross-Implementation Mental Model

**Proposed topic-specific section:** `## Cross-Framework API Comparison`.

## Claims

### Claim 1
- **Text:** A signal is a reactive value container that notifies dependents when it changes, providing the foundation for declarative state propagation in modern UI frameworks.
- **Target section:** Context
- **Source URL:** https://angular.dev/guide/signals
- **Pulled quote:** "A signal is a wrapper around a value that notifies interested consumers when that value changes."

### Claim 2
- **Text:** The same primitive shape — value container with dependency tracking on read and effect triggering on mutation — has converged across Vue refs, Solid signals, Preact signals, and Angular signals.
- **Target section:** Context
- **Source URL:** https://vuejs.org/guide/extras/reactivity-in-depth.html
- **Pulled quote:** "Fundamentally, signals are the same kind of reactivity primitive as Vue refs. It's a value container that provides dependency tracking on access, and side-effect triggering on mutation."

### Claim 3
- **Text:** Solid's `createSignal` returns a getter/setter pair. Reading the getter inside a tracking scope auto-subscribes the surrounding computation.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://docs.solidjs.com/concepts/signals
- **Pulled quote:** "You can create a signal by calling the `createSignal` function... This function takes an initial value as an argument, and returns a pair of functions: a **getter** function, and a **setter** function."

### Claim 4
- **Text:** Solid's `createEffect` and derived computations subscribe to whichever signals they read; no manual dependency array.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://docs.solidjs.com/concepts/effects
- **Pulled quote:** "Solid automatically tracks the dependencies of an effect, so you do not need to manually specify them."

### Claim 5
- **Text:** Solid's `createMemo` produces a cached derived value that recomputes only when tracked dependencies change, and skips downstream notification when the recomputed value is unchanged.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://docs.solidjs.com/concepts/derived-values/memos
- **Pulled quote:** "Memos are optimized to execute only once for each change in their dependencies." "will not trigger subsequent updates if its dependencies change but its value remains the same"

### Claim 6
- **Text:** Preact Signals expose value through `.value` on a stable object, so signal identity is preserved while the value mutates.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://preactjs.com/guide/v10/signals/
- **Pulled quote:** "A signal is an object with a `.value` property that holds a value...a signal's value can change, but the signal itself always stays the same."

### Claim 7
- **Text:** Preact Signals ship as a framework-agnostic core (`@preact/signals-core`) with bindings for Preact and React.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://preactjs.com/guide/v10/signals/
- **Pulled quote:** "These are framework-agnostic tools from the Signals library. While they work great with Preact, they're not Preact-specific."

### Claim 8
- **Text:** A Vue `ref` is a reactive value container — `.value` reads tracked, writes trigger associated effects — matching signal semantics.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://vuejs.org/api/reactivity-core.html
- **Pulled quote:** "The ref object is mutable - i.e. you can assign new values to `.value`. It is also reactive - i.e. any read operations to `.value` are tracked, and write operations will trigger associated effects."

### Claim 9
- **Text:** Vue 3.5 refactored its reactivity core; reactivity memory −56% and tracking on deeply reactive arrays up to 10× faster.
- **Target section:** Deep Dive
- **Source URL:** https://blog.vuejs.org/posts/vue-3-5
- **Pulled quote:** "In 3.5, Vue's reactivity system has undergone another major refactor that achieves better performance and significantly improved memory usage (**-56%**) with no behavior changes." "3.5 also optimizes reactivity tracking for large, deeply reactive arrays, making such operations up to 10x faster in some cases."

### Claim 10
- **Text:** Angular's `computed()` is read-only derived; `effect()` re-runs whenever any signal it reads changes.
- **Target section:** Cross-Framework API Comparison
- **Source URL:** https://angular.dev/guide/signals
- **Pulled quote:** "Computed signal are read-only signals that derive their value from other signals." "Executing an `effect`, `afterRenderEffect` callback...Angular creates a live connection. If a tracked signal changes, Angular will eventually re-run the consumer."

### Claim 11
- **Text:** Signals enable Angular's zoneless change detection: a signal write directly notifies the framework, eliminating Zone.js patching of browser APIs.
- **Target section:** Best Practices
- **Source URL:** https://angular.dev/guide/zoneless
- **Pulled quote:** "ZoneJS uses DOM events and async tasks as indicators of when application state _might_ have updated" — "Updating a signal that's read in a template" listed as a zoneless trigger.

### Claim 12
- **Text:** Signals use push-pull evaluation: state mutation pushes invalidation through the dependency graph; computed values are pulled lazily on read. Glitch-free invariant — consumers never observe inconsistent intermediate state.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/tc39/proposal-signals
- **Pulled quote:** "Signals avoid this dynamic by being pull-based, rather than push-based: At the time the framework schedules the rendering of the UI, it will pull the appropriate updates, avoiding wasted work." "Evaluation of computed Signals is pull-based...At the same time, changing a State signal may immediately trigger a Watcher's callback, 'pushing' the notification."

### Claim 13
- **Text:** Computed signals auto-discover their dependencies during execution — no manual subscription list — mirroring every framework signal implementation.
- **Target section:** Visual
- **Source URL:** https://github.com/tc39/proposal-signals
- **Pulled quote:** "A computed Signal automatically discovers any other Signals that it is dependent on, whether those Signals be simple values or other computations."

### Claim 14
- **Text:** Each framework's signal implementation has its own auto-tracking mechanism. Solid signals, Vue refs, Preact signals, Angular signals are NOT runtime-interoperable — motivating the TC39 standardization effort.
- **Target section:** Best Practices
- **Source URL:** https://github.com/tc39/proposal-signals
- **Pulled quote:** "Each Signal implementation has its own auto-tracking mechanism...This makes it hard to share models, components, and libraries between different frameworks."

### Claim 15
- **Text:** Fine-grained reactivity through signals targets DOM updates at the precise attribute that depends on the changed value, avoiding the broader recomputation a virtual-DOM diff performs.
- **Target section:** Design Thinking
- **Source URL:** https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity
- **Pulled quote:** "In a fine-grained reactive system an application will now have the ability to make highly _targeted and specific_ updates." "In Solid, updates are made to the targeted attribute that needs to be changed."

### Claim 16
- **Text:** In Solid the order in which subscribed effects fire on a signal update is not guaranteed — application code MUST NOT rely on cross-effect ordering.
- **Target section:** Best Practices
- **Source URL:** https://docs.solidjs.com/concepts/effects
- **Pulled quote:** "When a signal updates, it notifies all of its subscribers sequentially but the _order can vary_." "The order of execution of effects is _not guaranteed_ and should not be relied upon."

## Reference URLs

- https://docs.solidjs.com/concepts/signals
- https://docs.solidjs.com/concepts/effects
- https://docs.solidjs.com/concepts/derived-values/memos
- https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity
- https://preactjs.com/guide/v10/signals/
- https://angular.dev/guide/signals
- https://angular.dev/guide/zoneless
- https://vuejs.org/api/reactivity-core.html
- https://vuejs.org/guide/extras/reactivity-in-depth.html
- https://blog.vuejs.org/posts/vue-3-5
- https://github.com/tc39/proposal-signals

## Research notes

- The TC39 signals proposal is the cleanest single source for the cross-framework mental model.
- "Glitch-free" terminology only appears verbatim in the TC39 proposal; attribute the term to the proposal.
- Preact's Babel/SWC transform exists but isn't deeply documented in the main guide.
- Cross-Framework API Comparison is the article's load-bearing custom section.
