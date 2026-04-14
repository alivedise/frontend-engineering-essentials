# Sidebar Category Order by Article ID Range

**Date:** 2026-04-14
**Status:** approved

## Problem

Sidebar categories are currently ordered by filesystem order (effectively alphabetical). The FEE article ID numbering scheme already encodes the intended category order (e.g. HTML starts at 100, CSS at 200, Accessibility at 1000). The sidebar should reflect that order.

## Goal

Sort all sidebar category groups — at every nesting level — by the minimum article ID found within that group. "Overall" remains pinned to the top. Leaf articles within a group are not reordered (they stay in filesystem order within their group).

## Approach

Post-process the tree returned by `getFilesRecursively` before it is assigned to `sidebar`. No changes to tree-building logic.

### Helpers to add

**`getMinId(node)`**

Returns the minimum numeric article ID reachable from `node`.

- Leaf (has `node.link`): parse the numeric ID from the link string (e.g. `"/1000"` → `1000`).
- Group (has `node.items`): return `Math.min(...node.items.map(getMinId))`.
- Fallback: return `Infinity` (sorts to end).

**`sortByMinId(nodes)`**

Sorts an array of sidebar nodes in-place by min article ID, with "Overall" pinned first.

1. For each node that has `items`, recurse: `sortByMinId(node.items)` first (depth-first).
2. Sort the current array: nodes whose `text` contains "overall" (case-insensitive) sort to index 0; all others sort ascending by `getMinId`.

### Integration

In `getSidebar`, replace the existing `sidebar.sort(...)` block:

```js
// before
sidebar.sort((a, b) => { ... });

// after
sortByMinId(sidebar);
```

### Scope

- Apply to `docs/.vitepress/config/en.js`
- Apply to `docs/.vitepress/config/zh-tw.js`
- The two helpers are identical in both files. If a shared utility already exists (`shared.js`), they can be moved there; otherwise define them locally in each file.

## Expected outcome

After the change, the sidebar order matches the article ID sequence:

| Category | Min ID |
|---|---|
| FEE Overall | 0 |
| HTML and Semantic Markup | 100 |
| CSS and Layout Systems | 200 |
| JavaScript Core and Runtime | 300 |
| Component Architecture and Design Patterns | 500 |
| State Management | 600 |
| Rendering and Performance | 700 |
| Build Tooling and Module Systems | 800 |
| Design Systems and UI Libraries | 900 |
| Accessibility | 1000 |
| Testing Strategies | 1100 |
| Security | 1200 |
| Progressive Web Apps and Offline | 1300 |
| Observability and Error Tracking | 1400 |
| CI CD and Deployment | 1500 |
| Developer Experience and Tooling | 1600 |
| TypeScript | 1700 |
| Web Platform Proposals | 10000 |

Sub-categories within Web Platform Proposals are similarly sorted by their minimum article ID.

## Sibling projects

The same pattern applies to the sibling documentation sites (BEE, DEE, ADE, AEE). Each has its own VitePress config with a `getSidebar` function structured identically. The same two helpers and the same `sortByMinId(sidebar)` call should be applied to each. This is noted here but scoped to a separate implementation task per repo.

## Out of scope

- Reordering leaf articles within a category
- Renaming directories
- Any change to article IDs or frontmatter
- Changes to sibling repos (tracked separately)
