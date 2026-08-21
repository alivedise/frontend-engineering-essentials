---
id: 211
title: "Stacking Contexts, Paint Order & the Top Layer"
state: draft
slug: stacking-contexts-paint-order-top-layer
---

# [FEE-211] Stacking Contexts, Paint Order & the Top Layer

:::info
A stacking context is a three-dimensional conceptualization of HTML elements along an imaginary z-axis relative to the user. Elements inside one stacking context stack independently from elements outside it. This independence explains the classic failure where `z-index: 9999` still renders under a sibling's header: a z-index value has meaning only within its parent stacking context. Within each context, CSS 2 Appendix E defines a fixed back-to-front paint order that no z-index value can reorder across context boundaries. The browser-managed top layer, populated by `dialog.showModal()`, the Popover API, and fullscreen, sits above every other layer of the document and removes the need for z-index escalation in overlay code.
:::

## Context

MDN defines a stacking context as "a three-dimensional conceptualization of HTML elements along an imaginary z-axis relative to the user," with the guarantee that elements within a stacking context stack independently from elements outside it (MDN, "Stacking context," 2025). That guarantee is also the source of the classic stacking bug: because "the z-index values of its child stacking contexts only have meaning within its parent's stacking context," no z-index value can lift a descendant above a sibling of its stacking-context ancestor. The normative painting rules live in Appendix E of the CSS 2 specification (Bos et al., 2011), and the modern CSS Positioned Layout Module Level 3 (Etemad & Atkins, 2025) explicitly defers to it for the painting rules. The newest actor is the top layer, described in the MDN Glossary (2025) and introduced to practitioners by Jhey Tompkins on the Chrome for Developers blog (2022) as "a solution to z-index:10000." This article covers what creates a stacking context, the order in which content paints inside one, and when to abandon z-index for the top layer.

## Visual

What creates a stacking context, per MDN's trigger list (2025):

| Trigger category | Conditions |
| --- | --- |
| Document root | The `<html>` element |
| Positioning | `position: absolute` or `relative` with a `z-index` value other than `auto`; `position: fixed`; `position: sticky` |
| Flex and grid | Flex item or grid item with a `z-index` value other than `auto` |
| Visual effects | `opacity` below 1; `mix-blend-mode` other than `normal`; any of `transform`, `scale`, `rotate`, `translate`, `filter`, `backdrop-filter`, `perspective`, `clip-path`, or `mask` / `mask-image` / `mask-border` with a value other than `none` |
| Explicit opt-in | `isolation: isolate` |
| Performance hints | `will-change` with qualifying values |
| Containment | `contain: layout` or `contain: paint`; `container-type: size` or `inline-size` |
| Browser-managed | Elements placed in the top layer |
| Animation | Forwards-filling keyframe animations of the properties above |

Inside each stacking context, CSS 2 Appendix E paints back to front in a fixed order:

1. Backgrounds and borders of the context-forming element
2. Stacking contexts with negative z-index, "in z-index order (most negative first) then tree order"
3. In-flow block-level content
4. "All non-positioned floating descendants, in tree order"
5. Inline content
6. "All positioned descendants with 'z-index: auto' or 'z-index: 0', in tree order"
7. Stacking contexts with z-index greater than or equal to 1, "in z-index order (smallest first) then tree order"

## Example

A sticky header and a tooltip reproduce the `z-index: 9999` failure:

```html
<header style="position: sticky; top: 0; z-index: 10">Site header</header>

<section style="position: relative; z-index: 1">
  <button>Details</button>
  <div class="tooltip" style="position: absolute; z-index: 9999">
    I still render under the header.
  </div>
</section>
```

The `<section>` has `position: relative` and a non-`auto` z-index, so it forms a stacking context. The tooltip's `z-index: 9999` is resolved inside that context, and the context as a whole competes against the header at value 1 versus 10. Per MDN, "the z-index values of its child stacking contexts only have meaning within its parent's stacking context," so no tooltip value can win.

The top layer removes the competition entirely:

```html
<dialog id="confirm">
  <p>Discard unsaved changes?</p>
  <button>Discard</button>
</dialog>

<script>
  document.querySelector('#confirm').showModal();
</script>
```

A modal dialog opened with `HTMLDialogElement.showModal()` renders into the top layer, "a specific layer that spans the entire width and height of the viewport and sits on top of all other layers displayed in a web document" (MDN Glossary, 2025). As the Chrome for Developers blog puts it, "you don't need to apply any styles to the `<dialog>` to make it appear above all other content." The header's `z-index: 10` never enters the comparison.

## Best Practices

