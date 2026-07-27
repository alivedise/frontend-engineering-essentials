---
id: 1315
title: "ES Module Service Workers (type: 'module') and Static Import Migration"
state: draft
slug: es-module-service-workers
reviewed: hardened
reviewed_on: 2026-07-25
---

# [FEE-1315] ES Module Service Workers (type: 'module') and Static Import Migration

:::info
Module service workers let you replace `importScripts('./x.js')` with top-level `import { x } from './x.js'` by passing `{ type: 'module' }` to `navigator.serviceWorker.register()`. Chrome and Edge shipped this in version 91 (April–May 2021), Safari shipped it in version 15, and Firefox 147 (Bugzilla 1360870 RESOLVED FIXED), released 2026-01-13, closed the roughly four-and-a-half-year gap. Two module features remain off-limits even in module mode: dynamic `import()` is disallowed by the specification and throws, and top-level await is intentionally not allowed. Both prohibitions are enforced only in module mode. What carries over from classic service workers is the underlying reasoning: the dependency graph must be resolvable at install time, and event listeners must attach synchronously. The migration path is mechanical for source code but introduces a bundler decision for browsers without module-SW support.
:::

## Context

`importScripts()` has been the only way to compose service worker code since the API shipped in 2014. Module-script support for workers landed in stages: dedicated workers first, then shared workers, and finally service workers. W3C ServiceWorker issue #831, opened by domenic on 2016-02-12, tracked the work of adding `WorkerType type = "classic"` to `RegistrationOptions` and updating the registration processes. Chromium shipped first in version 91; Mozilla's Bugzilla 1360870 sat open until Firefox 147 marked it RESOLVED FIXED. With Firefox 147 the feature is Baseline-newly-available across all major engines (~93% of tracked global usage per caniuse).

## Visual

| Aspect | Classic service worker | Module service worker |
| --- | --- | --- |
| Registration | `register('sw.js')` (default `type: 'classic'`) | `register('sw.js', { type: 'module' })` |
| Import mechanism | `importScripts('./x.js')` at top level | `import { x } from './x.js'` at top level |
| `importScripts()` from this scope | Allowed | Throws `TypeError` ("use `import` instead") |
| Dynamic `import()` | N/A | Disallowed by spec; throws |
| Top-level await | N/A | Intentionally not allowed |
| Update check on dependency change | Triggered by `importScripts()` targets | Triggered by imported module contents |

## Example

A module service worker registered from the page:

```js
// page.js
await navigator.serviceWorker.register('es-module-sw.js', { type: 'module' });
```

The service worker file itself uses static `import` declarations, with all event listeners attached synchronously at the top level:

```js
// es-module-sw.js
import { precache } from './cache.js';
import { routeFetch } from './router.js';

self.addEventListener('install', (event) => {
  event.waitUntil(precache(['/', '/app.css', '/app.js']));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(routeFetch(event.request));
});
```

If the same file calls `importScripts('./legacy.js')`, the call throws a `TypeError`. MDN's exception clause for `WorkerGlobalScope.importScripts()` states: "Thrown if the current `WorkerGlobalScope` is a module (use `import` instead)." A note on the same page confirms: "the method cannot be used in module workers, which instead load dependencies using `import` statements."

When the contents of `./cache.js` or `./router.js` change, the browser triggers the service worker update flow. web.dev: "Scripts imported via ES modules can trigger the service worker update flow if their contents change, matching the behavior of `importScripts()`."

## Best Practices

