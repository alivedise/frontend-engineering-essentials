---
id: 115
title: "HTML Sanitizer API — `setHTML()` vs `setHTMLUnsafe()` vs `innerHTML`"
state: draft
slug: html-sanitizer-api
category: HTML and Semantic Markup
level: senior
reviewed: tone
reviewed_on: 2026-07-27
---

# [FEE-115] HTML Sanitizer API — setHTML() vs setHTMLUnsafe() vs innerHTML

:::info
The HTML Sanitizer API introduces two element methods, `setHTML()` and `setHTMLUnsafe()`, that sit alongside `innerHTML` and formalize how HTML strings become DOM subtrees. `setHTML()` parses a string and filters it through an XSS-safe allowlist in a single step; `setHTMLUnsafe()` parses without sanitization but supports declarative shadow DOM and accepts a `Sanitizer`. `innerHTML` remains the legacy setter that neither sanitizes nor parses declarative shadow roots. For senior engineers who render user-generated HTML, the takeaway is that `setHTML()` is the designated drop-in for `innerHTML` on untrusted input, and browser support as of April 2026 covers Chrome, Edge, and Firefox but not Safari.
:::

## Context

The HTML Sanitizer API allows developers to take strings of HTML and filter out unwanted elements, attributes, and other HTML entities when inserting them into the DOM or a shadow DOM ([MDN HTML Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)). Three entry points now cover the string-to-DOM boundary with distinct contracts:

- `Element.innerHTML` parses the string into the host element, performs no sanitization, and silently drops declarative shadow roots.
- `Element.setHTMLUnsafe(input, options?)` parses the string and does not perform sanitization by default; if no sanitizer is passed, all HTML entities in the input will be injected ([MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe)). It also parses `<template shadowrootmode>` into actual shadow roots.
- `Element.setHTML(input, options?)` parses and sanitizes the string in one step against an XSS-safe allowlist.

The `Unsafe` variant exists because `innerHTML` silently drops declarative shadow DOM: unlike with `Element.innerHTML`, declarative shadow roots in the input will be parsed into the DOM when using `setHTMLUnsafe()` ([MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe)). Server-rendered components that ship `<template shadowrootmode="open">` markup require this behavior, which is why the platform split the parser from the sanitizer at the API surface.

## Visual

| Method | Parses declarative shadow DOM? | Sanitizes by default? | XSS-unsafe elements stripped? |
| --- | --- | --- | --- |
| `innerHTML` | No | No | No |
| `setHTMLUnsafe()` | Yes | No (default); configurable via `Sanitizer` | Only if caller opts into a sanitizer |
| `setHTML()` | Yes | Yes (XSS-safe allowlist) | Yes, always — even with a custom config |

## Example

### `setHTML()` replacing `innerHTML` for a Markdown renderer

```js
import { marked } from "marked";

const source = await fetch("/comments/42.md").then((r) => r.text());
const html = marked.parse(source);

const target = document.querySelector("#comment-body");

// Before: XSS-prone
// target.innerHTML = html;

// After: one-step parse + XSS-safe sanitize
if (target.setHTML) {
  target.setHTML(html);
} else {
  // See Best Practices for the polyfill path.
  target.innerHTML = window.DOMPurify.sanitize(html);
}
```

### `setHTMLUnsafe()` for a trusted template with declarative shadow roots

```html
<div id="card-host"></div>

<script>
  const trustedTemplate = `
    <template shadowrootmode="open">
      <style>:host { display: block; padding: 1rem; }</style>
      <slot></slot>
    </template>
    <h2>Hello, world</h2>
  `;

  // innerHTML would drop the <template shadowrootmode>; setHTMLUnsafe does not.
  document.getElementById("card-host").setHTMLUnsafe(trustedTemplate);
</script>
```

### Custom `SanitizerConfig` with `elements` and `removeAttributes`

```js
const config = {
  elements: [
    "p",
    "strong",
    "em",
    "code",
    "pre",
    { name: "a", attributes: ["href", "rel", "target"] },
  ],
  removeAttributes: ["style"],
  comments: false,
};

document.querySelector("#preview").setHTML(userMarkup, { sanitizer: config });
```

