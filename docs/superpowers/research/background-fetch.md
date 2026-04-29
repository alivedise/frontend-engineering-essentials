I have abundant verified material. Let me return the structured findings document.

---

# Findings: FEE-1313 Background Fetch API for Long-Running Downloads

## Source Verification

All sources below were successfully WebFetch-verified. All quotes are verbatim.

| Source | URL | Author / Provenance |
|---|---|---|
| WICG Background Fetch spec | https://wicg.github.io/background-fetch/ | WICG editor's draft |
| MDN Background Fetch API | https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API | MDN contributors |
| MDN BackgroundFetchManager | https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchManager | MDN contributors |
| MDN BackgroundFetchEvent | https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchEvent | MDN contributors |
| MDN backgroundfetchsuccess event | https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/backgroundfetchsuccess_event | MDN contributors |
| MDN Background Synchronization API | https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API | MDN contributors |
| Chrome Developers blog | https://developer.chrome.com/blog/background-fetch | Jake Archibald, 2018-12-03 |
| web.dev AI download article | https://web.dev/articles/background-fetch-ai | Thomas Steiner |
| caniuse — backgroundFetch | https://caniuse.com/mdn-api_serviceworkerregistration_backgroundfetch | caniuse.com |

Rejected: chromestatus.com page returned no extractable content; replaced its role with caniuse data.

---

## Claims (15 verified)

### C1. Background Fetch is for large/long-running downloads, not short fetches
- **Source:** MDN Background Fetch API
- **Quote:** "The **Background Fetch API** provides a method for managing downloads that may take a significant amount of time such as movies, audio files, and software."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API

### C2. The page-staying-open problem this API solves
- **Source:** MDN Background Fetch API
- **Quote:** "When a web application requires the user to download large files, this often presents a problem in that the user needs to stay connected to the page for the download to complete."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API

### C3. Initiation is from the main thread via `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)`
- **Source:** MDN Background Fetch API; Chrome blog (Jake Archibald)
- **Quotes:**
  - "Then call `backgroundFetch.fetch()` to perform a fetch. This returns a promise that resolves with a [`BackgroundFetchRegistration`]."
  - "const bgFetch = await swReg.backgroundFetch.fetch('my-fetch', ['/ep-5.mp3', 'ep-5-artwork.jpg'], {…})"
- **URLs:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API ; https://developer.chrome.com/blog/background-fetch

### C4. The fetch outlives page closure — the browser keeps it running
- **Source:** Chrome blog (Jake Archibald); WICG spec
- **Quotes:**
  - "If the user closes pages to your site after step 1, that's ok, the download will continue."
  - "Allow fetches (requests & responses) to continue even if the user closes all windows & workers to the origin"
- **URLs:** https://developer.chrome.com/blog/background-fetch ; https://wicg.github.io/background-fetch/

### C5. Browser displays a system download UI with progress and cancel control
- **Source:** MDN Background Fetch API; web.dev AI article (Thomas Steiner); WICG spec
- **Quotes:**
  - "The browser then performs the fetches in a user-visible way, displaying progress to the user and giving them a method to cancel the download."
  - "As the browser fetches, it displays progress to the user and gives them a method to cancel the download."
  - "Allow the browser/OS to show UI to indicate the progress of that job."
- **URLs:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API ; https://web.dev/articles/background-fetch-ai ; https://wicg.github.io/background-fetch/

### C6. Why Background Sync is the wrong tool for long downloads — service worker liveness limit
- **Source:** MDN Background Fetch API; Chrome blog (Jake Archibald)
- **Quotes:**
  - "The [Background Synchronization API] provides a way for service workers to defer processing until a user is connected; however it can't be used for long running tasks such as downloading a large file. Background Sync requires that the service worker stays alive until the fetch is completed, and to conserve battery life and to prevent unwanted tasks happening in the background the browser will at some point terminate the task. The Background Fetch API solves this problem."
  - "It requires the service worker to be alive for the duration of the fetch. That isn't a problem for short bits of work like sending a message, but if the task takes too long the browser will kill the service worker."
- **URLs:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API ; https://developer.chrome.com/blog/background-fetch

### C7. Initiating offline is supported — the fetch starts when connectivity returns and pauses when it drops
- **Source:** MDN Background Fetch API; web.dev AI article
- **Quotes:**
  - "The Background Fetch API will enable the fetch to happen if the user starts the process while offline. Once they are connected it will begin. If the user goes off line, the process pauses until the user is on again."
  - "The Background Fetch API can even prepare the fetch to start while offline. As soon as the user reconnects, the download begins."
