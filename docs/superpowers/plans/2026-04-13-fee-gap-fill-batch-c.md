# FEE Gap-Fill Batch C — Browser APIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 5 gap-fill articles for the Browser APIs category (FEE-412–416) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/Browser APIs and Web Platform/412.md` — requestAnimationFrame & Animation Timing
- `docs/en/Browser APIs and Web Platform/413.md` — Geolocation, Device Orientation & Device APIs
- `docs/en/Browser APIs and Web Platform/414.md` — Broadcast Channel & SharedWorker
- `docs/en/Browser APIs and Web Platform/415.md` — Permissions API
- `docs/en/Browser APIs and Web Platform/416.md` — Web Speech API

**Files to create (zh-TW):** Mirror under `docs/zh-tw/Browser APIs and Web Platform/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Key rules:
- `## Principle` → 1–2 paragraphs, RFC-2119 only
- `## Best Practices` → bold-prefix prose only, no code/`###`/bullets
- `## Visual` → one Mermaid diagram
- `## Example` → one realistic code block
- Target: 300+ lines per file

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

---

### Task 1: FEE-412 `requestAnimationFrame` & Animation Timing

**Files:**
- Create: `docs/en/Browser APIs and Web Platform/412.md`
- Create: `docs/zh-tw/Browser APIs and Web Platform/412.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 412
  title: requestAnimationFrame & Animation Timing
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```

  **H1:** `` # `requestAnimationFrame` & Animation Timing ``

  **Opening (2–4 paragraphs covering):**
  - JavaScript animations driven by `setInterval` or `setTimeout` have a fundamental problem: the timer fires on a fixed interval regardless of when the browser is ready to paint. If the browser's rendering pipeline is busy, the timer fires anyway, scheduling a DOM mutation that will not be visible until the next frame. The result is dropped frames and jank. `requestAnimationFrame` (rAF) solves this by letting the browser call your animation function at the beginning of each frame, synchronized with the display refresh rate.
  - rAF does not guarantee 60fps; it guarantees that the callback runs before the next paint. On a 60Hz display, that is every ~16.7ms; on a 120Hz display, every ~8.3ms; on a throttled background tab, much less frequently. The browser can skip frames when it needs to, and rAF-driven animations automatically pause when the tab is backgrounded, preventing invisible animations from consuming CPU.
  - `performance.now()` provides high-resolution timestamps (sub-millisecond) for measuring animation progress independent of frame rate. The rAF callback receives a DOMHighResTimeStamp argument — the same clock — allowing animations to advance based on elapsed time rather than frame count. This makes animations frame-rate independent: an animation that takes one second to complete will take one second at 30fps and at 120fps.

  **`## Principle`:**

  Engineers MUST drive JavaScript-based visual animations through `requestAnimationFrame`, not `setInterval` or `setTimeout`. Timer-driven animations run at a fixed interval that is decoupled from the browser's rendering pipeline. When the render thread is busy, timer callbacks accumulate and fire back-to-back, producing a burst of DOM mutations in a single frame followed by multiple frames with no updates. The result is jitter that is perceptible to users. rAF-driven animations synchronize with the rendering pipeline by design.

  Engineers SHOULD express animation progress as a function of elapsed time (`timestamp - startTime`) rather than as a function of frame count. Frame-count-based animations run at different speeds on different devices and displays. Time-based animations advance by the same amount of progress per real-world millisecond regardless of the device's frame rate, ensuring visual consistency across a 60Hz laptop and a 120Hz phone.

  **`## Design Thinking` subsections:**
  - `### The rAF callback loop` — How to structure a rAF loop: call rAF, receive timestamp in callback, compute progress from (timestamp - startTime) / duration, update DOM, call rAF again. Cancel with `cancelAnimationFrame(id)`.
  - `### requestIdleCallback` — The companion API for non-visual work: analytics, prefetching, background computations. Runs when the browser is idle between frames. Not available in all environments; use with a timeout fallback.
  - `### PerformanceObserver and paint timing` — `PerformanceObserver` with `entryTypes: ['frame']`, `PerformanceLongAnimationFrameObserver`. Measuring actual frame timing vs. expected timing to detect jank.
  - `### CSS animations vs. JavaScript rAF` — CSS animations and transitions run on the compositor thread without involving JavaScript. rAF is for animations that require JavaScript logic — physics, spring dynamics, gesture-driven animation, anything that reads DOM state. Prefer CSS where possible.

  **`## Best Practices`:**

  **MUST cancel `requestAnimationFrame` callbacks when the animated element is removed from the DOM or the component is unmounted.** An rAF loop that holds a reference to a removed element prevents the element from being garbage-collected and continues running JavaScript on every frame indefinitely. Store the return value of `requestAnimationFrame` and call `cancelAnimationFrame(id)` in cleanup (component unmount, element removal, animation end).

  **SHOULD avoid reading layout properties (`offsetWidth`, `getBoundingClientRect`, `scrollTop`) and writing DOM properties in the same rAF callback.** Reading a layout property after writing one forces the browser to synchronously recalculate layout — a "forced reflow" or "layout thrash." Batch all reads before all writes within a single rAF callback, or use separate rAF callbacks for read and write phases.

  **SHOULD use `performance.now()` for measuring durations in animation loops rather than `Date.now()`.** `performance.now()` provides sub-millisecond resolution and is not affected by system clock adjustments. `Date.now()` has millisecond resolution and can jump forward or backward when the system clock is adjusted. The rAF callback timestamp argument is already a `performance.now()`-compatible value.

  **`## Visual`:** Mermaid sequence diagram: browser frame → rAF callback fires → calculate elapsed time → update DOM → request next frame. Show the feedback loop and where `cancelAnimationFrame` breaks it.

  **`## Example`:** A complete rAF animation loop that moves an element from 0 to 300px over 1 second:
  ```js
  function animate(element) {
    const duration = 1000;
    let startTime = null;
    let rafId;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      element.style.transform = `translateX(${progress * 300}px)`;
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId); // return cleanup fn
  }
  ```

  **`## Common Mistakes`:**
  - Using `setInterval` for animations and getting jitter when the system is under load
  - Forgetting to cancel rAF on component unmount, causing animation loops on removed elements
  - Using frame count instead of elapsed time, producing speed-variable animations across devices
  - Reading `getBoundingClientRect` and then writing `style` in the same callback (forced reflow)

  **`## Related FEEs`:**
  - FEE-400 — Browser APIs & Web Platform Overview
  - FEE-710 — GPU-Accelerated Animations & `will-change`
  - FEE-712 — Critical Rendering Path & Paint Timing

  **`## References`:**
  - MDN: requestAnimationFrame — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
  - MDN: requestIdleCallback — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
  - web.dev: Rendering performance — https://web.dev/articles/rendering-performance

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 412
  title: requestAnimationFrame 與動畫計時
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```
  **H1:** `` # `requestAnimationFrame` 與動畫計時 ``

  Related FEE titles:
  - FEE-400 — 瀏覽器 API 與 Web 平台總覽
  - FEE-710 — GPU 加速動畫與 `will-change`
  - FEE-712 — 關鍵渲染路徑與繪製計時

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Browser APIs and Web Platform/412.md" "docs/zh-tw/Browser APIs and Web Platform/412.md"
  git commit -m "feat(fee-412): requestAnimationFrame & animation timing — EN + zh-TW"
  ```

