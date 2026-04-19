# FEE HTML & DOM Proposals Articles Design

> **Status:** Approved
> **Date:** 2026-04-19

## Goal

Fill the 12000-range with five full sub-articles covering genuine pre-stable HTML and DOM proposals. After this spec lands, the `HTML and DOM Proposals` directory contains the overview (`12000`) plus five drafted sub-articles (`12001-12005`) in both EN and zh-TW, each ≥301 lines.

The spec also performs one preliminary edit to FEE-12000 so the overview's Visual diagram and range table match the sequential numbering used here.

## Scope

In scope:

| ID    | EN path                                                                                                        | zh-TW path                                                                                                         |
|-------|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| 12000 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12000.md` (edit only)                                    | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12000.md` (edit only)                                     |
| 12001 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12001.md`                                               | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12001.md`                                                 |
| 12002 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12002.md`                                               | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12002.md`                                                 |
| 12003 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12003.md`                                               | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12003.md`                                                 |
| 12004 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12004.md`                                               | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12004.md`                                                 |
| 12005 | `docs/en/Web Platform Proposals/HTML and DOM Proposals/12005.md`                                               | `docs/zh-tw/Web Platform Proposals/HTML and DOM Proposals/12005.md`                                                 |

| ID    | Title                                                  |
|-------|--------------------------------------------------------|
| 12001 | Invoker Commands (`command` / `commandfor` attributes) |
| 12002 | Scoped Custom Element Registry                         |
| 12003 | Document Picture-in-Picture                            |
| 12004 | Navigation API                                         |
| 12005 | Speculation Rules                                      |

Out of scope:

- **Popover API.** Reached Baseline 2025 and ships unflagged in every major engine. The FEE-12000 overview's own rule — "when a feature ships stable, its article graduates to the appropriate 0-9999 category" — places Popover in the stable HTML range (`100s`). A separate follow-up spec will add Popover there.
- Articles beyond the five listed. Additional 12xxx topics (e.g. Close Watcher, View Transitions cross-document, Observable once it graduates from WICG) may be filed by future specs.
- Sidebar config or `list.md` edits. Both are regenerated at build time from frontmatter.
- Translation of any existing 12xxx file not in the table.

## Constraints

- Each sub-article file MUST be ≥301 lines, matching the repo floor established in commit `ef291af`.
- Every References section MUST contain ≥5 URLs, each verified live via WebFetch at write time. No fabricated URLs per the `Content Quality` rule in `CLAUDE.md`.
- EN and zh-TW MUST stay parallel. Section header map per `CLAUDE.md`:
  Context → 背景, Scenario → 情境, Best Practices → 最佳實踐, Design Thinking → 設計思維, Visual → 圖解, Example → 範例, Internal References → 內部參考, References → 參考資料.
- Must obey the Vue template safety rules in `CLAUDE.md` (no `{{ }}` in backtick code spans; escape `<Tag>` patterns inside `<code v-pre>`; double-backtick delimiters when embedding backticks).
- Must not use prohibited writing patterns from the user's global `CLAUDE.md` (no "not X, but Y" contrastive negation; no unanchored "很重"/"可以跑" modifiers; no em-dash chains of filler).
- No emoji in any file.
- Frontmatter per sub-article: `id`, `title`, `state: draft`, `level: senior` (matching peer articles such as `docs/en/Web Platform Proposals/CSS Experimental/11001.md`). `overview: true` is NOT set on sub-articles.

## Preliminary overview edit (FEE-12000)

The current FEE-12000 Visual section labels four topical sub-ranges (`12001-099` Elements/attributes, `12100-199` DOM APIs/events, `12200-299` Navigation/routing, `12300-399` Performance/loading, plus reserved). Sequential packing of 12001-12005 under a single topical bucket would leave the overview's diagram and range table inconsistent with reality.

The spec therefore performs one preliminary edit before any sub-article is written:

1. In both EN and zh-TW `12000.md`, replace the sub-range-based Mermaid diagram with a flat diagram: `FEE-12000` at the root, with leaf nodes for `12001` through `12005` labeled by their titles.
2. Update the range / "tracks in this range" table in both files to drop the topical sub-range rows and list the five sub-articles directly.
3. Preserve every other section of the overview (Context, Scenario, Design Thinking, Graduation, Related FEEs, References) unchanged.
4. Commit the overview edit before `12001` is written. This produces the first of six commits.