- **MUST** prefer native top-layer APIs (`dialog.showModal()`, the Popover API, fullscreen) over z-index escalation for overlays: a modal dialog appears above all other content with zero stacking CSS (Chrome for Developers, 2022).
- **SHOULD** use `isolation: isolate` when you need a stacking context on purpose: the `isolate` value is defined as "a new stacking context must be created" (MDN, "isolation," 2025), with none of the side effects of incidental triggers such as `opacity` or `transform`.
- **SHOULD** debug stacking bugs with browser DevTools rather than by bisecting CSS: Chrome DevTools added first-class inspection of top-layer elements, shipped as a preview in Chrome Canary 105 ("Chrome DevTools are adding support for top layer elements so you can inspect the top layer," Chrome for Developers, 2022).
- **MAY** pair `isolation` with `mix-blend-mode` and `z-index`: MDN notes the property "is especially helpful when used in conjunction with mix-blend-mode and z-index" (MDN, "isolation," 2025).

## Design Thinking

Choosing between z-index and the top layer is a choice between authored order and browser-managed order. Authored z-index keeps every layer's position explicit in your stylesheet, at the cost of the escalation spiral that the Chrome for Developers blog names in its title, "a solution to z-index:10000." Top-layer promotion trades that authored control away: the browser alone places promoted elements above every other layer, regardless of z-index or DOM hierarchy. A second calibration is how a stacking context gets created. Incidental triggers such as `opacity` below 1 or `transform` bundle a stacking context with a visual change; `isolation: isolate` creates one with no other effect, which is why MDN defines it as the property that "determines whether an element must create a new stacking context."

## Deep Dive

**`z-index: 0` versus `z-index: auto`.** For `relative` and `absolute` positioned elements, both values paint at the same Appendix E step, "all positioned descendants with 'z-index: auto' or 'z-index: 0', in tree order." They diverge on context creation: MDN's trigger list requires "a `z-index` value other than `auto`," so `z-index: 0` establishes a new stacking context while `auto` does not. Two visually identical layouts can therefore behave differently the moment a descendant sets its own z-index.

**The z-index: auto split by position type.** CSS Positioned Layout Level 3 draws a finer line: with `z-index: auto`, "fixed and sticky positioned boxes nonetheless form a stacking context," while relative and absolute boxes are only painted as if they formed one, so their positioned descendants and would-be child stacking contexts take part in the current stacking context. A sticky header always seals its contents into one atomic layer; a relative wrapper with `z-index: auto` leaves its positioned children free to interleave with the outside.

**The top layer cannot be targeted.** Per the MDN Glossary, "the top layer is an internal browser concept and cannot be directly manipulated from code. You can target elements placed in the top layer using CSS and JavaScript, but you cannot target the top layer itself."

**Where the normative rules live.** CSS 2 Appendix E remains the normative reference for painting order. The Level 3 positioning draft points readers to "CSS2 § 9.9 Layered presentation and Appendix E: Elaborate description of Stacking Contexts for details about z-index, stacking contexts, and painting order."

## Escape Hatches: isolation, Portals & the Top Layer

Three tools break out of a stacking problem, each at a different layer of the system.

**`isolation: isolate`** works inward. It creates a stacking context on demand, and MDN pairs it with `mix-blend-mode` and `z-index` because isolating a group prevents its blend modes from compositing against content behind the group:

```css
.card {
  isolation: isolate;
}
.card .badge {
  mix-blend-mode: multiply; /* blends against .card only, never the page behind it */
}
```

**Framework portals** work sideways. Portal patterns relocate DOM nodes to escape ancestor stacking contexts and clipping, so the overlay's markup ends up somewhere else in the tree, where no restrictive ancestor context applies.

**The top layer** works upward, without moving anything. Elements promoted to the top layer "needn't worry about z-index or DOM hierarchy" (Chrome for Developers, 2022), so the dialog or popover stays where it was authored in the tree while rendering above the whole document. Top-layer elements and their `::backdrop` pseudo-elements each generate their own stacking context: "elements placed in the top layer generate a new stacking context, as do their corresponding ::backdrop pseudo-elements" (MDN Glossary, 2025). Content inside them stacks in a fresh scope above the page, so the z-index arithmetic of the underlying document never reaches them.

## Related Topics

- [Box Model & Layout Modes](/en/CSS%20and%20Layout%20Systems/202)
- [CSS Containment & contain](/en/CSS%20and%20Layout%20Systems/209)
- [Backdrop Filter, Mix-Blend-Mode & Visual Effects](/en/CSS%20and%20Layout%20Systems/210)
- [Popover API States and Anchor Positioning Integration](/en/HTML%20and%20Semantic%20Markup/popover-states-and-anchor-positioning)

## References

- MDN contributors, "Stacking context," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context
- Bert Bos et al., "Appendix E. Elaborate description of Stacking Contexts," W3C CSS 2.1 Specification (2011). https://www.w3.org/TR/CSS2/zindex.html
- Elika J. Etemad, Tab Atkins Jr., "CSS Positioned Layout Module Level 3," W3C Working Draft (2025). https://www.w3.org/TR/css-position-3/
- MDN contributors, "Top layer," MDN Web Docs Glossary (2025). https://developer.mozilla.org/en-US/docs/Glossary/Top_layer
- Jhey Tompkins, "Meet the top layer: a solution to z-index:10000," Chrome for Developers Blog (2022). https://developer.chrome.com/blog/what-is-the-top-layer
- MDN contributors, "isolation," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation
