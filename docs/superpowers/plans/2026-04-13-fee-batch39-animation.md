# FEE Batch 39 — Animation & Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write all 7 Animation & Motion category articles (FEE-2100 through FEE-2106) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW translation. Articles follow the standard FEE format. Coverage spans CSS animation, the Web Animations API, performance (compositor thread), motion design principles, accessibility, and library choices. Examples reference CSS, WAAPI, and Framer Motion patterns.

**Tech Stack:** Markdown, content authoring. Reference `docs/en/Developer Experience and Tooling/1603.md` for format.

---

## File Map

**New directories to create:**
- `docs/en/Animation and Motion/`
- `docs/zh-tw/Animation and Motion/`

**Files to create (EN):** `2100.md` through `2106.md` under `docs/en/Animation and Motion/`
**Files to create (zh-TW):** Mirror under `docs/zh-tw/Animation and Motion/`

---

### Task 1: FEE-2100 Animation & Motion Overview

**Files:**
- Create: `docs/en/Animation and Motion/2100.md`
- Create: `docs/zh-tw/Animation and Motion/2100.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 2100
  title: Animation & Motion Overview
  state: draft
  overview: true
  category: Animation and Motion
  ---
  ```

  **Opening context (3–4 paragraphs):**
  - Animation in user interfaces is not decoration — it is communication. A button that pulses after being clicked communicates that the click was received. A panel that slides into view communicates its origin and relationship to the triggering element. A list item that fades out when deleted communicates that the deletion was intentional and complete. Motion that lacks communicative purpose is noise; motion that carries purpose reduces cognitive load by making state transitions visible.
  - The web has two animation layers: the main thread and the compositor thread. CSS transitions and animations that affect only `transform` and `opacity` run on the compositor thread — they are GPU-accelerated and immune to main thread jank. Animations that affect layout properties (`width`, `height`, `top`, `margin`) run on the main thread and can be interrupted by JavaScript execution. Understanding this distinction is the foundation of performant web animation.
  - This category covers the full animation stack: CSS transitions and keyframes, the Web Animations API (WAAPI), compositor thread performance, motion design principles for UI, accessibility requirements (`prefers-reduced-motion`), and the library landscape. The articles are ordered from the foundational (CSS) through the systemic (design principles and accessibility) to the ecosystem (libraries).

  **`## Design Thinking` subsections:**
  - `### Animation as state transition communication` — Animation should answer the question "what changed?" Every significant state change in the UI — an item appearing, disappearing, moving, or transforming — is an opportunity to use motion to make the change legible. Discrete changes (no animation) can be disorienting when the UI changes suddenly. Excessive animation (every element moving at once) is overwhelming. The principle: animate at the boundaries of state changes, not within stable states.
  - `### The cost model: main thread vs. compositor` — Animating `transform: translateX(100px)` on the compositor thread is effectively free — it runs on the GPU, does not trigger reflow, and does not block JavaScript execution. Animating `left: 100px` on the main thread triggers layout on every frame — in a complex DOM, this is expensive enough to cause dropped frames. The practical rule: animate only `transform` and `opacity` for performance-critical animations.
  - `### Progressive enhancement for motion` — Not all users experience motion the same way. Users with vestibular disorders can experience nausea from large, fast, or parallax animations. The `prefers-reduced-motion` media query reports whether the user has requested reduced motion in their OS settings. Animations that respect this preference are both accessible and professionally polished; those that ignore it are a WCAG violation.

  **`## Best Practices`:**

  **MUST limit performance-critical animations to `transform` and `opacity` properties.** These two properties are composited by the GPU and do not trigger layout or paint. Animating any other CSS property — `width`, `height`, `background-color`, `top`, `left`, `margin` — triggers layout recalculation on every frame, which can cause dropped frames and jank. Use `transform: translate()` instead of `top`/`left`; use `opacity` instead of `visibility`; use `transform: scaleX()` instead of `width`.

  **MUST respect the `prefers-reduced-motion` media query by disabling or substantially reducing animations for users who have requested reduced motion.** Failure to respect this preference is a WCAG 2.1 Level AAA violation (Success Criterion 2.3.3) and causes genuine discomfort for users with vestibular disorders. The minimum implementation: wrap all non-essential animations in `@media (prefers-reduced-motion: no-preference)`. The preferred implementation: provide a reduced-motion alternative that communicates the same state change without large motion.

  **SHOULD use CSS transitions for simple state transitions and the Web Animations API (WAAPI) for programmatically controlled or sequenced animations.** CSS transitions are declarative and sufficient for hover states, focus states, and simple entrance/exit animations. WAAPI provides `element.animate()` for animations that are triggered imperatively, need to be paused/reversed, or are sequenced with other animations. Reach for a JavaScript animation library only when WAAPI is insufficient.

  **`## Related FEEs`:**
  - FEE-2101 — CSS Transitions & Keyframe Animations
  - FEE-2103 — Animation Performance & the Compositor Thread
  - FEE-2105 — prefers-reduced-motion & Accessible Animation

  **`## References`:**
  - MDN: CSS Animations — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations
  - MDN: Web Animations API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
  - Google: Animations and Performance — https://web.dev/articles/animations-and-performance

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2100`, `title: 動畫與動態效果總覽`, `state: draft`, `overview: true`, `category: Animation and Motion`

  Key terms: 動畫（animation）、動態效果（motion）、合成執行緒（compositor thread）、主執行緒（main thread）、狀態轉換（state transition）、漸進增強（progressive enhancement）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2100.md" "docs/zh-tw/Animation and Motion/2100.md"
  git commit -m "feat(fee): add FEE-2100 Animation & Motion Overview (EN + zh-TW)"
  ```

