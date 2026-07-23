# Findings: Stacking Contexts, Paint Order & the Top Layer

**Generated:** 2026-07-24
**Target article:** FEE-211 — stacking-contexts-paint-order-top-layer
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** A stacking context is a three-dimensional conceptualization of elements along an imaginary z-axis, and elements inside one stacking context are stacked independently from elements outside it.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context
- **Pulled quote:** "Stacking context is a three-dimensional conceptualization of HTML elements along an imaginary z-axis relative to the user, who is assumed to be facing the viewport or the webpage. Elements within a stacking context are stacked independently from elements outside of that stacking context, ensuring elements in one stacking context don't interfere with the stacking order of anything in another."

### Claim 2

- **Text:** The classic "z-index: 9999 doesn't work" failure happens because a z-index value has meaning only within the element's parent stacking context, so no value can lift a descendant above a sibling of its stacking-context ancestor.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context
- **Pulled quote:** "Importantly, the z-index values of its child stacking contexts only have meaning within its parent's stacking context."

### Claim 3

- **Text:** A stacking context is created by a long enumerable set of conditions, including the root element, positioned elements with non-auto z-index, fixed/sticky positioning, flex or grid items with non-auto z-index, opacity below 1, non-normal mix-blend-mode, transform/filter/backdrop-filter/perspective/clip-path/mask, isolation: isolate, qualifying will-change values, contain: layout or paint, container-type size/inline-size, top-layer elements, and forwards-filling keyframe animations of such properties.
- **Target section:** Visual
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context
- **Pulled quote:** "A stacking context is formed, anywhere in the document, by any element in the following scenarios: Root element of the document (`<html>`). Element with a `position` value `absolute` or `relative` and `z-index` value other than `auto`."

### Claim 4

- **Text:** Within a stacking context, painting proceeds back to front in a fixed order: backgrounds and borders, then negative z-index stacking contexts, then in-flow block-level content, then floats, then inline content, then z-index auto/0 positioned descendants, then positive z-index stacking contexts.
- **Target section:** Visual
- **Source URL:** https://www.w3.org/TR/CSS2/zindex.html
- **Pulled quote:** "Stacking contexts formed by positioned descendants with negative z-indices (excluding 0) in z-index order (most negative first) then tree order. [...] Stacking contexts formed by positioned descendants with z-indices greater than or equal to 1 in z-index order (smallest first) then tree order."

### Claim 5

- **Text:** The top layer is a browser-managed layer spanning the full viewport that sits above every other layer of the document, and it is what a modal dialog opened with HTMLDialogElement.showModal() renders into.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Glossary/Top_layer
- **Pulled quote:** "The top layer is a specific layer that spans the entire width and height of the viewport and sits on top of all other layers displayed in a web document. It is created by the browser to contain elements that should appear on top of all other content on the page."

### Claim 6

- **Text:** The isolation property exists specifically to create a stacking context on demand, and MDN calls out its pairing with mix-blend-mode and z-index, since isolating a group prevents its blend modes from compositing against content behind the group.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/isolation
- **Pulled quote:** "The isolation CSS property determines whether an element must create a new stacking context. This property is especially helpful when used in conjunction with mix-blend-mode and z-index."

### Claim 7

- **Text:** Teams MUST prefer native top-layer APIs (dialog.showModal(), the Popover API, fullscreen) over z-index escalation for overlays, because a modal dialog appears above all other content with zero stacking CSS.
- **Target section:** Best Practices
- **Source URL:** https://developer.chrome.com/blog/what-is-the-top-layer
- **Pulled quote:** "You don't need to apply any styles to the `<dialog>` to make it appear above all other content."

### Claim 8

- **Text:** Authors SHOULD use isolation: isolate as the explicit, side-effect-free way to force a stacking context, since the isolate value is defined as unconditionally creating one, unlike incidental triggers such as opacity or transform.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/isolation
- **Pulled quote:** "isolate: A new stacking context must be created."

### Claim 9

- **Text:** Developers SHOULD debug stacking bugs with browser DevTools, which added first-class inspection of top-layer elements (shipped as a preview in Chrome Canary 105).
- **Target section:** Best Practices
- **Source URL:** https://developer.chrome.com/blog/what-is-the-top-layer
- **Pulled quote:** "Chrome DevTools are adding support for top layer elements so you can inspect the top layer."

### Claim 10

- **Text:** For relative and absolute positioned elements, z-index: 0 and z-index: auto paint at the same step in tree order, but z-index: 0 establishes a new stacking context while auto does not, because MDN's trigger list requires a z-index value other than auto.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context
- **Pulled quote:** "Element with a `position` value `absolute` or `relative` and `z-index` value other than `auto`."

### Claim 11

- **Text:** With z-index: auto, fixed and sticky boxes still form stacking contexts, while relative and absolute boxes are only painted as if they formed one, leaving their positioned descendants participating in the outer stacking context.
- **Target section:** Deep Dive
- **Source URL:** https://www.w3.org/TR/css-position-3/
- **Pulled quote:** "Fixed and sticky positioned boxes nonetheless form a stacking context. Relative and absolute positioned boxes do not form a stacking context, but are painted as if those elements did generated new stacking contexts, except that their positioned descendants and any would-be child stacking contexts take part in the current stacking context."

### Claim 12

