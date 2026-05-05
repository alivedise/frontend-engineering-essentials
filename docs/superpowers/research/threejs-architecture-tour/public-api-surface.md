# Findings: Public API Surface

## Named pattern

**Two-tier Barrel-Indexed Public API**: a single ESM entry file (`src/Three.js`) re-exports renderer-coupled identifiers and then `export *`s a second core barrel (`src/Three.Core.js`), so every public name is reached in exactly one re-export hop from the package entry.

## Quantitative anchor

The package entry resolves through `package.json` → `module: "./build/three.module.js"`, which is a Rollup bundle of `src/Three.js`. `src/Three.js` itself is 9 lines: 1 wildcard re-export (`export * from './Three.Core.js'`) and 7 named re-exports of renderer-tier classes (`WebGLRenderer`, `ShaderLib`, `UniformsLib`, `UniformsUtils`, `ShaderChunk`, `PMREMGenerator`, `WebGLUtils`).

`src/Three.Core.js` adds 156 more `export { Foo } from './path/Foo.js'` (or `export * from './path/Bar.js'`) lines covering scenes, objects, textures, geometries, materials, loaders, lights, cameras, audio, animation, core (BufferGeometry, Object3D, Raycaster…), math, helpers, curves, extras, constants, and the legacy shim. Transitive named exports through one re-export hop come out to **164** identifiers.

Split summary:

| Tier              | File              | Direct lines | Role                                                     |
| ----------------- | ----------------- | ------------ | -------------------------------------------------------- |
| Renderer-loaded   | `src/Three.js`    | 8 exports    | WebGL renderer + shader chunk libs (the heavy graph)     |
| Core types        | `src/Three.Core.js` | 156 exports | Math, scene graph, geometries, materials, loaders, etc.  |

`src/Three.js` in full (r172):

```js
export * from './Three.Core.js';

export { WebGLRenderer } from './renderers/WebGLRenderer.js';
export { ShaderLib } from './renderers/shaders/ShaderLib.js';
export { UniformsLib } from './renderers/shaders/UniformsLib.js';
export { UniformsUtils } from './renderers/shaders/UniformsUtils.js';
export { ShaderChunk } from './renderers/shaders/ShaderChunk.js';
export { PMREMGenerator } from './extras/PMREMGenerator.js';
export { WebGLUtils } from './renderers/webgl/WebGLUtils.js';
```

The split is not cosmetic. Renderer-tier identifiers live in `Three.js` so that consumers who do not need the WebGL renderer (e.g. node tests, math-only utilities, a future WebGPU front-end) can still import the core barrel without dragging in WebGL shader source. Everything below renderer level — including the entire scene graph — is reachable from `Three.Core.js` alone.

## Source citations

- **Claim:** `src/Three.js` is 9 lines: one wildcard re-export of the core barrel plus seven named renderer-tier re-exports.
  - **File:** `src/Three.js`
  - **Lines:** L1-L9
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/Three.js#L1-L9`
  - **Pulled quote:**
    ```js
    export * from './Three.Core.js';

    export { WebGLRenderer } from './renderers/WebGLRenderer.js';
    export { ShaderLib } from './renderers/shaders/ShaderLib.js';
    export { UniformsLib } from './renderers/shaders/UniformsLib.js';
    export { UniformsUtils } from './renderers/shaders/UniformsUtils.js';
    export { ShaderChunk } from './renderers/shaders/ShaderChunk.js';
    export { PMREMGenerator } from './extras/PMREMGenerator.js';
    export { WebGLUtils } from './renderers/webgl/WebGLUtils.js';
    ```

