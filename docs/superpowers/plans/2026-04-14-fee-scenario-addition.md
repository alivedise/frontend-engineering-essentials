# FEE Scenario Section Addition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `## Scenario` / `## 使用情境` section to all 51 articles in the 100–400 series (HTML, CSS, JavaScript Core, Browser APIs), plus update FEE-0 to document the new section.

**Architecture:** Each task covers one category. For every article, write a 1-paragraph Scenario (3-5 sentences) that opens with a product situation, names the specific problem that makes the API necessary, and leads into why the API is the right tool — without naming the API in the first sentence. Insert after the opening paragraphs, before `## Design Thinking`. Write EN first, then zh-TW (`## 使用情境`). Update FEE-0 in Task 1.

**Tech Stack:** Markdown files, bash (grep/wc -l for verification), git.

**Prerequisite:** Pass 1 (Principle removal) must be fully committed before starting this plan.

---

## Scenario Quality Rules (read before every task)

**A good Scenario:**
- Opens with a product feature or engineering problem, not the API name
- Names the specific pain point or constraint that makes the API necessary
- Is 3-5 sentences of prose — no bullet points, no headers within the section
- Could not be copy-pasted unchanged onto a different article
- zh-TW version is a natural translation, not word-for-word — adapt idiom as needed

**A bad Scenario (reject these):**
- "This API is useful in many situations where you need to..." (generic)
- "When you need to use IntersectionObserver..." (restates the title)
- Fewer than 3 sentences
- Includes a code block (exception: multi-tab/multi-window APIs where setup is incomprehensible in prose)

**Placement:** After the last opening paragraph, before `## Design Thinking`. The section heading is `## Scenario` (EN) and `## 使用情境` (zh-TW).

**Verify after each file:**
```bash
grep -n "^## Scenario" <en-file>       # must exist
grep -n "^## 使用情境" <zh-tw-file>    # must exist
grep -n "^## Design Thinking" <en-file> # must come AFTER ## Scenario
wc -l <en-file>                         # must be 301+
wc -l <zh-tw-file>                      # must be 301+
```

---

## Task 1: FEE-0 Update + HTML (Batch S-A)

**Files (EN):**
- Modify: `docs/en/FEE Overall/0.md`
- Modify: `docs/en/HTML and Semantic Markup/100.md`
- Modify: `docs/en/HTML and Semantic Markup/101.md`
- Modify: `docs/en/HTML and Semantic Markup/102.md`
- Modify: `docs/en/HTML and Semantic Markup/103.md`
- Modify: `docs/en/HTML and Semantic Markup/104.md`
- Modify: `docs/en/HTML and Semantic Markup/105.md`
- Modify: `docs/en/HTML and Semantic Markup/106.md`
- Modify: `docs/en/HTML and Semantic Markup/107.md`
- Modify: `docs/en/HTML and Semantic Markup/108.md`

**Files (zh-TW counterparts):** same 10 files under `docs/zh-tw/`

- [ ] **Step 1: Update FEE-0 EN — add Scenario to documented template**

In `docs/en/FEE Overall/0.md`, find the section listing. Add `Scenario` as a new entry immediately after the opening-paragraphs entry and before `Design Thinking`. Add a note that Scenario applies to 100–400 series articles only. The entry should read approximately: `- **Scenario** (100–400 series only) — A concrete product situation showing when this API or feature is the right tool.`

- [ ] **Step 2: Update FEE-0 zh-TW**

In `docs/zh-tw/FEE Overall/0.md`, add the equivalent zh-TW entry: `- **使用情境**（僅適用於 100–400 系列）——描述一個具體的產品情境，說明此 API 或特性是正確選擇的時機。`

- [ ] **Step 3: Write Scenario sections for all 9 HTML articles (100–108)**

Read each article to understand its topic, then write a 3-5 sentence Scenario section. Insert after the last opening paragraph, before `## Design Thinking`. Process EN then zh-TW for each article.

Reference scenarios to guide tone and quality (these are examples — each article needs its own unique scenario):

**100.md** (HTML & Semantic Markup Overview): You are reviewing a pull request where a junior developer has built a feature entirely with `<div>` and `<span>` elements. Screen readers announce the content as an undifferentiated wall of text, and automated accessibility audits report zero landmark regions. The core issue is not a styling problem — it is a structural one. HTML's semantic elements exist precisely to solve this: they communicate meaning to browsers, assistive technologies, and search engines without requiring additional attributes or JavaScript.

**101.md** (Document Structure & Metadata): You are preparing a marketing landing page for international launch. The design is complete, but the page renders incorrectly in some browsers — the viewport is not respected on mobile, the language is not declared, and social media link previews show no image or title. Each of these problems traces to a missing or misconfigured element in the document `<head>`. The document `<head>` is invisible to users but controls how every browser, crawler, and platform interprets and presents the page.

