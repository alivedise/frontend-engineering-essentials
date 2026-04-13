# FEE Gap-Fill Batch A — HTML & CSS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 5 gap-fill articles for the HTML (FEE-107–108) and CSS (FEE-208–210) categories in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/HTML and Semantic Markup/107.md` — Structured Data & Schema.org
- `docs/en/HTML and Semantic Markup/108.md` — HTML Security Attributes
- `docs/en/CSS and Layout Systems/208.md` — CSS Subgrid
- `docs/en/CSS and Layout Systems/209.md` — CSS Containment & `contain`
- `docs/en/CSS and Layout Systems/210.md` — Backdrop Filter, Mix-Blend-Mode & Visual Effects

**Files to create (zh-TW):** Mirror of the above under `docs/zh-tw/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing any article. Key rules:

- Frontmatter: `id`, `title`, `state: draft`, `category`
- Opening: 2–4 paragraphs before any `##` heading
- `## Principle` — 1–2 paragraphs, RFC-2119 MUST/SHOULD/MUST NOT, NOT a restatement of intro
- `## Design Thinking` — `###` subsections with prose
- `## Best Practices` — bold-prefix RFC-2119 paragraphs only; NO code blocks, NO `###`, NO bullets
- BP prefix severity must match body severity (MUST prefix → MUST body)
- `## Visual` — one Mermaid diagram
- `## Example` — one realistic code block
- `## Common Mistakes` — optional; include only for non-obvious pitfalls
- `## Related FEEs` — 3+ entries
- `## References` — 3+ URLs, no upper limit

zh-TW section headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

zh-TW BP keywords: 必須（MUST）/ 應該（SHOULD）/ 禁止（MUST NOT）

Target: 300+ lines per file.

---

### Task 1: FEE-107 Structured Data & Schema.org

