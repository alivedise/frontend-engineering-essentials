---
topic: hidden="until-found" and the beforematch Event
id: 110
slug: hidden-until-found-and-beforematch
sources_reviewed: 7
claims: 16
---

# Findings: hidden="until-found" and the beforematch Event

**Proposed topic-specific section:** `## Reveal Timing Model`.

## Claims

### Claim 1

- **Text:** The `hidden` attribute is enumerated with two keyword states — Hidden and Hidden Until Found. Empty/missing/invalid values default to Hidden.
- **Target section:** Context
- **Source URL:** https://html.spec.whatwg.org/multipage/interaction.html
- **Pulled quote:** "The missing value default is the Not Hidden state, while invalid and empty value defaults both map to the Hidden state."

### Claim 2

- **Text:** Hidden content is not rendered; Hidden Until Found content is not rendered either but is reachable by find-in-page and fragment navigation.
- **Target section:** Context
- **Source URL:** https://html.spec.whatwg.org/multipage/interaction.html
- **Pulled quote:** "`until-found` / Hidden Until Found — Will not be rendered, but content inside will be accessible to find-in-page and fragment navigation."

### Claim 3

- **Text:** When find-in-page or fragment navigation targets Hidden Until Found content, the browser fires `beforematch`, removes `hidden`, and scrolls — in that order.
- **Target section:** Reveal Timing Model
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- **Pulled quote:** "When these features cause a scroll to an element in a _hidden until found_ subtree, the browser will: 1. Fire a `beforematch` event on the hidden element 2. Remove the `hidden` attribute from the element 3. Scroll to the element"

### Claim 4

- **Text:** Browsers implement the Hidden Until Found state using `content-visibility: hidden` instead of `display: none`, so the element still participates in layout.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- **Pulled quote:** "Browsers typically implement _hidden until found_ using `content-visibility: hidden`. This means that, unlike elements in the _hidden_ state, elements in the _hidden until-found_ state generate boxes, and: they participate in page layout; their margin, borders, padding, and background are rendered"

### Claim 5

- **Text:** The element must be affected by layout containment to be revealable — `display: none`, `contents`, or `inline` breaks the reveal.
- **Target section:** Reveal Timing Model
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- **Pulled quote:** "If the element in the _hidden until found_ state has a `display` value of `none`, `contents`, or `inline`, then the element will not be revealed by 'Find in page' or fragment navigation."

### Claim 6

- **Text:** `beforematch` is a generic `Event` that fires on a Hidden Until Found element just before reveal.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event
- **Pulled quote:** "An element receives a `beforematch` event when it is in the _hidden until found_ state and the browser is about to reveal its content because the user has found the content through the 'find in page' feature or through fragment navigation."

### Claim 7

- **Text:** `beforematch` bubbles, so ancestor listeners can observe descendant reveals.
- **Target section:** Deep Dive
- **Source URL:** https://html.spec.whatwg.org/multipage/interaction.html
- **Pulled quote:** "Fire an event named `beforematch` at ancestorToReveal with the `bubbles` attribute initialized to true"

### Claim 8

- **Text:** A Hidden Until Found element may be the target of a link (`href="#id"`), because fragment navigation is a sanctioned reveal trigger.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- **Pulled quote:** "Hidden elements shouldn't be linked from visible elements unless using `hidden=\"until-found\"`."

### Claim 9

- **Text:** Developers MUST provide an alternate reveal mechanism without relying on find-in-page.
- **Target section:** Best Practices
- **Source URL:** https://developer.chrome.com/docs/css-ui/hidden-until-found
- **Pulled quote:** "The `hidden=until-found` content should be revealable without the use of find-in-page"

### Claim 10

- **Text:** Feature-detect with `'onbeforematch' in HTMLElement.prototype`.
- **Target section:** Best Practices
- **Source URL:** https://developer.chrome.com/docs/css-ui/hidden-until-found
- **Pulled quote:** "if (!('onbeforematch' in HTMLElement.prototype)) { // expand all hidden content }"

### Claim 11

- **Text:** Because `content-visibility: hidden` keeps the container's box, borders/padding/background still paint — place decorations on a nested child if they should hide while collapsed.
- **Target section:** Best Practices
- **Source URL:** https://developer.chrome.com/docs/css-ui/hidden-until-found
- **Pulled quote:** "Add the border to an element nested inside the container that has `hidden=until-found`"

### Claim 12

- **Text:** Chromium shipped in Chrome 102 (2022); Firefox 139; Safari 26.2.
- **Target section:** Reveal Timing Model (support block)
- **Source URL:** https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- **Pulled quote:** "Safari 26.2 adds support for the `hidden=\"until-found\"` attribute."

### Claim 13

- **Text:** Firefox bug 1761043 resolved FIXED against Firefox 139.
- **Target section:** Reveal Timing Model (support block)
- **Source URL:** https://bugzilla.mozilla.org/show_bug.cgi?id=1761043
- **Pulled quote:** "resolved and fixed, with Firefox 139 Branch designated as the target milestone."

### Claim 14

- **Text:** `<details>`/`<summary>` also enables find-in-page reveal since Interop 2025 applied `content-visibility: hidden` to `::details-content`, narrowing the unique value of `hidden="until-found"` to custom toggle UX.
- **Target section:** Related Topics
- **Source URL:** https://css-tricks.com/covering-hiddenuntil-found/
- **Pulled quote:** "browsers apply `content-visibility: hidden` to the `::details-content` portion, enabling in-page search—the same benefit as `hidden=\"until-found\"`."

### Claim 15

- **Text:** `beforematch` is the hook for animating a reveal, lazy-loading content, or updating analytics immediately before the container becomes visible.
- **Target section:** Example
- **Source URL:** https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- **Pulled quote:** "allows you to run JavaScript to prepare the content, update analytics, or perform other actions before the hidden content becomes visible to the user."

### Claim 16

- **Text:** Scripts in hidden elements still execute and forms still submit — `hidden="until-found"` is not a security boundary.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- **Pulled quote:** "elements that are descendants of a hidden element are still active, which means that script elements can still execute, and form elements can still submit"

## Reference URLs

- https://html.spec.whatwg.org/multipage/interaction.html
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event
- https://developer.chrome.com/docs/css-ui/hidden-until-found
- https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- https://bugzilla.mozilla.org/show_bug.cgi?id=1761043
- https://css-tricks.com/covering-hiddenuntil-found/

## Research notes

- Reveal Timing Model unifies the three-step sequence + layout-containment precondition + bubbling.
- `<details>` overlap: prefer `<details>` when built-in disclosure is acceptable; use `hidden="until-found"` for custom toggle UX.
- `scrollIntoView()` on a descendant: works in Chromium via the ancestor-revealing algorithm; no explicit verbatim quote — frame as "fragment navigation and find-in-page are the sanctioned triggers".
