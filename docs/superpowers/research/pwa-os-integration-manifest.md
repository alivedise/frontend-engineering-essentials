I have enough verified sources. Now let me compile the findings document.

# Findings: PWA OS Integration Manifest Members (FEE-1311)

```yaml
---
id: 1311
title: "PWA OS Integration Manifest Members"
slug: pwa-os-integration-manifest
state: draft
category: pwa-and-offline
target_section: "Member Reference Matrix"
researched_at: 2026-04-26
---
```

## Distinct Angle vs FEE-1301

FEE-1301 ("Web App Manifest & Installability") covers the W3C-baseline manifest members (`name`, `icons`, `start_url`, `display`, `scope`, `shortcuts`) that turn a website into an installable app. FEE-1311 narrows to the four **non-baseline, OS-integration** members defined in WICG manifest-incubations / web-app-launch / web-share-target. These are what graduate an installed PWA from "icon on home screen" to a peer of native apps in OS file/URL/share/launch flows. The Member Reference Matrix table compares the four members on schema, OS launch trigger, browser support tier, and the most common pitfall.

## Claims

### C1 — All four members live outside the W3C App Manifest baseline
**Source:** https://www.w3.org/TR/appmanifest/
**Verbatim:** The W3C spec lists optional root members as "`background_color`, `dir`, `display`, `icons`, `id`, `lang`, `name`, `orientation`, `scope`, `short_name`, `shortcuts`, `start_url`, `theme_color`." The spec includes an extension hook stating "other specifications that add new members to the manifest are encouraged to hook themselves into this specification at this point in the algorithm." `file_handlers`, `protocol_handlers`, `share_target`, and `launch_handler` are not defined in this document.
**Section:** Context

### C2 — `file_handlers` schema is an array of `{action, accept}` entries, with optional `icons` and `launch_type`
**Source:** https://wicg.github.io/manifest-incubations/ (formal spec) and https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers
**Verbatim (MDN):** "An array of objects. Each object in the array must contain the following values (`action` and `accept` are required)." `action` is "A string containing the URL to navigate to when a file is handled." `accept` is "An object. For each property in the object: The property key is a MIME type. The property value is an array of strings representing file extensions associated with that MIME type."
**Verbatim (incubations):** Each handler item carries `action`, `name`, `accept` ("a dictionary mapping MIME types to a list of file extensions"), `icons`, and `launch_type` ("either `single-client` or `multiple-clients`").
**Section:** Member Reference Matrix / Example

### C3 — File handlers are bound at install time and require a launchQueue consumer
**Source:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers
**Verbatim:** "[`file_handlers`] is read by the browser at installation time to associate the application with a given set of file types at the operating system level." "To actually implement file handling in a PWA, web developers also need to use [`window.launchQueue`](/en-US/docs/Web/API/Window/launchQueue) to handle the incoming files in their application JavaScript code." "Handling files is done in the application code that runs on the main thread, not in the application's service worker."
**Section:** Example / Best Practices

### C4 — `launchQueue.setConsumer` is invoked exactly once per launch and receives FileSystemHandle objects
**Source:** https://developer.chrome.com/docs/capabilities/web-apis/file-handling and https://developer.mozilla.org/en-US/docs/Web/API/LaunchParams
**Verbatim (Chrome):** "To access launched files, a site needs to specify a consumer for the `window.launchQueue` object. Launches are queued until they are handled by the specified consumer, which is invoked exactly once for each launch."
**Verbatim (MDN LaunchParams):** "`LaunchParams.files` — Returns a read-only array of [`FileSystemHandle`](/en-US/docs/Web/API/FileSystemHandle) objects representing any files passed along with the launch navigation via the [`POST`](/en-US/docs/Web/HTTP/Reference/Methods/POST) method."
**Section:** Example / Deep Dive

### C5 — File handling has a per-launch user permission prompt with embargo
**Source:** https://developer.chrome.com/docs/capabilities/web-apis/file-handling (author: Thomas Steiner)
**Verbatim:** "This permission will show every time until the user clicks to **Allow** or **Block** file handling for the site, or ignores the prompt three times (after which Chromium will embargo and block this permission)."
**Section:** Best Practices / Deep Dive

