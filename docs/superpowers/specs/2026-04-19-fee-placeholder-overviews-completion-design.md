# FEE Placeholder Overviews Completion Design

> **Status:** Approved
> **Date:** 2026-04-19

## Goal

Replace the five placeholder overview articles in the 10000-19999 "Web Platform Proposals" range with full-template FEE overviews that match the depth and structure of topical overviews like FEE-200 and FEE-300. Each overview exists in EN and zh-TW; all ten files are rewritten in this spec.

After this spec lands, the red `PLACE` badges disappear from the generated sidebar/list and each overview becomes a usable entry point for its proposal track.

Filling the blank sub-categories (12000, 13000, 14000) with actual proposal articles is **out of scope** for this spec. Those will be covered by follow-up specs, one per blank category.

## Scope

In scope (10 files rewritten, 5 commits):

| ID | EN path | zh-TW path |
|----|---------|-----------|
| 10000 | `docs/en/Web Platform Proposals/TC39 and JS Proposals/10000.md` | `docs/zh-tw/Web Platform Proposals/TC39 and JS Proposals/10000.md` |
| 11000 | `docs/en/Web Platform Proposals/CSS Experimental/11000.md` | `docs/zh-tw/Web Platform Proposals/CSS Experimental/11000.md` |
| 12000 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12000.md` | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12000.md` |
| 13000 | `docs/en/Web Platform Proposals/Browser Compute/13000.md` | `docs/zh-tw/Web Platform Proposals/Browser Compute/13000.md` |
| 14000 | `docs/en/Web Platform Proposals/WebAssembly Proposals/14000.md` | `docs/zh-tw/Web Platform Proposals/WebAssembly Proposals/14000.md` |

Out of scope (tracked for follow-up specs):

- Sub-articles under 12000 / 13000 / 14000 (each category gets its own follow-up spec)
- Sub-articles in 10000s / 11000s not yet drafted (individual article additions, not a completion spec)
- `list.md` edits (auto-generated from frontmatter at build time)
- Sidebar config changes

## Constraints

- Each file MUST be ≥301 lines, matching the repo floor established in commit `ef291af`.
- Every reference URL MUST be verified live before commit. No fabricated or guessed URLs per the `Content Quality` rule in `CLAUDE.md`.
- EN and zh-TW MUST stay parallel. Section header map per `CLAUDE.md`:
  Context → 背景, Scenario → 情境, Design Thinking → 設計思維, Visual → 圖解, Related FEEs → 相關 FEE, References → 參考資料.
- Must obey the Vue template safety rules in `CLAUDE.md` (no `{{ }}` in backtick code spans; escape `<Tag>` patterns in `<code v-pre>`; double-backtick delimiters when embedding backticks).
- Must not use prohibited writing patterns listed in the user's global `CLAUDE.md` (no "not X, but Y" contrastive negation; no unanchored "很重"/"可以跑" style modifiers; no em-dash chains of filler).
- Frontmatter change per overview: `state: placeholder` → `state: draft`, remove `placeholder: true`, keep `overview: true`. Removing `placeholder: true` is what drops the red `PLACE` badge (confirmed by `docs/.vitepress/config/en.js:60` and `docs/.vitepress/config/zh-tw.js:60`).

## Shared template

Every one of the five overviews uses the same section skeleton. Content per section is track-specific.

```
---
id: <10000|11000|12000|13000|14000>
title: <track title>
state: draft
overview: true
---

# [FEE-<id>] <track title>

:::info
One-sentence hook framing the adoption dilemma this track addresses.
:::

:::warning Web Platform Proposals
Retains the existing warning callout that identifies the 10000-19999 range
as pre-stable and describes graduation to 0-9999 categories.
:::

## Context
3-5 paragraphs on the standards body/process governing the track, and why
this track exists as its own FEE category.

## Scenario
The adoption dilemma as a concrete situation a developer recognizes —
wanting to use a pre-stable feature in production and needing to reason
about risk.

## Design Thinking
Two parts per the FEE template convention:
1. Why the web platform ships experimental features at all, grounded in the
   governing process's history (ES4 failure for TC39, CSS2.1 freeze for
   CSSWG, XHTML 2 failure for WHATWG, hardware portability for compute,
   WASM MVP strategy for WASM).
2. How the ecosystem bridges the gap for the track: polyfills, transpilers,
   feature detection, Origin Trials, progressive enhancement.

## Visual
Mermaid diagram: overview node at top (colored as the category parent),
subcategory range nodes below (labeled with range + topic), and drafted
article IDs as leaf nodes. Ranges with no drafted articles shown in gray
with representative planned topics labeled.

## Tracks in this range
Existing range table (retained; optionally annotated with a "drafted"
column for transparency).

## Graduation
The graduation paragraph, expanded to explain what "stable" means for the
governing body (TC39 Stage 4 + cross-engine shipping, W3C CR + Interop
support, WHATWG Living Standard 3-engine convention, etc.).

## Related FEEs
Table format — FEE ID, relationship phrase — matching FEE-200's format.

## References
Minimum 5 verified URLs. Ordering: (1) process/charter doc, (2) proposal
tracker, (3) MDN/caniuse landing, (4) canonical explainer, (5) sibling
track reference.
```

