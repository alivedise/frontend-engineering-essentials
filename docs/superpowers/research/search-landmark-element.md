---
topic: The `<search>` Landmark Element
id: 112
slug: search-landmark-element
sources_reviewed: 7
claims: 16
---

# Findings: The `<search>` Landmark Element

**Proposed topic-specific section:** `## Scope Patterns (site-wide vs section-scoped)`.

## Claims

### Claim 1

- **Text:** `<search>` is an HTML container that semantically marks parts of a page containing search or filtering functionality.
- **Target section:** Context
- **Source URL:** https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element
- **Pulled quote:** "The search element represents a part of a document or application that contains a set of form controls or other content related to performing a search or filtering operation."

### Claim 2

- **Text:** Implicit ARIA role is `search` — a landmark role — without any ARIA attributes.
- **Target section:** Context
- **Source URL:** https://w3c.github.io/html-aria/#el-search
- **Pulled quote:** "Implicit Role: role=[search]"

### Claim 3

- **Text:** Added to HTML spec on 24 March 2023; every ARIA landmark now has a native HTML equivalent.
- **Target section:** Context
- **Source URL:** https://www.scottohara.me/blog/2023/03/24/search-element.html
- **Pulled quote:** "With the addition of `search`, now every ARIA landmark has a native HTML equivalent."

### Claim 4

- **Text:** Safari 17 shipped first (mid-September 2023), then Firefox 118 and Chrome/Edge 118 in October 2023. Baseline Widely available as of October 2023.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- **Pulled quote:** "Baseline Widely available. This feature is well established and works across many devices and browser versions. It's been available across browsers since October 2023."

### Claim 5

- **Text:** WebKit was first to ship; landed in Safari 17.0 per WWDC23.
- **Target section:** Context
- **Source URL:** https://webkit.org/blog/14445/news-from-wwdc23-web-features-in-safari-17-beta/
- **Pulled quote:** "We are excited to be the first browser to ship this new `<search>` element, now supported in Safari 17.0."

### Claim 6

- **Text:** `<search>` is a grouping landmark — not for search results; results belong in main content.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- **Pulled quote:** "The `<search>` element is not for presenting search results. Rather, search or filtered results should be presented as part of the main content of that web page."

### Claim 7

- **Text:** Suggestion lists, autocomplete dropdowns, and quick-search links belong inside `<search>`.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- **Pulled quote:** "suggestions and links that are part of 'quick search' functionality within the search or filtering functionality are appropriately nested within the contents of the `<search>` element"

### Claim 8

- **Text:** Beyond site-wide search — filter panels, "find a location" forms, faceted filters all qualify.
- **Target section:** Scope Patterns (site-wide vs section-scoped)
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- **Pulled quote:** "The search or filtering functionality can be for the website or application, the current web page or document, or the entire Internet or subsection thereof."

### Claim 9

- **Text:** A page may contain multiple `<search>` landmarks (global header search + contextual filter).
- **Target section:** Scope Patterns (site-wide vs section-scoped)
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- **Pulled quote:** "This example demonstrates a page with two search features. The first is a global site search located on the header. The second is a search and filter based on the page context"

### Claim 10

- **Text:** When multiple search landmarks exist, each MUST carry a unique accessible name via `aria-label`/`aria-labelledby`.
- **Target section:** Best Practices
- **Source URL:** https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
- **Pulled quote:** "If a page includes more than one `search` landmark, each should have a unique label."

### Claim 11

- **Text:** Labels should omit the word "search" — screen readers already announce the landmark type.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role
- **Pulled quote:** "avoid labels like `aria-label=\"Sitewide search\"` which would announce as 'sitewide search search'. Use just `aria-label=\"Sitewide\"` instead."

### Claim 12

- **Text:** `<search>` removes the need for `role="search"` on `<form>` or `<div>` wrappers.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- **Pulled quote:** "The `<search>` element defines a search landmark. This removes the need for adding role=search to a `<form>` element."

### Claim 13

- **Text:** Prefer the semantic element over the ARIA role.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role
- **Pulled quote:** "If possible, prefer using the semantic `<search>` element instead of the `search` role."

### Claim 14

- **Text:** `<search>` is a grouping landmark — does not submit data; inner `<form>` handles submission.
- **Target section:** Example
- **Source URL:** https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element
- **Pulled quote:** "`<search><form action=\"search.php\"><label for=\"query\">Find an article</label><input id=\"query\" name=\"q\" type=\"search\"><button type=\"submit\">Go!</button></form></search>`"

### Claim 15

- **Text:** Screen readers (JAWS, NVDA, VoiceOver) expose `<search>` through landmark-navigation like they did for `role="search"`.
- **Target section:** Visual
- **Source URL:** https://www.scottohara.me/blog/2023/03/24/search-element.html
- **Pulled quote:** "expose the search landmark in the browser's accessibility API, allowing people using assistive technology...to discover this content area"

### Claim 16

- **Text:** If `<input type="search">` is already inside `<form>`, wrapping the form in `<search>` may be redundant — `role="search"` on the `<form>` itself is still acceptable.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role
- **Pulled quote:** "If your `<input>` of type `search` is already contained within a `<form>`, then wrapping the form in another `<search>` element may be unnecessary markup."

## Reference URLs

- https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role
- https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
- https://w3c.github.io/html-aria/#el-search
- https://www.scottohara.me/blog/2023/03/24/search-element.html
- https://webkit.org/blog/14445/news-from-wwdc23-web-features-in-safari-17-beta/

## Research notes

- Scope-patterns angle unifies the whole-site vs section-scoped claims.
- `html-aria` allows `role="form"/"group"/"none"/"presentation"/"region"` overrides; marks `role="search"` as redundant with the implicit role.
