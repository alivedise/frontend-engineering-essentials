---
topic: Scroll-to-Text Fragment (URL Text Directives)
id: 109
slug: scroll-to-text-fragment
sources_reviewed: 8
claims: 15
---

# Findings: Scroll-to-Text Fragment (URL Text Directives)

## Claims

### Claim 1

- **Text:** A text fragment is a URL fragment directive delimited by `:~:` that instructs the user agent to scroll to and highlight a specific passage of the rendered document.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- **Pulled quote:** "`:~:` Otherwise known as _the fragment directive_, this sequence of characters tells the browser that what comes next is one or more user-agent instructions, which are stripped from the URL during loading so that author scripts cannot directly interact with them."

### Claim 2

- **Text:** The full text-directive grammar is `#:~:text=[prefix-,]textStart[,textEnd][,-suffix]`, with `textStart` required and `textEnd`, `prefix-`, and `-suffix` optional disambiguators.
- **Target section:** Directive Syntax by Case
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- **Pulled quote:** "url: `https://example.com#:~:text=[prefix-,]textStart[,textEnd][,-suffix]` ... `textStart` A text string specifying the start of the linked text. `textEnd` Optional - A text string specifying the end of the linked text. `prefix-` Optional ... `-suffix` Optional ..."

### Claim 3

- **Text:** Text-directive parameters must be percent-encoded, and the dash, ampersand, and comma characters must be escaped so they are not read as grammar delimiters.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/articles/text-fragments
- **Pulled quote:** "The values for all parameters need to be percent-encoded. This is especially important for the dash `-`, ampersand `&`, and comma `,` characters, so they are not being interpreted as part of the text directive syntax."

### Claim 4

- **Text:** A single URL can carry multiple text directives joined with `&`, and the browser highlights each match.
- **Target section:** Directive Syntax by Case
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- **Pulled quote:** "Note that it is possible to specify multiple text fragments to highlight in the same URL by separating them with ampersand (`&`) characters."

### Claim 5

- **Text:** Text fragments are invoked only on full, user-activated navigations and are not processed inside iframes.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/articles/text-fragments
- **Pulled quote:** "Text fragment directives are invoked only on full (non-same-page) navigations that are the result of a user activation. ... Text fragment directives are only applied to the main frame."

### Claim 6

- **Text:** Cross-origin navigations that carry a text fragment must occur in a `noopener` context, so authors should add `rel="noopener"` to links and pass `noopener` to `window.open()`.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- **Pulled quote:** "For security reasons, when linking to a cross-origin page using this feature, you should open the link in a `noopener` context — you need to add `rel=\"noopener\"` to your `<a>` elements, and add `noopener` to your `window.open()` calls when using this feature."

### Claim 7

- **Text:** The fragment directive is extensible: `text=` is the only directive defined today, but the delimiter reserves space for future user-agent instructions.
- **Target section:** Deep Dive
- **Source URL:** https://wicg.github.io/scroll-to-text-fragment/
- **Pulled quote:** "The only directive introduced in this spec is the text directive but others could be added in the future."

### Claim 8

- **Text:** Match lookups are case-insensitive, and each of `textStart`, `textEnd`, `prefix-`, and `-suffix` must live inside a single block-level element, though the overall match can span block boundaries.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- **Pulled quote:** "Matches are case-insensitive. ... Individual `textStart`, `textEnd`, `prefix-`, and `-suffix` strings need to reside wholly inside the same block-level element, but complete matches can span across multiple element boundaries."

### Claim 9

- **Text:** When the text fragment cannot be matched or the browser lacks support, the directive is silently ignored and the browser loads the document from the top.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- **Pulled quote:** "If the provided text fragment does not match any text in the linked document, or if the browser does not support text fragments, the whole text fragment is ignored and the top of the document is linked."

### Claim 10

- **Text:** Authors can restyle the highlight with the `::target-text` pseudo-element, whose user-agent default is `:root::target-text { color: MarkText; background: Mark; }`.
- **Target section:** Example
- **Source URL:** https://web.dev/articles/text-fragments
- **Pulled quote:** "The user-agent stylesheet contains CSS that looks like this: `:root::target-text { color: MarkText; background: Mark; }`"

### Claim 11

- **Text:** `::target-text` is a highlight pseudo-element and only supports a narrow slice of non-layout-affecting properties.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/::target-text
- **Pulled quote:** "The `::target-text` CSS pseudo-element represents the text that has been scrolled to if the browser supports text fragments. It allows authors to choose how to highlight that section of text."

### Claim 12

- **Text:** Scripts can feature-detect text-fragment support by checking for `document.fragmentDirective`, a `FragmentDirective` instance.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/131
- **Pulled quote:** "Developers can now also use the existence of the `Document.fragmentDirective` property (an instance of the `FragmentDirective` interface) to feature-check for text fragment support."

### Claim 13

- **Text:** Chrome 80 shipped the feature in February 2020, Firefox 131 followed on 1 October 2024, and Safari 18.2 landed on 11 December 2024 with a first-party "Copy Link with Highlight" context-menu entry.
- **Target section:** Browser Support Matrix
- **Source URL:** https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- **Pulled quote:** "First, go to a web page and highlight the text you want to target with your link. Then choose \"Copy Link with Highlight\" from the context menu. ... When a user navigates to the URL, the browser will scroll the text fragment into view, and mark it with a persistent highlight."

### Claim 14

- **Text:** The specification has no browser-agnostic JavaScript generator; author tooling relies on extensions such as the "Link to Text Fragment" add-on, and only Chrome and Safari ship built-in UI for producing these links.
- **Target section:** Context
- **Source URL:** https://web.dev/articles/text-fragments
- **Pulled quote:** "Link to Text Fragment browser extension (available for Chrome, Edge, Firefox, and Safari) for automatic URL generation."

### Claim 15

- **Text:** Assistive technology only learns of the node containing the first match, not the exact highlighted run, and focus handling after scroll is still inconsistent across engines.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/WICG/scroll-to-text-fragment/issues/142
- **Pulled quote:** "For accessibility, at a minimum, browsers need to notify accessibility APIs of the node to which the page has scrolled. However, there are significant accessibility challenges with the feature. There is no way for an assistive technology user to perceive the exact text which is visually highlighted—they only know about the node in which the text begins."

## Reference URLs

- https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- https://wicg.github.io/scroll-to-text-fragment/
- https://web.dev/articles/text-fragments
- https://developer.mozilla.org/en-US/docs/Web/CSS/::target-text
- https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/131
- https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- https://caniuse.com/url-scroll-to-text-fragment
- https://github.com/WICG/scroll-to-text-fragment/issues/142

## Rejected sources

- developer.chrome.com/blog/text-fragments — 404
- Wikipedia, PCWorld, ghacks — not tier-appropriate
- CSS-Tricks almanac, personal blogs — superseded by MDN

## Research notes

- **Proposed topic-specific section: "Browser Support Matrix"**. Asymmetric rollout + `::target-text` Baseline timing + feature-detection via `document.fragmentDirective` all cluster naturally here.
- Safari 18.2 (Dec 2024) shipped the context-menu UI and `::target-text` styling; earlier Safari had partial support per caniuse.
- Generator logic lives in extensions + Chrome/Safari context menu; no JS API.
- WICG #142 is the a11y gap record; tier-4 but defensible as the standards-discussion primary source.
