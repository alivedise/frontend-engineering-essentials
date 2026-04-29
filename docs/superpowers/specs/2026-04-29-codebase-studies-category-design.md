---
title: Codebase Studies — New FEE Category Design
date: 2026-04-29
status: Approved for planning
slug: codebase-studies
id_range: 1800-1899
---

# Codebase Studies — New FEE Category Design

## Why this category

Every existing FEE category is technology-topic-organized: HTML, CSS,
JavaScript, State Management, etc. Each article describes how a
technology or pattern works, with synthetic examples for clarity. There
is no category for studying real, named open-source codebases.

A Codebase Studies category fills that gap. Each article extracts a
**named pattern** from a **named codebase**, with the project's source
as the primary anchor. The reader's takeaway is the ability to
**recognize the pattern when they see it again** — not necessarily to
copy the implementation, but to walk into another mature codebase and
identify the same architectural decision being made.

This framing (referred to as "A-with-B-spirit" during brainstorming)
threads a narrow path: it preserves FEE's "every article delivers a
takeaway" quality bar while avoiding two failure modes — (1) forcing
over-generalization that competes with FEE-500s' abstract pattern
articles, and (2) drifting into a curated-link-list shape with no
takeaway.

## Category metadata

- **Name:** Codebase Studies
- **Slug:** `codebase-studies`
- **Directory:** `docs/en/Codebase Studies/` and `docs/zh-tw/Codebase Studies/`
- **ID range:** 1800-1899
- **Position:** next sequential top-level. No new wing — the 10000+
  wing exists because TC39 / CSS / HTML proposals genuinely needed
  grouping; codebase studies aren't a different document type, just a
  different organizing axis.

## Article template — diff from existing FEE template

The existing FEE article template at
`/Users/alive/.claude/skills/expanding-category-articles/templates/article.md`
applies as-is, with three differentiators:

1. **New mandatory frontmatter field `studied_at`** — records the
   project version and date the article was written against. Example:
   `studied_at: "three.js r172 (2025-04-15)"`. Source drifts; readers
   returning later need to know which version's behavior the article
   describes.

2. **Topic-specific `##` heading is the named pattern**, not the
   author's choice of angle. Examples:
   `## The Dispose Lifecycle Contract`,
   `## The Render Loop`,
   `## The Plugin Pipeline`. The pattern's name must be memorable in
   2-4 words so readers walk away with a handle they can re-use.

3. **Source citations use commit-pinned URLs**, not `main`/`master`/
   `HEAD`. Format:
   `https://github.com/<org>/<repo>/blob/<sha>/<path>#L<line>`. The
   Example section pulls real source — pseudocode is forbidden.

The remaining sections (Context, Scenario, Best Practices, Design
Thinking, Deep Dive, Visual, Example, Internal References, References)
keep their existing semantics from the FEE template.

## Inclusion criteria

**Project must:**
- Be open source with a public repository.
- Be widely used or historically significant in frontend or adjacent
  domains (rendering, build tooling, state management, runtime,
  routing, compilation, etc.).
- Have a stable enough codebase that pinning a `studied_at` version is
  meaningful (no forks-of-the-month).

**Pattern must:**
- Be **named** — the article gives it a memorable handle in the
  topic-specific heading.
- Have **transferable recognition value** — the reader should be able
  to spot the same pattern in another codebase after reading.
- Be **anchored in source** — every claim links to specific files/lines
  at the studied commit.

**Negative test:** if the article's value is the *abstract* pattern
itself rather than the specific codebase witness, it belongs in
FEE-500s (Component Architecture & Design Patterns) instead.

## Boundary against FEE-500s

| | FEE-500s | Codebase Studies (1800-1899) |
|---|---|---|
| Article shape | Pattern in abstract, synthetic example | Pattern as practiced in one named codebase, source as primary anchor |
| Reader's takeaway | Apply the pattern in your own work | Recognize the pattern when you see it in real code |
| Cross-link convention | "See this pattern in action: [Codebase Study link]" | "Abstract pattern background: [FEE-500s link]" |

A pattern can have articles in both categories simultaneously, with
each cross-linking to the other. The two categories are complementary,
not redundant.

## Cross-category overlap rules

The `expanding-category-articles` skill's repo-wide overlap guard
(via `docs/en/list.md`) applies as it does for any category. For
Codebase Studies, the load-bearing noun in titles is the
**project name + pattern name combined** (e.g., "Three.js Dispose
Lifecycle"), which is distinctive enough to avoid colliding with
abstract pattern articles in FEE-500s or with technology-topic articles
elsewhere.

When researching a candidate article, check for collisions on:
- The project name (rarely a hit in 1-1799; sometimes a hit in 800-899
  Build Tooling).
- The pattern name in abstract form (often a hit in FEE-500s — when
  found, the new article cross-links rather than duplicates).

## Seed projects (v1)

Three projects spanning three domains:

| Project | Domain | Why it's a strong seed |
|---|---|---|
| Three.js | Rendering / 3D | Mature codebase (15+ years), several transferable patterns (dispose lifecycle, render loop, scene graph traversal), the user's seed candidate. |
| esbuild | Build tooling | Go codebase, but the architectural patterns (parallelism, AST plumbing, plugin protocol) transfer to readers working with TypeScript-side build tools. |
| TanStack Query | State management | TypeScript codebase that's directly relevant to readers' day-to-day work; Observer pattern around QueryCache is a textbook example most readers will benefit from naming. |

The breadth across domains is intentional: it establishes the
category's character via the variety of codebases studied rather than
as a single-project showcase.

## v1 article list

Four articles: one category Overview + one anchor article per seed
project.

| ID | Slug | Title | Topic-specific section |
|---|---|---|---|
| 1800 | `codebase-studies-overview` | Codebase Studies Overview | (.00 article — explains the category, inclusion criteria, article shape, source-citation rules) |
| 1801 | `threejs-dispose-lifecycle` | Three.js — The Dispose Lifecycle Contract | `## The Dispose Lifecycle Contract` |
| 1802 | `esbuild-parallelism-architecture` | esbuild — Parallelism Architecture | `## The Goroutine + Channel Fanout Model` |
| 1803 | `tanstack-query-observer-pattern` | TanStack Query — The Observer Pattern around QueryCache | `## The Observer Pattern around QueryCache` |

**Why these specific patterns:**

- **Three.js Dispose Lifecycle** — the most cross-domain useful pattern
  in Three.js. Long-running apps in any framework face the
  deterministic-cleanup-of-non-GC'd-resources problem (WebGL textures
  are the seed; the same shape applies to audio buffers, web workers,
  animation handles, observers, IntersectionObservers, ResizeObservers,
  etc.).