---

### Task 2: FEE-2101 CSS Transitions & Keyframe Animations

**Files:**
- Create: `docs/en/Animation and Motion/2101.md`
- Create: `docs/zh-tw/Animation and Motion/2101.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2101`, `title: CSS Transitions & Keyframe Animations`, `state: draft`, `category: Animation and Motion`

  **Opening context:** CSS provides two animation mechanisms: transitions (smooth change between two states triggered by a property change) and keyframe animations (sequences of states defined by `@keyframes`). Transitions are appropriate for state changes driven by user interaction — hover, focus, active. Keyframe animations are appropriate for looping animations, multi-step sequences, and animations that run on page load independently of interaction.

  **`## Design Thinking` subsections:**
  - `### Transition: property, duration, easing, delay` — The `transition` shorthand accepts `property duration easing delay`. `transition: transform 200ms ease-out` animates only `transform` changes. `transition: all 200ms ease-out` animates all property changes — including ones the developer did not intend, which can cause unexpected animation when unrelated properties change. Specify the exact property rather than using `all`.
  - `### Easing functions: the feel of motion` — Easing functions control the velocity curve of an animation. `ease-in` starts slow and accelerates — appropriate for elements leaving the screen. `ease-out` starts fast and decelerates — appropriate for elements entering the screen. `ease-in-out` is symmetric — appropriate for looping or oscillating motion. `linear` is constant velocity — appropriate for progress bars. Custom cubic-bezier easing allows precise control.
  - `### will-change: use sparingly` — `will-change: transform` hints to the browser that an element will animate, allowing it to promote the element to a GPU layer in advance. This can reduce animation startup jank for complex elements but consumes GPU memory. Using `will-change` on many elements simultaneously can degrade performance. Apply it only to elements that animate frequently and only while animation is expected.

  **`## Best Practices`:**

  **MUST specify the exact CSS property in `transition` rather than using `transition: all`.** `transition: all` animates every property that changes, including layout-triggering properties that should not be animated and properties that change unexpectedly (such as during theme changes or responsive layout shifts). `transition: transform 200ms ease-out, opacity 150ms ease-out` is explicit about what animates and prevents unintended animation.

  **MUST define `@keyframes` animations to animate only `transform` and `opacity` for any animation that runs continuously or is triggered frequently.** A keyframe animation that changes `width` on every frame triggers layout recalculation on every frame. For an animation that runs continuously — a loading spinner, a pulsing indicator — this is a constant layout cost. Continuous animations must animate compositor-only properties.

  **SHOULD use `ease-out` easing for elements entering the screen and `ease-in` for elements leaving.** Elements that enter the screen should feel responsive — fast at first, settling into their final position. Elements that leave should feel like they are being removed — starting immediately and fading away. These easing choices match users' physical intuitions about objects appearing and disappearing and make the UI feel more natural.

  **`## Related FEEs`:**
  - FEE-2100 — Animation & Motion Overview
  - FEE-2103 — Animation Performance & the Compositor Thread

  **`## References`:**
  - MDN: transition — https://developer.mozilla.org/en-US/docs/Web/CSS/transition
  - MDN: @keyframes — https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
  - MDN: easing-function — https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2101`, `title: CSS 過渡動畫與關鍵影格動畫`, `state: draft`, `category: Animation and Motion`

  Key terms: CSS 過渡（CSS transition）、關鍵影格（keyframe）、緩動函式（easing function）、will-change 屬性、合成器層（compositor layer）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2101.md" "docs/zh-tw/Animation and Motion/2101.md"
  git commit -m "feat(fee): add FEE-2101 CSS Transitions & Keyframe Animations (EN + zh-TW)"
  ```

