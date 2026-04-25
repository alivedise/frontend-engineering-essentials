---
topic: Fluid Typography & Type Scale Tokens
id: 916
slug: fluid-typography-tokens
sources_reviewed: 11
claims: 15
---

# Findings: Fluid Typography & Type Scale Tokens

**Proposed topic-specific section:** `## WCAG 1.4.4 Compliance Strategy`.

## Claims

### Claim 1
- **Text:** Fluid typography produces a continuous change in `font-size` across viewport widths instead of step-changing at breakpoints.
- **Target section:** Context
- **Source URL:** https://web.dev/articles/baseline-in-action-fluid-type
- **Pulled quote:** "The change in `font-size` is constant over a range of viewport widths, rather than jumping from one value to another."

### Claim 2
- **Text:** CSS `clamp(min, preferred, max)` resolves to `max(MIN, min(VAL, MAX))` — the canonical primitive for fluid type.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
- **Pulled quote:** "`clamp(MIN, VAL, MAX)` is resolved as `max(MIN, min(VAL, MAX))`."

### Claim 3
- **Text:** `clamp()` Baseline since July 2020.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
- **Pulled quote:** "It's been available across browsers since July 2020."

### Claim 4
- **Text:** WCAG 1.4.4 (AA): text MUST resize up to 200% without assistive tech, without loss of content/functionality.
- **Target section:** WCAG 1.4.4 Compliance Strategy
- **Source URL:** https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html
- **Pulled quote:** "text can be resized without assistive technology up to 200 percent without loss of [content or functionality]."

### Claim 5
- **Text:** Viewport units (`vw`, `vi`) DO NOT respond to user zoom. Pure-`vw` upper bound prevents 200% reach → fails 1.4.4.
- **Target section:** WCAG 1.4.4 Compliance Strategy
- **Source URL:** https://adrianroselli.com/2019/12/responsive-type-and-zoom.html
- **Pulled quote:** "When people zoom a page, it is typically because they want the text to be bigger. When we anchor the text to the viewport size...we can take away their ability to do that."

### Claim 6
- **Text:** A `clamp()` whose max is ≥ 2.5x its min (max in `rem`) keeps text reachable at 200% zoom.
- **Target section:** WCAG 1.4.4 Compliance Strategy
- **Source URL:** https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/
- **Pulled quote:** "The maximum value must be less than or equal to 2.5 times the minimum value."

### Claim 7
- **Text:** MDN guidance: cap with relative unit, max ≥ 2x min.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
- **Pulled quote:** "When `clamp()` is used for controlling text size, make sure that the maximum allowed value is a relative length unit that is no less than twice the minimum allowed value."

### Claim 8
- **Text:** Mixing pixel offset with viewport unit (`calc(16px + 1vw)`) restores partial zoom responsiveness.
- **Target section:** Deep Dive
- **Source URL:** https://web.dev/articles/baseline-in-action-fluid-type
- **Pulled quote:** "`font-size` of `calc(16px + 1vw)` is based on both the viewport size, and also the current (zoom-relative) size of a pixel."

### Claim 9
- **Text:** Utopia fluid type calculator: (min viewport, max viewport, min font-size, max font-size, scale ratio) → one `clamp()` per step.
- **Target section:** WCAG 1.4.4 Compliance Strategy
- **Source URL:** https://utopia.fyi/type/calculator/
- **Pulled quote:** "`--step-0: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)`"

### Claim 10
- **Text:** Utopia design intent: two scales (tighter at small viewports, more dramatic at large), interpolated continuously.
- **Target section:** Design Thinking
- **Source URL:** https://utopia.fyi/blog/designing-with-fluid-type-scales
- **Pulled quote:** "a typographic scale of 1.2x at 320px (mobile-ish) and 1.333x at 1500px (desktop-ish)."

### Claim 11
- **Text:** Preferred-value formula: `slope = (maxSize − minSize) / (maxWidth − minWidth)`, then `font-size: clamp(minSize, intercept + slope*100vw, maxSize)`.
- **Target section:** Example
- **Source URL:** https://utopia.fyi/blog/clamp/
- **Pulled quote:** "Slope = (MaxSize - MinSize) / (MaxWidth - MinWidth) / yIntersection = (-1 * MinWidth) * Slope + MinSize / font-size: clamp(MinSize[rem], yIntersection[rem] + Slope * 100vw, MaxSize[rem])"

### Claim 12
- **Text:** CSS `pow()` (Baseline 2023) generates modular scale from a single ratio.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/pow
- **Pulled quote:** "The `pow()` function can be useful for strategies like CSS Modular Scale."

### Claim 13
- **Text:** DTCG `typography` composite bundles `fontFamily`, `fontSize`, `fontWeight`, `lineHeight` (and `letterSpacing` by convention).
- **Target section:** Best Practices
- **Source URL:** https://www.designtokens.org/TR/drafts/format/
- **Pulled quote:** "`{ \"$value\": { \"fontFamily\": [...], \"fontSize\": {...}, \"fontWeight\": 400, \"lineHeight\": 1.5 }, \"$type\": \"typography\" }`"

### Claim 14
- **Text:** Material 3 typography: 5 roles (display/headline/title/body/label) × 3 sizes (large/medium/small) = 15 tokens.
- **Target section:** Example
- **Source URL:** https://material-web.dev/theming/typography/
- **Pulled quote:** "Tokens follow the naming convention `--md-sys-typescale-<scale>-<size>-<property>`."

### Claim 15
- **Text:** Heavy viewport-anchoring trades responsiveness for user agency: more `font-size` → viewport, less → user preferences.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/articles/baseline-in-action-fluid-type
- **Pulled quote:** "The more your typography responds to the viewport, the less it will respond to user preferences."

## Reference URLs

- https://web.dev/articles/baseline-in-action-fluid-type
- https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
- https://developer.mozilla.org/en-US/docs/Web/CSS/pow
- https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html
- https://adrianroselli.com/2019/12/responsive-type-and-zoom.html
- https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/
- https://utopia.fyi/type/calculator/
- https://utopia.fyi/blog/clamp/
- https://utopia.fyi/blog/designing-with-fluid-type-scales
- https://www.designtokens.org/TR/drafts/format/
- https://material-web.dev/theming/typography/

## Research notes

- 2.5x ceiling (Barvian) and 2x rule (MDN) not contradictory: 2x is floor, 2.5x is safer working target.
- DTCG typography is Draft Community Group Report, not W3C Recommendation. Frame as "de facto interchange".
- WCAG 2.2 keeps 1.4.4 unchanged from 2.1.
- Drop `calc-size()` from coverage (2025 proposal, animation-only).