- **Text:** Unlike framework portal patterns, which relocate DOM nodes to escape ancestor stacking contexts and clipping, top-layer promotion frees an element from both z-index competition and DOM hierarchy without moving it in the tree.
- **Target section:** Escape Hatches: isolation, Portals & the Top Layer
- **Source URL:** https://developer.chrome.com/blog/what-is-the-top-layer
- **Pulled quote:** "This means that elements promoted to the top layer needn't worry about z-index or DOM hierarchy."

### Claim 13

- **Text:** Top-layer elements and their ::backdrop pseudo-elements each generate their own stacking context, so content inside them stacks in a fresh scope above the page.
- **Target section:** Escape Hatches: isolation, Portals & the Top Layer
- **Source URL:** https://developer.mozilla.org/en-US/docs/Glossary/Top_layer
- **Pulled quote:** "Elements placed in the top layer generate a new stacking context, as do their corresponding ::backdrop pseudo-elements."

### Claim 14

- **Text:** The article should cross-link sibling articles on the dialog element, the Popover API, and the Fullscreen API, since those are exactly the features MDN lists as populating the top layer.
- **Target section:** Related Topics
- **Source URL:** https://developer.mozilla.org/en-US/docs/Glossary/Top_layer
- **Pulled quote:** "Popover elements shown via a successful HTMLElement.showPopover() call."

### Claim 15

- **Text:** CSS 2 Appendix E remains the normative reference for painting order; the modern CSS Positioned Layout Level 3 spec explicitly defers to it rather than restating the rules.
- **Target section:** References
- **Source URL:** https://www.w3.org/TR/css-position-3/
- **Pulled quote:** "See CSS2 § 9.9 Layered presentation and Appendix E: Elaborate description of Stacking Contexts for details about z-index, stacking contexts, and painting order."

## Reference URLs (de-duplicated, for the article's References section)

- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context — MDN contributors, "Stacking context," MDN Web Docs (2025)
- https://www.w3.org/TR/CSS2/zindex.html — Bert Bos et al., "Appendix E. Elaborate description of Stacking Contexts," W3C CSS 2.1 Specification (2011)
- https://www.w3.org/TR/css-position-3/ — Elika J. Etemad, Tab Atkins Jr., "CSS Positioned Layout Module Level 3," W3C Working Draft (2025)
- https://developer.mozilla.org/en-US/docs/Glossary/Top_layer — MDN contributors, "Top layer," MDN Web Docs Glossary (2025)
- https://developer.chrome.com/blog/what-is-the-top-layer — Jhey Tompkins, "Meet the top layer: a solution to z-index:10000," Chrome for Developers Blog (2022)
- https://developer.mozilla.org/en-US/docs/Web/CSS/isolation — MDN contributors, "isolation," MDN Web Docs (2025)

## Rejected sources

- https://www.joshwcomeau.com/css/stacking-contexts/ — personal blog; below the source tier threshold when specs and official docs fully cover the topic (not fetched)
- https://css-tricks.com/what-no-one-told-you-about-z-index/ — community publication rather than a standards body or maintainer-run doc site; superseded by the MDN and W3C sources above (not fetched)
- Wikipedia (any article on z-index / CSS) — auto-rejected per source tier rule

## Research notes

- Proposed topic-specific section heading: **"Escape Hatches: isolation, Portals & the Top Layer"** (Claims 12 and 13 attach to it). The alternative "Stacking Context Trigger Matrix" is instead served by the Visual section: Claim 3's enumeration converts directly into a trigger table (trigger condition, property value, notes), and Claim 4 gives the paint-order rows. The writer can choose a table for Visual or a Mermaid layer diagram of the CSS2 paint steps.
- The full CSS2 Appendix E paint order has ten steps; Claim 4 quotes steps 3 and 9 verbatim. The intermediate steps as fetched: step 8 is "All positioned descendants with 'z-index: auto' or 'z-index: 0', in tree order." and step 5 is "All non-positioned floating descendants, in tree order." These can be cited to the same URL if the writer wants the complete ordered list.
- The css-position-3 quote in Claim 11 contains the phrase "did generated new stacking contexts" as published in the Working Draft text; keep it verbatim if quoted, or paraphrase in article voice.
- The z-index: auto value definition ("does not establish a new stacking context") normatively lives in CSS2 § 9.9.1 (https://www.w3.org/TR/CSS2/visuren.html#z-index); I did not fetch that separate URL, so Claim 10 is grounded in the MDN trigger list instead.
- Top-layer escape from overflow clipping: none of the fetched sources states "escapes overflow: hidden" in one quotable sentence. The safest grounded phrasing is Claim 5 (top layer "sits on top of all other layers") plus Claim 12 ("needn't worry about z-index or DOM hierarchy"). Avoid asserting overflow-clipping escape with a citation to these URLs.
- MDN Glossary also notes "the top layer is an internal browser concept and cannot be directly manipulated from code. You can target elements placed in the top layer using CSS and JavaScript, but you cannot target the top layer itself." (same Top_layer URL); usable as an extra Deep Dive point.
- The normative home of the top layer in modern CSS is CSS Positioned Layout Level 4 § top layer; I kept the source set at six and did not fetch it. If the writer wants a spec citation for the top layer itself, https://www.w3.org/TR/css-position-4/ would need verification first.
- Edge DevTools ships a "3D View" for stacking-context visualization; I found no quotable claim in the six verified sources, so Claim 9 covers DevTools debugging with the Chrome top-layer inspection quote instead. Do not cite Edge 3D View to any URL in this findings doc.
- `allow_no_custom_section` is not needed; the topic has a clear custom-section angle.