**Files:**
- Create: `docs/en/HTML and Semantic Markup/107.md`
- Create: `docs/zh-tw/HTML and Semantic Markup/107.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 107
  title: Structured Data & Schema.org
  state: draft
  category: HTML and Semantic Markup
  ---
  ```

  **H1:** `# Structured Data & Schema.org`

  **Opening (2–4 paragraphs covering):**
  - Structured data is machine-readable markup embedded in HTML that tells search engines, social platforms, and other crawlers what a page is about — not just what it contains. While HTML conveys visual structure, structured data conveys semantic meaning: this is a product with a price and a review score; this is a recipe with ingredients and a cook time; this is an article with an author and a publication date.
  - Three formats exist for embedding structured data: JSON-LD (JavaScript Object Notation for Linked Data), Microdata, and RDFa. All three are valid according to schema.org, but JSON-LD has become the dominant format because it keeps structured data entirely separate from visible HTML, making it easier to maintain and impossible to accidentally alter when changing the page layout.
  - Search engines use structured data to generate rich results: star ratings in search snippets, recipe cards, FAQ accordions, event listings, product carousels. These rich results increase click-through rates by making search listings more informative. The benefit is conditional on the structured data being accurate and matching the actual page content — search engines penalize fabricated or misleading markup.
  - For SPAs and SSR-rendered pages, structured data requires deliberate handling. Crawlers that do not execute JavaScript will not see structured data injected by client-side scripts; structured data must be present in the server-rendered HTML. The relationship between structured data and rendering strategy is a practical concern for any team that cares about SEO.

  **`## Principle`:**

  Engineers MUST use JSON-LD as the format for all new structured data implementations and MUST place the `<script type="application/ld+json">` element in the `<head>` or `<body>` of the server-rendered HTML, not inject it via client-side JavaScript after page load. Search engine crawlers that do not execute JavaScript will not find structured data injected after the initial HTML response. JSON-LD is separate from the visible markup, which means structured data edits do not risk accidentally breaking the visible layout, and layout edits do not risk corrupting the structured data.

  Engineers MUST NOT publish structured data that misrepresents page content — fabricating review scores, claiming a page is a product page when it is not, or adding aggregate ratings that do not reflect actual reviews. Google's structured data guidelines explicitly prohibit this, and violations can result in manual penalties that remove rich results from the site's search appearance across all pages, not just the offending page.

  **`## Design Thinking` subsections:**
  - `### JSON-LD vs. Microdata vs. RDFa` — Why JSON-LD won: it separates data from HTML, tolerates layout refactors, is easier to generate programmatically, and is Google's recommended format.
  - `### Schema.org vocabulary depth` — schema.org defines hundreds of types. Most sites need fewer than ten: `WebPage`, `Article`, `Product`, `Review`, `AggregateRating`, `BreadcrumbList`, `FAQPage`, `Organization`, `Person`, `Event`. Explain how types nest (a `Product` embeds `AggregateRating` which embeds `Review`).
  - `### Structured data in SSR and SPAs` — Server-rendered frameworks (Next.js, Nuxt, Astro) can inject structured data in the `<head>` during rendering. SPAs that rely solely on client-side injection are invisible to crawlers. The correct SPA strategy is to pre-render pages with structured data embedded.
  - `### Validation and monitoring` — Google Rich Results Test, Schema Markup Validator, Google Search Console's Rich Results report. Validation as part of CI using the Schema Markup Validator API.

  **`## Best Practices`:**

  **MUST use JSON-LD for all structured data implementations and embed it in server-rendered HTML, not inject it via client-side JavaScript.** Crawlers that do not execute JavaScript — including Google's crawler on first-pass indexing — will not find structured data added after the initial page load. JSON-LD placed in the server-rendered `<head>` is present in every crawl, every time, regardless of the crawler's JavaScript support.

  **MUST keep structured data accurate and synchronized with the visible page content.** A product page whose JSON-LD claims a 4.8-star aggregate rating when the visible reviews average 3.1 violates Google's structured data guidelines. Synchronization is best achieved by generating JSON-LD programmatically from the same data source that renders the visible content, rather than maintaining separate structured data templates.

  **MUST NOT add structured data types to pages that do not match the type's semantic meaning.** Adding `Product` markup to a category listing page, or `Review` markup to editorial copy that is not a first-person customer review, confuses crawlers and risks a structured data manual action. Apply only the most specific type that accurately describes the page.

  **SHOULD validate structured data in CI using the Schema Markup Validator or a similar tool before deploying changes to pages with structured data.** Validation catches schema errors — missing required properties, malformed dates, invalid enumeration values — before they suppress rich results in production. Rich result eligibility is lost silently: the page still loads, search traffic still arrives, but the enhanced search appearance is gone until the markup is corrected and Google re-crawls.

  **`## Visual`:** Mermaid diagram showing the JSON-LD nesting structure for a Product page: `Product` → `AggregateRating` → `Review` → `Person`, with property names annotated at each level.

  **`## Example`:** A complete `<script type="application/ld+json">` block for a product page with `@context`, `@type: "Product"`, `name`, `image`, `description`, `offers` (with `Offer`), and `aggregateRating` (with `AggregateRating`).

  **`## Common Mistakes`:**
  - Using `Microdata` attributes directly in HTML elements then refactoring the HTML and silently breaking the structured data
  - Injecting `<script type="application/ld+json">` via `document.createElement` in a SPA without SSR — invisible to crawlers
  - Omitting required properties (`offers.price`, `offers.priceCurrency`) causing the rich result to be ineligible
  - Hardcoding aggregate ratings that drift from actual review data

  **`## Related FEEs`:**
  - FEE-100 — HTML & Semantic Markup Overview
  - FEE-101 — Document Structure & Metadata
  - FEE-108 — HTML Security Attributes
  - FEE-701 — Rendering Strategies: CSR, SSR, SSG & Streaming (affects structured data visibility)

  **`## References`:**
  - Google Structured Data Developer Guide — https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
  - schema.org — https://schema.org
  - Google Rich Results Test — https://search.google.com/test/rich-results
  - Schema Markup Validator — https://validator.schema.org
  - JSON-LD Specification — https://www.w3.org/TR/json-ld11/

- [ ] **Step 2: Verify EN format**

  - [ ] Frontmatter has `id: 107`, `state: draft`, `category: HTML and Semantic Markup`
  - [ ] Opening is 2–4 paragraphs with no `##` heading above them
  - [ ] `## Principle` has 1–2 paragraphs; does not restate the intro
  - [ ] `## Best Practices` has no code blocks, no `###`, no bullet lists
  - [ ] Each BP paragraph bold-prefix severity matches body severity
  - [ ] File is 300+ lines

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 107
  title: 結構化資料與 Schema.org
  state: draft
  category: HTML and Semantic Markup
  ---
  ```

  **H1:** `# 結構化資料與 Schema.org`

  Translate the EN article into Traditional Chinese. Section headers:
  - `## 原則`
  - `## 設計思維` with `###` subsections
  - `## 最佳實踐` with 必須（MUST）/ 應該（SHOULD）/ 禁止（MUST NOT）prefixes
  - `## 視覺呈現`
  - `## 範例`
  - `## 常見錯誤`
  - `## 相關 FEE`
  - `## 參考資料`

  Related FEE titles in zh-TW:
  - FEE-100 — HTML 與語意標記總覽
  - FEE-101 — 文件結構與中繼資料
  - FEE-108 — HTML 安全屬性
  - FEE-701 — 渲染策略：CSR、SSR、SSG 與串流

- [ ] **Step 4: Verify zh-TW format**

  - [ ] All section headers are zh-TW (no English `## Design Thinking` etc.)
  - [ ] BP uses 必須（MUST）/ 應該（SHOULD）/ 禁止（MUST NOT）
  - [ ] No stray editorial notes or English section headers in the body
  - [ ] File is 300+ lines