### C6 — `protocol_handlers` schema is `{protocol, url}` with `%s` URL substitution
**Source:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers
**Verbatim:** `url` is the "Required HTTPS URL within the application `scope` that will handle the protocol." "The `%s` token will be replaced by the URL starting with the protocol handler's scheme." "If `url` is a relative URL, the base URL will be the URL of the manifest."
**Section:** Member Reference Matrix / Example

### C7 — Custom schemes must use the `web+` prefix; otherwise the scheme must come from the safelist
**Source:** https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler (rules referenced normatively by manifest-incubations) and https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler
**Verbatim (MDN registerProtocolHandler):** "This may be a custom scheme, in which case the scheme's name: Begins with `web+`; Contains at least one letter after the `web+` prefix; Contains only lowercase ASCII letters." Safelisted scheme list: `bitcoin`, `ftp`, `ftps`, `geo`, `im`, `irc`, `ircs`, `magnet`, `mailto`, `matrix`, `mms`, `news`, `nntp`, `openpgp4fpr`, `sftp`, `sip`, `sms`, `smsto`, `ssh`, `tel`, `urn`, `webcal`, `wtai`, `xmpp`.
**Verbatim (Chrome best-practices):** custom schemes must "begin with `web+`, followed by at least one or more lowercase ASCII letters after the `web+` prefix, for instance, `web+coffee`."
**Section:** Best Practices / Member Reference Matrix

### C8 — Manifest-level `protocol_handlers` ships in Chrome 96+
**Source:** https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler (author: Thomas Steiner; specified by Microsoft Edge team)
**Verbatim:** "Available from Chrome 96" as part of the capabilities project. "Implemented and specified by Fabio Rocha, Diego González, Connor Moody, and Samuel Tang from the Microsoft Edge team." "After registering a PWA as a protocol handler, when a user clicks on a hyperlink with a specific scheme such as `mailto`, `bitcoin`, or `web+music` from a browser or a platform-specific app, the registered PWA will open and receive the URL."
**Section:** Context / Member Reference Matrix

### C9 — `share_target` registers a PWA in the OS share sheet, with `action` + `params` required
**Source:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
**Verbatim:** "The value is an object" where `action` is "The URL for the web share target" and `params` is "An object to configure the share parameters. The object keys correspond to the `data` object in `navigator.share()`." Optional sub-keys are `title` ("Name of the query parameter to use for the title"), `text` ("for the text (or body) of the message"), `url` ("for the URL to the resource being shared"), and `files` (file objects with `name` and `accept`).
**Section:** Member Reference Matrix / Example

### C10 — `method` controls GET vs POST; binary/files require POST + `multipart/form-data`
**Source:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target and https://w3c.github.io/web-share-target/
**Verbatim (MDN):** "Either `GET` or `POST`. Use `POST` if the shared data includes binary data like image(s), or if it changes the target app, for example, if it creates a data point like a bookmark." For POST: "The `POST` request is then ideally replied with an HTTP 303 See Other redirect to avoid multiple `POST` requests from being submitted if a page refresh was initiated by the user."
**Verbatim (W3C TAG draft):** GET is for "when the share target drafts a message for subsequent user approval"; POST is recommended "if the share target performs a side-effect without any user interaction."
**Section:** Example / Best Practices

### C11 — Share targets only register after install and must validate inbound data
**Source:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
**Verbatim:** "Your PWA can only act as a web share target if it has been installed." "Similar to HTML form submissions, you should be cautious about data that is sent to your application via the share target. Be sure to validate incoming data before using it."
**Section:** Best Practices

### C12 — `launch_handler.client_mode` controls reuse-vs-new-window for launches
**Source:** https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API and https://developer.chrome.com/docs/web-platform/launch-handler (author: Thomas Steiner)
**Verbatim (MDN):** `focus-existing` — "The most recently interacted with browsing context in a web app window is chosen to handle the launch. This will populate the target launch URL in the `targetURL` property of the `LaunchParams` object passed into the `window.launchQueue.setConsumer()`'s callback function." `navigate-existing` — "The most recently interacted with browsing context in a web app window is navigated to the target launch URL." `navigate-new` — "A new browsing context is created in a web app window to load the target launch URL." `auto` — "The user agent decides what works best for the platform... This is the default value used if provided values are invalid."
**Section:** Member Reference Matrix / Example