The edit is intentionally narrow: diagram + range table only. No prose edits, no reference changes, no frontmatter changes.

## Article template

All five sub-articles follow the canonical FEE template defined in `CLAUDE.md`. The same template is used by peer articles in `docs/en/Web Platform Proposals/CSS Experimental/` (11001-11302).

Section order:

```
---
id: <12001-12005>
title: "<title>"
state: draft
level: senior
---

# [FEE-<id>] <title>

:::info
One-sentence hook framing the feature's adoption tradeoff.
:::

## Context
Why the feature exists, what it replaces or augments, and what the pre-stable
status means for production use. 3-5 paragraphs.

## Scenario
Concrete situation where a developer encounters the problem the feature solves,
with enough detail that a reader recognizes the pain.

## Best Practices
Actionable MUST / SHOULD / MAY guidance. For pre-stable features the list
tilts toward feature detection, fallbacks, and progressive enhancement.

## Design Thinking
Two parts:
1. Why the platform needed the feature — historical constraint or userland
   pain that drove the proposal.
2. How the ecosystem has bridged the gap (polyfills, framework routers,
   feature detection libraries) and how the native feature relates.

## Visual
One Mermaid diagram when a diagram genuinely clarifies structure or flow.

## Example
One realistic runnable code block demonstrating the core technique.
No pseudocode.

## Internal References
3+ cross-references to related FEEs. Bullet format per CLAUDE.md template:
`- FEE-{ID} — {brief relational phrase}`.

## References
≥5 verified URLs, each opened via WebFetch during the research pass.
```

Optional topic-specific sections (e.g. "Migration Guide", "Browser Support Matrix", "Fallback Strategy") may be added when the topic warrants them; skip when forced.

No `## Principle` section. Pre-stable articles do not carry RFC-2119 normative rules above the `Best Practices` section.

## Per-article content outline

### FEE-12001 — Invoker Commands (`command` / `commandfor`)

