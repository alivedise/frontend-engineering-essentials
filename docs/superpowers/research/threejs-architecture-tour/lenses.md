# Lenses for Three.js Architecture Tour

Five lenses fire for Three.js r172. The 4-lens floor is met; the 6-lens cap is not exceeded. Two candidate lenses do not fire and are noted at the bottom.

## Fired (covered in the article)

### 1. `## Class Hierarchy & Inheritance`

**Anchors:**
- 377 `extends` edges across the codebase
- Six parallel inheritance trees rooted at `EventDispatcher`: `Object3D` (17 direct subclasses, scene graph), `BufferGeometry` (17, geometry attributes), `Material` (15, classic materials), `NodeMaterial` (15, node-graph materials), `Texture` (10), `Loader` (13)
- The largest hierarchy is `Node` (54 direct subclasses, the shader-nodes subsystem in `src/nodes/`)
- Max chain depth 6: `ViewportDepthTextureNode → ViewportTextureNode → TextureNode → UniformNode → InputNode → Node → EventDispatcher`
- `EventDispatcher` is the universal root with 10 direct children (covering scene graph, GPU resources, animation, controls, XR)

This is the single most distinctive thing about Three.js's architecture — multiple parallel hierarchies all rooted at the event-dispatching base.

### 2. `## Module Decomposition`

**Anchors:**
- 685 source files across 16 top-level subdirectories of `src/`
- Top-level directories named by responsibility: `animation`, `audio`, `cameras`, `core`, `extras`, `geometries`, `helpers`, `lights`, `loaders`, `materials`, `math`, `nodes`, `objects`, `renderers`, `scenes`, `textures`
- `renderers/` is the largest functional cluster, with sub-subdirectories `webgl/`, `webgl-fallback/`, `webgpu/`, `common/`
- Largest single file is `renderers/WebGLRenderer.js` at 2955 LOC; #2 is `renderers/common/Renderer.js` at 2860 LOC

### 3. `## Public API Surface`

**Anchors:**
- The entry file `src/Three.js` has 8 `export` statements; 7 of those are re-exports of named classes (WebGLRenderer, ShaderLib, UniformsLib, etc.) and 1 is `export * from './Three.Core.js'`
- `src/Three.Core.js` adds 156 more `export { Foo } from './path/Foo.js'` lines
- Transitive named exports through one re-export hop: 164
- The re-export pattern means readers traverse exactly one indirection (`Three.js` or `Three.Core.js`) to find any exposed identifier

### 4. `## Hot Path / Render Loop`

**Anchors:**
- 82 function/method hits for `render`/`tick`/`update`/`step`/`loop` keywords
- `WebGLRenderer.js` (2955 LOC) is the largest source file and contains the central per-frame render entry point
- The newer `renderers/common/Renderer.js` (2860 LOC) is the abstract render coordinator shared between WebGL and WebGPU backends
- `nodes/core/NodeBuilder.js` (2426 LOC) compiles the shader node graph at render-time

### 5. `## Resource Lifecycle Contract` (cross-links to satellite FEE-1810)

**Anchors:**
- 180 `dispose`/`destroy`/`release`/`close` call sites across the codebase
- Resource-owning classes (`BufferGeometry`, `Material`, `Texture`, `WebGLRenderTarget`) define a one-line `dispose()` that fires a `'dispose'` event on their `EventDispatcher` base
- The newer `Node` class (54 subclasses) follows the same shape: `Node.dispose()` at line 282 of `src/nodes/core/Node.js` calls `dispatchEvent({ type: 'dispose' })`
- `EventDispatcher` itself does NOT define `dispose()` — the contract is delegated to subclasses that own a resource

**Cross-link:** [FEE-1810 Three.js — The Dispose Lifecycle Contract](/en/Codebase%20Studies/threejs-dispose-lifecycle) covers this pattern in single-pattern depth. The tour section is shorter (300-500 words) and points readers to the satellite for the full treatment.

## Did not fire

- **Extension Points:** keyword hits 2, threshold not cleared. No top-level `plugins/`/`extensions/`/`addons/` folder. Three.js doesn't expose a plugin system — extensions like `OrbitControls`, post-processing passes, and loaders are just classes the user instantiates.
- **Build & Test Layout:** `package.json` scripts count was 0 in the analysis (the analyzer reads the package.json `scripts` field); test directories detected: 1. Threshold of "scripts > 5 OR multiple test directories OR non-trivial build config" is not cleared on the first two. Three.js does have rollup-based build config at `utils/build/rollup.config.js`, but the lens is not load-bearing for the tour's architectural story.
