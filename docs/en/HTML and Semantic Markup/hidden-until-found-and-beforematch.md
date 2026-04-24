---
id: 110
title: 'hidden="until-found" and the beforematch Event'
state: draft
slug: hidden-until-found-and-beforematch
category: HTML and Semantic Markup
level: mid
---

# [FEE-110] hidden="until-found" and the beforematch Event

:::info
The `hidden` global attribute is enumerated, and its `until-found` keyword state tells the browser to treat content as collapsed yet reachable by in-page search and URL fragment navigation. When a match lands inside such a subtree, the browser fires a bubbling `beforematch` event, removes the `hidden` attribute, and then scrolls the element into view. This pattern makes long FAQs, collapsible documentation, and tabbed sections searchable without forcing the author to write imperative expand-on-Ctrl+F logic. The feature is implemented via `content-visibility: hidden` (not `display: none`), which is why it participates in layout and why a `display` override breaks the reveal.
:::

## Context

HTML has shipped a `hidden` boolean attribute since the WHATWG HTML spec formalised interaction semantics, but the original definition had one rendering mode: hide the element entirely. The attribute has since been upgraded to an enumerated attribute with two keyword states, Hidden and Hidden Until Found, where "The missing value default is the Not Hidden state, while invalid and empty value defaults both map to the Hidden state." The new keyword, `until-found`, writes the collapsed variant into declarative HTML so authoring tools and user agents share the same contract.

The two states differ in what the browser does when a user searches the page or follows a deep link. Hidden content "Will not be rendered"; Hidden Until Found content "Will not be rendered, but content inside will be accessible to find-in-page and fragment navigation." Collapsible UI patterns that previously required JavaScript to open a panel before Ctrl+F could see its text now work without that bridge.

## Visual

| `hidden` state | Renders? | Find-in-page can reach? | Fragment navigation can reach? | Participates in layout? |
| --- | --- | --- | --- | --- |
| Not Hidden (attribute missing) | Yes | Yes | Yes | Yes |
| `hidden` / `hidden=""` / invalid value | No | No | No | No |
| `hidden="until-found"` | No | Yes | Yes | Yes (via `content-visibility: hidden`) |

The third row is the interesting one. Because the element still generates boxes, its borders, padding, and background paint while the content stays invisible, and its contribution to layout stays stable across the reveal.

## Example

A frequently-asked-questions list where every answer starts collapsed, reveals itself when the user searches for a word inside, and animates open via a `beforematch` listener:

```html
<section class="faq">
  <article>
    <h3>
      <button type="button" aria-expanded="false" data-toggle>
        How do I cancel my subscription?
      </button>
    </h3>
    <div id="faq-cancel" class="answer" hidden="until-found">
      <p>Open Settings, choose Billing, then Cancel subscription.</p>
    </div>
  </article>

  <article>
    <h3>
      <button type="button" aria-expanded="false" data-toggle>
        Can I export my data?
      </button>
    </h3>
    <div id="faq-export" class="answer" hidden="until-found">
      <p>Yes. Settings, Data, Export as JSON or CSV.</p>
    </div>
  </article>
</section>

<script>
  // Feature detect: if beforematch is unsupported, expand everything now.
  if (!('onbeforematch' in HTMLElement.prototype)) {
    for (const el of document.querySelectorAll('[hidden="until-found"]')) {
      el.removeAttribute('hidden');
    }
  }

  // Ancestor listener: beforematch bubbles, so one listener covers the section.
  document.querySelector('.faq').addEventListener('beforematch', (event) => {
    const panel = event.target;
    panel.classList.add('is-revealing');
    const button = panel.closest('article').querySelector('[data-toggle]');
    if (button) button.setAttribute('aria-expanded', 'true');
  });

  // Manual toggle path: never require find-in-page to reveal content.
  for (const button of document.querySelectorAll('[data-toggle]')) {
    button.addEventListener('click', () => {
      const panel = button.closest('article').querySelector('.answer');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        panel.setAttribute('hidden', 'until-found');
      } else {
        panel.removeAttribute('hidden');
      }
    });
  }
</script>

<style>
  .answer {
    border-left: 2px solid currentColor;
    padding-inline-start: 0.75rem;
  }
  .answer.is-revealing {
    animation: slide-open 180ms ease-out;
  }
  @keyframes slide-open {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
```

`beforematch` fires immediately before the reveal, so this is the right hook to "run JavaScript to prepare the content, update analytics, or perform other actions before the hidden content becomes visible to the user."

## Best Practices

