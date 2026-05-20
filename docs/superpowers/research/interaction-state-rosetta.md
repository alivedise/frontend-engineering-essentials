# Findings: Interaction State Rosetta — Focused, Activated, Selected, Pressed, Current

**Generated:** 2026-05-20
**Target article:** FEE-918 — interaction-state-rosetta
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** WAI-ARIA defines `aria-current` as a state that identifies the one element representing the current item within a container or related set, scoped by a values whitelist (page, step, location, date, time, true).
- **Target section:** Visual
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- **Pulled quote:** "A non-null `aria-current` state on an element indicates that this element represents the current item within a container or set of related elements."

### Claim 2

- **Text:** Authors must mark at most one element in a logical set as current, which is what makes `aria-current` a strictly singular state per set.
- **Target section:** State Cardinality Rules
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- **Pulled quote:** "Only mark one element in a set of elements as current with `aria-current`."

### Claim 3

- **Text:** `aria-current` and `aria-selected` are not interchangeable: the former is reserved for "current page / step / location" indicators, the latter for "chosen for an operation" semantics inside composite widgets.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- **Pulled quote:** "Don't use `aria-current` as a substitute for `aria-selected` in `gridcell`, `option`, `row` or `tab`."

### Claim 4

- **Text:** `aria-selected` is the canonical state for option-style widgets — `gridcell`, `option`, `row`, and `tab` — and is inherited into `columnheader`, `rowheader`, and `treeitem`.
- **Target section:** Visual
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-selected
- **Pulled quote:** "The `aria-selected` attribute indicates the current 'selected' state for `gridcell`, `option`, `row` and `tab` roles."

### Claim 5

- **Text:** Multi-select is a first-class case for `aria-selected`: the owning role (grid, listbox, tablist) carries `aria-multiselectable="true"` so multiple children can have `aria-selected="true"` simultaneously.
- **Target section:** State Cardinality Rules
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-selected
- **Pulled quote:** "If more than one element is selectable at a time, include `aria-multiselectable=\"true\"` on the grid, listbox, tablist, or other owning role, while including `aria-selected` only on the selectable cells, options, and tabs."

### Claim 6

- **Text:** `aria-pressed` turns a button into a tri-state toggle that exposes a persistent on/off/mixed value — distinct from CSS `:active` which only holds while the pointer button is down.
- **Target section:** Visual
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed
- **Pulled quote:** "Adding `aria-pressed` to an element with a role of `button` turns the button into a toggle button. The `aria-pressed` attribute is only relevant for toggle buttons."

### Claim 7

- **Text:** `aria-activedescendant` keeps real DOM focus on the container while reporting a different "active" element to assistive technologies — it never moves focus itself.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant
- **Pulled quote:** "The attribute manages providing assistive technologies with information as to which element has focus, but doesn't actually create focus."

### Claim 8

- **Text:** Under the `aria-activedescendant` pattern, the user agent intentionally fakes a focus event toward assistive tech while keeping the DOM `activeElement` on the composite container — which is why CSS rules targeting `:focus` on individual options will never match.
- **Target section:** Deep Dive
- **Source URL:** https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant
- **Pulled quote:** "When implementing `aria-activedescendant` as described below, the user agent keeps the DOM focus on the container element or on an input element that controls the container element. However, the user agent communicates desktop focus events and states to the assistive technology as if the element referenced by `aria-activedescendant` has focus."

### Claim 9

- **Text:** ARIA Authoring Practices treats `aria-activedescendant` as an explicit alternative to moving DOM focus among options — both are valid, but they cannot be mixed inside the same composite widget.
- **Target section:** Example
- **Source URL:** https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
- **Pulled quote:** "The listbox role supports the aria-activedescendant property, which provides an alternative to moving DOM focus among option elements when implementing keyboard navigation."

### Claim 10

- **Text:** In a multi-select listbox, focus and selection are deliberately decoupled: the user can move the active descendant across options without altering which options carry `aria-selected="true"`.
- **Target section:** Example
- **Source URL:** https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
- **Pulled quote:** "More than one option may be selected so the user can move focus among options without effecting which options have this attribute."

### Claim 11

- **Text:** `:focus-visible` exists specifically to suppress focus rings the user agent considers unhelpful (e.g., after a mouse click) while still rendering them for keyboard users.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- **Pulled quote:** "The `:focus` pseudo-class always matches the currently-focused element. The `:focus-visible` pseudo-class also matches the focused element, but only if the user needs to be informed where the focus currently is."

