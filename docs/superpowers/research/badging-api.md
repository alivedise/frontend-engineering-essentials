All sources verified. Returning the structured findings document.

---

# Findings: Badging API and Re-Engagement Surfaces for Installed PWAs

**Target id:** 1317
**Slug:** `badging-api`
**Topic-specific section:** `## Badge UX Patterns`
**Researcher confidence:** High — all six requested sources verified via WebFetch; one supplementary WebKit source added.

## Verified sources

| # | URL | Status | Author/Venue |
|---|-----|--------|--------------|
| S1 | https://www.w3.org/TR/badging/ | Verified | W3C Working Draft |
| S2 | https://developer.mozilla.org/en-US/docs/Web/API/Badging_API | Verified | MDN |
| S3 | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/setAppBadge | Verified | MDN |
| S4 | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clearAppBadge | Verified | MDN |
| S5 | https://developer.chrome.com/docs/capabilities/web-apis/badging-api | Verified | Chrome capabilities team |
| S6 | https://web.dev/patterns/web-apps/badges | Verified | web.dev (Google) |
| S7 | https://webkit.org/blog/14112/badging-for-home-screen-web-apps/ | Verified | WebKit blog — Marcos Cáceres and Brady Eidson |

## Claims (14 total)

**C1. Two-method API surface.**
Source: S2.
Quote: "A badge is set with the methods `setAppBadge()` (for installed apps)." and "Badges are cleared with the `clearAppBadge()` methods. These do not take any parameters and set the badge to the value `nothing`."

**C2. WebIDL signature with unsigned integer parameter.**
Source: S1.
Quote: "Promise<undefined> setAppBadge(optional [EnforceRange] unsigned long long contents);"

**C3. Both methods return a Promise that resolves with `undefined`.**
Source: S3, S4.
Quote (S3): "A Promise that resolves with undefined."
Quote (S4): "A Promise that resolves with undefined."

**C4. Argument is a number; passing `0` clears the badge.**
Source: S3.
Quote: "A number which will be used as the value of the badge. If `contents` is `0` then the badge will be set to `nothing`, indicating a cleared badge."

**C5. W3C spec confirms `contents == 0` semantics.**
Source: S1.
Quote: "contents is 0: Set badge to \"nothing\"."

**C6. Omitting the argument shows a generic indicator (dot).**
Source: S3.
Quote: "If a value is passed to the method, this will be set as the value of the badge. Otherwise the badge will display as a dot, or other indicator as defined by the platform."

**C7. `setAppBadge(0)` is equivalent to `clearAppBadge()` (per WebKit).**
Source: S7.
Quote: "calling `navigator.setAppBadge(0)` is equivalent to calling `navigator.clearAppBadge()`."

**C8. Badges appear next to the OS-level app icon (dock, shelf, home screen).**
Source: S2; corroborated by S1.
Quote (S2): "App badges, which are associated with the icon of an installed web app. These may display on the app icon in the dock, shelf, or home screen depending on the device in use."
Quote (S1): "display the application's badge alongside the primary iconic representation of the application in the user's operating system."

**C9. Badging is intended for installed web apps; Chrome enforces installability + home-screen add.**
Source: S1, S5.
Quote (S1): "A badge is intended as a mechanism for installed web applications."
Quote (S5): "To use the App Badging API, your web app needs to meet Chrome's installability criteria, and users must add it to their home screens."

**C10. Available in Web Workers / service workers (WorkerNavigator).**
Source: S1, S2.
Quote (S1): "Navigator includes NavigatorBadge; WorkerNavigator includes NavigatorBadge."
Quote (S2): "Note: This feature is available in Web Workers."

**C11. Service workers can update the badge during a `push` event.**
Source: S5, S7.
Quote (S5): "The Push API allows servers to send messages to service workers...a server push could update the badge by calling `navigator.setAppBadge()`."
Quote (S7): "it is trivial to update your application badge while your Service Worker handles a `push` event."

**C12. Badges are quieter than notifications and can update at higher frequency.**
Source: S5; corroborated by S2.
Quote (S5): "Badges tend to be more user-friendly than notifications, and can be updated with much higher frequency, since they don't interrupt the user."
Quote (S2): "act as a notification that state has changed without displaying a more distracting notification."

**C13. WebKit requires that a badge update accompany a user-visible notification on push (does not bypass the user-visible requirement).**
Source: S7.
Quote: "a badge update by itself does not fulfill the 'user visible' requirement; Keep showing those notifications!"

**C14. Browser support: Chrome/Edge 81+ (desktop and Android), Safari macOS 17+, iOS Safari 16.4+ for home-screen web apps; Firefox not supported.**
Sources: S5, caniuse (mdn-api_navigator_setappbadge), S7.
Quote (S5): "The App Badging API works on Windows, and macOS, in Chrome 81 and Edge 81 or later... On Android, the Badging API is not supported." [Note: Chromium-on-Android support has since landed for installed PWAs; treat S5 as snapshot of original ship.]
Quote (caniuse): "Chrome: 81 - 150: Supported... Safari (macOS): 17.0 - 26.3: Supported... Safari (iOS): 16.4 - 26.3: Supported... Firefox: Not supported."
Quote (S7): "In iOS and iPadOS 16.4, the Badging API is available exclusively for web apps the user has added to their home screen."