**102.md** (Semantic Elements & Accessibility): A screen reader user reports they cannot navigate your site efficiently — they must listen to every element from the top to reach the main content. The page uses `<div class="nav">`, `<div class="main">`, and `<div class="footer">` throughout. Screen readers expose a page outline to users, and that outline is derived entirely from semantic HTML elements: `<nav>`, `<main>`, `<footer>`, `<article>`. Replacing structural divs with their semantic equivalents takes minutes and makes the page navigable.

**103.md** (Forms & Validation): You are building a checkout form that collects shipping address, payment details, and a delivery preference. The form submits with missing required fields and accepts obviously invalid postcodes because validation lives only in the submit handler — which the user bypasses by pressing Enter in a text field. HTML's built-in form validation — `required`, `pattern`, `type="email"`, `minlength` — runs before the submit event fires, works without JavaScript, and surfaces native browser error UI with no additional code.

**104.md** (Media, Embedding & Interactive Elements): You are adding a product video to a landing page. The initial implementation uses a single `<video src="video.mp4">` that loads the full 80 MB file on page load regardless of screen size or connection speed. HTML's responsive media elements — `<picture>` with `<source>` for images, `<video>` with `<source>` for format negotiation, `loading="lazy"` for deferred loading — let the browser choose the optimal resource for the current context without JavaScript.

**105.md** (Web Components & Custom Elements): Your design system team maintains a date picker that is used across five applications built in React, Vue, Angular, and plain HTML. Every framework has its own version, and bug fixes must be applied to each separately. A Custom Element implementation of the date picker ships as a standard HTML element — `<date-picker>` — that works in any framework and any HTML page, receives the fix once, and requires no framework adapter.

**106.md** (HTML APIs & Progressive Enhancement): You are building a feature that should work for users on slow connections or with JavaScript disabled, but adds richer behaviour when both are available. Hard-coding the enhanced experience excludes those users; building two separate code paths doubles the maintenance cost. Progressive enhancement — starting with semantic HTML that works everywhere, then layering CSS and JavaScript for capable environments — is the strategy, and HTML's native APIs (details/summary, dialog, popover) increasingly implement common patterns without JavaScript at all.

**107.md** (Structured Data & Schema.org): Your company blog appears in Google Search but shows only a URL and title — no publication date, author, or star rating despite the page containing all of that information. Search engines read HTML for text content but cannot reliably infer semantic meaning from visual layout. Adding JSON-LD structured data with Schema.org vocabulary tells search engines exactly what type of content the page contains and which elements represent which properties, enabling rich results without changing the visible page.

**108.md** (HTML Security Attributes): You are auditing a web application and discover that a `<script src>` loaded from a third-party CDN has no integrity check. If the CDN is compromised and the script is replaced with malicious code, every user who loads the page will execute it. HTML security attributes — `integrity` for Subresource Integrity, `crossorigin`, `sandbox` on iframes, `rel="noopener noreferrer"` on links — are declarative defences that the browser enforces without any JavaScript, reducing the blast radius of third-party compromise.

- [ ] **Step 4: Verify all HTML articles**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
for f in 100 101 102 103 104 105 106 107 108; do
  grep -q "^## Scenario" "docs/en/HTML and Semantic Markup/${f}.md" && echo "OK EN ${f}" || echo "MISSING EN ${f}"
  grep -q "^## 使用情境" "docs/zh-tw/HTML and Semantic Markup/${f}.md" && echo "OK zh-TW ${f}" || echo "MISSING zh-TW ${f}"
  echo "EN lines: $(wc -l < "docs/en/HTML and Semantic Markup/${f}.md")"
  echo "zh-TW lines: $(wc -l < "docs/zh-tw/HTML and Semantic Markup/${f}.md")"
done
# Expected: all OK, all 301+
```

- [ ] **Step 5: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/FEE Overall/0.md" "docs/zh-tw/FEE Overall/0.md" \
  "docs/en/HTML and Semantic Markup/100.md" \
  "docs/en/HTML and Semantic Markup/101.md" \
  "docs/en/HTML and Semantic Markup/102.md" \
  "docs/en/HTML and Semantic Markup/103.md" \
  "docs/en/HTML and Semantic Markup/104.md" \
  "docs/en/HTML and Semantic Markup/105.md" \
  "docs/en/HTML and Semantic Markup/106.md" \
  "docs/en/HTML and Semantic Markup/107.md" \
  "docs/en/HTML and Semantic Markup/108.md" \
  "docs/zh-tw/HTML and Semantic Markup/100.md" \
  "docs/zh-tw/HTML and Semantic Markup/101.md" \
  "docs/zh-tw/HTML and Semantic Markup/102.md" \
  "docs/zh-tw/HTML and Semantic Markup/103.md" \
  "docs/zh-tw/HTML and Semantic Markup/104.md" \
  "docs/zh-tw/HTML and Semantic Markup/105.md" \
  "docs/zh-tw/HTML and Semantic Markup/106.md" \
  "docs/zh-tw/HTML and Semantic Markup/107.md" \
  "docs/zh-tw/HTML and Semantic Markup/108.md"
git commit -m "feat(fee): add Scenario section -- FEE-0 + HTML (Batch S-A)"
```

