---
id: 109
title: Scroll-to-Text Fragment (URL Text Directives)
state: draft
slug: scroll-to-text-fragment
category: HTML and Semantic Markup
level: mid
---

# [FEE-109] Scroll-to-Text Fragment (URL Text Directives)

:::info
A text fragment is a URL suffix that tells the browser to scroll to a specific passage of a page and highlight it, without any markup on the target page. The feature ships as a WICG specification and has reached Chrome, Firefox, and Safari, which lets authors deep-link into articles, specs, and reference material that they do not control. This article covers the directive grammar, authoring constraints, the `::target-text` pseudo-element, and the accessibility gap that still constrains the feature.
:::

## Context

A traditional URL fragment (`#section-id`) can only target an `id` that the author of the document has placed in the HTML. The scroll-to-text-fragment specification introduces a new URL component, the **fragment directive**, delimited by `:~:`. MDN records the contract directly: "`:~:` Otherwise known as _the fragment directive_, this sequence of characters tells the browser that what comes next is one or more user-agent instructions, which are stripped from the URL during loading so that author scripts cannot directly interact with them."

The only directive currently defined is `text=`. Its grammar is `#:~:text=[prefix-,]textStart[,textEnd][,-suffix]`, where `textStart` is required and `textEnd`, `prefix-`, and `-suffix` are optional disambiguators used when the start string alone is ambiguous. Because the directive lives after `:~:`, the browser removes it from `location.hash` before scripts run, which keeps the mechanism out of reach of page JavaScript.

There is no browser-agnostic JavaScript API for generating text fragments. Authors rely on the "Link to Text Fragment" browser extension for Chrome, Edge, Firefox, and Safari, or on first-party UI: Chrome's right-click "Copy link to highlight" and Safari 18.2's "Copy Link with Highlight" context-menu entry.

## Visual

| Form | URL fragment | When to use |
| --- | --- | --- |
| `textStart` only | `#:~:text=quick%20brown%20fox` | The passage is unique in the document. |
| `textStart,textEnd` | `#:~:text=quick%20brown,lazy%20dog` | Highlight a range; only the start and end need to be named. |
| `prefix-,textStart` | `#:~:text=the-,quick%20brown%20fox` | The same phrase appears more than once; `prefix-` disambiguates. |
| `textStart,-suffix` | `#:~:text=fox,-jumps` | Disambiguate by what follows the phrase. |
| Fully bounded | `#:~:text=the-,quick%20brown,lazy%20dog,-jumps` | Range match that needs both sides disambiguated. |
| Multiple directives | `#:~:text=first&text=second` | Highlight several non-contiguous passages in one navigation. |

## Example

A canonical link to the MDN page for text fragments, targeting the phrase "fragment directive":

```
https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments#:~:text=fragment%20directive
```

A bounded range, using `textStart,textEnd`:

```
https://example.com/article#:~:text=Once%20upon,happily%20ever%20after
```

Disambiguating with `prefix-` and `-suffix` when the start string appears multiple times:

```
https://example.com/docs#:~:text=install-,the%20CLI,-globally
```

A URL with two directives, highlighting two passages in the same navigation:

```
https://example.com/post#:~:text=first%20highlight&text=second%20highlight
```

Restyling the highlight with `::target-text`. The user-agent default is `:root::target-text { color: MarkText; background: Mark; }`; authors can override it:

```css
::target-text {
  background-color: #fff3a3;
  color: #111;
}
```

`::target-text` is a highlight pseudo-element, so only a narrow set of non-layout-affecting properties apply (colors, text decoration, text shadow). Properties that would reflow the document are rejected.

## Best Practices

