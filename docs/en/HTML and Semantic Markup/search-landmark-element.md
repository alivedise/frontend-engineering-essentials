---
id: 112
title: "The `<search>` Landmark Element"
state: draft
slug: search-landmark-element
category: HTML and Semantic Markup
level: mid
---

# [FEE-112] The `<search>` Landmark Element

:::info
The `<search>` element is an HTML container that semantically marks regions of a page dedicated to search or filtering functionality. Added to the HTML Living Standard on 24 March 2023, it carries an implicit ARIA role of `search` without any explicit attributes. Baseline Widely available support landed in October 2023, meaning every modern landmark that once required ARIA now has a native HTML counterpart. Use it to wrap global site search, faceted filter panels, and in-page find-a-location forms so assistive technology can expose them through landmark navigation.
:::

## Context

The HTML Living Standard defines the element as follows: "The search element represents a part of a document or application that contains a set of form controls or other content related to performing a search or filtering operation." That scope covers both search forms and filter UIs, so the name does not restrict usage to a single keyword-query pattern.

Per the ARIA in HTML specification, `<search>` carries an implicit role of `search`, which is a landmark role. No `role` attribute is required to produce the landmark in the accessibility tree.

Before March 2023 the only way to expose a search landmark was to add `role="search"` to a `<form>` or `<div>` wrapper. Scott O'Hara's write-up on the addition summarised the milestone: "With the addition of `search`, now every ARIA landmark has a native HTML equivalent." WebKit shipped the element first, noting in the Safari 17 beta post: "We are excited to be the first browser to ship this new `<search>` element, now supported in Safari 17.0." Firefox 118 and Chromium 118 followed in October 2023.

MDN records the current interoperability state as: "Baseline Widely available. This feature is well established and works across many devices and browser versions. It's been available across browsers since October 2023." That October 2023 date is the Baseline crossover for the element.

## Visual

| Landmark | Implicit role | When to use |
| --- | --- | --- |
| `<header>` | `banner` (when a direct child of `<body>`) | Site-wide masthead, logo, primary navigation shell |
| `<nav>` | `navigation` | Groups of links for site or in-page navigation |
| `<main>` | `main` | The primary content of the document, including search results |
| `<aside>` | `complementary` | Tangentially related content such as sidebars or pull quotes |
| `<footer>` | `contentinfo` (when a direct child of `<body>`) | Site-wide footer information |
| `<form role="search">` | `search` (via explicit ARIA) | Legacy pattern for search-specific forms before `<search>` existed |
| `<search>` | `search` | A region containing search inputs, filters, suggestion lists, or quick-search links |

Screen readers including JAWS, NVDA, and VoiceOver expose the landmark through the browser's accessibility API, as they already did for `role="search"`: "expose the search landmark in the browser's accessibility API, allowing people using assistive technology...to discover this content area."

## Example

A site with both a global header search and a section-scoped product filter uses two `<search>` landmarks on the same page.

```html
<header>
  <a href="/">Acme</a>
  <search aria-label="Sitewide">
    <form action="/search" role="search">
      <label for="global-q">Search articles</label>
      <input id="global-q" name="q" type="search" />
      <button type="submit">Go</button>
    </form>
  </search>
</header>

<main>
  <h1>Climbing shoes</h1>

  <search aria-label="Product filters">
    <form action="/shoes" method="get">
      <fieldset>
        <legend>Filter shoes</legend>
        <label for="brand">Brand</label>
        <select id="brand" name="brand">
          <option value="">Any</option>
          <option value="scarpa">Scarpa</option>
          <option value="la-sportiva">La Sportiva</option>
        </select>

        <label for="size">Size</label>
        <input id="size" name="size" type="number" min="35" max="48" />

        <button type="submit">Apply filters</button>
      </fieldset>
    </form>
  </search>

  <section aria-label="Results">
    <!-- Search and filter results live in main content, not inside <search>. -->
  </section>
</main>
```

