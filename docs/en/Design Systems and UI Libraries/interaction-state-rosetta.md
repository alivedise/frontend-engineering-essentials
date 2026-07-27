---
id: 918
title: "Interaction State Rosetta — Focused, Activated, Selected, Pressed, Current"
state: draft
slug: interaction-state-rosetta
---

# [FEE-918] Interaction State Rosetta — Focused, Activated, Selected, Pressed, Current

:::info
The word "active" carries four unrelated meanings across the disciplines that build UI: Material Design's persistent "activated" cursor for the current item in a list, CSS's moment-bounded `:active` while a pointer is held down, ARIA's `aria-activedescendant` that reports virtual focus inside a composite widget, and colloquial use that lumps selected, pressed, focused, and current-page together. This article maps designer vocabulary to CSS pseudo-classes and ARIA attributes through one rosetta table and a five-row vocabulary set: Focused, Activated, Selected, Pressed, Current. The underlying axis that makes the mapping legible is state cardinality, which separates concepts that allow only one occurrence at a time from concepts that allow many. The same axis explains why "activated" and `:focus` cannot collapse into the same engineering concept even though designers often use the word "active" for both.
:::

## Context

The five-state vocabulary has three independent histories that were never reconciled. The dynamic CSS pseudo-classes `:hover` and `:focus` were first defined in CSS2 (W3C Recommendation, May 1998), and `:active` dates back further still to CSS1 (W3C Recommendation, December 1996); all three were carried forward, unchanged in their basic behavior, into the stable CSS 2.1 revision (W3C Recommendation, 2011), and were designed before "interaction state" existed as a design-system concept. WAI-ARIA 1.0 (2014) introduced semantic state attributes: `aria-selected`, `aria-pressed`, and `aria-activedescendant`. WAI-ARIA 1.1 (W3C Recommendation, 14 December 2017) later added `aria-current`, completing the set this rosetta relies on for assistive technologies. Material Design, also introduced in 2014, brought "activated" as a persistent visual state for the current item in a list, distinct from "selected" and "pressed". The current authoritative reference for the ARIA half of the rosetta is WAI-ARIA 1.2, which became a W3C Recommendation on 6 June 2023. The singleton nature of DOM focus is normatively defined by the HTML Living Standard, with `document.activeElement` as its JavaScript handle.

## Visual

| Designer term | Material name | CSS pseudo-class | ARIA attribute | Cardinality | When to use |
|---|---|---|---|---|---|
| Focused | Focused | `:focus` / `:focus-visible` | none direct (DOM focus is the source of truth); `aria-activedescendant` for virtual focus | Strictly singular per browsing context | Keyboard or programmatic focus target |
| Activated | Activated | No direct pseudo-class; target via `[aria-current]` or `[aria-selected]` attribute selectors or a state class | Closest semantics: `aria-current`, `aria-activedescendant` | Singular within a logical set; plural across independent sets | Persistent current-item indicator that survives blur |
| Selected | Selected | No pseudo-class; target via `[aria-selected="true"]` | `aria-selected` (valid on `gridcell`, `option`, `row`, `tab`, and inherited into `columnheader`, `rowheader`, `treeitem`) | Plural in multi-select with `aria-multiselectable="true"`; singular in single-select | Chosen-for-operation in option-style widgets |
| Pressed | Pressed (toggle on) | `:active` is moment-bounded and the wrong match; target via `[aria-pressed="true"]` | `aria-pressed` (tri-state toggle) | Singular per toggle button; independent across buttons in a toolbar | Toggle-button on-state |
| Current | (no Material equivalent) | No pseudo-class; target via `[aria-current]` | `aria-current` (values: `page`, `step`, `location`, `date`, `time`, `true`) | Strictly singular per logical set | Current-page, current-step, current-location indicator |

## Example

### Example A — Sidebar Nav Item

A sidebar links to several application areas; one of them represents the page the user is on. The current-page semantics belong to `aria-current="page"`, and the visual treatments split across `:focus-visible`, `:hover`, and `:active`.

```html
<nav aria-label="Primary">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/settings" aria-current="page">Settings</a></li>
  </ul>
</nav>
```

