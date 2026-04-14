# FEE Audience Level Field and Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `level` frontmatter field to all FEE articles and render a colored badge before each article heading using a VitePress `doc-before` slot component, then run a one-shot AI classification script to populate the field across all articles.

**Architecture:** A `LevelBadge.vue` Vue SFC reads `frontmatter.level` via VitePress `useData()` and renders using VitePress's built-in `.vp-badge` CSS classes in the `doc-before` layout slot. A standalone Node.js script (`scripts/classify-levels.js`) calls the Claude API per-category to assign levels and patches frontmatter in both EN and zh-TW files. Overview articles (frontmatter `overview: true`) are skipped by both the badge and the script.

**Tech Stack:** Vue 3, VitePress 1.3.1, gray-matter (already installed), @anthropic-ai/sdk (to be added), Node.js CJS

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `docs/.vitepress/theme/LevelBadge.vue` | Create | Badge component reading `frontmatter.level` |
| `docs/.vitepress/theme/index.js` | Modify | Register `doc-before` slot to mount LevelBadge |
| `docs/.vitepress/theme/index.css` | Modify | Add margin below badge |
| `docs/en/FEE Overall/0.md` | Modify | Document the `level` field |
| `docs/zh-tw/FEE Overall/0.md` | Modify | zh-TW counterpart documentation |
| `scripts/classify-levels.js` | Create | One-shot classification script |
| `package.json` | Modify | Add `@anthropic-ai/sdk` devDependency |

---

### Task 1: LevelBadge component and theme registration

**Files:**
- Create: `docs/.vitepress/theme/LevelBadge.vue`
- Modify: `docs/.vitepress/theme/index.js`
- Modify: `docs/.vitepress/theme/index.css`

- [ ] **Step 1: Create LevelBadge.vue**

Create `docs/.vitepress/theme/LevelBadge.vue` with the following content:

```vue
<template>
  <div v-if="level" class="level-badge-wrapper">
    <span :class="`vp-badge ${badgeType}`">{{ badgeLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';

const { frontmatter } = useData();

const level = computed(() => {
  if (frontmatter.value.overview) return null;
  return frontmatter.value.level ?? null;
});

const badgeType = computed(() => {
  const map = { entry: 'tip', mid: 'warning', senior: 'danger', '???': 'info' };
  return map[level.value] ?? 'info';
});

const badgeLabel = computed(() => {
  const map = { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level', '???': 'Needs Review' };
  return map[level.value] ?? level.value;
});
</script>
```

- [ ] **Step 2: Verify LevelBadge.vue was created**

Run:
```bash
cat docs/.vitepress/theme/LevelBadge.vue
```
Expected: file content printed with template, script setup, no errors.

- [ ] **Step 3: Register LevelBadge in the theme and add to doc-before slot**

Open `docs/.vitepress/theme/index.js`. Current content is:

```js
import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './index.css';
import './md.css';
import './sw';
import createScrollHandler from './scrollhandler';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {});
  },
  enhanceApp({ router }) {
    if (!import.meta.env.SSR) {
      createScrollHandler(router);
    }
  },
};
```

Replace it with:

```js
import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './index.css';
import './md.css';
import './sw';
import createScrollHandler from './scrollhandler';
import LevelBadge from './LevelBadge.vue';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(LevelBadge),
    });
  },
  enhanceApp({ router }) {
    if (!import.meta.env.SSR) {
      createScrollHandler(router);
    }
  },
};
```

- [ ] **Step 4: Add margin below badge in index.css**

Open `docs/.vitepress/theme/index.css`. Append to the end of the file:

```css
.level-badge-wrapper {
  margin-bottom: 8px;
}
```

- [ ] **Step 5: Verify build passes**

Run:
```bash
pnpm docs:build
```
Expected: build completes without errors. Badge will not appear yet on articles without a `level` field — that is expected at this stage.

- [ ] **Step 6: Smoke test badge rendering**

Temporarily add `level: entry` to the frontmatter of one article — e.g., `docs/en/JavaScript Core and Runtime/301.md` — then run `pnpm docs:dev` and open `http://localhost:5173/frontend-engineering-essentials/JavaScript-Core-and-Runtime/301` in a browser. Confirm a green "Entry Level" badge appears before the article heading. Remove the temporary `level` field after confirming. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add docs/.vitepress/theme/LevelBadge.vue docs/.vitepress/theme/index.js docs/.vitepress/theme/index.css
git commit -m "feat(theme): add LevelBadge component and doc-before slot registration"
```

---

### Task 2: Document the level field in FEE-0

**Files:**
- Modify: `docs/en/FEE Overall/0.md`
- Modify: `docs/zh-tw/FEE Overall/0.md`

- [ ] **Step 1: Add level field documentation to the EN How to Read FEEs section**

Open `docs/en/FEE Overall/0.md`. In the `## How to Read FEEs` section, there is a list of article structure fields. After the existing bullet list (which ends with `- **References** -- External resources for deeper learning`), add:

```markdown
## Article Metadata Fields

Each FEE article's frontmatter carries the following fields:

| Field | Values | Meaning |
|-------|--------|---------|
| `id` | integer | Unique article number within the FEE numbering scheme |
| `title` | string | Human-readable article title |
| `state` | `draft`, `placeholder` | Publication state |
| `overview` | `true` (omitted if false) | Marks category overview pages; these do not have a `level` field |
| `level` | `entry`, `mid`, `senior`, `???` | Intended audience difficulty. `entry` = suitable for juniors; `mid` = assumes solid fundamentals; `senior` = advanced depth. `???` = pending manual review. |
```

- [ ] **Step 2: Add the same section to the zh-TW counterpart**

Open `docs/zh-tw/FEE Overall/0.md`. Add the same section translated:

```markdown
## 文章元資料欄位

每篇 FEE 文章的 frontmatter 包含以下欄位：

| 欄位 | 值 | 說明 |
|------|----|------|
| `id` | 整數 | FEE 編號系統中的唯一文章編號 |
| `title` | 字串 | 文章標題 |
| `state` | `draft`、`placeholder` | 發布狀態 |
| `overview` | `true`（false 時省略） | 標記分類總覽頁；這些頁面沒有 `level` 欄位 |
| `level` | `entry`、`mid`、`senior`、`???` | 目標受眾難度。`entry` = 適合初級工程師；`mid` = 需要紮實基礎；`senior` = 進階深度。`???` = 待人工審查。 |
```

- [ ] **Step 3: Verify build passes**

```bash
pnpm docs:build
```
Expected: build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add "docs/en/FEE Overall/0.md" "docs/zh-tw/FEE Overall/0.md"
git commit -m "docs(fee-0): document level frontmatter field"
```

---

### Task 3: Classification script

**Files:**
- Modify: `package.json`
- Create: `scripts/classify-levels.js`

- [ ] **Step 1: Add @anthropic-ai/sdk as devDependency**

```bash
pnpm add -D @anthropic-ai/sdk
```
Expected: `@anthropic-ai/sdk` appears in `package.json` devDependencies.

- [ ] **Step 2: Create the scripts directory**

```bash
mkdir -p scripts
```

- [ ] **Step 3: Create scripts/classify-levels.js**

Create `scripts/classify-levels.js` with the following content:

```js
'use strict';
// classify-levels.js
// One-shot script to assign `level` frontmatter to all unclassified FEE articles.
//
// Usage:
//   node scripts/classify-levels.js --dry-run            # parse and group without API calls
//   node scripts/classify-levels.js --category "HTML and Semantic Markup"  # single category
//   ANTHROPIC_API_KEY=sk-... node scripts/classify-levels.js               # full run

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Anthropic = require('@anthropic-ai/sdk');

const ROOT = path.join(__dirname, '..');
const EN_DOCS = path.join(ROOT, 'docs', 'en');
const ZHTW_DOCS = path.join(ROOT, 'docs', 'zh-tw');

const DRY_RUN = process.argv.includes('--dry-run');
const CATEGORY_FILTER = (() => {
  const idx = process.argv.indexOf('--category');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// Recursively collect all .md files under a directory
function collectMdFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMdFiles(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

// Extract the first non-empty non-heading non-admonition paragraph after frontmatter
function extractIntro(content) {
  const lines = content.split('\n');
  let fmCount = 0;
  let frontmatterDone = false;
  const paragraphLines = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      fmCount++;
      if (fmCount === 2) frontmatterDone = true;
      continue;
    }
    if (!frontmatterDone) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith(':::')) continue;
    if (line.trim() === '') {
      if (paragraphLines.length > 0) break;
      continue;
    }
    paragraphLines.push(line.trim());
  }
  return paragraphLines.join(' ').slice(0, 400);
}

// Get category name from relative path under docs/en/
function getCategory(filePath) {
  const rel = path.relative(EN_DOCS, filePath);
  const parts = rel.split(path.sep);
  return parts.length > 1 ? parts[0] : 'FEE Overall';
}

