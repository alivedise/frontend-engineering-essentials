I have enough. Let me consolidate the findings into a structured document.

---

# Findings: ES Module Service Workers (FEE-1315)

**Topic:** ES Module Service Workers (`type: 'module'`) and Static Import Migration
**Slug:** `es-module-service-workers`
**Adjacency:** FEE-307 (ES Modules — general ESM concept) + FEE-1302 (Service Workers — general SW concept). This article is the intersection: module workers as service workers, including the importScripts migration path.
**Distinct angle:** `## Migration from importScripts` — step-by-step migration cookbook with bundler snippets, NOT a generic ESM intro.

---

## Verified sources

1. web.dev "ES modules in service workers" — https://web.dev/articles/es-modules-in-sw — verified (Jeff Posnick / Google).
2. MDN `ServiceWorkerContainer.register()` — https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register — verified.
3. MDN `WorkerGlobalScope.importScripts()` — https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts — verified.
4. MDN `ServiceWorker` API page — https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker — verified (contains the "static import…if supported; dynamic import is disallowed" sentence).
5. caniuse.com "ServiceWorker API: Support for ECMAScript modules" — https://caniuse.com/mdn-api_serviceworker_ecmascript_modules — verified, gives Chrome/Edge 91, Safari 15, Firefox 147.
6. Chromium source doc "ES Modules in Service Workers" — https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/service_worker/es_modules.md — verified.
7. W3C ServiceWorker GitHub issue 1407 "Top-level await integration for ServiceWorkers running modules" — https://github.com/w3c/ServiceWorker/issues/1407 — verified via gh CLI; full thread captured.
8. W3C ServiceWorker GitHub issue 831 "Support module service workers, and update for ES6" — https://github.com/w3c/ServiceWorker/issues/831 — verified via gh CLI; design discussion captured.
9. Bugzilla bug 1360870 "Implement 'module' service workers" — https://bugzilla.mozilla.org/show_bug.cgi?id=1360870 — verified RESOLVED FIXED in Firefox 147.
10. Webpack documentation `output.module` — https://webpack.js.org/configuration/output/#outputmodule — verified.
11. Vite documentation, web workers section — https://vite.dev/guide/features.html#web-workers — verified.

**Sources rejected / could not fully WebFetch-verify:**
- chromestatus.com/feature/4609574738853888 — page returned only the title via WebFetch (JS-rendered SPA). Used as a directory pointer only; do not cite as primary.
- w3c.github.io/ServiceWorker/#importscripts-method — section truncated in WebFetch, could not verify a literal "if type is module, throw" step. Use MDN `importScripts` page (which does state the TypeError) instead.
- Apple Safari 16.4 release notes page — body did not render in WebFetch. The WebKit blog post for Safari 16.4 mentions modules in **extension** background service workers but is not an unambiguous source for general module SW shipping in Safari 16.4. Use caniuse.com's "Safari 15" datum as the authoritative baseline; caniuse derives this from MDN's BCD, which captures the actual WebKit ship.

---

## Claims (14)

### Claim 1 — Registration syntax: `type: 'module'` opts into module mode

**Source:** web.dev, "ES modules in service workers."
**Quote:** "await navigator.serviceWorker.register('es-module-sw.js', { type: 'module' });"
**URL:** https://web.dev/articles/es-modules-in-sw

Cross-confirmed by MDN (`ServiceWorkerContainer.register()`):
> "'module' — The loaded service worker is in an ES module and the import statement is available on worker contexts."
URL: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register

### Claim 2 — `'classic'` is the default `type`

**Source:** MDN, `ServiceWorkerContainer.register()`.
**Quote:** "'classic' — The loaded service worker is in a standard script. This is the default."
**URL:** https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register

### Claim 3 — Static `import` works inside a module-mode service worker

**Source:** Chromium "ES Modules in Service Workers" design doc.
**Quote:** "A module script can be used by setting type to 'module' when registering the Service Worker." and "ES modules can be imported … statically, using the `import … from '...'` syntax".
**URL:** https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/service_worker/es_modules.md

### Claim 4 — Dynamic `import()` is disallowed by the Service Worker spec

**Source:** MDN, `ServiceWorker` API page.
**Quote:** "Service workers allow static import of ECMAScript modules, if supported, using `import`. Dynamic import is disallowed by the specification — calling `import()` will throw."
**URL:** https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker

Cross-confirmed by web.dev: "Inside of a service worker, only the static syntax is currently supported." (https://web.dev/articles/es-modules-in-sw)

> Note: this contradicts the dispatch brief's premise that "Dynamic `import()` is allowed and async". The verified spec/MDN position is the opposite — dynamic `import()` is disallowed in service workers. Author the article around the verified position. (Chromium's older design doc says dynamic import is "currently blocked … but it will change in the future"; that future change has not landed across browsers as of this writing.)

### Claim 5 — Top-level await is intentionally not allowed in service workers

**Source:** W3C ServiceWorker issue #1407, comment by **jakearchibald** (contributor).
**Quote:**
> "I don't see any technical problems adding top-level await. Just a couple of adjustments like you mentioned. However, service workers that use top-level await would be considered bad practice. When we boot up an active service worker, it's for an event. Sometimes the event is performance sensitive, such as `fetch`. Awaiting on anything that isn't needed for TTFB is pretty bad. So we either: 1. Allow it … 2. Disable it … I'm leaning towards 2."
**URL:** https://github.com/w3c/ServiceWorker/issues/1407

Cross-confirmed by **wanderview** (Mozilla, member) in the same thread:
> "Also, top-level await would not be protected by a `waitUntil()`. In general we probably couldn't automatically keep it alive because then it would become an abuse vector."

### Claim 6 — Reason TLA hurts service workers: events would miss synchronous listener registration

**Source:** W3C ServiceWorker issue #1407, comment by **annevk** (member).
**Quote:** "Isn't there a difference between those snippets? In that the first won't handle the incoming fetch event (needs to be handled synchronously as the event is dispatched after parsing) and the second will, but with an unintended delay? The second would be much harder to debug."
**URL:** https://github.com/w3c/ServiceWorker/issues/1407

### Claim 7 — `importScripts()` throws a `TypeError` when called from a module worker

**Source:** MDN, `WorkerGlobalScope.importScripts()`.
**Quote (exception clause):** "TypeError — Thrown if the current `WorkerGlobalScope` is a module (use `import` instead)."
**Quote (note):** "Note that the method cannot be used in module workers, which instead load dependencies using `import` statements."
**URL:** https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts

### Claim 8 — Imported modules participate in the SW update check, like `importScripts()` did

**Source:** web.dev, "ES modules in service workers." (paraphrased in search snippet, full quote present in the article.)
**Quote:** "Scripts imported via ES modules can trigger the service worker update flow if their contents change, matching the behavior of `importScripts()`."
**URL:** https://web.dev/articles/es-modules-in-sw

### Claim 9 — Browser support: Chrome/Edge 91 (April–May 2021), Safari 15, Firefox 147

**Source:** caniuse.com, "ServiceWorker API: Support for ECMAScript modules."
**Quote (table values):** "Chrome 91+ supported … Edge 91+ supported … Firefox 147+ supported … Safari 15+ supported … Opera 77+ … Samsung Internet 16.0+." Global usage ~95.17%.
**URL:** https://caniuse.com/mdn-api_serviceworker_ecmascript_modules

Cross-confirmed (Chrome/Edge 91): web.dev: "ES modules in service workers are supported in Chrome and Edge starting with version 91." (https://web.dev/articles/es-modules-in-sw)

Cross-confirmed (Firefox 147): Bugzilla 1360870, status "RESOLVED FIXED", target milestone "147 Branch", flag "firefox147: fixed" (https://bugzilla.mozilla.org/show_bug.cgi?id=1360870). Firefox 147 closes a 4-year compatibility gap; Firefox was the last major engine to ship.

### Claim 10 — Issue #831 was the original tracker for module service workers

**Source:** W3C ServiceWorker issue #831 "Support module service workers, and update for ES6", opened by **domenic** on 2016-02-12.
**Quote (work items):** Adding `WorkerType type = "classic"` to `RegistrationOptions`; updating registration processes; coordination with whatwg/html#608.
**URL:** https://github.com/w3c/ServiceWorker/issues/831

Cross-confirmed by **annevk**'s suggestion in the same thread for the HTTP `Link:` header form: `Link: <sw.js>; rel=serviceworker; type=module`.

### Claim 11 — Webpack 5 produces ESM output via `output.module: true` plus `experiments.outputModule: true`

**Source:** Webpack documentation, `output.module`.
**Quote:** "Output JavaScript files as module type. … Disabled by default as it's an experimental feature. … `output.module` is an experimental feature and can only be enabled by setting `experiments.outputModule` to `true`."
**Quote (effects):** "When enabled, webpack will set `output.iife` to `false`, `output.scriptType` to `'module'` and `terserOptions.module` to `true` internally."
**URL:** https://webpack.js.org/configuration/output/#outputmodule

### Claim 12 — Vite recommends `new Worker(url, { type: 'module' })` and natively bundles ESM workers

**Source:** Vite documentation, web workers section.
**Quote:** "The worker script can also use ESM `import` statements instead of `importScripts()`."
**Quote:** "The worker constructor also accepts options, which can be used to create 'module' workers" with `{ type: 'module' }`.
**Quote:** "By default, the worker script will be emitted as a separate chunk in the production build."
**URL:** https://vite.dev/guide/features.html#web-workers

### Claim 13 — Bundling is the recommended fallback for browsers without module SW support

**Source:** web.dev, "ES modules in service workers."
**Quote:** "To accommodate browsers that don't have built-in support, you can run your service worker script through an ES module-compatible bundler to create a service worker that includes all of the module code inline, and will work in older browsers."
**Quote:** "Once you have two versions of your service worker available—one that uses ES modules, and the other that doesn't—you'll need to detect what the current browser supports, and register the corresponding service worker script."
**URL:** https://web.dev/articles/es-modules-in-sw

### Claim 14 — Dynamic module loading workaround when TLA is not allowed

**Source:** W3C ServiceWorker issue #1407, comment by **jakearchibald**.
**Quote (verbatim code in comment):**
```
const modulePromise = import(useFoo ? './foo' : './bar');
addEventListener('fetch', event => {
  event.respondWith(async function() {
    const { whatever } = await modulePromise;
    // …
  }());
});
```
**Quote (rationale):** "This feels better all round, as you won't be blocked on the import if your code doesn't use it."
**URL:** https://github.com/w3c/ServiceWorker/issues/1407

> Caveat: this code uses dynamic `import()`, which the spec currently disallows in service workers (Claim 4). It documents the **intended** future ergonomics that browsers may unlock; today the equivalent must be expressed via static imports of the union of dependencies, or via `importScripts()` only at install time in classic mode.

---

## Suggested article structure (for the writing subagent)

- **Hook (info box):** Module service workers let you write `import { x } from './x.js'` instead of `importScripts('./x.js')`, and they shipped Baseline-wide as of Firefox 147 (2025/2026), four years after Chrome 91. Two real constraints carry over from classic SW: no top-level await, no dynamic `import()`.
- **Context:** Workers used `importScripts()` since 2014; module-script support for workers landed in stages — dedicated workers first, shared workers, then service workers. Issue #831 (2016) tracked the SW work; Chrome 91 shipped first, Firefox 147 shipped last.
- **Visual:** Comparison table — classic vs module SW: import mechanism, async behavior at top level, error if mixed, update flow.
- **Example:** Concrete `register('sw.js', { type: 'module' })` + `import { precache } from './cache.js'` walkthrough; show the `TypeError` thrown when `importScripts()` is called from a module-mode SW.
- **Best Practices:** MUST not use top-level await; MUST register listeners synchronously at top level; SHOULD bundle for older targets; MAY use the `modulePromise` pattern for lazy module work inside a fetch handler (Claim 14, with the dynamic-import caveat noted).
- **Design Thinking (optional):** Trade-off named in #1407 — synchronous event-listener registration vs ergonomic async startup. The spec authors traded ergonomics for fetch-event TTFB reliability.
- **Deep Dive (optional):** Why dynamic `import()` is disallowed (offline guarantee — same reason `importScripts()` is install-only); update-check semantics for imported modules.
- **Migration from importScripts (REQUIRED, distinct angle):** 6 steps:
  1. Audit `importScripts()` calls and convert to top-level static `import` statements.
  2. Add `{ type: 'module' }` to the `register()` call.
  3. Move any one-time async setup out of top level into the `install` event with `event.waitUntil(...)` (no TLA).
  4. Configure bundler: Webpack 5 (`experiments.outputModule: true`, `output.module: true`), Vite (`new Worker(url, { type: 'module' })`, native), esbuild (`--format=esm --bundle`).
  5. Ship two SW files for compatibility with pre-Firefox-147 long-tail; feature-detect at register time.
  6. Verify update flow — module imports trigger SW update like `importScripts()` did (Claim 8).
- **Related Topics:** FEE-307 ES Modules; FEE-1302 Service Workers; (FEE-1302/sibling on PWA caching strategies if present).
- **References:** web.dev, MDN register, MDN importScripts, MDN ServiceWorker, caniuse, Chromium design doc, W3C issues #831 and #1407, Bugzilla 1360870, Webpack docs, Vite docs.

---

## Discrepancies to flag for the author

1. **Dispatch brief said "Dynamic `import()` is allowed and async."** Verified sources (MDN ServiceWorker page; Chromium design doc) state dynamic `import()` is currently disallowed and throws. Write to the verified position; the brief is wrong on this point.
2. **Dispatch brief said "Safari since ~2023".** caniuse reports Safari 15 (2021/2022 stable) as the first supported version for the ECMAScript-modules-in-ServiceWorker BCD entry. Web.dev (older article) only mentions Safari Technology Preview 122. Use caniuse's Safari 15 figure but note that the web.dev article is older than the actual stable ship.
3. **Dispatch brief said Firefox is "the last to ship, verify exact dates".** Verified: Firefox 147 (Bugzilla 1360870 RESOLVED FIXED, target milestone 147), originally attempted in Firefox 146 but backed out due to crash bug 1998332. With Firefox 147 the feature is Baseline-newly-available across all major engines.
agentId: a477ebd5bebfee087 (use SendMessage with to: 'a477ebd5bebfee087' to continue this agent)
<usage>total_tokens: 58952
tool_uses: 33
duration_ms: 224771</usage>