- **MUST** percent-encode every parameter value, and escape `-`, `&`, and `,` so the browser does not read them as directive grammar. web.dev notes: "The values for all parameters need to be percent-encoded. This is especially important for the dash `-`, ampersand `&`, and comma `,` characters."
- **MUST** open cross-origin links that carry a text fragment in a `noopener` context. Per MDN: "you should open the link in a `noopener` context — you need to add `rel=\"noopener\"` to your `<a>` elements, and add `noopener` to your `window.open()` calls when using this feature."
- **MUST** treat the directive as best-effort. When the string fails to match or the browser does not support text fragments, "the whole text fragment is ignored and the top of the document is linked," so the link MUST still be useful without the scroll.
- **SHOULD** feature-detect with `document.fragmentDirective` before advertising a copy-link-to-highlight control. Firefox 131 release notes confirm the surface: "Developers can now also use the existence of the `Document.fragmentDirective` property (an instance of the `FragmentDirective` interface) to feature-check for text fragment support."
- **SHOULD** link to the document top or a stable `id` anchor as the primary target, and let `:~:text=` refine the position. This keeps links working in older Safari, in iframes, and in programmatic navigations.
- **MAY** emit multiple `text=` directives joined with `&` when highlighting related passages matters more than a single anchor position.
- **MUST NOT** rely on the directive inside an iframe or on programmatic navigations. web.dev: "Text fragment directives are invoked only on full (non-same-page) navigations that are the result of a user activation. ... Text fragment directives are only applied to the main frame."

## Design Thinking

The `:~:` delimiter was picked so that the fragment directive could coexist with traditional `#anchor` fragments and with any future directives the WICG decides to add. The spec is explicit about the room: "The only directive introduced in this spec is the text directive but others could be added in the future." The choice has two consequences worth naming.

First, the directive is stripped from `location.hash` before author scripts see it. That isolation prevents scripts from overriding or observing what the user agent is told to do, which is what makes `noopener` a hard requirement for cross-origin navigations rather than a hint.

Second, because the grammar reserves space for future directives, authors should treat `:~:text=...` as the only stable form. Custom tooling that parses the fragment for its own purposes has to skip the directive block.

## Deep Dive

**Match semantics.** Matching is case-insensitive. Each of `textStart`, `textEnd`, `prefix-`, and `-suffix` must live inside a single block-level element, though the overall `textStart,textEnd` range can cross block boundaries. That rule is why a directive copied from a rendered paragraph can fail once the target page re-wraps the content across `<li>` or `<p>` tags; the start string no longer fits in one block.

**Accessibility gap.** The WICG issue tracker records the state plainly: "For accessibility, at a minimum, browsers need to notify accessibility APIs of the node to which the page has scrolled. However, there are significant accessibility challenges with the feature. There is no way for an assistive technology user to perceive the exact text which is visually highlighted — they only know about the node in which the text begins." Screen-reader users therefore learn that the page scrolled into a container, without learning which run of text inside that container is highlighted. Focus handling after the scroll is not standardized across engines, which means keyboard users land in different places depending on the browser.

## Browser Support Matrix

| Engine | First shipped | Consumer support | Built-in author UI | `::target-text` styling |
| --- | --- | --- | --- | --- |
| Chromium (Chrome, Edge) | Chrome 80, February 2020 | Yes | "Copy link to highlight" context menu | Yes |
| Gecko (Firefox) | Firefox 131, 1 October 2024 | Yes; `document.fragmentDirective` exposed for feature detection | No first-party generator; extension-only | Yes |
| WebKit (Safari) | Safari 18.2, 11 December 2024 | Yes | "Copy Link with Highlight" context menu, per WebKit's 18.2 release note: "choose 'Copy Link with Highlight' from the context menu. ... the browser will scroll the text fragment into view, and mark it with a persistent highlight." | Yes |

All three engines honor the silent-fallback rule from MDN, so a link written today will degrade to a top-of-document navigation in any environment that predates these versions. Use `document.fragmentDirective` to decide whether to expose a "copy link to highlight" control of your own.

## Related Topics

- [hidden="until-found" and the beforematch Event](/en/HTML%20and%20Semantic%20Markup/hidden-until-found-and-beforematch)
- [HTML APIs & Progressive Enhancement](/en/HTML%20and%20Semantic%20Markup/106)

## References

- MDN Web Docs, "Text fragments," Mozilla. https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- WICG, "Scroll To Text Fragment" (Editor's Draft). https://wicg.github.io/scroll-to-text-fragment/
- Thomas Steiner, "Boldly link where no one has linked before: Text Fragments," web.dev (2020). https://web.dev/articles/text-fragments
- MDN Web Docs, "::target-text," Mozilla. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::target-text
- Mozilla, "Firefox 131 for developers," MDN. https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/131
- Jen Simmons et al., "WebKit Features in Safari 18.2," WebKit Blog (2024). https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- WICG, "Accessibility of text fragments (issue #142)," GitHub. https://github.com/WICG/scroll-to-text-fragment/issues/142