- [ ] **Step 5: Commit**

  ```bash
  git add "docs/en/HTML and Semantic Markup/107.md" "docs/zh-tw/HTML and Semantic Markup/107.md"
  git commit -m "feat(fee-107): structured data & schema.org — EN + zh-TW"
  ```

---

### Task 2: FEE-108 HTML Security Attributes

**Files:**
- Create: `docs/en/HTML and Semantic Markup/108.md`
- Create: `docs/zh-tw/HTML and Semantic Markup/108.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 108
  title: HTML Security Attributes
  state: draft
  category: HTML and Semantic Markup
  ---
  ```

  **H1:** `# HTML Security Attributes`

  **Opening (2–4 paragraphs covering):**
  - Several HTML attributes exist specifically to constrain what cross-origin content can do. These attributes — `crossorigin`, `referrerpolicy`, `sandbox`, `rel="noopener noreferrer"`, and `integrity` — are not primarily about appearance or functionality; they are about controlling the security properties of embedded content, external links, and cross-origin resource loads. Getting them wrong exposes users to tab-napping, cross-origin data leaks, and untrusted script execution.
  - Most of these attributes are additive: adding them restricts behavior that would otherwise be unrestricted. A `<a target="_blank">` without `rel="noopener"` gives the opened page access to the opener's `window` object. An `<iframe>` without `sandbox` runs scripts in the embedding page's origin. A `<script src="cdn.example.com/lib.js">` without `integrity` executes whatever the CDN serves, even if that content changes after deployment.
  - Browser defaults are permissive for historical compatibility reasons. The burden falls on developers to add restrictions explicitly. Security-aware HTML authoring means knowing which attributes to add to which elements, and knowing what each attribute restricts. The cost of adding them is zero; the cost of omitting them can be a user's session compromised.

  **`## Principle`:**

  Engineers MUST add `rel="noopener noreferrer"` to every `<a>` element with `target="_blank"`. Without `rel="noopener"`, the opened page receives a reference to the opener's `window` object via `window.opener`, which it can use to redirect the opener to a phishing page — an attack known as reverse tabnapping. `noreferrer` additionally suppresses the `Referer` header, preventing the destination from learning the URL of the referring page. Modern browsers have changed their default for `target="_blank"` to imply `rel="noopener"`, but the explicit attribute remains necessary for browser compatibility and is the correct pattern regardless.

  Engineers MUST set the `sandbox` attribute on all `<iframe>` elements that embed third-party content, with only the capabilities explicitly required. A sandboxed iframe runs in a separate browsing context with no access to the embedding page's cookies, storage, or JavaScript scope. The `allow-scripts` and `allow-same-origin` sandbox tokens MUST NOT be combined; their combination negates the sandbox's origin isolation, because a script running in a same-origin iframe can remove the sandbox attribute from itself.

  **`## Design Thinking` subsections:**
  - `### crossorigin on resource elements` — `<img crossorigin>`, `<script crossorigin>`, `<link crossorigin>`. Anonymous vs. use-credentials. Required for CORS resource sharing, canvas taint, and error stack traces on cross-origin scripts.
  - `### referrerpolicy` — The eight policy values. `strict-origin-when-cross-origin` as the modern default. When to use `no-referrer` (sensitive pages). Setting policy per-element vs. per-document via `<meta name="referrer">`.
  - `### sandbox on iframes` — Permission tokens and their implications. The `allow-same-origin` + `allow-scripts` anti-pattern. CSP `frame-src` as a complementary control.
  - `### integrity (SRI preview)` — Brief introduction; deep treatment in FEE-1208. Covers the `integrity` attribute format (`sha384-<hash>`), when it applies (cross-origin `<script>` and `<link rel="stylesheet">`), and what happens when the hash mismatches (load blocked).

  **`## Best Practices`:**

  **MUST add `rel="noopener noreferrer"` to every `<a target="_blank">` element regardless of whether the destination is same-origin or cross-origin.** The reverse tabnapping attack requires only that `window.opener` be accessible; whether the destination is on the same domain is irrelevant if the destination page can be compromised. Making `rel="noopener noreferrer"` a universal rule removes the judgment call about which links are "safe enough" to omit it.

  **MUST set `sandbox` on every `<iframe>` embedding third-party content, specifying only the minimum tokens required for the embed to function.** Start with a bare `sandbox` attribute (all restrictions active) and add tokens — `allow-scripts`, `allow-forms`, `allow-popups` — only when the embed's functionality demonstrably requires them. Document the reason for each added token in a comment.

  **MUST NOT combine `sandbox="allow-scripts allow-same-origin"` on a single `<iframe>`.** A script running in a same-origin sandboxed iframe can access and remove the `sandbox` attribute from its own frame, negating all restrictions. If both tokens are required by the embed, the sandboxing approach is unsuitable and an alternative containment strategy — such as a different origin or a separate subdomain — must be used.

  **SHOULD set `crossorigin="anonymous"` on `<script>` elements loaded from cross-origin CDNs when `integrity` is also set.** Without `crossorigin="anonymous"`, the browser loads the script without CORS headers, and the `integrity` check cannot be performed on the response because CORS is required for subresource integrity validation on cross-origin resources. The combination of `crossorigin="anonymous"` and `integrity` is the correct pattern for CDN-hosted scripts.

  **`## Visual`:** Mermaid diagram or table showing: element type → relevant security attributes → what each attribute restricts. Rows: `<a>`, `<iframe>`, `<script>` (cross-origin), `<img>` (cross-origin), `<link>`.

  **`## Example`:** Code block showing four elements with correct security attributes: `<a target="_blank" rel="noopener noreferrer">`, `<iframe sandbox="allow-scripts allow-forms">`, `<script src="https://cdn.example.com/lib.js" integrity="sha384-..." crossorigin="anonymous">`, and `<img src="https://api.example.com/avatar.png" crossorigin="anonymous">`.

  **`## Common Mistakes`:**
  - `<a target="_blank">` without `rel="noopener"` — the reverse tabnapping vector
  - `sandbox="allow-scripts allow-same-origin"` — the self-removal anti-pattern
  - Setting `crossorigin` without `integrity` (or vice versa) on CDN scripts — integrity check silently skipped
  - Using `sandbox` but forgetting `allow-forms` for iframe embeds that contain forms

  **`## Related FEEs`:**
  - FEE-100 — HTML & Semantic Markup Overview
  - FEE-1200 — Security Overview
  - FEE-1201 — Content Security Policy (complements attribute-based restrictions)
  - FEE-1208 — Subresource Integrity (deep treatment of `integrity`)

  **`## References`:**
  - MDN: rel=noopener — https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener
  - MDN: iframe sandbox — https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
  - MDN: crossorigin attribute — https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin
  - MDN: referrerpolicy — https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/referrerpolicy
  - OWASP: Reverse Tabnapping — https://owasp.org/www-community/attacks/Reverse_Tabnabbing

