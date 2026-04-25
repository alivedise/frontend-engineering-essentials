---
id: 917
title: "Tailwind CSS v4 `@theme` Directive — CSS-First Design Tokens"
state: draft
slug: tailwind-v4-theme-directive
category: Design Systems and UI Libraries
level: mid
---

# [FEE-917] Tailwind CSS v4 `@theme` Directive — CSS-First Design Tokens

:::info
Tailwind CSS v4 relocates project configuration from `tailwind.config.js` into the stylesheet itself through the `@theme` directive. Variables declared inside `@theme` simultaneously generate utility classes and emit `:root` CSS custom properties, collapsing two layers of design-token plumbing into one. The directive replaces the JS config object as the canonical place to define brand colors, fonts, spacing, and breakpoints, and aligns Tailwind with the broader CSS-variable-first token model used by component libraries such as shadcn/ui.
:::

## Context

Earlier Tailwind versions kept design tokens in a JavaScript configuration object that the build step compiled into utility classes. Tailwind v4 reverses that flow: per the v4.0 release notes, "One of the biggest changes in Tailwind CSS v4.0 is the shift from configuring your project in JavaScript to configuring it in CSS." Tokens now live inside CSS, declared through a new at-rule.

The `@theme` directive is the entry point for that workflow. The official theme documentation describes them as "special CSS variables defined using the `@theme` directive that influence which utility classes exist in your project." A single declaration such as `--color-mint-500: oklch(0.72 0.15 165);` drives two outputs at once: a generated `bg-mint-500` (and sibling `text-`, `border-`, `ring-`) utility, plus a `:root { --color-mint-500: ... }` custom property that any non-Tailwind code can read.

This dual-purpose model also matters for component ecosystems built on top of Tailwind. shadcn/ui's v4 generation, for example, "Full support for the new `@theme` directive and `@theme inline` option," with its OKLCH token defaults flowing through the same surface a hand-written design system would use.

## Visual

Each reserved namespace inside `@theme` controls a different family of generated utilities. The Tailwind theme reference enumerates the canonical mapping:

| Namespace        | Utility family                                  | Example declaration                       | Resulting utility    |
| ---------------- | ----------------------------------------------- | ----------------------------------------- | -------------------- |
| `--color-*`      | Color utilities (`bg-`, `text-`, `border-`)     | `--color-mint-500: oklch(0.72 0.15 165);` | `bg-mint-500`        |
| `--font-*`       | Font-family utilities                           | `--font-poppins: "Poppins", sans-serif;`  | `font-poppins`       |
| `--text-*`       | Font-size utilities and paired metadata         | `--text-display: 4rem;`                   | `text-display`       |
| `--spacing-*`    | Spacing and sizing (margin, padding, width)     | `--spacing: 0.25rem;`                     | `p-1`, `mt-3`, `w-8` |
| `--radius-*`     | Border radius utilities                         | `--radius-card: 0.75rem;`                 | `rounded-card`       |
| `--breakpoint-*` | Responsive breakpoint variants                  | `--breakpoint-3xl: 1920px;`               | `3xl:flex`           |

shadcn/ui v4 declares every brand token through this same surface, showing the namespace contract is sufficient for a full component library.

## Example

The following stylesheet shows the typical entry-point shape for a v4 project. The brand colors generate `bg-brand-50` through `bg-brand-900` utilities, the font declaration creates a `font-poppins` class, and the spacing scale variable enables every `p-*`, `m-*`, `w-*`, and `h-*` utility without enumerating individual steps.

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-brand-50:  oklch(0.97 0.02 165);
  --color-brand-500: oklch(0.72 0.15 165);
  --color-brand-900: oklch(0.32 0.10 165);

  --font-poppins: "Poppins", ui-sans-serif, system-ui, sans-serif;

  --spacing: 0.25rem;
}
```

Per the theme documentation, "If another theme variable like `--font-poppins` were defined, a `font-poppins` utility class would become available to go with it." The same naming rule applies to `--color-brand-500` (yields `bg-brand-500`, `text-brand-500`, `border-brand-500`, `ring-brand-500`).

The spacing line is doing more than it appears. The v4.0 release notes describe the new model: "Even spacing utilities like `px-*`, `mt-*`, `w-*`, `h-*`, and more are now dynamically derived from a single spacing scale variable." Setting `--spacing: 0.25rem` means `p-1` resolves to `0.25rem`, `p-3` to `0.75rem`, `p-13` to `3.25rem`, and so on, with no explicit table of allowed steps.

## Best Practices

- **MUST** treat `@theme` variables as the single source of truth for tokens consumed by both utilities and raw CSS. The theme documentation states: "Tailwind also generates regular CSS variables for your theme variables so you can reference your design tokens in arbitrary values or inline styles." A third-party component reading `var(--color-brand-500)` stays in sync with the utility classes automatically.
- **MUST** verify the deployment target supports Safari 16.4, Chrome 111, and Firefox 128 or newer before adopting v4. The upgrade guide states: "Tailwind CSS v4.0 is designed for modern browsers and targets Safari 16.4, Chrome 111, and Firefox 128." The dependency stems from `@property` and `color-mix()` usage in the generated output.
- **SHOULD** wipe the default palette with `--color-*: initial;` inside `@theme` when the project ships only brand colors. The theme documentation specifies the mechanism: "To completely override an entire namespace in the default theme, set the entire namespace to `initial`." This drops the bundled gray/red/blue scales from the emitted stylesheet.
- **MAY** apply the same pattern to `--font-*`, `--spacing-*`, or `--breakpoint-*` namespaces when a design system fully owns those scales. Reset a namespace only when the team is committed to defining replacements.

## Design Thinking

The default palette switch from `rgb()` to `oklch()` is the most visible aesthetic change in v4. The release notes record the decision: "We've upgraded the entire default color palette from `rgb` to `oklch`." OKLCH is a perceptually uniform color space, so the same numeric step in lightness produces a roughly equivalent perceived contrast change across hues. The trade-off is browser support: OKLCH parsing and `color-mix()` are gating features behind the v4 browser baseline. Projects that need to support older browsers must pin to v3 or ship a manual `rgb()` fallback layer; v4 defaults assume the modern baseline is acceptable.

## Deep Dive

The v4 build pipeline rewrite is what makes the CSS-first model practical at scale. The v4 alpha announcement noted: "One dependency — the only thing the new engine depends on is Lightning CSS." The PostCSS-based pipeline used by v3 has been replaced; Lightning CSS plus a Rust-accelerated core handles parsing, transforms, and minification.

Performance numbers from the v4.0 release notes quantify the impact: "Full rebuilds to be over 3.5x faster, and incremental builds to be over 8x faster… these builds are over 100x faster and complete in microseconds." The 100x figure applies to incremental rebuilds where no CSS source has changed, the common case during template-only edits in a dev server. Sub-millisecond rebuilds make the CSS-first config viable: every `@theme` edit refreshes fast enough to feel synchronous in the browser.

## Migration from v3 JS Config

A v3 project carries two artifacts the v4 model relocates: a JavaScript config file and any code that reads back from it.

**Config file discovery.** v3 auto-detected `tailwind.config.js`; v4 does not. The upgrade guide states: "JavaScript config files are still supported for backward compatibility, but they are no longer detected automatically in v4." A team migrating incrementally can keep the JS config alive with an explicit pointer in the entry CSS:

```css
@import "tailwindcss";
@config "../../tailwind.config.js";
```

The longer-term path is to translate `theme.extend` entries into `@theme` variables under the matching namespace from the table above.

**`resolveConfig` removal.** v3 exposed a `resolveConfig` helper for runtime introspection of the merged config, typically used by JS code that needed to render UI matching the design tokens. v4 removes the helper. The upgrade guide states: "We've removed this in v4 in hopes that people can use the CSS variables we generate directly instead, which is much simpler and will significantly reduce your bundle size." Code that called `resolveConfig().theme.colors.brand[500]` should now read `getComputedStyle(document.documentElement).getPropertyValue('--color-brand-500')`, or use `var(--color-brand-500)` in a stylesheet.

**Namespace mapping.** `theme.extend.colors` becomes `--color-*`, `fontFamily` becomes `--font-*`, `spacing` becomes either individual `--spacing-N` entries or a single `--spacing` scale variable, `borderRadius` becomes `--radius-*`, and `screens` becomes `--breakpoint-*`. Custom plugins that registered new utilities have no direct equivalent and must be rewritten as plain CSS rules using the generated custom properties.

## Related Topics

- [DTCG Token Format Spec](/en/Design%20Systems%20and%20UI%20Libraries/dtcg-token-format-spec) — the W3C draft that defines portable JSON token files; pair with `@theme` when tokens originate outside CSS.
- [Style Dictionary 4 Pipeline](/en/Design%20Systems%20and%20UI%20Libraries/style-dictionary-4-pipeline) — multi-platform token compiler; can emit a `@theme` block alongside iOS and Android targets for one source of truth.
- [Design Tokens](/en/Design%20Systems%20and%20UI%20Libraries/901) — the foundational FEE article on the design-token concept that `@theme` operationalizes for Tailwind users.

## References

- Tailwind Labs, "Tailwind CSS v4.0," Tailwind CSS Blog (2025). https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind Labs, "Theme variables," Tailwind CSS Documentation (2025). https://tailwindcss.com/docs/theme
- Tailwind Labs, "Upgrade guide," Tailwind CSS Documentation (2025). https://tailwindcss.com/docs/upgrade-guide
- Tailwind Labs, "Functions and directives," Tailwind CSS Documentation (2025). https://tailwindcss.com/docs/functions-and-directives
- Tailwind Labs, "Open sourcing our progress on Tailwind CSS v4.0," Tailwind CSS Blog (2024). https://tailwindcss.com/blog/tailwindcss-v4-alpha
- shadcn, "Tailwind v4," shadcn/ui Documentation (2025). https://ui.shadcn.com/docs/tailwind-v4
- Tokens Studio, "sd-tailwindv4: Style Dictionary transforms for Tailwind v4," GitHub (2025). https://github.com/tokens-studio/sd-tailwindv4
