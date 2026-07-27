---
id: 1313
title: "Background Fetch API for Long-Running Downloads"
state: draft
slug: background-fetch
reviewed: tone
reviewed_on: 2026-07-27
---

# [FEE-1313] Background Fetch API for Long-Running Downloads

:::info
The Background Fetch API manages downloads that may take a significant amount of time, such as movies, audio files, and software (MDN). The page can close, the service worker can go idle, and the browser keeps the transfer running on its own behalf, surfacing a system download UI with progress and a cancel control (Jake Archibald, 2018; WICG editor's draft). Background Sync exists for a different shape of work: short, queued mutations that replay when connectivity returns. The browser will terminate it if the task runs too long (MDN). This article shows how to initiate a Background Fetch from a page, how to land its responses in the Cache API inside the success handler, and how to choose between Fetch, Sync, and the wider service-worker background-work family.
:::

## Context

The Background Fetch API addresses a concrete problem documented on MDN: "When a web application requires the user to download large files, this often presents a problem in that the user needs to stay connected to the page for the download to complete." The platform's earlier mechanism for service-worker background work, Background Sync, does not cover this case. As MDN states, Background Sync "can't be used for long running tasks such as downloading a large file. Background Sync requires that the service worker stays alive until the fetch is completed, and to conserve battery life and to prevent unwanted tasks happening in the background the browser will at some point terminate the task. The Background Fetch API solves this problem." Jake Archibald's 2018 Chrome Developers post frames the same boundary: the service worker must be alive for Background Sync's duration, which is fine for sending a message, while a long task gets killed. Background Fetch was designed for movies, podcasts, software, AI model weights, and game levels: bundles of network resources presented to the user as one logical asset (Archibald, 2018; Steiner, web.dev).

## Visual

| Dimension | Background Fetch | Background Sync |
|---|---|---|
| **Initiation site** | Main thread / page calls `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)` | Page calls `registration.sync.register(tag)`; the work runs in the SW's `sync` event |
| **Use-case shape** | Large, long-running GETs: movies, podcasts, game levels, AI model weights, software bundles | Small, retry-able mutations: queued POST/PATCH that could not be sent while offline (e.g. composed emails or chat messages) |
| **User-visible UI** | Browser-rendered system download UI with title, icons, byte progress, cancel button; UI cannot be silently dismissed and must show origin | Invisible: runs entirely inside the service worker after the network returns; no platform UI |
| **Lifetime** | Survives all pages and workers being closed; the browser drives the transfer until completion. On success the SW is woken to handle `backgroundfetchsuccess`. | Bounded by service-worker liveness. The SW must stay alive for the duration of the queued task; the browser will kill it if the task is too long. |

## Example

A page-side initiation, taken from MDN's podcast example. The page registers a fetch with an id, two URLs, a title, an icon, and a `downloadTotal` so the system UI can render accurate byte progress:

```js
const swReg = await navigator.serviceWorker.ready;
const bgFetch = await swReg.backgroundFetch.fetch(
  'my-fetch',
  ['/ep-5.mp3', 'ep-5-artwork.jpg'],
  {
    title: 'Episode 5: Interesting things.',
    icons: [{ sizes: '300x300', src: '/ep-5-icon.png', type: 'image/png' }],
    downloadTotal: 60 * 1024 * 1024,
  },
);
```

Per the Chrome Developers post, "If the user closes pages to your site after step 1, that's ok, the download will continue." The WICG spec restates the same property: "Allow fetches (requests & responses) to continue even if the user closes all windows & workers to the origin." While transfer is in flight, "the browser then performs the fetches in a user-visible way, displaying progress to the user and giving them a method to cancel the download" (MDN).

When all individual requests complete, the browser wakes the service worker and dispatches `backgroundfetchsuccess`. The handler retrieves the responses from `event.registration` and stores them, typically in the Cache API, and may update the system UI by calling `event.updateUI()`:

```js
self.addEventListener('backgroundfetchsuccess', (event) => {
  const bgFetch = event.registration;
  event.waitUntil(async function () {
    const cache = await caches.open('movies');
    const records = await bgFetch.matchAll();
    await Promise.all(records.map(async (record) => {
      const response = await record.responseReady;
      await cache.put(record.request, response);
    }));
    await event.updateUI({ title: 'Episode 5 ready to listen!' });
  }());
});
```

The four lifecycle events the service worker can observe are `backgroundfetchsuccess`, `backgroundfetchfail`, `backgroundfetchabort`, and `backgroundfetchclick` (MDN). One additional capability that distinguishes this API from a normal `fetch()`: "The Background Fetch API will enable the fetch to happen if the user starts the process while offline. Once they are connected it will begin. If the user goes off line, the process pauses until the user is on again" (MDN).

## Best Practices

- **MUST** set `downloadTotal` in `BackgroundFetchOptions` so the browser's system UI can render accurate byte progress. The WICG spec defines `downloadTotal` on the options dictionary, and MDN's example passes the byte count for this reason. Without it the UI cannot show how far along the transfer is.
- **MUST** handle `backgroundfetchfail` and `backgroundfetchabort` distinctly. MDN defines them as separate events: `fail` fires "when at least one of the requests in a background fetch operation has failed," and `abort` fires "when a background fetch operation has been canceled by the user or the app." Cleanup branches differ: partial cache state from a failed run is generally discarded, while an abort is user-initiated and may warrant a different message.
- **MUST** retrieve responses inside the `backgroundfetchsuccess` handler before the registration is collected. MDN states: "In the handler for this event, the service worker can retrieve and store the responses (for example, using the `Cache` API). To access the response data, the service worker uses the event's `registration` property." Wrapping the work in `event.waitUntil(...)` keeps the service worker alive long enough to land each response.
- **SHOULD** ship Background Fetch as a progressive enhancement. caniuse reports that Chrome supports it from 74, Edge from 79, and Firefox and Safari do not support it at all. MDN labels the feature "Limited availability… not Baseline because it does not work in some of the most widely-used browsers." Steiner's web.dev article frames the same posture for AI model downloads: use the API to "improve the user experience significantly" where available, while keeping plain `fetch()` as the fallback.
- **SHOULD** use the unique `id` you pass to `fetch(id, ...)` as the lookup key for later state. `BackgroundFetchManager` is "a map where the keys are background fetch IDs and the values are `BackgroundFetchRegistration` objects" (MDN), with `get(id)` returning the in-flight registration and `getIds()` listing all of them.
- **MAY** call `event.updateUI()` from the `backgroundfetchsuccess` handler to change the title or icons after completion. MDN: "the service worker can update that UI to show that the operation has completed successfully. To do this, the handler calls the event's `updateUI()` method, passing in a new title and/or icons."

## Design Thinking

The Background Fetch UI is mandatory and non-dismissible by design. The WICG spec requires that "the UI must prominently display the bgFetch's service worker registration's scope url's origin" and that "the UI cannot be dismissed without aborting…until bgFetch's result is not the empty string." Pair this with the lifetime guarantee: fetches continue "even if the user closes all windows & workers to the origin." The trade is visible. The browser grants the page genuinely long-lived background work, in exchange for a persistent UI that names the origin and gives the user a kill switch. That pairing is what permits the API to outlive the page; without the visible UI, the same lifetime guarantee would be a vector for hidden background activity.

## Background Fetch vs Background Sync

Choosing between Background Fetch and Background Sync (and, by extension, Periodic Background Sync covered in FEE-1307) starts from the shape of the work. The four-row matrix below names the dimensions that decide.

| Dimension | Background Fetch | Background Sync |
|---|---|---|
| **Initiation site** | Main thread / page calls `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)` | Page calls `registration.sync.register(tag)`; the actual work runs in the service worker's `sync` event |
| **Use-case shape** | Large, long-running GETs: movies, podcasts, game levels, AI model weights, software bundles | Small, retry-able mutations: queued POST/PATCH that could not be sent while offline, e.g. composed emails or chat messages |
| **User-visible UI** | Browser-rendered system download UI with title, icons, byte progress, cancel button; UI cannot be silently dismissed and must show origin | Invisible: runs entirely inside the service worker after the network returns; no platform UI |
| **Lifetime** | Survives all pages and workers being closed; the browser, not the service worker, drives the transfer until completion; on success the service worker is woken to handle the `backgroundfetchsuccess` event | Bounded by service-worker liveness — the SW must stay alive for the duration of the queued task; the browser will kill it if the task is too long; fires when "the network becomes available" |

**Initiation site.** Background Fetch is started from the page through `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)`, and the call returns a `BackgroundFetchRegistration` (MDN). Background Sync is also registered from the page, via `registration.sync.register(tag)`, but the actual work runs later inside the service worker's `sync` event handler when the browser decides connectivity is sufficient. MDN's framing: "an email client application could let its users compose and send messages at any time, even when the device has no network connection. The application frontend just registers a sync request and the service worker gets alerted when the network is present again and handles the sync."

**Use-case shape.** Archibald's post names the territory for Background Fetch directly: "what if you need to download something that might take a long time, like a movie, podcasts, or levels of a game." A game level "could be spread across many JavaScript, image, and audio resources. But to the user, it's just 'the movie', or 'the level'." Steiner's article extends the list to AI model weights, where "if users lose their internet connection or close your website or web application, they lose partially downloaded model files and have to start over on return to your page." Background Sync's use case is the inverse: small mutations that the app already tried to send and could not. MDN: "Uses may include sending requests in the background if they couldn't be sent while the application was being used."

**User-visible UI.** Background Fetch is loud by spec. MDN: "The browser then performs the fetches in a user-visible way, displaying progress to the user and giving them a method to cancel the download." The WICG spec adds the binding constraints already cited under Design Thinking: origin must be displayed, UI cannot be silently dismissed. Background Sync surfaces nothing. The work happens inside the service worker after the network returns, and the user sees only whatever the application itself decides to render later (e.g. a sent-message confirmation).

**Lifetime.** For Background Fetch, "Allow fetches (requests & responses) to continue even if the user closes all windows & workers to the origin" (WICG). For Background Sync, the service worker must remain alive for the duration of the queued task, and as MDN spells out for the long-task case, "the browser will at some point terminate the task." If the work is bytes that take minutes or hours, Background Fetch is the one that survives. If the work is a handful of queued requests that finish in a second or two once the network is back, Background Sync is the one that runs.

## Related Topics

- [FEE-1306 Push Notifications & Background Sync](/en/Progressive%20Web%20Apps%20and%20Offline/1306) — same family (service-worker-driven background work), covers `sync` for retrying queued mutations and Push for server-initiated wakeups. Use Sync for short queued mutations; use Fetch for large assets.
- [FEE-1307 Periodic Background Sync](/en/Progressive%20Web%20Apps%20and%20Offline/1307) — the third member of the background-work family, for browser-scheduled recurring updates.
- [FEE-617 IndexedDB / Dexie](/en/State%20Management%20and%20Data%20Flow/617) — Background Fetch produces `Response` objects; choose where to land them. Cache API for HTTP-shaped assets, IndexedDB for blobs you will process further.

## References

- MDN contributors, "Background Fetch API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API
- MDN contributors, "BackgroundFetchManager," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchManager
- MDN contributors, "BackgroundFetchEvent," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchEvent
- MDN contributors, "ServiceWorkerGlobalScope: backgroundfetchsuccess event," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/backgroundfetchsuccess_event
- MDN contributors, "Background Synchronization API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- WICG, "Background Fetch," editor's draft. https://wicg.github.io/background-fetch/
- Jake Archibald, "Introducing Background Fetch," Chrome Developers blog (2018). https://developer.chrome.com/blog/background-fetch
- Thomas Steiner, "Reliably download large files with Background Fetch," web.dev. https://web.dev/articles/background-fetch-ai
- caniuse, "ServiceWorkerRegistration: backgroundFetch property." https://caniuse.com/mdn-api_serviceworkerregistration_backgroundfetch
