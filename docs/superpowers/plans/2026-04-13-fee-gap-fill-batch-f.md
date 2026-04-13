# FEE Gap-Fill Batch F — Design Systems, Accessibility & Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 9 gap-fill articles — 2 for Design Systems (FEE-908–909), 3 for Accessibility (FEE-1008–1010), and 4 for Testing (FEE-1108–1111) — in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/Design Systems and UI Libraries/908.md` — Variant & Token Composition
- `docs/en/Design Systems and UI Libraries/909.md` — Multi-Brand Design Systems
- `docs/en/Accessibility/1008.md` — Cognitive Accessibility
- `docs/en/Accessibility/1009.md` — Motion & Animation Accessibility
- `docs/en/Accessibility/1010.md` — Accessibility & Internationalization Intersection
- `docs/en/Testing Strategies/1108.md` — Snapshot Testing
- `docs/en/Testing Strategies/1109.md` — API Mocking with MSW & Integration Testing
- `docs/en/Testing Strategies/1110.md` — Performance Testing in CI
- `docs/en/Testing Strategies/1111.md` — Diagnosing & Fixing Flaky Tests

**Files to create (zh-TW):** Mirror under `docs/zh-tw/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Batch 12+ template: Opening → `## Principle` → `## Design Thinking` → `## Best Practices` → `## Visual` → `## Example` → `## Common Mistakes` (optional) → `## Related FEEs` → `## References`. Target: 300+ lines per file.

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

---

### Task 1: FEE-908 Variant & Token Composition