- **URLs:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API ; https://web.dev/articles/background-fetch-ai

### C8. Service worker receives four lifecycle events: `success`, `fail`, `abort`, `click`
- **Source:** MDN Background Fetch API
- **Quotes:**
  - "`backgroundfetchsuccess` event: Fired when all of the requests in a background fetch operation have succeeded."
  - "`backgroundfetchfail` event: Fired when at least one of the requests in a background fetch operation has failed."
  - "`backgroundfetchabort` event: Fired when a background fetch operation has been canceled by the user or the app."
  - "`backgroundfetchclick` event: Fired when the user has clicked on the UI for a background fetch operation."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API

### C9. On `backgroundfetchsuccess`, the service worker stores responses (typically into Cache API) and may update the system UI via `event.updateUI()`
- **Source:** MDN backgroundfetchsuccess event page
- **Quotes:**
  - "When a background fetch operation completes successfully (meaning that all individual network requests have completed successfully), the browser starts the service worker, if necessary, and fires the `backgroundfetchsuccess` event in the service worker's global scope."
  - "In the handler for this event, the service worker can retrieve and store the responses (for example, using the [`Cache`] API). To access the response data, the service worker uses the event's [`registration`] property."
  - "In the `backgroundfetchsuccess` handler, the service worker can update that UI to show that the operation has completed successfully. To do this, the handler calls the event's [`updateUI()`] method, passing in a new title and/or icons."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/backgroundfetchsuccess_event

### C10. `BackgroundFetchManager` is a map keyed by fetch id; provides `fetch()`, `get(id)`, `getIds()`
- **Source:** MDN BackgroundFetchManager
- **Quotes:**
  - "The `BackgroundFetchManager` interface of the Background Fetch API is a map where the keys are background fetch IDs and the values are `BackgroundFetchRegistration` objects."
  - "`fetch()`: Returns a Promise that resolves with a `BackgroundFetchRegistration` object for a supplied array of URLs and `Request` objects."
  - "`get()`: Returns a Promise that resolves with the `BackgroundFetchRegistration` associated with the provided `id` or `undefined` if the `id` is not found."
  - "`getIds()`: Returns the IDs of all registered background fetches."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchManager

### C11. `BackgroundFetchOptions` dictionary carries UI metadata: `title`, `icons`, plus `downloadTotal` for progress
- **Source:** WICG spec; MDN code example
- **Quotes:**
  - From spec: "dictionary `BackgroundFetchOptions` : `BackgroundFetchUIOptions` { unsigned long long `downloadTotal` = 0; };"
  - From MDN code example: `{ title: "Episode 5: Interesting things.", icons: [{ sizes: "300x300", src: "/ep-5-icon.png", type: "image/png" }], downloadTotal: 60 * 1024 * 1024 }`
- **URLs:** https://wicg.github.io/background-fetch/ ; https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API

### C12. UI cannot be silently dismissed — origin must be displayed and the user must affirmatively act on it
- **Source:** WICG spec
- **Quote:** "The UI must prominently display the bgFetch's service worker registration's scope url's origin" and "The UI cannot be dismissed without aborting…until bgFetch's result is not the empty string."
- **URL:** https://wicg.github.io/background-fetch/

### C13. Use case — downloading AI model weights as a progressive enhancement to plain `fetch()`
- **Source:** web.dev AI article (Thomas Steiner)
- **Quotes:**
  - "Reliably downloading large AI models is a challenging task."
  - "If users lose their internet connection or close your website or web application, they lose partially downloaded model files and have to start over on return to your page. By using the Background Fetch API as a progressive enhancement, you can improve the user experience significantly."
- **URL:** https://web.dev/articles/background-fetch-ai

### C14. Use case — bundles of resources presented as one logical asset (movie, podcast, level)
- **Source:** Chrome blog (Jake Archibald)
- **Quotes:**
  - "So, what if you need to download something that might take a long time, like a movie, podcasts, or levels of a game."
  - "A level of a game could be spread across many JavaScript, image, and audio resources. But to the user, it's just 'the movie', or 'the level'."
- **URL:** https://developer.chrome.com/blog/background-fetch

### C15. Browser support: Chromium-only — Chrome 74+, Edge 79+, Opera 62+; Firefox and Safari do not support it
- **Source:** caniuse; MDN
- **Quotes:**
  - From caniuse: "Chrome: Supported from version 74 onwards"; "Edge: Supported from version 79 onwards"; "Firefox: 2 - 153: Not supported"; "Safari: 3.1 - 26.5: Not supported"; "Global Usage: 75.9% + 0% = 75.9%"
  - From MDN: "Limited availability: This feature is not Baseline because it does not work in some of the most widely-used browsers."
