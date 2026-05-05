# Findings: Class Hierarchy & Inheritance

## Named pattern

**Event-Rooted Forest**: a small, fixed set of subsystem-root classes (scene graph, geometry, material, texture, shader-node) all extend a single `EventDispatcher` mixin-class, producing several parallel inheritance trees that share one observable substrate but never cross-merge below the root.

## Quantitative anchor

The `extends-edges.txt` artifact lists 375 inheritance edges across the r172 tree (the lens excerpt rounds to 377; the two-edge gap was not reconciled — see "Numbers I could not verify" at the bottom). `EventDispatcher` is the direct parent of ten classes — `AnimationMixer`, `BufferGeometry`, `Controls`, `Material`, `Node`, `Object3D`, `RenderTarget`, `Texture`, `UniformsGroup`, `WebXRManager` — and these ten roots fan out into the rest of the codebase. Five of those ten host the largest subtrees: `Object3D` has 17 direct subclasses (scene graph: `Mesh`, `Camera`, `Light`, `Scene`, `Bone`, `LOD`, …), `BufferGeometry` has 17 (`BoxGeometry`, `SphereGeometry`, `InstancedBufferGeometry`, …), `Material` has 15 (`MeshStandardMaterial`, `LineBasicMaterial`, …), `Texture` has 10 (`CubeTexture`, `DataTexture`, `VideoTexture`, …), and `Node` has 54 — the largest single hierarchy, the entire shader-graph subsystem under `src/nodes/`. `NodeMaterial` adds another 15 direct subclasses but is itself a grandchild of `EventDispatcher` via `Material`. The lens excerpt also lists `Loader` (13 direct subclasses) as a sixth `EventDispatcher`-rooted tree; verification against r172 shows `Loader` is its own root and does NOT extend `EventDispatcher`. The longest chain measured is six edges deep: `ViewportDepthTextureNode` → `ViewportTextureNode` → `TextureNode` → `UniformNode` → `InputNode` → `Node` → `EventDispatcher`, every link verified against source below.

## Source citations

- **Claim:** `EventDispatcher` is a plain class (no `extends`) defined as the event-pub/sub substrate that other roots inherit from.
  - **File:** `src/core/EventDispatcher.js`
  - **Lines:** L5-L9
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/core/EventDispatcher.js#L5-L9`
  - **Pulled quote:** `class EventDispatcher {\n\n\taddEventListener( type, listener ) {\n\n\t\tif ( this._listeners === undefined ) this._listeners = {};`

- **Claim:** `Object3D` (scene-graph root) extends `EventDispatcher` directly.
  - **File:** `src/core/Object3D.js`
  - **Lines:** L4-L4, L31-L36
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/core/Object3D.js#L31-L36`
  - **Pulled quote:** `class Object3D extends EventDispatcher {\n\n\tconstructor() {\n\n\t\tsuper();\n\n\t\tthis.isObject3D = true;`

- **Claim:** `BufferGeometry` (geometry-attribute root) extends `EventDispatcher` directly, parallel to `Object3D`.
  - **File:** `src/core/BufferGeometry.js`
  - **Lines:** L22-L28
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/core/BufferGeometry.js#L22-L28`
  - **Pulled quote:** `class BufferGeometry extends EventDispatcher {\n\n\tconstructor() {\n\n\t\tsuper();\n\n\t\tthis.isBufferGeometry = true;`

- **Claim:** `Material` (classic material root) extends `EventDispatcher` directly.
  - **File:** `src/materials/Material.js`
  - **Lines:** L8-L8
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/materials/Material.js#L8`
  - **Pulled quote:** `class Material extends EventDispatcher {`

- **Claim:** `Texture` (texture root, 10 direct subclasses) extends `EventDispatcher` directly.
  - **File:** `src/textures/Texture.js`
  - **Lines:** L20-L20
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/textures/Texture.js#L20`
  - **Pulled quote:** `class Texture extends EventDispatcher {`

- **Claim:** `Node` — root of the 54-direct-subclass shader-graph subsystem in `src/nodes/` — also extends `EventDispatcher`, putting the node graph on the same observable substrate as the scene graph.
  - **File:** `src/nodes/core/Node.js`
  - **Lines:** L14-L14
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/core/Node.js#L14`
  - **Pulled quote:** `class Node extends EventDispatcher {`

- **Claim:** `Mesh` is one of `Object3D`'s 17 direct subclasses, demonstrating that the scene-graph subtree never re-roots into a different parent.
  - **File:** `src/objects/Mesh.js`
  - **Lines:** L27-L27
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/objects/Mesh.js#L27`
  - **Pulled quote:** `class Mesh extends Object3D {`

- **Claim:** Longest chain link 1 — `ViewportDepthTextureNode extends ViewportTextureNode`.
  - **File:** `src/nodes/display/ViewportDepthTextureNode.js`
  - **Lines:** L18-L18
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/display/ViewportDepthTextureNode.js#L18`
  - **Pulled quote:** `class ViewportDepthTextureNode extends ViewportTextureNode {`

- **Claim:** Longest chain link 2 — `ViewportTextureNode extends TextureNode`.
  - **File:** `src/nodes/display/ViewportTextureNode.js`
  - **Lines:** L23-L23
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/display/ViewportTextureNode.js#L23`
  - **Pulled quote:** `class ViewportTextureNode extends TextureNode {`

- **Claim:** Longest chain link 3 — `TextureNode extends UniformNode`.
  - **File:** `src/nodes/accessors/TextureNode.js`
  - **Lines:** L19-L19
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/accessors/TextureNode.js#L19`
  - **Pulled quote:** `class TextureNode extends UniformNode {`

- **Claim:** Longest chain link 4 — `UniformNode extends InputNode`.
  - **File:** `src/nodes/core/UniformNode.js`
  - **Lines:** L12-L12
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/core/UniformNode.js#L12`
  - **Pulled quote:** `class UniformNode extends InputNode {`

- **Claim:** Longest chain link 5 — `InputNode extends Node`, completing the 6-edge depth from `ViewportDepthTextureNode` to `EventDispatcher`.
  - **File:** `src/nodes/core/InputNode.js`
  - **Lines:** L9-L9
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/nodes/core/InputNode.js#L9`
  - **Pulled quote:** `class InputNode extends Node {`

- **Claim:** Counterexample to the lens excerpt — `Loader`, parent of 13 file-format loaders, is its own root and does NOT extend `EventDispatcher`. The Loader subtree is a separate tree, not a sixth `EventDispatcher` branch.
  - **File:** `src/loaders/Loader.js`
  - **Lines:** L3-L3
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/loaders/Loader.js#L3`
  - **Pulled quote:** `class Loader {`

## What to look for elsewhere

Grep for a single base class that several otherwise-unrelated subsystem roots all extend (often called `EventEmitter`, `EventTarget`, `Observable`, or `Subject`), then count how many `class X extends <thatBase>` declarations sit at top level versus nested deeper — when 5+ subsystem roots share one observable substrate but their subtrees never cross-inherit, you are looking at the same Event-Rooted Forest pattern.

## Numbers I could not verify

- **377 vs 375 extends edges:** the lens excerpt cites 377; `extends-edges.txt` contains 375 lines. Two-edge gap not reconciled in this pass (likely an off-by-two in the analysis script's edge counter, or the excerpt was rounded). All structural claims (subtree sizes, direct-children counts, chain depth) are independently verified against source and edges file.
- **"Six parallel inheritance trees rooted at EventDispatcher" including Loader:** verified false against r172 source. Loader is its own root. The correct count is five large `EventDispatcher`-rooted trees plus a sixth large independent `Loader` tree.
