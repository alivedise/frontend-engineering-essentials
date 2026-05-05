# Findings: Module Decomposition

## Named pattern

**Domain-Sliced Folders**: every top-level directory under `src/` is named after a 3D-graphics responsibility (geometry, materials, lights, cameras, scenes, renderers, ...) so that a folder's name tells you what kind of object lives inside, and cross-folder coupling happens through explicit relative imports rather than a shared utility layer.

## Quantitative anchor

- `src/` contains **685 `.js` files** in total, distributed across **16 responsibility-named subdirectories** plus a handful of top-level entry/aggregator files (`Three.js`, `Three.Core.js`, `Three.WebGPU.js`, `Three.WebGPU.Nodes.js`, `Three.TSL.js`, `Three.Legacy.js`, `constants.js`, `utils.js`).
- File counts per top-level domain (verified with `find ... -name '*.js' | wc -l` at tag `r172`):

  | Domain        | Files |
  |---------------|------:|
  | `renderers`   |   251 |
  | `nodes`       |   196 |
  | `materials`   |    39 |
  | `math`        |    27 |
  | `extras`      |    24 |
  | `geometries`  |    22 |
  | `loaders`     |    19 |
  | `core`        |    18 |
  | `animation`   |    14 |
  | `objects`     |    14 |
  | `helpers`     |    13 |
  | `lights`      |    13 |
  | `textures`    |    13 |
  | `cameras`     |     6 |
  | `audio`       |     5 |
  | `scenes`      |     3 |

  Two domains (`renderers` + `nodes`) hold ~65% of the source files; the other 14 are small and tight.

- `renderers/` is itself sliced **by graphics backend**, not by lifecycle phase. Its direct subdirectories at `r172` are `webgl/`, `webgl-fallback/`, `webgpu/`, `common/`, plus `shaders/` (GLSL chunk library) and `webxr/`. Five render-target classes (`WebGLRenderer.js`, `WebGLRenderTarget.js`, `WebGLArrayRenderTarget.js`, `WebGL3DRenderTarget.js`, `WebGLCubeRenderTarget.js`) sit at the `renderers/` root.

- The two largest single files are both renderer cores, and the third is the node-graph compiler:

  | Rank | File                                         | LOC  |
  |-----:|----------------------------------------------|-----:|
  |    1 | `src/renderers/WebGLRenderer.js`             | 2955 |
  |    2 | `src/renderers/common/Renderer.js`           | 2860 |
  |    3 | `src/nodes/core/NodeBuilder.js`              | 2426 |
  |    4 | `src/renderers/webgl-fallback/WebGLBackend.js` | 2211 |
  |    5 | `src/renderers/webgl/WebGLTextures.js`       | 2185 |
  |    6 | `src/renderers/webgpu/WebGPUBackend.js`      | 2026 |

  Five of the top six files live under `renderers/`, confirming it as the dominant functional cluster.

## Source citations

- **Claim:** `src/` is partitioned into 16 responsibility-named subdirectories plus top-level aggregator files; the directory names themselves declare the domain vocabulary.
  - **Directory:** `src/`
  - **URL:** `https://github.com/mrdoob/three.js/tree/r172/src`
  - **Pulled listing** (output of `ls src/` at `r172`):
    ```
    Three.Core.js
    Three.js
    Three.Legacy.js
    Three.TSL.js
    Three.WebGPU.js
    Three.WebGPU.Nodes.js
    animation
    audio
    cameras
    constants.js
    core
    extras
    geometries
    helpers
    lights
    loaders
    materials
    math
    nodes
    objects
    renderers
    scenes
    textures
    utils.js
    ```

