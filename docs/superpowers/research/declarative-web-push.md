I have all the verified material I need. Let me return the structured findings.

---

# Findings: FEE-1316 — Declarative Web Push

**Target id:** 1316
**Slug:** `declarative-web-push`
**Topic-specific section:** `## Imperative vs Declarative Decision Matrix`
**Distinct from:** FEE-1306 (imperative SW-based push); this article covers the SW-less JSON-payload variant introduced by WebKit and shipped in Safari 18.4 (iOS) / 18.5 (macOS).

---

## Verified sources (Tier 1, all WebFetched)

1. WebKit blog, Brady Eidson, "Meet Declarative Web Push" (2025-03-27) — https://webkit.org/blog/16535/meet-declarative-web-push/
2. WebKit blog, "WebKit Features in Safari 18.4" — https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
3. WebKit blog, "WebKit Features in Safari 18.5" — https://webkit.org/blog/16923/webkit-features-in-safari-18-5/
4. Apple WWDC25 Session 235, Brady Eidson, "Learn more about Declarative Web Push" — https://developer.apple.com/videos/play/wwdc2025/235/
5. WebKit explainer, "Declarative Web Push" — https://github.com/WebKit/explainers/blob/main/DeclarativeWebPush/README.md
6. IETF RFC 8030, "Generic Event Delivery Using HTTP Push" — https://datatracker.ietf.org/doc/html/rfc8030
7. MDN Web Docs, "Push API" — https://developer.mozilla.org/en-US/docs/Web/API/Push_API

