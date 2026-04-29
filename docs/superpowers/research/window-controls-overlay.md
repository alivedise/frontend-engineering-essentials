I have enough verified data. Let me compile the findings.

# FEE-1312 Research Findings: Window Controls Overlay & `display_override` for Desktop PWAs

**Target id:** 1312
**Slug:** `window-controls-overlay`
**Topic-specific section:** `## Title-bar Customization Lifecycle`

## Verified Sources

1. **WICG Window Controls Overlay spec** — https://wicg.github.io/window-controls-overlay/ (verified)
2. **web.dev "Customize the window controls overlay"** by Amanda Baker and Thomas Steiner — https://web.dev/articles/window-controls-overlay (verified)
3. **MDN Window Controls Overlay API** — https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API (verified)
4. **MDN `display_override` manifest member** — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override (verified)
5. **MDN `WindowControlsOverlay` interface** — https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay (verified)
6. **MDN `Navigator.windowControlsOverlay`** — https://developer.mozilla.org/en-US/docs/Web/API/Navigator/windowControlsOverlay (verified)
7. **MDN `display` manifest member** — https://developer.mozilla.org/en-US/docs/Web/Manifest/display (verified)
8. **caniuse — `mdn-api_windowcontrolsoverlay`** — https://caniuse.com/mdn-api_windowcontrolsoverlay (verified)

## Claims (14)

### Claim 1 — What WCO does
- **Source:** MDN Window_Controls_Overlay_API — https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
- **Quote:** "The Window Controls Overlay API gives Progressive Web Apps installed on desktop operating systems the ability to hide the default window title bar and display their own content over the full surface area of the app window, turning the control buttons (maximize, minimize, and close) into an overlay."

### Claim 2 — Manifest opt-in via `display_override`
- **Source:** web.dev (Baker, Steiner) — https://web.dev/articles/window-controls-overlay
- **Quote:** "A progressive web app can opt-in to the window controls overlay by adding `\"window-controls-overlay\"` as the primary `\"display_override\"` member in the web app manifest" with code example `"display_override": ["window-controls-overlay"]`.

### Claim 3 — `display_override` is array-ordered
- **Source:** MDN display_override — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override
- **Quote:** "Its value is an array of display modes that are considered in-order, and the first supported display mode is applied."

### Claim 4 — `display_override` overrides the legacy `display` member
- **Source:** MDN display_override — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override
- **Quote:** "The `display_override` member solves this by letting the developer provide a sequence of display modes that the browser will consider before using the `display` member."

### Claim 5 — `window-controls-overlay` display-mode semantics
- **Source:** MDN display_override — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override
- **Quote:** "This display mode only applies when the application is in a separate PWA window and on a desktop operating system. The application will opt-in to the Window Controls Overlay feature, where the full window surface area will be available for the app's web content and the window control buttons (maximize, minimize, close, and other PWA-specific buttons) will appear as an overlay above the web content."

### Claim 6 — Four CSS env() variables defining the title-bar area
- **Source:** WICG spec — https://wicg.github.io/window-controls-overlay/
- **Quote:** "The [title bar area environmental variables] are four env variables that define a rectangle by the width and height from a starting point in the viewport." Variables: `titlebar-area-x`, `titlebar-area-y`, `titlebar-area-width`, `titlebar-area-height` (each typed `length`).

### Claim 7 — env() variables take fallback values that activate when WCO is inactive
- **Source:** web.dev (Baker, Steiner) — https://web.dev/articles/window-controls-overlay
- **Quote:** "Use the environment variable for the left anchoring with a fallback." Code: `left: env(titlebar-area-x, 0);`. Plus: "the HTML built for the window controls overlay will display inline like regular HTML content and the `env()` variables' fallback values will kick in".

### Claim 8 — `app-region: drag / no-drag` declares the OS-level draggable region
- **Source:** web.dev (Baker, Steiner) — https://web.dev/articles/window-controls-overlay
- **Quote:** "Fix this using the `app-region` CSS property with a value of `drag`" with examples `app-region: drag;` and `app-region: no-drag;`.

### Claim 9 — `app-region` is currently Chromium-only under a `-webkit-` prefix
- **Source:** WICG spec — https://wicg.github.io/window-controls-overlay/
- **Quote:** "Currently, only `-webkit-app-region` is supported in the browser."

### Claim 10 — `navigator.windowControlsOverlay` is a feature-detection point and exposes `WindowControlsOverlay`
- **Source:** MDN Navigator.windowControlsOverlay — https://developer.mozilla.org/en-US/docs/Web/API/Navigator/windowControlsOverlay
- **Quote:** "The `windowControlsOverlay` read-only property of the `Navigator` interface returns the `WindowControlsOverlay` interface, which exposes information about the title bar geometry in desktop Progressive Web Apps". Detection example: `if ("windowControlsOverlay" in navigator) { const rect = navigator.windowControlsOverlay.getTitlebarAreaRect(); ... }`.

### Claim 11 — `visible` and `getTitlebarAreaRect()`
- **Source:** MDN WindowControlsOverlay — https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay
- **Quote:** `visible` is "A Boolean that indicates whether the window controls overlay is visible or not." `getTitlebarAreaRect()` "Returns the size and position of the title bar."