---

## Task 2: CSS (Batch S-B)

**Files (EN):** `docs/en/CSS and Layout Systems/` — 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210

**Files (zh-TW):** same 11 files under `docs/zh-tw/CSS and Layout Systems/`

- [ ] **Step 1: Write Scenario sections for all 11 CSS articles**

Read each article and write a unique 3-5 sentence Scenario. Insert after the last opening paragraph, before `## Design Thinking`. Process EN then zh-TW for each.

Reference scenarios for tone and quality:

**200.md** (CSS Overview): Your team has shipped a product for two years using a single growing stylesheet that now exceeds 4,000 lines. Refactoring any selector risks unexpected breakage elsewhere, and new developers spend days tracing which rules apply to a given element. The problems — specificity conflicts, global scope leakage, undocumented inheritance — are not unique to this project. CSS's design gives you layered tools to manage them: the cascade, specificity, custom properties, and scoping strategies each solve a different part of the problem.

**201.md** (Cascade, Specificity & Inheritance): A designer asks you to change a button's background colour, but the change has no effect — another rule with higher specificity is winning. You add `!important` to force the override, which works until a third rule also needs `!important`. Specificity conflicts compound when selectors are written without a shared model. Understanding how the cascade evaluates origin, specificity, and source order lets you write selectors that are predictably overridable without resorting to `!important`.

**202.md** (Box Model & Layout Modes): A component you built looks correct in isolation but breaks when placed inside a grid cell — its width exceeds the cell because `padding` adds to the declared width. The fix is a single CSS property, but understanding which property and why requires knowing how the box model computes element dimensions. `box-sizing: border-box` makes `width` include padding and border, matching the mental model most developers have and eliminating a whole class of sizing surprise.

**203.md** (Flexbox & Grid): You need to build a card grid where cards fill available width, wrap to new rows, and maintain equal height within each row regardless of content length. Floats require clearing hacks. Inline-block requires careful whitespace management. Flexbox solves the equal-height and wrapping requirements; Grid adds explicit two-dimensional placement when the layout needs both row and column control. Choosing between them depends on whether the layout is one-dimensional or two-dimensional.

**204.md** (Responsive Design & Container Queries): Your sidebar component works correctly when placed in the main content area, but breaks visually when reused in a narrow auxiliary column because it has always been styled relative to the viewport width. Media queries cannot solve this — they respond to the viewport, not to the container the component is placed in. Container queries let a component's styles respond to the size of its own parent, making it truly reusable across different layout contexts.

**205.md** (CSS Architecture & Scoping Strategies): A CSS class named `.button` defined in one component's stylesheet is accidentally overriding the `.button` class in another component, producing visual regressions that are hard to trace. Both components are independently correct — the problem is CSS's global scope. Architecture strategies — BEM naming, CSS Modules, CSS-in-JS, `@layer` — each solve the scoping problem differently, and the right choice depends on the team's tooling and the project's scale.

**206.md** (Modern CSS Frameworks): Your team is starting a new project and debating how to handle styling. Writing raw CSS gives full control but requires establishing conventions from scratch. A utility-first framework like Tailwind eliminates naming decisions and keeps styles co-located with markup. A component framework like Bootstrap provides pre-built UI patterns. The trade-offs between development velocity, bundle size, and design flexibility depend on which framework model you choose.

**207.md** (CSS Custom Properties & Theming): Your design requires three colour themes — light, dark, and high-contrast — and the current implementation duplicates entire CSS rule sets for each theme, making global colour changes a three-file update. CSS custom properties let you define colour values once as variables, reference them throughout the stylesheet, and override them at the `:root` or component level for each theme — reducing a three-file change to a single variable update.

**208.md** (CSS Subgrid): You are building a card layout where each card contains a header, body, and footer. In a standard grid, the internal elements of each card are independent flex or block containers, so header heights don't align across cards in the same row. Subgrid lets a card's children participate in the parent grid's row tracks, aligning internal elements across cards without JavaScript measurement or fixed heights.

