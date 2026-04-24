---
topic: Popover API States and Anchor Positioning Integration
id: 111
slug: popover-states-and-anchor-positioning
sources_reviewed: 10
claims: 16
---

# Findings: Popover API States and Anchor Positioning Integration

**Proposed topic-specific section:** `## Anchor Positioning Integration`.

## Claims

### Claim 1

- **Text:** The Popover API defines three states — `auto`, `manual`, `hint`.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- **Pulled quote:** "Popovers accept three state values via the `popover` attribute: `auto`, `hint`, `manual`."

### Claim 2

- **Text:** `popover="auto"` light-dismisses on outside click, Esc, or another auto popover opening; only one unrelated auto popover visible at a time.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- **Pulled quote:** "`auto` popovers can be 'light dismissed' — this means that you can hide the popover by clicking outside it or pressing the Esc key. Showing an `auto` popover will generally close other `auto` popovers that are already displayed, unless they are nested."

### Claim 3

- **Text:** `popover="manual"` opts out of light dismiss; multiple manual popovers allowed simultaneously.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- **Pulled quote:** "`manual` popovers cannot be 'light dismissed' and are not automatically closed. Popovers must explicitly be displayed and closed using declarative show/hide/toggle buttons or JavaScript. Multiple independent `manual` popovers can be shown simultaneously."

### Claim 4

- **Text:** `popover="hint"` light-dismisses and closes other hints but does not dismiss open auto popovers — suitable for hover/focus tooltips over menus.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- **Pulled quote:** "`hint` popovers do not close `auto` popovers when they are displayed, but will close other hint popovers."

### Claim 5

- **Text:** Invoker wires to popover via `popovertarget`; intent controlled by `popovertargetaction` (`toggle` default, `show`, `hide`).
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- **Pulled quote:** "`popovertargetaction` Controls behavior with three values: `toggle` (default): pressing it repeatedly will toggle the popover between showing and hidden; `show`: shows the popover; `hide`: hides the popover."

### Claim 6

- **Text:** When shown, a popover is promoted into the top layer, painting above every other stacking context.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- **Pulled quote:** "When a popover is shown, it has `display: none` removed from it and it is put into the [top layer] so it will sit on top of all other page content."

### Claim 7

- **Text:** The HTML spec defines light dismiss; nested-popover algorithm preserves parent popovers when descendants open.
- **Target section:** Deep Dive
- **Source URL:** https://html.spec.whatwg.org/multipage/popover.html
- **Pulled quote:** "'Light dismiss' means that clicking outside of a popover whose `popover` attribute is in the Auto state will close the popover."

### Claim 8

- **Text:** Showing a popover inserts the invoker into keyboard tab order and returns focus to the invoker on Esc-close.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- **Pulled quote:** "When the popover is shown, the keyboard focus navigation order is updated so that the popover is next in the sequence... when closing the popover via the keyboard (usually via the Esc key), focus is shifted back to the invoker."

### Claim 9

- **Text:** `beforetoggle` and `toggle` events expose `oldState`/`newState` of `open`/`closed`.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- **Pulled quote:** "`oldState` and `newState`: indicate which state the popover has just transitioned from and to, allowing you to respond specifically to a popover opening or closing."

### Claim 10

- **Text:** `HTMLElement.togglePopover()` accepts an options bag whose `source` member registers the invoker for keyboard ordering and establishes an implicit CSS anchor relationship.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/togglePopover
- **Pulled quote:** "`source` (HTMLElement): Programmatically defines the invoker/control element. This: Places the popover logically in keyboard focus navigation order; Creates an implicit anchor reference for CSS anchor positioning."

### Claim 11

- **Text:** A button associated through `popovertarget` (or the `source` JS option) is an implicit anchor for the popover — no `anchor-name` needed for trigger-button layouts.
- **Target section:** Anchor Positioning Integration
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using
- **Pulled quote:** "When using the Popover API to associate a popover with a control, an implicit anchor reference is made between the two."

### Claim 12

- **Text:** Explicit binding: `anchor-name: --foo` on the anchor + `position-anchor: --foo` on the positioned element. Both take `<dashed-ident>` values.
- **Target section:** Anchor Positioning Integration
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name
- **Pulled quote:** "The `anchor-name` CSS property enables defining an element as an anchor element by giving it one or more identifying anchor names. Each name can then be set as the value of a positioned element's `position-anchor` property to associate it with the anchor."

### Claim 13

- **Text:** `position-try-fallbacks` walks alternative placements (`flip-block`, `flip-inline`, `@position-try` options) until one fits; reverts to original if none do.
- **Target section:** Anchor Positioning Integration
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks
- **Pulled quote:** "Browser tries fallback options in order... Uses the first option that prevents overflow... If no option prevents overflow, reverts to default position."

### Claim 14

- **Text:** `anchor-name`, `position-anchor`, `position-try-fallbacks` reached Baseline 2026 (Newly available Jan 2026).
- **Target section:** Anchor Positioning Integration
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name
- **Pulled quote:** "Baseline 2026 — Newly available since January 2026, this feature works across the latest devices and browser versions."

### Claim 15

- **Text:** Core Popover API is Baseline 2025; `auto`, `manual`, `popovertarget`, and the DOM methods work across all evergreen engines. `popover="hint"` is not yet Baseline.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- **Pulled quote:** "The Popover API achieved Baseline 2025 status as of January 2025, meaning it works across the latest devices and browser versions."

### Claim 16

- **Text:** `popover="hint"` ships in Chrome/Edge 133+, Firefox 149+, Opera 118+; still unimplemented in Safari/Safari iOS as of 26.5.
- **Target section:** Best Practices
- **Source URL:** https://caniuse.com/mdn-html_global_attributes_popover_hint
- **Pulled quote:** "Supported in: Chrome 133+, Edge 133+, Firefox 149+, Opera 118+... Not supported in: Safari (all versions through 26.5), Safari on iOS (all versions through 26.5)."

## Reference URLs

- https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/togglePopover
- https://html.spec.whatwg.org/multipage/popover.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using
- https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name
- https://developer.mozilla.org/en-US/docs/Web/CSS/position-anchor
- https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks
- https://caniuse.com/mdn-html_global_attributes_popover_hint

## Research notes

- Separate "Popover API Baseline 2025" from "hint state not yet Baseline".
- `anchor="id"` HTML attribute nests popovers but does NOT establish CSS anchoring — CSS anchoring needs `anchor-name`/`position-anchor` or implicit invoker.
- `position-anchor` MDN badge lags; treat anchor-positioning as Baseline 2026 after Firefox 147.