// Determine the zh-TW counterpart of an EN file
function getZhTwPath(enPath) {
  const rel = path.relative(EN_DOCS, enPath);
  return path.join(ZHTW_DOCS, rel);
}

// Serialize level value safely for YAML (??? must be quoted)
function levelToYaml(level) {
  return level === '???' ? '"???"' : level;
}

// Patch or insert the level field in a file's frontmatter without reformatting
function patchLevel(filePath, level) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);

  if (parsed.data.level === level) return;

  const yamlValue = levelToYaml(level);

  if (parsed.data.level != null) {
    // Replace existing level line
    const updated = raw.replace(/^level:.*$/m, `level: ${yamlValue}`);
    fs.writeFileSync(filePath, updated, 'utf8');
  } else {
    // Insert level after the second --- (closing frontmatter delimiter)
    // Match opening ---, frontmatter body, closing ---
    const updated = raw.replace(
      /^(---\n[\s\S]*?)\n---/,
      `$1\nlevel: ${yamlValue}\n---`
    );
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

const AnthropicClient = Anthropic.default ?? Anthropic;
const client = DRY_RUN ? null : new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });

async function classifyCategory(categoryName, articles) {
  const articleList = articles.map(a => ({ id: a.id, title: a.title, intro: a.intro }));

  const prompt = `You are classifying FEE (Frontend Engineering Essentials) articles by audience difficulty level.

Category: "${categoryName}"

Calibration within this category:
- "entry": foundational concept a junior developer would encounter first; minimal prerequisites
- "mid": assumes solid fundamentals; targets engineers with 2–4 years experience
- "senior": advanced depth; requires prior mastery of most other articles in this category

Articles to classify:
${JSON.stringify(articleList, null, 2)}

Respond with ONLY a JSON array — no prose, no markdown fences:
[{ "id": <number>, "level": "entry"|"mid"|"senior", "confidence": <0.0-1.0>, "reason": "<one sentence>" }]`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would call API for ${articles.length} articles`);
    return articles.map(a => ({ id: a.id, level: 'entry', confidence: 0.5, reason: 'dry run placeholder' }));
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  return JSON.parse(text);
}

async function main() {
  const allFiles = collectMdFiles(EN_DOCS);

  const articlesByCategory = new Map();
  let skippedCount = 0;
  let hardcodedCount = 0;

  for (const filePath of allFiles) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    // Skip overview articles
    if (data.overview) { skippedCount++; continue; }
    // Skip already classified
    if (data.level != null) { skippedCount++; continue; }

    const id = Number(data.id);

    // Web Platform Proposals: hardcode senior
    if (id >= 10000) {
      console.log(`Hardcoding senior: FEE-${id} — ${data.title}`);
      if (!DRY_RUN) {
        patchLevel(filePath, 'senior');
        try { patchLevel(getZhTwPath(filePath), 'senior'); } catch (e) {
          console.warn(`  Warning: zh-TW patch failed for FEE-${id}: ${e.message}`);
        }
      }
      hardcodedCount++;
      continue;
    }

    const category = getCategory(filePath);
    const intro = extractIntro(content);

    if (!articlesByCategory.has(category)) articlesByCategory.set(category, []);
    articlesByCategory.get(category).push({ filePath, id, title: data.title, intro });
  }

  const totalToClassify = [...articlesByCategory.values()].reduce((s, a) => s + a.length, 0);
  console.log(`Skipped: ${skippedCount}  |  Hardcoded senior: ${hardcodedCount}  |  To classify: ${totalToClassify} in ${articlesByCategory.size} categories`);

  const uncertainArticles = [];

  for (const [category, articles] of articlesByCategory) {
    if (CATEGORY_FILTER && category !== CATEGORY_FILTER) continue;

    console.log(`\nClassifying "${category}" (${articles.length} articles)...`);

    let results;
    try {
      results = await classifyCategory(category, articles);
    } catch (err) {
      console.error(`  Error for "${category}": ${err.message}`);
      continue;
    }

    for (const result of results) {
      const article = articles.find(a => a.id === result.id);
      if (!article) { console.warn(`  Unknown id ${result.id} in response`); continue; }

      const level = result.confidence < 0.7 ? '???' : result.level;
      const flag = level === '???' ? ' [UNCERTAIN]' : '';
      console.log(`  FEE-${result.id}: ${level} (conf: ${result.confidence})${flag} — ${result.reason}`);

      if (level === '???') {
        uncertainArticles.push({ id: result.id, title: article.title, category, reason: result.reason, confidence: result.confidence });
      }

      if (!DRY_RUN) {
        patchLevel(article.filePath, level);
        try { patchLevel(getZhTwPath(article.filePath), level); } catch (e) {
          console.warn(`  Warning: zh-TW patch failed for FEE-${result.id}: ${e.message}`);
        }
      }
    }
  }

  // Write report for uncertain articles
  if (!DRY_RUN && uncertainArticles.length > 0) {
    const lines = [
      '# Level Classification Report — Needs Manual Review',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `${uncertainArticles.length} articles assigned \`level: "???"\` due to confidence < 0.7:`,
      '',
    ];
    for (const a of uncertainArticles) {
      lines.push(`## FEE-${a.id}: ${a.title}`);
      lines.push(`- **Category:** ${a.category}`);
      lines.push(`- **Confidence:** ${a.confidence}`);
      lines.push(`- **Reason:** ${a.reason}`);
      lines.push('');
    }
    const reportPath = path.join(ROOT, 'scripts', 'classify-report.md');
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
    console.log(`\nReport written to scripts/classify-report.md`);
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Verify dry-run works**