**209.md** (CSS Containment): A complex dashboard contains a widget that re-renders frequently. Each re-render triggers layout and paint recalculation for the entire page because the browser must verify that the widget's size changes do not affect elements outside it. CSS containment (`contain: layout paint`) tells the browser that the widget's contents cannot affect the outside layout, making recalculation local to the widget and reducing paint cost significantly.

**210.md** (Backdrop Filter, Mix-Blend-Mode & Visual Effects): You are implementing a navigation bar that should appear frosted-glass over page content — blurring what is behind it while remaining partially transparent. This effect cannot be achieved with `opacity` alone, and simulating it with pseudo-elements and a duplicated background is fragile. `backdrop-filter: blur()` applies the blur to whatever is rendered behind the element, implementing the frosted-glass effect with a single CSS declaration.

- [ ] **Step 2: Verify all CSS articles**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
for f in 200 201 202 203 204 205 206 207 208 209 210; do
  grep -q "^## Scenario" "docs/en/CSS and Layout Systems/${f}.md" && echo "OK EN ${f}" || echo "MISSING EN ${f}"
  grep -q "^## 使用情境" "docs/zh-tw/CSS and Layout Systems/${f}.md" && echo "OK zh-TW ${f}" || echo "MISSING zh-TW ${f}"
  echo "EN lines: $(wc -l < "docs/en/CSS and Layout Systems/${f}.md")"
  echo "zh-TW lines: $(wc -l < "docs/zh-tw/CSS and Layout Systems/${f}.md")"
done
# Expected: all OK, all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/CSS and Layout Systems/200.md" \
  "docs/en/CSS and Layout Systems/201.md" \
  "docs/en/CSS and Layout Systems/202.md" \
  "docs/en/CSS and Layout Systems/203.md" \
  "docs/en/CSS and Layout Systems/204.md" \
  "docs/en/CSS and Layout Systems/205.md" \
  "docs/en/CSS and Layout Systems/206.md" \
  "docs/en/CSS and Layout Systems/207.md" \
  "docs/en/CSS and Layout Systems/208.md" \
  "docs/en/CSS and Layout Systems/209.md" \
  "docs/en/CSS and Layout Systems/210.md" \
  "docs/zh-tw/CSS and Layout Systems/200.md" \
  "docs/zh-tw/CSS and Layout Systems/201.md" \
  "docs/zh-tw/CSS and Layout Systems/202.md" \
  "docs/zh-tw/CSS and Layout Systems/203.md" \
  "docs/zh-tw/CSS and Layout Systems/204.md" \
  "docs/zh-tw/CSS and Layout Systems/205.md" \
  "docs/zh-tw/CSS and Layout Systems/206.md" \
  "docs/zh-tw/CSS and Layout Systems/207.md" \
  "docs/zh-tw/CSS and Layout Systems/208.md" \
  "docs/zh-tw/CSS and Layout Systems/209.md" \
  "docs/zh-tw/CSS and Layout Systems/210.md"
git commit -m "feat(fee): add Scenario section -- CSS (Batch S-B)"
```

---

## Task 3: JavaScript Core (Batch S-C)

**Files (EN):** `docs/en/JavaScript Core and Runtime/` — 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313

**Files (zh-TW):** same 14 files under `docs/zh-tw/JavaScript Core and Runtime/`

- [ ] **Step 1: Write Scenario sections for all 14 JavaScript Core articles**

Read each article and write a unique 3-5 sentence Scenario. Insert after the last opening paragraph, before `## Design Thinking`. Process EN then zh-TW for each.

Reference scenarios for tone and quality:

**300.md** (JS Core Overview): You are debugging an intermittent bug where a user's click handler fires correctly in Chrome but not in Safari, and a data fetch that works in one context silently fails in another. The symptom in both cases is the same: code that appears correct in isolation behaves unexpectedly in a specific runtime context. JavaScript's execution model — the event loop, the call stack, closures, and the prototype chain — determines how these interactions behave. Understanding the model is what separates fixing the symptom from fixing the cause.

**301.md** (Event Loop & Async Model): You are building a file upload feature where progress updates should display smoothly during the upload. The initial implementation updates a progress bar in a loop inside the upload handler, but the UI never updates — it freezes until the upload completes, then jumps to 100%. The freeze happens because all the updates run synchronously in the call stack, blocking the browser's rendering cycle. Moving updates through the event loop — using `setTimeout`, `requestAnimationFrame`, or async callbacks — gives the browser opportunities to render between updates.

