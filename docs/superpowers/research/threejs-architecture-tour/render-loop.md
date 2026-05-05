# Findings: The Render Loop

## Named pattern

**Imperative Per-Frame Entry**: the renderer exposes a synchronous `render(scene, camera)` method that the host application calls once per frame; the library never owns the loop, only one tick of it.

## Quantitative anchor

The lens scan surfaced 82 function/method hits matching `render`/`tick`/`update`/`step`/`loop` keywords across the codebase, concentrated in three giants:

- `src/renderers/WebGLRenderer.js` — 2955 LOC, the WebGL backend.
- `src/renderers/common/Renderer.js` — 2860 LOC, the abstract coordinator shared by WebGL and WebGPU backends.
- `src/nodes/core/NodeBuilder.js` — 2426 LOC, the shader-graph compiler invoked during render.

The render entry point on `WebGLRenderer` is the assigned method `this.render = function ( scene, camera )` at line 1139. Per call, it (a) early-returns on a lost GL context, (b) walks the scene graph by calling `scene.updateMatrixWorld()` when `matrixWorldAutoUpdate` is true, (c) updates the camera's world matrix, (d) optionally swaps in the XR camera, (e) builds a render list via `projectObject(...)` plus opaque/transparent sort, then (f) submits draw calls. The on-the-frame contract is: *the application calls `render` once*; everything else is internal bookkeeping.

The unified backend in `common/Renderer.js` exposes the same shape at line 1093 — a synchronous `render( scene, camera )` that delegates to a private `_renderScene( scene, camera )` after an init guard. `renderAsync` (line 932) is the promise-returning twin used before WebGPU device init has resolved.

The application-facing scheduling primitive is `renderer.setAnimationLoop( callback )` (WebGLRenderer.js line 1125), a thin wrapper over `WebGLAnimation` that internally drives `requestAnimationFrame`. `setAnimationLoop` is the only loop-shaped surface three.js itself owns; it exists primarily so that XR sessions can swap the rAF source for the headset's own frame callback without the application caring.

## Source citations

- **Claim:** `WebGLRenderer.render( scene, camera )` is the synchronous per-frame entry point; it expects the application to drive the cadence and only handles one frame of work.
  - **File:** `src/renderers/WebGLRenderer.js`
  - **Lines:** 1137-1156
  - **URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/WebGLRenderer.js#L1137-L1156
  - **Pulled quote:**
    ```
    // Rendering

    this.render = function ( scene, camera ) {

        if ( camera !== undefined && camera.isCamera !== true ) {

            console.error( 'THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.' );
            return;

        }

        if ( _isContextLost === true ) return;

        // update scene graph

        if ( scene.matrixWorldAutoUpdate === true ) scene.updateMatrixWorld();

        // update camera matrices and frustum

        if ( camera.parent === null && camera.matrixWorldAutoUpdate === true ) camera.updateMatrixWorld();
    ```

- **Claim:** the abstract `Renderer.js` (shared between WebGL and WebGPU backends) preserves the same `render( scene, camera )` signature and delegates to a private `_renderScene` after an init check; the public surface stays identical so swapping backends does not change the per-frame call site.
  - **File:** `src/renderers/common/Renderer.js`
  - **Lines:** 1081-1105
  - **URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/common/Renderer.js#L1081-L1105
  - **Pulled quote:**
    ```
    /**
     * Renders the scene or 3D object with the given camera. This method can only be called
     * if the renderer has been initialized.
     *
     * The target of the method is the default framebuffer (meaning the canvas)
     * or alternatively a render target when specified via `setRenderTarget()`.
     *
     * @param {Object3D} scene - The scene or 3D object to render.
     * @param {Camera} camera - The camera to render the scene with.
     * @return {Promise?} A Promise that resolve when the scene has been rendered.
     * Only returned when the renderer has not been initialized.
     */
    render( scene, camera ) {

        if ( this._initialized === false ) {

            console.warn( 'THREE.Renderer: .render() called before the backend is initialized. Try using .renderAsync() instead.' );

            return this.renderAsync( scene, camera );

        }

        this._renderScene( scene, camera );

    }
    ```

- **Claim:** the per-frame contract is application-driven. The official "Creating a scene" manual shows the canonical shape — the user authors `animate()`, hands it to `renderer.setAnimationLoop( animate )`, and `renderer.render( scene, camera )` is invoked from inside the user's function. The renderer never decides when to render.
  - **File:** `docs/manual/en/introduction/Creating-a-scene.html`
  - **Lines:** 76-83
  - **URL:** https://github.com/mrdoob/three.js/blob/r172/docs/manual/en/introduction/Creating-a-scene.html#L76-L83
  - **Pulled quote:**
    ```
    <code>
    function animate() {
        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
    </code>

    <p>This will create a loop that causes the renderer to draw the scene every time the screen is refreshed (on a typical screen this means 60 times per second). If you're new to writing games in the browser, you might say <em>"why don't we just create a setInterval ?"</em> The thing is - we could, but `requestAnimationFrame` which is internally used in `WebGLRenderer` has a number of advantages.</p>
    ```

- **Claim:** `setAnimationLoop` is the only loop-owning surface three.js exposes, and it is a thin wrapper that hands the user's callback to `WebGLAnimation` (which uses `requestAnimationFrame`) and to the XR module so headset frame callbacks can take over transparently.
  - **File:** `src/renderers/WebGLRenderer.js`
  - **Lines:** 1098-1132
  - **URL:** https://github.com/mrdoob/three.js/blob/r172/src/renderers/WebGLRenderer.js#L1098-L1132
  - **Pulled quote:**
    ```
    // Animation Loop

    let onAnimationFrameCallback = null;

    function onAnimationFrame( time ) {

        if ( onAnimationFrameCallback ) onAnimationFrameCallback( time );

    }

    function onXRSessionStart() {

        animation.stop();

    }

    function onXRSessionEnd() {

        animation.start();

    }

    const animation = new WebGLAnimation();
    animation.setAnimationLoop( onAnimationFrame );

    if ( typeof self !== 'undefined' ) animation.setContext( self );

    this.setAnimationLoop = function ( callback ) {

        onAnimationFrameCallback = callback;
        xr.setAnimationLoop( callback );

        ( callback === null ) ? animation.stop() : animation.start();

    };
    ```

## What to look for elsewhere

To recognize an "application drives the per-frame loop" architecture: look for a public `render(...)` (or `draw(...)`, `present(...)`, `update(...)`) method on the engine object that takes the scene state as an argument and returns synchronously, with no internal `setInterval` / `requestAnimationFrame` started by the constructor. Any rAF call inside the library is a thin scheduler wrapper around a user-supplied callback (three.js's `setAnimationLoop`), not a hidden loop. The opposite shape — framework-driven — is when the engine starts its own loop on `init()` or `start()`, calls user-supplied lifecycle hooks (`onUpdate`, `tick`, `step`) on every tick, and the application never invokes `render` directly. Unity's `MonoBehaviour.Update`, Unreal's `Tick`, Babylon.js's default `engine.runRenderLoop(callback)`, and ECS schedulers like Bevy fall in that camp; raw three.js, raw OpenGL/WebGL apps, and immediate-mode UIs (Dear ImGui) fall in the application-driven camp.
