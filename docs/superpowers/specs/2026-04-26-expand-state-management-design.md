---
title: Expand State Management — 8 Adoptable Gap Articles
date: 2026-04-26
status: Approved for writing
category: State Management
id_range: 611-618
branch: expand/state-management-2026-04-26
---

# Expand State Management — 8 Adoptable Gap Articles

## Confirmed Topics

| ID  | Slug / Filename             | Title                                                                  | Level  |
|-----|-----------------------------|------------------------------------------------------------------------|--------|
| 611 | `framework-signals`         | Framework Signals — A Cross-Implementation Mental Model                | mid    |
| 612 | `tc39-signals-proposal`     | TC39 Signals Proposal — A Standard Reactivity Primitive                | senior |
| 613 | `tanstack-query-v5`         | TanStack Query v5 — queryOptions, Suspense, Infinite Queries           | mid    |
| 614 | `xstate-v5-actor-model`     | XState v5 — The Actor Model and System Identification                  | senior |
| 615 | `yjs-and-automerge-crdts`   | CRDT Collaborative State with Yjs and Automerge                        | senior |
| 616 | `react-19-form-state`       | React 19 Form State — useOptimistic, useActionState, useFormStatus     | mid    |
| 617 | `offline-first-indexeddb`   | Offline-First State with IndexedDB (idb, Dexie)                        | mid    |
| 618 | `rsc-state-boundary`        | React Server Components — The State Boundary                           | senior |

## Pipeline (per topic, sequential)

1. Research subagent (PER-ARTICLE) → findings doc.
2. Writer subagent → EN article from findings + skill template.
3. Translator subagent → zh-TW counterpart.
4. **Polish — `Skill(polish-documents, ...)` on EN, then on zh-TW.** Per
   the post-Phase-4d-tightening rule, this MUST be the full skill
   invocation; inline grep-and-edit substitution is forbidden.
5. Gates: validate-frontmatter (both), validate-structure (both),
   check-references (EN), findings URL coverage ≥3.
6. One atomic commit per article: `docs(state-management): add <title> (FEE-<id>)`.
7. After all 8: regenerate `list.md` via `pnpm docs:build`, commit.

## Anticipated Topic-Specific Sections

Each article needs at least one custom `##` section. Likely choices:

- 611 framework-signals → `## Cross-Framework API Comparison`
- 612 tc39-signals-proposal → `## Signal.subtle.Watcher Reference`
- 613 tanstack-query-v5 → `## Migration from v4`
- 614 xstate-v5-actor-model → `## Actor Lifecycle (invoke vs spawn)`
- 615 yjs-and-automerge-crdts → `## Merge Semantics Comparison`
- 616 react-19-form-state → `## Hook Cooperation Pattern`
- 617 offline-first-indexeddb → `## Sync-on-Reconnect Strategy`
- 618 rsc-state-boundary → `## "use client" Boundary Patterns`

These are seeds; each writer subagent picks the strongest angle from its
findings doc.

## Source Tier Summary

- **Tier 2 (Standards / spec):** TC39 Signals proposal (612).
- **Tier 3 (Vendor docs by named teams):** Solid, Preact, Vue, Angular
  (611), TanStack Query (613), Stately/XState (614), Yjs / Automerge
  (615), React 19 docs (616, 618), Dexie / idb (617).
- **Tier 3-4 (Editorial):** web.dev IndexedDB article (617, named
  authors).

## Constraints

- Topic-specific section MUST per Phase 4d-adjacent rule.
- Polish-documents invocation MUST per Phase 4d.
- Style prohibitions per user global CLAUDE.md (no contrastive
  negation, no em-dash filler chains, no unanchored superlatives, no
  puffery preambles, no 「可以 X 可以 Y 可以 Z」 stacking).
- Filenames use semantic kebab slugs.