**302.md** (Closures & Scope Chain): You are adding event listeners to a list of buttons generated in a loop, but every button's handler logs the same index — the last one — regardless of which button was clicked. The bug is a classic closure problem: all handlers close over the same variable, which has been incremented by the time any handler runs. Understanding how closures capture references rather than values, and how to use block scope or factory functions to create independent bindings, resolves the entire class of loop-closure bugs.

**303.md** (Prototypes & Inheritance): You are working with a library that extends native Array with custom methods, and one of your methods is not available on arrays created in an iframe — despite identical code. The issue is that arrays from different frames have different prototype chains. JavaScript's prototype-based inheritance means that every object's behaviour is determined by the chain of objects it delegates to, not a copy of methods. Knowing this model helps you debug cross-frame issues, understand why `instanceof` can mislead, and make intentional choices about how to share behaviour between objects.

**304.md** (Type Coercion & Equality): A form validation function uses `==` to check whether a field value equals zero, and it passes for empty strings. A conditional using `+` to concatenate a number and a string produces `"12"` instead of `3`. Both behaviours are predictable once JavaScript's coercion rules are understood, but they produce bugs that are difficult to find through inspection alone. Knowing when the language coerces values and how `==` differs from `===` lets you write comparisons that behave as intended.

**305.md** (Error Handling Patterns): An async data-fetching function throws an error that is not caught anywhere — the promise rejection goes unhandled and silently swallows the error, leaving the UI in an indeterminate loading state. Adding a `try/catch` around the `await` does not catch rejections from nested async calls that were not awaited. JavaScript's error handling model — synchronous `try/catch`, promise rejection chains, and `unhandledrejection` — requires deliberate design to ensure every error surface is covered.

**306.md** (Memory Management & Garbage Collection): A single-page application's memory usage grows steadily as the user navigates between routes, never falling back to its initial baseline even after returning to the home page. The browser's garbage collector cannot reclaim objects that are still referenced — and the application is holding references through event listeners attached to removed DOM nodes and timers that were never cleared. Understanding how JavaScript's mark-and-sweep GC works, what prevents collection, and how to audit the heap makes this class of leak diagnosable.

**307.md** (ES Modules & Module Systems): You are adding a utility function that is used across twelve files in a codebase that started as a single `<script>` tag and grew organically. Functions are attached to a global namespace object and the load order of script tags determines what is available. ES Modules — `import` and `export` with static analysis — let bundlers eliminate unused code, enable circular dependency detection, and give each file an explicit dependency declaration rather than an implicit global dependency.

**308.md** (Iterators, Generators & Async Iteration): You are building a pagination feature that fetches the next page of results when the user scrolls near the bottom. The current implementation couples the fetching logic, the cursor tracking, and the rendering into a single scroll handler, making it hard to test the fetching logic in isolation. A generator function can model the sequence of pages as a lazy iterator — yielding one page at a time, maintaining cursor state internally, and separating the production of pages from their consumption.

**309.md** (WeakMap, WeakSet & Weak References): You are building a component library where each DOM element needs private metadata — a unique ID and internal state — that should not be accessible from outside the component. Storing this data on the element itself pollutes the DOM node's properties. Storing it in a `Map` keyed by the element prevents garbage collection of detached elements. `WeakMap` solves both problems: it associates private data with an object without preventing the object from being collected when it is no longer referenced.

**310.md** (Symbols & Well-Known Symbols): You are writing a custom iterator for a data structure that should work with `for...of` loops, the spread operator, and destructuring. Implementing this requires hooking into the language's iteration protocol using `Symbol.iterator`. Symbols provide unique, non-string property keys that the JavaScript runtime recognises as protocol hooks — `Symbol.iterator`, `Symbol.toPrimitive`, `Symbol.hasInstance` — letting your objects participate in built-in language behaviours.

**311.md** (Proxy & Reflect API): You need to add validation to a configuration object so that setting an invalid value throws immediately rather than failing silently later when the value is used. Wrapping the object with a getter that checks values would require enumerating every property in advance. `Proxy` intercepts any property access, assignment, or deletion on an object, letting you add cross-cutting behaviour — validation, logging, access control — to any object without modifying the object itself.

**312.md** (this Binding & Context Edge Cases): A method works correctly when called as `obj.method()` but throws or produces wrong output when the same function reference is passed as a callback — for example, to `setTimeout` or an event listener. The difference is `this` binding: method invocation binds `this` to the object, but a plain function call binds `this` to `undefined` (in strict mode) or the global object. Understanding how `this` is determined at call time — and when arrow functions, `bind`, and explicit binding solve the problem — eliminates a consistent source of JavaScript bugs.