- **Claim:** `WebGLRenderer` is built by composing one collaborator per WebGL concern, each pulled from the sibling `renderers/webgl/` folder via relative imports — the file's import block is itself a structural map of the WebGL backend.
  - **File:** `src/renderers/WebGLRenderer.js`
  - **Lines:** L1-L50
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/renderers/WebGLRenderer.js#L1-L50`
  - **Pulled quote:**
    ```
    import { Color } from '../math/Color.js';
    import { Frustum } from '../math/Frustum.js';
    import { Matrix4 } from '../math/Matrix4.js';
    import { Vector3 } from '../math/Vector3.js';
    import { Vector4 } from '../math/Vector4.js';
    import { WebGLAnimation } from './webgl/WebGLAnimation.js';
    import { WebGLAttributes } from './webgl/WebGLAttributes.js';
    import { WebGLBackground } from './webgl/WebGLBackground.js';
    import { WebGLBindingStates } from './webgl/WebGLBindingStates.js';
    ...
    import { WebGLState } from './webgl/WebGLState.js';
    import { WebGLTextures } from './webgl/WebGLTextures.js';
    import { WebGLUniforms } from './webgl/WebGLUniforms.js';
    ```

- **Claim:** `core/` holds the foundation classes (Object3D, EventDispatcher, Layers) and reaches into `math/` via relative paths, illustrating the convention that cross-domain coupling is expressed as explicit `../<domain>/<File>.js` imports rather than through a shared barrel.
  - **File:** `src/core/Object3D.js`
  - **Lines:** L1-L8
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/core/Object3D.js#L1-L8`
  - **Pulled quote:**
    ```
    import { Quaternion } from '../math/Quaternion.js';
    import { Vector3 } from '../math/Vector3.js';
    import { Matrix4 } from '../math/Matrix4.js';
    import { EventDispatcher } from './EventDispatcher.js';
    import { Euler } from '../math/Euler.js';
    import { Layers } from './Layers.js';
    import { Matrix3 } from '../math/Matrix3.js';
    import { generateUUID } from '../math/MathUtils.js';
    ```

- **Claim:** The public package surface is assembled by re-exporting from each domain folder; `Three.js` is a thin facade over the domain-sliced internals.
  - **File:** `src/Three.js`
  - **Lines:** L1-L9
  - **URL:** `https://github.com/mrdoob/three.js/blob/r172/src/Three.js#L1-L9`
  - **Pulled quote:**
    ```
    export * from './Three.Core.js';

    export { WebGLRenderer } from './renderers/WebGLRenderer.js';
    export { ShaderLib } from './renderers/shaders/ShaderLib.js';
    export { UniformsLib } from './renderers/shaders/UniformsLib.js';
    export { UniformsUtils } from './renderers/shaders/UniformsUtils.js';
    export { ShaderChunk } from './renderers/shaders/ShaderChunk.js';
    export { PMREMGenerator } from './extras/PMREMGenerator.js';
    export { WebGLUtils } from './renderers/webgl/WebGLUtils.js';
    ```

- **Claim:** `renderers/` is sliced by graphics backend (`webgl/`, `webgl-fallback/`, `webgpu/`) with a shared `common/` layer hosting the backend-agnostic `Renderer` (2860 LOC), so swapping the backend is a folder-level concern rather than a per-file concern.
  - **Directory:** `src/renderers/`
  - **URL:** `https://github.com/mrdoob/three.js/tree/r172/src/renderers`
  - **Pulled listing** (output of `ls src/renderers/` at `r172`):
    ```
    WebGL3DRenderTarget.js
    WebGLArrayRenderTarget.js
    WebGLCubeRenderTarget.js
    WebGLRenderTarget.js
    WebGLRenderer.js
    common
    shaders
    webgl
    webgl-fallback
    webgpu
    webxr
    ```

## What to look for elsewhere

To recognize the same pattern in another codebase, run `ls <pkg>/src` and check whether the top-level folder names read as a vocabulary of the project's problem domain (in three.js: `lights`, `cameras`, `geometries`, ...) rather than as technical layers (`controllers`, `services`, `utils`, `types`); pair that with `grep -rE "from '\.\./[a-z]+/" src | sort -u` to confirm cross-folder edges go through named relative imports — when both hold, the codebase is using the domain-sliced-folders pattern.
