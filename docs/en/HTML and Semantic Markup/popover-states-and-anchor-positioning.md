---
id: 111
title: Popover API States and Anchor Positioning Integration
state: draft
slug: popover-states-and-anchor-positioning
category: HTML and Semantic Markup
level: senior
reviewed: tone
reviewed_on: 2026-07-27
---

# [FEE-111] Popover API States and Anchor Positioning Integration

:::info
The Popover API exposes three declarative states (`auto`, `manual`, `hint`) that determine light-dismiss behavior, mutual-exclusion rules, and tab-order semantics. Shown popovers are promoted into the top layer so they paint above every other stacking context. With CSS anchor positioning reaching Baseline 2026, a popover can pin itself to its invoker through implicit anchoring or through explicit `anchor-name` / `position-anchor` declarations, and gracefully fall back when the viewport clips its preferred placement. This article covers the state semantics, the focus and dismissal algorithms, and the anchor-positioning primitives that replace JavaScript-driven layout math.
:::

## Context

The HTML `popover` global attribute accepts three state values: `auto`, `hint`, and `manual` (Claim 1). Each state changes what the user agent does when the popover is shown and how it interacts with other visible popovers:

- **`popover="auto"`** is the default menu/dialog behavior. The popover light-dismisses on outside click or Esc, and showing a new auto popover closes any unrelated auto popover that was already visible. Only one auto popover is visible at a time, unless nested (Claim 2).
- **`popover="manual"`** opts out of light-dismiss entirely. Multiple independent manual popovers may be visible simultaneously, and each is shown or hidden only through declarative invokers or the `showPopover()` / `hidePopover()` / `togglePopover()` methods (Claim 3).
- **`popover="hint"`** light-dismisses on outside interaction and closes other visible hints, yet leaves any open auto popover alone. That makes `hint` suitable for hover or focus tooltips layered over an open menu (Claim 4).

All three states share one rendering property: once shown, the popover is promoted into the top layer. The browser removes `display: none`, reorders stacking so the popover paints above every other context on the page, and manages the backdrop pseudo-element (Claim 6). Top-layer promotion is what lets a popover escape `overflow: hidden` ancestors and `transform`-created stacking contexts without manual portal work.

## Visual

| State | Light-dismiss? | Closes other `auto`? | Closes other `hint`? | Multiple visible? | Baseline |
| --- | --- | --- | --- | --- | --- |
| `auto` | Yes (outside click, Esc) | Yes (unless nested) | Yes | One at a time | Baseline 2025 |
| `manual` | No | No | No | Many | Baseline 2025 |
| `hint` | Yes (outside click, Esc) | No | Yes | One at a time | Not yet Baseline (Chrome/Edge 133+, Firefox 149+, Opera 118+; Safari pending through 26.5) |

The first two rows trace to Claims 2 and 3; the `hint` row to Claim 4. Baseline status for the core API comes from Claim 15; the `hint`-specific support matrix comes from Claim 16.

## Example

A trigger button opens an auto popover whose placement is bound to the button through explicit CSS anchoring. `position-try-fallbacks` lets the popover flip when the viewport clips its preferred edge.

```html
<button
  popovertarget="user-menu"
  popovertargetaction="toggle"
  id="user-menu-trigger"
>
  Account
</button>

<div id="user-menu" popover="auto">
  <ul role="menu">
    <li role="menuitem"><a href="/profile">Profile</a></li>
    <li role="menuitem"><a href="/settings">Settings</a></li>
    <li role="menuitem"><a href="/logout">Sign out</a></li>
  </ul>
</div>
```

The invoker wires to the popover by id through `popovertarget`; `popovertargetaction` takes `toggle` (the default), `show`, or `hide` (Claim 5). Because the popover is in the `auto` state, clicking outside or pressing Esc closes it, and showing a second auto popover would close this one.

```css
#user-menu-trigger {
  anchor-name: --user-menu-anchor;
}

#user-menu {
  position: absolute;
  position-anchor: --user-menu-anchor;
  top: anchor(bottom);
  left: anchor(left);
  margin-block-start: 0.5rem;

  position-try-fallbacks:
    flip-block,
    flip-inline,
    flip-block flip-inline;
}
```

The trigger publishes an anchor name; the popover consumes it with `position-anchor` and reads edges via the `anchor()` function (Claim 12). If the preferred placement overflows the viewport, `position-try-fallbacks` walks each option in order and uses the first that fits; if none fit, it reverts to the original placement (Claim 13).

For imperative control, `togglePopover()` accepts an options bag whose `source` member identifies the invoker, which registers the element in keyboard tab order and also establishes an implicit anchor reference (Claim 10):

```js
const menu = document.getElementById('user-menu');
const trigger = document.getElementById('user-menu-trigger');

menu.addEventListener('beforetoggle', (event) => {
  console.log(event.oldState, '→', event.newState); // 'closed' → 'open'
});

trigger.addEventListener('click', () => {
  menu.togglePopover({ source: trigger });
});
```

The `beforetoggle` and `toggle` events expose `oldState` and `newState`, each being `'open'` or `'closed'` (Claim 9).

## Best Practices