**313.md** (Structured Clone & structuredClone()): You are passing a complex object with nested arrays and `Date` values from a Web Worker back to the main thread. `JSON.parse(JSON.stringify(obj))` works for plain objects but converts `Date` instances to strings and drops `undefined` values. The structured clone algorithm — used internally by `postMessage` and exposed directly as `structuredClone()` — performs a deep copy that preserves `Date`, `Map`, `Set`, `ArrayBuffer`, and other non-JSON-serialisable types.

- [ ] **Step 2: Verify all JavaScript Core articles**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
for f in 300 301 302 303 304 305 306 307 308 309 310 311 312 313; do
  grep -q "^## Scenario" "docs/en/JavaScript Core and Runtime/${f}.md" && echo "OK EN ${f}" || echo "MISSING EN ${f}"
  grep -q "^## 使用情境" "docs/zh-tw/JavaScript Core and Runtime/${f}.md" && echo "OK zh-TW ${f}" || echo "MISSING zh-TW ${f}"
  echo "EN lines: $(wc -l < "docs/en/JavaScript Core and Runtime/${f}.md")"
  echo "zh-TW lines: $(wc -l < "docs/zh-tw/JavaScript Core and Runtime/${f}.md")"
done
# Expected: all OK, all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/JavaScript Core and Runtime/300.md" \
  "docs/en/JavaScript Core and Runtime/301.md" \
  "docs/en/JavaScript Core and Runtime/302.md" \
  "docs/en/JavaScript Core and Runtime/303.md" \
  "docs/en/JavaScript Core and Runtime/304.md" \
  "docs/en/JavaScript Core and Runtime/305.md" \
  "docs/en/JavaScript Core and Runtime/306.md" \
  "docs/en/JavaScript Core and Runtime/307.md" \
  "docs/en/JavaScript Core and Runtime/308.md" \
  "docs/en/JavaScript Core and Runtime/309.md" \
  "docs/en/JavaScript Core and Runtime/310.md" \
  "docs/en/JavaScript Core and Runtime/311.md" \
  "docs/en/JavaScript Core and Runtime/312.md" \
  "docs/en/JavaScript Core and Runtime/313.md" \
  "docs/zh-tw/JavaScript Core and Runtime/300.md" \
  "docs/zh-tw/JavaScript Core and Runtime/301.md" \
  "docs/zh-tw/JavaScript Core and Runtime/302.md" \
  "docs/zh-tw/JavaScript Core and Runtime/303.md" \
  "docs/zh-tw/JavaScript Core and Runtime/304.md" \
  "docs/zh-tw/JavaScript Core and Runtime/305.md" \
  "docs/zh-tw/JavaScript Core and Runtime/306.md" \
  "docs/zh-tw/JavaScript Core and Runtime/307.md" \
  "docs/zh-tw/JavaScript Core and Runtime/308.md" \
  "docs/zh-tw/JavaScript Core and Runtime/309.md" \
  "docs/zh-tw/JavaScript Core and Runtime/310.md" \
  "docs/zh-tw/JavaScript Core and Runtime/311.md" \
  "docs/zh-tw/JavaScript Core and Runtime/312.md" \
  "docs/zh-tw/JavaScript Core and Runtime/313.md"
git commit -m "feat(fee): add Scenario section -- JavaScript Core (Batch S-C)"
```

---

## Task 4: Browser APIs (Batch S-D)

**Files (EN):** `docs/en/Browser APIs and Web Platform/` — 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416

**Files (zh-TW):** same 17 files under `docs/zh-tw/Browser APIs and Web Platform/`

- [ ] **Step 1: Write Scenario sections for all 17 Browser API articles**

Read each article and write a unique 3-5 sentence Scenario. Insert after the last opening paragraph, before `## Design Thinking`. Process EN then zh-TW for each.

Reference scenarios for tone and quality:

**400.md** (Browser APIs Overview): You have been building features using `fetch`, `localStorage`, and `addEventListener`, but a new requirement asks for background sync when the user is offline, real-time communication without polling, and file system access. Each requirement maps to a different browser API that did not exist five years ago. Browser APIs are not a monolithic system — they are a growing collection of capabilities that each solve a specific class of problem that would otherwise require a server round-trip or a native app.

**401.md** (DOM Manipulation & Traversal): You are building a rich text editor where formatting is applied by wrapping selected text in new elements. Selecting the right node, inserting elements at the correct position, and reading attributes without triggering unnecessary layout — all require precise DOM traversal and mutation. The DOM's tree model determines how to navigate from a clicked element to its parent, find siblings, read attributes without triggering layout, and insert new nodes without replacing existing children.

