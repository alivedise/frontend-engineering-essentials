---
id: 915
title: "Motion & Animation Tokens — Duration, Easing, Reduced-Motion"
state: draft
slug: motion-tokens
category: Design Systems and UI Libraries
level: mid
---

# [FEE-915] Motion & Animation Tokens — Duration, Easing, Reduced-Motion

:::info
Motion tokens promote duration, easing, and the property a transition targets to first-class design-system primitives, alongside color, spacing, and typography. This article surveys how Material 3 and Carbon scale their motion catalogs, how the W3C Design Tokens Community Group (DTCG) draft formalises `duration`, `cubicBezier`, and composite `transition` types, and how to wire `prefers-reduced-motion` into a token pipeline so accessibility falls out for free. The reduced-motion strategy belongs at the token layer so a single override propagates to every component.
:::

## Context

Color, spacing, and typography are the classics of the design-token world. Motion is the category most teams still handle informally, even though every interactive surface ships transitions ([Design Tokens Substack, "Motion tokens: naming your movement"](https://designtokens.substack.com/p/motion-tokens-naming-your-movement)). The cost of leaving motion out of the catalog is duplication: each developer reaches for a personal default for "fast"; one component picks 120 ms, the next 150 ms, the next 200 ms, and the system loses its rhythm. A shared motion vocabulary collapses those guesses into a named value with an agreed meaning.

Three primitives compose every animation: how long it lasts (duration), how it accelerates and decelerates (easing, also called the timing function), and what it applies to (the property — `opacity`, `transform`, and so on). The DTCG draft format (revision 2025.10) formalises the first two as token types: a `duration` is an object with a numeric `value` and a `unit` of either `ms` or `s`; a `cubicBezier` is a four-number array `[P1x, P1y, P2x, P2y]` where the x coordinates are clamped to `[0, 1]` ([DTCG Format Module draft](https://www.designtokens.org/tr/drafts/format/)).

## Visual

| System | Tier | Token / Variant | Value |
| --- | --- | --- | --- |
| Material 3 | short1–4 | duration | 50, 100, 150, 200 ms |
| Material 3 | medium1–4 | duration | 250, 300, 350, 400 ms |
| Material 3 | long1–4 | duration | 450, 500, 550, 600 ms |
| Material 3 | extra-long1–4 | duration | 700, 800, 900, 1000 ms |
| Carbon | productive | standard easing | `cubic-bezier(0.2, 0, 0.38, 0.9)` |
| Carbon | expressive | standard easing | `cubic-bezier(0.4, 0.14, 0.3, 1)` |

Material 3 lays out a sixteen-step duration scale across four tiers ([Material Components Android, Motion documentation](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)). Carbon splits its catalog along a different axis: productive motion serves efficient, focused micro-interactions, while expressive motion is reserved for occasional, important moments that benefit from a heavier curve ([IBM Design Language, Motion basics](https://design-language-website.netlify.app/design/language/motion-ui/basics/)).

## Example

A DTCG-shaped composite `transition` token references duration and easing primitives, and a CSS layer projects them into custom properties at `:root`. The `prefers-reduced-motion` media query then zeroes the duration site-wide.

```json
{
  "motion": {
    "duration": {
      "fast":     { "$type": "duration",    "$value": { "value": 150, "unit": "ms" } },
      "moderate": { "$type": "duration",    "$value": { "value": 300, "unit": "ms" } }
    },
    "easing": {
      "productive-standard": {
        "$type": "cubicBezier",
        "$value": [0.2, 0, 0.38, 0.9]
      }
    },
    "transition": {
      "hover": {
        "$type": "transition",
        "$value": {
          "duration":       "{motion.duration.fast}",
          "delay":          { "value": 0, "unit": "ms" },
          "timingFunction": "{motion.easing.productive-standard}"
        }
      }
    }
  }
}
```

```css
:root {
  --motion-duration-fast: 150ms;
  --motion-duration-moderate: 300ms;
  --motion-easing-productive-standard: cubic-bezier(0.2, 0, 0.38, 0.9);
}

.button {
  transition:
    background-color var(--motion-duration-fast)
                     var(--motion-easing-productive-standard);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-moderate: 0ms;
  }
}
```

The `@media (prefers-reduced-motion: reduce)` block is the canonical place to suppress motion site-wide ([MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).

## Best Practices

- **SHOULD** scale duration by the size or distance of the change, rather than treating one duration token as universal: a sheet that slides 400 px should not finish in the same time as a chip that fades in place ([IBM Design Language, Motion basics](https://design-language-website.netlify.app/design/language/motion-ui/basics/)).
- **SHOULD** stagger entering rows in tables and lists by 20 ms per row, keeping the total sequence under 500 ms, so cognitive load stays low when many elements arrive at once ([Carbon v10, Choreography](https://v10.carbondesignsystem.com/guidelines/motion/choreography/)).
- **MUST** name motion tokens by intent (`duration.fast`, `easing.productive-standard`) rather than by raw number, so the value can shift without renaming every reference.
- **MAY** carry the affected property as a third token field when a token pipeline targets platforms beyond CSS (iOS, Android), where transitions need explicit property bindings.

## Design Thinking

The DTCG `transition` type is a deliberate composition. A `transition` token has the `$type` of `transition` and bundles a `duration`, a `delay`, and a `timingFunction`, each of which can be a literal value or an alias to another token ([DTCG Format Module draft](https://www.designtokens.org/tr/drafts/format/)). That layered shape buys two properties at once: the primitives stay reusable across many transitions, and a single `transition` token captures the entire intent of a motion at the call site. Tools that translate tokens into CSS, Swift, or Compose can then emit the right surface form per platform without re-deriving what "hover" means.

## Deep Dive

A `duration` token serialises as `{ "value": <number>, "unit": "ms" | "s" }`, which keeps numeric arithmetic possible at the build step (a transform can multiply value while leaving unit alone). A `cubicBezier` token is a four-number array `[P1x, P1y, P2x, P2y]`, with x coordinates constrained to `[0, 1]` so the curve remains a valid timing function ([DTCG Format Module draft](https://www.designtokens.org/tr/drafts/format/)). Material 3 publishes its named easings in the same cubic-Bezier shape — `Standard Decelerate` is `cubic-bezier(0, 0, 0, 1)`, `Emphasized Accelerate` is `cubic-bezier(0.3, 0, 0.8, 0.15)` — which makes round-tripping between the M3 catalog and a DTCG token file mechanical ([Material Components Android, Motion documentation](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)).

## Reduced-Motion Token Strategy

`prefers-reduced-motion: reduce` is the user signal that animations should be removed, reduced, or replaced — for example, swapping a slide for a fade — to accommodate vestibular disorders and other motion sensitivities ([MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). WCAG 2.3.3 (AAA, "Animation from Interactions") requires that interaction-triggered motion can be disabled unless the animation is essential to the functionality or information being conveyed; honoring `prefers-reduced-motion` is listed as a sufficient technique ([W3C, Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)). A token-based system has three viable strategies for meeting that bar.

**Strategy 1: zero-out at the token layer.** Inside `@media (prefers-reduced-motion: reduce)`, override every duration custom property to `0ms`. Components keep their existing `transition` declarations untouched; the durations collapse to zero and the transitions complete instantly. This is the simplest pattern and the one MDN's reference example demonstrates ([MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).

**Strategy 2: scalar multiplier.** Define a `--motion-duration-scalar` custom property (default `1`) that multiplies every emitted duration. Under reduced motion, set the scalar to `0`, and every component that derives its duration from a token honors the preference automatically — no per-component override required ([Norton Design System, Motion foundations](https://wwnorton.github.io/design-system/docs/foundations/motion/)). The scalar is also useful for non-accessibility tuning, such as a debug mode that runs all transitions at half speed.

**Strategy 3: essential subset.** WCAG carves out an exception for animations essential to functionality or information ([W3C, Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)). The token-system response is to mark a small subset of tokens — a loading-spinner duration, a progress-bar timing — as essential and skip them in the reduced-motion override. The remaining catalog still zeroes out, but the spinner keeps spinning. Strategies 1 or 2 carry the bulk of the work; the essential subset is a targeted addendum.

The default pattern declares one CSS custom property per token at `:root` and uses `@media (prefers-reduced-motion: reduce)` to rewrite the durations site-wide ([MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).

## Related Topics

- [FEE-910 DTCG Token Format Spec](/en/Design%20Systems%20and%20UI%20Libraries/dtcg-token-format-spec)
- [FEE-901 Design Tokens](/en/Design%20Systems%20and%20UI%20Libraries/901)
- [FEE-905 Theming & Dark Mode](/en/Design%20Systems%20and%20UI%20Libraries/905)

## References

- Material Components Android, "Motion." https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md
- Google, "Material Design 1 — Duration & easing." https://m1.material.io/motion/duration-easing.html
- IBM Design Language, "Motion / Basics." https://design-language-website.netlify.app/design/language/motion-ui/basics/
- Carbon Design System v10, "Motion / Choreography." https://v10.carbondesignsystem.com/guidelines/motion/choreography/
- W3C Design Tokens Community Group, "Design Tokens Format Module (Editor's Draft)." https://www.designtokens.org/tr/drafts/format/
- Design Tokens Substack, "Motion tokens: naming your movement." https://designtokens.substack.com/p/motion-tokens-naming-your-movement
- W. W. Norton Design System, "Foundations / Motion." https://wwnorton.github.io/design-system/docs/foundations/motion/
- W3C, "Understanding Success Criterion 2.3.3 — Animation from Interactions." https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- MDN Web Docs, "@media / prefers-reduced-motion." https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Design Systems, "5 steps for including motion design in your system." https://www.designsystems.com/5-steps-for-including-motion-design-in-your-system/