- [ ] **Step 2: Verify EN format**

  - [ ] Frontmatter has `id: 108`, `state: draft`, `category: HTML and Semantic Markup`
  - [ ] `## Principle` is 1–2 paragraphs, no code blocks inside it
  - [ ] `## Best Practices` has no code blocks, no `###`, no bullets
  - [ ] File is 300+ lines

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 108
  title: HTML 安全屬性
  state: draft
  category: HTML and Semantic Markup
  ---
  ```

  **H1:** `# HTML 安全屬性`

  Translate EN article to zh-TW. Related FEE titles:
  - FEE-100 — HTML 與語意標記總覽
  - FEE-1200 — 資訊安全總覽
  - FEE-1201 — 內容安全政策（CSP）
  - FEE-1208 — 子資源完整性（SRI）

- [ ] **Step 4: Verify zh-TW format**

  - [ ] All section headers in zh-TW
  - [ ] BP uses 必須（MUST）/ 應該（SHOULD）/ 禁止（MUST NOT）
  - [ ] File is 300+ lines

- [ ] **Step 5: Commit**

  ```bash
  git add "docs/en/HTML and Semantic Markup/108.md" "docs/zh-tw/HTML and Semantic Markup/108.md"
  git commit -m "feat(fee-108): HTML security attributes — EN + zh-TW"
  ```

---

### Task 3: FEE-208 CSS Subgrid

