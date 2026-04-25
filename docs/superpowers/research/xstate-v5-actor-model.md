---
topic: XState v5 — The Actor Model and System Identification
id: 614
slug: xstate-v5-actor-model
sources_reviewed: 8
claims: 17
---

# Findings: XState v5 — The Actor Model and System Identification

**Proposed topic-specific section:** `## Actor Lifecycle: invoke vs spawn`.

## Claims

### Claim 1
- **Text:** v5 actor model is the foundational runtime abstraction. A running state machine is an actor that communicates only by async message passing.
- **Target section:** Context
- **Source URL:** https://stately.ai/docs/actor-model
- **Pulled quote:** "When you run a state machine in XState, it becomes an actor. Actors communicate with other actors by sending and receiving events asynchronously."

### Claim 2
- **Text:** Actors process events sequentially through an internal mailbox — strong ordering inside any single actor.
- **Target section:** Context
- **Source URL:** https://stately.ai/docs/actors
- **Pulled quote:** "Actors process one message at a time. They have an internal 'mailbox' that acts like an event queue, processing events sequentially."

### Claim 3
- **Text:** Each actor is encapsulated; can only mutate its own state; the only way to share data is by sending events.
- **Target section:** Context
- **Source URL:** https://stately.ai/docs/actor-model
- **Pulled quote:** "An actor has its own internal, encapsulated state that can only be updated by the actor itself." "The only way for an actor to share data is by sending events."

### Claim 4
- **Text:** Every actor exposes `send` (push events), `subscribe` (observe snapshots), `getSnapshot` (read state synchronously).
- **Target section:** Best Practices
- **Source URL:** https://stately.ai/docs/actors
- **Pulled quote:** "You can read an actor's snapshot synchronously via `actor.getSnapshot()`, or you can subscribe to snapshots via `actor.subscribe(observer)`." "Now the actor can receive events [via] `actor.send({ type: 'someEvent' })`"

### Claim 5
- **Text:** v5 ships five built-in actor logic types: state machine, promise, callback, observable, transition.
- **Target section:** Context
- **Source URL:** https://stately.ai/docs/actors
- **Pulled quote:** "Actors created from state machine actor logic can receive events, send events to other actors, invoke/spawn child actors, emit snapshots of its state, output a value..." "Actors created from callback logic can receive events via the `receive` function, send events to the parent actor via the `sendBack` function." "Actors created from transition logic can receive events, emit snapshots of its state."

### Claim 6
- **Text:** Promise and observable actors are receive-only: sending events is a no-op.
- **Target section:** Deep Dive
- **Source URL:** https://stately.ai/docs/actors
- **Pulled quote:** "Sending events to promise actors will have no effect." "Sending events to observable actors will have no effect."

### Claim 7
- **Text:** Callback actors created with `fromCallback` use `sendBack` so the child can push events back to the parent.
- **Target section:** Example
- **Source URL:** https://stately.ai/docs/migration
- **Pulled quote:** "Use `fromCallback(({ sendBack, receive, input }) => { ... })` for callback-based actors that need bidirectional communication."

### Claim 8
- **Text:** `invoke` ties an actor's lifecycle to the state that declares it: actor starts on entry, stops on exit.
- **Target section:** Actor Lifecycle: invoke vs spawn
- **Source URL:** https://stately.ai/docs/invoke
- **Pulled quote:** "The invoked actor will start when the state is entered, and stop when the state is exited."

### Claim 9
- **Text:** Reach for `spawn` instead of `invoke` when an actor must outlive a single state, when count is dynamic, or when you need to keep the `ActorRef` in context to message it later.
- **Target section:** Actor Lifecycle: invoke vs spawn
- **Source URL:** https://stately.ai/docs/spawn
- **Pulled quote:** "Sometimes invoking actors may not be flexible enough for your needs. For example, you might want to: Invoke child machines that last across *several* states [or] Invoke a *dynamic number* of actors."