- **MUST** let the user agent manage focus on popover open/close. Showing a popover inserts its contents into keyboard tab order, and Esc-close returns focus to the invoker (Claim 8). Custom focus traps compete with that behavior and regress Esc handling.
- **MUST** feature-detect before depending on `popover="hint"`. It ships in Chromium 133+, Firefox 149+, and Opera 118+ but remains unimplemented in Safari and Safari iOS through 26.5 (Claim 16). The core API (`auto`, `manual`, `popovertarget`, the DOM methods) reached Baseline 2025 and works across every evergreen engine (Claim 15).
- **SHOULD** pick the state by interaction model. Use `auto` for menus, dialogs, and disclosure surfaces where only one should be visible. Use `manual` for persistent floating panels (chat drawers, inspector widgets) that must survive outside clicks. Use `hint` for tooltips layered over an open menu, where light-dismiss on outside interaction is acceptable but auto popovers must remain open (Claim 4).
- **SHOULD** provide a fallback for `hint` where it is unavailable. Degrade to `popover="auto"` behind a feature test, or render the tooltip content inline with `role="tooltip"` when layered interaction is not required (Claim 16).
- **SHOULD** prefer declarative invocation (`popovertarget` + `popovertargetaction`) over scripted `togglePopover()` calls. The declarative path needs no JavaScript, participates in form semantics, and stays accessible when scripts fail to load (Claim 5).
- **MAY** call `togglePopover({ source })` when the invoker is not a direct ancestor or `popovertarget` wiring is impractical. Passing `source` keeps keyboard focus order correct and seeds the implicit anchor relationship (Claim 10).

## Deep Dive

### Light-dismiss algorithm

The HTML spec defines light dismiss as closing an open popover whose `popover` attribute is in the Auto state when the user clicks outside it (Claim 7). The same algorithm runs for the Hint state, with the extra rule that a hint does not dismiss an open auto popover (Claim 4). Clicks on the invoker itself are not "outside" interactions; the user agent's hit test recognizes the invoker-popover association through `popovertarget` or the `source` option.

### Nested popovers

Two popovers are nested when one is a descendant of the other in the DOM, when they are linked through `popovertarget`, or when one was opened from within the other. Nested-popover rules preserve the ancestor: opening a descendant popover does not close its parent, and light-dismissing a descendant does not propagate to the ancestor (Claim 7). A submenu opened from a parent menu therefore keeps the parent visible until the user dismisses the whole tree.

### Explicit vs implicit anchor binding

There are two ways to pin a popover to another element through CSS anchor positioning:

- **Implicit**, established whenever a button is associated with a popover through `popovertarget` or through `togglePopover({ source })`. The popover can then read edges of the invoker through `anchor()` without any `anchor-name` / `position-anchor` declarations (Claim 11).
- **Explicit**, declared with `anchor-name: --foo` on the anchor element and `position-anchor: --foo` on the positioned element; both properties take `<dashed-ident>` values (Claim 12). Explicit binding works for any element pair, not just invoker-popover pairs, and supports multiple simultaneous anchors.

Choose implicit binding when the popover has exactly one invoker and no other anchor is needed. Choose explicit binding when the popover references multiple anchors, when the visual anchor differs from the activating control, or when the popover is shown without an invoker (e.g., from a global keyboard shortcut).

## Anchor Positioning Integration

The CSS anchor positioning module promotes a long-standing tooltip-library responsibility into a browser primitive: tracking a reference element's box and placing a floating element beside it. Three pieces matter for popover work.

**Implicit anchor through the invoker.** The Popover API already creates an anchor reference whenever a control is associated with a popover through `popovertarget` or through the `source` option of `togglePopover()` (Claim 11). No `anchor-name` declaration is needed for the common "button opens a menu below itself" layout: the popover's CSS reads edges of the invoker directly with `anchor(bottom)`, `anchor(center)`, and the other `anchor()` keywords.

**Explicit anchor binding.** For layouts where the anchor is a different element from the invoker, or where one popover pins to several anchors, declare `anchor-name: --my-anchor` on the anchor and `position-anchor: --my-anchor` on the positioned element. Both properties accept `<dashed-ident>` values, and `anchor-name` can hold a comma-separated list so a single element serves multiple positioned consumers (Claim 12).

**Overflow fallbacks.** `position-try-fallbacks` takes an ordered list of alternative placements (keywords such as `flip-block` and `flip-inline`, or named `@position-try` rules), and the browser picks the first option that keeps the popover inside its containing block. If none of the options fit, it reverts to the default placement (Claim 13). That replaces the flip-and-reposition logic that tooltip libraries historically implemented in JavaScript with `getBoundingClientRect()` and resize/scroll observers.

**Baseline timeline.** `anchor-name`, `position-anchor`, and `position-try-fallbacks` reached Baseline 2026, newly available since January 2026 and working across the latest devices and browser versions (Claim 14). The Popover API itself reached Baseline 2025 one year earlier (Claim 15), so teams on Baseline 2025 can ship popovers today and layer anchor positioning on once their support matrix catches up, degrading to a static placement in the interim.

## Related Topics

- [Media, Embedding & Interactive Elements](/en/HTML%20and%20Semantic%20Markup/104)
- [HTML APIs & Progressive Enhancement](/en/HTML%20and%20Semantic%20Markup/106)

## References

- MDN, "Popover API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- MDN, "Using the Popover API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- MDN, "popover (global attribute)," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- MDN, "HTMLElement: togglePopover() method," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/togglePopover
- WHATWG, "HTML Standard — Popover," whatwg.org. https://html.spec.whatwg.org/multipage/popover.html
- MDN, "Using CSS anchor positioning," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using
- MDN, "anchor-name," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name
- MDN, "position-anchor," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/position-anchor
- MDN, "position-try-fallbacks," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks
