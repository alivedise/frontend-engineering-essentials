# Findings: The Resource Lifecycle Contract

## Named pattern

**The Dispose Lifecycle Contract** (same name as FEE-1810, since the pattern is the same): a resource-owning class exposes a one-line `dispose()` method whose only job is to fire a `'dispose'` event on the class's built-in `EventDispatcher`. A separate listener — typically the WebGL renderer's resource manager — owns the actual GPU teardown. The owner of the resource declares "I am being released"; the consumer that allocated GPU state for it does the freeing. `EventDispatcher` itself does not implement `dispose()`; the contract is delegated downward to subclasses that own a resource.

## Quantitative anchor

- 180 `dispose`/`destroy`/`release`/`close` call sites across the r172 source tree (lens excerpt).
- The classic resource-owning classes (`BufferGeometry`, `Material`, `Texture`, `WebGLRenderTarget`) all use the one-line dispose-event shape, unchanged in r172.
- The newer shader-nodes subsystem extends the same pattern: `Node.dispose()` at `src/nodes/core/Node.js:282` is byte-identical in shape to the classic one-liner. There are **57 `extends Node` declarations** across `src/nodes/` at r172 (verified via `grep -rn "extends Node" src/nodes/`); the lens excerpt's "54 subclasses" figure is in the same range and reflects an earlier count or a tighter filter.
- Pattern absent from the universal scene-graph base: `src/core/Object3D.js` contains zero `dispose` references at r172. Pattern also absent from the event-dispatcher base: `src/core/EventDispatcher.js` contains zero `dispose` references at r172.

## Source citations

### Citation 1 — Node.js extends the dispose pattern to the shader-nodes subsystem

- **Claim:** The same one-line dispose-event contract used by the classic resource classes is applied verbatim to the new `Node` base class that powers the shader-nodes subsystem (TSL / NodeMaterial), introduced in the r150-series and stable by r172.
- **File:** `src/nodes/core/Node.js`
- **Lines:** L278–L286
- **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/core/Node.js#L278-L286`
- **Pulled quote:**
  ```js
  /**
   * Calling this method dispatches the `dispose` event. This event can be used
   * to register event listeners for clean up tasks.
   */
  dispose() {

      this.dispatchEvent( { type: 'dispose' } );

  }
  ```

### Citation 2 — Classic resource pattern unchanged in r172

- **Claim:** `BufferGeometry`, the canonical resource-owning class, still implements `dispose()` as a single `dispatchEvent` call. The r172 implementation is byte-identical in shape to the `Node.dispose()` body above. This confirms the contract is a reusable shape, not a one-off.
- **File:** `src/core/BufferGeometry.js`
- **Lines:** L1105–L1109
- **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/core/BufferGeometry.js#L1105-L1109`
- **Pulled quote:**
  ```js
  dispose() {

      this.dispatchEvent( { type: 'dispose' } );

  }
  ```

### Citation 3 — EventDispatcher does not define dispose; contract is delegated downward

- **Claim:** The `EventDispatcher` base class — the mechanism every dispose-fire relies on — does not itself define `dispose()`. The contract is intentionally delegated to subclasses that actually own a resource, which is why `Object3D` (a non-resource scene-graph node that extends `EventDispatcher`) also has no `dispose()`.
- **Files:** `src/core/EventDispatcher.js`, `src/core/Object3D.js`
- **Verification:** `grep -n "dispose" src/core/EventDispatcher.js` returns no matches at r172. `grep -n "dispose" src/core/Object3D.js` returns no matches at r172.
- **URLs:**
  - `https://github.com/mrdoob/three.js/blob/r172/src/core/EventDispatcher.js`
  - `https://github.com/mrdoob/three.js/blob/r172/src/core/Object3D.js`

## What to look for elsewhere

Recognition signal for this pattern in any codebase: a `dispose()` method whose entire body is `this.dispatchEvent({ type: 'dispose' })`, present on classes that own GPU/native resources, with **no equivalent on the universal scene-graph or event-dispatcher base**. A second strong signal — the one this lens highlights — is the same one-line shape reappearing verbatim on a newer subsystem's base class (here, `Node` for shader-nodes), evidence that the team treats the contract as a reusable shape across architectural generations rather than a one-off on the original geometry/material/texture trio.

## Cross-link note for the writer

This lens section in the tour should be SHORTER (300–500 words) and end with: "For the full single-pattern treatment, see [FEE-1810 Three.js — The Dispose Lifecycle Contract](/en/Codebase%20Studies/threejs-dispose-lifecycle)."

The angle the tour adds beyond FEE-1810: FEE-1810 establishes the pattern on the classic four resource classes; the tour's contribution is showing that the same one-line shape was carried forward into the shader-nodes subsystem (`Node` + 57 subclasses at r172), which is evidence the contract is a load-bearing convention across architectural generations of the engine, not a legacy quirk of the original WebGL renderer.