```css
nav a {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  color: inherit;
  text-decoration: none;
}

/* Persistent current-page state — survives blur, not pointer-dependent. */
nav a[aria-current="page"] {
  background: var(--surface-current);
  font-weight: 600;
}

/* Keyboard focus ring only when the user agent decides a ring is helpful. */
nav a:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Hover tint — moment-bounded while the pointer is over the link. */
nav a:hover {
  background: var(--surface-hover);
}

/* :active — held only during pointer-down, used for the tactile press feedback,
   never for the persistent current-page indicator. */
nav a:active {
  transform: translateY(1px);
}
```

A screen reader on the correct implementation announces the current link as:

```
Settings, current page, link
```

A common mis-implementation uses `aria-selected="true"` on the current link. The same announcement then becomes:

```
Settings, selected, link
```

That announcement is semantically wrong because the link indicates the current page, while "selected" implies the link was chosen for an operation. The MDN reference is explicit that `aria-current` is not interchangeable with `aria-selected` in `gridcell`, `option`, `row`, or `tab` roles, and the inverse holds: `aria-selected` is not a substitute for `aria-current` in navigation.

### Example B — Multi-Select File List

A file list permits multiple items to be selected at once and uses a keyboard cursor that moves independently of the selection set. The owning `listbox` carries `aria-multiselectable="true"` and DOM focus, while `aria-activedescendant` points at whichever option is currently the keyboard cursor.

```html
<ul
  id="files"
  role="listbox"
  aria-label="Files"
  aria-multiselectable="true"
  aria-activedescendant="file-3"
  tabindex="0"
>
  <li id="file-1" role="option" aria-selected="true">budget.xlsx</li>
  <li id="file-2" role="option" aria-selected="false">notes.md</li>
  <li id="file-3" role="option" aria-selected="true">design.fig</li>
  <li id="file-4" role="option" aria-selected="false">README.txt</li>
</ul>
```

```css
#files {
  list-style: none;
  margin: 0;
  padding: 0;
}

#files:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Plural-permissible: any number of options may carry aria-selected="true" at once. */
#files [role="option"][aria-selected="true"] {
  background: var(--surface-selected);
  font-weight: 600;
}

/* The keyboard cursor is the descendant whose id matches the container's aria-activedescendant.
   :focus on the option itself would never match — DOM focus is on the listbox container. */
#files[aria-activedescendant="file-1"] #file-1,
#files[aria-activedescendant="file-2"] #file-2,
#files[aria-activedescendant="file-3"] #file-3,
#files[aria-activedescendant="file-4"] #file-4 {
  box-shadow: inset 0 0 0 2px var(--cursor-ring);
}
```

```js
const listbox = document.getElementById("files");
const options = Array.from(listbox.querySelectorAll('[role="option"]'));

function activeIndex() {
  const id = listbox.getAttribute("aria-activedescendant");
  return options.findIndex((el) => el.id === id);
}

function moveCursor(delta) {
  const next = Math.max(0, Math.min(options.length - 1, activeIndex() + delta));
  listbox.setAttribute("aria-activedescendant", options[next].id);
}

function toggleSelection() {
  const current = options[activeIndex()];
  const next = current.getAttribute("aria-selected") === "true" ? "false" : "true";
  current.setAttribute("aria-selected", next);
}

listbox.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowDown":
      moveCursor(1);
      event.preventDefault();
      break;
    case "ArrowUp":
      moveCursor(-1);
      event.preventDefault();
      break;
    case " ":
      toggleSelection();
      event.preventDefault();
      break;
  }
});
```

Arrow keys move the active descendant without touching the selection set; Space toggles selection on the option that the active descendant currently points at. The ARIA Authoring Practices Guide notes that the listbox role supports `aria-activedescendant` as an alternative to moving DOM focus among option elements, and the multi-select rearrangeable example clarifies that focus and selection are deliberately decoupled so the user can move focus among options without affecting which options carry the selection attribute.

## Best Practices

