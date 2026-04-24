---
topic: Virtual Keyboard UX (inputmode, enterkeyhint, contenteditable="plaintext-only")
id: 114
slug: virtual-keyboard-ux
sources_reviewed: 12
claims: 17
---

# Findings: Virtual Keyboard UX

**Proposed topic-specific section:** `## Attribute Compatibility Matrix`.

## Claims

### Claim 1

- **Text:** `inputmode` hints which virtual keyboard layout to render; it does NOT enforce validity.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- **Pulled quote:** "It's important to understand that the `inputmode` attribute doesn't cause any validity requirements to be enforced on input."

### Claim 2

- **Text:** `inputmode` is Baseline Widely available since December 2021.
- **Target section:** Attribute Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- **Pulled quote:** "It's been available across browsers since December 2021."

### Claim 3

- **Text:** `inputmode="numeric"` = digits-only pad; `inputmode="decimal"` = digits + locale decimal separator.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- **Pulled quote:** "`decimal`: Fractional numeric input keyboard containing the digits and decimal separator for the user's locale (typically . or ,). Devices may or may not show a minus key (-). `numeric`: Numeric input keyboard, but only requires the digits 0–9."

### Claim 4

- **Text:** `inputmode="tel"` = telephone keypad with `*` and `#`; `inputmode="none"` = suppress OS keyboard when the page provides its own input UI.
- **Target section:** Attribute Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- **Pulled quote:** "`tel`: A telephone keypad input, including the digits 0–9, the asterisk (*), and the pound (#) key. ... `none`: No virtual keyboard."

### Claim 5

- **Text:** When a field semantically holds an email/URL/search but can't use `type="email"`/`type="url"`/`type="search"` (validation/styling), use `inputmode` with `type="text"` for the optimized keyboard.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/learn/forms/attributes
- **Pulled quote:** "the `inputmode` attribute only changes the on-screen keyboard provided, not the behavior of the element itself. ... Using `inputmode` is a good option if you want to keep the default user interface and the default validation rules of an `<input>`, but still want an optimized on-screen keyboard."

### Claim 6

- **Text:** `enterkeyhint` relabels Enter with `enter`, `done`, `go`, `next`, `previous`, `search`, `send`.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint
- **Pulled quote:** "`enterkeyhint=\"done\"`: Typically meaning there is nothing more to input and the input method editor (IME) will be closed."

### Claim 7

- **Text:** `enterkeyhint` changes only the label; navigation ("next", "previous") still needs JavaScript.
- **Target section:** Deep Dive
- **Source URL:** https://css-tricks.com/enterkeyhint/
- **Pulled quote:** "if you put in `next` or `previous` that doesn't change the behavior at all—you'd have to code that yourself."

### Claim 8

- **Text:** Android renders icons (paper-plane for `send`); iOS renders localized text labels.
- **Target section:** Deep Dive
- **Source URL:** https://css-tricks.com/enterkeyhint/
- **Pulled quote:** "On Android the action button doesn't just always turn into text, but uses icons. So for the value `send`, you get a little paper airplane icon rather than the 'send' label."

### Claim 9

- **Text:** `enterkeyhint` Baseline Widely available since November 2021.
- **Target section:** Attribute Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint
- **Pulled quote:** "It's been available across browsers since November 2021."

### Claim 10

- **Text:** `contenteditable="plaintext-only"` strips rich formatting on paste while keeping the region editable.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
- **Pulled quote:** "If content is pasted into an element with `contenteditable=\"true\"`, all formatting is retained. If content is pasted into an element with `contenteditable=\"plaintext-only\"`, all formatting is removed."

### Claim 11

- **Text:** `contenteditable="plaintext-only"` reached Baseline Newly available on 4 March 2025 when Firefox 136 shipped.
- **Target section:** Attribute Compatibility Matrix
- **Source URL:** https://web.dev/blog/contenteditable-plaintext-only-baseline
- **Pulled quote:** "The contenteditable 'plaintext-only' attribute value combination is now Baseline Newly available"

### Claim 12

- **Text:** Vs `<textarea>`: a `contenteditable="plaintext-only"` element auto-grows without scroll-sync hacks and is compatible with the CSS Custom Highlight API (which doesn't reach textarea shadow DOM).
- **Target section:** Design Thinking
- **Source URL:** https://web.dev/blog/contenteditable-plaintext-only-baseline
- **Pulled quote:** "growing the `<textarea>` dynamically with the content without resolving to hacks" and that the CSS Custom Highlight API works with contenteditable divs but not textareas "since they use shadow DOM internally."

### Claim 13

- **Text:** `autocapitalize` governs virtual-keyboard auto-capitalization only. Ignored on hardware keyboards. Hard-coded off on `type="url"`/`type="email"`/`type="password"`.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize
- **Pulled quote:** "`autocapitalize` doesn't affect behavior when typing on a physical keyboard. ... `autocapitalize` has no effect on the `url`, `email`, or `password` `<input>` types, where autocapitalization is never enabled."

### Claim 14

- **Text:** Chrome/Safari default `autocapitalize` to `sentences`; Firefox defaults to `none`.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize
- **Pulled quote:** "Chrome and Safari default to `on`/`sentences`. Firefox defaults to `off`/`none`."

### Claim 15

- **Text:** VirtualKeyboard API (`navigator.virtualKeyboard.overlaysContent = true` + `env(keyboard-inset-height)`) lets a page opt out of auto-viewport-resize and reflow around the keyboard rectangle.
- **Target section:** Deep Dive
- **Source URL:** https://developer.chrome.com/docs/web-platform/virtual-keyboard
- **Pulled quote:** "Whenever the virtual keyboard appears or disappears, the `geometrychange` event is dispatched."

### Claim 16

- **Text:** VirtualKeyboard API: Chromium 94+ only. Not supported in Safari or Firefox. Must be progressive enhancement.
- **Target section:** Attribute Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
- **Pulled quote:** "Limited availability - This feature is not Baseline because it does not work in some of the most widely-used browsers."

### Claim 17

- **Text:** `inputmode` and `enterkeyhint` are pure UX hints, not exposed via the accessibility tree. Cannot replace correct `type`, `<label>`, and ARIA.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/learn/forms/accessibility
- **Pulled quote:** "with appropriate form elements and the correct `inputmode` or `type`, an on-screen keyboard shows appropriate characters."

## Reference URLs

- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize
- https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
- https://web.dev/blog/contenteditable-plaintext-only-baseline
- https://web.dev/learn/forms/attributes
- https://web.dev/learn/forms/accessibility
- https://developer.chrome.com/docs/web-platform/virtual-keyboard
- https://css-tricks.com/enterkeyhint/
- https://caniuse.com/mdn-html_global_attributes_contenteditable_plaintext-only
- https://caniuse.com/input-inputmode

## Research notes

- Baseline statuses: `inputmode` since Dec 2021 (Widely). `enterkeyhint` since Nov 2021 (Widely). `contenteditable="plaintext-only"` Newly available 4 Mar 2025.
- VirtualKeyboard API is Deep-Dive-level; Chromium-only.
- `autocapitalize` defaults differ by browser; worth explicit setting for deterministic UX.
- Frame a11y as "these are presentational hints; correct `type`, `<label>`, ARIA remain load-bearing."
