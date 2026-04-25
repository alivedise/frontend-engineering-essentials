---
topic: Motion & Animation Tokens
id: 915
slug: motion-tokens
sources_reviewed: 10
claims: 16
---

# Findings: Motion & Animation Tokens — Duration, Easing, Reduced-Motion

**Proposed topic-specific section:** `## Reduced-Motion Token Strategy`.

## Claims

### Claim 1
- **Text:** Motion belongs alongside color/spacing/typography as a first-class token family. Most teams still handle motion informally.
- **Target section:** Context
- **Source URL:** https://designtokens.substack.com/p/motion-tokens-naming-your-movement
- **Pulled quote:** "Color, spacing, typography. Those are the classics when it comes to design tokens. But there's one category that most teams still handle informally: motion."

### Claim 2
- **Text:** Without shared motion tokens, every developer reinvents "fast" with a different duration.
- **Target section:** Context
- **Source URL:** https://designtokens.substack.com/p/motion-tokens-naming-your-movement
- **Pulled quote:** "Without tokens, every developer writes their own version of 'fast' (150ms? 120ms? 200ms?). With motion tokens, 'fast' is a shared value with a shared name."

### Claim 3
- **Text:** Three building blocks: duration, easing, affected property.
- **Target section:** Context
- **Source URL:** https://designtokens.substack.com/p/motion-tokens-naming-your-movement
- **Pulled quote:** "How long it lasts — the duration… How it accelerates and decelerates — the easing (or timing function)… What it applies to — the property (opacity, transform, etc.)."

### Claim 4
- **Text:** DTCG `duration` type: object with numeric `value` + `unit` (`ms` or `s`). Formalised in 2025.10.
- **Target section:** Context
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "Represents the length of time in milliseconds an animation or animation cycle takes to complete… `value`: A number… `unit`: Either `\"ms\"` (millisecond) or `\"s\"` (second)."

### Claim 5
- **Text:** DTCG `cubicBezier`: 4-number array `[P1x, P1y, P2x, P2y]`, x clamped to `[0, 1]`.
- **Target section:** Context
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "The value MUST be an array containing four numbers. These numbers represent two points (P1, P2) with one x coordinate and one y coordinate each [P1x, P1y, P2x, P2y]."

### Claim 6
- **Text:** DTCG `transition` composes `duration`, `delay`, `timingFunction`.
- **Target section:** Design Thinking
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "Represents a animated transition between two states. The `$type` property MUST be set to the string `transition`."

### Claim 7
- **Text:** Material 3 four-tier duration scale: short1-4 (50-200ms), medium1-4 (250-400ms), long1-4 (450-600ms), extra-long1-4 (700-1000ms).
- **Target section:** Visual
- **Source URL:** https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md
- **Pulled quote:** "Short durations: 50ms, 100ms, 150ms, 200ms (short1-4)… Medium… 250ms, 300ms, 350ms, 400ms… Long… 450ms, 500ms, 550ms, 600ms… Extra-long… 700ms, 800ms, 900ms, 1000ms."

### Claim 8
- **Text:** Material 3 easing families: standard + emphasized, each with interpolator/decelerate/accelerate variants.
- **Target section:** Visual
- **Source URL:** https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md
- **Pulled quote:** "Standard Decelerate: 'cubic-bezier: 0, 0, 0, 1'… Emphasized Accelerate: 'cubic-bezier: 0.3, 0, 0.8, 0.15'."

### Claim 9
- **Text:** Carbon: productive (efficient/focused micro-interactions) vs expressive (occasional/important moments).
- **Target section:** Visual
- **Source URL:** https://design-language-website.netlify.app/design/language/motion-ui/basics/
- **Pulled quote:** "Productive motion creates a sense of efficiency and responsiveness, while being subtle… Reserve Expressive motion for occasional, important moments."

### Claim 10
- **Text:** Carbon productive standard easing `cubic-bezier(0.2, 0, 0.38, 0.9)`; expressive standard `cubic-bezier(0.4, 0.14, 0.3, 1)`. Separate entrance/exit variants per mode.
- **Target section:** Example
- **Source URL:** https://design-language-website.netlify.app/design/language/motion-ui/basics/
- **Pulled quote:** "Standard-easing… Productive: `cubic-bezier(0.2, 0, 0.38, 0.9)`… Expressive: `cubic-bezier(0.4, 0.14, 0.3, 1)`."

### Claim 11
- **Text:** Carbon: scale duration by change in distance/size — duration is dynamic, not fixed token.
- **Target section:** Best Practices
- **Source URL:** https://design-language-website.netlify.app/design/language/motion-ui/basics/
- **Pulled quote:** "Motion's duration should be dynamic based on the size of the animation."

### Claim 12
- **Text:** Carbon choreography: 20ms inter-row stagger for entering tables; total sequence under 500ms.
- **Target section:** Best Practices
- **Source URL:** https://v10.carbondesignsystem.com/guidelines/motion/choreography/
- **Pulled quote:** "Staggering the entrance of table content by 20 ms significantly reduces the cognitive load."

### Claim 13
- **Text:** `prefers-reduced-motion: reduce` signals user wants animations removed/reduced/replaced (vestibular disorders).
- **Target section:** Reduced-Motion Token Strategy
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- **Pulled quote:** "Indicates that a user has enabled the setting on their device for reduced motion."

### Claim 14
- **Text:** A `duration-scalar` multiplier (1 default, 0 under reduced-motion) lets every component honor preference without per-component overrides.
- **Target section:** Reduced-Motion Token Strategy
- **Source URL:** https://wwnorton.github.io/design-system/docs/foundations/motion/
- **Pulled quote:** "The `duration-scalar` multiplier automatically becomes `0` when users enable 'prefers-reduced-motion,' ensuring motion preferences are respected."

### Claim 15
- **Text:** WCAG 2.3.3 (AAA): interaction-triggered motion can be disabled unless essential. `prefers-reduced-motion` is a sufficient technique.
- **Target section:** Reduced-Motion Token Strategy
- **Source URL:** https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- **Pulled quote:** "Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed."

### Claim 16
- **Text:** Default pattern: one CSS custom property per token at `:root`, with `@media (prefers-reduced-motion: reduce)` zeroing/shortening site-wide.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- **Pulled quote:** "@media (prefers-reduced-motion: reduce) { .animation { animation: dissolve 4s linear infinite both; … } }"

## Reference URLs

- https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md
- https://m1.material.io/motion/duration-easing.html
- https://design-language-website.netlify.app/design/language/motion-ui/basics/
- https://v10.carbondesignsystem.com/guidelines/motion/choreography/
- https://www.designtokens.org/tr/drafts/format/
- https://designtokens.substack.com/p/motion-tokens-naming-your-movement
- https://wwnorton.github.io/design-system/docs/foundations/motion/
- https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://www.designsystems.com/5-steps-for-including-motion-design-in-your-system/

## Research notes

- m3.material.io is SPA-rendered; substituted with Material Components Android docs (same canonical M3 token table).
- Carbon's main site unfetchable; substituted with IBM Design Language site (canonical IBM source) + v10 archive for choreography.
- Three reduced-motion strategies for the topic-specific section: zero-out (Norton via `duration-scalar`), scalar multiplier, essential subset.
- MDN's "removes, reduces, or replaces" permits replacement (fade for slide).