- **MUST** use `aria-current` to mark the current page, step, or location in a navigation set, and **MUST NOT** substitute `aria-selected` for that purpose. The MDN reference explicitly warns against using `aria-current` in place of `aria-selected` in `gridcell`, `option`, `row`, and `tab` roles, and the inverse warning applies to navigation. Screen readers announce the two states with different wording.
- **MUST NOT** express a persistent "activated" or "pressed" state with the CSS `:active` pseudo-class. `:active` represents activation while the primary mouse button is held down, so it releases as soon as the user lifts their finger and cannot model a toggle that survives blur.
- **MUST** set `aria-multiselectable="true"` on the owning role (grid, listbox, tablist) whenever multiple children may carry `aria-selected="true"` at the same time. Including `aria-selected` on the children without the owner attribute leaves assistive technologies without the cue that plural selection is permitted.
- **SHOULD** prefer `:focus-visible` over `:focus` for keyboard focus rings. `:focus` always matches the focused element, while `:focus-visible` matches only when the user agent decides the user needs to be informed of focus location, which suppresses unwanted rings after a mouse click.
- **SHOULD** name component props by semantic intent — `isCurrent`, `isSelected`, `isPressed` — rather than the catch-all `isActive`. This is project editorial guidance: no specification mandates the naming, but an ambiguous prop name leaks the designer/engineer vocabulary mismatch into the codebase, and linting cannot catch the wrong meaning.
- **MAY** layer states (focused + selected + current on the same element), provided the design system specifies a deterministic visual precedence so two conflicting state visuals do not produce inconsistent renders across pages.

## Design Thinking

Material's "activated" has no ARIA equivalent because the two vocabularies were built for orthogonal audiences. Material describes visual states for sighted users: what the pixel rendering does when an item becomes the persistent cursor in a list. ARIA describes semantic states for assistive technologies: what the platform tells a screen reader about the role an element plays in a composite widget. The overlap between "activated" and any single ARIA attribute is partial: persistent current-item indicators in navigation map to `aria-current`, persistent selection in option widgets maps to `aria-selected`, and the keyboard-cursor sense maps to `aria-activedescendant`. No single ARIA attribute reproduces Material's "activated" because Material did not need to disambiguate the three sub-cases for a sighted audience.

Naming a component prop `isActive` costs reading time on every consumer site. A prop called `isCurrent` tells the reader the component models the current-page case in roughly one second; `isActive` requires opening the implementation to discover which of the five states the prop controls and what ARIA attribute the component will eventually emit. The cost compounds because the ambiguity is invisible to a type checker. `isActive: boolean` passes review regardless of which underlying state the prop is meant to drive.

## Deep Dive

State stacking is the usual case in a real component: a row in a multi-select grid can be hovered, the keyboard cursor (active descendant), and `aria-selected="true"` all at once. Most of these dimensions are independent. Being focused does not imply being selected, and being selected does not imply being current. The design system carries the burden of defining visual precedence when two state visuals would conflict, since the browser will paint every matching rule.

The load-bearing ARIA pitfall sits with `aria-activedescendant`. The MDN reference is explicit that the attribute "manages providing assistive technologies with information as to which element has focus, but doesn't actually create focus". The W3C WAI-ARIA 1.2 specification gives the underlying user-agent contract: when implementing `aria-activedescendant`, the user agent keeps the DOM focus on the container element or on an input element that controls the container element, while communicating desktop focus events and states to the assistive technology as if the element referenced by `aria-activedescendant` has focus. CSS rules that target `:focus` on individual options will never match in this pattern, because DOM focus is on the composite container and not on the option the user perceives as focused. A visual cursor on the option must be styled through an attribute-selector chain that pairs the container's `aria-activedescendant` value with the option's `id`, or through `:has()`, never through `:focus`. Mixing the two patterns (moving DOM focus among options while also setting `aria-activedescendant`) is invalid: the ARIA Authoring Practices Guide treats `aria-activedescendant` and DOM-focus-moving (roving tabindex) as two alternatives, not composable strategies, inside one composite widget.

## State Cardinality Rules

Three classes resolve the vocabulary collisions.

### Class 1 — Strictly Singular

- DOM `:focus` is singular per browsing context. The HTML Living Standard designates one focusable area in each Document as the focused area of the document.
- `aria-current` is singular per logical set. The MDN guidance instructs authors to mark only one element in a set of elements as current with `aria-current`.
- `document.activeElement` is the JavaScript handle on the singleton DOM focus state and returns the one element receiving keyboard events.

Implication: a designer asking for "focus on every selected row" is asking for the wrong thing at the engineering level. The visual they want is a ring or fill on each row, mapped to `aria-selected` plural, not literal focus on each row.

### Class 2 — Plural-Permissible

- `aria-selected="true"` may appear on many children at once when the owning role carries `aria-multiselectable="true"`, which is the canonical multi-select listbox / grid / tablist contract.
- In a multi-select listbox, focus and selection are deliberately decoupled, so the user moves the active descendant across options without affecting which options carry `aria-selected="true"`.
- `aria-pressed` is independent per toggle button, so a toolbar can carry many simultaneously-pressed toggles without any contradiction.

