# FEE Gap-Fill Batch E — Rendering & Build Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 7 gap-fill articles — 4 for Rendering & Performance (FEE-709–712) and 3 for Build Tooling (FEE-808–810) — in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/Rendering and Performance/709.md` — INP Deep Dive
- `docs/en/Rendering and Performance/710.md` — GPU-Accelerated Animations & `will-change`
- `docs/en/Rendering and Performance/711.md` — Resource Hints
- `docs/en/Rendering and Performance/712.md` — Critical Rendering Path & Paint Timing
- `docs/en/Build Tooling and Module Systems/808.md` — Module Federation
- `docs/en/Build Tooling and Module Systems/809.md` — Tree-Shaking Patterns & Side-Effect Marking
- `docs/en/Build Tooling and Module Systems/810.md` — TypeScript Integration in the Build Pipeline

**Files to create (zh-TW):** Mirror under `docs/zh-tw/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Batch 12+ template: Opening → `## Principle` → `## Design Thinking` → `## Best Practices` → `## Visual` → `## Example` → `## Common Mistakes` (optional) → `## Related FEEs` → `## References`. Target: 300+ lines per file.

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

---

### Task 1: FEE-709 INP Deep Dive: Interaction to Next Paint

**Files:**
- Create: `docs/en/Rendering and Performance/709.md`
- Create: `docs/zh-tw/Rendering and Performance/709.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 709
  title: "INP Deep Dive: Interaction to Next Paint"
  state: draft
  category: Rendering and Performance
  ---
  ```

  **H1:** `# INP Deep Dive: Interaction to Next Paint`

  **Opening (2–4 paragraphs covering):**
  - Interaction to Next Paint (INP) became a Core Web Vital in March 2024, replacing First Input Delay (FID). INP measures the latency of all interactions on a page during the user's visit — clicks, taps, and key presses — and reports the worst-case interaction latency (with some outlier trimming). FID only measured the first interaction; INP measures all of them, making it a more comprehensive indicator of how responsive a page is throughout the user's session.
  - An interaction's latency is divided into three phases: input delay (the time between the user's action and when the browser starts running event handlers), processing time (the time event handlers take to run), and presentation delay (the time for the browser to render and paint the updated frame after handlers complete). INP is the sum of these three phases for the worst interaction.
  - Google's INP thresholds: good is under 200ms, needs improvement is 200–500ms, poor is over 500ms. An INP of 300ms means the user had at least one interaction during their session that took 300ms from their action to the next painted frame. For most applications, the largest contributor is processing time — long event handlers, synchronous rendering updates, or layout thrash triggered by handler code.

  **`## Principle`:**

  Engineers MUST measure INP in the field (real user monitoring) rather than relying solely on lab measurements. INP is a statistical metric that reflects the worst interaction over a full session; lab tests that run a single interaction do not capture the performance degradation that occurs mid-session after JavaScript has run for minutes and the main thread has accumulated microtask queues and cached state. The Chrome User Experience Report (CrUX) and RUM tools like web-vitals.js are the authoritative sources for field INP.

  Engineers SHOULD break up long tasks that block the main thread during interaction event handlers using `scheduler.yield()` (or `setTimeout(0)` as a fallback) to yield to the browser between processing chunks. A single event handler that runs for 400ms produces an INP of at least 400ms for every user who triggers it. Yielding allows the browser to process other events, update the UI, and respond to higher-priority user input between processing chunks.

  **`## Design Thinking` subsections:**
  - `### The three INP phases` — Input delay (reduce by avoiding long tasks at interaction time), processing time (reduce by splitting handlers and deferring non-critical work), presentation delay (reduce by avoiding synchronous style/layout recalculation in handlers).
  - `### scheduler.yield() and the Scheduler API` — `await scheduler.yield()` yields control to the browser and resumes when the browser next has idle time. Available in Chrome 115+; `setTimeout(0)` provides a coarser fallback. The pattern for long event handlers: process chunk → yield → process next chunk.
  - `### isInputPending` — `navigator.scheduling.isInputPending()` allows a long task to check whether a user interaction is waiting before yielding. Yield if input is pending; continue if not. This is a softer yield than `scheduler.yield()`.
  - `### Profiling INP` — Chrome DevTools Performance panel: Interactions track, Long Tasks, INP attribution. `PerformanceLongAnimationFrameObserver`. The `web-vitals` library's `onINP` callback with attribution data.
  - `### INP vs. TBT (Total Blocking Time)` — TBT is a lab metric that approximates INP by measuring main thread blocking. Improving TBT generally improves INP. But TBT can be good while INP is poor if the expensive interactions happen after the initial load period.

  **`## Best Practices`:**

  **MUST measure INP using real user monitoring, not only lab tools.** Lighthouse and PageSpeed Insights measure simulated, single-interaction performance. Field INP from CrUX or web-vitals.js reflects actual user sessions across all interactions, devices, and network conditions. A page that scores good in Lighthouse may have poor field INP if its most common interactions are slow.

  **SHOULD use `await scheduler.yield()` to break up event handlers that perform more than ~50ms of synchronous work.** The 50ms threshold comes from the Long Task definition; any main-thread task longer than 50ms blocks the browser from responding to input. Handlers that iterate large data sets, compute complex layouts, or run multiple synchronous state updates should yield between logical processing units to keep each chunk under 50ms.

  **SHOULD defer non-critical work triggered by user interactions to `requestIdleCallback` or a `setTimeout(0)` after the visual update is committed.** Analytics logging, state persistence, and background synchronization do not need to block the visual response. Scheduling them after the frame update eliminates their contribution to presentation delay.

  **`## Visual`:** Mermaid timeline diagram showing a single interaction: [user click] → input delay → event handler runs → [yield] → handler resumes → presentation delay → [frame painted]. Annotate the three INP phases.

  **`## Example`:** Breaking a long event handler with `scheduler.yield()`:
  ```js
  button.addEventListener('click', async () => {
    updateUIImmediately(); // visual response first
    await scheduler.yield(); // yield before heavy processing
    for (const chunk of largeDataChunks) {
      processChunk(chunk);
      if (navigator.scheduling?.isInputPending()) {
        await scheduler.yield(); // yield if new input is waiting
      }
    }
    finalizeUpdate();
  });
  ```

  **`## Related FEEs`:**
  - FEE-700 — Rendering & Performance Overview
  - FEE-704 — Core Web Vitals & Performance Metrics
  - FEE-712 — Critical Rendering Path & Paint Timing
  - FEE-301 — Event Loop & Async Model

  **`## References`:**
  - web.dev: INP — https://web.dev/articles/inp
  - web.dev: Optimize INP — https://web.dev/articles/optimize-inp
  - Chrome Developers: scheduler.yield() — https://developer.chrome.com/blog/scheduler-yield-origin-trial
  - MDN: PerformanceLongAnimationFrameObserver — https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameObserver

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 709
  title: INP 深度解析：從互動到下一幀繪製
  state: draft
  category: Rendering and Performance
  ---
  ```
  **H1:** `# INP 深度解析：從互動到下一幀繪製`

  Related FEE titles:
  - FEE-700 — 渲染與效能總覽
  - FEE-704 — 核心 Web 指標與效能指標
  - FEE-712 — 關鍵渲染路徑與繪製計時
  - FEE-301 — 事件循環與非同步模型

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Rendering and Performance/709.md" "docs/zh-tw/Rendering and Performance/709.md"
  git commit -m "feat(fee-709): INP deep dive — EN + zh-TW"
  ```

---

### Task 2: FEE-710 GPU-Accelerated Animations & `will-change`

**Files:**
- Create: `docs/en/Rendering and Performance/710.md`
- Create: `docs/zh-tw/Rendering and Performance/710.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 710
  title: GPU-Accelerated Animations & will-change
  state: draft
  category: Rendering and Performance
  ---
  ```

  **H1:** `` # GPU-Accelerated Animations & `will-change` ``

  **Opening (2–4 paragraphs covering):**
  - The browser's rendering pipeline splits between the main thread (JavaScript, style, layout, paint) and the compositor thread (compositing layers into the final frame). Animations that affect properties the compositor can handle independently — `transform` and `opacity` — run entirely on the compositor thread and are not blocked by main-thread JavaScript. Animations that affect properties requiring layout or paint — `width`, `height`, `top`, `left`, `background-color` — must run on the main thread and are susceptible to jank when the main thread is busy.
  - `will-change` is a CSS property that tells the browser to prepare for an animation or transition before it starts, by promoting the element to its own compositor layer. This pre-promotion avoids the visual "pop" that occurs when an element is promoted mid-animation. `will-change: transform` signals that the element's transform will change; `will-change: opacity` signals the same for opacity.
  - The tradeoff: each promoted layer requires GPU memory for its texture. Promoting many elements simultaneously — via `will-change: transform` on every card in a list — can exhaust GPU memory on mobile devices, causing performance degradation worse than the animation stutter that `will-change` was meant to prevent.

  **`## Principle`:**

  Engineers SHOULD animate only `transform` and `opacity` properties in CSS animations and transitions. These are the only two properties that the browser compositor can animate on the GPU without involving the main thread or triggering paint. Animating `width`, `top`, `background-color`, or `box-shadow` triggers layout and paint on every frame, running on the main thread and blocked by JavaScript. A smooth 60fps animation is achievable on `transform` and `opacity` even when the main thread is under load.

  Engineers MUST NOT apply `will-change` to elements that are not currently animated or about to be animated. `will-change` promotes elements to compositor layers immediately, consuming GPU memory for the duration the property is set. Adding `will-change: transform` to all cards in a list as a static rule creates N promoted layers for N cards, potentially exhausting GPU memory on mobile. Apply `will-change` in a `:hover` or JavaScript-triggered state immediately before animation begins, and remove it when animation ends.

  **`## Design Thinking` subsections:**
  - `### The compositor thread model` — Main thread pipeline: JavaScript → Style → Layout → Paint → Composite. Compositor handles: transform, opacity (and filter with caveats). Diagram of which pipeline stages each property type triggers.
  - `### Stacking contexts and layer promotion` — `transform`, `opacity < 1`, `will-change`, `filter`, `isolation: isolate`, `position: fixed` all create stacking contexts. Not all create compositor layers; `will-change` explicitly requests a compositor layer.
  - `### Detecting layer promotion` — Chrome DevTools Layers panel shows promoted layers and their memory usage. Performance panel shows compositor frames vs. main thread frames. How to identify unnecessary layer promotions.
  - `### CSS containment interaction` — `contain: paint` and `will-change` both affect layer promotion. Combining them may create nested layers. CSS Containment (FEE-209) addresses similar performance concerns from the layout direction.

  **`## Best Practices`:**

  **SHOULD animate `transform` and `opacity` exclusively for CSS animations intended to run at 60fps or higher.** Every other CSS property that changes between animation frames requires the browser to run through style, layout, or paint stages on each frame. At 60fps, each frame must complete in under 16.7ms; layout and paint on every frame consume most of this budget. `transform` and `opacity` bypass both stages, leaving the full budget for compositing.

  **MUST apply `will-change` dynamically (on hover or interaction start) rather than statically on all elements.** Static `will-change` on list items, cards, or other repeated elements creates one compositor layer per element, multiplying GPU texture memory by the number of elements in the DOM. Apply it when the user's pointer enters the element (`mouseenter`), then remove it after the animation completes.

  **SHOULD profile compositor layer usage with Chrome DevTools Layers panel before shipping animations that use `will-change`.** The panel shows the memory consumption of each layer and highlights excessive layer creation. A change from 5 layers to 500 layers introduced by a CSS rule change is visible in this panel; invisible in the code.

  **`## Visual`:** Mermaid diagram showing the rendering pipeline split: main thread (JS → Style → Layout → Paint) and compositor thread (Transform/Opacity animation). Show that compositor-thread animation is not blocked by main-thread work, while paint-triggering animation is.

  **`## Example`:** Correct `will-change` usage — applied on hover, removed after transition:
  ```js
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => { card.style.willChange = 'transform'; });
    card.addEventListener('mouseleave', () => { card.style.willChange = 'auto'; });
  });
  ```
  ```css
  .card { transition: transform 200ms ease; }
  .card:hover { transform: translateY(-4px); }
  ```

  **`## Related FEEs`:**
  - FEE-700 — Rendering & Performance Overview
  - FEE-209 — CSS Containment & `contain`
  - FEE-412 — `requestAnimationFrame` & Animation Timing
  - FEE-712 — Critical Rendering Path & Paint Timing

  **`## References`:**
  - MDN: will-change — https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
  - web.dev: Rendering performance — https://web.dev/articles/rendering-performance
  - web.dev: Stick to compositor-only properties — https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 710
  title: GPU 加速動畫與 will-change
  state: draft
  category: Rendering and Performance
  ---
  ```
  **H1:** `` # GPU 加速動畫與 `will-change` ``

  Related FEE titles:
  - FEE-700 — 渲染與效能總覽
  - FEE-209 — CSS Containment 與 `contain`
  - FEE-412 — `requestAnimationFrame` 與動畫計時
  - FEE-712 — 關鍵渲染路徑與繪製計時

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Rendering and Performance/710.md" "docs/zh-tw/Rendering and Performance/710.md"
  git commit -m "feat(fee-710): GPU-accelerated animations & will-change — EN + zh-TW"
  ```

