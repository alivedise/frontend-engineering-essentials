---
id: 114
title: "Virtual Keyboard UX — `inputmode`, `enterkeyhint`, and Plaintext Editing"
state: draft
slug: virtual-keyboard-ux
category: HTML and Semantic Markup
level: mid
---

# [FEE-114] Virtual Keyboard UX: inputmode, enterkeyhint, and Plaintext Editing

:::info
Mobile users type into your forms through an on-screen keyboard whose layout and Enter-key label are decided by the browser. HTML exposes four hints that steer that decision: `inputmode`, `enterkeyhint`, `autocapitalize`, and `contenteditable="plaintext-only"`. This article maps each attribute to what it actually controls, where Baseline support stands as of 2026, and why these hints complement — but do not replace — correct `type`, `<label>`, and ARIA semantics.
:::

## Context

`inputmode` is a presentational hint. MDN states that "the `inputmode` attribute doesn't cause any validity requirements to be enforced on input" ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)). Setting `inputmode="numeric"` makes the OS render a digits pad, but the field will still accept pasted letters unless a `pattern` or `type` constraint also applies. The attribute exists because `type="number"` carries validation, spinners, and locale parsing that many real-world fields (credit-card numbers, OTPs, postal codes) do not want.

`enterkeyhint` works on the same principle for the Enter key. The attribute relabels Enter with one of `enter`, `done`, `go`, `next`, `previous`, `search`, or `send` ([MDN `enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)). Combined with `autocapitalize` (which governs shift-state on the virtual keyboard) and `contenteditable="plaintext-only"` (which strips rich formatting on paste), these four attributes cover the bulk of mobile-input polish that used to require JavaScript heuristics.

## Visual

| Attribute | What it controls | Accepted values | Affects AT? | Physical keyboard effect |
|---|---|---|---|---|
| `inputmode` | Virtual keyboard layout | `none`, `text`, `tel`, `url`, `email`, `numeric`, `decimal`, `search` | No | None |
| `enterkeyhint` | Enter-key label/icon | `enter`, `done`, `go`, `next`, `previous`, `search`, `send` | No | None |
| `contenteditable="plaintext-only"` | Editable region; strips formatting on paste | `plaintext-only` (vs `true`/`false`) | Yes (region becomes editable) | Applies to all input paths |
| `autocapitalize` | Shift-state on virtual keyboard | `none`, `sentences`, `words`, `characters`, `on`, `off` | No | None |
| VirtualKeyboard API | Opt out of auto viewport resize; expose keyboard rect | `navigator.virtualKeyboard.overlaysContent`, `geometrychange` event, `env(keyboard-inset-*)` | No | None |

## Example

### Numeric pads: `numeric` vs `decimal`

The two values produce different keypads. MDN describes `decimal` as a "Fractional numeric input keyboard containing the digits and decimal separator for the user's locale (typically . or ,)" and `numeric` as a "Numeric input keyboard, but only requires the digits 0–9" ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)).

```html
<!-- One-time passcode: only digits. -->
<label for="otp">One-time code</label>
<input id="otp" name="otp" type="text" inputmode="numeric"
       pattern="[0-9]*" autocomplete="one-time-code" maxlength="6" />

<!-- Price in USD or EUR: needs the locale decimal separator. -->
<label for="price">Price</label>
<input id="price" name="price" type="text" inputmode="decimal" />
```

### Multi-field form with `enterkeyhint`

```html
<form id="signup">
  <label for="given">First name</label>
  <input id="given" name="given" type="text" enterkeyhint="next" autocapitalize="words" />

  <label for="family">Last name</label>
  <input id="family" name="family" type="text" enterkeyhint="next" autocapitalize="words" />

  <label for="email">Email</label>
  <input id="email" name="email" type="email" enterkeyhint="done" />

  <button type="submit">Create account</button>
</form>
```

The Enter key on the first two inputs carries a forward-pointing label; on the last it reads "Done" (or an OS-equivalent icon). Moving focus on Enter still requires JavaScript — the attribute changes the label only (covered in Deep Dive).

### Chat composer with `plaintext-only`

```html
<div
  id="composer"
  role="textbox"
  aria-label="Message"
  aria-multiline="true"
  contenteditable="plaintext-only"
  enterkeyhint="send"></div>
<button type="button" id="send">Send</button>
```

Pasting a formatted block into this div strips inline styles and tags, yielding plain text, while the element still grows with content. MDN contrasts the two values: "If content is pasted into an element with `contenteditable=\"true\"`, all formatting is retained. If content is pasted into an element with `contenteditable=\"plaintext-only\"`, all formatting is removed." ([MDN `contenteditable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable))

## Best Practices

- **MUST** pick `inputmode="decimal"` for currency and quantity fields that accept fractions. Per MDN, `numeric` omits the decimal separator, leaving users no path to type `12.50` on iOS ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)).
- **MUST NOT** treat `inputmode` as validation. "The `inputmode` attribute doesn't cause any validity requirements to be enforced on input" ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)). Pair it with `pattern`, `minlength`/`maxlength`, or server-side checks.
- **MUST** keep `<label>`, correct `type`, and ARIA roles in place. web.dev frames `inputmode` and `type` as complementary: "with appropriate form elements and the correct `inputmode` or `type`, an on-screen keyboard shows appropriate characters" ([web.dev Forms a11y](https://web.dev/learn/forms/accessibility)). These hints are not surfaced to assistive technology, so they cannot substitute for labeling.
- **SHOULD** use `inputmode` with `type="text"` when a field semantically holds an email/URL/search but cannot accept the corresponding `type`'s validation or default UI. web.dev: "Using `inputmode` is a good option if you want to keep the default user interface and the default validation rules of an `<input>`, but still want an optimized on-screen keyboard." ([web.dev Forms attributes](https://web.dev/learn/forms/attributes))
- **SHOULD** set `autocapitalize` explicitly on free-form text fields. Defaults differ across browsers (Deep Dive), and the attribute is ignored on `type="url"`, `type="email"`, and `type="password"` regardless of the value you set ([MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)).
- **MAY** use `inputmode="none"` when your page renders its own in-page keypad (for example, a signature or PIN pad) and wants the OS keyboard suppressed ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)).

## Deep Dive

### `enterkeyhint` relabels, it does not navigate

The attribute changes the Enter key's glyph only. Chris Coyier observes, "if you put in `next` or `previous` that doesn't change the behavior at all — you'd have to code that yourself" ([CSS-Tricks enterkeyhint](https://css-tricks.com/enterkeyhint/)). To move focus to the next field when the user taps "Next", listen for Enter/keydown and call `.focus()` on the next form control explicitly.

### Android renders icons, iOS renders text

The same attribute surfaces differently per OS. CSS-Tricks documents: "On Android the action button doesn't just always turn into text, but uses icons. So for the value `send`, you get a little paper airplane icon rather than the 'send' label." ([CSS-Tricks enterkeyhint](https://css-tricks.com/enterkeyhint/)) iOS renders localized text ("Done", "Listo", "完了"). Design your form around the semantic intent rather than a specific glyph, and test on both platforms before shipping.

### `autocapitalize` browser defaults

Defaults are not uniform. MDN: "Chrome and Safari default to `on`/`sentences`. Firefox defaults to `off`/`none`." ([MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)) A name field that works correctly on Chrome (capitalizing the first letter of each word when you set `autocapitalize="words"`) may feel inconsistent on Firefox if you rely on an implicit default elsewhere. Set the value you want on every relevant field.

Physical keyboards bypass this attribute entirely: "`autocapitalize` doesn't affect behavior when typing on a physical keyboard" ([MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)). It is also hard-coded off on `type="url"`, `type="email"`, and `type="password"`.

### VirtualKeyboard API: reflowing around the keyboard

By default the browser resizes the visual viewport when the virtual keyboard appears. The VirtualKeyboard API flips this: set `navigator.virtualKeyboard.overlaysContent = true` and the keyboard becomes an overlay, exposing its rectangle via the `env(keyboard-inset-height)` and `env(keyboard-inset-top)` CSS environment variables plus a `geometrychange` event. The Chrome docs note, "Whenever the virtual keyboard appears or disappears, the `geometrychange` event is dispatched." ([Chrome VirtualKeyboard](https://developer.chrome.com/docs/web-platform/virtual-keyboard))

Support is limited. MDN lists the API as "Limited availability - This feature is not Baseline because it does not work in some of the most widely-used browsers" ([MDN VirtualKeyboard API](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API)). Treat it as progressive enhancement: feature-detect `'virtualKeyboard' in navigator` and fall back to the default resize behavior on Safari and Firefox.

## Attribute Compatibility Matrix

| Feature | Baseline status | Shipped | Engine coverage | Notes |
|---|---|---|---|---|
| `inputmode` | Widely available | Since Dec 2021 | Blink, WebKit, Gecko | "It's been available across browsers since December 2021" ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode); [caniuse](https://caniuse.com/input-inputmode)). Safe default. |
| `enterkeyhint` | Widely available | Since Nov 2021 | Blink, WebKit, Gecko | "It's been available across browsers since November 2021" ([MDN `enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)). Label only — behavior stays in JS. |
| `autocapitalize` | Widely available | — | Blink, WebKit, Gecko | Chrome/Safari default to `sentences`; Firefox defaults to `none` ([MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)). Ignored on physical keyboards and on `url`/`email`/`password` types. |
| `contenteditable="plaintext-only"` | Newly available | 4 Mar 2025 (Firefox 136) | Blink, WebKit, Gecko | "The contenteditable 'plaintext-only' attribute value combination is now Baseline Newly available" ([web.dev blog](https://web.dev/blog/contenteditable-plaintext-only-baseline); [caniuse](https://caniuse.com/mdn-html_global_attributes_contenteditable_plaintext-only)). Supply a fallback to `contenteditable="true"` + paste sanitation for older versions. |
| VirtualKeyboard API | Limited availability | Chrome/Edge 94 | Blink only | Not in Safari or Firefox ([MDN VirtualKeyboard API](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API)). Feature-detect and enhance. |

Specific values worth pinning down:

- `inputmode="tel"` renders "a telephone keypad input, including the digits 0–9, the asterisk (*), and the pound (#) key" ([MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)).
- `inputmode="none"` suppresses the OS keyboard for pages that ship their own input surface (same source).
- `enterkeyhint="done"` signals "there is nothing more to input and the input method editor (IME) will be closed" ([MDN `enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)).

## Related Topics

- [Forms & Validation](/en/HTML%20and%20Semantic%20Markup/103)
- [HTML APIs & Progressive Enhancement](/en/HTML%20and%20Semantic%20Markup/106)

## References

- MDN contributors, "inputmode," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- MDN contributors, "enterkeyhint," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint
- MDN contributors, "contenteditable," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
- MDN contributors, "autocapitalize," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize
- MDN contributors, "VirtualKeyboard API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
- web.dev, "contenteditable plaintext-only is Baseline Newly available" (2025). https://web.dev/blog/contenteditable-plaintext-only-baseline
- web.dev Learn Forms, "Form attributes." https://web.dev/learn/forms/attributes
- web.dev Learn Forms, "Form accessibility." https://web.dev/learn/forms/accessibility
- Chrome for Developers, "VirtualKeyboard API." https://developer.chrome.com/docs/web-platform/virtual-keyboard
- Chris Coyier, "The `enterkeyhint` attribute," CSS-Tricks. https://css-tricks.com/enterkeyhint/