Implication: a designer's "multiple activated items at once" mockup is implementable when mapped to `aria-selected` plural (with `aria-multiselectable` on the owner), and unimplementable when mapped to `:focus` because `:focus` is strictly singular.

### Class 3 — Moment-Bounded

- `:active` represents an element being activated by the user, starting when the primary mouse button is pressed and ending when it is released, so it cannot persist past the gesture.
- `:focus-within` matches as long as the element or any of its descendants is focused, releasing the moment focus leaves the subtree.
- `:hover` matches while the pointer is over the element and releases the moment the pointer leaves.

Implication: a "pressed" mockup almost always describes the persistent toggle-on state (`aria-pressed="true"`) rather than the moment-bounded `:active`. The cardinality cue is "would a user expect to release the mouse and still see this state?" If yes, the state belongs to Class 2 (plural-permissible) and needs an ARIA attribute, not a CSS pseudo-class.

"Activated" and `:focus` cannot be the same engineering concept because they sit in different cardinality classes. "Activated" is plural-permissible across items in a list or grid, while `:focus` is strictly singular per browsing context. Any vocabulary that collapses the two will lose either the multi-item case or the singleton DOM-focus invariant. The rosetta table holds because every row chooses one cardinality class and stays in it.

### Quick State Reference

A handful of related states outside the five-row vocabulary follow the same cardinality logic and are useful to have on hand.

| State | CSS | ARIA | Cardinality | Notes |
|---|---|---|---|---|
| Hover | `:hover` | none | Moment-bounded | Pointer-only; releases when pointer leaves |
| Disabled | `:disabled`, `[aria-disabled]` | `aria-disabled` | Per element | `:disabled` only matches form controls; `aria-disabled` works on any role |
| Checked | `:checked` | `aria-checked` | Per element | `:checked` only matches form controls |
| Target | `:target` | none | Strictly singular | URL-fragment-driven; one element matches per document |
| Focus-within | `:focus-within` | none | Implied by descendant focus | Matches the element or any of its descendants, including through shadow DOM |
| Expanded | `[aria-expanded]` | `aria-expanded` | Per element | Used on disclosure widgets, comboboxes, and tree branches |

## Related Topics

- [Keyboard Navigation & Focus Management](/en/Accessibility/1002)
- [Accessible Component Patterns](/en/Accessibility/1007)
- [React Aria Components — Adobe's Contexts & Slots Composition Model](/en/Design Systems and UI Libraries/react-aria-components)
- [Framework-Agnostic State Machines — Zag.js and Ark UI](/en/Design Systems and UI Libraries/zag-and-ark-ui)

## References

- W3C, "Accessible Rich Internet Applications (WAI-ARIA) 1.2," W3C Recommendation (2023). https://www.w3.org/TR/wai-aria-1.2/
- W3C, "WAI-ARIA 1.2 — aria-activedescendant," W3C Recommendation (2023). https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant
- W3C WAI, "Listbox Pattern," ARIA Authoring Practices Guide (2024). https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
- W3C WAI, "Example Listboxes with Rearrangeable Options," ARIA Authoring Practices Guide (2024). https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
- MDN Contributors, "ARIA: aria-current attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- MDN Contributors, "ARIA: aria-selected attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-selected
- MDN Contributors, "ARIA: aria-pressed attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed
- MDN Contributors, "ARIA: aria-activedescendant attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant
- MDN Contributors, ":focus-visible," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- MDN Contributors, ":focus-within," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within
- MDN Contributors, ":active," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/:active
- MDN Contributors, "Document: activeElement property," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
- WHATWG, "HTML Living Standard — Focus," WHATWG (2026). https://html.spec.whatwg.org/multipage/interaction.html#focus
- Adobe, "Selection," React Aria documentation (2025). https://react-aria.adobe.com/selection
- Adobe, "Styling," React Aria documentation (2025). https://react-aria.adobe.com/styling
- Google, "States," Material Design 2 (describes "activated" as a more permanent highlighted-destination state, distinct from the user-choice "selected" state). https://m2.material.io/go/design-states
- Google, "Material Design 3 — Interaction states," Material Design (named-vocabulary reference for "activated"; SPA-rendered, no verbatim quote extracted). https://m3.material.io/foundations/interaction/states/applying-states