**402.md** (Events & Event Delegation): A table with 500 dynamically generated rows needs a click handler on each row. Attaching 500 individual listeners works but consumes memory and breaks when rows are added or removed — new rows have no listener. Event delegation solves this by attaching one listener to the table and relying on event bubbling to route clicks to the handler. Understanding bubbling, capturing, and event delegation lets you build interactive lists, tables, and trees with a single handler that works correctly for both existing and future elements.

**403.md** (Fetch, Streams & Network APIs): You are implementing a chat interface that streams AI-generated responses token by token. A standard `fetch` call waits for the full response before returning it, producing a jarring "all-at-once" appearance. The Streams API exposes the response body as a `ReadableStream`, letting you read chunks as they arrive and update the UI incrementally — matching the progressive rendering pattern that users expect from modern chat interfaces.

**404.md** (Storage & State Persistence): A user fills out a multi-step form and accidentally closes the browser tab on step three. When they return, the form is empty. The data needs to survive a tab close but not a logout. `localStorage` persists across sessions; `sessionStorage` is cleared on tab close; `IndexedDB` handles structured data too large for a key-value store. The right storage API depends on the data's lifetime, size, and structure — and on whether the data should be accessible across tabs.

**405.md** (Web Workers & Concurrency): A spreadsheet application processes formula dependencies across thousands of cells on every keystroke. The calculation runs synchronously on the main thread, blocking input for 200ms and making the application feel unresponsive. Web Workers run JavaScript in a background thread with no access to the DOM, communicating with the main thread via message passing. Moving the calculation to a Worker lets the main thread remain responsive to user input while the background thread computes.

**406.md** (Intersection Observer, Resize Observer & Mutation Observer): You are building an analytics feature that records how far users scroll and which sections they read. Polling `scrollTop` on a scroll event fires hundreds of times per second and forces layout recalculation each call. `IntersectionObserver` fires a callback only when a tracked element enters or exits the viewport, at a fraction of the cost. The Observer APIs — Intersection, Resize, and Mutation — provide event-driven notifications for changes that previously required polling or synchronous measurement.

**407.md** (Canvas 2D & SVG): You are building a data visualisation that renders a real-time chart with hundreds of data points updating every second. Rendering this with DOM elements produces hundreds of layout calculations per update. `<canvas>` with the 2D context renders by painting pixels directly — no DOM nodes, no layout — making it suitable for high-frequency rendering where DOM overhead would be prohibitive. SVG suits diagrams where individual elements must be interactive or styled with CSS; Canvas suits high-throughput rendering where raw pixel output is what matters.

**408.md** (WebGL & WebGPU): You are building a 3D product viewer where users can rotate, zoom, and inspect a model from any angle. CSS 3D transforms and Canvas 2D cannot render the shading, lighting, and perspective that make a 3D model look real. WebGL exposes the GPU via shader programs, enabling physically-based rendering at interactive frame rates. WebGPU extends this to modern GPU compute capabilities, enabling both 3D rendering and GPU-accelerated computation from the browser.

**409.md** (WebSockets & Server-Sent Events): You are building a collaborative whiteboard where multiple users draw simultaneously and each user should see other users' strokes in near real-time. Polling the server every second introduces 500ms average latency and generates unnecessary load. WebSockets establish a persistent bidirectional connection, letting the server push drawing updates to all connected clients immediately when they occur. Server-Sent Events solve the simpler one-directional case — a server that pushes updates to clients — with a lighter protocol.

**410.md** (File API, Clipboard & Drag-and-Drop): You are building a document editor where users can drag image files from the desktop into the editor and have them inserted at the cursor position. The drop event fires on the target element, but extracting the file from the drop, reading its binary content, and converting it to a data URL requires three separate browser APIs working in sequence. The File API, DataTransfer, and FileReader together handle the pipeline from user gesture to usable file content.

**411.md** (WebTransport): You are building a multiplayer game client where player position updates must arrive with minimal latency and occasional packet loss is acceptable — retransmitting a stale position is worse than dropping it. WebSockets guarantee delivery and order, which introduces queuing delay when the network is lossy. WebTransport provides both reliable streams and unreliable datagrams over HTTP/3, letting the game choose per-message reliability semantics to match the data's requirements.

**412.md** (requestAnimationFrame & Animation Timing): You are implementing a smooth progress indicator that should animate at exactly 60 frames per second. Using `setInterval` at 16ms produces jitter because timer callbacks do not synchronise with the browser's rendering cycle — some frames get two updates, others get none. `requestAnimationFrame` schedules the callback to run once per frame, immediately before the browser paints, ensuring that each animation update is rendered exactly once and that the animation pauses automatically when the tab is hidden.