**Files:**
- Create: `docs/en/Design Systems and UI Libraries/908.md`
- Create: `docs/zh-tw/Design Systems and UI Libraries/908.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 908
  title: Variant & Token Composition
  state: draft
  category: Design Systems and UI Libraries
  ---
  ```

  **H1:** `# Variant & Token Composition`

  **Opening (2–4 paragraphs covering):**
  - Component variants — primary/secondary/destructive buttons, small/medium/large inputs, filled/outlined/ghost appearances — are the most common source of ad-hoc className logic in component libraries. A component with three size variants, four color variants, and two states can produce twelve combinations, and the naive approach of writing conditional class strings inline produces code that is difficult to read, extend, and maintain.
  - Class Variance Authority (CVA), `tailwind-variants`, and `cva()` provide a structured API for expressing variant combinations as a configuration object that maps variant values to class strings. This moves variant logic from ad-hoc conditional expressions to a declarative data structure that is easier to read, test, and extend. The output is a callable function that accepts a variant specification object and returns the resolved class string.
  - Design token layering — primitive tokens (specific values: `#1a1a2e`), semantic tokens (purpose-based: `color-text-primary`), and component tokens (element-scoped: `button-background`) — is the hierarchy that allows a design system to support multiple themes without changing component code. The component references semantic tokens; the theme swaps the semantic tokens' values. Understanding this layering is the prerequisite for implementing theming, dark mode, and multi-brand systems correctly.

  **`## Principle`:**

  Engineers SHOULD express component variants using a variant configuration library (CVA, `tailwind-variants`, or equivalent) rather than inline conditional className logic. A component with three or more independent variant dimensions — size, color, state — requires combinatorial conditional logic to express in JSX; a variant configuration object is linear in the number of dimensions and produces a self-documenting API surface (`variant: 'primary' | 'secondary' | 'destructive'`).

  Engineers MUST reference semantic design tokens in component styles, not primitive token values directly. A button that sets `background-color: var(--color-blue-600)` is coupled to a specific color; a button that sets `background-color: var(--color-action-primary)` is coupled to a semantic concept. When the design system's primary action color changes — to accommodate a new brand or a dark mode — only the semantic token's value changes, not the component's code.

  **`## Design Thinking` subsections:**
  - `### CVA and compound variants` — `cva(base, { variants, defaultVariants })` API. Compound variants: class combinations that only apply when multiple variants have specific values together (e.g., `size: 'lg'` + `variant: 'ghost'` produces additional padding).
  - `### Token hierarchy: primitive → semantic → component` — Why three layers? Primitive tokens are the source of truth for all color/spacing values; semantic tokens map purpose to primitive; component tokens scope semantic tokens to an element. Dark mode changes only the semantic layer's mapping.
  - `### TypeScript-enforced variant APIs` — CVA generates TypeScript types for valid variant combinations automatically. `VariantProps<typeof buttonVariants>` extracts the variant prop type, making the component's API statically typed without manual type writing.
  - `### tailwind-variants vs. CVA` — `tailwind-variants` adds responsive variants and slots (compound components where each slot has its own variant configuration). CVA is simpler and sufficient for single-element components.

  **`## Best Practices`:**

  **SHOULD use CVA or `tailwind-variants` for components with two or more independent variant dimensions.** Inline conditional class strings (`cx(size === 'lg' && '...', color === 'primary' && '...')`) scale poorly as variants multiply. CVA's configuration object is declarative, generates TypeScript types automatically, and makes the full variant matrix visible in one place.

  **MUST reference semantic design tokens, not primitive tokens, in all component-level styles.** Semantic tokens (`--color-action-primary`, `--spacing-component-padding-md`) provide a stable abstraction that survives theme changes. Primitive tokens (`--color-blue-600`, `--spacing-4`) hardcode the current theme's values into the component, requiring component changes whenever the theme changes.

  **SHOULD generate component token types using TypeScript when the design token system is authored in code.** If design tokens are defined as a TypeScript object or imported from a token file, using the token keys as string literal types for CSS custom property names ensures that component code references only valid, defined tokens and produces a type error when a token is renamed or removed.

  **`## Visual`:** Mermaid diagram showing the token hierarchy: primitive tokens (raw values) → semantic tokens (purpose mapping) → component tokens (element scoping) → component style rules. Show how a dark mode theme swaps only the semantic layer.

  **`## Example`:** CVA button variant configuration:
  ```ts
  import { cva, type VariantProps } from 'class-variance-authority';
  export const buttonVariants = cva(
    'inline-flex items-center font-medium transition-colors focus-visible:outline-none',
    {
      variants: {
        variant: {
          primary: 'bg-[var(--color-action-primary)] text-[var(--color-text-on-action)]',
          secondary: 'border border-[var(--color-border-default)] bg-transparent',
          destructive: 'bg-[var(--color-action-destructive)] text-white',
        },
        size: {
          sm: 'h-8 px-3 text-sm',
          md: 'h-10 px-4 text-base',
          lg: 'h-12 px-6 text-lg',
        },
      },
      defaultVariants: { variant: 'primary', size: 'md' },
    }
  );
  export type ButtonVariants = VariantProps<typeof buttonVariants>;
  ```

  **`## Related FEEs`:**
  - FEE-900 — Design Systems & UI Libraries Overview
  - FEE-901 — Design Tokens
  - FEE-905 — Theming & Dark Mode
  - FEE-909 — Multi-Brand Design Systems

  **`## References`:**
  - Class Variance Authority — https://cva.style
  - tailwind-variants — https://www.tailwind-variants.org
  - Tokens Studio: Token hierarchy — https://docs.tokens.studio/tokens/token-types

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 908
  title: 變體與設計代幣組合
  state: draft
  category: Design Systems and UI Libraries
  ---
  ```
  **H1:** `# 變體與設計代幣組合`

  Related FEE titles:
  - FEE-900 — 設計系統與 UI 函式庫概覽
  - FEE-901 — 設計代幣
  - FEE-905 — 主題與深色模式
  - FEE-909 — 多品牌設計系統

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Design Systems and UI Libraries/908.md" "docs/zh-tw/Design Systems and UI Libraries/908.md"
  git commit -m "feat(fee-908): variant & token composition — EN + zh-TW"
  ```

---

### Task 2: FEE-909 Multi-Brand Design Systems

**Files:**
- Create: `docs/en/Design Systems and UI Libraries/909.md`
- Create: `docs/zh-tw/Design Systems and UI Libraries/909.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 909
  title: Multi-Brand Design Systems
  state: draft
  category: Design Systems and UI Libraries
  ---
  ```

  **H1:** `# Multi-Brand Design Systems`

  **Opening (2–4 paragraphs covering):**
  - A multi-brand design system serves multiple product lines, subsidiaries, or white-label customers from a single component library. The components are shared; the visual identity — colors, typography, spacing, iconography — varies by brand. This is distinct from theming (light/dark mode): theming changes values within a single brand's identity; multi-brand changes which identity is applied.
  - The architectural challenge is separating the structural behavior of components from their visual expression. A button component should work identically across brands; its background color, border radius, and font family are brand-specific. The mechanism for separation is the token layer: components reference semantic tokens; each brand defines its own semantic token values.
  - Build-time vs. runtime theming is the central trade-off. Build-time theming produces a separate CSS bundle per brand — each bundle contains tokens compiled to specific values, with no runtime overhead. Runtime theming uses CSS custom properties that can be switched by swapping a class on the `<html>` element, enabling brand switching without a page reload. Build-time is faster at runtime; runtime is more flexible for user-selectable themes or per-tenant customization.

  **`## Principle`:**

  Engineers SHOULD implement multi-brand support through the design token layer, not through component-level branching. A component that contains `if (brand === 'brandA') { ... } else { ... }` becomes harder to maintain with each new brand and requires component changes when visual changes are needed. A component that references only `var(--color-action-primary)` requires no changes when a new brand is added; only a new token file is required.

  Engineers MUST establish a clear token contract between the design system and brand teams: a defined set of semantic token names that every brand must provide values for. The contract is the interface between the shared component layer and the brand layer. Components depend on the contract; brand teams fulfill it. Adding a new semantic token to the contract without a corresponding default value is a breaking change for all brands.

  **`## Design Thinking` subsections:**
  - `### Token namespacing per brand` — `[data-brand="brandA"]` CSS attribute selector to scope brand tokens. CSS custom property inheritance: brand tokens defined on `[data-brand]` cascade to all descendants. Switching brand: `document.documentElement.dataset.brand = 'brandB'`.
  - `### Build-time token compilation` — Style Dictionary, Theo, or Tokens Studio compile token JSON to brand-specific CSS files. Each brand's CSS file is a separate artifact. The correct file is served to the user based on their brand context.
  - `### Shared component library with brand adapter pattern` — The library exports unstyled components plus a token contract. Each brand ships a token file that fulfills the contract. The adapter pattern: `BrandProvider` injects the brand's token file.
  - `### Brand-specific overrides beyond tokens` — Some brands may require structural differences beyond token values (different logo placement, different navigation patterns). Multi-brand tokens handle visual differences; structural differences require a separate component surface per brand.

  **`## Best Practices`:**

  **SHOULD implement multi-brand theming using CSS custom properties and a `[data-brand]` attribute selector rather than separate CSS class names per brand.** `[data-brand="X"]` allows brand-scoped tokens to be defined once per brand in a single CSS block, applied by a single attribute change, and inherited by all descendants. Separate class names per brand (`.brand-a .button { ... }`) require maintaining parallel CSS rule sets and produce specificity conflicts.

  **MUST define a stable, versioned token contract between the shared component library and brand-specific token files.** The contract specifies which semantic token names the library depends on. Adding a new token to the contract without a default value breaks all brands that do not define it. The contract should be versioned alongside the component library; breaking changes require a major version bump and a migration path for brand teams.

  **SHOULD test components against each brand's token set in CI.** Visual regression tests that render components with each brand's tokens detect unintended visual changes when tokens are updated. A component that looks correct in the default brand may have unreadable contrast in another brand's token set if the token values were not validated against WCAG contrast requirements.

  **`## Visual`:** Mermaid diagram showing the multi-brand architecture: shared component library (depends on token contract) → brand-specific token files (brandA.css, brandB.css, brandC.css) → brand switching mechanism (data-brand attribute) → rendered UI.

  **`## Example`:** Brand token switching with CSS custom properties:
  ```css
  /* brandA.css */
  [data-brand="brandA"] {
    --color-action-primary: #0057b8;
    --color-text-primary: #1a1a1a;
    --font-family-base: 'Inter', sans-serif;
  }
  /* brandB.css */
  [data-brand="brandB"] {
    --color-action-primary: #e63946;
    --color-text-primary: #2d2d2d;
    --font-family-base: 'Roboto', sans-serif;
  }
  ```
  ```js
  function switchBrand(brand) { document.documentElement.dataset.brand = brand; }
  ```

  **`## Related FEEs`:**
  - FEE-900 — Design Systems & UI Libraries Overview
  - FEE-901 — Design Tokens
  - FEE-905 — Theming & Dark Mode
  - FEE-908 — Variant & Token Composition

  **`## References`:**
  - Style Dictionary — https://styledictionary.com
  - Tokens Studio for Figma — https://tokens.studio
  - Smashing Magazine: Multi-Brand Design Systems — https://www.smashingmagazine.com/2022/09/frameworks-design-systems/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 909
  title: 多品牌設計系統
  state: draft
  category: Design Systems and UI Libraries
  ---
  ```
  **H1:** `# 多品牌設計系統`

  Related FEE titles:
  - FEE-900 — 設計系統與 UI 函式庫概覽
  - FEE-901 — 設計代幣
  - FEE-905 — 主題與深色模式
  - FEE-908 — 變體與設計代幣組合

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Design Systems and UI Libraries/909.md" "docs/zh-tw/Design Systems and UI Libraries/909.md"
  git commit -m "feat(fee-909): multi-brand design systems — EN + zh-TW"
  ```

---

### Task 3: FEE-1008 Cognitive Accessibility

**Files:**
- Create: `docs/en/Accessibility/1008.md`
- Create: `docs/zh-tw/Accessibility/1008.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1008
  title: Cognitive Accessibility
  state: draft
  category: Accessibility
  ---
  ```

  **H1:** `# Cognitive Accessibility`

  **Opening (2–4 paragraphs covering):**
  - Cognitive accessibility addresses the needs of users with cognitive, learning, and neurological disabilities — including dyslexia, ADHD, autism spectrum conditions, memory impairments, and acquired cognitive disabilities from brain injury or stroke. Globally, cognitive disabilities are the most common category of disability, affecting a significantly larger proportion of the population than physical, visual, or hearing disabilities.
  - WCAG 2.2 added new success criteria specifically targeting cognitive accessibility: SC 3.2.6 (Consistent Help), SC 3.3.7 (Redundant Entry), SC 3.3.8 (Accessible Authentication — Minimum), and SC 3.3.9 (Accessible Authentication — Enhanced). These criteria reflect the Cognitive Accessibility Task Force's findings that authentication, form completion, and navigation are the highest-friction areas for users with cognitive disabilities.
  - Cognitive accessibility is not a separate checklist from good UX; it is good UX with explicit criteria. Clear language, consistent navigation, meaningful error messages, and forgiveness for user mistakes benefit all users. The difference is that for users with cognitive disabilities, these are not quality improvements — they are barriers to access when absent.

  **`## Principle`:**

  Engineers MUST write UI text in plain language, avoiding jargon, unexplained acronyms, and complex sentence structures. The Flesch-Kincaid readability level for general-purpose UI text should target Grade 8 or below. Error messages must explain what went wrong in plain terms, what the user should do next, and — where relevant — why the action failed. An error message that reads "Request failed: 422 Unprocessable Entity" provides no useful information to any user; "Your email address must be in the format name@example.com" is actionable.

  Engineers MUST NOT require users to solve cognitive puzzles to authenticate when less cognitively demanding alternatives exist. WCAG 3.3.8 requires that authentication not depend on a cognitive function test — including transcribing distorted text (CAPTCHA), performing mental arithmetic, or memorizing multi-step sequences — unless the user has an alternative authentication method available. Password managers and copy-paste must be allowed for all authentication fields.

  **`## Design Thinking` subsections:**
  - `### Plain language principles` — Short sentences. Active voice. One idea per paragraph. Consistent terminology (do not call the same thing by different names in different parts of the UI). Plain language guidelines from government style guides (GOV.UK, USWDS) as references.
  - `### Consistent help and navigation (WCAG 3.2.6)` — Help mechanisms (contact link, chat, search) must appear in the same place on every page where they are present. Navigation menus must maintain consistent order and labeling across pages. Users with memory impairments rely on consistency to re-orient themselves.
  - `### Redundant entry prevention (WCAG 3.3.7)` — Multi-step forms must not require users to re-enter information they have already provided. Pre-filling earlier data on later steps reduces cognitive load and error risk for all users.
  - `### Accessible authentication (WCAG 3.3.8)` — Allowing copy-paste in password fields, supporting password managers, not blocking browser autofill, providing alternatives to CAPTCHA. Technical implementation: do not set `autocomplete="off"` on auth fields, allow clipboard events.
  - `### Error prevention and recovery` — Undo actions, confirmation dialogs for destructive operations, inline validation that guides rather than penalizes. WCAG 3.3.4: for legal/financial data, provide review before submit, correction after submit, or confirmation step.

  **`## Best Practices`:**

  **MUST NOT disable browser autofill or paste in any authentication, personal information, or form field.** `autocomplete="off"` and blocked clipboard events force users to type from memory, which creates barriers for users with cognitive disabilities, motor impairments, and anyone using a password manager. Browser autofill and clipboard are accessibility features; disabling them degrades accessibility for security theater that does not provide meaningful protection.

  **MUST write error messages that identify the field in error, describe the problem in plain language, and prescribe a correction.** "Invalid input" identifies nothing. "Phone number must be 10 digits, for example: 0912-345-678" tells the user what is wrong, what format is expected, and shows an example. Error messages should appear adjacent to the field they describe, be programmatically associated with the field via `aria-describedby`, and persist until the field is corrected.

  **SHOULD allow sufficient time for users to complete time-limited forms and warn users before sessions expire with an option to extend.** WCAG 2.2.1 (Timing Adjustable) requires that users who need more time can request it before a timeout. For complex forms or authentication flows with session timeouts, display a warning at least 20 seconds before expiry and allow extension without data loss.

  **`## Visual`:** Mermaid flowchart of error recovery UX: user submits form → validation fails → error messages appear adjacent to fields with `aria-describedby` associations → user corrects field → inline validation confirms correction → user resubmits successfully.

  **`## Example`:** Accessible error message associated with input via `aria-describedby`:
  ```html
  <label for="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid="true"
    autocomplete="email"
  >
  <p id="email-error" role="alert">
    Enter an email address in the format: name@example.com
  </p>
  ```

  **`## Related FEEs`:**
  - FEE-1000 — Accessibility Overview
  - FEE-1001 — ARIA & Semantic HTML
  - FEE-1005 — Accessible Forms & Inputs
  - FEE-1002 — Keyboard Navigation & Focus Management

  **`## References`:**
  - WCAG 2.2: Cognitive criteria — https://www.w3.org/WAI/WCAG22/Understanding/
  - W3C Cognitive Accessibility Task Force — https://www.w3.org/WAI/GL/task-forces/coga/
  - GOV.UK Content Design: Plain English — https://www.gov.uk/guidance/content-design/writing-for-gov-uk
  - WebAIM: Cognitive Disabilities — https://webaim.org/articles/cognitive/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1008
  title: 認知無障礙
  state: draft
  category: Accessibility
  ---
  ```
  **H1:** `# 認知無障礙`

  Related FEE titles:
  - FEE-1000 — 無障礙設計總覽
  - FEE-1001 — ARIA 與語義化 HTML
  - FEE-1005 — 無障礙表單與輸入元素
  - FEE-1002 — 鍵盤導航與焦點管理

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/Accessibility/1008.md docs/zh-tw/Accessibility/1008.md
  git commit -m "feat(fee-1008): cognitive accessibility — EN + zh-TW"
  ```

---

### Task 4: FEE-1009 Motion & Animation Accessibility

**Files:**
- Create: `docs/en/Accessibility/1009.md`
- Create: `docs/zh-tw/Accessibility/1009.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1009
  title: Motion & Animation Accessibility
  state: draft
  category: Accessibility
  ---
  ```

  **H1:** `# Motion & Animation Accessibility`

  **Opening (2–4 paragraphs covering):**
  - Motion and animation are powerful UI tools for communicating state, providing feedback, and guiding attention. They also present accessibility risks. For users with vestibular disorders — a group that includes millions of people — animations involving parallax, scaling, rotation, or large-area movement can trigger nausea, dizziness, and migraines. For users with photosensitive epilepsy, flashing content can trigger seizures. For users with attention disorders, persistent animations can prevent concentration.
  - The `prefers-reduced-motion` CSS media query allows users to signal that they prefer less motion. On macOS, this corresponds to "Reduce Motion" in Accessibility settings; on Windows, it corresponds to "Turn off animations." When the media query reports `reduce`, the web application should eliminate or substantially reduce animations.
  - "Reduced motion" does not mean "no animation." It means animations that could cause harm or distraction should be reduced or replaced with instant transitions or simpler alternatives. State-change animations that communicate meaning (a spinner indicating loading, a color change indicating success) can be kept; large-scale parallax movements, bouncing effects, and auto-playing animations should be eliminated or replaced with static equivalents.

  **`## Principle`:**

  Engineers MUST provide a `prefers-reduced-motion: reduce` media query fallback for all animations that involve movement, parallax, scaling, or rotation. The fallback MUST reduce or eliminate the motion, not merely slow it down. A parallax effect that moves at half speed is still a parallax effect; the correct reduced-motion alternative is no parallax. `transition-duration: 0.01ms` is the conventional value for "instant transition" that removes animation without breaking transition-dependent JavaScript timing logic.

  Engineers MUST NOT publish content that flashes more than three times per second. WCAG 2.3.1 (Three Flashes or Below Threshold) is a Level A requirement. Content that violates this criterion can trigger seizures in users with photosensitive epilepsy. This applies to all content: images, videos, CSS animations, JavaScript-driven animations, and embedded third-party content.

  **`## Design Thinking` subsections:**
  - `### Vestibular disorders and parallax` — The vestibular system controls balance and spatial orientation. Content that moves in ways inconsistent with user-initiated scroll can trigger vestibular response. Parallax, zoom animations on scroll, and sticky elements with motion are the most common triggers.
  - `### prefers-reduced-motion: reduce vs. no-preference` — `no-preference` is the default (user has not expressed a preference). `reduce` means the user has opted in to reduced motion. Design for `no-preference` as the default animation state; `reduce` as the accessible alternative.
  - `### WCAG 2.3.1 Three Flashes` — The photosensitive epilepsy seizure threshold. Content that flashes ≥3 times per second in a large area (>25% of the screen) is prohibited at Level A. The Photosensitive Epilepsy Analysis Tool (PEAT) tests for violations.
  - `### Auto-playing animations` — WCAG 2.2.2 (Pause, Stop, Hide) requires that auto-playing content (carousels, animations, video) lasting more than five seconds can be paused, stopped, or hidden by the user. A looping hero animation with no pause control violates this at Level A.

  **`## Best Practices`:**

  **MUST wrap all CSS animations and transitions that involve large-area movement, parallax, or rotation in a `@media (prefers-reduced-motion: no-preference)` block, with a static or instant fallback as the default.** Writing the reduced-motion state as the default and the animated state as the opt-in — rather than the other way around — ensures that users who have not changed their system preference also receive a safe experience, and removes the risk of a CSS specificity issue causing the media query to be overridden.

  **MUST provide play/pause controls for all auto-playing animations or videos that last more than five seconds.** WCAG 2.2.2 is a Level A requirement. Carousels that advance automatically, hero sections with looping video or animation, and loading animations that never stop all require pause controls. The pause control must be keyboard-accessible.

  **SHOULD use `transition-duration: 0.01ms; animation-duration: 0.01ms` rather than `display: none` or `visibility: hidden` as the reduced-motion state for transitions.** Setting duration to near-zero preserves the transition mechanism (which JavaScript may depend on via `transitionend` events) while making the visual change effectively instantaneous. Removing the animation property entirely may break JavaScript that listens for transition end events.

  **`## Visual`:** Mermaid diagram showing the motion preference decision tree: `prefers-reduced-motion: reduce`? → yes: instant transitions, no parallax, no auto-play → no: full animation as designed. Annotate WCAG criteria alongside each path.

  **`## Example`:** CSS pattern for motion-safe animations:
  ```css
  /* Default: no motion — safe for all users */
  .hero { transform: none; }
  /* Opt-in to motion if user has no preference */
  @media (prefers-reduced-motion: no-preference) {
    .hero { animation: slideIn 600ms ease-out; }
  }
  /* Alternatively: start with animation, reduce on preference */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

  **`## Related FEEs`:**
  - FEE-1000 — Accessibility Overview
  - FEE-710 — GPU-Accelerated Animations & `will-change`
  - FEE-412 — `requestAnimationFrame` & Animation Timing
  - FEE-1010 — Accessibility & Internationalization Intersection

  **`## References`:**
  - MDN: prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  - web.dev: prefers-reduced-motion — https://web.dev/articles/prefers-reduced-motion
  - WCAG 2.3.1: Three Flashes — https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold
  - WCAG 2.2.2: Pause, Stop, Hide — https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1009
  title: 動態與動畫無障礙
  state: draft
  category: Accessibility
  ---
  ```
  **H1:** `# 動態與動畫無障礙`

  Related FEE titles:
  - FEE-1000 — 無障礙設計總覽
  - FEE-710 — GPU 加速動畫與 `will-change`
  - FEE-412 — `requestAnimationFrame` 與動畫計時
  - FEE-1010 — 無障礙與國際化的交集

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/Accessibility/1009.md docs/zh-tw/Accessibility/1009.md
  git commit -m "feat(fee-1009): motion & animation accessibility — EN + zh-TW"
  ```

---

### Task 5: FEE-1010 Accessibility & Internationalization Intersection

**Files:**
- Create: `docs/en/Accessibility/1010.md`
- Create: `docs/zh-tw/Accessibility/1010.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1010
  title: Accessibility & Internationalization Intersection
  state: draft
  category: Accessibility
  ---
  ```

  **H1:** `# Accessibility & Internationalization Intersection`

  **Opening (2–4 paragraphs covering):**
  - Accessibility and internationalization (i18n) intersect in several critical ways. Screen readers must know the language of the content to pronounce it correctly — a German word read by an English-language voice model produces unintelligible output. RTL (right-to-left) languages require not just text direction reversal but also keyboard navigation reversal and focus management adjustments. Locale-sensitive formatting of numbers, dates, and currencies in ARIA labels must be internationalized as carefully as visible text.
  - The `lang` attribute on the `<html>` element and on individual elements with content in a different language is the primary mechanism for accessibility-correct internationalization. Screen readers use this attribute to select the appropriate voice and pronunciation rules. An application that serves multiple languages must set the `lang` attribute to the correct BCP 47 language tag for each page or, for multilingual pages, on each section.
  - The intersection is often overlooked because accessibility and i18n teams work independently. Accessibility audits focus on English content; i18n teams focus on translation completeness. The result is applications that pass accessibility audits in English but have untested and often broken accessibility in other languages. Treating i18n and a11y as separate concerns produces this gap; treating them as jointly owned prevents it.

  **`## Principle`:**

  Engineers MUST set the `lang` attribute on the `<html>` element to the correct BCP 47 language tag for the page's primary language, and MUST set the `lang` attribute on inline elements when their language differs from the page's primary language. Screen readers use the `lang` attribute to select pronunciation rules; without it, a French-language page is read with English pronunciation, which produces unintelligible output for French words. The `lang` attribute is not optional for multilingual applications; it is a WCAG 3.1.1 Level A requirement.

  Engineers MUST internationalize all ARIA labels, `aria-label`, `aria-describedby` content, and `title` attributes using the same translation infrastructure as visible text. ARIA attributes that contain untranslated strings will be read in the wrong language by screen readers even when all visible text is correctly translated. A "close dialog" button with a hardcoded `aria-label="Close"` on a Japanese-language page reads the English word "Close" to Japanese screen reader users.

  **`## Design Thinking` subsections:**
  - `### BCP 47 language tags` — Format: `language[-script][-region]`. Examples: `en`, `en-US`, `zh-Hant-TW`, `ar-SA`. How to determine the correct tag for the current page in SSR and SPA contexts.
  - `### RTL layout and keyboard navigation` — `dir="rtl"` on `<html>` reverses text direction. CSS `logical properties` (`margin-inline-start` vs. `margin-left`) adapt layouts to directionality automatically. Keyboard navigation of interactive elements should follow reading order, which in RTL is right-to-left; testing RTL keyboard navigation is distinct from testing LTR.
  - `### Screen reader language switching` — A page with content in two languages requires `lang` attributes on the correct elements for the screen reader to switch voice models. Mixed-language content (a Japanese page with English code snippets) requires inline `lang` attributes on the English sections.
  - `### Locale-sensitive ARIA labels` — Date and number formatting in ARIA labels. `aria-label="Price: $1,234.56"` in English locale vs. `aria-label="価格：¥1,234"` in Japanese. ARIA labels that embed formatted values must use the same `Intl.NumberFormat` / `Intl.DateTimeFormat` as visible text.

  **`## Best Practices`:**

  **MUST set `<html lang="...">` to the correct BCP 47 language tag and update it dynamically in single-page applications when the user changes the application language.** In an SPA, the `lang` attribute must be updated when the language changes — it is not sufficient to set it once at build time. A React application should update `document.documentElement.lang` whenever the locale changes, in the same effect that updates the i18n provider.

  **MUST include all ARIA labels, `aria-label` strings, and accessible name calculations in the i18n translation catalog.** Treating ARIA attributes as implementation details rather than user-facing text is a common oversight that produces untranslated screen reader announcements. Every string that a screen reader will speak to the user — visible or not — must be in the translation catalog.

  **SHOULD test each supported locale with a screen reader set to that locale's language.** English accessibility testing does not reveal pronunciation problems in French, Japanese, or Arabic. Testing with VoiceOver (macOS/iOS) or NVDA (Windows) set to each supported locale's voice detects `lang` attribute omissions, untranslated ARIA labels, and RTL navigation issues that are invisible to English-only testing.

  **`## Visual`:** Mermaid diagram showing the language annotation requirement: `<html lang="ja">` → child elements inherit Japanese pronunciation → `<span lang="en">JavaScript</span>` → screen reader switches to English voice for this element → returns to Japanese for surrounding content.

  **`## Example`:** Updating `document.lang` in a React i18n provider and translating ARIA labels:
  ```jsx
  function I18nProvider({ locale, children }) {
    React.useEffect(() => {
      document.documentElement.lang = locale; // e.g., 'zh-Hant-TW'
    }, [locale]);
    return <IntlProvider locale={locale}>{children}</IntlProvider>;
  }
  // Translated ARIA label via react-intl:
  function CloseButton({ onClose }) {
    const intl = useIntl();
    return (
      <button aria-label={intl.formatMessage({ id: 'dialog.close' })} onClick={onClose}>
        <CloseIcon aria-hidden="true" />
      </button>
    );
  }
  ```

  **`## Related FEEs`:**
  - FEE-1000 — Accessibility Overview
  - FEE-1001 — ARIA & Semantic HTML
  - FEE-1004 — Screen Readers & Assistive Technology
  - FEE-1008 — Cognitive Accessibility

  **`## References`:**
  - WCAG 3.1.1: Language of Page — https://www.w3.org/WAI/WCAG22/Understanding/language-of-page
  - MDN: lang attribute — https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang
  - W3C: BCP 47 Language Tags — https://www.rfc-editor.org/rfc/bcp/bcp47.txt
  - W3C: Internationalization and Accessibility — https://www.w3.org/WAI/fundamentals/accessibility-intro/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1010
  title: 無障礙與國際化的交集
  state: draft
  category: Accessibility
  ---
  ```
  **H1:** `# 無障礙與國際化的交集`

  Related FEE titles:
  - FEE-1000 — 無障礙設計總覽
  - FEE-1001 — ARIA 與語義化 HTML
  - FEE-1004 — 螢幕閱讀器與輔助技術
  - FEE-1008 — 認知無障礙

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/Accessibility/1010.md docs/zh-tw/Accessibility/1010.md
  git commit -m "feat(fee-1010): accessibility & internationalization intersection — EN + zh-TW"
  ```

---

### Task 6: FEE-1108 Snapshot Testing

**Files:**
- Create: `docs/en/Testing Strategies/1108.md`
- Create: `docs/zh-tw/Testing Strategies/1108.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1108
  title: Snapshot Testing
  state: draft
  category: Testing Strategies
  ---
  ```

  **H1:** `# Snapshot Testing`

  **Opening (2–4 paragraphs covering):**
  - Snapshot testing captures the output of a component or function at a point in time and stores it as a file. On subsequent test runs, the output is compared to the stored snapshot; a difference fails the test. The promise is that snapshots catch unintended output changes automatically, without requiring the developer to write explicit assertions for every property.
  - The reality is more nuanced. Snapshots are most useful for small, stable outputs — a serialized configuration object, a short string transformation, a compact component with minimal markup. They become liabilities for large outputs: a snapshot of a complex component's full DOM tree is hundreds of lines long, meaningful diffs are buried in noise, and developers routinely update snapshots automatically without reading them — which makes the test report "passing" while catching nothing.
  - Snapshot testing is not a substitute for behavioral tests. A snapshot that captures `<button className="btn-primary">Submit</button>` verifies that those exact bytes are produced; it does not verify that clicking the button submits the form. The distinction matters because snapshots fail on meaningless changes (a CSS class renamed, a whitespace formatting change) and pass on meaningful failures (the button is non-functional but the markup is unchanged).

  **`## Principle`:**

  Engineers SHOULD use snapshot tests for small, semantically stable outputs where exact byte-for-byte output consistency is the meaningful signal — serialized configuration, simple string transforms, compact pure-function outputs, and small component HTML representations. For these cases, a snapshot test is the concise expression of "this should not change without a human reviewing the diff."

  Engineers MUST NOT use snapshot tests as a replacement for interaction and behavior tests. A snapshot test verifies output structure, not behavior. A component that renders correctly but fires the wrong event on click, a function that returns the correct string but has incorrect side effects, and an API that returns the expected shape but with wrong values all pass snapshot tests. Snapshot testing is a supplement to behavioral testing, not a substitute.

  **`## Design Thinking` subsections:**
  - `### Inline vs. external snapshots` — Inline snapshots (Jest's `toMatchInlineSnapshot()`) embed the snapshot in the test file. External snapshots (`.snap` files) are stored alongside test files. Inline snapshots are preferable for small outputs because they make the expected output visible in the test without switching files; external snapshots are appropriate when the output is too large for inline.
  - `### Snapshot drift` — Snapshots that are updated with `--updateSnapshot` without human review stop functioning as tests. The developer sees "1 snapshot updated" in the CI log and the test "passes" — but the snapshot now reflects the new (potentially incorrect) output. Code review of snapshot diff files is the only gate.
  - `### When to delete a snapshot` — If updating a snapshot requires no thought about whether the new output is correct, the snapshot is not adding value. Delete it and replace with a more targeted assertion if the output has semantic importance, or remove the test if the output has no behavioral significance.
  - `### Component snapshots: what to snapshot` — Prefer snapshotting specific elements or attributes rather than the full component tree. `expect(screen.getByRole('button').outerHTML).toMatchInlineSnapshot(...)` is more targeted than `expect(container).toMatchSnapshot()`.

  **`## Best Practices`:**

  **SHOULD use inline snapshots (`toMatchInlineSnapshot()`) for outputs under ~30 lines, so the expected output is visible in the test file without switching to a `.snap` file.** Inline snapshots make test intent clear to code reviewers: they can see the expected output alongside the test logic. External `.snap` files are appropriate for larger outputs, but require discipline in review to ensure updates are intentional.

  **MUST review snapshot diff files in code review with the same care as test assertion changes.** A snapshot update in a `.snap` file is a change to the test's expected output. If that expected output is not read and understood by a reviewer, the update is meaningless. Treat `__snapshots__/*.snap` changes with the same scrutiny as changes to `expect(...)` assertions.

  **SHOULD delete snapshot tests for components whose snapshots are routinely updated without review.** A snapshot that is automatically updated every time a component changes provides no protection; it is noise that inflates the number of "tests" without adding coverage. Replace it with an assertion that captures the semantically meaningful part of the output.

  **`## Visual`:** Mermaid diagram of snapshot test lifecycle: first run → no snapshot exists → output captured and stored → subsequent runs → output compared to stored → match: pass / mismatch: fail → developer reviews diff → intentional change: update snapshot / unintentional: fix code.

  **`## Example`:** Inline snapshot for a small pure function:
  ```js
  import { formatCurrency } from './formatCurrency';
  test('formats USD amount', () => {
    expect(formatCurrency(1234.5, 'USD', 'en-US')).toMatchInlineSnapshot(
      `"$1,234.50"`
    );
  });
  test('formats JPY amount (no decimals)', () => {
    expect(formatCurrency(1234, 'JPY', 'ja-JP')).toMatchInlineSnapshot(
      `"¥1,234"`
    );
  });
  ```

  **`## Common Mistakes`:**
  - Running `--updateSnapshot` without reviewing the diff
  - Snapshotting entire large component trees and accepting noisy diffs
  - Treating snapshot coverage as meaningful test coverage

  **`## Related FEEs`:**
  - FEE-1100 — Testing Strategies Overview
  - FEE-1101 — Unit Testing with Vitest & Jest
  - FEE-1107 — Testing Philosophy: Coverage, Confidence & the Testing Pyramid

  **`## References`:**
  - Vitest: Snapshot Testing — https://vitest.dev/guide/snapshot
  - Jest: Snapshot Testing — https://jestjs.io/docs/snapshot-testing
  - Kent C. Dodds: Effective Snapshot Testing — https://kentcdodds.com/blog/effective-snapshot-testing

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1108
  title: 快照測試
  state: draft
  category: Testing Strategies
  ---
  ```
  **H1:** `# 快照測試`

  Related FEE titles:
  - FEE-1100 — 測試策略總覽
  - FEE-1101 — 使用 Vitest 與 Jest 進行單元測試
  - FEE-1107 — 測試哲學：覆蓋率、信心與測試金字塔

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Testing Strategies/1108.md" "docs/zh-tw/Testing Strategies/1108.md"
  git commit -m "feat(fee-1108): snapshot testing — EN + zh-TW"
  ```

---

### Task 7: FEE-1109 API Mocking with MSW & Integration Testing

**Files:**
- Create: `docs/en/Testing Strategies/1109.md`
- Create: `docs/zh-tw/Testing Strategies/1109.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1109
  title: API Mocking with MSW & Integration Testing
  state: draft
  category: Testing Strategies
  ---
  ```

  **H1:** `# API Mocking with MSW & Integration Testing`

  **Opening (2–4 paragraphs covering):**
  - Integration tests verify that multiple units work correctly together — a component tree that fetches data, renders it, and responds to user interaction. The challenge for integration tests is the network: real API calls in tests are slow, unreliable (dependent on server state and network availability), and impractical to cover comprehensively (error states, loading states, and edge cases require specific server responses that are difficult to reliably produce from a real server).
  - Mock Service Worker (MSW) solves this by intercepting fetch and XHR requests at the service worker or Node.js level, before the request leaves the process. Unlike jest-mock or module mocking, MSW operates at the network boundary: the application code makes real `fetch()` calls; MSW intercepts them and returns configured responses. This means the application's fetching logic — request construction, response parsing, error handling — is exercised in tests, not bypassed by mocks.
  - MSW handlers are reusable: the same handlers that run in Jest/Vitest (via `setupServer`) can run in Storybook (via `initialize`/`mswDecorator`) and in Playwright or Cypress end-to-end tests. This consistency ensures that the mock data and error scenarios used in unit tests match those available in component documentation and E2E tests.

  **`## Principle`:**

  Engineers SHOULD use MSW for API mocking in integration tests rather than mocking `fetch`, `axios`, or the network client module. Module-level mocking bypasses the application's network layer entirely, which means the integration test does not cover request construction, headers, serialization, or response parsing. MSW intercepts at the network boundary, allowing the full request/response cycle to be exercised while controlling the response.

  Engineers MUST define MSW handlers that accurately reflect the real API's response shape, status codes, and error conditions. A handler that always returns a hardcoded success response does not test the application's behavior when the API returns a 401, a 422, or a network error. Integration tests should include handlers for error conditions with the same care as success conditions, because error handling is part of the application's behavior.

  **`## Design Thinking` subsections:**
  - `### setupServer vs. setupWorker` — `setupServer` runs in Node.js (Jest, Vitest) using HTTP interception. `setupWorker` runs in the browser (Storybook, Playwright, manual development). The same handler definitions are reused across both.
  - `### Handler isolation between tests` — `server.use()` at the test level overrides handlers for a single test. `server.resetHandlers()` in `afterEach` restores baseline handlers. Pattern: default handlers cover the happy path; per-test overrides cover error states.
  - `### MSW in Storybook` — MSW Storybook addon (`msw-storybook-addon`) enables API mocking per-story. Stories that depend on API data define their mock handlers in story parameters, making stories self-contained and independently previewable.
  - `### GraphQL mocking` — MSW supports GraphQL request matching via `graphql.query('QueryName', resolver)`. Works identically to REST handlers.

  **`## Best Practices`:**

  **SHOULD use MSW's `http.get`/`http.post` handlers (v2 API) with realistic response shapes derived from the actual API contract.** Handlers with realistic response shapes catch type mismatches, missing fields, and incorrect assumptions about the API surface. Using the same TypeScript types for handler responses as for the application's type definitions ensures handlers remain in sync with the API contract.

  **MUST reset handlers in `afterEach` when using per-test handler overrides to prevent test pollution.** `server.resetHandlers()` in `afterEach` ensures that a handler override added for one test does not bleed into subsequent tests. Without reset, test order determines behavior — a characteristic of flaky tests.

  **SHOULD write at least one integration test per component that covers the error state for every API call the component makes.** Error states are the most commonly untested path in frontend integration tests. A component that shows a spinner indefinitely when an API returns 500, or that crashes when the API returns an unexpected shape, would be caught by an integration test that includes an error-state handler. MSW makes these tests trivial to write.

  **`## Visual`:** Mermaid diagram showing MSW interception: application → `fetch('https://api.example.com/users')` → MSW intercepts → handler matches route → returns mock response → application receives response → renders UI.

  **`## Example`:** MSW setup in Vitest integration test:
  ```js
  import { http, HttpResponse } from 'msw';
  import { setupServer } from 'msw/node';
  import { render, screen } from '@testing-library/react';
  import { UserList } from './UserList';
  const server = setupServer(
    http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }]))
  );
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  test('renders users from API', async () => {
    render(<UserList />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });
  test('shows error message on API failure', async () => {
    server.use(http.get('/api/users', () => HttpResponse.error()));
    render(<UserList />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load users');
  });
  ```

  **`## Related FEEs`:**
  - FEE-1100 — Testing Strategies Overview
  - FEE-1102 — Component Testing with Testing Library
  - FEE-1104 — Mocking, Stubs & Test Doubles
  - FEE-403 — Fetch, Streams & Network APIs

  **`## References`:**
  - MSW documentation — https://mswjs.io/docs
  - MSW: Getting started — https://mswjs.io/docs/getting-started
  - msw-storybook-addon — https://storybook.js.org/addons/msw-storybook-addon

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1109
  title: 使用 MSW 進行 API 模擬與整合測試
  state: draft
  category: Testing Strategies
  ---
  ```
  **H1:** `# 使用 MSW 進行 API 模擬與整合測試`

  Related FEE titles:
  - FEE-1100 — 測試策略總覽
  - FEE-1102 — 使用 Testing Library 進行元件測試
  - FEE-1104 — 模擬、替身與測試替代物
  - FEE-403 — Fetch、串流與網路 API

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Testing Strategies/1109.md" "docs/zh-tw/Testing Strategies/1109.md"
  git commit -m "feat(fee-1109): API mocking with MSW & integration testing — EN + zh-TW"
  ```

---

### Task 8: FEE-1110 Performance Testing in CI

**Files:**
- Create: `docs/en/Testing Strategies/1110.md`
- Create: `docs/zh-tw/Testing Strategies/1110.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1110
  title: Performance Testing in CI
  state: draft
  category: Testing Strategies
  ---
  ```

  **H1:** `# Performance Testing in CI`

  **Opening (2–4 paragraphs covering):**
  - Performance testing in CI catches regressions before they reach production. A feature that causes LCP to increase from 1.2s to 2.8s, or a dependency update that adds 50kB to the JS bundle, is visible in CI if performance budgets are configured as checks. Without CI performance gates, these regressions are discovered in production — after deployment, after user impact.
  - Lighthouse CI is the primary tool for automated Core Web Vitals measurement in CI pipelines. It runs Lighthouse in a headless Chrome environment against a deployed preview URL (or a local server), measures LCP, FID/INP, CLS, FCP, and TTFB, and fails the CI check if any metric exceeds configured thresholds. `bundlesize` and `size-limit` measure JavaScript and CSS bundle sizes independently of Core Web Vitals.
  - The challenge with performance CI is environment variability: lab performance (Lighthouse CI in a GitHub Actions runner) does not match field performance (real users on real devices). Performance CI catches obvious regressions; it does not predict field performance precisely. The correct use of performance CI is as a regression gate — if the score was 90 yesterday and is 55 today, investigate — not as a precise measurement of user experience.

  **`## Principle`:**

  Engineers SHOULD configure Lighthouse CI as a required check on pull requests that deploy preview environments. The check should assert minimum Lighthouse scores or maximum metric thresholds for LCP, CLS, and INP. Configuring a lower bound for performance scores — rather than exact values — accounts for measurement variance in CI environments while catching meaningful regressions.

  Engineers SHOULD configure `size-limit` or `bundlesize` as a required check on pull requests to catch bundle size regressions before merge. A PR that adds 100kB to the main bundle should require a deliberate decision, not slip through unnoticed. Size budgets express this as a constraint that PRs must not violate.

  **`## Design Thinking` subsections:**
  - `### Lighthouse CI setup` — `lighthouserc.js` configuration file. Running against a preview URL (Vercel, Netlify) or a locally served build (`lhci autorun`). Storing results in Lighthouse CI server or Google Cloud Storage for trend analysis.
  - `### Performance budgets` — Resource budgets (max JS bytes, max image bytes) vs. timing budgets (max LCP, max TTFB) vs. metric budgets (min Lighthouse score). Choosing the right budget type for the concern being measured.
  - `### size-limit` — `size-limit` configuration in `package.json`. Per-entry-point size limits. Gzip vs. Brotli compression for size reporting. Integrating with GitHub PR comments via `size-limit/action`.
  - `### Baseline management` — Setting initial performance budgets based on current performance, not aspirational targets. Tightening budgets incrementally. The risk of setting budgets too tight (constant failures) or too loose (no meaningful gate).

  **`## Best Practices`:**

  **SHOULD configure Lighthouse CI to run against preview deployments, not against localhost, for more representative performance measurements.** A local server on a GitHub Actions runner may have different network and CPU characteristics than a deployed CDN. Preview deployments on Vercel or Netlify reflect production serving conditions (CDN, compression, caching) and produce more representative Lighthouse scores.

  **MUST configure size budgets per entry point, not as a single total bundle size.** A single total budget that covers all routes and all JS allows any individual route to grow without limit as long as the total stays under the budget. Per-entry-point budgets (main bundle, route bundles, CSS) provide targeted gates for the sizes that matter to users on each page.

  **SHOULD store Lighthouse CI results over time and monitor trends in addition to per-PR gates.** A single PR gate catches acute regressions. Trend monitoring catches gradual degradation — a score that drops from 90 to 88 in each of 10 PRs is invisible to per-PR gates but clearly visible as a trend.

  **`## Visual`:** Mermaid diagram of the CI pipeline: PR opened → deploy preview → Lighthouse CI runs against preview URL → LCP/CLS/INP/score checks → pass/fail. Also show size-limit check on the same PR.

  **`## Example`:** `lighthouserc.js` configuration:
  ```js
  module.exports = {
    ci: {
      collect: { url: ['https://preview.example.com', 'https://preview.example.com/about'] },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.8 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
          'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
          'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        },
      },
    },
  };
  ```

  **`## Related FEEs`:**
  - FEE-1100 — Testing Strategies Overview
  - FEE-704 — Core Web Vitals & Performance Metrics
  - FEE-1502 — Build Pipelines: Lint, Type-Check, Test & Build
  - FEE-807 — Build Optimization: Minification, Caching & Output Analysis

  **`## References`:**
  - Lighthouse CI — https://github.com/GoogleChrome/lighthouse-ci
  - size-limit — https://github.com/ai/size-limit
  - web.dev: Lighthouse CI — https://web.dev/articles/lighthouse-ci

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1110
  title: CI 中的效能測試
  state: draft
  category: Testing Strategies
  ---
  ```
  **H1:** `# CI 中的效能測試`

  Related FEE titles:
  - FEE-1100 — 測試策略總覽
  - FEE-704 — 核心 Web 指標與效能指標
  - FEE-1502 — 構建流水線：Lint、型別檢查、測試與構建
  - FEE-807 — 構建最佳化：壓縮、快取與產出分析

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Testing Strategies/1110.md" "docs/zh-tw/Testing Strategies/1110.md"
  git commit -m "feat(fee-1110): performance testing in CI — EN + zh-TW"
  ```

---

### Task 9: FEE-1111 Diagnosing & Fixing Flaky Tests

**Files:**
- Create: `docs/en/Testing Strategies/1111.md`
- Create: `docs/zh-tw/Testing Strategies/1111.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1111
  title: Diagnosing & Fixing Flaky Tests
  state: draft
  category: Testing Strategies
  ---
  ```

  **H1:** `# Diagnosing & Fixing Flaky Tests`

  **Opening (2–4 paragraphs covering):**
  - A flaky test passes on some runs and fails on others, without any change to the code under test. Flaky tests erode trust in the test suite — when developers see a failing test, their first assumption is "it's probably flaky" rather than "the code is broken." This erosion is cumulative: as the proportion of flaky tests grows, developers begin ignoring test failures, defeating the test suite's purpose.
  - Most flaky tests fall into one of several categories: async timing issues (a test that doesn't wait long enough for an async operation), test order dependence (a test that passes only because a previous test set up state it depends on), environment flakiness (a test that produces different results in CI vs. locally due to different CPU speed, timezone, or random seeds), and shared resource contention (two parallel tests modifying the same database, file, or global variable).
  - The correct response to a flaky test is root-cause diagnosis, not retry. Retrying a flaky test in CI may hide the failure from the build report, but the flakiness remains and will surface again — perhaps at a less convenient time, or masking a real failure. Quarantining the test (isolating it from the main test run while diagnosing) is the responsible intermediate step.

  **`## Principle`:**

  Engineers MUST investigate and fix flaky tests rather than retrying them in CI. Configuring CI to retry failing tests silences the symptom without addressing the cause, reduces confidence in test results, and increases the probability that a real regression is masked by a "this test sometimes fails" assumption. Retry configuration is appropriate only as a temporary measure while a flaky test is quarantined and diagnosed.

  Engineers SHOULD quarantine flaky tests — move them to a separate test suite that does not block CI — when the root cause is not immediately diagnosable. A quarantined test is labeled, tracked in a backlog, and does not block CI while being investigated. This is preferable to leaving the flaky test in the main suite (where it erodes trust) or deleting it (where a real bug may go undetected).

  **`## Design Thinking` subsections:**
  - `### Async timing flakiness` — The most common source: `waitFor`, `findBy*`, and explicit `await` are correct; `setTimeout` delays and `sleep()` calls are not. Symptoms: test passes locally (faster machine) and fails in CI (slower runner). Fix: use `findBy*` queries which poll until the element appears, with a configurable timeout.
  - `### Test order dependence` — A test that passes only when run after a specific other test. Symptoms: fails when run in isolation (`--testNamePattern`), passes in full suite. Fix: ensure each test establishes its own initial state (`beforeEach` cleanup) and does not depend on state left by prior tests.
  - `### Global state and shared resources` — Tests that modify `window.location`, global variables, timers (`jest.useFakeTimers`), or shared databases without cleanup. Fix: use `afterEach` cleanup, `jest.restoreAllMocks()`, and per-test database isolation.
  - `### Environment differences` — Tests that depend on `Date.now()`, `Math.random()`, timezone, locale, or file system state produce different results in different environments. Fix: seed random values, mock `Date`, set explicit timezones in CI environment variables.
  - `### Identifying flaky tests` — Run the test in isolation 20+ times: `for i in {1..20}; do vitest run --reporter=verbose TestName.test.ts; done`. If it fails on any run, it is flaky. CI test result analytics platforms (Buildkite, GitHub Actions annotations) can surface flaky test patterns.

  **`## Best Practices`:**

  **MUST use Testing Library's `findBy*` queries rather than `getBy*` plus `waitFor` wrappers for elements that appear asynchronously.** `findBy*` is `getBy*` wrapped in `waitFor` with a default timeout; it polls until the element appears or the timeout expires. `getBy*` throws immediately if the element is not present. Using `getBy*` for async content is the most common source of async timing flakiness.

  **MUST clean up global state and mocks in `afterEach` hooks.** Tests that leak state into subsequent tests create order-dependent failures. `jest.restoreAllMocks()` or `vi.restoreAllMocks()` restores mocked functions; `server.resetHandlers()` restores MSW handlers; `localStorage.clear()` removes persisted data. Each test should begin from a clean, known state.

  **SHOULD quarantine flaky tests with a tracking comment and issue reference rather than deleting them or disabling them indefinitely.** A disabled test with a comment like `// TODO(#1234): flaky — times out on CI. Quarantined 2026-04-01` is a tracked debt item. A silently deleted test is a lost regression gate. Quarantine creates accountability for resolution.

  **`## Visual`:** Mermaid flowchart of flaky test triage: test fails → is it reproducible locally? → yes (deterministic bug) → fix the code → no → run in isolation 20x → still flaky? → identify category (timing/order/env/resource) → apply category-specific fix.

  **`## Example`:** Fixing async timing flakiness — before and after:
  ```js
  // Flaky: getBy* throws immediately if element hasn't rendered
  test('shows result after search', async () => {
    userEvent.type(screen.getByRole('searchbox'), 'query');
    userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(screen.getByText('Result 1')).toBeInTheDocument(); // timing-dependent
    });
  });
  // Reliable: findBy* polls until element appears or timeout
  test('shows result after search', async () => {
    await userEvent.type(screen.getByRole('searchbox'), 'query');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Result 1')).toBeInTheDocument(); // waits automatically
  });
  ```

  **`## Related FEEs`:**
  - FEE-1100 — Testing Strategies Overview
  - FEE-1102 — Component Testing with Testing Library
  - FEE-1109 — API Mocking with MSW & Integration Testing
  - FEE-1107 — Testing Philosophy: Coverage, Confidence & the Testing Pyramid

  **`## References`:**
  - Testing Library: Async utilities — https://testing-library.com/docs/dom-testing-library/api-async
  - Google Testing Blog: Flaky tests — https://testing.googleblog.com/2020/12/test-flakiness-one-of-main-challenges.html
  - Vitest: Test retries — https://vitest.dev/config/#retry

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1111
  title: 診斷與修復不穩定測試
  state: draft
  category: Testing Strategies
  ---
  ```
  **H1:** `# 診斷與修復不穩定測試`

  Related FEE titles:
  - FEE-1100 — 測試策略總覽
  - FEE-1102 — 使用 Testing Library 進行元件測試
  - FEE-1109 — 使用 MSW 進行 API 模擬與整合測試
  - FEE-1107 — 測試哲學：覆蓋率、信心與測試金字塔

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Testing Strategies/1111.md" "docs/zh-tw/Testing Strategies/1111.md"
  git commit -m "feat(fee-1111): diagnosing & fixing flaky tests — EN + zh-TW"
  ```

---

### Task 10: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [907.Icon Systems](907)`, add:
  ```
  - [908.Variant & Token Composition](908)
  - [909.Multi-Brand Design Systems](909)
  ```

  After `- [1007.Accessible Component Patterns](1007)`, add:
  ```
  - [1008.Cognitive Accessibility](1008)
  - [1009.Motion & Animation Accessibility](1009)
  - [1010.Accessibility & Internationalization Intersection](1010)
  ```

  After `- [1107.Testing Philosophy: Coverage, Confidence & the Testing Pyramid](1107)`, add:
  ```
  - [1108.Snapshot Testing](1108)
  - [1109.API Mocking with MSW & Integration Testing](1109)
  - [1110.Performance Testing in CI](1110)
  - [1111.Diagnosing & Fixing Flaky Tests](1111)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [907.圖示系統](907)`, add:
  ```
  - [908.變體與設計代幣組合](908)
  - [909.多品牌設計系統](909)
  ```

  After `- [1007.無障礙元件模式](1007)`, add:
  ```
  - [1008.認知無障礙](1008)
  - [1009.動態與動畫無障礙](1009)
  - [1010.無障礙與國際化的交集](1010)
  ```

  After `- [1107.測試哲學：覆蓋率、信心與測試金字塔](1107)`, add:
  ```
  - [1108.快照測試](1108)
  - [1109.使用 MSW 進行 API 模擬與整合測試](1109)
  - [1110.CI 中的效能測試](1110)
  - [1111.診斷與修復不穩定測試](1111)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-908–909, 1008–1010, 1108–1111 to list files"
  ```