- **URLs:** https://caniuse.com/mdn-api_serviceworkerregistration_backgroundfetch ; https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API

### C16. Background Sync, by contrast, is a deferred-replay primitive for queued requests when connectivity returns
- **Source:** MDN Background Synchronization API
- **Quotes:**
  - "The Background Synchronization API enables a web app to defer tasks so that they can be run in a service worker once the user has a stable network connection."
  - "Uses may include sending requests in the background if they couldn't be sent while the application was being used."
  - "For example, an email client application could let its users compose and send messages at any time, even when the device has no network connection. The application frontend just registers a sync request and the service worker gets alerted when the network is present again and handles the sync."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API

---

## Topic-Specific Section: Background Fetch vs Background Sync — 4-row decision matrix

Each row is sourced and grounded in the claims above.

| Dimension | Background Fetch | Background Sync |
|---|---|---|
| **Initiation site** | Main thread / page calls `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)` (C3) | Page calls `registration.sync.register(tag)`; the actual work runs in the service worker's `sync` event (C16) |
| **Use-case shape** | Large, long-running GETs — movies, podcasts, game levels, AI model weights, software bundles (C1, C13, C14) | Small, retry-able mutations — queued POST/PATCH that couldn't be sent while offline, e.g. composed emails or chat messages (C16) |
| **User-visible UI** | Browser-rendered system download UI with title, icons, byte progress, cancel button; UI cannot be silently dismissed and must show origin (C5, C11, C12) | Invisible — runs entirely inside the service worker after the network returns; no platform UI (C16) |
| **Lifetime** | Survives all pages and workers being closed; the browser, not the service worker, drives the transfer until completion (C4); on success the service worker is woken to handle the `backgroundfetchsuccess` event (C9) | Bounded by service-worker liveness — the SW must stay alive for the duration of the queued task; the browser will kill it if the task is too long (C6); fires when "the network becomes available" |

---

## Adjacency / Cross-link candidates

- **FEE-1306 "Push Notifications & Background Sync"** — same family (service-worker-driven background work). Boundary: FEE-1306 covers `sync` event for retrying queued mutations and push for server-initiated wakeups; FEE-1313 covers browser-managed long-running downloads where the browser, not the service worker, owns transfer lifetime. Cross-link should explicitly note "use Sync for short queued mutations; use Fetch for large assets."
- **FEE-617 "Offline-First IndexedDB"** — adjacency through offline-first storage. Boundary: FEE-617 is about persistence and replay of user-mutation state through IndexedDB; FEE-1313 is about acquiring large remote assets and parking them (typically via Cache API in the `backgroundfetchsuccess` handler — see C9 code example which calls `caches.open("movies")` and `cache.put(record.request, response)`). Cross-link should clarify "Background Fetch produces Response objects; you choose where to land them — Cache API for HTTP-shaped assets, IndexedDB for blobs you'll process further."

---

## Implementation notes for the article author

- Code example walkthrough (Example section): use the MDN podcast example (`my-fetch` id, two requests, `downloadTotal`) for the page-side call; pair it with the spec's `backgroundfetchsuccess` handler that calls `registration.matchAll()`, awaits each `record.responseReady`, and `cache.put`s into an opened cache. Both verbatim from MDN — see C3, C9, C11.
- Best Practices candidates grounded in claims: MUST set `downloadTotal` so the system UI can render accurate progress (C5, C11); MUST handle `backgroundfetchfail` and `backgroundfetchabort` distinctly because partial state may need cleanup (C8); SHOULD cache responses inside the success handler before the registration is collected (C9); SHOULD treat Background Fetch as a progressive enhancement because Safari and Firefox do not implement it (C15, web.dev calls this out explicitly in C13).
- Design Thinking candidate: the visibility-mandated UI (C12) is a deliberate trade — origin must be shown, UI cannot be dismissed silently — which is what permits the API to outlive the page without enabling abuse (Jake Archibald: "there isn't the concern that it could abuse the system, such as mining bitcoin in the background").
- Frontmatter `id: 1313`, `slug: background-fetch`, topic-specific section heading: `## Background Fetch vs Background Sync` (zh-TW: 「Background Fetch 與 Background Sync 對照」 or similar natural rendering).
agentId: a690fab47a00ed268 (use SendMessage with to: 'a690fab47a00ed268' to continue this agent)
<usage>total_tokens: 43438
tool_uses: 15
duration_ms: 148089</usage>