`SanitizerConfig` accepts `elements`, `attributes`, `removeElements`, `removeAttributes`, `replaceWithChildrenElements`, `comments`, and `dataAttributes` ([MDN SanitizerConfig](https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig)). Typical deployments include Markdown-rendered HTML, WYSIWYG paste handling, and untrusted email previews ([WICG Sanitizer API](https://wicg.github.io/sanitizer-api/)).

## Best Practices

- **MUST** use `setHTML()` instead of `innerHTML` whenever the HTML string originates from user input, network content, or any source outside the trust boundary. The `setHTML()` method provides an XSS-safe way to parse and sanitize HTML and is recommended as a drop-in replacement for `Element.innerHTML` when setting a user-provided string of HTML ([MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML)).
- **MUST** keep a strict Content Security Policy in place alongside the Sanitizer API. CSP is a defense-in-depth technique that can prevent the execution of malicious scripts, and it is not a substitute for avoiding and promptly fixing XSS bugs ([web.dev strict CSP](https://web.dev/articles/strict-csp)).
- **SHOULD** feature-detect with `"setHTML" in Element.prototype` before using it, because browser support is not yet universal (see Failure Modes).
- **SHOULD** install a polyfill fallback for non-supporting browsers. Mozilla's `sanitizer-polyfill` rewrites constructor arguments and calls DOMPurify under the hood ([mozilla/sanitizer-polyfill](https://github.com/mozilla/sanitizer-polyfill)); DOMPurify itself is a DOM-only, XSS sanitizer for HTML, MathML, and SVG ([cure53/DOMPurify](https://github.com/cure53/DOMPurify)).
- **SHOULD** reserve `setHTMLUnsafe()` for markup you author or control, for example server-rendered components that ship declarative shadow roots.
- **MAY** layer a custom `SanitizerConfig` on top of `setHTML()` when the default allowlist is too narrow (for instance, if the product needs `data-*` attributes preserved).

## Design Thinking

Early drafts of the Sanitizer API returned a sanitized string from a `Sanitizer.sanitize()` method. That shape forced the caller to round-trip the output through `innerHTML`, which re-parses the markup. HTML parsing is context-sensitive: how an input string will be interpreted depends on the current node it is being inserted into ([Frederik Braun, "Why setHTML?"](https://frederikbraun.de/why-sethtml.html)). A string sanitized in one context and re-parsed in another can mutate into something the sanitizer would have rejected; this is the mutation XSS (mXSS) class of bug. The spec authors collapsed sanitize-then-assign into a single element method so that the parser runs once, in the target's context, under the sanitizer's control: "The core feature of the Sanitizer API is actually just `Element.setHTML(input)`… No superfluous parsing. No ambiguous contexts. Just setting HTML." ([Frederik Braun, "Why setHTML?"](https://frederikbraun.de/why-sethtml.html)).

The userland precedent is DOMPurify, a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML, and SVG ([cure53/DOMPurify](https://github.com/cure53/DOMPurify)). DOMPurify's `sanitize()` returns a string and thus carries the same double-parse risk the native API now avoids. The platform adopted DOMPurify's allowlist philosophy while dropping the string-returning shape, and the recommended polyfill for the native API delegates to DOMPurify behind a `Sanitizer`-shaped façade ([mozilla/sanitizer-polyfill](https://github.com/mozilla/sanitizer-polyfill)).

## Deep Dive

`setHTMLUnsafe()` has a subtle rule for hosts that declare multiple declarative shadow roots. If the string of HTML defines more than one declarative shadow root in a particular shadow host, only the first `ShadowRoot` is created, and subsequent declarations are parsed as `<template>` elements within that shadow root ([MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe)). A hydration pipeline that accidentally emits two `<template shadowrootmode="open">` children under the same host will silently demote the second to a nested `<template>` instead of throwing. Teams that generate server-rendered components from multiple sources should dedupe shadow roots during emission, because debugging a "missing shadow root" after the fact requires inspecting the DOM tree rather than the input string.

## Failure Modes & What Sanitization Does Not Cover

The Sanitizer API raises the floor for DOM injection safety, and it is worth naming the corners it does not round off.

**Always-stripped elements even under a custom config.** The safe method removes any elements and attributes that are considered XSS-unsafe, even if allowed by a passed sanitizer. Notably, the following elements are always removed: `<script>`, `<frame>`, `<iframe>`, `<embed>`, `<object>`, `<use>`, and event handler attributes ([MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML)). A config that lists `<iframe>` under `elements` will still drop it. Script-executing URL schemes are not filtered directly either; they get neutralized because the elements that would carry them are stripped.

**The default sanitizer goes further than XSS-safe.** The default configuration removes items that are known to be XSS-unsafe, additional items that might be used in clickjacking, spoofing, or other attacks, and comments and `data-*` attributes ([MDN default sanitizer configuration](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration)). Product surfaces that rely on `data-*` hooks for analytics or hydration will see those attributes vanish under the default config.

**`removeUnsafe()` is not the default config.** Calling `Sanitizer.removeUnsafe()`, or passing a custom sanitizer to the safe sanitization method, only removes the XSS-unsafe items. It does not remove the additional items, comments, and `data-*` attributes ([MDN default sanitizer configuration](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration)). Treating `removeUnsafe()` as equivalent to the default allowlist will leave clickjacking and spoofing vectors in place.

**Allow-lists and remove-lists are mutually exclusive per dimension.** Specifying both `elements` and `removeElements` in one configuration (or both `attributes` and `removeAttributes`) is rejected; other combinations of fields are allowed ([MDN HTML Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)). Teams migrating a nuanced DOMPurify config should pick one model per dimension before translating.

**Browser support as of April 2026.** Chrome 146 and Edge 146 ship the API, and Firefox added support in 148 (February 2026). Safari has no supported version in the Can I Use matrix ([Can I Use mdn-api_sanitizer](https://caniuse.com/mdn-api_sanitizer)). MDN labels the feature as Limited Availability, explicitly noting that it is not Baseline because it does not work in some of the most widely-used browsers ([MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML)). Production code targeting Safari users MUST feature-detect and fall back to `sanitizer-polyfill` or DOMPurify ([mozilla/sanitizer-polyfill](https://github.com/mozilla/sanitizer-polyfill)).

## Related Topics

- [HTML Security Attributes](/en/HTML%20and%20Semantic%20Markup/108)
- [Web Components & Custom Elements](/en/HTML%20and%20Semantic%20Markup/105)

## References

- MDN, "HTML Sanitizer API." https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
- MDN, "Element: setHTML() method." https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- MDN, "Element: setHTMLUnsafe() method." https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe
- MDN, "Sanitizer." https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer
- MDN, "SanitizerConfig." https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig
- MDN, "Default sanitizer configuration." https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration
- WICG, "HTML Sanitizer API (Editor's Draft)." https://wicg.github.io/sanitizer-api/
- Frederik Braun, "Why setHTML?" https://frederikbraun.de/why-sethtml.html
- cure53, "DOMPurify." https://github.com/cure53/DOMPurify
- Mozilla, "sanitizer-polyfill." https://github.com/mozilla/sanitizer-polyfill
- web.dev, "Mitigate cross-site scripting (XSS) with a strict Content Security Policy." https://web.dev/articles/strict-csp