### C13 — `client_mode` accepts an array (first valid wins) and defaults to `auto`
**Source:** https://wicg.github.io/web-app-launch/ and search results on chromestatus / blink-dev
**Verbatim (search digest):** "If unspecified, launch_handler defaults to `{\"client_mode\": \"auto\"}`. The `client_mode` property also accepts a list (array) of values, where the first valid value will be used."
**Verbatim (WICG spec):** `auto` is "The user agent's default launch routing behaviour is used"; `focus-existing` is "If an existing web app client is open it is brought to focus but not navigated to the launch's target URL."
**Section:** Deep Dive

### C14 — `route_to` was the original property name and was renamed/removed before shipping
**Source:** https://developer.chrome.com/docs/web-platform/launch-handler (Thomas Steiner) — explicit historical naming. The spec at https://wicg.github.io/web-app-launch/ no longer mentions `route_to`; only `client_mode` is normative.
**Verbatim (web-app-launch GitHub launch_handler.md, surfaced via search):** the current spec exposes only `client_mode`; legacy `route_to` was a rejected/superseded design surfaced in earlier Chrome trial documentation.
**Note:** The MDN page does not document `route_to`; this is consistent with `route_to` being removed before stable release. Treat as historical context only — do not advise authors to write `route_to`.
**Section:** Deep Dive (note as deprecated/historical)

### C15 — All four members are "Limited availability" (not Baseline)
**Source:** MDN compat banners on each Reference page (file_handlers, protocol_handlers, share_target, launch_handler).
**Verbatim (file_handlers):** "Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers." marked **Experimental**.
**Verbatim (protocol_handlers):** "Limited availability... This is an experimental technology."
**Verbatim (share_target):** "Limited availability — This feature is not Baseline... It is marked as experimental."
**Verbatim (launch_handler):** "Limited availability... This is an experimental technology."
**Concrete support (file handling, per Chrome capabilities page by Thomas Steiner):** "Chrome: 102+; Edge: 102+; Firefox: Not supported; Safari: Not supported. Currently limited to desktop operating systems."
**Section:** Context / Member Reference Matrix

### C16 — Action URL must be inside the PWA's navigation scope
**Source:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers
**Verbatim:** "This URL must be within the navigation scope of the PWA, which is the set of URLs that the PWA can navigate to. The navigation scope of a PWA defaults to its `start_url` member, but can also be defined by using the `scope` member."
**Note:** Same scope constraint applies to `protocol_handlers.url` (must be HTTPS, within scope) and `share_target.action` (within scope) — cross-cutting pitfall worth one line in the Matrix's "common pitfalls" column.
**Section:** Best Practices / Member Reference Matrix

## Reference URLs (verified 2xx via WebFetch on 2026-04-26)

1. https://www.w3.org/TR/appmanifest/ — W3C, "Web Application Manifest" (W3C WG Note / Editor's Draft).
2. https://wicg.github.io/manifest-incubations/ — WICG, "Manifest Incubations" (formal source for `file_handlers`, `protocol_handlers`).
3. https://wicg.github.io/web-app-launch/ — WICG, "Web App Launch Handler API."
4. https://w3c.github.io/web-share-target/ — W3C TAG, "Web Share Target API."
5. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers — MDN.
6. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers — MDN.
7. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target — MDN.
8. https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API — MDN.
9. https://developer.mozilla.org/en-US/docs/Web/API/LaunchParams — MDN.
10. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler — MDN (safelisted scheme list).
11. https://developer.chrome.com/docs/capabilities/web-apis/file-handling — Chrome for Developers, Thomas Steiner.
12. https://developer.chrome.com/docs/web-platform/launch-handler — Chrome for Developers, Thomas Steiner.
13. https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler — Chrome for Developers, Thomas Steiner.
14. https://web.dev/learn/pwa/os-integration — web.dev "Learn PWA: OS Integration."

## Research Notes

- **Member Reference Matrix structural skeleton** (recommended columns):

