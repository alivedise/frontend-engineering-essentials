---
topic: Tailwind CSS v4 @theme Directive
id: 917
slug: tailwind-v4-theme-directive
sources_reviewed: 7
claims: 15
---

# Findings: Tailwind CSS v4 `@theme` Directive — CSS-First Design Tokens

**Proposed topic-specific section:** `## Migration from v3 JS Config`.

## Claims

### Claim 1
- **Text:** Tailwind v4 moves project config from `tailwind.config.js` into the CSS file itself.
- **Target section:** Context
- **Source URL:** https://tailwindcss.com/blog/tailwindcss-v4
- **Pulled quote:** "One of the biggest changes in Tailwind CSS v4.0 is the shift from configuring your project in JavaScript to configuring it in CSS."

### Claim 2
- **Text:** `@theme` declares special CSS variables that simultaneously generate Tailwind utility classes AND CSS custom properties.
- **Target section:** Context
- **Source URL:** https://tailwindcss.com/docs/theme
- **Pulled quote:** "Theme variables are special CSS variables defined using the `@theme` directive that influence which utility classes exist in your project."

### Claim 3
- **Text:** Reserved namespaces: `--color-*`, `--font-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--breakpoint-*`. Each controls a utility class family.
- **Target section:** Migration from v3 JS Config
- **Source URL:** https://tailwindcss.com/docs/theme
- **Pulled quote:** "| `--color-*` | Color utilities like `bg-red-500`, `text-sky-300`, and many more | … | `--spacing-*` | Spacing and sizing utilities | | `--radius-*` | Border radius utilities | | `--breakpoint-*` | Responsive breakpoint variants |"

### Claim 4
- **Text:** Naming a variable in a namespace auto-creates the matching utility (`--font-poppins` → `font-poppins` class).
- **Target section:** Example
- **Source URL:** https://tailwindcss.com/docs/theme
- **Pulled quote:** "If another theme variable like `--font-poppins` were defined, a `font-poppins` utility class would become available to go with it."

### Claim 5
- **Text:** Every theme variable compiles to a `:root` CSS custom property; designers/frameworks can read tokens via `var(--color-mint-500)` outside any utility.
- **Target section:** Best Practices
- **Source URL:** https://tailwindcss.com/docs/theme
- **Pulled quote:** "Tailwind also generates regular CSS variables for your theme variables so you can reference your design tokens in arbitrary values or inline styles."

### Claim 6
- **Text:** v4 ships OKLCH default palette, replacing prior `rgb()` palette for wider gamut.
- **Target section:** Design Thinking
- **Source URL:** https://tailwindcss.com/blog/tailwindcss-v4
- **Pulled quote:** "We've upgraded the entire default color palette from `rgb` to `oklch`."

### Claim 7
- **Text:** Wipe a namespace with `--color-*: initial` to drop default palette, leaving only brand tokens.
- **Target section:** Best Practices
- **Source URL:** https://tailwindcss.com/docs/theme
- **Pulled quote:** "To completely override an entire namespace in the default theme, set the entire namespace to `initial`."

### Claim 8
- **Text:** v4 depends only on Lightning CSS + Rust-accelerated core. PostCSS pipeline eliminated.
- **Target section:** Deep Dive
- **Source URL:** https://tailwindcss.com/blog/tailwindcss-v4-alpha
- **Pulled quote:** "One dependency — the only thing the new engine depends on is Lightning CSS."

### Claim 9
- **Text:** Performance: full builds 3.5x+ faster, incremental rebuilds 8x+, no-CSS-change incremental 100x+ in microseconds.
- **Target section:** Deep Dive
- **Source URL:** https://tailwindcss.com/blog/tailwindcss-v4
- **Pulled quote:** "Full rebuilds to be over 3.5x faster, and incremental builds to be over 8x faster… these builds are over 100x faster and complete in _microseconds_."

### Claim 10
- **Text:** v4 targets Safari 16.4+, Chrome 111+, Firefox 128+. Depends on `@property` and `color-mix()`.
- **Target section:** Best Practices
- **Source URL:** https://tailwindcss.com/docs/upgrade-guide
- **Pulled quote:** "Tailwind CSS v4.0 is designed for modern browsers and targets Safari 16.4, Chrome 111, and Firefox 128."

### Claim 11
- **Text:** v3 JS config still supported via explicit `@config "../../tailwind.config.js"` but auto-discovery is gone.
- **Target section:** Migration from v3 JS Config
- **Source URL:** https://tailwindcss.com/docs/upgrade-guide
- **Pulled quote:** "JavaScript config files are still supported for backward compatibility, but they are no longer detected automatically in v4."

### Claim 12
- **Text:** v3 `resolveConfig` helper deleted in v4. Read generated CSS variables directly instead.
- **Target section:** Migration from v3 JS Config
- **Source URL:** https://tailwindcss.com/docs/upgrade-guide
- **Pulled quote:** "We've removed this in v4 in hopes that people can use the CSS variables we generate directly instead, which is much simpler and will significantly reduce your bundle size."

### Claim 13
- **Text:** shadcn/ui v4 generation declares tokens through `@theme` (or `@theme inline`), HSL → OKLCH.
- **Target section:** Visual
- **Source URL:** https://ui.shadcn.com/docs/tailwind-v4
- **Pulled quote:** "Full support for the new `@theme` directive and `@theme inline` option."

### Claim 14
- **Text:** v4 spacing utilities derived dynamically from a single `--spacing` scale variable. Any multiple available without enumeration.
- **Target section:** Example
- **Source URL:** https://tailwindcss.com/blog/tailwindcss-v4
- **Pulled quote:** "Even spacing utilities like `px-*`, `mt-*`, `w-*`, `h-*`, and more are now dynamically derived from a single spacing scale variable."

### Claim 15
- **Text:** When teams maintain tokens in Style Dictionary for multi-platform output, emit a `@theme` block from Style Dictionary for one source of truth across web/iOS/Android.
- **Target section:** Related Topics
- **Source URL:** https://github.com/tokens-studio/sd-tailwindv4
- **Pulled quote:** "A powerful, type-safe design token pipeline that transforms JSON design tokens into Tailwind v4 CSS using Style Dictionary."

## Reference URLs

- https://tailwindcss.com/blog/tailwindcss-v4
- https://tailwindcss.com/docs/theme
- https://tailwindcss.com/docs/upgrade-guide
- https://tailwindcss.com/docs/functions-and-directives
- https://tailwindcss.com/blog/tailwindcss-v4-alpha
- https://ui.shadcn.com/docs/tailwind-v4
- https://github.com/tokens-studio/sd-tailwindv4

## Research notes

- Use `initial` sentinel (not `--default`) for namespace reset.
- OKLCH default palette ≠ OKLAB gradient interpolation — keep distinct.
- Style Dictionary + `@theme` are complementary (multi-platform) not competing (single web).
- "Migration from v3 JS Config" is the load-bearing custom section.