- **MUST** register all event listeners synchronously at the top level of the service worker module. annevk on W3C issue #1407: the first snippet "won't handle the incoming fetch event (needs to be handled synchronously as the event is dispatched after parsing)." Any delay before `addEventListener('fetch', ...)` runs causes the worker to miss in-flight events.
- **MUST NOT** use top-level await in a module service worker. jakearchibald on issue #1407: "service workers that use top-level await would be considered bad practice"; wanderview added that "top-level await would not be protected by a `waitUntil()`" and "we probably couldn't automatically keep it alive because then it would become an abuse vector."
- **MUST NOT** call `import()` (dynamic import) inside a service worker. MDN: "Dynamic import is disallowed by the specification — calling `import()` will throw." web.dev confirms: "Inside of a service worker, only the static syntax is currently supported."
- **MUST NOT** call `importScripts()` from a module-mode service worker. MDN states the call throws `TypeError` with the message advising `import` instead.
- **SHOULD** ship a bundled fallback service worker for browsers that predate module-SW support. web.dev: "Once you have two versions of your service worker available — one that uses ES modules, and the other that doesn't — you'll need to detect what the current browser supports, and register the corresponding service worker script." web.dev also states that "the best practices for detecting support are currently in flux," and points readers to W3C ServiceWorker issue #1582 for the current recommendations; there is no settled synchronous feature-detection test as of this writing.
- **SHOULD** move one-time async setup into the `install` event with `event.waitUntil(...)` rather than attempting top-level async initialization. This follows from the no-TLA constraint above and the synchronous-listener requirement.
- **MAY** rely on the import graph for the SW update check. Per web.dev, changes to imported module contents trigger the same update flow that `importScripts()` targets did.

## Design Thinking

Issue #1407 names a specific trade-off: ergonomic async startup versus fetch-event time-to-first-byte. jakearchibald wrote that allowing top-level await would make service workers slow on performance-sensitive events ("Awaiting on anything that isn't needed for TTFB is pretty bad"), and listed two options: "1. Allow it … 2. Disable it … I'm leaning towards 2." The spec authors traded the ergonomic upside for predictable event latency and synchronous listener registration. The same reasoning explains why dynamic `import()` is disallowed: the offline guarantee of a service worker depends on its dependency graph being known at install time, the same property that constrains classic service workers to call `importScripts()` only during install.

## Deep Dive

The Chromium "ES Modules in Service Workers" design doc states: "A module script can be used by setting type to 'module' when registering the Service Worker," and "ES modules can be imported … statically, using the `import … from '...'` syntax." The same doc historically noted dynamic import was "currently blocked … but it will change in the future"; that change has not landed across browsers as of this writing, and MDN's `ServiceWorker` page records the current state as a hard spec disallowance: "Service workers allow static import of ECMAScript modules, if supported, using `import`. Dynamic import is disallowed by the specification — calling `import()` will throw."

The browser-support timeline as recorded by caniuse: Chrome 91, Edge 91, Opera 77, Samsung Internet 16.0, Safari 15, Firefox 147. The Firefox 147 ship was preceded by an attempt in Firefox 146 that was backed out due to crash bug 1998332 before re-landing.

## Migration from importScripts

Most teams migrating away from `importScripts()` are migrating away from Workbox, Google's widely used service worker library, rather than a hand-rolled script. Workbox's CDN loader, `importScripts('https://storage.googleapis.com/workbox-cdn/releases/<version>/workbox-sw.js')`, and its `generateSW` build mode both produce an `importScripts()`-based service worker by default.

Six steps. The first three are source changes; the last three concern the build and rollout.

**1. Convert `importScripts()` calls to top-level static `import` declarations.**

Before:

```js
// classic-sw.js
importScripts('./cache.js', './router.js');
self.addEventListener('install', (event) => {
  event.waitUntil(precache(['/']));
});
```

After:

```js
// module-sw.js
import { precache } from './cache.js';
import { routeFetch } from './router.js';
self.addEventListener('install', (event) => {
  event.waitUntil(precache(['/']));
});
```

**2. Add `{ type: 'module' }` to the `register()` call** on the page side:

```js
await navigator.serviceWorker.register('module-sw.js', { type: 'module' });
```

MDN: "'module' — The loaded service worker is in an ES module and the import statement is available on worker contexts." The default remains `'classic'`.

**3. Move any one-time async setup out of the top level into the `install` event.** Top-level await is not available, so initialization that previously sat under `importScripts(...)` followed by `await ...` must run inside `event.waitUntil(...)` in the install handler.

**4. Configure the bundler to emit module output.**