---

### Task 3: FEE-2102 Web Animations API

**Files:**
- Create: `docs/en/Animation and Motion/2102.md`
- Create: `docs/zh-tw/Animation and Motion/2102.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2102`, `title: Web Animations API`, `state: draft`, `category: Animation and Motion`

  **Opening context:** The Web Animations API (WAAPI) provides JavaScript control over CSS animations and a programmatic model for creating new animations. `element.animate(keyframes, options)` creates an `Animation` object that can be played, paused, reversed, and cancelled. This makes WAAPI appropriate for animations that are triggered imperatively, need to respond to user input mid-animation, or are sequenced with other animations. WAAPI does not replace CSS animations — it complements them for cases where declarative CSS is insufficient.

  **`## Design Thinking` subsections:**
  - `### element.animate(): keyframes and timing` — `element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' })` creates an animation and returns an `Animation` object. The keyframes array uses the same properties as CSS `@keyframes`. The timing object accepts `duration`, `easing`, `delay`, `iterations`, and `fill`. `fill: 'forwards'` retains the end state after the animation completes (equivalent to `animation-fill-mode: forwards`).
  - `### Animation.finished: awaiting completion` — `animation.finished` is a Promise that resolves when the animation completes. `await element.animate(...).finished` allows sequential animation without nesting callbacks. `Promise.all([anim1.finished, anim2.finished])` waits for multiple animations to complete before proceeding.
  - `### getAnimations() and cancel()` — `element.getAnimations()` returns all active animations on an element. Calling `.cancel()` on each removes the animation and resets the element's styles. This is useful for interrupting an animation before it completes (e.g., when the user triggers a new state while the previous transition is still running).

  **`## Best Practices`:**

  **MUST use `fill: 'forwards'` when an animation should retain its end state and `fill: 'none'` (the default) when the element should return to its original state.** An animation without `fill` reverts the element to its pre-animation styles when it completes. This causes a flash (the animated state disappears instantly) for entrance animations. `fill: 'forwards'` retains the final keyframe's styles. For exit animations followed by element removal, `fill: 'none'` is correct — the element will be removed from the DOM.

  **SHOULD cancel existing animations on an element before starting a new one when the new animation may conflict with the previous one.** Animations run concurrently by default. If a "fade in" animation is 50% complete when a "fade out" animation starts, both run simultaneously and produce unpredictable results. `element.getAnimations().forEach(a => a.cancel())` clears existing animations before starting the new one.

  **SHOULD use `animation.finished` promises to sequence animations rather than `setTimeout`.** `setTimeout` durations drift from animation durations when duration values change. `animation.finished` resolves exactly when the animation completes regardless of duration value. Sequence with `await animation.finished` for linear sequences; use `Promise.all` for parallel sequences with a synchronized continuation.

  **`## Related FEEs`:**
  - FEE-2100 — Animation & Motion Overview
  - FEE-2101 — CSS Transitions & Keyframe Animations
  - FEE-2103 — Animation Performance & the Compositor Thread

  **`## References`:**
  - MDN: Web Animations API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
  - MDN: Element.animate() — https://developer.mozilla.org/en-US/docs/Web/API/Element/animate

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2102`, `title: Web Animations API`, `state: draft`, `category: Animation and Motion`

  Key terms: Web Animations API（WAAPI）、關鍵影格陣列（keyframes array）、動畫填充（animation fill）、動畫完成 Promise（animation.finished）、取消動畫（cancel animation）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2102.md" "docs/zh-tw/Animation and Motion/2102.md"
  git commit -m "feat(fee): add FEE-2102 Web Animations API (EN + zh-TW)"
  ```