- **Hook:** A declarative way to wire any button to any element's behavior, with no JavaScript wrapper and no ad-hoc event handlers.
- **Context:** Problem — showing a popover, opening a dialog, or dismissing a sheet used to require a click handler + an imperative call. Invokers introduce `command` and `commandfor` HTML attributes on `<button>`, with built-in values (`show-popover`, `hide-popover`, `toggle-popover`, `show-modal`, `close`, `request-close`) and a `--my-custom` convention. Status: shipped in Chromium and WebKit; Firefox behind flag at time of writing.
- **Scenario:** A tooltip triggered by a button — wiring `commandfor="tip"` and `command="toggle-popover"` vs. the current `addEventListener('click', () => tip.togglePopover())`.
- **Best Practices:** Invoker MUST be a `<button>`. MUST feature-detect via `HTMLButtonElement.prototype.command` before relying on custom commands. SHOULD use polyfill for cross-engine parity while Firefox catches up. MAY use custom `--*` commands but MUST handle the `CommandEvent` in that case.
- **Design Thinking (part 1):** Pre-invoker web UI wired every overlay relationship through JS; accessibility correctness (focus return, ESC handling) was a per-site reimplementation. The declarative model pushes the wiring into HTML where it can be audited statically.
- **Design Thinking (part 2):** `invokers-polyfill` bridges the gap for pre-stable engines; design tokens like `commandfor` were lifted from framework-level patterns (React's `onClick` + imperative ref calls) and made platform-native.
- **Visual:** Sequence diagram showing user click → browser emits `CommandEvent` → default command runs (if built-in) → element toggles.
- **Example:** A `<dialog>` opened by a button with `command="show-modal"`, closed by nested button with `command="close"`. A second example with a custom command `--apply-filter` and a `CommandEvent` listener.
- **Migration Guide:** JS click-handler pattern → invoker pair, with feature-detection wrapper.
- **Candidate references:** WHATWG HTML Living Standard invoker section; `openui/html` proposal repo; MDN `command` attribute page; `invokers-polyfill` npm; FEE-12003 Popover API (after graduation) or FEE-12000.

### FEE-12002 — Scoped Custom Element Registry

- **Hook:** Multiple versions of the same custom element can coexist in one document when they live in different shadow roots.
- **Context:** Global `customElements.define()` is a process-wide namespace; two micro-frontends that both define `<user-card>` collide irreconcilably. The scoped registry proposal adds `new CustomElementRegistry()` plus `attachShadow({ registry })` so each shadow root carries its own namespace. Status: shipped in Chromium (from ~132) and WebKit; Firefox behind flag.
- **Scenario:** A host page embeds two widgets from different vendors; both ship their own `<vendor-button>`. Without scoping, the second `define()` throws. With scoping, each shadow root carries its own registry.
- **Best Practices:** Use scoped registries for micro-frontend / widget integration surfaces; feature-detect via `'registry' in ShadowRootInit` or constructor presence; fall back to versioned tag names (`vendor-a-button-v2`) on non-supporting engines. Do NOT rely on scoped registries for application-internal encapsulation — use ES modules for that.
- **Design Thinking (part 1):** Custom elements adopted a global registry in 2016 because it mirrored `document.registerElement` and matched prevalent UI-framework patterns. Multi-owner pages were an afterthought, and the web ecosystem's shift to micro-frontends exposed the namespace limitation.
- **Design Thinking (part 2):** Polyfills (e.g. `@webcomponents/scoped-custom-element-registry`) rewrite tag names at registration time, which approximates but does not match native semantics (CSS rules written against the original tag name no longer match after rewriting).
- **Visual:** Diagram showing two shadow roots under one document, each carrying its own registry with the same element name bound to different constructors.
- **Example:** Two components registering `<demo-card>` under different registries, rendered side by side.
- **Browser Support Matrix:** Chromium (shipping), WebKit (shipping), Firefox (flag).
- **Candidate references:** WHATWG DOM spec (scoped registry section); `webcomponents-cg/community-protocols` repo; `@webcomponents/scoped-custom-element-registry` polyfill; MDN `CustomElementRegistry` page; WICG discussion thread.

### FEE-12003 — Document Picture-in-Picture

- **Hook:** Put an entire HTML document into a floating, always-on-top window — not just a `<video>`.
- **Context:** The pre-existing `HTMLVideoElement.requestPictureInPicture()` API handles only video. Document PiP exposes `documentPictureInPicture.requestWindow({ width, height })` which returns a full `Window` object; the page can append any DOM into its `document`. Status: Chromium-only at time of writing.
- **Scenario:** A video-conferencing app wants to pop out the participant grid (not just the video) into a floating window so the user can keep it visible while working in another app.
- **Best Practices:** Feature-detect via `'documentPictureInPicture' in window`; copy stylesheets via `adoptedStyleSheets` (styles on the main document don't automatically apply); handle `pagehide` to sync state back to the main document; NEVER rely on PiP being available — always provide a non-PiP fallback path.
- **Design Thinking (part 1):** Video PiP was scoped narrowly because the streaming media use case dominated early proposals. Once web apps matured into multi-pane layouts (video conferencing, live-coding, document review), the video-only constraint became the bottleneck.
- **Design Thinking (part 2):** There is no real polyfill — the capability is OS-level window creation and cannot be emulated. Fallbacks are to a detached `window.open()` (loses always-on-top behavior) or to an in-page floating pane.
- **Visual:** State diagram — main document → `requestWindow` → PiP Window created → user closes → `pagehide` → main document resumes.
- **Example:** Conference app popping out a participant grid; copying stylesheets; re-attaching `<video>` elements via `adoptedCallback`.
- **Candidate references:** W3C / WICG Document PiP spec; MDN `documentPictureInPicture` page; Chrome for Developers article on Document PiP; WebKit status tracker; Firefox bugzilla entry.

### FEE-12004 — Navigation API

- **Hook:** Replace every hand-written SPA router with a platform API that understands routing as a first-class concept.
- **Context:** `history.pushState` predates SPAs; it was designed for Ajax-style page updates, not for the route-centric SPA world. Frameworks (React Router, Vue Router, Next.js router) reimplemented navigation on top of `history` with varying semantics. The Navigation API (`window.navigation`) adds `navigate` events with `intercept({ handler })`, a typed entry list via `navigation.entries()`, focus and scroll restoration hooks, and transitional event ordering. Status: shipped in Chromium and WebKit; Firefox not yet (tracked).
- **Scenario:** A React app upgrades from React Router 6 to the Navigation API where available, falling back to `history` elsewhere. The Navigation API version gets scroll restoration and focus management for free.
- **Best Practices:** Feature-detect via `'navigation' in window`; SHOULD layer the framework's router over the Navigation API when available; MUST provide a `history`-based fallback for non-supporting engines; the `intercept()` handler returns a Promise — never resolve it synchronously.
- **Design Thinking (part 1):** `history.pushState` was a 2010-era addition for pre-SPA Ajax. Route concepts (named routes, nested routes, route parameters) were never part of the platform; every framework invented its own. The Navigation API reunifies the platform model with framework reality.
- **Design Thinking (part 2):** Frameworks' SPA routers will not disappear — they still provide route definition, guards, code splitting. They layer over the Navigation API as a cleaner primitive than `history`.
- **Visual:** Sequence diagram — link click → `navigate` event → `intercept(handler)` → Promise resolves → `currententrychange` fires.
- **Example:** A minimal SPA router using `navigate` event + `intercept({ handler })`; with framework integration sketch.
- **Candidate references:** WHATWG HTML Living Standard Navigation API section; WICG navigation-api repo; MDN Navigation API landing; Chrome blog post on the Navigation API; Firefox Nightly flag reference.

### FEE-12005 — Speculation Rules

- **Hook:** Declaratively tell the browser which links to preload and when, without writing any prefetch logic.
- **Context:** Pre-stable prefetch primitives (`<link rel="prefetch">`, `<link rel="prerender">`) were simple but crude — they did not distinguish preparation from full preloading, they shipped without privacy guards, and they lacked eagerness control. Speculation Rules replaces them with `<script type="speculationrules">`, a JSON declaration of which URLs to `prefetch` or `prerender`, with eagerness levels (`conservative`, `moderate`, `eager`, `immediate`). Status: Chromium-only at time of writing; Safari and Firefox have open tracking issues.
- **Scenario:** A docs site wants every in-range link to prerender on hover. Speculation Rules with `eagerness: "moderate"` does it without a JavaScript hover listener; on non-supporting engines the page still works, just without the prerender head start.
- **Best Practices:** Only prerender same-origin pages unless you have explicit knowledge of the target's idempotency (prerender can fire side effects); use `eagerness: "conservative"` for expensive pages; exclude analytics-affecting pages via URL patterns; provide a JS-driven prefetch fallback for Firefox / Safari until they ship.
- **Design Thinking (part 1):** `<link rel="prerender">` was removed from Chromium in 2019 because it ran full page loads for URLs the user might never visit, causing privacy leaks and wasted bandwidth. Speculation Rules is the post-mortem redesign — declarative, permissioned, and scoped.
- **Design Thinking (part 2):** Framework prefetchers (`next/link`, Remix prefetcher) can emit Speculation Rules where supported and fall back to their existing `<link rel="prefetch">` paths.
- **Visual:** Diagram showing rule set → browser scheduler → prefetch pool → prerender pool, with eagerness gating which pool a URL enters.
- **Example:** A `<script type="speculationrules">` block prefetching matching URL patterns; a second example using prerender with an exclusion list.
- **Risks callout:** Prerender fires side effects (analytics, stateful fetches). Pages MUST be idempotent or excluded.
- **Candidate references:** WICG speculation-rules spec; Chrome for Developers speculation rules article; MDN speculation rules page; caniuse entry; web.dev post on prerender pitfalls.

## References strategy

Per file, before commit:

1. **Minimum 5 verified URLs.** No generic placeholders. Every URL opened via WebFetch and confirmed live during the research pass.
2. **Ordering within the References section** (mirrors the parent overview spec):
   1. The feature's standards document (WHATWG, WICG, or W3C)
   2. The proposal repository or explainer
   3. MDN or caniuse landing page
   4. One canonical explainer (Chrome for Developers post, WebKit blog, Mozilla Hacks)
   5. One cross-reference to a sibling FEE (e.g. FEE-12000 overview, or a related stable article)
3. **Current-status claims requiring live verification before commit:**
   - Shipping status per engine (Chromium / WebKit / Firefox) for each feature
   - Any date cited for a specific shipping milestone
   - Spec maturity level (WD / CR / Living Standard section stability)
   - Polyfill package names and current versions when cited

If any verification fails or produces ambiguous results, rewrite the claim to a verifiable form before committing (e.g. "shipping in Chromium" rather than "Chrome 132+" when the exact version can't be pinned to a source).

## Execution workflow

The spec lands as **6 commits** in order:

### Commit 1 — Overview edit

1. Edit EN `12000.md`: replace Visual Mermaid diagram with flat `12000 → 12001..12005` diagram; update range table to list the five sub-articles directly.
2. Edit zh-TW `12000.md`: same structural change; preserve all surrounding Traditional Chinese prose.
3. Run `pnpm docs:build` to confirm Mermaid renders and the site builds.
4. Commit:
   ```
   docs(fee): update FEE-12000 overview for sequential sub-article IDs
   ```

### Commits 2-6 — Sub-articles

Per sub-article in order `12001 → 12002 → 12003 → 12004 → 12005`, repeat:

1. **Research pass.** WebFetch candidate reference URLs. Record verified facts, shipping status per engine, spec stability.
2. **Write EN file.** Draft to the target path. Hit ≥301 lines.
3. **Write zh-TW file.** Adapt the EN file section by section into Traditional Chinese prose written for a native reader. Use the zh-TW section header map. Machine translation is insufficient; a human-written adaptation at equivalent depth is required.
4. **Polish.** Invoke `polish-documents` on the EN file; then on the zh-TW file. Address findings inline.
5. **Verify Vue template safety.** Grep both files for the three `CLAUDE.md` pitfalls: unescaped `{{ }}` inside backtick spans; raw `<Tag>` inside backtick spans; backslash-escaped backticks. Fix with the documented escape patterns.
6. **Optional build probe.** If the sub-article introduces new Mermaid or HTML patterns the file hasn't used before, run `pnpm docs:build`.
7. **Commit.** One commit per sub-article, covering both language files:
   ```
   docs(fee): add FEE-<id> <title>
   ```

### Review checkpoint

**After FEE-12001 ships (commit 2), pause for user review before continuing.** This catches voice/depth drift on the first pre-stable sub-article before 80 % of the writing happens.

## Success criteria

- **6 commits** land on `main` in order: overview edit, then five sub-articles.
- All five sub-article files have `state: draft`, `level: senior`, no `overview: true` in frontmatter.
- Each of the 10 new sub-article files (5 EN + 5 zh-TW) is ≥301 lines.
- Every References section has ≥5 live-verified URLs.
- `polish-documents` has been run against every new file.
- `pnpm docs:build` succeeds after the last commit lands.
- Both language `list.md` files regenerate with entries for 12001-12005.
- The FEE-12000 overview's Visual and range table match the sub-article IDs that now exist.

## Risks and mitigations

- **Risk: status claims go stale fast** (Navigation API, Speculation Rules, Document PiP are Chromium-first and moving).
  Mitigation: favor structural language ("shipping in Chromium") over version specifics where possible; when specific status IS cited, verify at write time and include the source URL on that line.
- **Risk: zh-TW adaptation drifts from EN during the rewrite.**
  Mitigation: write EN first, then zh-TW, same session. Header map exact. Reviewer checkpoint after FEE-12001 confirms the pattern before the other four.
- **Risk: Vue template parse errors from embedded angle brackets or `{{ }}`.**
  Mitigation: grep step before commit; `CLAUDE.md`'s Vue Template Safety rules are the authoritative reference.
- **Risk: polish-documents changes voice in ways that break the bilingual parallel.**
  Mitigation: polish after both languages are drafted; review both polished files side-by-side before commit.
- **Risk: scope creep into Popover.**
  Mitigation: out-of-scope section above names Popover explicitly. If during research Popover appears to need documentation alongside Invokers (Invokers' most common use is with Popover), cross-reference Popover's eventual stable FEE ID rather than drafting Popover here.
- **Risk: overview edit breaks the site build.**
  Mitigation: commit 1 runs `pnpm docs:build` before the commit is finalized. If the build fails, fix before continuing.

## Out of scope (future specs)

- Popover API as a stable-range article (separate follow-up).
- Additional 12xxx articles for topics not in this batch (Close Watcher, cross-document View Transitions, Observable if it graduates from WICG).
- 13000-range WebGPU / WebNN sub-articles — covered by `fee-browser-compute-articles-design.md`.
- 14000-range WebAssembly sub-articles — covered by `fee-webassembly-proposals-articles-design.md`.