- **Webpack 5:** set `experiments.outputModule: true` and `output.module: true`. The Webpack docs: "Output JavaScript files as module type. … Disabled by default as it's an experimental feature. … `output.module` is an experimental feature and can only be enabled by setting `experiments.outputModule` to `true`." Effects: "When enabled, webpack will set `output.iife` to `false`, `output.scriptType` to `'module'` and `terserOptions.module` to `true` internally."
- **Vite:** native. The Vite docs note "The worker script can also use ESM `import` statements instead of `importScripts()`," that the worker constructor "accepts options, which can be used to create 'module' workers" with `{ type: 'module' }`, and that "by default, the worker script will be emitted as a separate chunk in the production build."
- **Workbox (`workbox-build`):** if the pre-migration service worker was generated by Workbox's `injectManifest` mode, the migration is narrower than a full rewrite. `injectManifest` "will generate a list of URLs to precache, and add that precache manifest to an existing service worker file. It will otherwise leave the file as-is," per the Workbox documentation, so the source file passed to it can already be an ES module with static `import` declarations; the Webpack or Vite configuration above then emits that source as a module. Teams on Workbox's `generateSW` mode, which owns the entire service worker file, need to move to `injectManifest` before this applies.

**5. Ship two service worker files for the long-tail compatibility window** with browsers that predate module SW support. web.dev: "To accommodate browsers that don't have built-in support, you can run your service worker script through an ES module-compatible bundler to create a service worker that includes all of the module code inline, and will work in older browsers." Detecting which script to register is unsettled: web.dev states "the best practices for detecting support are currently in flux" and points to W3C ServiceWorker issue #1582 for current recommendations, rather than prescribing one synchronous test.

**6. Verify the update flow.** Module imports trigger the SW update check the same way `importScripts()` targets did, per web.dev.

A note on the dynamic-loading pattern proposed in W3C issue #1407 — `const modulePromise = import(useFoo ? './foo' : './bar')` followed by `const { whatever } = await modulePromise` inside a fetch handler — relies on dynamic `import()`, which the specification currently disallows in service workers. The pattern documents an intended future ergonomics that browsers have not unlocked. Today, the equivalent must be expressed via static imports of the union of dependencies.

## Related Topics

- [FEE-307 ES Modules](/en/JavaScript%20Modern%20Capabilities/307)
- [FEE-1302 Service Workers](/en/Progressive%20Web%20Apps%20and%20Offline/1302)
- [FEE-1304 Workbox & PWA Tooling](/en/Progressive%20Web%20Apps%20and%20Offline/1304)

## References

- Jeff Posnick, "ES modules in service workers," web.dev (2021). https://web.dev/articles/es-modules-in-sw
- MDN contributors, "ServiceWorkerContainer.register()," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
- MDN contributors, "WorkerGlobalScope.importScripts()," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
- MDN contributors, "ServiceWorker," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
- caniuse, "ServiceWorker API: Support for ECMAScript modules" (2026). https://caniuse.com/mdn-api_serviceworker_ecmascript_modules
- Chromium project, "ES Modules in Service Workers," chromium.googlesource.com (2026). https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/service_worker/es_modules.md
- W3C ServiceWorker, issue #1407, "Top-level await integration for ServiceWorkers running modules" (2019). https://github.com/w3c/ServiceWorker/issues/1407
- W3C ServiceWorker, issue #831, "Support module service workers, and update for ES6" (2016). https://github.com/w3c/ServiceWorker/issues/831
- W3C ServiceWorker, issue #1582, "Feature detection for type=\"module\" support" (2021). https://github.com/w3c/ServiceWorker/issues/1582
- Mozilla Bugzilla, bug 1360870, "Implement 'module' service workers" (2017). https://bugzilla.mozilla.org/show_bug.cgi?id=1360870
- Mozilla Bugzilla, bug 1998332, "Crash in [@ mozilla::dom::ThreadSafeWorkerRef::Private] when opening Instagram" (2025). https://bugzilla.mozilla.org/show_bug.cgi?id=1998332
- Webpack documentation, "output.module," webpack.js.org (2026). https://webpack.js.org/configuration/output/#outputmodule
- Vite documentation, "Web Workers," vite.dev (2026). https://vite.dev/guide/features.html#web-workers
- Chrome for Developers, "workbox-sw," developer.chrome.com (2026). https://developer.chrome.com/docs/workbox/modules/workbox-sw/
- Chrome for Developers, "workbox-build," developer.chrome.com (2026). https://developer.chrome.com/docs/workbox/modules/workbox-build