**Files:**
- Create: `docs/en/CSS and Layout Systems/208.md`
- Create: `docs/zh-tw/CSS and Layout Systems/208.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 208
  title: CSS Subgrid
  state: draft
  category: CSS and Layout Systems
  ---
  ```

  **H1:** `# CSS Subgrid`

  **Opening (2–4 paragraphs covering):**
  - CSS Grid introduced a two-dimensional layout system for direct children of a grid container. For years, a critical limitation remained: nested elements inside a grid item could not participate in the parent grid's track structure. If a card component had a header, body, and footer, and ten such cards were in a grid, there was no way to make all card headers align with each other across rows without JavaScript measurement. Subgrid closes this gap.
  - `grid-template-columns: subgrid` and `grid-template-rows: subgrid` allow a grid item that is itself a grid container to inherit the parent grid's track definitions. A nested element inside a subgrid item can be placed on the parent grid's lines, creating alignment that spans the full layout hierarchy without duplicating track definitions or using JavaScript.
  - Subgrid is a browser capability that was long requested and slowly adopted. Firefox shipped it first in 2019; Chromium followed in 2023; Safari added it in 2022. As of 2024, subgrid has broad support across all major browsers. The pattern of inheriting parent tracks turns a class of layout problems — aligned multi-element cards, form label/input alignment, complex editorial layouts — from JavaScript hacks into pure CSS.

  **`## Principle`:**

  Engineers SHOULD use subgrid when nested elements inside grid items need to align with sibling items' internal elements across the same row or column. The canonical use case is card components: when every card in a grid has a title, body, and call-to-action, subgrid allows the titles across all cards to share a grid row, the bodies to share a row, and the CTAs to share a row, so that all cards in a row have equal height at each section — without fixed heights, without JavaScript measurement, and without duplicating the parent grid's column definition.

  Engineers MUST NOT use subgrid as a substitute for proper component-level layout. If a component's internal layout does not need to align with sibling component internals, a self-contained nested grid or flexbox is simpler, more portable, and easier to reason about. Subgrid creates a coupling between the parent layout and the component's internals; that coupling is appropriate when alignment across siblings is required, and unnecessary overhead when it is not.

  **`## Design Thinking` subsections:**
  - `### What subgrid solves that regular nested grids cannot` — The alignment-across-siblings problem. Why `align-items: stretch` on grid items is not sufficient. The historical JavaScript measurement workaround and why it breaks on resize.
  - `### Rows vs. columns: independent subgrid axes` — A grid item can use subgrid for columns, rows, or both independently. Common use case: subgrid for rows (to align card section heights) while keeping independent column layout inside the card.
  - `### Named grid lines in subgrid` — Parent grid named lines are inherited by subgrid. A card can use `grid-row: card-header-start / card-header-end` if those lines are defined on the parent, making placement intent explicit.
  - `### Browser support and progressive enhancement` — Support table (Firefox 71+, Chrome 117+, Safari 16+). `@supports (grid-template-columns: subgrid)` for progressive enhancement. Fallback: fixed heights or JavaScript-based equalization.

  **`## Best Practices`:**

  **SHOULD use `grid-template-rows: subgrid` (or columns) on grid items whose internal elements must align with the same elements in sibling items.** The intent of subgrid is alignment inheritance; applying it when there is no alignment requirement across siblings adds indirection for no benefit.

  **MUST add `@supports (grid-template-columns: subgrid)` when using subgrid in production to provide a layout fallback for older browsers.** Without a fallback, cards in non-supporting browsers have no section alignment, potentially producing broken or visually inconsistent layouts. A simple fallback restores the pre-subgrid appearance, which, while not pixel-perfect, is functional.

  **SHOULD name the relevant grid lines on the parent grid container when child components reference those lines by name.** Named lines make the parent/subgrid contract explicit: a designer reading the parent grid definition can see which lines are meant to be inherited, and a developer reading the card component can see which parent lines it depends on.

  **`## Visual`:** Mermaid diagram or ASCII-art style illustration showing a 3-column grid with two card items, each card using subgrid rows. Show how the title row, body row, and CTA row align across both cards because they share the same inherited row tracks.

  **`## Example`:** Complete code block: a `.card-grid` container with `display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: auto 1fr auto;` and `.card` children with `display: grid; grid-template-rows: subgrid; grid-row: span 3;`, containing `.card-header`, `.card-body`, `.card-footer`.

  **`## Related FEEs`:**
  - FEE-200 — CSS & Layout Systems Overview
  - FEE-203 — Flexbox & Grid
  - FEE-204 — Responsive Design & Container Queries

  **`## References`:**
  - MDN: CSS Subgrid — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid
  - CSS Tricks: Subgrid — https://css-tricks.com/css-subgrid/
  - Can I Use: Subgrid — https://caniuse.com/css-subgrid
  - W3C CSS Grid Layout Module Level 2 — https://www.w3.org/TR/css-grid-2/

- [ ] **Step 2: Verify EN format**

  - [ ] Frontmatter has `id: 208`, `state: draft`, `category: CSS and Layout Systems`
  - [ ] `## Best Practices` has no code blocks or `###`
  - [ ] File is 300+ lines

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 208
  title: CSS Subgrid
  state: draft
  category: CSS and Layout Systems
  ---
  ```

  **H1:** `# CSS Subgrid`

  Translate EN article to zh-TW. Related FEE titles:
  - FEE-200 — CSS 與排版系統總覽
  - FEE-203 — Flexbox 與 Grid
  - FEE-204 — 響應式設計與容器查詢

- [ ] **Step 4: Verify zh-TW format**

  - [ ] All section headers in zh-TW
  - [ ] File is 300+ lines

- [ ] **Step 5: Commit**

  ```bash
  git add "docs/en/CSS and Layout Systems/208.md" "docs/zh-tw/CSS and Layout Systems/208.md"
  git commit -m "feat(fee-208): CSS subgrid — EN + zh-TW"
  ```

---

### Task 4: FEE-209 CSS Containment & `contain`

