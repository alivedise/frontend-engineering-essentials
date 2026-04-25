---
topic: TC39 Signals Proposal — A Standard Reactivity Primitive
id: 612
slug: tc39-signals-proposal
sources_reviewed: 5
claims: 16
---

# Findings: TC39 Signals Proposal — A Standard Reactivity Primitive

**Proposed topic-specific section:** `## Polyfill Integration Pattern`.

## Claims

### Claim 1
- **Text:** TC39 Signals reached Stage 1 on the April 2024 TC39 agenda; remains Stage 1 as authors prioritize multi-framework prototyping.
- **Target section:** Context
- **Source URL:** https://github.com/tc39/proposal-signals
- **Pulled quote:** "This proposal is on the April 2024 TC39 agenda for Stage 1."

### Claim 2
- **Text:** The draft consolidates input from maintainers of every major reactive framework — first time framework reactivity primitives are aligned at the language level.
- **Target section:** Context
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "The current draft is based on design input from the authors/maintainers of Angular, Bubble, Ember, FAST, MobX, Preact, Qwik, RxJS, Solid, Starbeam, Svelte, Vue, Wiz, and more…"

### Claim 3
- **Text:** Public API: `Signal.State` (writable cells) + `Signal.Computed` (derivations) + low-level `Signal.subtle` integration hooks.
- **Target section:** Context
- **Source URL:** https://github.com/proposal-signals/signal-polyfill/blob/main/README.md
- **Pulled quote:** "`Signal.State(value)` creates a single 'cell' of data... `Signal.Computed(callback)` defines a computation based on state or other computations flowing through the graph."

### Claim 4
- **Text:** `subtle` namespace gates advanced framework-integration primitives away from application code, mirroring `crypto.subtle`.
- **Target section:** Context
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "This namespace includes 'advanced' features that are better to leave for framework authors rather than application developers. Analogous to `crypto.subtle`"

### Claim 5
- **Text:** Computed signals observe the dependency graph in a consistent state; no intermediate-tearing.
- **Target section:** Best Practices
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "A computed Signal always observes the Signal graph in a consistent state, and its execution is not interrupted by other Signal-mutating code (except for things it calls itself)."

### Claim 6
- **Text:** Glitch-free: a derived signal never recomputes against an inconsistent snapshot of its inputs.
- **Target section:** Best Practices
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "Computation is '[glitch](https://en.wikipedia.org/wiki/Reactive_programming#Glitches)-free', meaning no unnecessary calculations are ever performed."

### Claim 7
- **Text:** Pull-based evaluation with eager invalidation: write marks dependents dirty immediately; recomputation deferred until read.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "Computations are not eagerly evaluated when they are declared, nor are they immediately evaluated when their dependencies change. They are only evaluated when their value is explicitly requested."

### Claim 8
- **Text:** Pull-based evaluation lets a framework batch UI work to render time and avoid wasted computation in the DOM update path.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "Signals avoid this dynamic by being pull-based, rather than push-based: At the time the framework schedules the rendering of the UI, it will pull the appropriate updates, avoiding wasted work both in computation as well as in writing to the DOM."

### Claim 9
- **Text:** `Signal.subtle.Watcher` registers a callback that fires the first time any signal in its watched set transitions to dirty — the framework hook for scheduling effects/re-renders.
- **Target section:** Polyfill Integration Pattern
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "Add these signals to the Watcher's set, and set the watcher to run its notify callback next time any signal in the set (or one of its dependencies) changes."

### Claim 10
- **Text:** `Watcher.getPending()` returns dirty members of the watched set so a scheduler can pull each pending value once per microtask and re-arm.
- **Target section:** Polyfill Integration Pattern
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "Returns the set of sources in the Watcher's set which are still dirty, or is a computed signal with a source which is dirty or pending and hasn't yet been re-evaluated"

### Claim 11
- **Text:** Official polyfill ships canonical `effect()` recipe — `Signal.subtle.Watcher` whose notify callback enqueues a microtask that drains pending signals and re-watches.
- **Target section:** Example
- **Source URL:** https://github.com/proposal-signals/signal-polyfill/blob/main/README.md
- **Pulled quote:** "let needsEnqueue = true; const w = new Signal.subtle.Watcher(() => { if (needsEnqueue) { needsEnqueue = false; queueMicrotask(processPending); } });"

### Claim 12
- **Text:** `signal-polyfill` is the path to using the API today; README warns it tracks an in-progress proposal and is not for production.
- **Target section:** Best Practices
- **Source URL:** https://github.com/proposal-signals/signal-polyfill/blob/main/README.md
- **Pulled quote:** "⚠️ This polyfill is a preview of an in-progress proposal and could change at any time. Do not use this in production. ⚠️"

### Claim 13
- **Text:** `Signal.subtle` APIs are not for application-level code, only framework/library authors.
- **Target section:** Best Practices
- **Source URL:** https://github.com/proposal-signals/signal-polyfill/blob/main/README.md
- **Pulled quote:** "These APIs are not targeted at application-level code, but rather at framework/library authors."

### Claim 14
- **Text:** Lit team built `SignalWatcher` on top of the standard polyfill — a single shared primitive collapses N framework-specific integrations into one.
- **Target section:** Visual
- **Source URL:** https://lit.dev/blog/2024-10-08-signals/
- **Pulled quote:** "To enable signal-based reactivity in this component, we just use the `SignalWatcher` mixin in our Custom Element definition; any signals we read from will automatically be observed, triggering updates whenever their values change."

### Claim 15
- **Text:** Standardization unlocks interoperability; eliminates bespoke integrations every framework currently builds.
- **Target section:** Related Topics
- **Source URL:** https://lit.dev/blog/2024-10-08-signals/
- **Pulled quote:** "Standardized signals in JavaScript would let us build just one integration (and eventually add signals support directly in Lit's core), and enable interop between signal-using libraries."

### Claim 16
- **Text:** Counter example using `Signal.State` and `Signal.Computed` shows derivations chain (`parity` reads `isEven`, `isEven` reads `counter`) with no explicit subscription wiring.
- **Target section:** Example
- **Source URL:** https://github.com/tc39/proposal-signals/blob/main/README.md
- **Pulled quote:** "const counter = new Signal.State(0); const isEven = new Signal.Computed(() => (counter.get() & 1) == 0); const parity = new Signal.Computed(() => isEven.get() ? \"even\" : \"odd\");"

## Reference URLs

- https://github.com/tc39/proposal-signals
- https://github.com/tc39/proposal-signals/blob/main/README.md
- https://github.com/proposal-signals/signal-polyfill
- https://github.com/proposal-signals/signal-polyfill/blob/main/README.md
- https://lit.dev/blog/2024-10-08-signals/

## Research notes

- No `lib.signals.d.ts` exists in TS lib bundle; types live in proposal README + polyfill .d.ts.
- No native browser implementation as of April 2026; polyfill is the only path.
- Polyfill README's `effect()` snippet is the load-bearing code — use verbatim.
