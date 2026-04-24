---
topic: HTML Sanitizer API (setHTML vs setHTMLUnsafe vs innerHTML)
id: 115
slug: html-sanitizer-api
sources_reviewed: 13
claims: 18
---

# Findings: HTML Sanitizer API

**Proposed topic-specific section:** `## Failure Modes & What Sanitization Does Not Cover`.

## Claims

### Claim 1

- **Text:** HTML Sanitizer API filters unwanted elements, attributes, and comments when inserting HTML strings into DOM/shadow DOM.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
- **Pulled quote:** "The HTML Sanitizer API allows developers to take strings of HTML and filter out unwanted elements, attributes, and other HTML entities when they are inserted into the DOM or a shadow DOM."

### Claim 2

- **Text:** Three entry points with distinct contracts: `innerHTML` (no sanitization), `setHTMLUnsafe()` (parses, no sanitization by default, Sanitizer-aware), `setHTML()` (sanitizes against default XSS-safe allowlist).
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe
- **Pulled quote:** "`setHTMLUnsafe()` doesn't perform any sanitization by default. If no sanitizer is passed as a parameter, all HTML entities in the input will be injected."

### Claim 3

- **Text:** `setHTML()` is positioned as a drop-in replacement for `innerHTML` for user-provided input.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- **Pulled quote:** "The `setHTML()` method of the Element interface provides an XSS-safe method to parse and sanitize a string of HTML and insert it into the DOM as a subtree of the element. It is recommended (if supported) as a drop-in replacement for `Element.innerHTML` when setting a user-provided string of HTML."

### Claim 4

- **Text:** Safe methods always strip XSS-unsafe constructs even if a custom sanitizer allows them: `<script>`, `<frame>`, `<iframe>`, `<embed>`, `<object>`, `<use>`, event-handler attributes.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- **Pulled quote:** "The method removes any elements and attributes that are considered XSS-unsafe, even if allowed by a passed sanitizer. Notably, the following elements are always removed: `<script>`, `<frame>`, `<iframe>`, `<embed>`, `<object>`, `<use>`, and event handler attributes."

### Claim 5

- **Text:** Default sanitizer goes beyond XSS-safe: removes clickjacking/spoofing vectors, HTML comments, and `data-*` attributes.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration
- **Pulled quote:** "This configuration removes the following sorts of items: 1. Those that are known to be XSS-unsafe... 2. Additional items that might be used in clickjacking, spoofing, or other attacks. 3. Comments and `data-*` attributes."

### Claim 6

- **Text:** `Sanitizer` is constructed from a `SanitizerConfig` dictionary with keys `elements`, `attributes`, `removeElements`, `removeAttributes`, `replaceWithChildrenElements`, `comments`, `dataAttributes`.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig
- **Pulled quote:** "An array indicating the elements to allow when sanitizing HTML, optionally also specifying their allowed or removed attributes..."

### Claim 7

- **Text:** Allow-lists and remove-lists are mutually exclusive on the same dimension in one config.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
- **Pulled quote:** "You may not specify both allow and remove arrays for elements or attributes in the same configuration, but other combinations of fields are allowed."

### Claim 8

- **Text:** `setHTMLUnsafe()` exists so that HTML fragments with `<template shadowrootmode>` actually parse into shadow roots — `innerHTML` silently drops declarative shadow DOM.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe
- **Pulled quote:** "Unlike with `Element.innerHTML`, declarative shadow roots in the input will be parsed into the DOM."

### Claim 9

- **Text:** If a shadow host has multiple declarative shadow roots, only the first becomes a `ShadowRoot`; subsequent ones parse as `<template>`.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe
- **Pulled quote:** "If the string of HTML defines more than one declarative shadow root in a particular shadow host then only the first ShadowRoot is created — subsequent declarations are parsed as `<template>` elements within that shadow root."

### Claim 10