---

### Task 2: FEE-413 Geolocation, Device Orientation & Device APIs

**Files:**
- Create: `docs/en/Browser APIs and Web Platform/413.md`
- Create: `docs/zh-tw/Browser APIs and Web Platform/413.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 413
  title: Geolocation, Device Orientation & Device APIs
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```

  **H1:** `# Geolocation, Device Orientation & Device APIs`

  **Opening (2–4 paragraphs covering):**
  - The Geolocation API, Device Orientation API, and Device Motion API expose hardware sensors to web applications. Geolocation provides latitude/longitude (and optionally altitude, heading, and speed) from GPS, Wi-Fi triangulation, or cell tower data. `DeviceOrientationEvent` provides the device's spatial orientation via the accelerometer and gyroscope. `DeviceMotionEvent` provides raw acceleration and rotation rate data.
  - All of these APIs require explicit user permission. Browsers will not grant access to location or motion sensors without a permission prompt, and the permission must be requested in response to a user gesture on most platforms. This is not just a browser policy; it reflects a design principle: applications that need sensitive data must ask for it transparently. Building an application that tries to access location silently or on page load without a clear user-facing reason will be blocked.
  - The practical challenge with device APIs is handling the full permission lifecycle — requesting, receiving, handling denial, and requesting again appropriately — while providing a useful experience when sensors are unavailable (desktop browsers without GPS, users who decline). Progressive enhancement: the feature works without the sensor; the sensor makes it better.

  **`## Principle`:**

  Engineers MUST request Geolocation access in response to an explicit user action — a button click, form submission, or similar gesture — never on page load. Browsers block permission prompts that are not triggered by user gestures, and users who see an unsolicited location prompt on page load dismiss it immediately. The correct UX is to explain why location is needed before requesting it, request it when the user triggers the feature, and handle the denied state gracefully.

  Engineers MUST handle all three `PositionError` codes: `PERMISSION_DENIED` (1), `POSITION_UNAVAILABLE` (2), and `TIMEOUT` (3). Unhandled geolocation errors silently leave the UI in a loading state indefinitely. The error handler must update the UI to an appropriate fallback: a message explaining that location is unavailable, or a manual address entry form.

  **`## Design Thinking` subsections:**
  - `### One-time vs. continuous position` — `getCurrentPosition` vs. `watchPosition`. When to use each. `clearWatch` to stop continuous updates. Battery implications of continuous GPS on mobile.
  - `### PositionOptions` — `enableHighAccuracy` (trades battery for precision), `timeout` (maximum wait before error), `maximumAge` (how old a cached position is acceptable). Sensible defaults.
  - `### DeviceOrientationEvent and DeviceMotionEvent` — Euler angles (alpha, beta, gamma) vs. absolute orientation. iOS 13+ requires `DeviceOrientationEvent.requestPermission()`. Use cases: AR overlays, compass, tilt-based UI.
  - `### HTTPS requirement` — All device sensor APIs require a secure context (HTTPS or localhost). This is enforced by the browser. Applications on plain HTTP cannot access geolocation or motion sensors regardless of user permission.

  **`## Best Practices`:**

  **MUST request Geolocation permission only after explaining to the user why location data is needed and what it will be used for.** Permission prompts that appear without context are dismissed at high rates. A brief explanation ("We need your location to find nearby stores") before triggering the permission prompt improves acceptance rates and respects informed consent.

  **SHOULD specify a `timeout` value in `getCurrentPosition` options to prevent indefinite loading states when the device cannot obtain a fix.** Without a timeout, the promise may wait for the hardware indefinitely — GPS cold starts can take over 30 seconds. A timeout of 5–10 seconds with a `TIMEOUT` error handler that falls back to a less accurate method or prompts manual input provides a better user experience.

  **MUST call `clearWatch` on the return value of `watchPosition` when continuous position tracking is no longer needed.** `watchPosition` continues querying the device's location hardware until explicitly stopped, draining the battery on mobile devices. Store the watch ID and call `clearWatch` on component unmount or when the feature that required location tracking is deactivated.

  **`## Visual`:** Mermaid flowchart of the geolocation permission lifecycle: user triggers feature → `getCurrentPosition` called → browser prompts user → granted branch (success callback) vs. denied branch (error callback PERMISSION_DENIED) vs. unavailable (POSITION_UNAVAILABLE) vs. timeout (TIMEOUT).

  **`## Example`:** Complete geolocation usage with error handling:
  ```js
  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          const messages = { 1: 'Permission denied', 2: 'Position unavailable', 3: 'Timeout' };
          reject(new Error(messages[err.code] ?? 'Unknown error'));
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });
  }
  ```

  **`## Related FEEs`:**
  - FEE-400 — Browser APIs & Web Platform Overview
  - FEE-415 — Permissions API
  - FEE-1202 — Authentication & Token Storage (privacy considerations)

  **`## References`:**
  - MDN: Geolocation API — https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
  - MDN: DeviceOrientationEvent — https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
  - MDN: DeviceMotionEvent — https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
  - W3C Geolocation API — https://w3c.github.io/geolocation/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 413
  title: 地理位置、裝置方向與裝置 API
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```
  **H1:** `# 地理位置、裝置方向與裝置 API`

  Related FEE titles:
  - FEE-400 — 瀏覽器 API 與 Web 平台總覽
  - FEE-415 — Permissions API
  - FEE-1202 — 身份驗證與 Token 儲存

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Browser APIs and Web Platform/413.md" "docs/zh-tw/Browser APIs and Web Platform/413.md"
  git commit -m "feat(fee-413): geolocation, device orientation & device APIs — EN + zh-TW"
  ```

---

### Task 3: FEE-414 Broadcast Channel & SharedWorker

**Files:**
- Create: `docs/en/Browser APIs and Web Platform/414.md`
- Create: `docs/zh-tw/Browser APIs and Web Platform/414.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 414
  title: Broadcast Channel & SharedWorker
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```

  **H1:** `# Broadcast Channel & SharedWorker`

  **Opening (2–4 paragraphs covering):**
  - When a user has multiple tabs of the same origin open, those tabs are independent JavaScript execution contexts. A login in one tab does not automatically refresh the session state in other tabs. A shopping cart update in one tab is invisible to others. Two mechanisms exist to coordinate state across tabs: `BroadcastChannel` for simple event broadcasting, and `SharedWorker` for shared computation and centralized state.
  - `BroadcastChannel` is a simple pub/sub mechanism: any tab that has a channel with the same name receives messages posted to that channel by any other tab. It is one-directional broadcasting — the sender does not receive its own messages, and there is no request/response pattern. It is appropriate for notifications: "the user just logged out — all tabs should redirect to login."
  - `SharedWorker` is a Web Worker that persists as a single shared instance across all tabs from the same origin. Each tab connects to the same worker via a `MessagePort`. The worker can maintain state, coordinate requests, and reply individually to each connected tab. It is appropriate for shared caches, WebSocket connection pooling, and scenarios where duplicating work across tabs is expensive.

  **`## Principle`:**

  Engineers SHOULD use `BroadcastChannel` for cross-tab event notification where no response is required and the event carries its full context as the message payload. Auth state changes (login, logout, token refresh), theme changes, and cache invalidation signals are canonical BroadcastChannel use cases. The channel is fire-and-forget; if a tab is closed when the message is broadcast, it simply does not receive it.

  Engineers SHOULD use `SharedWorker` when multiple tabs need to share a single, stateful resource — a WebSocket connection, a local cache of API responses, or a shared background sync state. A `SharedWorker` prevents N tabs from each opening their own WebSocket to the same server; one Worker holds one connection and fans out messages to connected tabs. The Worker's lifetime is tied to the number of connected ports: it terminates when all tabs that connected have closed.

  **`## Design Thinking` subsections:**
  - `### BroadcastChannel vs. localStorage events` — `localStorage` fires a `storage` event in other tabs when values change. This is the pre-BroadcastChannel approach. BroadcastChannel is more explicit (named channels), supports arbitrary serializable values (not just strings), and does not persist state.
  - `### SharedWorker port lifecycle` — Each tab gets a `MessagePort` via the `connect` event. Ports close when tabs close; the Worker's `onconnect` and port's `onclose` (or error detection via postMessage) are how the Worker tracks connected clients.
  - `### Service Worker as an alternative` — Service Workers can broadcast to all controlled clients via `clients.matchAll()` and `client.postMessage()`. They persist across tab closures. The distinction: BroadcastChannel/SharedWorker are tabs talking to tabs; Service Worker is an interceptor and background service that can initiate communication.
  - `### Browser support and debugging` — SharedWorker is supported in all major browsers except Safari on iOS (as of 2024). DevTools for SharedWorkers: Chrome exposes a `chrome://inspect/#workers` panel. Debugging shared state is harder because the Worker's lifetime spans multiple inspected windows.

  **`## Best Practices`:**

  **SHOULD close `BroadcastChannel` instances when they are no longer needed.** `channel.close()` removes the channel from the broadcast group and releases its resources. In components or services that create channels dynamically, closing on cleanup prevents memory leaks and ensures that garbage-collected components do not continue receiving messages.

  **SHOULD use `SharedWorker` to deduplicate expensive shared resources — WebSocket connections, persistent polling, shared IndexedDB access — rather than creating one resource per tab.** Multiple tabs each opening a WebSocket to the same server multiplies server load proportionally to the number of open tabs. A single SharedWorker WebSocket serves all tabs with one connection, and the Worker can fan out updates to each tab's port.

  **MUST use structured-cloneable values in all `BroadcastChannel.postMessage` and `SharedWorker` port messages.** Functions, DOM nodes, and class instances with prototype methods cannot be transferred across execution contexts. Only types supported by the Structured Clone algorithm are valid message payloads.

  **`## Visual`:** Mermaid diagram showing three browser tabs connected to a single SharedWorker via MessagePorts. Also show BroadcastChannel with one tab broadcasting and two others receiving.

  **`## Example`:** BroadcastChannel for auth state sync:
  ```js
  // In any tab after logout:
  const channel = new BroadcastChannel('auth');
  channel.postMessage({ type: 'LOGOUT' });
  channel.close();

  // In all other tabs:
  const channel = new BroadcastChannel('auth');
  channel.onmessage = (e) => {
    if (e.data.type === 'LOGOUT') { window.location.href = '/login'; }
  };
  ```

  **`## Related FEEs`:**
  - FEE-400 — Browser APIs & Web Platform Overview
  - FEE-405 — Web Workers & Concurrency
  - FEE-313 — Structured Clone & `structuredClone()` (message serialization)

  **`## References`:**
  - MDN: BroadcastChannel — https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
  - MDN: SharedWorker — https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker
  - Can I Use: SharedWorker — https://caniuse.com/sharedworkers

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 414
  title: Broadcast Channel 與 SharedWorker
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```
  **H1:** `# Broadcast Channel 與 SharedWorker`

  Related FEE titles:
  - FEE-400 — 瀏覽器 API 與 Web 平台總覽
  - FEE-405 — Web Workers 與並行處理
  - FEE-313 — 結構化複製與 `structuredClone()`

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Browser APIs and Web Platform/414.md" "docs/zh-tw/Browser APIs and Web Platform/414.md"
  git commit -m "feat(fee-414): broadcast channel & SharedWorker — EN + zh-TW"
  ```

---

### Task 4: FEE-415 Permissions API

**Files:**
- Create: `docs/en/Browser APIs and Web Platform/415.md`
- Create: `docs/zh-tw/Browser APIs and Web Platform/415.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 415
  title: Permissions API
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```

  **H1:** `# Permissions API`

  **Opening (2–4 paragraphs covering):**
  - Browser APIs that access sensitive resources — camera, microphone, geolocation, notifications, clipboard, MIDI — each have their own permission gating. Before the Permissions API, the only way to know if a permission had been granted was to call the API and see if it succeeded. `navigator.permissions.query()` provides a way to check the current state of any permission before invoking the API that requires it, enabling UX that adapts to the user's permission state without triggering a new permission prompt.
  - The Permissions API models three states: `granted` (the user has allowed), `denied` (the user has blocked, and the browser will not prompt again), and `prompt` (the browser will show a prompt when the API is invoked). This three-state model lets applications decide whether to show an in-app permission explanation UI (for `prompt` state), show a settings-link UI (for `denied` state, since the browser will not re-prompt), or proceed directly to the feature (for `granted` state).
  - Permissions are increasingly policy-controlled through Permissions Policy (formerly Feature Policy), which allows pages to restrict what permissions iframes can request and what origins can use certain capabilities. Understanding the Permissions API in isolation is incomplete without understanding how server-sent Permissions Policy headers compose with user grants.

  **`## Principle`:**

  Engineers SHOULD query permission state before invoking a permission-gated API when the application's UI needs to adapt to the current state. For a camera feature, querying `{ name: 'camera' }` before rendering the camera button allows the button to show a "grant access" affordance for `prompt` state, a "settings" link for `denied` state, and direct camera activation for `granted` state. This eliminates the pattern of calling the API and catching the error as the only way to discover the `denied` state.

  Engineers MUST design for the `denied` permission state explicitly. When a user blocks a permission, the browser will not show the permission prompt again unless the user manually changes the setting in browser preferences. An application that silently fails when a permission is `denied` — showing a loading spinner that never resolves — creates a broken experience with no recovery path. The `denied` state requires an explicit UI: a message, a link to browser settings, and in some cases an alternative flow.

  **`## Design Thinking` subsections:**
  - `### Querying vs. requesting permissions` — `navigator.permissions.query()` only reads state; it does not request permission. Requesting happens when the underlying API is called. The query tells you the current state; the request happens at the point of use.
  - `### Permission change events` — `permissionStatus.addEventListener('change', handler)` fires when the user changes the permission in browser settings while the page is open. Applications should update their UI in response.
  - `### Permissions Policy (server-side)` — The `Permissions-Policy` HTTP header and `allow` attribute on `<iframe>`. How they interact with user grants. A feature blocked by Permissions Policy cannot be granted by the user; the permission check returns `denied`.
  - `### Coverage and limitations` — Not all permissions are queryable via the Permissions API in all browsers. Some (e.g., `clipboard-read`) have partial support. Always check MDN browser compatibility before relying on a specific permission name.

  **`## Best Practices`:**

  **SHOULD query permission state on page load for features that are central to the page's purpose, to pre-render the appropriate UI state without waiting for a user action.** A photo editing app that queries camera permission state on load can immediately show "grant camera access" affordance if the state is `prompt`, rather than showing it only after the user clicks a button and receives no camera feed.

  **MUST provide explicit UI for the `denied` permission state that guides the user to browser settings.** When permission is `denied`, the browser will not show a re-prompt. An application that does not handle this state leaves users stranded. The minimum acceptable UI is a message that identifies which permission is blocked and provides a link to the browser settings path where users can change it.

  **SHOULD subscribe to `permissionStatus.onchange` for permissions that users may change in browser settings during a session.** Users who revoke camera access while a video call is in progress should see an immediate UI response — not a failed API call with an opaque error. The `change` event allows the application to react in real time.

  **`## Visual`:** Mermaid decision flowchart: `navigator.permissions.query()` → state = 'granted' (show feature) / state = 'prompt' (show explanation UI, then invoke API on user action) / state = 'denied' (show settings link).

  **`## Example`:** Permission query with UI adaptation:
  ```js
  async function setupCamera() {
    const status = await navigator.permissions.query({ name: 'camera' });
    if (status.state === 'granted') {
      startCamera();
    } else if (status.state === 'prompt') {
      showGrantCameraButton();
    } else {
      showDeniedMessage('Camera access is blocked. Enable it in browser settings.');
    }
    status.addEventListener('change', () => setupCamera()); // re-run on state change
  }
  ```

  **`## Related FEEs`:**
  - FEE-400 — Browser APIs & Web Platform Overview
  - FEE-413 — Geolocation, Device Orientation & Device APIs
  - FEE-1204 — CORS & CSRF (cross-origin permission considerations)

  **`## References`:**
  - MDN: Permissions API — https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API
  - MDN: Permissions Policy — https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy
  - W3C Permissions specification — https://www.w3.org/TR/permissions/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 415
  title: Permissions API
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```
  **H1:** `# Permissions API`

  Related FEE titles:
  - FEE-400 — 瀏覽器 API 與 Web 平台總覽
  - FEE-413 — 地理位置、裝置方向與裝置 API
  - FEE-1204 — 跨來源資源共享（CORS）與跨網站請求偽造（CSRF）

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Browser APIs and Web Platform/415.md" "docs/zh-tw/Browser APIs and Web Platform/415.md"
  git commit -m "feat(fee-415): permissions API — EN + zh-TW"
  ```

---

### Task 5: FEE-416 Web Speech API

**Files:**
- Create: `docs/en/Browser APIs and Web Platform/416.md`
- Create: `docs/zh-tw/Browser APIs and Web Platform/416.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 416
  title: Web Speech API
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```

  **H1:** `# Web Speech API`

  **Opening (2–4 paragraphs covering):**
  - The Web Speech API provides two capabilities: speech synthesis (text-to-speech via `SpeechSynthesis`) and speech recognition (speech-to-text via `SpeechRecognition`). Speech synthesis is available in all modern browsers; speech recognition has broader support in Chromium-based browsers and limited support in Safari. Neither capability is available in all deployment environments, making progressive enhancement the default approach.
  - Speech synthesis is the simpler half. `speechSynthesis.speak(new SpeechSynthesisUtterance('Hello'))` converts text to audio using the platform's built-in voices. `SpeechSynthesisUtterance` properties control rate, pitch, volume, and voice selection. Voice availability varies by operating system and browser; applications should enumerate available voices and handle the case where a desired voice is not present.
  - Speech recognition enables voice input: a user speaks, the browser sends audio to a speech recognition service (typically server-side, though implementation details are browser-defined), and the result arrives as a transcript. This capability raises privacy considerations — audio leaves the device — and requires microphone permission. Applications that use speech recognition must disclose this data flow to users.

  **`## Principle`:**

  Engineers MUST treat the Web Speech API as a progressive enhancement and provide functional fallback UI for all features that use it. `SpeechRecognition` is not available in Firefox and has limited availability in Safari. `SpeechSynthesis` voice availability varies across platforms. Features that rely solely on speech input or output without keyboard/pointer fallbacks exclude users on non-supporting browsers and users who cannot use speech.

  Engineers MUST disclose to users that speech recognition sends audio to a third-party server for processing, before requesting microphone permission for speech recognition. The Web Speech API's speech recognition implementation in Chrome sends audio to Google's servers. This is a data privacy consideration that requires informed user consent, particularly in applications subject to GDPR or similar regulations.

  **`## Design Thinking` subsections:**
  - `### SpeechSynthesisUtterance properties` — `text`, `voice`, `rate` (0.1–10), `pitch` (0–2), `volume` (0–1). Events: `start`, `end`, `pause`, `resume`, `boundary`, `error`. Canceling: `speechSynthesis.cancel()`.
  - `### Voice loading async behavior` — `speechSynthesis.getVoices()` may return an empty array synchronously; voices load asynchronously and trigger `speechSynthesis.onvoiceschanged`. Pattern: call `getVoices()` in the `onvoiceschanged` handler.
  - `### SpeechRecognition modes` — `continuous` mode vs. single-utterance mode. `interimResults` for real-time display of partial transcripts. `lang` attribute for language specification.
  - `### Browser support and polyfill strategy` — `SpeechRecognition` is prefixed (`webkitSpeechRecognition`) in some browsers. Feature detect before use. Server-side speech recognition via Web Audio API + Whisper or similar as a fallback.
  - `### Accessibility implications` — Voice input as an accessibility feature for users with motor impairments. The Web Speech API makes this possible without a proprietary plugin. Ensure the speech input path meets the same functional requirements as keyboard input.

  **`## Best Practices`:**

  **MUST feature-detect both `SpeechSynthesis` and `SpeechRecognition` before use and provide fallback UI.** Check `'speechSynthesis' in window` and `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window` before rendering speech-dependent UI. A text input is always the correct fallback for voice input; a visible text display is always the correct fallback for speech output.

  **SHOULD enumerate available voices in the `speechSynthesis.onvoiceschanged` event handler, not synchronously at startup.** `getVoices()` returns an empty array before voices have loaded on many browsers. Selecting a voice at startup from an empty array produces silent failures or incorrect voice selection. The `onvoiceschanged` event fires once voices are loaded; this is the correct point to build a voice selector or apply a voice preference.

  **MUST stop `SpeechRecognition` when the user navigates away, the component unmounts, or the user explicitly stops recording.** `recognition.stop()` terminates recognition gracefully. Not stopping recognition may leave the microphone indicator active in the browser, confusing users and creating a privacy concern. Always clean up recognition in response to page visibility changes (`visibilitychange` event) and component unmount.

  **`## Visual`:** Mermaid sequence diagram for speech recognition flow: user clicks microphone → `recognition.start()` → browser requests microphone permission → audio captured → sent to recognition service → `result` event with transcript → display text → `recognition.stop()`.

  **`## Example`:** Basic speech recognition with interim results:
  ```js
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { console.warn('Speech recognition not supported'); }
  else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      document.querySelector('#output').textContent = transcript;
    };
    recognition.onerror = (e) => console.error('Speech error:', e.error);
    document.querySelector('#mic-btn').onclick = () => recognition.start();
  }
  ```

  **`## Common Mistakes`:**
  - Calling `getVoices()` synchronously and finding an empty array
  - Not handling `SpeechRecognitionError` events (network errors, aborted, no-speech)
  - Leaving speech recognition running after the component unmounts
  - Not disclosing audio transmission in apps subject to privacy regulations

  **`## Related FEEs`:**
  - FEE-400 — Browser APIs & Web Platform Overview
  - FEE-415 — Permissions API (microphone permission)
  - FEE-1000 — Accessibility Overview (voice input as accessibility feature)

  **`## References`:**
  - MDN: Web Speech API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
  - MDN: SpeechSynthesis — https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
  - MDN: SpeechRecognition — https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
  - Can I Use: Speech Recognition — https://caniuse.com/speech-recognition

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 416
  title: Web Speech API
  state: draft
  category: Browser APIs and Web Platform
  ---
  ```
  **H1:** `# Web Speech API`

  Related FEE titles:
  - FEE-400 — 瀏覽器 API 與 Web 平台總覽
  - FEE-415 — Permissions API
  - FEE-1000 — 無障礙設計總覽

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Browser APIs and Web Platform/416.md" "docs/zh-tw/Browser APIs and Web Platform/416.md"
  git commit -m "feat(fee-416): web speech API — EN + zh-TW"
  ```

---

### Task 6: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [411.WebTransport](411)`, add:
  ```
  - [412.requestAnimationFrame & Animation Timing](412)
  - [413.Geolocation, Device Orientation & Device APIs](413)
  - [414.Broadcast Channel & SharedWorker](414)
  - [415.Permissions API](415)
  - [416.Web Speech API](416)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [411.WebTransport](411)`, add:
  ```
  - [412.requestAnimationFrame 與動畫計時](412)
  - [413.地理位置、裝置方向與裝置 API](413)
  - [414.Broadcast Channel 與 SharedWorker](414)
  - [415.Permissions API](415)
  - [416.Web Speech API](416)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-412 through 416 to list files"
  ```