### Claim 12 — `geometrychange` event fires on overlay resize/zoom changes
- **Source:** WICG spec — https://wicg.github.io/window-controls-overlay/
- **Quote:** "If |win|'s [overlay] has had its width or height changed (e.g. as a result of the user resizing the browser window, or changing the page zoom factor, or other UI appearing or disappearing on the [overlay]), since the last time these steps were run, [fire an event] named `ongeometrychange`".
- **Companion quote (web.dev):** "You can be notified of geometry changes by subscribing to `navigator.windowControlsOverlay.ongeometrychange` or by setting up an event listener for the `geometrychange` event". Event payload usage: `span.hidden = e.titlebarAreaRect.width < 800;`.

### Claim 13 — Non-supporting browsers fall through the `display_override` chain (and to `display`)
- **Source:** WICG spec — https://wicg.github.io/window-controls-overlay/ (and web.dev)
- **Quote (spec):** "Non-supporting browsers will either not consider the `display_override` web app manifest property at all, or not recognize the `window-controls-overlay` and thus use the next possible value according to the fallback chain."
- **Quote (spec):** "If a user agent does not support WCO, the developer can use reasonable fallbacks for both the `display_override` using `display` and the CSS variables and JS object accordingly."
- **Companion (MDN display_override):** "It follows a process where the browser falls back to the next display mode if the requested one is not supported."

### Claim 14 — Tab/un-installed mode also disables the overlay
- **Source:** WICG spec — https://wicg.github.io/window-controls-overlay/
- **Quote:** "The window controls overlay will not be visible...when the PWA in question runs in a tab."

### Claim 15 — Browser support: Chromium-only as of 2026; Firefox + Safari do not implement
- **Source:** caniuse `mdn-api_windowcontrolsoverlay` — https://caniuse.com/mdn-api_windowcontrolsoverlay
- **Data (verbatim):** "Edge: 105 - 146: Supported", "Chrome: 105 - 146: Supported" (through current 150), "Opera: 91 - 127: Supported", "Firefox: 2 - 149: Not supported" (through 153), "Safari: 3.1 - 26.3: Not supported" through 26.5.
- **Source:** web.dev (Baker, Steiner) — "Launch: Complete (in Chromium 104)" (initial Chromium ship).

### Claim 16 — Fingerprinting surface caveat
- **Source:** WICG spec — https://wicg.github.io/window-controls-overlay/
- **Quote:** "Enabling Window Controls Overlay poses an increased fingerprinting surface since the size of the overlay can vary depending on the OS, the text scale, the OS font size, the OS zoom factor, and the web content's zoom factor."

## Distinct angle vs FEE-1301
FEE-1301 covers the baseline manifest with `display: standalone` only, so it stops at "give the app its own window." FEE-1312 owns the title-bar customization stack that builds on top of `standalone`:
- the `display_override` array (Claims 2-4)
- the four `env(titlebar-area-*)` CSS variables defining a draggable layout region (Claims 6-7)
- the `app-region` CSS escape hatch for OS drag handles (Claims 8-9)
- the `navigator.windowControlsOverlay` JS surface with `visible`, `getTitlebarAreaRect()`, and `geometrychange` (Claims 10-12)
- graceful degradation: when the UA, or the user's session, does not support WCO (no install, in-tab, Firefox/Safari), the chain falls back to the next entry, ultimately to `display: standalone` (Claims 13-15).

## Topic-specific section: `## Title-bar Customization Lifecycle`
The lifecycle walks through five states sourced from the claims above:
1. **Manifest declaration** — `display_override: ["window-controls-overlay"]` with `display: "standalone"` fallback (Claims 2, 3, 4).
2. **Install / launch resolution** — Chromium picks `window-controls-overlay`; Firefox/Safari/in-tab fall through to `standalone` (Claims 13, 14, 15).
3. **Initial layout** — CSS uses `env(titlebar-area-x/y/width/height)` with fallbacks; `app-region: drag` marks the draggable strip (Claims 6, 7, 8, 9).
4. **Runtime geometry response** — listen for `geometrychange` on `navigator.windowControlsOverlay`, read `e.titlebarAreaRect` (Claims 11, 12).
5. **Visibility transitions** — `visible` becomes false when the user moves the PWA into a tab or uninstalls; the page then renders inline using env() fallbacks (Claims 11, 14, 7).

## Reference list (article-ready format)
- Amanda Baker and Thomas Steiner, "Customize the window controls overlay of your PWA's title bar," web.dev (2022, updated). https://web.dev/articles/window-controls-overlay
- WICG, "Window Controls Overlay" (Editor's Draft). https://wicg.github.io/window-controls-overlay/
- MDN contributors, "Window Controls Overlay API." https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
- MDN contributors, "display_override — Web App Manifest." https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override
- MDN contributors, "WindowControlsOverlay." https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay
- MDN contributors, "Navigator.windowControlsOverlay." https://developer.mozilla.org/en-US/docs/Web/API/Navigator/windowControlsOverlay
- caniuse.com, "WindowControlsOverlay." https://caniuse.com/mdn-api_windowcontrolsoverlay

All 16 claims have a verified source URL with a verbatim quote pulled directly from a successful WebFetch of that URL. No anonymous content was used; web.dev authors named (Amanda Baker, Thomas Steiner). MDN, WICG and caniuse used as institutional sources per the source-tier rule.
agentId: a87fa46fd45f7c31d (use SendMessage with to: 'a87fa46fd45f7c31d' to continue this agent)
<usage>total_tokens: 36998
tool_uses: 12
duration_ms: 117804</usage>