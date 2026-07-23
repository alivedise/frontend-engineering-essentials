---
title: Expand CSS and Layout Systems — Stacking Contexts Article
date: 2026-07-24
status: Confirmed by user
category: CSS and Layout Systems
branch: expand/css-and-layout-systems-2026-07-24
---

# Expand CSS and Layout Systems — 2026-07-24

## Confirmed topic list

| # | ID | Title | Slug |
|---|----|-------|------|
| 1 | 211 | Stacking Contexts, Paint Order & the Top Layer | stacking-contexts-paint-order-top-layer |

## Motivation

FEE-202 (Box Model & Layout Modes) mentions stacking contexts in three
fragments (a hierarchy diagram, a `transform` trap example, a z-index
common mistake) with no canonical treatment. Four other articles reference
stacking contexts with nowhere to link: FEE-209 (`contain: paint` side
effect), FEE-210 (`isolation: isolate` and blend modes), FEE-710 (stacking
context vs compositor layer), and the popover article (top-layer escape).

Overlap sweep against `docs/en/list.md` on 2026-07-24 found no existing
article title matching stacking / paint order / top layer / z-index.

## Scope notes

- New article FEE-211 in `docs/en/CSS and Layout Systems/` and
  `docs/zh-tw/CSS and Layout Systems/`, slug filename.
- Follow-up edit to FEE-202 (both locales): add FEE-211 to the related
  articles table and forward-link from Common Mistakes 2.
