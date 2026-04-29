---
id: 1311
title: "PWA OS Integration Manifest Members (file_handlers, protocol_handlers, share_target, launch_handler)"
state: draft
slug: pwa-os-integration-manifest
---

# [FEE-1311] PWA OS Integration Manifest Members (file_handlers, protocol_handlers, share_target, launch_handler)

:::info
The W3C Web Application Manifest defines a baseline set of optional members and an extension hook for additional manifest members defined by other specifications. Four such extension members — `file_handlers`, `protocol_handlers`, `share_target`, and `launch_handler` — turn an installed PWA into a peer of native apps in OS file, URL, share, and launch flows. This article catalogues their schemas, OS triggers, delivery APIs, browser support, and pitfalls. Per MDN compatibility banners, all four are currently "Limited availability" and Chromium-only.
:::

## Context

The W3C Web Application Manifest specification ([W3C TR/appmanifest](https://www.w3.org/TR/appmanifest/)) lists optional root members as `background_color`, `dir`, `display`, `icons`, `id`, `lang`, `name`, `orientation`, `scope`, `short_name`, `shortcuts`, `start_url`, and `theme_color`, and includes an extension hook stating that "other specifications that add new members to the manifest are encouraged to hook themselves into this specification at this point in the algorithm." `file_handlers`, `protocol_handlers`, `share_target`, and `launch_handler` are not defined in this baseline document. They live in WICG manifest-incubations, the WICG Web App Launch Handler spec, and the W3C TAG Web Share Target draft. Manifest-level `protocol_handlers` shipped in Chrome 96 and was implemented and specified by the Microsoft Edge team (Fabio Rocha, Diego González, Connor Moody, Samuel Tang). File handling, per the Chrome capabilities page authored by Thomas Steiner, ships in Chrome 102+ and Edge 102+ on desktop only, with no support in Firefox or Safari. MDN's compatibility banners mark each of the four members as "Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers." This article complements the baseline manifest article (FEE-1301) by covering only the OS-integration extension members.

## Visual

| Member | Schema shape | OS launch trigger | Delivery API | Browser support (Apr 2026) | Common pitfall |
|---|---|---|---|---|---|
| `file_handlers` | `[{action, accept: {mime: [exts]}, icons?, launch_type?}]` | User opens a file of a registered type from the OS file manager | `window.launchQueue.setConsumer` callback receives `LaunchParams.files` (array of `FileSystemHandle`) | Limited: Chrome/Edge 102+ desktop; not Firefox/Safari | `action` URL must lie inside `scope`; per-launch permission prompt embargoes after 3 ignores |
| `protocol_handlers` | `[{protocol, url}]` (HTTPS, with `%s` placeholder) | User activates a `web+foo://...` link or a safelisted-scheme link | Browser navigates to the substituted `url` | Limited: Chrome/Edge 96+; not Firefox/Safari | Custom schemes must start with `web+` and lowercase ASCII; non-safelisted bare schemes are rejected |
| `share_target` | `{action, method?, enctype?, params: {title?, text?, url?, files?: [{name, accept}]}}` | User picks the PWA from the native OS share sheet (post-install) | `GET` query string or `POST` form data, intercepted via service worker `fetch` | Limited: Chromium-based incl. Android/ChromeOS post-install; not Firefox/Safari | POST handlers should reply with `303 See Other` to avoid duplicate submits on refresh; inbound data must be validated |
| `launch_handler` | `{client_mode: "auto" \| "navigate-new" \| "navigate-existing" \| "focus-existing" \| string[]}` | Any deep-link, file, protocol, or share launch into the PWA | `client_mode` selects the window-reuse strategy; `LaunchParams.targetURL` exposes the URL to the existing window | Limited: Chromium-based; not Firefox/Safari | `route_to` from earlier drafts has been removed; `auto` is the default |

## Example

A markdown editor PWA registers itself as the OS handler for `.md` files, the `web+md` URL scheme, the share sheet, and a single-window launch policy. The manifest snippet:

```json
{
  "name": "Markpad",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "file_handlers": [
    {
      "action": "/open",
      "accept": {
        "text/markdown": [".md", ".markdown"]
      },
      "launch_type": "single-client"
    }
  ],
  "protocol_handlers": [
    {
      "protocol": "web+md",
      "url": "/handle?uri=%s"
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        { "name": "attachments", "accept": ["text/markdown", ".md"] }
      ]
    }
  },
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}
```

When the user opens `notes.md` from Finder or Explorer, the browser, per the MDN file_handlers reference, has already "read [the manifest] at installation time to associate the application with a given set of file types at the operating system level." The browser launches the PWA at `/open`. The application code (the MDN reference notes that "Handling files is done in the application code that runs on the main thread, not in the application's service worker") consumes the file via `launchQueue`:

```js
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    if (!launchParams.files || launchParams.files.length === 0) return;
    for (const handle of launchParams.files) {
      const file = await handle.getFile();
      const text = await file.text();
      openInEditor(file.name, text);
    }
  });
}
```

Per the Chrome file-handling capabilities page, "Launches are queued until they are handled by the specified consumer, which is invoked exactly once for each launch." Per MDN's `LaunchParams` reference, `LaunchParams.files` is "a read-only array of `FileSystemHandle` objects representing any files passed along with the launch navigation."

When the user clicks a `web+md://gist/abc123` link, the browser substitutes the full URL for `%s` and navigates the PWA to `/handle?uri=web%2Bmd%3A%2F%2Fgist%2Fabc123`. The MDN protocol_handlers reference defines `url` as the "Required HTTPS URL within the application `scope` that will handle the protocol" and states that "the `%s` token will be replaced by the URL starting with the protocol handler's scheme."

When the user shares a `.md` file from another app, the OS share sheet lists Markpad. The browser submits a `multipart/form-data` POST to `/share`, intercepted by the service worker. The MDN share_target reference recommends that "the `POST` request is then ideally replied with an HTTP 303 See Other redirect to avoid multiple `POST` requests from being submitted if a page refresh was initiated by the user."

`launch_handler.client_mode: "navigate-existing"` causes subsequent launches to reuse the open window. Per MDN's Launch Handler API reference, `navigate-existing` means "the most recently interacted with browsing context in a web app window is navigated to the target launch URL."

## Best Practices

- **MUST** keep every handler `action` and `url` inside the PWA's navigation scope. The MDN file_handlers reference states: "This URL must be within the navigation scope of the PWA, which is the set of URLs that the PWA can navigate to. The navigation scope of a PWA defaults to its `start_url` member, but can also be defined by using the `scope` member." The same scope constraint applies to `protocol_handlers.url` and `share_target.action`.
- **MUST** prefix custom protocol schemes with `web+` followed by lowercase ASCII letters. Per MDN's `registerProtocolHandler` reference (referenced normatively by manifest-incubations), a custom scheme "Begins with `web+`; Contains at least one letter after the `web+` prefix; Contains only lowercase ASCII letters." Outside the safelist (`bitcoin`, `ftp`, `ftps`, `geo`, `im`, `irc`, `ircs`, `magnet`, `mailto`, `matrix`, `mms`, `news`, `nntp`, `openpgp4fpr`, `sftp`, `sip`, `sms`, `smsto`, `ssh`, `tel`, `urn`, `webcal`, `wtai`, `xmpp`), bare schemes are rejected.
- **MUST** register a `launchQueue` consumer when shipping `file_handlers`. Per the MDN file_handlers reference, "web developers also need to use `window.launchQueue` to handle the incoming files in their application JavaScript code." Without a consumer, launched files are queued indefinitely.
- **MUST** validate inbound data passed to `share_target`. Per the MDN share_target reference: "Similar to HTML form submissions, you should be cautious about data that is sent to your application via the share target. Be sure to validate incoming data before using it."
- **MUST** use `method: "POST"` with `enctype: "multipart/form-data"` for share targets that accept files. Per the MDN share_target reference: "Use `POST` if the shared data includes binary data like image(s), or if it changes the target app, for example, if it creates a data point like a bookmark."
- **SHOULD** reply to share-target POSTs with `303 See Other` to prevent duplicate submissions on refresh, per the MDN share_target reference quoted above.
- **SHOULD** treat the file-handling permission prompt as a recoverable user choice. Per the Chrome file-handling capabilities page (Thomas Steiner): "This permission will show every time until the user clicks to **Allow** or **Block** file handling for the site, or ignores the prompt three times (after which Chromium will embargo and block this permission)."
- **SHOULD** rely on installation as the registration boundary for share targets. Per the MDN share_target reference, "Your PWA can only act as a web share target if it has been installed."
- **MAY** omit `launch_handler` and accept the default. Per the WICG Web App Launch Handler API, `auto` is "the user agent's default launch routing behaviour" and is the default when `launch_handler` is absent or invalid.

## Deep Dive

The four members differ in how they deliver context to the running PWA. `file_handlers` and `launch_handler` both surface state through `window.launchQueue`: a file-handler launch populates `LaunchParams.files` with `FileSystemHandle` objects, and per MDN's Launch Handler API reference, `client_mode: "focus-existing"` "will populate the target launch URL in the `targetURL` property of the `LaunchParams` object passed into the `window.launchQueue.setConsumer()`'s callback function." `protocol_handlers` does not use `launchQueue`; the substituted URL is simply navigated to. `share_target` uses an ordinary HTTP request — `GET` query string or `POST` form data — which the service worker may intercept via a `fetch` handler.

`launch_handler.client_mode` accepts an array as well as a string. Per the WICG Web App Launch Handler spec: "If unspecified, launch_handler defaults to `{\"client_mode\": \"auto\"}`. The `client_mode` property also accepts a list (array) of values, where the first valid value will be used." The four normative values, per MDN, are:

- `focus-existing` — the most recently interacted browsing context in a web app window is focused; `targetURL` is exposed via `launchQueue`.
- `navigate-existing` — the most recently interacted browsing context is navigated to the target URL.
- `navigate-new` — a new browsing context is created in a web app window.
- `auto` — the user agent decides; this is the default and the fallback when supplied values are invalid.

The earlier-trial property name `route_to` has been removed before stable release. Per the Chrome launch-handler capabilities page (Thomas Steiner), historical Chrome documentation referenced `route_to`, and the current WICG spec at `wicg.github.io/web-app-launch/` only normalizes `client_mode`. Authors should not write `route_to`; treat it as historical context.

The `accept` dictionary in `file_handlers` maps MIME types to file-extension lists. Per the WICG manifest-incubations spec, each handler item carries `action`, `name`, `accept` ("a dictionary mapping MIME types to a list of file extensions"), `icons`, and `launch_type` ("either `single-client` or `multiple-clients`"). The MDN reference confirms that each handler object "must contain the following values (`action` and `accept` are required)."

## Member Reference Matrix

The four members differ in schema, OS surface, delivery API, support tier, and the most common pitfall.

### `file_handlers`

| Field | Required | Notes |
|---|---|---|
| `action` | yes | Navigation URL inside `scope`. |
| `accept` | yes | Object mapping MIME types to arrays of file extensions. |
| `name` | no | Display name for the file-type association. |
| `icons` | no | Array of icon objects for the OS file-type icon. |
| `launch_type` | no | `single-client` or `multiple-clients`. |

- OS surface: file manager / "Open with…" menu.
- Registration time: install time. Per MDN, "read by the browser at installation time to associate the application with a given set of file types at the operating system level."
- Delivery: `window.launchQueue.setConsumer(callback)`; `callback` receives a `LaunchParams` whose `files` is an array of `FileSystemHandle` objects.
- Browser support (Apr 2026): Chrome 102+, Edge 102+, desktop only. Not supported in Firefox or Safari. MDN: "Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers."
- Permission model: per-launch prompt that embargoes after three ignores (Chrome capabilities page).

### `protocol_handlers`

| Field | Required | Notes |
|---|---|---|
| `protocol` | yes | A safelisted scheme or a `web+`-prefixed lowercase ASCII custom scheme. |
| `url` | yes | HTTPS URL inside `scope`, with `%s` placeholder. Relative URLs resolve against the manifest URL. |

- OS surface: any URL activator that can fire the registered scheme — browsers, email clients, native apps.
- Registration time: install time.
- Delivery: navigation to the URL produced by replacing `%s` with the activated URL.
- Browser support (Apr 2026): Chrome 96+, Edge 96+. Not supported in Firefox or Safari. MDN: "Limited availability… This is an experimental technology."
- Common pitfall: non-safelisted bare schemes (without the `web+` prefix) are rejected.

### `share_target`

| Field | Required | Notes |
|---|---|---|
| `action` | yes | URL inside `scope` that receives the share. |
| `method` | no | `GET` or `POST`. |
| `enctype` | no | Encoding for `POST` requests; use `multipart/form-data` for files. |
| `params.title` | no | Query/form parameter name for the shared title. |
| `params.text` | no | Query/form parameter name for the shared text. |
| `params.url` | no | Query/form parameter name for the shared URL. |
| `params.files` | no | Array of `{ name, accept }` entries for shared files. |

- OS surface: native share sheet.
- Registration time: install time; only registered after install ("Your PWA can only act as a web share target if it has been installed.").
- Delivery: HTTP request to `action` (GET query string or POST form), typically intercepted by a service worker `fetch` handler.
- Browser support (Apr 2026): Chromium-based, including Android and ChromeOS post-install. Not supported in Firefox or Safari. MDN: "Limited availability — This feature is not Baseline… It is marked as experimental."
- Method guidance (MDN + W3C TAG draft): GET is appropriate "when the share target drafts a message for subsequent user approval"; POST is recommended "if the share target performs a side-effect without any user interaction."

### `launch_handler`

| Field | Required | Notes |
|---|---|---|
| `client_mode` | no | One of `auto`, `navigate-new`, `navigate-existing`, `focus-existing`, or an array of those (first valid value wins). Defaults to `auto`. |

- OS surface: every launch path that opens the PWA — file handlers, protocol handlers, share targets, deep links, install icon clicks.
- Registration time: install time, applied at launch time.
- Delivery: window-routing decision is made by the user agent before navigation; for `focus-existing`, `LaunchParams.targetURL` is exposed via `launchQueue`.
- Browser support (Apr 2026): Chromium-based. Not supported in Firefox or Safari. MDN: "Limited availability… This is an experimental technology."
- Common pitfall: `route_to` (an earlier-trial name) has been removed; only `client_mode` is normative in the current WICG spec.

## Manifest-to-OS Surface Mapping

| OS surface | Triggered by | Manifest member | Scope of effect |
|---|---|---|---|
| File manager / "Open with…" | User opens a file of a registered MIME type or extension | `file_handlers` | Per-PWA association at install time |
| URL/URI activator (browser, mail client, native app) | User clicks a `web+foo://…` or safelisted-scheme link | `protocol_handlers` | Per-PWA association at install time |
| Native share sheet | User picks the PWA when sharing from another app | `share_target` | Visible only after install |
| Window routing for any launch | Any of the above plus deep links and home-screen launches | `launch_handler` | Applies to every launch into the PWA |

The first three members register the PWA on a specific OS surface. `launch_handler` modifies how every launch routes between existing and new browsing contexts; it composes with the other three rather than registering its own surface.

## Related Topics

- [FEE-1301 Web App Manifest baseline](/en/Progressive%20Web%20Apps%20and%20Offline/1301)

## References

- W3C, "Web Application Manifest" (W3C). https://www.w3.org/TR/appmanifest/
- WICG, "Manifest Incubations" (WICG). https://wicg.github.io/manifest-incubations/
- WICG, "Web App Launch Handler API" (WICG). https://wicg.github.io/web-app-launch/
- W3C TAG, "Web Share Target API" (W3C). https://w3c.github.io/web-share-target/
- MDN contributors, "file_handlers — Web App Manifest Reference," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers
- MDN contributors, "protocol_handlers — Web App Manifest Reference," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers
- MDN contributors, "share_target — Web App Manifest Reference," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- MDN contributors, "Launch Handler API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API
- MDN contributors, "LaunchParams," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/LaunchParams
- MDN contributors, "Navigator: registerProtocolHandler() method," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler
- Thomas Steiner, "Let installed web applications handle files," Chrome for Developers. https://developer.chrome.com/docs/capabilities/web-apis/file-handling
- Thomas Steiner, "Launch handler," Chrome for Developers. https://developer.chrome.com/docs/web-platform/launch-handler
- Thomas Steiner, "URL protocol handler registration for PWAs," Chrome for Developers. https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler
- web.dev, "Learn PWA: OS Integration," web.dev. https://web.dev/learn/pwa/os-integration
