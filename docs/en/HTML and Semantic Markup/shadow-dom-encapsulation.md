---
id: 117
title: "Shadow DOM Encapsulation"
state: draft
slug: shadow-dom-encapsulation
level: mid
---

# [FEE-117] Shadow DOM Encapsulation

:::info
Shadow DOM attaches an encapsulated DOM subtree to an element: styles inside it do not leak out, page styles do not leak in, and `document.querySelector` cannot see past the boundary. Custom Elements get most of the attention in Web Components, but Shadow DOM is a separate primitive that works on a plain `<div>` with no custom element involved. Browsers have relied on the same boundary internally for decades: the `<video>` control bar, the `<input type="range">` thumb, `<details>`'s collapsible region, and the `<select>` dropdown are each built from a shadow tree the browser attaches to itself, which is why styling them means reaching for pseudo-elements such as `::-webkit-media-controls-panel` or `::details-content` instead of ordinary child selectors. This article treats the boundary itself as the subject, independent of the custom-element wrapper FEE-105 builds around it.
:::

## Context

Dimitri Glazkov, an engineer working on the Web Components proposal at Google, wrote in January 2011 that browsers had been "sneakily employing" shadow DOM for years before any page author could use it: an `<input type="range">` already had a track and a thumb, and a `<video>` already had a full control bar, all built as ordinary HTML and CSS hidden inside a subtree JavaScript could not reach (Glazkov, 2011). The proposal that followed generalized that internal mechanism into an authoring API. Shadow DOM v0 shipped behind a flag in Chrome in 2013, the v1 specification was finalized in 2016, and by 2020 every major engine, Chromium, Firefox, and WebKit, shipped it; the full Web Components timeline is covered in [FEE-105: Web Components & Custom Elements](/en/HTML%20and%20Semantic%20Markup/105).

FEE-105 treats Shadow DOM as one ingredient of the Web Components stack, alongside Custom Elements, Templates, and Slots. This article isolates that one ingredient. `attachShadow()` is a method defined on `Element` itself, not on any class registered through `customElements.define()`, so a plain `<div>` can attach a shadow root with no custom element in sight. The distinctive part of the API's history is that it existed inside browsers before it existed for page authors: the public version's entire job is to expose the same boundary the browser was already relying on for its own controls, which is why this article's closing section returns to those controls directly.

[FEE-205: CSS Architecture & Scoping Strategies](/en/CSS%20and%20Layout%20Systems/205) covers the CSS scoping spectrum from naming conventions through `@scope`, with Shadow DOM as the hardest point on that spectrum: the only one enforced by the browser rather than a build tool or a convention. This article picks up where that spectrum ends and covers the boundary's full behavior, not just style scoping but DOM traversal, ARIA references, event propagation, and the browser's own historical use of the same mechanism.

## Visual

The shadow boundary is not one wall. It is several independent walls that happen to sit in the same place: one for script access, one for style rules, one for id references, one for events. Some of these cross in both modes, some never cross, and events cross conditionally based on a flag set at dispatch time.

| What crosses the boundary | Open mode | Closed mode | Why |
|---|---|---|---|
| `element.shadowRoot` read from outside script | Returns the `ShadowRoot` object | Returns `null` | This is the only thing `mode` changes; rendering and DOM structure are identical either way |
| Page CSS selectors and shadow-tree `<style>` rules | Blocked in both directions | Blocked in both directions | Style rules never cross the shadow boundary, regardless of mode |
| Inherited CSS properties (`color`, `font-family`) and custom properties (`--brand-color`) | Inherited in | Inherited in | Custom properties are inherited properties, so they cross the boundary the same way `color` does |
| Elements marked with the `part` attribute | Styleable via `::part()` from the page | Styleable via `::part()` from the page | An explicit, mode-independent styling API |
| `id` references (`aria-describedby`, `for`, `aria-labelledby`, `list`) | Do not resolve across the boundary | Do not resolve across the boundary | Each shadow root is its own tree scope; IDREF attributes resolve only within a single tree scope |
| Events dispatched with `composed: false` (most custom events by default) | Stop at the shadow root | Stop at the shadow root | `composed` is `false` unless the dispatcher opts in |
| Events dispatched with `composed: true` (`click` and other default UI events) | Retargeted, then continue into the page | Retargeted, then continue into the page | `target` is rewritten to the host at every boundary the event crosses |

