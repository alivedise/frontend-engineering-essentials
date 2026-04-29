---
id: 1312
title: "Window Controls Overlay & display_override for Desktop PWAs"
state: draft
slug: window-controls-overlay
---

# [FEE-1312] Window Controls Overlay & display_override for Desktop PWAs

:::info
Window Controls Overlay (WCO) lets a desktop-installed PWA hide the default OS title bar and paint web content across the entire window surface, with the maximize, minimize, and close buttons rendered on top as an overlay (MDN). The opt-in is the manifest member `display_override: ["window-controls-overlay"]`, which the browser walks in array order and resolves before falling back to the legacy `display` member (MDN `display_override`). Activated overlays expose four CSS `env(titlebar-area-*)` variables that pin layout to the title-bar rectangle, plus the `navigator.windowControlsOverlay` JS surface with a `visible` flag, `getTitlebarAreaRect()`, and a `geometrychange` event (WICG, MDN). Support is Chromium-only as of 2026; Firefox and Safari do not implement WCO, so the fallback chain is part of the deployment story (caniuse).
:::

## Context

The desktop PWA model started by giving installed apps their own window through `display: standalone`, but that mode preserved the browser-drawn title bar, leaving the top strip outside the developer's reach. The Window Controls Overlay specification, drafted in WICG, addresses that gap by letting a PWA "hide the default window title bar and display their own content over the full surface area of the app window, turning the control buttons (maximize, minimize, and close) into an overlay" (MDN Window_Controls_Overlay_API). The activation path runs through the newer `display_override` manifest member, which MDN describes as "an array of display modes that are considered in-order, and the first supported display mode is applied," and which "lets the developer provide a sequence of display modes that the browser will consider before using the `display` member" (MDN `display_override`). The CSS contract for the overlay is four `env()` variables defining a title-bar rectangle (WICG), and the JS contract is the `WindowControlsOverlay` interface reached via `navigator.windowControlsOverlay` (MDN). As of 2026, caniuse records WCO as supported in Chrome, Edge, and Opera and not supported in Firefox or Safari, so every WCO deployment ships alongside a fallback for the non-supporting majority of platforms.

## Visual

| Layer | Surface | Purpose | Source |
| --- | --- | --- | --- |
| Manifest | `display_override: ["window-controls-overlay"]` (with `display: "standalone"` as the fallback) | Opts the PWA into WCO; array is walked in order, first supported mode wins | web.dev (Baker, Steiner); MDN `display_override` |
| Manifest fallback | `display` member | Used when no entry in `display_override` is supported | MDN `display_override` |
| CSS layout | `env(titlebar-area-x)`, `env(titlebar-area-y)`, `env(titlebar-area-width)`, `env(titlebar-area-height)` | Four `length` variables defining the title-bar rectangle; fallback values activate when WCO is inactive | WICG; web.dev |
| CSS drag | `app-region: drag` / `app-region: no-drag` (currently `-webkit-app-region` only) | Marks an OS-level draggable region inside the overlay strip | web.dev; WICG |
| JS detection | `"windowControlsOverlay" in navigator` | Feature-detect the API surface | MDN `Navigator.windowControlsOverlay` |
| JS state | `navigator.windowControlsOverlay.visible`, `getTitlebarAreaRect()` | Read whether the overlay is active and where the title-bar rectangle sits | MDN `WindowControlsOverlay` |
| JS event | `geometrychange` on `navigator.windowControlsOverlay` | Fires on overlay resize, page-zoom changes, or other UI appearing/disappearing on the overlay | WICG; web.dev |
| Browser support | Chrome 105+, Edge 105+, Opera 91+ supported; Firefox and Safari not supported | Defines the size of the fallback population | caniuse |

## Example

A PWA opts in to WCO and lays out its custom title bar against the env() rectangle. The manifest declares the override chain, with `standalone` as the fallback so non-WCO browsers still install the app into its own window:

```json
{
  "display": "standalone",
  "display_override": ["window-controls-overlay"]
}
```

CSS pins the title-bar contents to the four `env(titlebar-area-*)` variables and uses fallbacks so the same markup renders inline when the overlay is inactive (for example, when the PWA runs in a tab or in Firefox/Safari):