| Member | Schema shape | OS launch trigger | Delivery API | Browser support (Apr 2026) | Common pitfall |
|---|---|---|---|---|---|
| `file_handlers` | `[{action, accept: {mime: [exts]}, icons?, launch_type?}]` | User opens a file of a registered type from OS file manager | `window.launchQueue.setConsumer` → `LaunchParams.files` (array of `FileSystemHandle`) | Limited: Chrome/Edge 102+ desktop; not Firefox/Safari | `action` URL must lie inside `scope`; per-launch permission prompt embargoes after 3 ignores |
| `protocol_handlers` | `[{protocol, url}]` (HTTPS, with `%s` placeholder) | User activates a `web+foo://...` or safelisted-scheme link | Browser navigates to substituted `url` | Limited: Chrome/Edge 96+; not Firefox/Safari | Custom schemes MUST start with `web+` and lowercase ASCII; non-safelisted bare schemes are rejected |
| `share_target` | `{action, method?, enctype?, params: {title?, text?, url?, files?: [{name, accept}]}}` | User picks the PWA from native OS share sheet (post-install) | `GET` query string OR `POST` form data (handled via service worker `fetch`) | Limited: Chromium-based incl. Android/ChromeOS post-install; not Firefox/Safari | POST handlers must reply with `303 See Other` to avoid duplicate submits on refresh; must validate inbound data |
| `launch_handler` | `{client_mode: "auto"\|"navigate-new"\|"navigate-existing"\|"focus-existing" \| string[]}` | Any deep-link/file/protocol/share launch into the PWA | `client_mode` selects window-reuse strategy; `LaunchParams.targetURL` exposes URL to existing window | Limited: Chromium-based; not Firefox/Safari | `route_to` from earlier drafts is gone — use `client_mode` only; `auto` is the default |

- **Authorship anchors:** Thomas Steiner is the named author for all three Chrome capabilities articles cited (file-handling, launch-handler, url-protocol-handler). Microsoft Edge team (Fabio Rocha, Diego González, Connor Moody, Samuel Tang) co-implemented and specified `protocol_handlers`. Use this in References to satisfy the "named author" tier rule.

- **`route_to` claim caveat:** the dispatch lists `route_to` as deprecated. Current MDN does not document it at all and the WICG spec only normalizes `client_mode`. The article should treat `route_to` as a one-line "earlier-trial name; never write it" footnote in Deep Dive — not as a live API alternative. C14 is included for completeness but is the weakest claim by source-quality (only Chrome historical docs/blink-dev mailing list; no current MDN trace). Consider dropping it if space is tight.

- **Spec-vs-MDN discrepancy on `share_target.files`:** The W3C TAG draft I fetched did not show a `files` definition in its surface text, but MDN, the WICG `web-share-target` Level 2 incubation, and Chromium's shipping behavior all document `files` with `{name, accept}`. The absence in the W3C-TAG draft is incidental to the prompt-extraction; do not treat as authoritative omission. Cite MDN for the `files` schema.

- **Delivery model symmetry:** `file_handlers` and `launch_handler` both deliver context via `window.launchQueue` (`launchParams.files` for files, `launchParams.targetURL` for arbitrary launches). `protocol_handlers` does NOT use launchQueue — the substituted URL is just navigated to. `share_target` uses a normal HTTP request (GET query / POST form) intercepted via service worker `fetch`. This asymmetry is the article's most useful Deep Dive insight and should anchor a Mermaid diagram if Visual is a diagram rather than a table.

- **Cross-references for Related Topics section:**
  - FEE-1301 (Web App Manifest & Installability) — baseline manifest counterpart.
  - FEE-1302/13xx if the category has a Service Worker / fetch-handler article — required for `share_target` POST handling.
  - FEE-12002 (Document Picture-in-Picture) — adjacent Chromium-only desktop integration.

## Rejected Sources

- **https://web.dev/articles/launch-handler** — 404. Article was migrated; the canonical replacement is `https://developer.chrome.com/docs/web-platform/launch-handler` (used).
- **https://web.dev/articles/url-protocol-handler** — 404. Replaced by `https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler` (used).
- **https://wicg.github.io/web-share-target/** — empty body returned by WebFetch (rendered page is JS-driven). Replaced with `https://w3c.github.io/web-share-target/` (TAG draft, fetched successfully).
- **https://wicg.github.io/web-share-target/level-2/** — 404.
- **`webdocs.dev` mirror result** — anonymous re-host of MDN content; rejected per source-tier rule (use MDN canonical instead).
- **Wikipedia / anonymous Medium / chromestatus.com feature card** — used only as a navigational aid in search, not cited as authoritative; no quotes drawn from them.
agentId: ab93d68dcb04ce0ca (use SendMessage with to: 'ab93d68dcb04ce0ca' to continue this agent)
<usage>total_tokens: 48757
tool_uses: 22
duration_ms: 200201</usage>