## Example

### 1. `attachShadow()` on a plain `<div>`

Shadow DOM does not require a custom element. `attachShadow()` is a method on `Element`, so any element on the allowlist covered in User-Agent Shadow DOM below, including a bare `<div>`, can host one.

```html
<div id="widget"></div>
<div id="widget-closed"></div>

<script>
// attachShadow() has nothing to do with customElements.define().
// Either div below could be any element on the allowlist.
const openHost = document.querySelector('#widget');
const openShadow = openHost.attachShadow({ mode: 'open' });
openShadow.innerHTML = `
  <style>
    :host { display: block; border: 1px solid #ccc; border-radius: 8px; padding: 1rem; }
    p { margin: 0; color: #333; }
  </style>
  <p>Rendered from a shadow tree, no custom element involved.</p>
`;

const closedHost = document.querySelector('#widget-closed');
closedHost.attachShadow({ mode: 'closed' }).innerHTML = '<p>Same markup, closed mode.</p>';

// Page-level CSS such as `#widget p { color: red }` cannot reach
// either paragraph: both live in a separate tree scope.
console.log(document.querySelector('#widget p'));    // null
console.log(openHost.shadowRoot.querySelector('p'));  // <p> element
console.log(closedHost.shadowRoot);                   // null

// The closed tree still renders and is still reachable through
// privileged tooling (DevTools' "Show user agent shadow DOM"
// setting, used again later in this article). Closed mode changes
// what one JavaScript property returns; it does not remove the
// content from the page.
</script>
```

### 2. Content projection with `<slot>` and `::slotted()`

```html
<div id="badge-host">
  <strong slot="label">Beta</strong>
  <span>New pricing page</span>
</div>

<script>
const host = document.querySelector('#badge-host');
const shadow = host.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #ccc;
      font-family: system-ui, sans-serif;
    }
    ::slotted(strong) {
      color: #b45309;
      font-weight: 700;
    }
  </style>
  <slot name="label" part="label"></slot>
  <slot></slot>
`;
</script>
```

The named slot (`name="label"`) projects `<strong slot="label">Beta</strong>` into the first `<slot>`. The `<span>` has no `slot` attribute, so it falls into the second, unnamed slot, the default slot that receives every otherwise-unassigned child. `::slotted(strong)` styles the projected `<strong>` from inside the shadow tree; it matches only the top-level slotted node, never a descendant of it, so `::slotted(strong span)` would match nothing. The `part="label"` attribute on the `<slot>` itself is valid. `part` is a global attribute usable on any element in a shadow tree, including a `<slot>`, and it sets up the next example.

### 3. `::part()` and `exportparts` across nested shadow trees

`::part()` only sees parts in the shadow tree of the element it is written against directly. A part one shadow tree deeper is invisible to it unless something forwards it with `exportparts`.

```html
<div id="panel-host"></div>

<style>
  /* "label" lives two shadow trees away from the page, but is
     visible here because badge exports it. */
  #panel-host::part(label) {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #b45309;
  }
</style>

<script>
// Innermost host: its own shadow tree marks one element part="label"
const badge = document.createElement('div');
badge.attachShadow({ mode: 'open' }).innerHTML = `<strong part="label">Beta</strong>`;

// Without this line, #panel-host::part(label) matches nothing:
// "label" belongs to badge's shadow tree, one level too deep for a
// direct parent selector to reach.
badge.setAttribute('exportparts', 'label');

// Outer host: attaches its own shadow tree and places the inner
// host inside it.
const panelHost = document.querySelector('#panel-host');
panelHost.attachShadow({ mode: 'open' }).appendChild(badge);
</script>
```

`exportparts` takes a comma-separated list. `exportparts="label"` is shorthand for `exportparts="label:label"`; the mapping form, `exportparts="innerName:outerName"`, lets an intermediate component rename a part on the way out, so a design-system wrapper can expose `tab` as `nav-tab` to its own consumers without touching the inner component.

## Best Practices

**MUST treat closed mode as a privacy signal, not a security boundary.** `mode: 'closed'` only changes what `element.shadowRoot` returns; the content still renders and is still reachable through other means, including browser extensions running on the page. MDN states this directly: closed mode "should not be considered a strong security mechanism, because there are ways it can be evaded." Do not use closed mode to hide anything that must actually stay confidential, such as unrendered secrets; use it only to signal that a consumer should not be reaching into the internals.

**SHOULD default to open mode.** Open mode keeps DevTools inspection, testing tools, and accessibility tooling working normally, and closed mode buys no real protection in exchange for losing that. Reserve closed mode for cases where you specifically want to discourage traversal, not prevent it.

**MUST NOT rely on ARIA IDREF attributes crossing the shadow boundary.** `aria-describedby`, `for`, `aria-labelledby`, and `list` all resolve their id reference within a single tree scope, and a shadow root is its own tree scope. An id defined in the light DOM is invisible to an element inside a shadow tree, and vice versa. FEE-105's Common Mistake #4 covers this in depth, including the `ElementInternals`-based mitigation for custom elements; the underlying rule is a Shadow DOM property, not a Custom Elements one, so it applies equally to a shadow root attached to a plain `<div>`.

**SHOULD expose a deliberate styling surface instead of leaving consumers to guess.** CSS custom properties for values and `part`/`::part()` for styleable sub-elements are the two mechanisms the platform provides for a component to say, explicitly, what a consumer is allowed to touch. AVOID designing a shadow tree with no styling surface at all if any external consumer will ever need to theme it; that forces a choice between forking the component and abandoning encapsulation, neither of which is a real fix.

**SHOULD reserve `exportparts` for parts that need to reach past one level of nesting.** A single `part` attribute is enough when the styleable element lives directly inside the host's own shadow tree; `exportparts` is only needed when a part lives inside a nested shadow tree that the outer component did not itself define.

**AVOID `:host-context()` as a theming mechanism.** MDN marks it deprecated: "This feature is no longer recommended... it may have already been removed from the relevant web standards, or may be in the process of being dropped." It also never shipped outside Chromium. Reflect ancestor state onto the host as an attribute instead (see Deep Dive), and read that attribute with `:host()`.

## Design Thinking

### What mode actually protects

Every difference in the Visual matrix above collapses to a single fact: mode gates one JavaScript property. Nothing about closed mode stops a page from restyling the host, walking the accessibility tree, or receiving composed events dispatched from inside the shadow tree. What closed mode actually models is the browser's own relationship to its built-in elements: `<input>` and `<img>` have shadow roots that are permanently closed to script, so `element.shadowRoot` on either one is always `null`, no matter what a page does (MDN, Element: shadowRoot property). Choosing closed mode on an author-defined element imitates that relationship. It asserts that a component's internals are implementation detail in the same sense a range slider's thumb is; it does not hide anything that was not already hidden by the shadow boundary itself.

### Encapsulation against themeability

A shadow boundary that blocked everything, including inherited properties and custom properties, would produce components no design system could theme without duplicating every token inside every shadow tree. A boundary that blocked nothing would not be a boundary at all. The platform's answer sits between those two extremes: inherited properties and custom properties cross by default, and `part`/`exportparts` and `::slotted()` add narrow, deliberate holes in the wall for anything else a consumer legitimately needs to touch.

FEE-205 frames Shadow DOM as the end of the CSS scoping spectrum, the point where a boundary stops being a convention teams agree to respect and becomes something the browser enforces. The same trade-off explains why `::part()` exists at all instead of leaving Shadow DOM's encapsulation absolute: themeability that has to be requested through a named surface, `part="tab"`, `--brand-color`, is themeability the component author controls the shape of and can version deliberately. Themeability through open selectors reaching into arbitrary descendants is themeability the component author cannot deprecate without breaking every consumer who found a working selector by accident.

Browsers face the identical trade-off at a larger scale, and how they have resolved it is visible directly in the pseudo-elements covered in User-Agent Shadow DOM below.

## Deep Dive

### Event retargeting: `composed` and `composedPath()`

An event dispatched inside a shadow tree does not automatically reach listeners outside it. Two conditions govern whether it does: `bubbles` must be `true`, and `composed` must be `true`. The WHATWG DOM Standard defines `composed` on the `Event` interface directly: "True if event invokes listeners past a ShadowRoot node that is the root of its target; otherwise false." Most native UI events, `click`, `input`, `pointerdown`, and their relatives, are composed by default. A `CustomEvent` is not composed unless the dispatcher passes `{ composed: true }` explicitly, and `slotchange` is not composed at all, so it never reaches a listener outside the shadow root where the slot lives.

When a composed, bubbling event does cross the boundary, its `target` is retargeted at every shadow root it passes through: a listener outside the shadow tree never sees a target deeper than the nearest shadow host, even though the event genuinely originated on an element several levels inside that host's shadow tree.

```js
const host = document.querySelector('#widget');
const button = host.shadowRoot.querySelector('button');

document.addEventListener('click', (e) => {
  console.log(e.target);            // <div id="widget"> -- retargeted
                                     // to the host, not the button
  console.log(e.composedPath()[0]); // <button> -- the true origin is
                                     // still recoverable via composedPath()
});

button.addEventListener('click', (e) => {
  console.log(e.target); // <button> -- inside the same tree scope,
                          // target is not retargeted
});
```

`composedPath()` returns the full propagation path, host and all, so code that specifically needs the true origin of an event, rather than the boundary-safe retargeted one, can still recover it. A component dispatching its own signal across the boundary has to opt in explicitly:

```js
host.dispatchEvent(new CustomEvent('widget-ready', {
  bubbles: true,
  composed: true, // without this, the event never leaves the shadow tree
  detail: { ready: true },
}));
```

### `:host`, `:host()`, and the deprecated `:host-context()`

`:host` selects the shadow host from inside its own shadow tree and has no effect anywhere else. `:host()` takes a compound selector and matches the host only when that selector also matches, which is how conditional host styling works:

```css
:host { display: block; }
:host([disabled]) { opacity: 0.5; }
:host(.compact) { padding: 0.25rem; }
```

`:host-context()` was meant to solve a different problem: styling the host based on an *ancestor* outside the shadow tree, such as a `dark-theme` class on `<body>`. MDN now marks it deprecated, and it shipped only in Chromium. The portable replacement is to have the ancestor state reflected onto the host itself, as an attribute, and let the component only ever inspect itself:

```css
/* Deprecated, Chromium-only: reaches out through the boundary to
   inspect an arbitrary ancestor */
:host-context(.dark-theme) { background: #1a1a1a; }

/* Portable alternative: something outside the component reflects
   ancestor state onto the host; the component only inspects itself */
:host([theme="dark"]) { background: #1a1a1a; }
```

```js
// Application setup code, not the component itself:
if (document.body.classList.contains('dark-theme')) {
  myWidget.setAttribute('theme', 'dark');
}
```

### Declarative Shadow DOM for SSR

`attachShadow()` requires JavaScript, which means a server-rendered page has no shadow content in its initial HTML: the shadow tree only appears once a script runs, producing a flash of unstyled or empty content on slow connections. Declarative Shadow DOM (DSD) closes that gap. A `<template>` with a `shadowrootmode` attribute is recognized directly by the HTML parser and attaches its content as a shadow root on the parent element with no script involved:

```html
<div id="badge-host">
  <template shadowrootmode="open">
    <style>
      :host { display: inline-flex; align-items: center; gap: 0.5rem; }
      ::slotted(strong) { color: #b45309; font-weight: 700; }
    </style>
    <slot name="label" part="label"></slot>
    <slot></slot>
  </template>
  <strong slot="label">Beta</strong>
  <span>New pricing page</span>
</div>
```

This is the plain-`<div>` example from earlier in this article, made server-renderable: still no custom element required. `shadowrootmode` accepts `open` or `closed`. Related boolean attributes on the same `<template>`, `shadowrootdelegatesfocus`, `shadowrootclonable`, and `shadowrootserializable`, set the corresponding `ShadowRoot` properties (WHATWG HTML Standard, the template element).

Two footguns are specific to DSD. First, it is parser-only: a declarative shadow root attaches only for `<template shadowrootmode>` markup present while the HTML parser is running, including streamed HTML. Setting the attribute afterward with JavaScript does nothing, and inserting the same markup through `innerHTML` does nothing either, for security reasons; programmatic creation requires `setHTMLUnsafe()` or `Document.parseHTMLUnsafe()` instead. Second, watch the attribute name in older material: an earlier, non-standard `shadowroot` attribute shipped in Chrome 90 before the feature was renamed to `shadowrootmode` in 2023. DSD reached Baseline, meaning Chromium, Firefox, and WebKit all shipped the current `shadowrootmode` syntax, in August 2024, with the fully spec-compliant version landing in Chrome and Edge 124, Firefox 123, and Safari 16.4 (web.dev, Declarative shadow DOM).

## User-Agent Shadow DOM

`Element.prototype.attachShadow()` only works on a specific allowlist: `<article>`, `<aside>`, `<blockquote>`, `<body>`, `<div>`, `<footer>`, `<h1>`&ndash;`<h6>`, `<header>`, `<main>`, `<nav>`, `<p>`, `<section>`, `<span>`, and any valid autonomous custom element (MDN, Element.attachShadow()). `<input>`, `<video>`, `<select>`, `<details>`, and `<img>` are conspicuously absent from that list. Calling `attachShadow()` on any of them throws a `NotSupportedError`, and the reason is not arbitrary: each of those elements already manages its own shadow tree, created and owned by the browser, and the platform does not allow a second one layered on top.

This is exactly the mechanism Glazkov described in 2011: a range slider's track and thumb, a video's control bar, all "just HTML and CSS, hidden inside of a shadow DOM subtree" (Glazkov, 2011). MDN confirms the modern version of the same fact directly: "Some built-in elements, such as `<input>` and `<img>`, have user-agent shadow roots that are closed to script. Therefore, their `shadowRoot` property is always `null`" (MDN, Element: shadowRoot property). A built-in element's shadow root is not merely closed in the sense Example 1 demonstrated; it is inaccessible to `attachShadow()` entirely, so it can never even be replaced.

### Inspecting it

Chromium-based browsers can reveal this tree directly. In DevTools, open Settings (F1), enable "Show user agent shadow DOM," then select any element with built-in structure in the Elements panel: a `Shadow root (user-agent)` node appears with the browser's real internal markup underneath it (devtoolstips.org, Inspect the user-agent DOM). A `<video controls>` element expands into "a bunch of nested DOM nodes... to display the controls, the progress bar, etc.," and an `<input type="range">` reveals its track and thumb as separate nodes, the same nodes the pseudo-elements below target.

### What is standardized and what is not

| Element | UA shadow content | Styling surface | Standardized? |
|---|---|---|---|
| `<video controls>` | Play/pause, timeline, volume, fullscreen, in a control panel | `::-webkit-media-controls-panel` and sibling `-webkit-media-controls-*` pseudo-elements. Chromium and WebKit only; Firefox exposes no equivalent styling hooks | No. Chromium considered removing these entirely in 2014 after a fuzzer found that a page overriding `display` on an internal control could crash the renderer (blink-dev mailing list, 2014); many were later renamed to an internal-only `::-internal-media-controls-*` prefix specifically to keep them out of author reach |
| `<input type="range">` | A track and a thumb | `::-webkit-slider-thumb` / `::-webkit-slider-runnable-track` (Chromium, WebKit); `::-moz-range-thumb` / `::-moz-range-track` / `::-moz-range-progress` (Firefox) | No. MDN's reference page for `::-webkit-slider-thumb` states plainly: "It is not part of any standard" |
| `<details>` + `<summary>` | The collapsible content region | `::details-content` | Yes. Reached Baseline in September 2025 |
| `<select>` (opted in with `appearance: base-select`) | The drop-down picker and its icon | `::picker(select)`, `::picker-icon` | Emerging. Requires explicit opt-in on both the select and the picker; not yet Baseline as of 2026 |

The gap between the top two rows and the bottom two is the gap between an implementation detail browsers back into styling gradually, and a standards-track feature designed for styling from the start. `::-webkit-slider-thumb` works today because Chromium and WebKit chose to expose it, not because a specification requires either engine to. `::details-content` works because the CSS Working Group defined it as a real pseudo-element with cross-engine agreement behind it. Treat the two categories differently: build on the standardized ones, and treat the `-webkit-`/`-moz-` ones as a compatibility layer that could change shape, the same caution Chromium's own 2014 discussion urged for its own pseudo-elements.

### Why this is the same primitive, not an analogy

The point is not that native controls resemble Shadow DOM. `attachShadow()`'s allowlist, the retargeting behavior described in Deep Dive, and the tree-scope rule behind the ARIA footgun in Best Practices all apply to these elements' internal trees as much as to an author's own, because they are the same kind of tree. A `<select>` with `appearance: base-select` makes this concrete: it is the platform deliberately renegotiating a UA shadow boundary, admitting a real, author-supplied `<button>` as the select's first light-DOM child where "classic" selects allow none, while still keeping the picker itself behind `::picker(select)`. Building a custom dropdown from scratch means re-deriving keyboard navigation, focus management, and platform-specific behavior that the native `<select>`'s shadow tree already has; learning its styling surface, non-standard as parts of it are, keeps that behavior while changing only the appearance.

## Related Topics

- [Media, Embedding & Interactive Elements](/en/HTML%20and%20Semantic%20Markup/104)
- [Web Components & Custom Elements](/en/HTML%20and%20Semantic%20Markup/105)
- [CSS Architecture & Scoping Strategies](/en/CSS%20and%20Layout%20Systems/205)

## References

- Dimitri Glazkov, "What the Heck is Shadow DOM?," glazkov.com (2011). https://glazkov.com/2011/01/14/what-the-heck-is-shadow-dom/
- MDN Contributors, "Using shadow DOM," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
- MDN Contributors, "Element: attachShadow() method," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
- MDN Contributors, "Element: shadowRoot property," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot
- MDN Contributors, "ShadowRoot," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
- MDN Contributors, "Event: composed property," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
- MDN Contributors, "::part," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::part
- MDN Contributors, "::slotted," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::slotted
- MDN Contributors, ":host," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/:host
- MDN Contributors, ":host-context," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/:host-context
- MDN Contributors, "exportparts," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/exportparts
- MDN Contributors, "::-webkit-slider-thumb," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-slider-thumb
- MDN Contributors, "::details-content," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::details-content
- MDN Contributors, "Customizable select elements," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select
- web.dev, "Declarative shadow DOM," web.dev (2024). https://web.dev/articles/declarative-shadow-dom
- W3C, "CSS Shadow Parts Module Level 1," W3C Working Draft (2025). https://www.w3.org/TR/css-shadow-parts-1/
- WHATWG, "DOM Standard," WHATWG (2026). https://dom.spec.whatwg.org/#retarget
- WHATWG, "HTML Standard: The template element," WHATWG (2026). https://html.spec.whatwg.org/multipage/scripting.html#the-template-element
- Philip Jägenstedt et al., "Intent to Deprecate and Remove: ::-webkit-media-controls* pseudo-element selectors," blink-dev mailing list (2014). https://groups.google.com/a/chromium.org/g/blink-dev/c/YCIaYPa_DhI
- devtoolstips.org, "Inspect the user-agent DOM," DevTools Tips (2026). https://devtoolstips.org/tips/en/inspect-user-agent-dom/