---

### Task 3: FEE-711 Resource Hints: `prefetch`, `preload`, `preconnect`

**Files:**
- Create: `docs/en/Rendering and Performance/711.md`
- Create: `docs/zh-tw/Rendering and Performance/711.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 711
  title: "Resource Hints: prefetch, preload, preconnect"
  state: draft
  category: Rendering and Performance
  ---
  ```

  **H1:** `# Resource Hints: \`prefetch\`, \`preload\`, \`preconnect\``

  **Opening (2–4 paragraphs covering):**
  - Resource hints are HTML `<link>` elements and HTTP headers that tell the browser what resources will be needed and when. Rather than discovering resources reactively as HTML is parsed or JavaScript executes, resource hints allow the browser to initiate network requests earlier — before the page reaches the point where the resource is needed. The result is reduced latency for critical resources and faster perceived performance.
  - Four primary resource hints exist: `preconnect` (establish a TCP/TLS connection to an origin before any resource from that origin is requested), `dns-prefetch` (perform DNS lookup only), `preload` (fetch a specific resource for the current page immediately at high priority), and `prefetch` (fetch a resource likely needed for a future navigation at low priority). Each has a distinct scope and priority; using the wrong one for a given scenario wastes bandwidth or delays more important resources.
  - Resource hints are powerful and easy to misapply. `preload` that doesn't match an actual resource request produces a browser warning and wastes bandwidth. `prefetch` on resources for the current page delays them rather than expediting them. Understanding the scope — current page vs. future page, origin vs. specific resource — is the prerequisite for using hints correctly.

  **`## Principle`:**

  Engineers SHOULD use `<link rel="preload">` for resources that are required by the current page but discovered late in the parsing process — web fonts referenced in CSS, scripts loaded via dynamically injected `<script>` tags, images in hero sections that are loaded by CSS rather than `<img>`. `preload` tells the browser to fetch the resource immediately at high priority, closing the gap between resource discovery and availability.

  Engineers MUST specify the correct `as` attribute on every `<link rel="preload">` element. The `as` attribute tells the browser what kind of resource is being preloaded, which determines the request's priority, the applicable Content Security Policy directives, and whether the correct `Accept` header is sent. A preloaded font without `as="font"` and `crossorigin` is fetched twice — once by the preload hint (without CORS) and once by the CSS font-face rule (with CORS) — because the browser cannot match the two requests.

  **`## Design Thinking` subsections:**
  - `### preload vs. prefetch` — `preload`: current page, high priority, used within the current navigation. `prefetch`: future page, low priority, background fetch for the next navigation. The browser will cancel a preload that is not consumed; it will not cancel a prefetch.
  - `### preconnect vs. dns-prefetch` — `preconnect` establishes TCP + TLS handshake; more expensive. `dns-prefetch` resolves DNS only; lighter. Use `preconnect` for origins that will be used immediately; `dns-prefetch` for origins that may be used later.
  - `### modulepreload` — `<link rel="modulepreload">` preloads ES modules and parses them (not just fetches). Recommended for module entry points in Vite-built applications over plain `preload`.
  - `### Over-hinting pitfall` — Preloading resources that compete with more critical resources delays the critical resources. Preloading everything is worse than preloading nothing. Measure LCP and FCP before and after adding hints to verify they help.

  **`## Best Practices`:**

  **MUST include the `as` attribute on all `<link rel="preload">` elements and include `crossorigin` for font preloads.** Without the `as` attribute, the browser fetches the preloaded resource at default priority without the correct headers, then fetches it again when the actual consumer (CSS, JS) requests it with the correct context. The double-fetch wastes bandwidth and may delay the resource. For fonts, `crossorigin` is also required to match the CORS-mode request that `@font-face` uses.

  **SHOULD use `<link rel="preconnect">` only for origins from which critical above-the-fold resources will be loaded within the first two seconds of page load.** Each `preconnect` opens a TCP/TLS connection that consumes server and client resources. Connections to origins that are not used quickly are abandoned, wasting the handshake cost. Limit `preconnect` to two or three high-priority origins; use `dns-prefetch` for lower-priority origins.

  **SHOULD use `<link rel="prefetch">` for resources required by the next likely navigation, not for resources needed on the current page.** `prefetch` runs at idle priority and may not complete before the current page needs the resource. Using `prefetch` for current-page resources may cause those resources to arrive after a `preload` would have provided them, producing a net delay.

  **`## Visual`:** Mermaid timeline showing browser resource loading with and without hints: without hints — HTML parsed → CSS found → font requested → font loaded. With `preload` — `<link rel="preload">` processed → font fetched immediately → CSS found → font already cached. Show the time saved.

  **`## Example`:** Correct `<head>` with resource hints for a typical application:
  ```html
  <!-- Preconnect to critical third-party origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- Preload the LCP hero image -->
  <link rel="preload" as="image" href="/images/hero.webp">

  <!-- Preload the primary web font -->
  <link rel="preload" as="font" type="font/woff2" href="/fonts/inter.woff2" crossorigin>

  <!-- Prefetch the next page's bundle -->
  <link rel="prefetch" href="/about/bundle.js">
  ```

  **`## Common Mistakes`:**
  - `<link rel="preload">` without `as` attribute — double fetch
  - `<link rel="preload" as="font">` without `crossorigin` — double fetch
  - Using `prefetch` for current-page resources (they arrive too late)
  - Preloading too many resources and competing with LCP resource

  **`## Related FEEs`:**
  - FEE-700 — Rendering & Performance Overview
  - FEE-704 — Core Web Vitals & Performance Metrics
  - FEE-705 — Code Splitting, Lazy Loading & Tree Shaking
  - FEE-712 — Critical Rendering Path & Paint Timing

  **`## References`:**
  - MDN: rel=preload — https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload
  - web.dev: Preload critical assets — https://web.dev/articles/preload-critical-assets
  - web.dev: Establish network connections early — https://web.dev/articles/preconnect-and-dns-prefetch
  - W3C Resource Hints specification — https://www.w3.org/TR/resource-hints/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 711
  title: 資源提示：prefetch、preload、preconnect
  state: draft
  category: Rendering and Performance
  ---
  ```
  **H1:** `# 資源提示：\`prefetch\`、\`preload\`、\`preconnect\``

  Related FEE titles:
  - FEE-700 — 渲染與效能總覽
  - FEE-704 — 核心 Web 指標與效能指標
  - FEE-705 — 程式碼分割、懶載入與 Tree Shaking
  - FEE-712 — 關鍵渲染路徑與繪製計時

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Rendering and Performance/711.md" "docs/zh-tw/Rendering and Performance/711.md"
  git commit -m "feat(fee-711): resource hints prefetch, preload, preconnect — EN + zh-TW"
  ```

---

### Task 4: FEE-712 Critical Rendering Path & Paint Timing

**Files:**
- Create: `docs/en/Rendering and Performance/712.md`
- Create: `docs/zh-tw/Rendering and Performance/712.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 712
  title: Critical Rendering Path & Paint Timing
  state: draft
  category: Rendering and Performance
  ---
  ```

  **H1:** `# Critical Rendering Path & Paint Timing`

  **Opening (2–4 paragraphs covering):**
  - The critical rendering path is the sequence of steps the browser must complete before it can display anything on screen: download and parse HTML, download and parse CSS (render-blocking), build the DOM and CSSOM, combine them into the render tree, perform layout to compute geometry, paint pixels, and composite layers into the final frame. Optimizing the critical rendering path means reducing the number and cost of steps that block the first paint.
  - Render-blocking resources are the most impactful factor in initial paint performance. By default, `<link rel="stylesheet">` is render-blocking: the browser will not paint until all stylesheets in `<head>` have downloaded and been parsed. `<script>` without `defer` or `async` is also render-blocking and HTML-parsing-blocking. The browser encounters these tags while parsing HTML, stops, downloads the resource, processes it, and then continues. Every blocking resource adds its full network round-trip time to time-to-first-paint.
  - `PerformancePaintTiming` provides browser-reported timestamps for `first-paint` (FP) and `first-contentful-paint` (FCP). These are observable metrics that correlate with the critical rendering path's length. LCP (Largest Contentful Paint) extends this to measure when the most significant content is visible. Together, FP, FCP, and LCP form the paint timing picture that characterizes a page's rendering performance.

  **`## Principle`:**

  Engineers MUST place all `<link rel="stylesheet">` elements in the `<head>` and all `<script>` elements without `defer` or `async` at the bottom of `<body>` or with `defer`. A stylesheet in the `<body>` causes a Flash of Unstyled Content (FOUC) and a mid-render block; a `<script>` in the `<head>` without `defer` blocks HTML parsing and delays all content rendering. The `defer` attribute on scripts preserves execution order, defers execution until after HTML parsing completes, and does not block parsing — making it the default choice for application scripts.

  Engineers SHOULD eliminate or defer stylesheets that are not required for above-the-fold rendering. The entirety of a site's CSS being render-blocking means that styling for modals, footers, and other below-the-fold components delays first paint. Critical CSS inlining — embedding the styles required for above-the-fold content in a `<style>` tag and loading the full stylesheet as non-blocking — is the optimization that directly reduces FCP for CSS-heavy pages.

  **`## Design Thinking` subsections:**
  - `### DOM construction and parsing` — HTML is parsed incrementally; the browser does not wait for the full HTML before building the DOM. Streaming HTML responses improve time-to-first-byte and allow the browser to start building DOM and discovering resources earlier.
  - `### CSSOM construction` — CSS is not parsed incrementally; the browser must have the full CSSOM before layout can begin. This is why a single large CSS file delayed by a slow CDN can block all rendering even if the HTML is available.
  - `### Render tree, layout, paint, composite` — Render tree = DOM nodes with matching CSSOM rules (excludes `display: none` nodes). Layout computes geometry. Paint records drawing instructions. Composite merges layers. Each stage's cost and when it re-runs on DOM/style changes.
  - `### Measuring with PerformancePaintTiming and PerformanceObserver` — `new PerformanceObserver(list => list.getEntries().forEach(e => console.log(e.name, e.startTime))).observe({ type: 'paint', buffered: true })`. Reading FP and FCP programmatically for RUM.

  **`## Best Practices`:**

  **MUST add `defer` to all `<script src="...">` tags in the `<head>`.** Without `defer`, a `<script>` tag in `<head>` blocks HTML parsing while the script downloads and executes. `defer` allows parsing to continue in parallel with the download and executes the script after parsing completes but before `DOMContentLoaded`. For application entry points, `defer` is almost always the correct attribute.

  **SHOULD inline critical CSS — the styles needed for above-the-fold rendering — in a `<style>` tag in the document `<head>` and load the full stylesheet as non-blocking.** The technique eliminates the render-blocking stylesheet for the content the user sees first. The full stylesheet loads in parallel without blocking paint. Tools like `critical` (npm) extract above-the-fold CSS automatically.

  **SHOULD use `PerformanceObserver` with `type: 'paint'` to measure FP and FCP in production real-user monitoring.** Lab tools measure simulated performance; RUM measures what users actually experience. FP and FCP from `PerformancePaintTiming` capture rendering performance across the diversity of devices, network conditions, and pages that real users encounter.

  **`## Visual`:** Mermaid timeline showing the critical rendering path: HTML download → parse (blocked by render-blocking CSS) → CSSOM built → DOM + CSSOM → render tree → layout → first paint → LCP resource loaded → LCP paint. Annotate where `defer` and critical CSS inlining shorten the path.

  **`## Example`:** Reading FCP via PerformanceObserver:
  ```js
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        console.log('FCP:', entry.startTime.toFixed(0), 'ms');
      }
    }
  }).observe({ type: 'paint', buffered: true });
  ```

  **`## Related FEEs`:**
  - FEE-700 — Rendering & Performance Overview
  - FEE-704 — Core Web Vitals & Performance Metrics
  - FEE-709 — INP Deep Dive
  - FEE-711 — Resource Hints

  **`## References`:**
  - web.dev: Critical rendering path — https://web.dev/articles/critical-rendering-path
  - MDN: PerformancePaintTiming — https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming
  - web.dev: Eliminate render-blocking resources — https://web.dev/articles/render-blocking-resources

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 712
  title: 關鍵渲染路徑與繪製計時
  state: draft
  category: Rendering and Performance
  ---
  ```
  **H1:** `# 關鍵渲染路徑與繪製計時`

  Related FEE titles:
  - FEE-700 — 渲染與效能總覽
  - FEE-704 — 核心 Web 指標與效能指標
  - FEE-709 — INP 深度解析
  - FEE-711 — 資源提示

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Rendering and Performance/712.md" "docs/zh-tw/Rendering and Performance/712.md"
  git commit -m "feat(fee-712): critical rendering path & paint timing — EN + zh-TW"
  ```

---

### Task 5: FEE-808 Module Federation

**Files:**
- Create: `docs/en/Build Tooling and Module Systems/808.md`
- Create: `docs/zh-tw/Build Tooling and Module Systems/808.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 808
  title: Module Federation
  state: draft
  category: Build Tooling and Module Systems
  ---
  ```

  **H1:** `# Module Federation`

  **Opening (2–4 paragraphs covering):**
  - Module Federation is a Webpack 5 feature that allows JavaScript bundles to expose and consume modules from other independently deployed bundles at runtime. A host application can load a federated module — a component, a utility, an entire feature — from a remote URL without bundling it at build time. The remote bundle is loaded lazily when the module is first imported, enabling runtime composition of applications that are deployed independently.
  - This is the technical foundation for one approach to micro-frontend architecture: teams can deploy their features independently, and the host application federates them into a unified UI without a synchronous build-time dependency between teams. When team A deploys a new version of their federated module, team B's host application loads the new version on the next page load — no rebuild, no redeployment of the host.
  - The central challenge of Module Federation is shared dependency management. If the host and remote each bundle their own copy of React, users download React twice. Module Federation's shared dependencies feature allows the host and remote to negotiate which shared libraries to use at runtime — if compatible versions are available from multiple sources, only one copy is loaded. Version compatibility negotiation and singleton enforcement for libraries like React require careful configuration.

  **`## Principle`:**

  Engineers SHOULD configure shared dependencies with semantic version ranges in Module Federation to prevent duplicate loading of core libraries. React, React DOM, and other framework packages must be loaded once in the browser; loading two copies produces runtime errors. Setting `shared: { react: { singleton: true, requiredVersion: '^18' }, 'react-dom': { singleton: true, requiredVersion: '^18' } }` enforces that only one copy of React is loaded, even across host and multiple remotes, as long as all participants use compatible versions.

  Engineers MUST implement error boundaries around federated module consumption in the host application. Network failures, version incompatibilities, or deployment gaps between host and remote can cause a federated `import()` to reject. Without an error boundary, the entire application crashes when a federated module fails to load. Error boundaries isolate the failure to the federated module's subtree and display a fallback, allowing the rest of the application to continue functioning.

  **`## Design Thinking` subsections:**
  - `### Exposed vs. consumed modules` — The remote exposes modules via `exposes: { './Button': './src/Button' }`. The host consumes them via `remotes: { ui: 'ui@https://cdn.example.com/ui/remoteEntry.js' }` and imports them as `import('ui/Button')`.
  - `### Shared dependencies and version negotiation` — How Webpack negotiates versions at runtime. `singleton` mode: if two parties specify different singleton versions, the higher version wins or an error occurs depending on `strictVersion`. `eager` option: bundle the shared dep into the initial chunk instead of lazy-loading.
  - `### Deployment topology` — Host and remotes are deployed independently. The host references remotes by URL. Versioned URL paths (`/v1.2.3/remoteEntry.js`) vs. floating URLs (`/latest/remoteEntry.js`) and their trade-offs for stability and updates.
  - `### Module Federation 2.0 (rspack/Vite)` — The `@module-federation/vite` and `@module-federation/enhanced` packages bring federation to non-Webpack build tools. API differences from Webpack 5 federation.

  **`## Best Practices`:**

  **MUST mark framework packages (`react`, `react-dom`, framework libraries) as `singleton: true` in the shared configuration of all participating remotes and hosts.** React requires exactly one instance per application. Multiple React copies in the same page produce "invalid hook call" errors that are difficult to trace. `singleton: true` enforcement at the Module Federation layer prevents this class of errors structurally, regardless of the versions deployed by individual teams.

  **SHOULD version remote entry URLs with a content hash or explicit version number rather than using a floating path like `/latest/remoteEntry.js`.** Floating URLs make rollbacks impossible: when team A deploys a breaking change to their remote and the host's error boundary catches the failure, rolling back requires team A to redeploy — there is no previous artifact to reference. Versioned URLs (`/v2.1.4/remoteEntry.js`) allow the host to pin to a known-good version while team A stabilizes their module.

  **MUST wrap each federated module import in a React error boundary (or equivalent framework construct).** A federated module that fails to load — due to network failure, version mismatch, or remote server error — must not crash the host application. The error boundary catches the rejection, renders a fallback, and allows the user to continue using other parts of the application.

  **`## Visual`:** Mermaid diagram showing: host application (loaded at page load) → runtime `import('remote/Button')` → fetch `remoteEntry.js` from CDN → negotiate shared dependencies → mount federated component in host tree.

  **`## Example`:** Minimal Webpack Module Federation config:
  ```js
  // webpack.config.js (remote team)
  new ModuleFederationPlugin({
    name: 'ui',
    filename: 'remoteEntry.js',
    exposes: { './Button': './src/components/Button' },
    shared: { react: { singleton: true, requiredVersion: '^18' } },
  });
  // webpack.config.js (host)
  new ModuleFederationPlugin({
    remotes: { ui: 'ui@https://cdn.example.com/ui/remoteEntry.js' },
    shared: { react: { singleton: true, requiredVersion: '^18' } },
  });
  // In host application:
  const Button = React.lazy(() => import('ui/Button'));
  ```

  **`## Related FEEs`:**
  - FEE-800 — Build Tooling & Module Systems Overview
  - FEE-508 — Micro-Frontend Architecture
  - FEE-307 — ES Modules & Module Systems
  - FEE-506 — Error Boundaries & Resilience Patterns

  **`## References`:**
  - Webpack Module Federation docs — https://webpack.js.org/concepts/module-federation/
  - Module Federation examples — https://github.com/module-federation/module-federation-examples
  - @module-federation/vite — https://github.com/module-federation/vite

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 808
  title: Module Federation
  state: draft
  category: Build Tooling and Module Systems
  ---
  ```
  **H1:** `# Module Federation`

  Related FEE titles:
  - FEE-800 — 構建工具與模組系統總覽
  - FEE-508 — 微前端架構
  - FEE-307 — ES 模組與模組系統
  - FEE-506 — Error Boundary 與韌性模式

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Build Tooling and Module Systems/808.md" "docs/zh-tw/Build Tooling and Module Systems/808.md"
  git commit -m "feat(fee-808): module federation — EN + zh-TW"
  ```

---

### Task 6: FEE-809 Tree-Shaking Patterns & Side-Effect Marking

**Files:**
- Create: `docs/en/Build Tooling and Module Systems/809.md`
- Create: `docs/zh-tw/Build Tooling and Module Systems/809.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 809
  title: Tree-Shaking Patterns & Side-Effect Marking
  state: draft
  category: Build Tooling and Module Systems
  ---
  ```

  **H1:** `# Tree-Shaking Patterns & Side-Effect Marking`

  **Opening (2–4 paragraphs covering):**
  - Tree-shaking is the bundler's process of excluding unused exports from the final bundle. When a module exports ten functions and the application imports two, tree-shaking eliminates the other eight. The result is a smaller bundle containing only the code that is actually used. Tree-shaking works on the static structure of ES modules: because `import` and `export` statements are analyzed at parse time (not runtime), bundlers can determine which exports are used without executing code.
  - Two conditions must hold for tree-shaking to work: the module system must use ES module syntax (not CommonJS `require`/`exports`), and the modules must not have side effects that require their full code to run regardless of which exports are used. A side effect is code that runs when the module is imported, independent of which exports are consumed — modifying a global, registering a polyfill, or augmenting a prototype.
  - The `sideEffects` field in `package.json` tells bundlers which files in a package have side effects. Without it, bundlers conservatively assume every file has side effects and do not tree-shake the package. The `sideEffects: false` declaration is the author's assertion that no files in the package have side effects — that any file can be omitted if none of its exports are used.

  **`## Principle`:**

  Engineers MUST use ES module syntax (`import`/`export`) throughout application and library code, not CommonJS `require`/`exports`, for tree-shaking to function. Bundlers perform static analysis of `import` and `export` statements to build the module graph and identify unused exports. CommonJS `require()` is dynamic — the module identifier can be a variable computed at runtime — making static analysis impossible and tree-shaking ineffective for CommonJS modules.

  Library authors MUST include a `sideEffects` field in `package.json` and MUST list only files that genuinely have side effects. `"sideEffects": false` signals that no files have side effects; `"sideEffects": ["*.css", "src/polyfills.js"]` lists specific files that do. An omitted `sideEffects` field causes bundlers to skip tree-shaking the entire package — a default that protects against incorrect side-effect removal but prevents bundle size optimization.

  **`## Design Thinking` subsections:**
  - `### Barrel files and tree-shaking` — `index.ts` that re-exports from dozens of files is a tree-shaking anti-pattern. Even with `sideEffects: false`, some bundlers must process all re-exported modules to determine which exports are used. Deep imports (`import { Button } from 'lib/components/Button'`) are more tree-shakeable than barrel re-exports. The `bundlesize` and `bundle-buddy` tools help measure.
  - `### /*#__PURE__*/ annotation` — Calls that are not obviously side-effect-free can be marked with the `/*#__PURE__*/` comment to tell minifiers they can be removed if the result is unused. Used heavily in compiled output from TypeScript, Babel, and React's production JSX transform.
  - `### Measuring tree-shaking effectiveness` — `rollup-plugin-visualizer`, `webpack-bundle-analyzer`, `source-map-explorer`. Checking for duplicate packages in the bundle. Before/after bundle size comparison when adding `sideEffects: false`.
  - `### CSS in JS and tree-shaking` — CSS-in-JS libraries that register styles as module-level side effects prevent tree-shaking of unused components. Libraries that generate CSS at build time (Linaria, vanilla-extract) are tree-shakeable.

  **`## Best Practices`:**

  **MUST write all modules using ES module syntax (`import`/`export`), not CommonJS (`require`/`module.exports`), in both application code and libraries intended for bundler consumption.** Bundlers tree-shake ES modules by static analysis; they cannot tree-shake CommonJS because `require()` arguments are dynamic. When a library ships only a CommonJS build, all its exports are included in the bundle regardless of usage.

  **SHOULD add `"sideEffects": false` to `package.json` for libraries and packages whose modules do not produce side effects on import.** Without this field, Webpack, Rollup, and Vite conservatively include all modules from the package, even unused ones. The `false` value unlocks tree-shaking for the entire package. Files with genuine side effects (CSS imports, polyfills) should be listed explicitly.

  **SHOULD avoid barrel files (`index.ts` that re-exports everything) in large component libraries.** Barrel files force the bundler to analyze the entire module graph of re-exported files to determine what is actually used, increasing build time and potentially reducing tree-shaking effectiveness. Deep path imports are preferable for large libraries: `import { Button } from 'my-lib/Button'` rather than `import { Button } from 'my-lib'`.

  **`## Visual`:** Mermaid diagram showing tree-shaking: module graph with 5 exports → only 2 are imported by app entry point → bundler marks 3 as unreferenced → final bundle contains only 2 exports.

  **`## Example`:** `package.json` with correct `sideEffects` configuration:
  ```json
  {
    "name": "my-ui-library",
    "module": "./dist/esm/index.js",
    "main": "./dist/cjs/index.js",
    "sideEffects": ["**/*.css", "src/registerServiceWorker.js"]
  }
  ```

  **`## Related FEEs`:**
  - FEE-800 — Build Tooling & Module Systems Overview
  - FEE-307 — ES Modules & Module Systems
  - FEE-705 — Code Splitting, Lazy Loading & Tree Shaking

  **`## References`:**
  - Webpack: Tree Shaking — https://webpack.js.org/guides/tree-shaking/
  - Rollup: Tree-shaking — https://rollupjs.org/introduction/#tree-shaking
  - web.dev: Reduce JavaScript payloads with tree shaking — https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 809
  title: Tree-Shaking 模式與副作用標記
  state: draft
  category: Build Tooling and Module Systems
  ---
  ```
  **H1:** `# Tree-Shaking 模式與副作用標記`

  Related FEE titles:
  - FEE-800 — 構建工具與模組系統總覽
  - FEE-307 — ES 模組與模組系統
  - FEE-705 — 程式碼分割、懶載入與 Tree Shaking

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Build Tooling and Module Systems/809.md" "docs/zh-tw/Build Tooling and Module Systems/809.md"
  git commit -m "feat(fee-809): tree-shaking patterns & side-effect marking — EN + zh-TW"
  ```

---

### Task 7: FEE-810 TypeScript Integration in the Build Pipeline

**Files:**
- Create: `docs/en/Build Tooling and Module Systems/810.md`
- Create: `docs/zh-tw/Build Tooling and Module Systems/810.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 810
  title: TypeScript Integration in the Build Pipeline
  state: draft
  category: Build Tooling and Module Systems
  ---
  ```

  **H1:** `# TypeScript Integration in the Build Pipeline`

  **Opening (2–4 paragraphs covering):**
  - TypeScript's compiler (`tsc`) can be used for two purposes: type checking (discovering type errors) and transpilation (converting TypeScript to JavaScript). Modern build pipelines typically separate these roles: fast transpilers (esbuild, SWC, Babel) handle the TypeScript-to-JavaScript conversion at build time and in the dev server, while `tsc --noEmit` runs type checking as a separate pass — in CI, in a pre-commit hook, or in the editor.
  - The reason for separation is speed. `tsc` must process the entire project's type graph — following every import to resolve types, inferring return types, checking assignments — before it can report errors. For a large project, this takes seconds to tens of seconds. esbuild and SWC strip type annotations without type-checking, producing JavaScript in milliseconds. The developer experience in the editor and the dev server stays fast because the transpiler handles hot reload; type safety is validated by `tsc` as a separate, slower check.
  - The separation model has one important implication: type errors do not block the dev server. A developer can run a page with a type error in the browser as long as the JavaScript produced by the transpiler is semantically valid. This is generally the right trade-off for development speed, but CI must run `tsc --noEmit` to ensure that type errors do not reach the main branch.

  **`## Principle`:**

  Engineers MUST run `tsc --noEmit` in CI on every pull request and treat type errors as blocking failures equivalent to failing tests. Type checking in the editor catches errors for the developer as they type; `tsc --noEmit` in CI catches type errors that were introduced in the PR's changes or that result from changes to shared types. Without `tsc --noEmit` in CI, type errors accumulate silently over time until they are discovered in production as runtime bugs.

  Engineers SHOULD use a fast transpiler (esbuild, SWC) for the dev server and production bundle, and restrict `tsc` to type checking (`--noEmit`) and declaration file emission (`--emitDeclarationOnly`). Using `tsc` for bundle output is slower than esbuild or SWC by an order of magnitude. The production bundle does not benefit from type information at runtime; the type information's value is captured entirely at check time.

  **`## Design Thinking` subsections:**
  - `### tsc --noEmit vs. tsc for output` — `--noEmit`: type-checks and exits; no JS output. Used in CI and pre-commit. `--emitDeclarationOnly`: emits `.d.ts` files without JS; used in library builds. Bundler handles JS output.
  - `### tsconfig for bundler vs. tsc output` — `tsconfig.json` for `tsc --noEmit` type checking can differ from tsconfig for the bundler. The bundler (Vite, esbuild) reads tsconfig for settings like `paths` and `compilerOptions.target` but does not perform type checking. A `tsconfig.build.json` that extends the base config and sets `noEmit: false` can produce declarations without affecting dev config.
  - `### Type checking in monorepos` — `tsc --build` with project references type-checks all packages in dependency order incrementally. `tsc -p tsconfig.json --noEmit` type-checks a single package. CI strategies: parallel per-package type check, or root-level `tsc --build`.
  - `### Declaration files in libraries` — Library packages must ship `.d.ts` files for consumers to get type information. `tsc --emitDeclarationOnly` generates declarations from source. Bundlers like Rollup with `rollup-plugin-dts` or Vite's library mode can also emit declarations.

  **`## Best Practices`:**

  **MUST add `tsc --noEmit` as a required CI step that blocks merge on failure.** A codebase that does not run type checking in CI will accumulate type errors over time. Developers who ignore editor type errors because "it builds anyway" will merge those errors to main. The CI gate enforces that the type system's guarantees are maintained across the entire codebase, not just in files the developer happened to have open.

  **SHOULD use `"isolatedModules": true` in `tsconfig.json` when using esbuild or SWC for transpilation.** `isolatedModules: true` flags type-only imports and exports that cannot be safely stripped by a single-file transpiler (which does not have cross-file type information). The flag ensures that the TypeScript code is written in a way that is compatible with single-file transpilation, preventing subtle build errors that occur only in production when the transpiler strips a type import that was also the only import from a module.

  **SHOULD configure `"declaration": true` and `"declarationMap": true` for library packages.** Declaration maps link `.d.ts` files back to TypeScript source, enabling "go to source definition" in editors to navigate to the original `.ts` file rather than the generated `.d.ts` file. This significantly improves the development experience for library consumers who have the source available.

  **`## Visual`:** Mermaid diagram showing the dual pipeline: source files → esbuild/SWC (transpile) → JS bundle (dev + prod). Same source → tsc --noEmit (type check) → errors/clear (CI). Show that both pipelines run from the same source; only one produces output.

  **`## Example`:** GitHub Actions job running type check and build separately:
  ```yaml
  jobs:
    type-check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci
        - run: npx tsc --noEmit
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci
        - run: npm run build  # uses esbuild/vite, no tsc
  ```

  **`## Related FEEs`:**
  - FEE-800 — Build Tooling & Module Systems Overview
  - FEE-803 — Transpilation: Babel, TypeScript Compiler & SWC
  - FEE-1700 — TypeScript Overview
  - FEE-1706 — tsconfig & Strict Mode

  **`## References`:**
  - TypeScript: tsconfig reference — https://www.typescriptlang.org/tsconfig
  - esbuild: TypeScript — https://esbuild.github.io/content-types/#typescript
  - SWC: TypeScript — https://swc.rs/docs/configuration/compilation#jscparser
  - Vite: TypeScript — https://vitejs.dev/guide/features#typescript

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 810
  title: TypeScript 在構建流程中的整合
  state: draft
  category: Build Tooling and Module Systems
  ---
  ```
  **H1:** `# TypeScript 在構建流程中的整合`

  Related FEE titles:
  - FEE-800 — 構建工具與模組系統總覽
  - FEE-803 — 轉譯：Babel、TypeScript 編譯器與 SWC
  - FEE-1700 — TypeScript 總覽
  - FEE-1706 — tsconfig 與嚴格模式

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Build Tooling and Module Systems/810.md" "docs/zh-tw/Build Tooling and Module Systems/810.md"
  git commit -m "feat(fee-810): TypeScript integration in the build pipeline — EN + zh-TW"
  ```

---

### Task 8: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [708.HTTP/1.1, HTTP/2 & HTTP/3: Protocol Evolution](708)`, add:
  ```
  - [709.INP Deep Dive: Interaction to Next Paint](709)
  - [710.GPU-Accelerated Animations & will-change](710)
  - [711.Resource Hints: prefetch, preload, preconnect](711)
  - [712.Critical Rendering Path & Paint Timing](712)
  ```

  After `- [807.Build Optimization: Minification, Caching & Output Analysis](807)`, add:
  ```
  - [808.Module Federation](808)
  - [809.Tree-Shaking Patterns & Side-Effect Marking](809)
  - [810.TypeScript Integration in the Build Pipeline](810)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [708.HTTP/1.1、HTTP/2 與 HTTP/3：協定演進](708)`, add:
  ```
  - [709.INP 深度解析：從互動到下一幀繪製](709)
  - [710.GPU 加速動畫與 will-change](710)
  - [711.資源提示：prefetch、preload、preconnect](711)
  - [712.關鍵渲染路徑與繪製計時](712)
  ```

  After `- [807.構建最佳化：壓縮、快取與產出分析](807)`, add:
  ```
  - [808.Module Federation](808)
  - [809.Tree-Shaking 模式與副作用標記](809)
  - [810.TypeScript 在構建流程中的整合](810)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-709–712 and 808–810 to list files"
  ```