**Files:**
- Create: `docs/en/CSS and Layout Systems/209.md`
- Create: `docs/zh-tw/CSS and Layout Systems/209.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 209
  title: CSS Containment & contain
  state: draft
  category: CSS and Layout Systems
  ---
  ```

  **H1:** `# CSS Containment & \`contain\``

  **Opening (2–4 paragraphs covering):**
  - The browser's rendering pipeline is interconnected: a change to one element's layout can force recalculation of the layout of distant elements in the document. CSS containment allows developers to scope these recalculations. The `contain` property tells the browser that an element and its subtree are independent from the rest of the document — layout changes inside the contained element cannot affect elements outside it, and elements outside cannot affect the contained element's layout.
  - `content-visibility: auto` extends this further. It tells the browser to skip rendering entirely for off-screen elements, treating them as if they had `contain: strict` until they approach the viewport. For long-document pages — news articles with dozens of sections, infinite scroll feeds, dashboards with many panels — `content-visibility: auto` can reduce initial rendering time by a factor of five or more, because the browser renders only the visible portion and defers the rest.
  - Containment is a performance primitive. It does not change visual appearance; it changes what the browser's rendering engine must recalculate when something changes. Teams that profile their layouts and find that a small change in a sidebar triggers a full-page layout recalculation have found containment's primary use case.

  **`## Principle`:**

  Engineers SHOULD apply `contain: layout paint` to widget-like components — cards, sidebars, modal dialogs, comment threads — whose internal layout changes are independent of the surrounding document layout. Layout containment prevents internal changes from triggering layout recalculation outside the container; paint containment prevents internal content from rendering outside the container's boundaries, enabling the browser to skip painting the container when it is off-screen. Combining both is the most common and effective use of the `contain` property.

  Engineers SHOULD apply `content-visibility: auto` to large sections of long-document pages to defer rendering of off-screen content. For sections that do not interact with the viewport until scrolled into view — and that have a predictable height — `content-visibility: auto` plus `contain-intrinsic-size` provides the most significant rendering performance improvement available in CSS. The `contain-intrinsic-size` value must be set to a reasonable estimate of the section's rendered height to prevent layout jump when the section becomes visible.

  **`## Design Thinking` subsections:**
  - `### The four containment types` — `size`, `layout`, `style`, `paint`. What each one prevents the browser from recalculating. `contain: strict` = all four. `contain: content` = `layout style paint` (excludes size). Practical combinations.
  - `### content-visibility: auto vs. lazy loading` — `content-visibility: auto` defers rendering; it does not defer network requests. Images inside a `content-visibility: auto` section are still fetched. Use `loading="lazy"` for images in combination.
  - `### contain-intrinsic-size and layout shift` — Without `contain-intrinsic-size`, sections with `content-visibility: auto` have zero height before rendering, causing layout shift when they become visible. Setting a height estimate prevents CLS.
  - `### When NOT to use containment` — Containment breaks `position: fixed` descendants (fixed positioning is relative to the containing block, not the viewport, inside a contain:layout element). Overflow clip behavior changes. Test visually before shipping.

  **`## Best Practices`:**

  **SHOULD apply `contain: layout paint` to self-contained UI components whose internal layout is independent of the document flow.** Cards, sidebars, and widgets are canonical examples. The browser can skip recalculating the external layout when the component's internal content changes, and skip painting the component when it is off-screen or clipped.

  **SHOULD apply `content-visibility: auto` to large off-screen page sections and pair it with `contain-intrinsic-size` to prevent layout shift.** Without `contain-intrinsic-size`, the browser assigns the section zero height before rendering, and layout shifts occur as sections are rendered during scroll. The intrinsic size value should be a reasonable estimate — not a pixel-perfect measurement — and should be updated if the section's typical rendered height changes significantly.

  **MUST NOT use `contain: layout` on elements that contain `position: fixed` or `position: sticky` children.** Layout containment creates a new containing block, causing fixed-position descendants to be positioned relative to the contained element rather than the viewport. This is a silent behavioral change — the element still renders, but its position is wrong.

  **`## Visual`:** Mermaid diagram showing the rendering pipeline: Style → Layout → Paint → Composite, with arrows showing which `contain` values skip which pipeline stages for the contained subtree.

  **`## Example`:** Code block demonstrating `content-visibility: auto` on a long-document page section: `.content-section { content-visibility: auto; contain-intrinsic-size: auto 500px; }`. Also show `contain: layout paint` on a card component.

  **`## Common Mistakes`:**
  - Applying `contain: strict` without realizing it includes `contain: size`, which collapses the element to zero size unless explicit dimensions are set
  - Using `content-visibility: auto` without `contain-intrinsic-size`, causing CLS
  - Applying containment to elements with `position: fixed` children and wondering why the fixed elements no longer stick to the viewport

  **`## Related FEEs`:**
  - FEE-200 — CSS & Layout Systems Overview
  - FEE-704 — Core Web Vitals & Performance Metrics (CLS relationship)
  - FEE-712 — Critical Rendering Path & Paint Timing

  **`## References`:**
  - MDN: CSS contain — https://developer.mozilla.org/en-US/docs/Web/CSS/contain
  - MDN: content-visibility — https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility
  - web.dev: content-visibility — https://web.dev/articles/content-visibility
  - CSS Containment Module Level 2 — https://www.w3.org/TR/css-contain-2/

