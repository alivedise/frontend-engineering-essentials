# Sidebar Category Order by Min Article ID — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sort sidebar category groups at every nesting level by the minimum article ID found within each group, so the sidebar order matches the FEE ID numbering scheme.

**Architecture:** Add two pure helpers (`getMinId`, `sortByMinId`) as module-level functions in each VitePress locale config. Replace the existing `sidebar.sort(...)` call with `sortByMinId(sidebar)`. Tree-building logic is untouched.

**Tech Stack:** Node.js, VitePress 1.3.x, gray-matter (already in use)

---

### Task 1: Update `en.js` — add helpers and replace sort

**Files:**
- Modify: `docs/.vitepress/config/en.js`

The current sort block (lines 54–60 of `en.js`):

```js
sidebar.sort((a, b) => {
  const aIsOverall = a.text && a.text.toLowerCase().includes('overall');
  const bIsOverall = b.text && b.text.toLowerCase().includes('overall');
  if (aIsOverall && !bIsOverall) return -1;
  if (!aIsOverall && bIsOverall) return 1;
  return 0;
});
```

- [ ] **Step 1: Add helpers above `getSidebar`**

Open `docs/.vitepress/config/en.js`. Insert the two helper functions immediately before the `function getSidebar(dir) {` line:

```js
function getMinId(node) {
  if (node.link) {
    const id = parseInt(node.link.replace(/^\//, ''), 10);
    return isNaN(id) ? Infinity : id;
  }
  if (node.items && node.items.length) {
    return Math.min(...node.items.map(getMinId));
  }
  return Infinity;
}

function sortByMinId(nodes) {
  nodes.forEach((node) => {
    if (node.items && node.items.length) {
      sortByMinId(node.items);
    }
  });
  nodes.sort((a, b) => {
    const aIsOverall = a.text && a.text.toLowerCase().includes('overall');
    const bIsOverall = b.text && b.text.toLowerCase().includes('overall');
    if (aIsOverall && !bIsOverall) return -1;
    if (!aIsOverall && bIsOverall) return 1;
    return getMinId(a) - getMinId(b);
  });
}
```

- [ ] **Step 2: Replace the existing `sidebar.sort(...)` call**

Find this block in `getSidebar` (after `const sidebar = getFilesRecursively(docsPath);`):

```js
sidebar.sort((a, b) => {
  const aIsOverall = a.text && a.text.toLowerCase().includes('overall');
  const bIsOverall = b.text && b.text.toLowerCase().includes('overall');
  if (aIsOverall && !bIsOverall) return -1;
  if (!aIsOverall && bIsOverall) return 1;
  return 0;
});
```

Replace it with:

```js
sortByMinId(sidebar);
```

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config/en.js
git commit -m "feat(sidebar): sort EN categories by minimum article ID"
```

---

### Task 2: Update `zh-tw.js` — add helpers and replace sort

**Files:**
- Modify: `docs/.vitepress/config/zh-tw.js`

The zh-TW config is structurally identical to `en.js` with two differences:
1. Links use `/zh-tw/${data.id}` — the helper strips the locale prefix via a broader regex.
2. The "Overall" pin also checks for `'總覽'` (the zh-TW word).

- [ ] **Step 1: Add helpers above `getSidebar`**

Open `docs/.vitepress/config/zh-tw.js`. Insert immediately before `function getSidebar(dir) {`:

```js
function getMinId(node) {
  if (node.link) {
    const id = parseInt(node.link.replace(/^\/[^/]*\//, '').replace(/^\//, ''), 10);
    return isNaN(id) ? Infinity : id;
  }
  if (node.items && node.items.length) {
    return Math.min(...node.items.map(getMinId));
  }
  return Infinity;
}

function sortByMinId(nodes) {
  nodes.forEach((node) => {
    if (node.items && node.items.length) {
      sortByMinId(node.items);
    }
  });
  nodes.sort((a, b) => {
    const aIsOverall = a.text && (a.text.toLowerCase().includes('overall') || a.text.includes('總覽'));
    const bIsOverall = b.text && (b.text.toLowerCase().includes('overall') || b.text.includes('總覽'));
    if (aIsOverall && !bIsOverall) return -1;
    if (!aIsOverall && bIsOverall) return 1;
    return getMinId(a) - getMinId(b);
  });
}
```

Note: the `getMinId` regex `replace(/^\/[^/]*\//, '')` strips a leading `/zh-tw/` segment before parsing. This correctly handles `/zh-tw/1000` → `1000`.

- [ ] **Step 2: Replace the existing `sidebar.sort(...)` call**

Find this block in `getSidebar`:

```js
sidebar.sort((a, b) => {
  const aIsOverall = a.text && (a.text.toLowerCase().includes('overall') || a.text.includes('總覽'));
  const bIsOverall = b.text && (b.text.toLowerCase().includes('overall') || b.text.includes('總覽'));
  if (aIsOverall && !bIsOverall) return -1;
  if (!aIsOverall && bIsOverall) return 1;
  return 0;
});
```

Replace it with:

```js
sortByMinId(sidebar);
```

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config/zh-tw.js
git commit -m "feat(sidebar): sort zh-TW categories by minimum article ID"
```

---

### Task 3: Verify with production build

**Files:** none modified

- [ ] **Step 1: Run the production build**

```bash
pnpm docs:build
```

Expected: build completes with no errors. If it fails, check the error output — most likely cause is a malformed `link` value hitting `parseInt`.

- [ ] **Step 2: Inspect sidebar order in preview**

```bash
pnpm docs:preview
```

Open the local preview URL. Confirm the EN sidebar top-level order is:

1. FEE Overall
2. HTML and Semantic Markup (100s)
3. CSS and Layout Systems (200s)
4. JavaScript Core and Runtime (300s)
5. Component Architecture and Design Patterns (500s)
6. State Management (600s)
7. Rendering and Performance (700s)
8. Build Tooling and Module Systems (800s)
9. Design Systems and UI Libraries (900s)
10. Accessibility (1000s)
11. Testing Strategies (1100s)
12. Security (1200s)
13. Progressive Web Apps and Offline (1300s)
14. Observability and Error Tracking (1400s)
15. CI CD and Deployment (1500s)
16. Developer Experience and Tooling (1600s)
17. TypeScript (1700s)
18. Web Platform Proposals (10000s)

Also open "Web Platform Proposals" and verify its sub-categories appear in ID order.

Switch to the zh-TW locale and confirm the same ordering applies.

- [ ] **Step 3: Commit if any fix was needed; otherwise done**

If the build required a fix, commit it:

```bash
git add docs/.vitepress/config/en.js docs/.vitepress/config/zh-tw.js
git commit -m "fix(sidebar): correct link parsing in getMinId"
```