- **Text:** The API was reduced from return-a-string to `Element.setHTML()` to eliminate the double-parsing mXSS hazard where sanitized output is re-parsed by `innerHTML`.
- **Target section:** Design Thinking
- **Source URL:** https://frederikbraun.de/why-sethtml.html
- **Pulled quote:** "The core feature of the Sanitizer API is actually just `Element.setHTML(input)`... No superfluous parsing. No ambiguous contexts. Just setting HTML."

### Claim 11

- **Text:** HTML parsing is context-sensitive — same string parses differently inside `<table>` vs `<div>`. The Sanitizer parses once, in context.
- **Target section:** Design Thinking
- **Source URL:** https://frederikbraun.de/why-sethtml.html
- **Pulled quote:** "HTML parsing can be quite context-sensitive: How an input string will be interpreted depends on the current node it is being inserted into."

### Claim 12

- **Text:** Sanitizer is complementary to — not a replacement for — strict CSP + Trusted Types.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/articles/strict-csp
- **Pulled quote:** "CSP is a defense-in-depth technique that can prevent the execution of malicious scripts, but it's not a substitute for avoiding and promptly fixing XSS bugs."

### Claim 13

- **Text:** Browser support as of April 2026: Chrome/Edge 146, Firefox 148 (Feb 2026); Safari not yet.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://caniuse.com/mdn-api_sanitizer
- **Pulled quote:** "Chrome: ✅ 146: Supported... Edge: ✅ 146: Supported... Firefox: ✅ 148 - 149: Supported... Safari: All listed versions display ❌ Not supported."

### Claim 14

- **Text:** MDN marks the API as Limited Availability — not Baseline — because of missing Safari support.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- **Pulled quote:** "Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers."

### Claim 15

- **Text:** Recommended fallback: Mozilla's `sanitizer-polyfill` (DOMPurify-backed shim) behind a feature check on `Element.prototype.setHTML`.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://github.com/mozilla/sanitizer-polyfill
- **Pulled quote:** "rewrite constructor arguments, call DOMPurify, profit"

### Claim 16

- **Text:** DOMPurify has been the ecosystem solution — DOM-only XSS sanitizer for HTML/MathML/SVG; its string-returning shape is exactly what the native API replaces.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/cure53/DOMPurify
- **Pulled quote:** "DOMPurify is a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML and SVG."

### Claim 17

- **Text:** Typical use cases: Markdown-rendered HTML, WYSIWYG paste handling, untrusted email previews.
- **Target section:** Example
- **Source URL:** https://wicg.github.io/sanitizer-api/
- **Pulled quote:** "Web applications often need to work with strings of HTML on the client side, perhaps as part of a client-side templating solution, perhaps as part of rendering user generated content, etc."

### Claim 18

- **Text:** `sanitizer.removeUnsafe()` or passing a custom sanitizer only removes XSS-unsafe items — the additional clickjacking/spoofing items, comments, and data-attributes filtered by the default config are NOT automatically removed.
- **Target section:** Failure Modes & What Sanitization Does Not Cover
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration
- **Pulled quote:** "Calling `Sanitizer.removeUnsafe()`, or passing a custom sanitizer to the safe sanitization method, only removes the XSS-unsafe items. It does not remove the additional items, comments, and `data-*` attributes."

## Reference URLs

- https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
- https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe
- https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer
- https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig
- https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration
- https://wicg.github.io/sanitizer-api/
- https://frederikbraun.de/why-sethtml.html
- https://github.com/cure53/DOMPurify
- https://github.com/mozilla/sanitizer-polyfill
- https://caniuse.com/mdn-api_sanitizer
- https://web.dev/articles/strict-csp

## Research notes

- Script-executing URL schemes are blocked because the elements that would carry them are stripped; no standalone `javascript:` filter.
- `dataAttributes: true` is mutually exclusive with listing `data-*` in `attributes`.
- Frederik Braun is Mozilla engineer on the spec — tier-3 attributed source.
- Failure-Modes topic-specific section counters the silver-bullet misconception.