### Claim 10
- **Text:** Spawned actors don't get cleaned up automatically; ActorRef stored in context MUST be removed when no longer needed or it leaks.
- **Target section:** Actor Lifecycle: invoke vs spawn
- **Source URL:** https://stately.ai/docs/spawn
- **Pulled quote:** "However, if you use `spawn`, **make sure you remove the ActorRef from `context` to prevent memory leaks** when the spawned actor is no longer needed."

### Claim 11
- **Text:** `systemId` registers an actor in the actor system; any other actor can look it up via `system.get(systemId)`, decoupling cross-actor messaging from explicit ref passing.
- **Target section:** Best Practices
- **Source URL:** https://stately.ai/docs/system
- **Pulled quote:** "Actors can be registered with the system so that any other actor in the system can obtain a reference to it." "You can also reference a specific actor from the system using `system.get('actorId')`."

### Claim 12
- **Text:** Both `invoke` and `spawn` accept `systemId`; root actor's id is configured through `createActor(machine, { systemId })`.
- **Target section:** Example
- **Source URL:** https://stately.ai/docs/system
- **Pulled quote:** "The root of a system can also be explicitly assigned a `systemId` in the `createActor(...)` function." "Invoked actors are registered with a system-wide `systemId` in the `invoke` object."

### Claim 13
- **Text:** v5 replaces v4 `interpret(machine)` with `createActor(machine, options)`.
- **Target section:** Best Practices
- **Source URL:** https://stately.ai/docs/migration
- **Pulled quote:** "The `interpret()` function has been renamed to `createActor()`"

### Claim 14
- **Text:** `setup({ types, actors, actions, guards })` is the v5-recommended way to declare a strongly typed machine factory.
- **Target section:** Example
- **Source URL:** https://stately.ai/docs/setup
- **Pulled quote:** "In XState version 5, you can now use the `setup({ ... })` function to setup types and sources for your machines." "Move action, actor, guard, etc. sources from the 2nd argument of `createMachine(config, sources)` to `setup({ ... })`"

### Claim 15
- **Text:** v4→v5 breaking changes: `cond` → `guard`, `schema` → `types`, `send(...)` → `raise`/`sendTo`, action implementations take `{ context, event }` object.
- **Target section:** Best Practices
- **Source URL:** https://stately.ai/docs/migration
- **Pulled quote:** "The `cond` transition property for guarded transitions is now called `guard`" "Implementation functions now take in a single argument: an object with `context`, `event`, and other properties." "The `send(...)` action creator is removed. Use `raise(...)` for sending events to self or `sendTo(...)`"

### Claim 16
- **Text:** Passing `inspect` callback into `createActor` streams actor-creation, actor-to-actor communication, and snapshot-change events for devtools/observability.
- **Target section:** Deep Dive
- **Source URL:** https://stately.ai/docs/inspector
- **Pulled quote:** "When you pass in the `inspect` option to the actor options in XState's `createActor(machine, options)` function, it will automatically send all of these inspection events" "There are currently three kinds of events sent: Actor creation events, Actor-to-actor communication events, Actor snapshot changes"

### Claim 17
- **Text:** Visual: v5 actor system as a graph of mailbox-bearing nodes; root actor created by `createActor`, children registered by invoke/spawn under their `systemId`, message arrows for `send`/`sendBack` between them.
- **Target section:** Visual
- **Source URL:** https://stately.ai/docs/actors
- **Pulled quote:** "When you create an actor from actor logic via `createActor(actorLogic)`, you implicitly create an actor system where the created actor is the root actor."

## Reference URLs

- https://stately.ai/docs/actor-model
- https://stately.ai/docs/actors
- https://stately.ai/docs/system
- https://stately.ai/docs/invoke
- https://stately.ai/docs/spawn
- https://stately.ai/docs/setup
- https://stately.ai/docs/migration
- https://stately.ai/docs/inspector

## Research notes

- v5 docs deliberately drop "service" terminology; use "actor" throughout.
- Actor Lifecycle (invoke vs spawn) is the strongest unique angle — survives "could this be a Best Practices bullet?" test.
- Pick `fromPromise` + `fromCallback` for Example (one-shot async vs bidirectional bridge with `sendBack`).
