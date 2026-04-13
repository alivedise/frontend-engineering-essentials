# FEE New Category Expansion Design

> **Status:** Approved
> **Date:** 2026-04-13

## Goal

Add six new top-level categories to the Frontend Engineering Essentials corpus, covering topic areas entirely absent from the current 17 categories. Total addition: 47 articles across TypeScript, Data Fetching & Client-Server Integration, Forms & Validation, Internationalization & Localization, Animation & Motion, and Node.js for Frontend Engineers.

## Context

The current FEE corpus has 17 categories (IDs 100–1699) and 136 articles, all in draft state. The gap audit found that several expected gaps are already filled: micro-frontends and error resilience are in Component Architecture; WebSockets/SSE are in Browser APIs; auth token storage is in Security; Core Web Vitals and code splitting are in Rendering & Performance. The six categories below are genuine gaps with no existing coverage.

## New Category Inventory

### TypeScript (1700s) — 9 articles

Every existing FEE category implicitly assumes TypeScript but no category teaches it. This is the single largest gap in the corpus.

| ID | Title |
|----|-------|
| 1700 | TypeScript Overview |
| 1701 | Type System Fundamentals & Type Inference |
| 1702 | Generics |
| 1703 | Utility Types & Type Manipulation |
| 1704 | Narrowing & Type Guards |
| 1705 | Declaration Files & DefinitelyTyped |
| 1706 | tsconfig & Strict Mode |
| 1707 | TypeScript in React |
| 1708 | Runtime Validation & Schema Libraries |

### Data Fetching & Client-Server Integration (1800s) — 8 articles

Browser APIs covers `fetch` primitives (FEE-403). This category covers what you build on top of them: server state libraries, caching, mutations, and loading patterns. No current category addresses these application-level concerns.

| ID | Title |
|----|-------|
| 1800 | Data Fetching Overview |
| 1801 | Fetch Patterns & Request Lifecycle |
| 1802 | Server State Management |
| 1803 | GraphQL Client Integration |
| 1804 | Caching Strategies & Invalidation |
| 1805 | Optimistic Updates & Mutation Patterns |
| 1806 | Pagination & Infinite Loading |
| 1807 | Error Handling & Loading States |

### Forms & Validation (1900s) — 8 articles

Ubiquitous in every frontend application. No current category addresses form architecture, validation schemas, or multi-step form state.

| ID | Title |
|----|-------|
| 1900 | Forms Overview |
| 1901 | Controlled vs. Uncontrolled Inputs |
| 1902 | Form Libraries & Schema-Driven Forms |
| 1903 | Schema Validation |
| 1904 | Async Validation & Server-Side Errors |
| 1905 | Multi-Step Forms & Wizard Patterns |
| 1906 | File Uploads & Binary Data |
| 1907 | Accessible Forms |

### Internationalization & Localization (2000s) — 8 articles

Entirely absent from the corpus. Critical for any product shipping to multiple locales. Covers both the technical layer (message formatting, RTL) and the workflow layer (string extraction, translation pipeline).

| ID | Title |
|----|-------|
| 2000 | Internationalization Overview |
| 2001 | Message Formatting & ICU Syntax |
| 2002 | Pluralization & Gender Rules |
| 2003 | Date, Number & Currency Formatting |
| 2004 | RTL Layout & Bidirectional Text |
| 2005 | Locale Detection & Routing |
| 2006 | Translation Workflow & String Extraction |
| 2007 | i18n in Component Libraries |

### Animation & Motion (2100s) — 7 articles

The CSS category covers static visual properties. No category covers animation timing, the compositor thread, motion design principles, or the library landscape.

| ID | Title |
|----|-------|
| 2100 | Animation & Motion Overview |
| 2101 | CSS Transitions & Keyframe Animations |
| 2102 | Web Animations API |
| 2103 | Animation Performance & the Compositor Thread |
| 2104 | Motion Design Principles for UI |
| 2105 | prefers-reduced-motion & Accessible Animation |
| 2106 | Animation Libraries |

### Node.js for Frontend Engineers (2200s) — 7 articles

SSR is covered in Rendering & Performance. This category fills the adjacent gap: how frontend engineers reason about the Node.js runtime, API routes, edge functions, and BFF patterns without a backend background.

| ID | Title |
|----|-------|
| 2200 | Node.js for Frontend Engineers Overview |
| 2201 | Node.js Runtime Model |
| 2202 | Server-Side Rendering Patterns |
| 2203 | API Routes & Backend for Frontend |
| 2204 | Edge Functions & Edge Runtime |
| 2205 | Middleware Patterns |
| 2206 | Environment Variables & Configuration |

## Phased Release Plan

| Phase | Categories | Articles | Rationale |
|-------|-----------|---------|-----------|
| Tier 1 | TypeScript → Data Fetching → Forms | 25 | Universal: every frontend project needs all three. TypeScript first because it is referenced by every article written after it. Data Fetching before Forms because form submission is a data fetching concern. |
| Tier 2 | i18n → Animation | 15 | Common: most product teams need these, but not all. High value when needed; limited good engineering-level writing exists on either topic. |
| Tier 3 | Node.js for Frontend | 7 | Specialized: most relevant for SSR, edge, and BFF work. Built last because the edge runtime landscape is still stabilizing. |
| **Total** | 6 categories | **47** | |

## Article Format

All new articles follow the standard FEE format established in the improvement pass (Batches 19–34):

- Frontmatter: `id`, `title`, `state: draft`, `category`
- Sections in order: Context, Design Thinking, Best Practices, Visual (where applicable), Example, Common Mistakes (where warranted), Related FEEs, References
- Best Practices: RFC-2119 bold-prefix paragraph rules (MUST/SHOULD/MUST NOT), no fenced code blocks, no `###` subheadings within the section
- Both `docs/en/` and `docs/zh-tw/` versions for every article

## Cross-References to Existing Categories

New categories that have strong cross-reference relationships with existing ones:

- TypeScript → JS Core (types build on the runtime model), Component Architecture (prop typing), Testing (typed test utilities)
- Data Fetching → Browser APIs (fetch primitives), State Management (server vs. client state boundary), Security (CORS, auth headers)
- Forms → Accessibility (form accessibility), Component Architecture (controlled/uncontrolled), State Management (form state)
- i18n → CSS (RTL layout), Accessibility (language attributes, screen reader locale)
- Animation → CSS (transitions), Accessibility (prefers-reduced-motion), Rendering & Performance (compositor thread)
- Node.js for Frontend → Rendering & Performance (SSR), Security (server-side concerns), CI/CD (deployment targets)