- **esbuild Parallelism** — defines esbuild's architectural character.
  Readers learn to recognize the goroutine + channel fanout model in
  any codebase that does parallel AST work.
- **TanStack Query Observer Pattern** — most architecturally
  instructive at-the-edge-of-readers'-current-tooling article in v1;
  teaches a subscription pattern that transfers to any cache + UI
  binding (SWR, RTK Query, Apollo, custom data layers).

Other patterns from these same projects (Three.js render loop, scene
graph; esbuild plugin protocol; TanStack Query stale-while-revalidate
state machine) are candidates for v2 — explicitly out of scope here.

## Authoring conventions

Specific to Codebase Studies; codified in the 1800 Overview article
and enforced during writing.

1. **`studied_at` frontmatter** — version + date the article was
   written against. Mandatory.
2. **Commit-pinned source links** — never `main`/`master`/`HEAD`.
3. **Code citations** show file path + line range above the block.
   Code is pulled verbatim from source; eliding unrelated lines with
   `// ...` is fine, rewriting is not.
4. **Pattern name** in the topic-specific `##` heading is 2-4 words,
   memorable, and bolded on first appearance in the article body so
   the reader walks away with a handle.
5. **"What to look for elsewhere"** closing bullet at the end of the
   topic-specific section — tells readers what to grep / which file
   structures to inspect to spot the same pattern in other codebases.
   This is the recognition transfer.
6. **Cross-link to FEE-500s** when the pattern has an abstract
   counterpart there.
7. **No fabrication discipline** mirrors `expanding-category-articles`:
   every claim about how the project works links to a specific
   file/line at the studied commit; if a generalization isn't
   supported by the source, it doesn't go in the article.

## Risks

- **Article rot.** Source code changes; even with `studied_at`
  pinning, articles will eventually describe behavior that no longer
  matches the project's main branch. Mitigation: `studied_at`
  frontmatter is the contract that articles describe a snapshot, not
  current behavior. Updating an article to a newer version is a
  legitimate future PR.
- **Inclusion bar drift.** If the bar drops to "well-engineered
  project worth reading", the category drifts toward annotated link
  lists with no takeaways. Mitigation: the negative test in
  Inclusion Criteria — every article must extract a *named pattern*
  with *transferable recognition value*.
- **Cannibalizing FEE-500s.** If the boundary blurs, articles end up
  duplicated. Mitigation: the boundary table above; each new article
  is checked against existing FEE-500s entries during the
  cross-category overlap sweep.
- **Selection bias toward big projects.** v1 picks famous
  codebases (Three.js, esbuild, TanStack Query). v2 should
  consciously broaden scope to include smaller well-engineered
  projects so the category doesn't become a popularity contest.

## Out of scope for v1

- **Multi-pattern project tour articles** ("Three.js Architecture")
  — explicitly held back. If the category accumulates 4+ articles per
  project later, an Overview article per project becomes worth
  writing. Not in v1.
- **Closed-source codebases** — by definition no public source
  links, no commit pinning, no verifiability.
- **Codebase comparison articles** ("Vite vs Rollup architecture")
  — single-codebase focus is the v1 contract. Comparisons may make
  sense later but aren't the format we're establishing.
- **Performance benchmarks of codebases** — the category is about
  architecture and patterns, not numerical evaluation. Benchmarks
  belong in FEE-700s (Rendering & Performance) or FEE-1404
  (Performance Monitoring & Tracing).

## What's next

After this design is approved, the implementation plan covers:
1. Directory creation (EN + zh-TW under `docs/<locale>/Codebase Studies/`).
2. Sidebar / `list.md` wiring (the VitePress sidebar generator at
   `docs/.vitepress/config/en.js` and `zh-tw.js` may need a category
   entry; verify).
3. Article-template addendum for the `studied_at` field and
   commit-pinned source links — captured in the 1800 Overview article
   itself (single source of truth).
4. The four v1 articles, each authored bilingually (EN + zh-TW)
   following the same per-topic pipeline as
   `expanding-category-articles`, but adapted for the `studied_at` /
   source-citation conventions.
5. `pnpm docs:build` to regenerate `list.md`.

Each v1 article is a per-topic atomic commit; the category Overview
is committed first as the .00 article. The design is sized for a
single implementation plan.