**413.md** (Geolocation, Device Orientation & Device APIs): You are building a delivery tracking feature where a courier's position updates on a map as they move. The initial implementation asks for position once on load. Continuous tracking — following the courier's path in real time — requires `watchPosition`, which fires a callback each time the device's location changes beyond a configurable accuracy threshold. The Geolocation API, Device Orientation API, and related device APIs expose hardware sensors through a permission-gated browser interface.

**414.md** (Broadcast Channel & SharedWorker): You are building a session management feature where logging out in one tab should immediately log the user out of all other open tabs of the same application. There is no server-side push mechanism in place for this. `BroadcastChannel` sends a message to all other browsing contexts on the same origin — the logout event posted in one tab is received instantly by all other tabs, letting each tab clear its session state without a server round-trip.

**415.md** (Permissions API): You are building a feature that uses the camera for a QR code scanner. The current implementation calls `getUserMedia()` immediately on page load, which triggers a permission prompt before the user understands why the camera is needed. The Permissions API lets you query whether a permission has already been granted, denied, or not yet requested — so you can show an explanatory UI before triggering the browser prompt, and handle the denied state gracefully without triggering another prompt.

**416.md** (Web Speech API): You are building an accessibility feature for a form-heavy application where users with motor impairments can fill in fields by voice. Implementing speech recognition from scratch requires a speech model, audio processing, and significant infrastructure. The Web Speech API provides a browser-native interface to the platform's speech recognition engine — `SpeechRecognition` for voice-to-text and `SpeechSynthesis` for text-to-voice — with no model download or server round-trip.

- [ ] **Step 2: Verify all Browser API articles**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
for f in 400 401 402 403 404 405 406 407 408 409 410 411 412 413 414 415 416; do
  grep -q "^## Scenario" "docs/en/Browser APIs and Web Platform/${f}.md" && echo "OK EN ${f}" || echo "MISSING EN ${f}"
  grep -q "^## 使用情境" "docs/zh-tw/Browser APIs and Web Platform/${f}.md" && echo "OK zh-TW ${f}" || echo "MISSING zh-TW ${f}"
  echo "EN lines: $(wc -l < "docs/en/Browser APIs and Web Platform/${f}.md")"
  echo "zh-TW lines: $(wc -l < "docs/zh-tw/Browser APIs and Web Platform/${f}.md")"
done
# Expected: all OK, all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/Browser APIs and Web Platform/400.md" \
  "docs/en/Browser APIs and Web Platform/401.md" \
  "docs/en/Browser APIs and Web Platform/402.md" \
  "docs/en/Browser APIs and Web Platform/403.md" \
  "docs/en/Browser APIs and Web Platform/404.md" \
  "docs/en/Browser APIs and Web Platform/405.md" \
  "docs/en/Browser APIs and Web Platform/406.md" \
  "docs/en/Browser APIs and Web Platform/407.md" \
  "docs/en/Browser APIs and Web Platform/408.md" \
  "docs/en/Browser APIs and Web Platform/409.md" \
  "docs/en/Browser APIs and Web Platform/410.md" \
  "docs/en/Browser APIs and Web Platform/411.md" \
  "docs/en/Browser APIs and Web Platform/412.md" \
  "docs/en/Browser APIs and Web Platform/413.md" \
  "docs/en/Browser APIs and Web Platform/414.md" \
  "docs/en/Browser APIs and Web Platform/415.md" \
  "docs/en/Browser APIs and Web Platform/416.md" \
  "docs/zh-tw/Browser APIs and Web Platform/400.md" \
  "docs/zh-tw/Browser APIs and Web Platform/401.md" \
  "docs/zh-tw/Browser APIs and Web Platform/402.md" \
  "docs/zh-tw/Browser APIs and Web Platform/403.md" \
  "docs/zh-tw/Browser APIs and Web Platform/404.md" \
  "docs/zh-tw/Browser APIs and Web Platform/405.md" \
  "docs/zh-tw/Browser APIs and Web Platform/406.md" \
  "docs/zh-tw/Browser APIs and Web Platform/407.md" \
  "docs/zh-tw/Browser APIs and Web Platform/408.md" \
  "docs/zh-tw/Browser APIs and Web Platform/409.md" \
  "docs/zh-tw/Browser APIs and Web Platform/410.md" \
  "docs/zh-tw/Browser APIs and Web Platform/411.md" \
  "docs/zh-tw/Browser APIs and Web Platform/412.md" \
  "docs/zh-tw/Browser APIs and Web Platform/413.md" \
  "docs/zh-tw/Browser APIs and Web Platform/414.md" \
  "docs/zh-tw/Browser APIs and Web Platform/415.md" \
  "docs/zh-tw/Browser APIs and Web Platform/416.md"
git commit -m "feat(fee): add Scenario section -- Browser APIs (Batch S-D)"
```