## Content outline per overview

### FEE-10000 — TC39 & JS Proposals Overview

- **Hook (info):** The language ships in stages; understanding which stage means which risk is the whole game.
- **Context:** TC39 as Ecma TC39; delegate/champion model; Stage 0-4 pipeline; V8 ships Stage 3 behind flag; Stage 4 + cross-engine shipping is the usable bar; 2015 shift to annual releases post-ES4 failure.
- **Scenario:** team wants Temporal in production; Stage 3 with polyfill vs. native.
- **Design Thinking:**
  - Part 1: post-ES4 lessons (2008), "don't break the web" constraint forcing incremental shipping.
  - Part 2: Babel transforms for syntax proposals, polyfills for runtime proposals (`@js-temporal/polyfill`), typeof guards, kangax compat-table as status source.
- **Visual:** FEE-10000 at top; 6 range nodes (10001-099 Language, 10100-199 Built-ins, 10200-299 Metaprogramming, 10300-399 Type-adjacent, 10400-499 Modules, 10500-999 Reserved); leaves for drafted articles (10001 Temporal, 10002 `using`, 10003 Pattern Matching, 10005 Signals, 10006 Async Context, 10100 Iterator Helpers, 10300 Decorators).
- **Key references (candidates):** TC39 process document; `tc39/proposals` repo; MDN JavaScript proposals; ECMA-262 specification; Interop project.

### FEE-11000 — CSS Experimental Overview

- **Hook (info):** CSS ships per module, not per spec — some features are production-ready while sister modules still draft.
- **Context:** W3C CSSWG structure; module/level system (per FEE-200 history); maturity ladder FPWD → WD → CR → PR → REC; Interop project yearly coordination (2022+); flag-ship → cross-browser gap often 2-4 years.
- **Scenario:** anchor-positioning tooltips; Chrome ships, Safari doesn't; `@supports` vs. feature-gate vs. wait.
- **Design Thinking:**
  - Part 1: 2011 CSS2.1 freeze taught the WG monolithic specs stall; module-per-feature lets anchor positioning ship while subgrid still drafts.
  - Part 2: PostCSS plugins as polyfills (`postcss-preset-env`), runtime polyfills for layout behaviors, `@supports` for progressive enhancement, `CSS.supports()` for JS-side feature gates.
- **Visual:** FEE-11000 at top; 6 range nodes (11001-099 Layout, 11100-199 Animation/scroll, 11200-299 Extensibility/Houdini, 11300-399 Custom props/typed values, 11400-499 Scoping, 11500-999 Reserved); leaves for all drafted articles (11001-11003, 11100-11104, 11200-11203, 11300-11302).
- **Key references (candidates):** W3C CSSWG charter; CSSWG drafts repo; Interop 2024/2025 project page; caniuse.com; MDN CSS landing.

### FEE-12000 — HTML & DOM Proposals Overview

- **Hook (info):** HTML has no version number — features land individually, and their readiness is always per-feature.
- **Context:** WHATWG stewardship (post-2019 W3C MoU); Living Standard model; no "HTML6"; Origin Trials as Chrome's early-production mechanism; informal 3-browser agreement convention.
- **Scenario:** Popover API ships everywhere, `scoped-custom-element-registry` doesn't; both under "HTML Living Standard"; reader must reason about per-feature readiness.
- **Design Thinking:**
  - Part 1: XHTML 2 failure (2009) pushed HTML to the Living Standard model so browsers can add features continuously without version coordination.
  - Part 2: Polyfills for Popover, Invokers, pre-2022 `<dialog>`; feature detection (`HTMLElement.prototype.togglePopover`, `:popover-open`); Origin Trials for field-testing.