**C15. iOS/iPadOS exposes the API only on the installed home-screen web app, not in Safari or WKWebView.**
Source: S7.
Quote: "You won't find the API exposed to websites in Safari or other browsers, or in any app that uses WKWebView."

**C16. Common use case: messaging/email/social apps surfacing unread counts.**
Source: S2, S5.
Quote (S2): "A common use case for this would be an application with a messaging feature displaying a badge on the app icon to show that new messages have arrived."
Quote (S5): "Chat, email, and social apps, to signal that new messages have arrived, or to show the number of unread items."

## Suggested article shape (alignment with brief)

- **Context:** Favicon hacks and `document.title` mutation as pre-Badging unread-count hacks. The Badging API graduates that pattern from tab chrome into the OS surface for installed PWAs (cite S2 "Web developers frequently update document favicons or titles in order to indicate status...").
- **Visual:** Mermaid sequence — server -> Push -> service worker `push` handler -> `navigator.setAppBadge(unread)` -> OS icon badge updates; in parallel `showNotification` for the user-visible requirement (covers C11, C13).
- **Example:** Inline page calling `navigator.setAppBadge(unread)` after fetch; service-worker `push` handler calling `self.registration.showNotification(...)` then `navigator.setAppBadge(count)`; reset path on read via `clearAppBadge()`.
- **Best Practices (MUST/SHOULD/MAY):**
  - MUST treat the API as a no-op outside installed contexts; feature-detect with `'setAppBadge' in navigator`.
  - MUST keep server-truth count and badge in sync — set on push, clear on read receipt.
  - MUST also call `showNotification` on push under WebKit (C13).
  - SHOULD prefer `setAppBadge(count)` to `setAppBadge(0)` paths when count drops to zero, but both are valid (C4, C7).
  - MAY use parameterless `setAppBadge()` as a generic "something happened" dot when an exact count is unknown (C6).
- **Design Thinking (optional):** Ambient (badge) vs interruptive (notification) — pick based on urgency budget; high-frequency state ticks should never be notifications (C12).
- **Deep Dive (optional):** WorkerNavigator inclusion (C10), `unsigned long long` range and `EnforceRange` (C2), Safari 16.4's same-origin frame restriction (cross-origin iframes have no effect — search result quote from WebKit reporting).
- **Badge UX Patterns** (topic-specific; required):
  - Pattern 1 — "Unread inbox": set on receive, clear on read.
  - Pattern 2 — "Pending review queue": set to queue length on every settle event; coalesce updates with a short debounce to avoid taskbar thrash.
  - Pattern 3 — "Generic activity dot": call `setAppBadge()` (no arg) when count is unknown.
  - Pattern 4 — "Push-driven badge": service-worker `push` handler updates badge AND shows notification (WebKit constraint).
  - Pattern 5 — "Cross-device sync": treat the badge as a render of server-side unread count, not as primary state; reconcile on app focus via `visibilitychange`.
  - Pattern 6 — "Zero-out on focus": optionally clear when the user opens the app, mirroring native messaging clients.
- **Related Topics:**
  - FEE-1306 Push Notifications and Background Sync — distinct: 1306 covers intrusive notifications and background data sync; this article covers the ambient badge surface. Cross-link, do not duplicate.
  - Web App Manifest / installability articles in this category (badge requires installed PWA).
- **References:** S1, S2, S3, S4, S5, S6, S7. All have named authors or institutional venue (W3C / MDN / Chrome / web.dev / WebKit — Marcos Cáceres + Brady Eidson). No anonymous Medium.

## Distinctness vs FEE-1306

This article's thesis: the badge is a **silent count** rendered on the OS icon for an **installed** app. FEE-1306's thesis: pushes wake a service worker and **must** result in a user-visible notification per WebKit (C13). The crossover (push-driven badge update inside the same `push` handler) is the cross-link point — covered here as Pattern 4, covered there as the notification side of the same event.

## Gaps / caveats for the writer

- caniuse data was the only source for the precise Chrome version range; Chrome capabilities article (S5) still says "On Android, the Badging API is not supported" but that text is dated; if the writer wants to assert current Android support they should re-verify against MDN BCD at write time rather than restating S5.
- S6 (web.dev pattern page) is thin on prose — the deep guidance lives in S5 and S7. Use S6 for the "non-urgent information" framing only.
- Safari's `setAppBadge(0)` vs `setAppBadge()` (no arg) handling has been reported as buggy (search result mentioned Safari "incorrectly handles no or 0 as an argument"); flag in Deep Dive only if the writer can re-verify against a current source — not anchored to a primary source quote in this research pass.
agentId: af99dd20eef0a76e9 (use SendMessage with to: 'af99dd20eef0a76e9' to continue this agent)
<usage>total_tokens: 37943
tool_uses: 13
duration_ms: 119257</usage>