```bash
node scripts/classify-levels.js --dry-run
```
Expected output (values will vary by article count):
```
Skipped: 22  |  Hardcoded senior: 15  |  To classify: 180 in 18 categories

Classifying "HTML and Semantic Markup" (9 articles)...
  [DRY RUN] Would call API for 9 articles
  FEE-101: entry (conf: 0.5) — dry run placeholder
  ...

Done.
```
No files should be modified. No API calls are made.

- [ ] **Step 5: Verify dry-run for a single category**

```bash
node scripts/classify-levels.js --dry-run --category "JavaScript Core and Runtime"
```
Expected: only the JavaScript Core and Runtime category prints its articles. All other categories are skipped.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/classify-levels.js
git commit -m "feat(scripts): add classify-levels.js for one-shot audience level assignment"
```

---

### Task 4: Run classification and commit results

> **Prerequisites:** `ANTHROPIC_API_KEY` must be set in your environment. This task makes real API calls (~18 category requests using claude-opus-4-6). Estimated cost: <$1 USD.

- [ ] **Step 1: Test a single category before full run**

```bash
ANTHROPIC_API_KEY=<your-key> node scripts/classify-levels.js --category "HTML and Semantic Markup"
```
Expected: ~9 articles classified with `level` printed per article. Check one of the patched files to confirm frontmatter was updated correctly:
```bash
head -8 "docs/en/HTML and Semantic Markup/101.md"
```
Expected: frontmatter now includes a `level:` line. Check the zh-TW counterpart:
```bash
head -8 "docs/zh-tw/HTML and Semantic Markup/101.md"
```
Expected: same `level:` value as EN.

- [ ] **Step 2: Run full classification**

```bash
ANTHROPIC_API_KEY=<your-key> node scripts/classify-levels.js
```
Expected: all 18+ categories processed. Console shows per-article classification with confidence. Any articles with confidence < 0.7 are flagged `[UNCERTAIN]` and written to `scripts/classify-report.md`.

- [ ] **Step 3: Review uncertain articles**

```bash
cat scripts/classify-report.md
```
For each `???` article listed, manually assign the correct level by editing its frontmatter directly:
```bash
# Example: set FEE-303 to mid
sed -i '' 's/^level: "???"$/level: mid/' "docs/en/JavaScript Core and Runtime/303.md"
sed -i '' 's/^level: "???"$/level: mid/' "docs/zh-tw/JavaScript Core and Runtime/303.md"
```
Repeat for each uncertain article. When all are resolved, the `???` badges will no longer appear in the build.

- [ ] **Step 4: Verify build passes with level fields**

```bash
pnpm docs:build
```
Expected: build completes without errors.

- [ ] **Step 5: Spot-check badge rendering**

```bash
pnpm docs:dev
```
Open a few articles in the browser (e.g., `http://localhost:5173/frontend-engineering-essentials/JavaScript-Core-and-Runtime/301`). Confirm:
- An entry/mid/senior badge appears before the article `h1`
- Category overview pages (e.g., `http://localhost:5173/frontend-engineering-essentials/JavaScript-Core-and-Runtime/300`) show no badge
- Stop the dev server with Ctrl+C.

- [ ] **Step 6: Commit all frontmatter changes and report**

```bash
git add docs/en docs/zh-tw scripts/classify-report.md
git commit -m "feat(content): assign audience level frontmatter to all FEE articles"
```