- **Visual:** FEE-12000 at top; 6 range nodes (12001-099 Elements/attributes, 12100-199 DOM APIs/events, 12200-299 Navigation/routing, 12300-399 Performance/loading, 12400-499 Security/privacy, 12500-999 Reserved); no drafted article leaves — range nodes labeled with planned topics (Popover API, Invokers, Navigation API, Speculation Rules, Document PiP, scoped custom elements) rendered in gray.
- **Key references (candidates):** WHATWG HTML Living Standard; WHATWG working mode; Chrome Origin Trials; MDN HTML landing; Interop project.

### FEE-13000 — Browser Compute Overview

- **Hook (info):** The browser is becoming a compute platform; WebGPU and WebNN are how.
- **Context:** two W3C CGs (GPU for the Web CG for WebGPU, Web ML WG for WebNN); hardware heterogeneity (Metal / Vulkan / D3D12); WGSL as cross-platform shader bytecode; WebGPU shipped Chromium April 2023, Safari 26 September 2025, Firefox 141 on Windows July 2025 (other platforms flag-gated at time of writing); WebNN at Candidate Recommendation, not yet shipping unflagged.
- **Scenario:** WebGPU + transformers.js prototype runs in Chrome; Firefox behavior depends on platform; portability reasoning required.
- **Design Thinking:**
  - Part 1: browsers never before exposed parallel/GPU primitives; 2D canvas and WebGL are graphics-first APIs, not compute; split between graphics (WebGPU) and ML (WebNN) mirrors native-SDK splits (Metal/MPS, Vulkan/ONNX Runtime).
  - Part 2: WebGPU-over-WebGL polyfill impractical (model mismatch); ONNX Runtime Web runtime-selects WebGPU → WASM; transformers.js runtime-detects and adapts.
- **Visual:** FEE-13000 at top; 5 range nodes (13001-099 WebGPU device/pipelines/buffers, 13100-199 Compute/WGSL, 13200-299 WebNN graph/operators, 13300-399 WebGPU+WASM, 13400-999 Reserved); no drafted article leaves — planned topics rendered in gray.
- **Key references (candidates):** W3C GPU for the Web CG; WebGPU specification; WGSL specification; W3C WebNN specification; MDN WebGPU.

### FEE-14000 — WebAssembly Proposals Overview

- **Hook (info):** WASM ships as a floor plus a stack of proposals; knowing which proposals have landed in your target engines is how you ship.
- **Context:** WebAssembly W3C CG phases (Phase 0 Pre-proposal → Phase 4 Standardized); BytecodeAlliance for WASI; Component Model as post-MVP interop layer; split between what ships in browsers (WASM GC, Threads, SIMD, Exception Handling) and what ships outside (WASI, Component Model in Wasmtime/Wasmer); JSPI (JS Promise Integration) as the async bridge.
- **Scenario:** Kotlin/WASM GC output runs in Chrome/Firefox/Safari; production audit needed (cross-origin isolation for Threads, version matrices for SIMD/EH).
- **Design Thinking:**
  - Part 1: 2017 MVP was deliberately minimal to ship fast; post-MVP proposals (GC, EH, Component Model) came from real production pain in C++ / Rust / Go / Kotlin compile-to-WASM users.
  - Part 2: wasm-bindgen / emscripten generate feature-detection shims; `wasm-feature-detect` library; fallback compilation targets (e.g. Kotlin → asm.js when WASM GC is missing).
- **Visual:** FEE-14000 at top; 6 range nodes (14001-099 WASM GC, 14100-199 Component Model, 14200-299 WASI, 14300-399 Threads/SIMD/EH, 14400-499 WASM+JS interop, 14500-999 Reserved); no drafted article leaves — planned topics rendered in gray.
- **Key references (candidates):** WebAssembly CG process document; `WebAssembly/proposals` repo; `wasm-feature-detect` npm; BytecodeAlliance; MDN WebAssembly landing.

## References strategy

Per file, before commit:

1. **Minimum 5 verified URLs.** No generic placeholders. Every URL is opened via WebFetch and confirmed live during the research pass.
2. **Ordering within the References section:**
   1. The standards body's process/charter doc
   2. The proposal-tracking repo or stage index
   3. MDN or caniuse landing page
   4. One canonical explainer (process FAQ, editor's blog post, cross-engine progress report)
   5. One cross-reference to a sibling FEE track
3. **Current-status claims requiring live verification before commit:**
   - TC39 stage of any named proposal
   - Shipping status statements about WebGPU across Chromium / Firefox / Safari
   - Spec maturity levels (WD / CR / PR / REC) cited in prose
   - Any date cited for a specific shipping milestone

If any verification fails or produces ambiguous results, rewrite the claim to a verifiable form before committing. For example, if the exact Firefox version that shipped a feature can't be pinned down, the prose says "shipped in Firefox" and cites the change log entry, and leaves the version number out.

## Execution workflow

Per overview, repeated for each of the five tracks in order 10000 → 11000 → 12000 → 13000 → 14000:

1. **Research pass.** WebFetch candidate reference URLs. Record verified facts, stage numbers, shipping statuses. Discard claims that can't be anchored.
2. **Write EN file.** Draft to the target path. Hit ≥301 lines.
3. **Write zh-TW file.** Adapt the EN file section by section into Traditional Chinese prose written for a native reader. Use the zh-TW section header map. Machine translation is insufficient — a human-written adaptation at equivalent depth is required.
4. **Polish.** Invoke the `polish-documents` skill on the EN file. Repeat for the zh-TW file. Address findings inline.
5. **Verify Vue template safety.** Grep both files for the three CLAUDE.md pitfalls: unescaped `{{ }}` inside backtick spans; raw `<Tag>` inside backtick spans; backslash-escaped backticks. Fix by applying the documented escape patterns.
6. **Optional build probe.** If the overview touches new Mermaid or HTML patterns the file hasn't used before, run `pnpm docs:build` to confirm the site still builds.
7. **Commit.** One commit per overview, covering both language files:
   ```
   docs(fee): complete FEE-<id> <track title>
   ```

### Review checkpoints

- **After FEE-10000 ships (first commit), pause for user review before continuing.** Catches voice/depth drift on the first instance before 80 % of the writing happens.
- After all 5 commits land, the `PLACE` badges disappear from the generated `list.md` automatically (the sidebar generator in `docs/.vitepress/config/{en,zh-tw}.js` reads `placeholder: true` from frontmatter).

## Success criteria

- All 5 overviews have `state: draft` and no `placeholder: true` in frontmatter.
- Each of the 10 rewritten files is ≥301 lines.
- Every References section has ≥5 live URLs verified by WebFetch during the research pass.
- `polish-documents` has been run against every rewritten file.
- `pnpm docs:build` succeeds.
- Both language `list.md` files regenerate without the `PLACE` badge on IDs 10000, 11000, 12000, 13000, 14000.
- Five commits land on `main` in order, each covering both languages for one overview.

## Risks and mitigations

- **Risk: current-status claims go stale fast (WebGPU, WASM proposals, TC39 stages).**
  Mitigation: favor structural language over version specifics where possible ("shipping in Chromium" rather than "Chrome 113"); when a specific status IS used, verify at write time and cite the source on that line.
- **Risk: zh-TW adaptation drifts from EN over time during the rewrite.**
  Mitigation: write EN first, then zh-TW, same session. Use the header map exactly. Reviewer checkpoint after FEE-10000 confirms the pattern before the other four.
- **Risk: Vue template parse errors from embedded angle brackets.**
  Mitigation: Grep step before commit; CLAUDE.md's Vue Template Safety rules are the authoritative reference.
- **Risk: polish-documents changes voice in ways that break the bilingual parallel.**
  Mitigation: polish after both languages are drafted, review both polished files side-by-side before commit.

## Out of scope (tracked for follow-up specs)

Three follow-up specs are planned, each dated when it is filed. Suggested slugs:

- `fee-html-dom-proposals-articles-design.md` — fills 12000s sub-articles (Popover, Invokers, Navigation API, Speculation Rules, Document PiP, scoped custom elements).
- `fee-browser-compute-articles-design.md` — fills 13000s sub-articles (WebGPU device model, pipelines, compute/WGSL, WebNN graph/operators, integration patterns).
- `fee-webassembly-proposals-articles-design.md` — fills 14000s sub-articles (WASM GC, Component Model, WASI, Threads/SIMD/EH, WASM+JS interop).

Each follow-up spec decides its own article inventory based on the readiness of the proposals it covers when it is filed.