```css
.titlebar {
  position: fixed;
  left: env(titlebar-area-x, 0);
  top: env(titlebar-area-y, 0);
  width: env(titlebar-area-width, 100%);
  height: env(titlebar-area-height, 33px);
  -webkit-app-region: drag;
}

.titlebar button {
  -webkit-app-region: no-drag;
}
```

JS feature-detects the API, reads the current rectangle, and listens for geometry changes so the title-bar UI can adapt when the user resizes the window or changes page zoom:

```js
if ("windowControlsOverlay" in navigator) {
  const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
  // rect.x, rect.y, rect.width, rect.height match the env() variables.

  navigator.windowControlsOverlay.addEventListener("geometrychange", (e) => {
    const span = document.querySelector(".titlebar .label");
    span.hidden = e.titlebarAreaRect.width < 800;
  });
}
```

The geometry-change snippet mirrors the web.dev example: the listener reads `e.titlebarAreaRect` and hides a label when the title-bar area gets too narrow. Per WICG, `geometrychange` fires when the overlay's width or height changes "as a result of the user resizing the browser window, or changing the page zoom factor, or other UI appearing or disappearing on the [overlay]."

## Best Practices

- **MUST** declare WCO through `display_override` with an explicit fallback to `display: "standalone"` (or another supported mode), because the `display_override` array is "considered in-order, and the first supported display mode is applied" and the browser falls through to `display` when no entry is supported (MDN `display_override`).
- **MUST** provide fallback values inside every `env(titlebar-area-*)` reference, because when WCO is inactive the page renders inline as regular HTML and the fallback values activate (web.dev).
- **MUST** feature-detect with `"windowControlsOverlay" in navigator` before reading `getTitlebarAreaRect()` or subscribing to `geometrychange`, since the property gates access to the `WindowControlsOverlay` interface (MDN `Navigator.windowControlsOverlay`).
- **MUST** treat `navigator.windowControlsOverlay.visible === false` as the same rendering state as the non-WCO branch, because the spec defines the overlay as not visible when the PWA runs in a tab or is uninstalled (WICG).
- **SHOULD** mark the title-bar strip with `app-region: drag` and re-mark interactive elements (buttons, inputs) with `app-region: no-drag`, mirroring the web.dev guidance on restoring window-drag behaviour over a custom title bar.
- **SHOULD** ship the `-webkit-app-region` prefix today, because the spec records that "currently, only `-webkit-app-region` is supported in the browser" (WICG).
- **SHOULD** subscribe to `geometrychange` and re-evaluate the title-bar layout on each event, because the overlay rectangle changes on window resize, page-zoom changes, or other UI appearing on the overlay (WICG; web.dev).
- **SHOULD** plan for Firefox and Safari to fall through to the next `display_override` entry (and ultimately to `display`), since caniuse lists both as Not supported through their current releases.
- **MAY** read `navigator.windowControlsOverlay.getTitlebarAreaRect()` once at startup for the initial layout pass, then rely on the `geometrychange` event for updates, since the rect API and the event payload (`e.titlebarAreaRect`) expose the same rectangle (MDN `WindowControlsOverlay`; web.dev).
- **MAY** treat the title-bar geometry as a fingerprinting input and avoid logging it to third parties, because the WICG spec notes that "enabling Window Controls Overlay poses an increased fingerprinting surface since the size of the overlay can vary depending on the OS, the text scale, the OS font size, the OS zoom factor, and the web content's zoom factor."

## Design Thinking

WCO trades a uniform browser title bar for full-surface canvas, and the trade-off is who owns drag behaviour. Once the title strip is web content, OS-level window dragging stops working there by default; the spec restores it through the `app-region: drag` / `no-drag` pair (web.dev), at the cost of a Chromium-prefixed property that the WICG spec records as the only currently shipping form. The second trade-off is feature surface vs. fingerprinting: the geometry rectangle exposed through `env()`, `getTitlebarAreaRect()`, and `geometrychange` enables responsive title bars, and the same surface widens fingerprinting because the rectangle varies with OS, text scale, OS font size, OS zoom, and page zoom (WICG). The third trade-off lives in `display_override` itself: ordering an aggressive mode like `window-controls-overlay` first maximises canvas on supporting browsers, and the `display` fallback keeps the install experience intact on Firefox and Safari (MDN `display_override`; caniuse).

## Title-bar Customization Lifecycle

The activation handshake runs through five states. Each state names the surface that drives it.