---

### Task 4: FEE-2103 Animation Performance & the Compositor Thread

**Files:**
- Create: `docs/en/Animation and Motion/2103.md`
- Create: `docs/zh-tw/Animation and Motion/2103.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2103`, `title: Animation Performance & the Compositor Thread`, `state: draft`, `category: Animation and Motion`

  **Opening context:** The browser's rendering pipeline has three stages relevant to animation: layout (computing element positions and sizes), paint (drawing pixels), and composite (combining GPU layers). An animation that triggers layout runs the most expensive stage on every frame. An animation that triggers only composite runs only the cheapest stage. The difference between a 60fps animation and a janky one is often the choice of which CSS properties to animate.

  **`## Design Thinking` subsections:**
  - `### The rendering pipeline: layout → paint → composite` — Layout is triggered by any property that affects an element's size or position (`width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`). Paint is triggered by properties that affect appearance without layout (`background-color`, `box-shadow`, `border-color`). Composite is triggered only by `transform` and `opacity` — the only two properties that bypass layout and paint entirely.
  - `### Layer promotion and GPU memory` — The browser promotes an element to its own GPU layer when it detects that the element will be composited separately — often triggered by `will-change: transform` or `transform: translateZ(0)`. Layer promotion allows the compositor to animate the layer without re-running layout or paint. The cost: promoted layers consume GPU memory. Over-promoting (using `will-change` on many elements) can degrade performance by exhausting GPU memory.
  - `### Measuring animation performance` — Chrome DevTools' Performance panel records frame timing. The "Rendering" tab's "Frame Rendering Stats" overlay shows frames per second and identifies dropped frames. The "Layers" panel shows which elements have been promoted to GPU layers. These tools allow engineers to verify that animations are running on the compositor and identify layout-triggering properties.

  **`## Best Practices`:**

  **MUST animate only `transform` and `opacity` for any animation where smooth 60fps performance is required.** Every other CSS property either triggers layout (recomputing the entire element tree's positions) or triggers paint (redrawing pixels) on every animated frame. Layout on every frame is the most common cause of animation jank. Use `transform: translate()` instead of `top`/`left`, `transform: scale()` instead of `width`/`height`, and `opacity` instead of `visibility` or `display`.

  **MUST measure animation performance with DevTools before and after performance-critical animation work rather than assuming compositor-thread execution.** `will-change: transform` does not guarantee compositor execution — the browser may decide not to promote the layer. Recording a Performance profile and checking that "Composite Layers" tasks appear in the timeline (not "Layout" or "Paint") is the only reliable verification.

  **SHOULD use `will-change: transform` only on elements that animate frequently and only for the duration of the animation.** Adding `will-change` to an element creates a GPU layer permanently, consuming memory until the property is removed. For animations triggered by user interaction, add `will-change` on `mouseenter` or `animationstart` and remove it on `mouseleave` or `animationend`. For continuous animations, `will-change` may be appropriate to keep in the stylesheet.

  **`## Related FEEs`:**
  - FEE-2100 — Animation & Motion Overview
  - FEE-704 — Core Web Vitals & Performance Metrics

  **`## References`:**
  - Google: Stick to compositor-only properties — https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
  - Google: Animations and Performance — https://web.dev/articles/animations-and-performance
  - Chrome DevTools: Analyze runtime performance — https://developer.chrome.com/docs/devtools/performance/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW format**

  **Frontmatter:** `id: 2103`, `title: 動畫效能與合成執行緒`, `state: draft`, `category: Animation and Motion`

  Key terms: 渲染流程（rendering pipeline）、版面配置（layout）、繪製（paint）、合成（composite）、GPU 層（GPU layer）、層提升（layer promotion）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2103.md" "docs/zh-tw/Animation and Motion/2103.md"
  git commit -m "feat(fee): add FEE-2103 Animation Performance & the Compositor Thread (EN + zh-TW)"
  ```

---

### Task 5: FEE-2104 Motion Design Principles for UI

**Files:**
- Create: `docs/en/Animation and Motion/2104.md`
- Create: `docs/zh-tw/Animation and Motion/2104.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2104`, `title: Motion Design Principles for UI`, `state: draft`, `category: Animation and Motion`

  **Opening context:** Motion design for user interfaces is a discipline with principles derived from traditional animation, physics simulation, and UX research. A developer who understands these principles can evaluate whether a proposed animation serves its purpose, choose appropriate duration and easing values, and push back on animations that create problems. Without these principles, animation decisions are aesthetic guesses — they may look fine in isolation but feel wrong in context.

  **`## Design Thinking` subsections:**
  - `### Duration: the 100–500ms range` — UI animations should almost always fall between 100ms and 500ms. Under 100ms is too fast to perceive — the animation provides no communicative value. Over 500ms feels slow and blocks the user from the next action. Micro-interactions (button presses, toggle switches) should be 100–200ms. Transitions between major states (page transitions, modal appearance) should be 200–400ms. Decorative animations that are not blocking can be longer.
  - `### Easing and physical intuition` — Easing functions that mimic physical forces feel natural because they match users' intuitions about how objects move. `ease-out` (fast entry, slow finish) matches objects entering a space under friction — they slow as they settle. `ease-in` (slow entry, fast exit) matches objects leaving under gravity — they accelerate as they go. `spring` easing (overshoot and settle) mimics elastic objects and is used in iOS UI to great effect.
  - `### Hierarchy and choreography` — When multiple elements animate simultaneously, the animation should communicate their relationship. Related elements should move together. An element that appears in response to another should animate slightly after its trigger. Leading with the most important element and following with supporting elements creates visual hierarchy through time.

  **`## Best Practices`:**

  **MUST keep UI animation durations between 100ms and 500ms for animations that are in the user's critical path.** Animations that the user must wait for before taking their next action — modal opening, panel sliding in, page transition — directly add to perceived latency. Every millisecond above the minimum necessary duration is friction. Decorative animations outside the critical path can be longer, but should not distract from content.

  **SHOULD use `ease-out` as the default easing for elements entering the screen.** `ease-out` (fast start, slow finish) feels responsive — the element appears immediately and settles smoothly. It is the standard choice for dropdown menus, tooltips, modals, and any UI element that appears in response to user action. The alternative, `ease-in` (slow start, fast end), produces an entrance that feels sluggish.

  **SHOULD design motion at the component level, not as post-hoc additions.** Motion that is added after a component's behavior is designed tends to be decorative. Motion designed as part of the component communicates state transitions that are already in the spec: loading → loaded, collapsed → expanded, selected → deselected. Each transition is an opportunity to use motion to make the change legible.

  **`## Related FEEs`:**
  - FEE-2100 — Animation & Motion Overview
  - FEE-2105 — prefers-reduced-motion & Accessible Animation

  **`## References`:**
  - Google Material Design: Motion — https://m3.material.io/styles/motion/overview
  - Apple Human Interface Guidelines: Motion — https://developer.apple.com/design/human-interface-guidelines/motion
  - Designing Interface Animation (Val Head) — https://rosenfeldmedia.com/books/designing-interface-animation/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2104`, `title: 介面動態設計原則`, `state: draft`, `category: Animation and Motion`

  Key terms: 動態設計（motion design）、動畫持續時間（animation duration）、緩動（easing）、彈性緩動（spring easing）、動畫層次（animation hierarchy）、編排（choreography）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2104.md" "docs/zh-tw/Animation and Motion/2104.md"
  git commit -m "feat(fee): add FEE-2104 Motion Design Principles for UI (EN + zh-TW)"
  ```

---

### Task 6: FEE-2105 prefers-reduced-motion & Accessible Animation

**Files:**
- Create: `docs/en/Animation and Motion/2105.md`
- Create: `docs/zh-tw/Animation and Motion/2105.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2105`, `title: prefers-reduced-motion & Accessible Animation`, `state: draft`, `category: Animation and Motion`

  **Opening context:** Vestibular disorders — conditions that affect the inner ear and balance system — affect approximately 35% of adults over 40. Large, fast, or parallax animations can trigger nausea, dizziness, and headaches in affected users. The `prefers-reduced-motion` media query reflects the user's OS-level "reduce motion" setting, available on macOS, iOS, Windows, and Android. Respecting this preference is WCAG 2.1 Level AAA (Success Criterion 2.3.3 Animation from Interactions) and Level AA for certain auto-playing content.

  **`## Design Thinking` subsections:**
  - `### Reduce vs. remove` — `prefers-reduced-motion: reduce` means the user has requested reduced motion — not no motion. The correct response is to reduce large, fast, or parallax motion while preserving communicative motion. A modal that normally slides in from the bottom can fade in for users who prefer reduced motion — the fade still communicates that the modal appeared, but without the directional movement that triggers vestibular response.
  - `### Safe and unsafe animations` — Animations that are consistently safe for vestibular users: opacity fades, color transitions, small-scale transforms. Animations that may be unsafe: large translations (elements moving across the screen), parallax scrolling, auto-playing videos, looping animations with fast motion. The distinction is scale and speed — a small, slow transform is different from a large, fast one.
  - `### JavaScript detection` — The CSS media query `@media (prefers-reduced-motion: reduce)` handles CSS animations. For JavaScript-driven animations (WAAPI, library animations), check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before starting the animation and listen to the `change` event to respond to the user changing their preference without a page reload.

  **`## Best Practices`:**

  **MUST wrap all non-essential CSS animations and transitions in `@media (prefers-reduced-motion: no-preference)`.** The approach of disabling animations by default and opting into them only when `no-preference` is set is more conservative and more correct than disabling animations only when `reduce` is set. Any animation not in a `no-preference` block runs regardless of the user's preference.

  **MUST check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before starting JavaScript-driven animations and skip or replace them with a reduced alternative when the result is `true`.** CSS media queries do not affect WAAPI animations or JavaScript animation library animations. JavaScript animations require explicit media query checks in the animation initialization code.

  **SHOULD provide a reduced-motion alternative rather than simply removing animations.** The alternative communicates the same state change — a modal appearing, an item being deleted — using a safe animation (opacity fade) instead of a potentially unsafe one (slide from off-screen). Removing all animation for reduced-motion users eliminates the communicative value of motion; replacing it with safe animation preserves the communication.

  **`## Related FEEs`:**
  - FEE-2100 — Animation & Motion Overview
  - FEE-2104 — Motion Design Principles for UI
  - FEE-1000 — Accessibility Overview

  **`## References`:**
  - WCAG 2.1: 2.3.3 Animation from Interactions — https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
  - MDN: prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  - A List Apart: Designing Safer Web Animation — https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2105`, `title: prefers-reduced-motion 與無障礙動畫`, `state: draft`, `category: Animation and Motion`

  Key terms: 減少動態（prefers-reduced-motion）、前庭系統障礙（vestibular disorder）、安全動畫（safe animation）、無障礙動畫（accessible animation）、動態偏好（motion preference）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2105.md" "docs/zh-tw/Animation and Motion/2105.md"
  git commit -m "feat(fee): add FEE-2105 prefers-reduced-motion & Accessible Animation (EN + zh-TW)"
  ```

---

### Task 7: FEE-2106 Animation Libraries

**Files:**
- Create: `docs/en/Animation and Motion/2106.md`
- Create: `docs/zh-tw/Animation and Motion/2106.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2106`, `title: Animation Libraries`, `state: draft`, `category: Animation and Motion`

  **Opening context:** CSS transitions and WAAPI are sufficient for the majority of UI animation needs. Animation libraries become appropriate when the required animations involve physics-based easing (springs, inertia), complex sequencing across multiple elements, gesture-driven animation, or layout animations (animating an element between its position in two different layouts). The three major libraries — Framer Motion, GSAP, and Motion One — have different design philosophies and different appropriate use cases.

  **`## Design Thinking` subsections:**
  - `### Framer Motion: declarative React integration` — Framer Motion provides `motion` components (`<motion.div>`) with `animate`, `initial`, `exit`, and `whileHover` props. Its `AnimatePresence` component animates unmounting elements (which CSS cannot do, since unmounting removes the element before the animation runs). Framer Motion's layout animation feature (`layout` prop) automatically animates an element between its position in different layout states. The cost: bundle size (~30kb gzipped), React dependency.
  - `### GSAP: imperative power` — GSAP (GreenSock Animation Platform) is the most capable animation library available, suitable for complex timeline-based animations, SVG animation, and scroll-driven effects. Its API is imperative: `gsap.to(element, { x: 100, duration: 0.3, ease: 'power2.out' })`. GSAP's timeline API sequences animations precisely. Its free tier covers most use cases; the Club GreenSock plugins (MorphSVG, DrawSVG, ScrollTrigger) require a license.
  - `### Motion One: WAAPI-based, small footprint` — Motion One is a thin wrapper around the Web Animations API that adds spring physics, sequence utilities, and timeline support while keeping bundle size minimal (~3kb). It is the right choice when WAAPI's capabilities are sufficient but its API is too low-level and bundle size is a constraint.

  **`## Best Practices`:**

  **MUST NOT reach for an animation library before exhausting CSS transitions and WAAPI.** Library animations add bundle weight and dependency maintenance cost. CSS handles the vast majority of UI animation needs. WAAPI adds programmatic control. Only when both are genuinely insufficient — the animation requires spring physics, complex sequencing, or layout animation between arbitrary DOM states — is a library justified.

  **SHOULD choose Framer Motion for React applications that need layout animation, exit animation on unmount, or gesture-driven animation.** These three capabilities are Framer Motion's specific strengths and are not achievable with CSS or WAAPI alone without significant custom code. For applications that do not need these capabilities, the bundle cost is not justified.

  **SHOULD choose GSAP for animations that require precise timeline sequencing, SVG path animation, or scroll-driven effects at scale.** GSAP is mature, performant, and has the most complete feature set of any animation library. It is framework-agnostic. Its free tier (which includes timeline, ScrollTrigger is now free) is sufficient for most projects.

  **`## Related FEEs`:**
  - FEE-2100 — Animation & Motion Overview
  - FEE-2102 — Web Animations API
  - FEE-2105 — prefers-reduced-motion & Accessible Animation

  **`## References`:**
  - Framer Motion documentation — https://www.framer.com/motion/
  - GSAP documentation — https://gsap.com/docs/v3/
  - Motion One documentation — https://motion.dev/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2106`, `title: 動畫函式庫`, `state: draft`, `category: Animation and Motion`

  Key terms: 動畫函式庫（animation library）、Framer Motion、GSAP、Motion One、佈局動畫（layout animation）、彈簧物理（spring physics）、時間軸（timeline）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Animation and Motion/2106.md" "docs/zh-tw/Animation and Motion/2106.md"
  git commit -m "feat(fee): add FEE-2106 Animation Libraries (EN + zh-TW)"
  ```
