---
topic: Three.js — The Dispose Lifecycle Contract
id: 1801
slug: threejs-dispose-lifecycle
studied_at: "three.js r172 (2025-04-15)"
sources_reviewed: 11
claims: 14
---

# Findings: Three.js — The Dispose Lifecycle Contract

**Proposed topic-specific section:** `## The Dispose Lifecycle Contract`.

## Claims

### Claim 1
- **Text:** Three.js does not free GPU-side resources automatically; the engine requires the application to call `dispose()` on resource-owning objects, with explicit per-class rules for geometries, materials, textures, and render targets.
- **Target section:** Context
- **Source URL:** https://threejs.org/manual/en/how-to-dispose-of-objects.html
- **Pulled quote:** "A geometry usually represents vertex information defined as a collection of attributes. *three.js* internally creates an object of type WebGLBuffer for each attribute. These entities are only deleted if you call `BufferGeometry.dispose()`."

### Claim 2
- **Text:** The universal scene-graph base `Object3D` extends `EventDispatcher` and exposes lifecycle hooks for rendering and shadows, but does not own any GPU resources and therefore has no `dispose()` method — disposal is delegated to subclasses that own the resource.
- **Target section:** Context
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/core/Object3D.js
- **Pulled quote:** "class Object3D extends EventDispatcher {" (no occurrence of "dispose" in the file)

### Claim 3
- **Text:** `BufferGeometry.dispose()` itself only fires a `'dispose'` event; it performs no GPU work directly.
- **Target section:** The Dispose Lifecycle Contract
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/core/BufferGeometry.js
- **Pulled quote:** "dispose() {\n\n\tthis.dispatchEvent( { type: 'dispose' } );\n\n}"

### Claim 4
- **Text:** `Material.dispose()` is identical in shape — `dispatchEvent({ type: 'dispose' })` and nothing else; the class extends `EventDispatcher`.
- **Target section:** The Dispose Lifecycle Contract
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/materials/Material.js
- **Pulled quote:** "class Material extends EventDispatcher {" and "dispose() {\n\n\tthis.dispatchEvent( { type: 'dispose' } );\n\n}"

### Claim 5
- **Text:** `Texture.dispose()` follows the same one-line `dispatchEvent` pattern; `Texture` also extends `EventDispatcher`.
- **Target section:** The Dispose Lifecycle Contract
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/textures/Texture.js
- **Pulled quote:** "class Texture extends EventDispatcher {" and "dispose() {\n\tthis.dispatchEvent( { type: 'dispose' } );\n}"

### Claim 6
- **Text:** `EventDispatcher` is the pub-sub primitive that backs every `dispose()` method in the resource hierarchy; it provides `addEventListener`, `removeEventListener`, and `dispatchEvent`.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/core/EventDispatcher.js
- **Pulled quote:** "/**\n * https://github.com/mrdoob/eventdispatcher.js/\n */\n\nclass EventDispatcher {"

### Claim 7
- **Text:** The actual GPU teardown for geometries lives inside the renderer module `WebGLGeometries`, which subscribes to the `'dispose'` event and removes attribute buffers, wireframe attributes, binding states, and decrements the geometry counter.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/webgl/WebGLGeometries.js
- **Pulled quote:** "geometry.addEventListener( 'dispose', onGeometryDispose );" and "function onGeometryDispose( event ) {\n\n\tconst geometry = event.target;\n\n\tif ( geometry.index !== null ) {\n\n\t\tattributes.remove( geometry.index );\n\n\t}"

### Claim 8
- **Text:** `WebGLTextures` installs three separate `'dispose'` listeners — one for `Texture`, one for `WebGLRenderTarget`, and one for the depth texture attached to a render target — wiring deallocation into each.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/webgl/WebGLTextures.js
- **Pulled quote:** "texture.addEventListener( 'dispose', onTextureDispose );" and "renderTarget.addEventListener( 'dispose', onRenderTargetDispose );" and "depthTexture.addEventListener( 'dispose', disposeEvent );"

### Claim 9
- **Text:** Material teardown is wired in `WebGLRenderer.js` directly — the renderer subscribes to a material's `'dispose'` event and calls `deallocateMaterial`. The listener-owning module is not always the per-resource module that shares the type's name.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/WebGLRenderer.js
- **Pulled quote:** "material.addEventListener( 'dispose', onMaterialDispose );" and "function onMaterialDispose( event ) {\n\n\tconst material = event.target;\n\n\tmaterial.removeEventListener( 'dispose', onMaterialDispose );\n\n\tdeallocateMaterial( material );\n\n}"

### Claim 10
- **Text:** `dispatchEvent` snapshots the listener array before iteration so listeners that remove themselves during dispatch (the `onTextureDispose`/`onMaterialDispose` pattern) do not corrupt iteration.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/core/EventDispatcher.js
- **Pulled quote:** "event.target = this;\n\n\t\t\tconst array = listenerArray.slice( 0 );\n\n\t\t\tfor ( let i = 0, l = array.length; i < l; i ++ ) {\n\n\t\t\t\tarray[ i ].call( this, event );\n\n\t\t\t}"