`<search>` is a grouping landmark only; it does not submit data. A nested `<form>` handles submission, matching the HTML spec's own example: `<search><form action="search.php"><label for="query">Find an article</label><input id="query" name="q" type="search"><button type="submit">Go!</button></form></search>`.

## Best Practices

- **MUST** place search results in the main content area, not inside `<search>`. MDN states: "The `<search>` element is not for presenting search results. Rather, search or filtered results should be presented as part of the main content of that web page."
- **MUST** give each `<search>` landmark a unique accessible name via `aria-label` or `aria-labelledby` when more than one exists on a page. The ARIA Authoring Practices Guide requires: "If a page includes more than one `search` landmark, each should have a unique label."
- **SHOULD** omit the word "search" from the accessible name to avoid double-announcement. MDN's role reference recommends: "avoid labels like `aria-label=\"Sitewide search\"` which would announce as 'sitewide search search'. Use just `aria-label=\"Sitewide\"` instead."
- **SHOULD** prefer the semantic `<search>` element over `role="search"` when starting new markup: "If possible, prefer using the semantic `<search>` element instead of the `search` role."
- **SHOULD** nest suggestion lists, autocomplete dropdowns, and quick-search links inside `<search>`: "suggestions and links that are part of 'quick search' functionality within the search or filtering functionality are appropriately nested within the contents of the `<search>` element."
- **MAY** retain `role="search"` on an existing `<form>` instead of wrapping it in a new `<search>` element. MDN notes: "If your `<input>` of type `search` is already contained within a `<form>`, then wrapping the form in another `<search>` element may be unnecessary markup." That pattern stays acceptable when extra nesting would add no structure.

## Scope Patterns

`<search>` is not scoped to a single site-wide search box. MDN frames the scope broadly: "The search or filtering functionality can be for the website or application, the current web page or document, or the entire Internet or subsection thereof." Three scope tiers map onto typical UIs:

1. **Site-wide search.** A `<search>` in `<header>` wrapping the global query form. One per page is the common case.
2. **Section-scoped filter.** A `<search>` around the filter panel on a product list, search results page, or documentation index. The landmark covers facets, sliders, date ranges, and sort controls that narrow the visible dataset.
3. **Third-party scope.** A `<search>` around a form that queries an external corpus (for example, a site that searches a government dataset or a federated archive).

A page may carry more than one `<search>` landmark when the scopes differ. MDN's own example demonstrates the pattern: "This example demonstrates a page with two search features. The first is a global site search located on the header. The second is a search and filter based on the page context."

**Labelling strategy when multiple landmarks exist:**

- Name each landmark by the dataset or region it searches, not by the verb `search`. Useful values include `aria-label="Sitewide"`, `aria-label="Product filters"`, `aria-label="Knowledge base"`, or `aria-labelledby` pointing at an existing visible heading.
- Keep the labels distinct across landmarks on the same page. `aria-label="Search"` applied to both a header search and a product filter leaves assistive technology users unable to distinguish them in the landmark list.
- When a visible heading already names the filter region (for example, `<h2 id="filters">Filter shoes</h2>`), reuse it with `aria-labelledby="filters"` so visible and accessible names stay in sync.

A useful heuristic: if a region would be announced as "filtering" or "narrowing" rather than "reading," it belongs inside a `<search>` landmark.

## Related Topics

- [Semantic Elements & Accessibility](/en/HTML%20and%20Semantic%20Markup/102)
- [Forms & Validation](/en/HTML%20and%20Semantic%20Markup/103)

## References

- WHATWG, "The search element," HTML Living Standard. https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element
- MDN, "`<search>`: The generic search element." https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- MDN, "ARIA: search role." https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role
- W3C WAI, "Search Landmark Example," ARIA Authoring Practices Guide. https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
- W3C, "ARIA in HTML: `<search>`." https://w3c.github.io/html-aria/#el-search
- Scott O'Hara, "The search element," scottohara.me (2023). https://www.scottohara.me/blog/2023/03/24/search-element.html
- WebKit, "News from WWDC23: Web Features in Safari 17 beta" (2023). https://webkit.org/blog/14445/news-from-wwdc23-web-features-in-safari-17-beta/