- **MUST** provide an explicit toggle or expansion affordance in addition to find-in-page. Per the Chrome team, "The `hidden=until-found` content should be revealable without the use of find-in-page," because keyboard users, screen reader users, and mobile users cannot always trigger a find-in-page match.
- **MUST NOT** treat `hidden="until-found"` as a security or privacy boundary. "Elements that are descendants of a hidden element are still active, which means that script elements can still execute, and form elements can still submit." Sensitive markup must be omitted server-side, not hidden client-side.
- **SHOULD** feature-detect with `'onbeforematch' in HTMLElement.prototype` and expand all `until-found` panels on legacy browsers so searchability still works.
- **SHOULD** link to a Hidden Until Found section via `href="#id"` when the deep link is expected to expand it. Hidden elements otherwise "shouldn't be linked from visible elements unless using `hidden=\"until-found\"`."
- **MAY** place decorative borders, backgrounds, and padding on a nested child when they must disappear while the section is collapsed. The `content-visibility: hidden` implementation keeps the container's box painted, so "Add the border to an element nested inside the container that has `hidden=until-found`" is the documented workaround.

## Deep Dive

The reveal mechanism relies on CSS containment. Browsers "typically implement _hidden until found_ using `content-visibility: hidden`. This means that, unlike elements in the _hidden_ state, elements in the _hidden until-found_ state generate boxes, and: they participate in page layout; their margin, borders, padding, and background are rendered." The subtree is skipped for rendering and accessibility until the browser decides to reveal it, which is also why search-engine heuristics can inspect the text cheaply.

`beforematch` bubbles. The WHATWG algorithm states: "Fire an event named `beforematch` at ancestorToReveal with the `bubbles` attribute initialized to true." A single delegated listener on a container can therefore observe reveals inside any descendant, which keeps the event wiring cheap when the page has dozens of collapsible panels.

Scripts and forms inside hidden subtrees still run. The MDN reference warns that "elements that are descendants of a hidden element are still active, which means that script elements can still execute, and form elements can still submit." Authors who assume a collapsed section is inert for side effects will ship bugs: autoplay media, analytics beacons, and form auto-submission all continue to work inside `hidden="until-found"` trees.

## Reveal Timing Model

The reveal is a three-step sequence. When find-in-page or fragment navigation targets Hidden Until Found content, "the browser will: 1. Fire a `beforematch` event on the hidden element 2. Remove the `hidden` attribute from the element 3. Scroll to the element." Event handlers therefore run before the attribute is removed, meaning DOM queries inside the listener still see `hidden="until-found"` on `event.target`. Any synchronous mutation the listener performs (lazy-loading images, wiring up embedded widgets, priming analytics) lands in a stable pre-reveal state.

Layout containment is a precondition. "If the element in the _hidden until found_ state has a `display` value of `none`, `contents`, or `inline`, then the element will not be revealed by 'Find in page' or fragment navigation." Authors who use utility CSS with `display: contents` on list rows, or who set the panel itself to `display: inline` for a flow-style collapse, silently lose the reveal. Stick to block-level display values, or apply the `hidden="until-found"` attribute to a wrapping block element.

Browser support is broad in 2026. Chromium shipped the feature in Chrome 102 in 2022. Firefox's implementation tracked under Bugzilla 1761043 was "resolved and fixed, with Firefox 139 Branch designated as the target milestone." WebKit followed: "Safari 26.2 adds support for the `hidden=\"until-found\"` attribute." All three major engines now ship the feature, so feature detection is primarily a guard for older versions rather than a permanent fallback.

## Related Topics

- [Scroll-to-Text Fragment (URL Text Directives)](/en/HTML%20and%20Semantic%20Markup/scroll-to-text-fragment)
- [HTML APIs & Progressive Enhancement](/en/HTML%20and%20Semantic%20Markup/106)
- [Semantic Elements & Accessibility](/en/HTML%20and%20Semantic%20Markup/102)

## References

- WHATWG, "HTML Living Standard — Interaction." https://html.spec.whatwg.org/multipage/interaction.html
- MDN, "hidden — HTML global attribute." https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- MDN, "Element: beforematch event." https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event
- Chrome for Developers, "Making collapsed content accessible with hidden=until-found." https://developer.chrome.com/docs/css-ui/hidden-until-found
- WebKit, "WebKit Features in Safari 26.2." https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- Mozilla, "Bug 1761043 — Implement hidden=until-found attribute." https://bugzilla.mozilla.org/show_bug.cgi?id=1761043
- CSS-Tricks, "Covering hidden=until-found." https://css-tricks.com/covering-hiddenuntil-found/