### Claim 11
- **Text:** Disposing a material does not dispose its textures — texture lifetime is tracked separately because one texture can be referenced by many materials.
- **Target section:** Best Practices
- **Source URL:** https://threejs.org/manual/en/how-to-dispose-of-objects.html
- **Pulled quote:** "The disposal of a material has no effect on textures. They are handled separately since a single texture can be used by multiple materials at the same time."

### Claim 12
- **Text:** `WebGLRenderTarget.dispose()` is the only path to release the framebuffer and renderbuffer allocations the engine creates per render target — they are not collected via material or geometry disposal.
- **Target section:** Best Practices
- **Source URL:** https://threejs.org/manual/en/how-to-dispose-of-objects.html
- **Pulled quote:** "Objects of type `WebGLRenderTarget` not only allocate an instance of WebGLTexture but also WebGLFramebuffers and WebGLRenderbuffers for realizing custom rendering destinations. These objects are only deallocated by executing `WebGLRenderTarget.dispose()`."

### Claim 13
- **Text:** Controls and the renderer itself follow a stricter contract — they cannot be reused after `dispose()`; the application must construct a new instance.
- **Target section:** Best Practices
- **Source URL:** https://threejs.org/manual/en/how-to-dispose-of-objects.html
- **Pulled quote:** "There are other classes from the examples directory like controls or post processing passes which provide `dispose()` methods in order to remove internal event listeners or render targets. Instances of these classes can not be used after `dispose()` has been called. You have to create new instances in this case."

### Claim 14
- **Text:** `WebGLRenderer.dispose()` is the top-level teardown that detaches DOM listeners and tells every subsystem (render lists, programs, properties, XR, animation) to free its own resources — the renderer fans out cleanup but does not walk the scene graph.
- **Target section:** Example
- **Source URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/WebGLRenderer.js
- **Pulled quote:** "this.dispose = function () {\n\n\tcanvas.removeEventListener( 'webglcontextlost', onContextLost, false );\n\tcanvas.removeEventListener( 'webglcontextrestored', onContextRestore, false );\n\tcanvas.removeEventListener( 'webglcontextcreationerror', onContextCreationError, false );\n\n\tbackground.dispose();\n\trenderLists.dispose();"

## Reference URLs

- https://threejs.org/manual/en/how-to-dispose-of-objects.html
- https://github.com/mrdoob/three.js/blob/r172/src/core/Object3D.js
- https://github.com/mrdoob/three.js/blob/r172/src/core/BufferGeometry.js
- https://github.com/mrdoob/three.js/blob/r172/src/materials/Material.js
- https://github.com/mrdoob/three.js/blob/r172/src/textures/Texture.js
- https://github.com/mrdoob/three.js/blob/r172/src/core/EventDispatcher.js
- https://github.com/mrdoob/three.js/blob/r172/src/renderers/WebGLRenderer.js
- https://github.com/mrdoob/three.js/blob/r172/src/renderers/webgl/WebGLGeometries.js
- https://github.com/mrdoob/three.js/blob/r172/src/renderers/webgl/WebGLTextures.js
- https://github.com/mrdoob/three.js/releases/tag/r172

## Research notes

- The transferable shape: long-running interactive apps that own non-GC resources (WebGL textures, audio buffers, web workers, ResizeObservers, IntersectionObservers, OffscreenCanvas, WebSocket connections, event listeners on `window`/`document`) need an explicit cleanup mechanism. Three.js solves it with a pub-sub seam: the resource owner only knows it is "done", and a separate listener owns the actual GPU teardown. The decoupling means tests and alternative renderers (e.g., WebGPU) can attach a different teardown listener without changing the resource API.
- "What to look for elsewhere" candidates: a `dispose()` method on resource-owning classes; a separate listener/observer that owns the actual cleanup work; manual recursion idioms because the framework deliberately does not auto-walk a tree; the absence of `dispose()` on the universal base class as the architectural signal that ownership is delegated downward; a renderer-level `dispose()` that fans out to subsystems but does not iterate user-owned objects.
- Two architectural facts worth surfacing in the article body:
  1. `Material.dispose` is wired in `WebGLRenderer.js`, not in a sibling `WebGLMaterials.js` module. The listener-owning module is not always the per-resource module that shares the type's name. Useful asymmetry for Deep Dive.
  2. The recursive teardown idiom (e.g., `scene.traverse(o => o.geometry?.dispose() && o.material?.dispose())`) is application-level, not framework-provided. The article should call this out so readers don't assume traversal is automatic.
- Adjacency notes: FEE-501 (Composition Patterns), FEE-506 (Error Boundaries & Resilience), FEE-1300 (PWA & Offline) — distinct but worth a glance for cross-link candidates.

## Rejected sources

- threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects — redundant with the manual page.
- discourse.threejs.org community threads — useful as background but not authoritative.
- Third-party mirrors and personal blogs — not authoritative.
- Wikipedia — does not cover disposal mechanics in any depth.

## Author cautions

- Claim 15 from initial research (about "no definite recommendation" / level-transition trigger) was dropped from this findings doc because the pulled quote could not be confirmed verbatim from a fresh fetch within the research session. If the writer wants to use this material, refetch the manual page first and cite the exact paragraph; otherwise omit.