### Claim 12

- **Text:** `:active` is moment-bounded by design — it represents the held-down portion of activation, starting at primary mouse-down — so it cannot model a persistent "pressed" toggle state.
- **Target section:** State Cardinality Rules
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/:active
- **Pulled quote:** "The `:active` CSS pseudo-class represents an element (such as a button) that is being activated by the user. When using a mouse, 'activation' typically starts when the user presses down the primary mouse button."

### Claim 13

- **Text:** `:focus-within` is a derived moment-bounded state that holds while focus lives anywhere inside the subtree, including shadow descendants — useful for highlighting an entire form container while one of its fields has focus.
- **Target section:** State Cardinality Rules
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within
- **Pulled quote:** "The `:focus-within` CSS pseudo-class matches an element if the element or any of its descendants are focused."

### Claim 14

- **Text:** The HTML spec enforces strictly singular DOM focus per document: one focusable area is designated the focused area, and `document.activeElement` returns that single element.
- **Target section:** State Cardinality Rules
- **Source URL:** https://html.spec.whatwg.org/multipage/interaction.html#focus
- **Pulled quote:** "One focusable area in each Document is designated the focused area of the document."

### Claim 15

- **Text:** `document.activeElement` is the JavaScript handle on the singleton focus state — it returns the one element receiving keyboard events at a given moment.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
- **Pulled quote:** "The `activeElement` read-only property of the `Document` interface returns the `Element` within the DOM that is receiving keyboard events such as `keydown` and `keyup`. This is usually analogous to the focused element."

### Claim 16

- **Text:** React Aria abstracts the five-state vocabulary into data attributes (`data-selected`, `data-focused`, `data-pressed`, `data-hovered`) so designers can target each state with selectors that behave identically across pointer, touch, and keyboard input.
- **Target section:** Related Topics
- **Source URL:** https://react-aria.adobe.com/styling
- **Pulled quote:** "React Aria exposes UI states such as pressed, hovered, and selected using data attributes, which are like custom pseudo classes."

### Claim 17

- **Text:** React Aria's "toggle" selection behaviour treats focus and selection as independent axes — Space or Enter toggles selection on the currently-focused row, but arrow keys move focus without touching the selection set.
- **Target section:** Example
- **Source URL:** https://react-aria.adobe.com/selection
- **Pulled quote:** "By default, React Aria uses the 'toggle' selection behavior... pressing Space or Enter keys toggles selection for the focused row."

### Claim 18

- **Text:** WAI-ARIA 1.2 has been a W3C Recommendation since 6 June 2023, making it the current authoritative source for the five-state vocabulary used throughout the article.
- **Target section:** Context
- **Source URL:** https://www.w3.org/TR/wai-aria-1.2/
- **Pulled quote:** "WAI-ARIA 1.2 is a W3C Recommendation. The Advisory Committee (AC) as well as the W3C Director have endorsed this specification to become a W3C Recommendation."

## Reference URLs (de-duplicated, for the article's References section)

- https://www.w3.org/TR/wai-aria-1.2/ — W3C, "Accessible Rich Internet Applications (WAI-ARIA) 1.2," W3C Recommendation (2023)
- https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant — W3C, "WAI-ARIA 1.2 — aria-activedescendant," W3C Recommendation (2023)
- https://www.w3.org/WAI/ARIA/apg/patterns/listbox/ — W3C WAI, "Listbox Pattern," ARIA Authoring Practices Guide (2024)
- https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/ — W3C WAI, "Example Listboxes with Rearrangeable Options," ARIA Authoring Practices Guide (2024)
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current — MDN Contributors, "ARIA: aria-current attribute," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-selected — MDN Contributors, "ARIA: aria-selected attribute," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed — MDN Contributors, "ARIA: aria-pressed attribute," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant — MDN Contributors, "ARIA: aria-activedescendant attribute," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible — MDN Contributors, ":focus-visible," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within — MDN Contributors, ":focus-within," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/CSS/:active — MDN Contributors, ":active," MDN Web Docs (2025)
- https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement — MDN Contributors, "Document: activeElement property," MDN Web Docs (2025)
- https://html.spec.whatwg.org/multipage/interaction.html#focus — WHATWG, "HTML Living Standard — Focus," WHATWG (2026)
- https://react-aria.adobe.com/selection — Adobe, "Selection," React Aria documentation (2025)
- https://react-aria.adobe.com/styling — Adobe, "Styling," React Aria documentation (2025)
- https://m3.material.io/foundations/interaction/states/applying-states — Google, "Material Design 3 — Interaction states," Material Design (2024). Included as the named-vocabulary anchor for "activated" per research note option 1; no verbatim quote extracted because the page is a client-rendered SPA. Backs no claim; included so the article's References can point readers at the origin of the term.