- [ ] **Step 2: Verify EN format**

  - [ ] Frontmatter has `id: 209`, `state: draft`
  - [ ] `## Best Practices` is prose-only paragraphs with bold RFC-2119 prefixes
  - [ ] File is 300+ lines

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 209
  title: CSS Containment 與 contain
  state: draft
  category: CSS and Layout Systems
  ---
  ```

  **H1:** `` # CSS Containment 與 `contain` ``

  Translate EN article to zh-TW. Related FEE titles:
  - FEE-200 — CSS 與排版系統總覽
  - FEE-704 — 核心 Web 指標與效能指標
  - FEE-712 — 關鍵渲染路徑與繪製計時

- [ ] **Step 4: Verify zh-TW format**

  - [ ] All section headers in zh-TW
  - [ ] File is 300+ lines

- [ ] **Step 5: Commit**

  ```bash
  git add "docs/en/CSS and Layout Systems/209.md" "docs/zh-tw/CSS and Layout Systems/209.md"
  git commit -m "feat(fee-209): CSS containment & contain — EN + zh-TW"
  ```

---

### Task 5: FEE-210 Backdrop Filter, Mix-Blend-Mode & Visual Effects

**Files:**
- Create: `docs/en/CSS and Layout Systems/210.md`
- Create: `docs/zh-tw/CSS and Layout Systems/210.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 210
  title: Backdrop Filter, Mix-Blend-Mode & Visual Effects
  state: draft
  category: CSS and Layout Systems
  ---
  ```

  **H1:** `# Backdrop Filter, Mix-Blend-Mode & Visual Effects`

  **Opening (2–4 paragraphs covering):**
  - CSS visual effects — `backdrop-filter`, `filter`, `mix-blend-mode`, and `isolation` — enable UI treatments that were previously achievable only through image assets or canvas. A frosted-glass navigation bar, a modal overlay that blurs the page behind it, a text element that inverts the color of whatever content lies beneath it — these are now single CSS properties. The shift from image assets to CSS has performance implications in both directions: CSS effects leverage the GPU compositor, but composited layers have memory costs, and naive application of these properties creates layer proliferation.
  - `backdrop-filter` applies graphical operations to the area behind an element — the pixels rendered below, not the element's own content. This is what creates the frosted-glass effect: `backdrop-filter: blur(12px)` blurs the content behind the element without blurring the element itself. `filter` applies operations to the element and its descendants.
  - `mix-blend-mode` controls how an element's pixels blend with the pixels of the elements beneath it — using blend modes familiar from graphics tools (multiply, screen, overlay, difference). `isolation: isolate` creates a new stacking context that prevents an element's blend mode from reaching further up the compositing tree than intended.
  - These properties are visually powerful and technically nuanced. Performance, browser support, and interaction with the compositing layer model require more care than typical layout properties. The guideline is: measure before shipping, provide fallbacks, and understand what `will-change` does and does not help.

  **`## Principle`:**

  Engineers SHOULD use `backdrop-filter` and `mix-blend-mode` only after verifying that the visual effect is part of the intended design, not as decorative additions introduced during development. Both properties force element promotion to a compositor layer and increase memory usage. On mobile devices with limited GPU memory, overuse of composited layers causes frame drops and jank that are difficult to diagnose after the fact. The performance cost of these effects scales with the size of the affected area, not the complexity of the filter function.

  Engineers MUST test `backdrop-filter` implementations on low-end Android devices and provide a `@supports not (backdrop-filter: blur(1px))` fallback. `backdrop-filter` has broad support in modern browsers but its GPU cost is non-trivial. A fallback that applies a semi-transparent background color or a subtle `box-shadow` preserves the design intent at negligible performance cost for devices that cannot handle the blur efficiently.

  **`## Design Thinking` subsections:**
  - `### backdrop-filter vs. filter` — What each operates on. `filter` affects the element and its subtree. `backdrop-filter` affects the composited content beneath the element. Common use: cards/modals use `backdrop-filter`; image color treatment uses `filter`.
  - `### mix-blend-mode and isolation` — Blend modes apply to the compositing of the element with everything below it in the stacking context. `isolation: isolate` limits blend mode application to within a specific stacking context. Without it, a blend mode can "bleed through" parent elements unexpectedly.
  - `### Compositing layers and memory` — `backdrop-filter`, `filter`, `mix-blend-mode`, and `will-change: transform` all promote elements to compositor layers. Each layer requires GPU memory for its texture. A page with many composited elements — hero sections, card grids with `hover: backdrop-filter`, fixed navbars with blur — can exhaust GPU memory on mobile.
  - `### Progressive enhancement strategy` — `@supports (backdrop-filter: blur(1px))` for frosted glass with solid-color fallback. `prefers-reduced-transparency` media query for accessibility.

  **`## Best Practices`:**

  **SHOULD apply `will-change: transform` or `will-change: filter` only to elements whose filter or transform properties animate, not to static elements as a "performance optimization."** `will-change` promotes the element to a compositor layer immediately, before any animation begins. On a static element, this occupies GPU memory for no benefit. The correct pattern is to add `will-change` only when an animation is about to start (often in a `:hover` or class-toggled state) and remove it when the animation ends.

  **MUST provide a fallback for `backdrop-filter` using `@supports not (backdrop-filter: blur(1px))`.** A fallback background color with slightly reduced opacity (`background: rgba(255, 255, 255, 0.85)`) preserves the frosted-glass intent for non-supporting or GPU-constrained environments. Without a fallback, the element renders with a transparent background on unsupporting browsers, making text unreadable over busy backgrounds.

  **SHOULD use `isolation: isolate` on parent elements that contain children with `mix-blend-mode` to prevent blend modes from compositing against the full page background.** Without isolation, a child's `mix-blend-mode: multiply` will multiply with every layer beneath it in the document, not just the elements inside the isolated container. This produces unexpected color shifts that are difficult to debug because they depend on what content is scrolled into view.

  **`## Visual`:** Mermaid diagram showing the compositing layer stack: page background → content layer → element with `backdrop-filter` → element's own content. Annotate which pixels `backdrop-filter` operates on vs. which `filter` operates on.

  **`## Example`:** Code block showing a frosted-glass navigation bar: `.navbar { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }` with `@supports not (backdrop-filter: blur(1px)) { .navbar { background: rgba(255, 255, 255, 0.92); } }`.

  **`## Common Mistakes`:**
  - Applying `backdrop-filter` to every card on a page and wondering why scroll performance degrades on mobile
  - Forgetting `-webkit-backdrop-filter` for Safari compatibility (as of 2024, still required)
  - Using `mix-blend-mode` without `isolation: isolate` and getting unexpected color blending from background elements
  - Adding `will-change: filter` to static elements "just in case"

  **`## Related FEEs`:**
  - FEE-200 — CSS & Layout Systems Overview
  - FEE-710 — GPU-Accelerated Animations & `will-change`
  - FEE-712 — Critical Rendering Path & Paint Timing

  **`## References`:**
  - MDN: backdrop-filter — https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
  - MDN: mix-blend-mode — https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
  - MDN: filter — https://developer.mozilla.org/en-US/docs/Web/CSS/filter
  - MDN: isolation — https://developer.mozilla.org/en-US/docs/Web/CSS/isolation
  - Can I Use: backdrop-filter — https://caniuse.com/css-backdrop-filter

