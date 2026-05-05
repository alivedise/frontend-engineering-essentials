# Codebase analysis

**Clone:** .worktrees/code-base-studies/clones/three
**Source root:** .worktrees/code-base-studies/clones/three/src

## Repo shape

- Source files (js/ts/go/py/rs): 685
- Top-level subdirs of source root: 16 (animation audio cameras core extras geometries helpers lights loaders materials math nodes objects renderers scenes textures )
- License (first line): The MIT License
- First commit: 2024-12-31T17:51:51+08:00
- Latest commit: 2024-12-31T17:51:51+08:00
- Total commits: 1
- Recent tags: r172 

### Top 20 biggest source files

```
2955 renderers/WebGLRenderer.js
2860 renderers/common/Renderer.js
2426 nodes/core/NodeBuilder.js
2211 renderers/webgl-fallback/WebGLBackend.js
2185 renderers/webgl/WebGLTextures.js
2026 renderers/webgpu/WebGPUBackend.js
1555 renderers/webgpu/nodes/WGSLNodeBuilder.js
1353 objects/BatchedMesh.js
1331 renderers/webgl/WebGLState.js
1327 nodes/materialx/lib/mx_noise.js
1225 renderers/webgpu/utils/WebGPUTextureUtils.js
1183 loaders/ObjectLoader.js
1166 renderers/webgl/WebGLUniforms.js
1165 materials/nodes/NodeMaterial.js
1113 core/BufferGeometry.js
1084 renderers/webgl/WebGLProgram.js
1035 renderers/webgl-fallback/nodes/GLSLNodeBuilder.js
1024 core/Object3D.js
1010 nodes/math/MathNode.js
950 renderers/webgl-fallback/utils/WebGLTextureUtils.js
```

## Class graph

- Total `extends` edges: 377
- Universal base: `Node` (54 direct subclasses)
- Max chain depth: 6
- Longest chain: `ViewportDepthTextureNode -> ViewportTextureNode -> TextureNode -> UniformNode -> InputNode -> Node -> EventDispatcher`

(Full edge list at `extends-edges.txt`.)

## Modules

- Entry file: Three.js
- Top-level exports from entry: 8

### File-naming clusters (≥3 files sharing a prefix)

```
6 Three
3 Vector
3 Matrix
3 Line
3 BRDF
3 Box
```

## Hot path heuristics

- Function/method hits for render|tick|update|step|loop: 82

## Extension points

- register/use/extend/addPlugin function hits: 2
- Dedicated plugin/extension/addon dir: no

## Resource lifecycle

- dispose/destroy/release/close call sites: 180

## Build & test

- `package.json` scripts: 0
- Test directories detected: 1