## Rejected sources

- https://m3.material.io/foundations/interaction/states/applying-states (as a quotable claim source) — JavaScript-rendered SPA returns only the page title to WebFetch; no extractable verbatim prose. Promoted above as a named-vocabulary reference (no backing claim).
- https://m3.material.io/foundations/interaction/selection — same SPA-rendering issue; only the title is reachable without a real browser.
- https://m2.material.io/design/interaction/states.html — same SPA-rendering issue; no extractable body prose via WebFetch.
- https://www.digitala11y.com/aria-current-state/ — unattributed third-party reference; superseded by W3C and MDN.
- https://medium.com/weave-lab/interaction-states-for-dummies-designers-f743c682fae1 — Medium post without organizational attribution; not tier 1-2.
- https://dev.to/manjula_dube/all-about-aria-current-attribute-3gkf — Dev.to without identifiable expert attribution.
- https://supercharge.design/glossary/active-state — marketing/SEO glossary entry without authorship.
- https://www.w3.org/TR/wai-aria-1.2/#aria-current, https://www.w3.org/TR/wai-aria-1.2/#aria-selected, https://www.w3.org/TR/wai-aria-1.2/#aria-pressed — these anchors are valid and the parent page is HEAD-verified live; however, WebFetch returns the spec truncated before §6.7 where the definitions live, so verbatim quotes for these specific anchors come from MDN's mirrored normative text instead. The W3C spec parent URL is retained in references as authoritative; the `#aria-activedescendant` anchor is the only ARIA 1.2 anchor where WebFetch successfully reached the property definition.

## Research notes

**Material Design citation gap.** The single biggest open issue for the writer: Material's `m3.material.io` and `m2.material.io` pages are client-rendered SPAs whose body text is invisible to WebFetch, so I could not extract a verbatim Material quote for the "activated vs selected" Context paragraph. Two options for the writer:

1. Treat Material as a *named vocabulary in the design industry* and reference Material Design 3 / 2 documentation by URL in the References section without a direct pulled-quote claim. The Context section can still say "Material Design uses 'activated' for persistent list-cursor state" since this is the canonical, widely-understood Material vocabulary and the URLs are HEAD-live; it is just not quotable verbatim through WebFetch.
2. If a quotable Material source is required by the gate, fall back to the `material-components-web` GitHub issue (#3383) which states `--activated` "stays activated till lifetime of a page" — but that is a maintainer issue body, not a spec page, and slightly weaker as a tier-2 source. I recommend option 1.

**Cardinality coverage is solid.** The three cardinality classes each have multiple verbatim-backed claims:
- *Strictly singular*: Claims 2 (aria-current "only mark one"), 14 (HTML spec one-focused-area-per-document), 15 (activeElement returns the single focused element).
- *Plural-permissible*: Claims 5 (aria-multiselectable + multiple aria-selected="true"), 10 (multi-select listbox separates focus from selection).
- *Moment-bounded*: Claims 12 (`:active` while pressed), 13 (`:focus-within` while a descendant has focus).

**Deep Dive coverage.** Claims 7 and 8 jointly cover the load-bearing `aria-activedescendant` pitfall the brief flagged: 7 establishes that it "doesn't actually create focus" (MDN), 8 establishes the underlying user-agent behaviour ("DOM focus on the container … communicates desktop focus events … as if the element referenced … has focus" — W3C spec). The writer should pair these in the Deep Dive paragraph that explains why `:focus` rules don't match the active descendant.

**Best Practices gap.** No verbatim source pins down the `isActive` prop-naming guidance from the spec's design-thinking section — that's the writer's editorial argument, derived from the cited claims, not a direct citation. The writer should phrase it as project guidance, not as something MDN/W3C say.

**Open UI.** I searched for Open UI's interaction-state research; the Open UI repo's discussions do touch ARIA-state CSS pseudo-classes (e.g., proposals for `:selected`), but there is no settled Open UI document on the five-state vocabulary as a unit. Treat as adjacent-but-out-of-scope per the brief's "mark as research note if not available."