- [ ] **Step 2: Verify EN format**

  - [ ] Frontmatter has `id: 210`, `state: draft`
  - [ ] `## Best Practices` is bold-prefix prose paragraphs only
  - [ ] File is 300+ lines

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 210
  title: 背景濾鏡、混合模式與視覺特效
  state: draft
  category: CSS and Layout Systems
  ---
  ```

  **H1:** `# 背景濾鏡、混合模式與視覺特效`

  Translate EN article to zh-TW. Related FEE titles:
  - FEE-200 — CSS 與排版系統總覽
  - FEE-710 — GPU 加速動畫與 `will-change`
  - FEE-712 — 關鍵渲染路徑與繪製計時

- [ ] **Step 4: Verify zh-TW format**

  - [ ] All section headers in zh-TW
  - [ ] File is 300+ lines

- [ ] **Step 5: Commit**

  ```bash
  git add "docs/en/CSS and Layout Systems/210.md" "docs/zh-tw/CSS and Layout Systems/210.md"
  git commit -m "feat(fee-210): backdrop filter, mix-blend-mode & visual effects — EN + zh-TW"
  ```

---

### Task 6: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add new entries to `docs/en/list.md`**

  After the line `- [106.HTML APIs & Progressive Enhancement](106)`, add:
  ```
  - [107.Structured Data & Schema.org](107)
  - [108.HTML Security Attributes](108)
  ```

  After the line `- [207.CSS Custom Properties & Theming](207)`, add:
  ```
  - [208.CSS Subgrid](208)
  - [209.CSS Containment & contain](209)
  - [210.Backdrop Filter, Mix-Blend-Mode & Visual Effects](210)
  ```

- [ ] **Step 2: Add new entries to `docs/zh-tw/list.md`**

  After the line `- [106.HTML API 與漸進增強](106)`, add:
  ```
  - [107.結構化資料與 Schema.org](107)
  - [108.HTML 安全屬性](108)
  ```

  After the line `- [207.CSS 自訂屬性與主題化](207)`, add:
  ```
  - [208.CSS Subgrid](208)
  - [209.CSS Containment 與 contain](209)
  - [210.背景濾鏡、混合模式與視覺特效](210)
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-107, 108, 208, 209, 210 to list files"
  ```