(Apple developer-documentation page on "Sending web push notifications" did not return content via WebFetch, so it is dropped from the citation pool. Apple's WWDC25 session covers the same ground and is retained.)

---

## Claims (14)

### C1 — Imperative push delivers payload to a service worker (baseline contrast)
- **Source:** MDN Push API.
- **Quote:** "The service worker will be started as necessary to handle incoming push messages, which are delivered to the `onpush` event handler."
- **URL:** https://developer.mozilla.org/en-US/docs/Web/API/Push_API

### C2 — Imperative push body is application-defined / opaque to the push service
- **Source:** RFC 8030 Abstract and protocol description.
- **Quote:** "This document describes a simple protocol for the delivery of real-time events to user agents. This scheme uses HTTP/2 server push." The message body is "the entity body from the most recent request sent to the push resource by the application server" — i.e. opaque to intermediaries.
- **URL:** https://datatracker.ietf.org/doc/html/rfc8030

### C3 — Declarative Web Push removes the service-worker requirement for displaying notifications
- **Source:** WebKit blog "Meet Declarative Web Push," Brady Eidson, 2025-03-27.
- **Quote:** "Declarative Web Push allows web developers to request a Web Push subscription and display user visible notifications without requiring an installed service worker."
- **URL:** https://webkit.org/blog/16535/meet-declarative-web-push/

### C4 — Browser renders the notification directly without invoking JavaScript
- **Source:** WebKit blog "Meet Declarative Web Push."
- **Quote:** "This standardized format guarantees that the browser has enough information to display a user-visible notification without any JavaScript."
- **URL:** https://webkit.org/blog/16535/meet-declarative-web-push/

### C5 — JSON schema: top-level `web_push: 8030` magic value (homage to RFC 8030)
- **Source:** WebKit blog "Meet Declarative Web Push" + WWDC25 Session 235.
- **Quote (WebKit blog):** "The top level `'web_push'` value is an homage to RFC 8030 – Generic Event Delivery Using HTTP Push. This is the magic value that opts the rest of your push message into declarative parsing."
- **Quote (WWDC25, Eidson):** "You must always have a web_push key with the value 8-0-3-0."
- **URLs:** https://webkit.org/blog/16535/meet-declarative-web-push/ ; https://developer.apple.com/videos/play/wwdc2025/235/

### C6 — Verbatim minimal payload (use as Example)
- **Source:** WebKit blog "Meet Declarative Web Push."
- **Quote (literal JSON):**
```json
{
    "web_push": 8030,
    "notification": {
        "title": "Webkit.org — Meet Declarative Web Push",
        "lang": "en-US",
        "dir": "ltr",
        "body": "Send push notifications without JavaScript or service worker!",
        "navigate": "https://webkit.org/blog/16535/meet-declarative-web-push/",
        "silent": false,
        "app_badge": "1"
    }
}
```
- **URL:** https://webkit.org/blog/16535/meet-declarative-web-push/

### C7 — Required fields: `title` and `navigate`
- **Source:** WebKit blog "Meet Declarative Web Push" + WWDC25 Session 235.
- **Quote (WebKit blog):** "Like when you create a notification programmatically in JavaScript, a non-empty `'title'` value is required." On `navigate`: "It describes a URL that will be navigated to by the browser upon activation."
- **Quote (WWDC25):** "A notification title and navigate URL are the minimum requirements for a valid notification."
- **URLs:** https://webkit.org/blog/16535/meet-declarative-web-push/ ; https://developer.apple.com/videos/play/wwdc2025/235/

### C8 — Optional fields mirror W3C `NotificationOptions`
- **Source:** WWDC25 Session 235.
- **Quote:** "anything supported by the W3C standard NotificationOptions dictionary is respected here."
- **URL:** https://developer.apple.com/videos/play/wwdc2025/235/

### C9 — `app_badge` updates the application badge inline
- **Source:** WebKit blog + WWDC25 Session 235.
- **Quote (WebKit blog):** "the declarative message can include an updated application badge" via `app_badge` "for Home Screen web apps on iOS."
- **Quote (WWDC25):** "Application badges, for things like unread counts, tend to go hand-in-hand with notifications, so declarative push messages also support built-in updating of the app badge."
- **URLs:** https://webkit.org/blog/16535/meet-declarative-web-push/ ; https://developer.apple.com/videos/play/wwdc2025/235/

### C10 — `mutable` flag lets a service worker rewrite the notification
- **Source:** WWDC25 Session 235 + WebKit explainer.
- **Quote (WWDC25):** "The JSON also includes an entry specifying that 'mutable' is true. Most declarative push messages are handled automatically, but this entry tells the browser that this notification needs to be processed by the service worker." And: "If it is missing, or false, the browser displays the notification automatically. If it's true, and if the Service Worker shows a replacement notification, then the browser uses the replacement instead of the plain text from the push message."
- **Quote (Explainer):** "The 'mutable' field is optional. Notification payloads are immutable by default (false)."
- **URLs:** https://developer.apple.com/videos/play/wwdc2025/235/ ; https://github.com/WebKit/explainers/blob/main/DeclarativeWebPush/README.md

### C11 — Service workers still receive a `push` event when one is registered; `PushEvent` carries the proposed-notification context
- **Source:** WebKit blog "Meet Declarative Web Push."
- **Quote:** "When a Declarative Web Push message arrives and a service worker is installed, a push event is dispatched to it like before. `PushEvent` now has the context of the 'proposed notification' from the Declarative Web Push message." And: "Unlike with original Web Push, there is no penalty for service workers failing to display a notification."
- **URL:** https://webkit.org/blog/16535/meet-declarative-web-push/

### C12 — Subscription works without a service worker via `window.pushManager`
- **Source:** WebKit blog "Meet Declarative Web Push."
- **Quote:** "The only `PushManager` available with original Web Push is `ServiceWorkerRegistration.pushManager`. Declarative Web Push also exposes `window.pushManager` to support subscription management without requiring a service worker." Sample call: `const subscription = await window.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: arrayForPublicKey });`
- **URL:** https://webkit.org/blog/16535/meet-declarative-web-push/

### C13 — Backwards compatibility: parse-fail or missing magic key falls back to imperative
- **Source:** WWDC25 Session 235 + WebKit blog.
- **Quote (WWDC25):** "What happens if the browser attempts to parse JSON from the push message and fails? In that case it falls back to original Web Push, using a Service Worker to handle the message. It also falls back to original Web Push if the JSON doesn't have the magic key."
- **Quote (WebKit blog):** "If your push message arrives to a newer browser, it's handled declaratively by the browser. If it arrives to an older browser, it's handled imperatively by JavaScript as it always had been."
- **URLs:** https://developer.apple.com/videos/play/wwdc2025/235/ ; https://webkit.org/blog/16535/meet-declarative-web-push/

### C14 — Browser support: Safari 18.4 (iOS/iPadOS Home Screen web apps), 18.5 (macOS); no Chrome/Firefox implementation
- **Source:** WebKit Safari 18.4 release notes; WebKit Safari 18.5 release notes; WWDC25 Session 235.
- **Quote (Safari 18.4):** "Declarative Web Push is now available on iOS and iPadOS 18.4 for web apps added to the Home Screen."
- **Quote (Safari 18.5):** "Declarative Web Push is now available on macOS." And: "This new approach to push notifications on the web doesn't require Service Workers — which makes it far easier for you as a developer to implement. And saves battery life for your users."
- **Quote (WWDC25):** "Give it a shot in Safari 18.5 and later on macOS, or web apps saved to the home screen on iOS 18.4 and iPadOS 18.4 and later."
- **No-Chrome/Firefox status:** Search results confirm no shipping implementation in Chrome or Firefox as of early 2026; standardization tracked on W3C Push API issue #360.
- **URLs:** https://webkit.org/blog/16574/webkit-features-in-safari-18-4/ ; https://webkit.org/blog/16923/webkit-features-in-safari-18-5/ ; https://developer.apple.com/videos/play/wwdc2025/235/ ; https://github.com/w3c/push-api/issues/360

---

## Imperative vs Declarative Decision Matrix (data for the topic-specific section)

| Dimension | Imperative Web Push (RFC 8030 + SW) | Declarative Web Push |
|---|---|---|
| Implementation locus | Service Worker JS handles `push` event and calls `showNotification` | Server emits a JSON payload conforming to the `web_push: 8030` schema |
| Required client code | Registered, installed Service Worker | None for display; `window.pushManager` for subscription |
| Customization ceiling | Arbitrary code (custom rendering logic, IndexedDB lookups, dynamic body) | Limited to declared `NotificationOptions` fields, optionally upgraded via `mutable: true` + SW rewrite |
| Battery / energy | Wakes SW on every push (C1) | Browser displays directly; SW boot avoided unless `mutable` (C3, C4, C14 macOS battery quote) |
| Privacy | "Allowing websites to remotely wake up a device for silent background work is a privacy violation and expends energy" (WebKit blog) | "more energy efficient and more private by design" |
| Browser support | Baseline since March 2023 across Chrome, Firefox, Safari | Safari 18.4+ iOS Home Screen apps, 18.5+ macOS; not in Chrome/Firefox as of early 2026 |
| Fallback strategy | n/a | If JSON fails to parse or lacks `web_push: 8030`, browser falls back to imperative `push` event |
| Display reliability | Notification fails to appear if SW crashes / is unregistered (ITP) / fails `showNotification` | Browser renders even if SW is broken or absent; "no penalty for service workers failing to display a notification" |
| Encryption / transport | RFC 8030 + RFC 8291 VAPID stack | Same RFC 8030 transport; same `applicationServerKey` (VAPID) subscription path |

---

## Suggested article shape (notes for the writer agent)

- **Hook (info block):** Introduces declarative push as an Apple-led divergence on top of the same RFC 8030 transport — JSON payload, no SW boot needed.
- **Context:** Set up the imperative model (FEE-1306 reference), then the SW-reliability and battery problems Apple explicitly cites (C3, C4, C11 fallback-no-penalty quote). Mention WebKit's TPAC 2023 proposal and the W3C Push API #360 standardization track.
- **Visual:** A Mermaid sequence diagram comparing the two paths from `Application Server → Push Service → Browser → (JS / Display)`. Show the SW box only on the imperative side and the `mutable: true` branch on the declarative side.
- **Example:** Use the verbatim JSON in C6. Show the `window.pushManager.subscribe` snippet from C12 alongside it. Show a server-side curl-equivalent emitting the JSON.
- **Best Practices (MUST/SHOULD/MAY):**
  - MUST include `web_push: 8030` and a non-empty `notification.title`; MUST include `notification.navigate` (C5, C7).
  - MUST keep sending imperative payloads alongside declarative ones during the rollout window — Chrome and Firefox have no implementation as of 2026 (C13, C14).
  - SHOULD prefer declarative when notification content is server-known to avoid SW boot cost (C3, C14 battery).
  - SHOULD set `mutable: true` only when the SW genuinely needs to rewrite the payload — e.g. end-to-end-encrypted bodies that must be decrypted client-side (WWDC25 Browser Pets quote).
  - MAY use `app_badge` to keep app badge counts in sync without bespoke SW code (C9).
- **Design Thinking:** Trade declarative simplicity vs the imperative model's arbitrary-code ceiling. Discuss the privacy/battery argument WebKit makes (silent SW wake-ups) and why `mutable` exists as the escape hatch.
- **Deep Dive:** What flips the parse path: malformed JSON or missing magic key falls back to imperative (C13). How `PushEvent` in declarative mode now carries the proposed notification (C11). `window.pushManager` vs `ServiceWorkerRegistration.pushManager` divergence (C12).
- **Imperative vs Declarative Decision Matrix:** the table above.
- **Related Topics:**
  - FEE-1306 Push Notifications & Background Sync — the imperative SW path.
  - Other PWA-category siblings (Notifications API, Service Worker lifecycle).
- **References:** the seven verified URLs above, plus W3C Push API spec (https://www.w3.org/TR/push-api/) for the imperative baseline if a third anchor is needed.

---

## Things I deliberately did NOT claim (failed to verify in a single fetch)

- The exact list of every supported `notification` sub-field beyond {`title`, `lang`, `dir`, `body`, `navigate`, `silent`, `app_badge`, `mutable`}. The WebKit blog and WWDC25 say "anything supported by NotificationOptions" but do not enumerate `icon`/`badge`/`image`/`actions` in the declarative example.
- The `Content-Type: application/notification+json` header appears in the WebKit explainer ("By sending all of their push messages with `Content-Type: application/notification+json`...") but is **not** echoed in the WebKit blog or WWDC25 transcript I fetched, so treat it as explainer-stage and cite the explainer URL specifically if the writer agent uses it.
- RFC 8291 (VAPID) is implied by `applicationServerKey` in the WebKit blog code sample, but no WebKit/Apple source I fetched names RFC 8291 explicitly. The article should phrase it as "same VAPID/`applicationServerKey` subscription model as imperative push" and cite RFC 8030 + the WebKit blog code, not RFC 8291 directly.
agentId: a38215564382bf6cf (use SendMessage with to: 'a38215564382bf6cf' to continue this agent)
<usage>total_tokens: 43320
tool_uses: 16
duration_ms: 149827</usage>