1. **Manifest declaration.** The manifest sets `display_override: ["window-controls-overlay"]` and keeps a `display` value such as `"standalone"`. The override array is "considered in-order, and the first supported display mode is applied," and `display_override` "lets the developer provide a sequence of display modes that the browser will consider before using the `display` member" (MDN `display_override`). Per web.dev, opt-in happens by adding `"window-controls-overlay"` as the primary `display_override` member.
2. **Install / launch resolution.** When the user installs the PWA into its own window on a desktop OS, a Chromium-based browser walks the array, accepts `window-controls-overlay`, and activates the overlay. The display mode "only applies when the application is in a separate PWA window and on a desktop operating system" (MDN `display_override`). Non-supporting browsers "either not consider the `display_override` web app manifest property at all, or not recognize the `window-controls-overlay` and thus use the next possible value according to the fallback chain" (WICG). caniuse records Firefox and Safari as Not supported, so on those engines the chain falls through to `display`. If the PWA runs in a tab instead of a separate PWA window, the spec states the overlay "will not be visible" (WICG).
3. **`windowControlsOverlay.visible` resolution.** Once the page loads, scripts read `navigator.windowControlsOverlay.visible`, "a Boolean that indicates whether the window controls overlay is visible or not" (MDN `WindowControlsOverlay`). The same property reports whether the opt-in won this session: `true` means the env() rectangle and overlay buttons are live; `false` means the page is rendering inline with the env() fallback values.
4. **CSS `env(titlebar-area-*)` layout.** With the overlay active, the four "title bar area environmental variables" — `titlebar-area-x`, `titlebar-area-y`, `titlebar-area-width`, `titlebar-area-height`, each typed `length` (WICG) — define the rectangle the developer paints into. web.dev recommends using the variable with a fallback (`left: env(titlebar-area-x, 0);`) so that "the HTML built for the window controls overlay will display inline like regular HTML content and the `env()` variables' fallback values will kick in" when WCO is inactive. `app-region: drag` (currently `-webkit-app-region`) marks the OS-level draggable strip; `app-region: no-drag` opts interactive elements back out (web.dev; WICG).
5. **`geometrychange` event flow.** While the overlay is active, the user agent fires `geometrychange` "if [the overlay] has had its width or height changed (e.g. as a result of the user resizing the browser window, or changing the page zoom factor, or other UI appearing or disappearing on the [overlay])" (WICG). web.dev shows two equivalent subscription forms: assigning to `navigator.windowControlsOverlay.ongeometrychange`, or calling `addEventListener("geometrychange", ...)`; the event payload exposes `e.titlebarAreaRect` for runtime layout decisions (`span.hidden = e.titlebarAreaRect.width < 800;`). When the user moves the PWA back into a tab or uninstalls it, `visible` flips to `false` and the page returns to the env() fallback path described in state 4.

In browsers that do not honor `display_override: ["window-controls-overlay"]` — Firefox and Safari today (caniuse), and any environment where the PWA runs uninstalled or in a tab (WICG) — the same source ships unchanged: the manifest falls through to `display`, the env() variables resolve to their fallbacks, and the JS branch behind `"windowControlsOverlay" in navigator` is skipped. The WICG spec states the contract directly: "If a user agent does not support WCO, the developer can use reasonable fallbacks for both the `display_override` using `display` and the CSS variables and JS object accordingly."

## Related Topics

- [FEE-1301 Web App Manifest baseline](/en/Progressive%20Web%20Apps%20and%20Offline/1301)
- [FEE-1311 PWA OS Integration Manifest Members](/en/Progressive%20Web%20Apps%20and%20Offline/pwa-os-integration-manifest)

## References

- Amanda Baker and Thomas Steiner, "Customize the window controls overlay of your PWA's title bar," web.dev (2022, updated). https://web.dev/articles/window-controls-overlay
- WICG, "Window Controls Overlay" (Editor's Draft). https://wicg.github.io/window-controls-overlay/
- MDN contributors, "Window Controls Overlay API." https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
- MDN contributors, "display_override — Web App Manifest." https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override
- MDN contributors, "WindowControlsOverlay." https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay
- MDN contributors, "Navigator.windowControlsOverlay." https://developer.mozilla.org/en-US/docs/Web/API/Navigator/windowControlsOverlay
- caniuse.com, "WindowControlsOverlay." https://caniuse.com/mdn-api_windowcontrolsoverlay