- **Claim:** `src/Three.Core.js` opens with the math/scene/object/texture/geometry/material/loader/light/camera/audio/animation re-exports that constitute the bulk of the public surface. The barrel mixes single-name `export { Foo }` lines with `export *` lines that fan out further (e.g. geometries, materials, curves, BufferAttribute, constants, the Three.Legacy shim).
  - **File:** `src/Three.Core.js`
  - **Lines:** L1-L36, L157-L158
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/Three.Core.js#L1-L36` and `https://github.com/mrdoob/three.js/blob/r172/src/Three.Core.js#L157-L158`
  - **Pulled quote (L1-L17, abbreviated):**
    ```js
    import { REVISION } from './constants.js';

    export { WebGLArrayRenderTarget } from './renderers/WebGLArrayRenderTarget.js';
    export { WebGL3DRenderTarget } from './renderers/WebGL3DRenderTarget.js';
    export { WebGLCubeRenderTarget } from './renderers/WebGLCubeRenderTarget.js';
    export { WebGLRenderTarget } from './renderers/WebGLRenderTarget.js';
    export { FogExp2 } from './scenes/FogExp2.js';
    export { Fog } from './scenes/Fog.js';
    export { Scene } from './scenes/Scene.js';
    export { Sprite } from './objects/Sprite.js';
    export { LOD } from './objects/LOD.js';
    export { SkinnedMesh } from './objects/SkinnedMesh.js';
    export { Skeleton } from './objects/Skeleton.js';
    export { Bone } from './objects/Bone.js';
    export { Mesh } from './objects/Mesh.js';
    export { InstancedMesh } from './objects/InstancedMesh.js';
    export { BatchedMesh } from './objects/BatchedMesh.js';
    ```
  - **Pulled quote (L36-L37, L145, L157-L158) showing the wildcard fan-out:**
    ```js
    export * from './geometries/Geometries.js';
    export * from './materials/Materials.js';
    // ...
    export * from './extras/curves/Curves.js';
    // ...
    export * from './constants.js';
    export * from './Three.Legacy.js';
    ```

- **Claim:** Internal consumers (the `examples/jsm/` add-ons, treated as a separate package via `package.json` `exports['./addons/*']`) reach every type through the bare `'three'` specifier and rely on the barrel. `GLTFLoader.js` pulls 65+ named identifiers in a single import statement, none of which reference an internal path.
  - **File:** `examples/jsm/loaders/GLTFLoader.js`
  - **Lines:** L1-L67
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/examples/jsm/loaders/GLTFLoader.js#L1-L67`
  - **Pulled quote (head + tail):**
    ```js
    import {
      AnimationClip,
      Bone,
      Box3,
      BufferAttribute,
      BufferGeometry,
      // ... 60+ identifiers omitted ...
      VectorKeyframeTrack,
      SRGBColorSpace,
      InstancedBufferAttribute
    } from 'three';
    ```

- **Claim:** The bare `'three'` specifier resolves to the bundled barrel via the package entry-point map. `package.json` declares `"type": "module"` and exports `"."` to `./build/three.module.js` (the Rollup output of `src/Three.js`).
  - **File:** `package.json`
  - **Lines:** L7-L17
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/package.json#L7-L17`
  - **Pulled quote:**
    ```json
    "type": "module",
    "main": "./build/three.cjs",
    "module": "./build/three.module.js",
    "exports": {
      ".": {
        "import": "./build/three.module.js",
        "require": "./build/three.cjs"
      },
      "./examples/fonts/*": "./examples/fonts/*",
      "./examples/jsm/*": "./examples/jsm/*",
      "./addons": "./examples/jsm/Addons.js",
    ```

## What to look for elsewhere

To spot the same pattern in another codebase, grep the `src/` (or `lib/`) root for a single file dominated by `export { X } from './path/X.js'` and `export * from './...'` lines with no implementation logic, and cross-check that `package.json`'s `"exports"."."` (or `"module"`/`"main"`) field points at a build artifact whose source is exactly that file. A two-tier split is signalled when that entry's first line is `export * from './<Name>.Core.js'` (or `.Base`, `.Common`, `.Internal`) and the renderer / platform-specific names sit above the wildcard.
