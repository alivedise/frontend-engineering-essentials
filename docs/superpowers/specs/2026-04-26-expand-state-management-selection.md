---
title: Category Selection — Expand State Management Next
date: 2026-04-26
status: Approved for expansion
category: State Management
successor_skill: expanding-category-articles
---

# Category Selection — Expand State Management Next

## Problem

Three categories were expanded earlier this session (TypeScript 8 → 17,
HTML 9 → 17, Design Systems 10 → 18). The next under-served category
needs to be picked so the `expanding-category-articles` skill — now with
the Phase 4d MUST-invoke-polish-documents enforcement — can run on it.

## Decision

Expand **State Management** (main category 600).

## Existing articles (10 total)

- 600 Overview
- 601 Local Component State
- 602 Derived & Computed State
- 603 Context & Prop Drilling
- 604 Server State & Data Synchronization
- 605 State Machines & Finite Automata
- 606 URL State & Routing
- 607 State Management Libraries
- 608 Optimistic Updates
- 609 Form State Management
- 610 Undo/Redo Patterns

(11 files — overview at 600 plus 10 articles 601-610.)

## Rationale

- **Hot 2026 surface absent from current coverage.** Signals as a
  framework primitive (Solid, Preact, Vue 3.5, Angular Signals, the
  TC39 Signals proposal stage 1), TanStack Query v5 + RTK Query v2
  patterns, XState v5 actor model, collaborative state with CRDTs
  (Yjs / Automerge), React 19's `useOptimistic` / `useActionState`,
  store-pattern selection at scale (Zustand patterns), persistence
  (IndexedDB + Zustand persist + offline-first patterns).
- **Topic-specific section fit is strong.** Each pattern has a clear
  angle: signal-vs-VDOM mental model, query lifecycle reference,
  actor message protocol, CRDT merge semantics, optimistic-rollback
  algorithm, schema persistence model.
- **Source tiers are uniformly good.** TC39 Signals proposal (tier-2),
  framework docs by named teams (Solid, Vue, Preact, TanStack —
  tier-3), W3C / Yjs / Automerge spec docs (tier-2). Mixed but solid.

## Why not the 10-tier candidates

- **DX & Tooling** is more vendor-doc-heavy with faster drift cycles
  (Biome/Oxc/Turborepo all version-churning). Worth a future expansion;
  not the right pick for this run.
- **PWA** is well-specified but smaller in surface area; better suited
  to a 4-5 article gap-fill than an 8-article expansion.

## Why not CSS (the recommended alternative)

CSS surface is rich and the recommendation stands for a future expansion.
The user explicitly picked State Management for this run, so this spec
records that choice rather than overriding it.

## Next step

Invoke the `expanding-category-articles` skill against the State
Management category with `--count=adoptable` (matching the
TypeScript / HTML / Design Systems convention). The research subagent
in GAP-DISCOVERY mode will propose the ranked topic list; the user
reviews and confirms before any articles are written.

All per-article research and writing artifacts land under
`docs/superpowers/research/` and `docs/en/State Management/` plus the
zh-TW mirror, in a fresh worktree at
`../frontend-engineering-essentials-expand-state-management-2026-04-26/`
on branch `expand/state-management-2026-04-26`.

## Constraints applied to this expansion

- **Each new article MUST have a topic-specific `##` section** (or
  carry the explicit `allow_no_custom_section: true` + `# reason: ...`
  frontmatter escape — unlikely to be needed given the topic landscape).
- **Phase 4d polish-documents invocation is MUST**, not optional.
- **FEE canonical template** from `CLAUDE.md` applies; writer subagent
  receives the skill template.
- **Filenames use semantic kebab slugs**, not numeric IDs.

## Probable gap topics (to be confirmed by gap-discovery subagent)

These are seeds, not commitments — the research subagent ranks and
filters before any article is written:

- Signals — the JavaScript framework primitive (Solid, Preact, Vue,
  Angular) and the TC39 proposal
- TanStack Query v5 — query keys, invalidation, suspense integration,
  prefetching strategy
- XState v5 actor model — actor refs, event bus patterns, cross-tree
  communication
- Collaborative state with Yjs and Automerge — CRDT merge semantics,
  awareness, persistence
- React 19 `useOptimistic` / `useActionState` — built-in optimistic
  update plus form-action state
- Zustand patterns at scale — slicing, middleware composition,
  selector subscription, persist
- Offline-first state with IndexedDB — Dexie / idb / Zustand persist
  with IDB backend, sync-on-reconnect
- React Server Components state boundary — what data crosses the
  server/client boundary, when to lift state above an RSC

The discovery subagent may propose better gaps; this list exists to
calibrate scope, not to constrain.
