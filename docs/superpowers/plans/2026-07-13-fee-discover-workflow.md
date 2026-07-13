# /fee-discover Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/fee-discover` command: a manually-triggered multi-agent workflow that sweeps external sources, ranks candidate topics, and drafts verified new FEE articles (EN + zh-TW) committed directly to `main`.

**Architecture:** A project skill (`.claude/skills/fee-discover/SKILL.md`) wraps a Workflow script (`.claude/workflows/fee-discover.js`). The script fans out scouts over three source groups, classifies candidates against the existing corpus, ranks them, and produces articles via research → write → verify → translate pipelines. The skill wrapper handles everything deterministic: loading state into `args`, the `pnpm docs:build` gate, `list.md` index lines, state-file updates, the run report, and commits. Committed state lives in `docs/superpowers/harness/`.

**Tech Stack:** Claude Code Workflow tool (plain-JS orchestration script), project skill (SKILL.md), JSON/YAML state files. No new npm dependencies.

**Scope note:** The approved spec (`docs/superpowers/specs/2026-07-13-fee-harness-workflow-design.md`) covers two commands. This plan implements **only `/fee-discover`**; `/fee-harden` is deferred until the owner walks through one article's hardening jointly. `audit-ledger.json` is still initialized here (empty) because discover runs record entries for articles they create.

## Global Constraints

- Commit messages: no emojis, no AI/Claude attribution, follow existing style (`docs(<category>): ...`, `docs(list): ...`, `chore(...): ...`).
- Content is vendor-neutral: no company-specific references, internal URLs, or product names.
- New articles follow the canonical FEE template in `CLAUDE.md` exactly (frontmatter `id`, `title`, `state: draft`, `slug`; section order; topic-specific section REQUIRED; References with 3+ verified URLs).
- Vue template safety rules from `CLAUDE.md` (no `{{ }}` in backtick code spans; `<code v-pre>` + HTML entities where needed).
- Every EN file has a zh-TW counterpart at the mirrored path with translated section headings per the CLAUDE.md header map.
- New article filenames use the kebab slug (e.g. `interaction-state-rosetta.md`), matching post-slug-era convention.
- Discovery sources are limited to: platform-official, OSS codebases, curated digests. No framework/tool changelogs.
- All paths in prompts and scripts are relative to the repo root.

---

### Task 1: Initialize harness state files

**Files:**
- Create: `docs/superpowers/harness/sources.yaml`
- Create: `docs/superpowers/harness/discovery-log.json`
- Create: `docs/superpowers/harness/audit-ledger.json`
- Create: `docs/superpowers/harness/reports/.gitkeep`

**Interfaces:**
- Produces: `sources.yaml` with top-level keys `platform`, `codebases`, `digests` (consumed by Task 3's wrapper, passed into the workflow as `args.sources`). `discovery-log.json` shape `{"topics": [...]}` where each topic is `{"title", "disposition", "reason", "feeId", "date"}` (`feeId` null unless accepted). `audit-ledger.json` shape `{}` (path-keyed map, entries added per produced article).

- [ ] **Step 1: Create `docs/superpowers/harness/sources.yaml`**

```yaml
# Tiered source registry for /fee-discover scouts.
# Edit freely; scouts read whatever is listed here on each run.

platform: # tier 1-2: specs, proposals, platform release notes
  - name: Chrome Release Notes
    url: https://developer.chrome.com/release-notes
  - name: Chrome Platform Status (roadmap)
    url: https://chromestatus.com/roadmap
  - name: WebKit Blog
    url: https://webkit.org/blog/
  - name: Firefox Release Notes for Developers
    url: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases
  - name: web.dev Blog
    url: https://web.dev/blog
  - name: TC39 Proposals
    url: https://github.com/tc39/proposals
  - name: WHATWG Blog
    url: https://blog.whatwg.org/
  - name: CSSWG Drafts (recent activity)
    url: https://github.com/w3c/csswg-drafts
  - name: Baseline / web-features
    url: https://github.com/web-platform-dx/web-features
  - name: Interop dashboard
    url: https://wpt.fyi/interop-2026

codebases: # candidates for the Codebase Studies category (FEE-18xx)
  - name: three.js
    url: https://github.com/mrdoob/three.js
    status: covered # FEE-1801, FEE-1810
  - name: esbuild
    url: https://github.com/evanw/esbuild
    status: covered # FEE-1802
  - name: TanStack Query
    url: https://github.com/TanStack/query
    status: covered # FEE-1803
  - name: Vite
    url: https://github.com/vitejs/vite
    status: candidate
  - name: Zod
    url: https://github.com/colinhacks/zod
    status: candidate
  - name: Yjs
    url: https://github.com/yjs/yjs
    status: candidate
  - name: Preact Signals
    url: https://github.com/preactjs/signals
    status: candidate
  - name: Vitest
    url: https://github.com/vitest-dev/vitest
    status: candidate
  - name: Playwright
    url: https://github.com/microsoft/playwright
    status: candidate

digests: # tier 3: curated aggregation archives
  - name: JavaScript Weekly
    url: https://javascriptweekly.com/issues
  - name: Frontend Focus
    url: https://frontendfoc.us/issues
  - name: CSS Weekly
    url: https://css-weekly.com/archives/
```

- [ ] **Step 2: Create `docs/superpowers/harness/discovery-log.json`**

```json
{
  "topics": []
}
```

- [ ] **Step 3: Create `docs/superpowers/harness/audit-ledger.json`**

```json
{}
```

- [ ] **Step 4: Create `docs/superpowers/harness/reports/.gitkeep`** (empty file)

- [ ] **Step 5: Verify all three data files parse**

Run:
```bash
node -e "
const fs = require('fs');
const matter = require('gray-matter');
JSON.parse(fs.readFileSync('docs/superpowers/harness/discovery-log.json', 'utf8'));
JSON.parse(fs.readFileSync('docs/superpowers/harness/audit-ledger.json', 'utf8'));
const y = matter('---\n' + fs.readFileSync('docs/superpowers/harness/sources.yaml', 'utf8') + '\n---').data;
if (!y.platform || !y.codebases || !y.digests) throw new Error('missing source group');
console.log('OK', y.platform.length, y.codebases.length, y.digests.length);
"
```
Expected: `OK 10 9 3`

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/harness
git commit -m "chore(harness): initialize discovery state files and source registry"
```

---

### Task 2: Workflow script `.claude/workflows/fee-discover.js`

**Files:**
- Create: `.claude/workflows/fee-discover.js`

**Interfaces:**
- Consumes: `args = { maxTopics: number, sources: <parsed sources.yaml>, discoveryLog: <parsed discovery-log.json>, today: "YYYY-MM-DD" }` (passed by Task 3's wrapper; `today` passed in because workflow scripts cannot call `new Date()`).
- Produces (return value, consumed by the wrapper):

```json
{
  "produced": [{ "feeId": 1311, "kind": "new-article", "title": "...", "category": "<exact docs/en dir name>", "slug": "...", "enPath": "docs/en/.../slug.md", "zhPath": "docs/zh-tw/.../slug.md", "verifierNotes": "..." }],
  "dispositions": [{ "title": "...", "disposition": "accepted|deferred|rejected", "reason": "...", "feeId": null }],
  "uncovered": ["digests"]
}
```

- [ ] **Step 1: Write the script**

```js
export const meta = {
  name: 'fee-discover',
  description: 'Sweep external sources, rank candidate topics, draft verified new FEE articles',
  phases: [
    { title: 'Sweep', detail: 'corpus inventory + one scout per source group' },
    { title: 'Classify', detail: 'dedup and gap-match candidates against corpus' },
    { title: 'Rank', detail: 'score candidates and select top N' },
    { title: 'Produce', detail: 'research, write, verify, translate per topic' },
  ],
}

const maxTopics = (args && args.maxTopics) || 4
const sources = args.sources
const knownTopics = (args.discoveryLog.topics || [])
  .map(t => `- ${t.title} (${t.disposition})`)
  .join('\n') || '(none yet)'

const CORPUS_SCHEMA = {
  type: 'object',
  required: ['categories'],
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'dir', 'maxId'],
        properties: {
          name: { type: 'string', description: 'exact directory name under docs/en/' },
          dir: { type: 'string', description: 'path relative to repo root, e.g. docs/en/Security' },
          maxId: { type: 'number', description: 'highest frontmatter id among .md files in this dir' },
        },
      },
    },
  },
}

const CANDIDATES_SCHEMA = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'sourceUrls', 'rationale', 'suggestedCategory'],
        properties: {
          title: { type: 'string' },
          sourceUrls: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
          suggestedCategory: { type: 'string', description: 'exact directory name under docs/en/' },
        },
      },
    },
  },
}

const CLASSIFIED_SCHEMA = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'sourceUrls', 'category', 'kind', 'reason'],
        properties: {
          title: { type: 'string' },
          sourceUrls: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          kind: { type: 'string', enum: ['new-article', 'append', 'skip'] },
          targetArticle: { type: 'string', description: 'for kind=append: repo-relative EN path of the article to extend' },
          reason: { type: 'string' },
        },
      },
    },
  },
}

const RANKED_SCHEMA = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'sourceUrls', 'category', 'kind', 'disposition', 'reason', 'slug'],
        properties: {
          title: { type: 'string' },
          sourceUrls: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          kind: { type: 'string', enum: ['new-article', 'append'] },
          targetArticle: { type: 'string' },
          disposition: { type: 'string', enum: ['accepted', 'deferred', 'rejected'] },
          reason: { type: 'string' },
          slug: { type: 'string', description: 'kebab-case slug; empty string for kind=append' },
        },
      },
    },
  },
}

const FACTS_SCHEMA = {
  type: 'object',
  required: ['summary', 'facts', 'references'],
  properties: {
    summary: { type: 'string' },
    facts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'sourceUrl'],
        properties: { claim: { type: 'string' }, sourceUrl: { type: 'string' } },
      },
    },
    references: {
      type: 'array',
      items: {
        type: 'object',
        required: ['url', 'title', 'venue', 'year'],
        properties: {
          url: { type: 'string' }, title: { type: 'string' },
          author: { type: 'string' }, venue: { type: 'string' }, year: { type: 'string' },
        },
      },
    },
  },
}

const WRITE_SCHEMA = {
  type: 'object',
  required: ['enPath'],
  properties: { enPath: { type: 'string' }, notes: { type: 'string' } },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['verdict', 'notes'],
  properties: {
    verdict: { type: 'string', enum: ['clean', 'fixed', 'failed'] },
    notes: { type: 'string', description: 'what was checked, what was corrected, anything unresolved' },
  },
}

const TRANSLATE_SCHEMA = {
  type: 'object',
  required: ['zhPath'],
  properties: { zhPath: { type: 'string' } },
}

const CONVENTIONS = `
Repo conventions (all paths relative to the repo root):
- Read CLAUDE.md first: it contains the canonical FEE article template, the
  zh-TW section-header map, Vue template safety rules, and content-neutrality rules.
- Read docs/en/Design Systems and UI Libraries/interaction-state-rosetta.md
  as the reference example of a finished post-slug-era article.
- New EN articles go to docs/en/<Category>/<slug>.md with frontmatter
  id/title/state: draft/slug. zh-TW mirror at docs/zh-tw/<Category>/<slug>.md.
- Vendor-neutral: no company-specific references or product pitches.
- References section: 3+ real URLs you actually fetched, format
  '- <Author>, "<Title>," <Venue> (<year>). <URL>'.
`

function scoutPrompt(group, entries) {
  const list = entries
    .map(e => `- ${e.name}: ${e.url}${e.status ? ` [${e.status}]` : ''}`)
    .join('\n')
  return `You are a topic scout for the Frontend Engineering Essentials (FEE)
documentation corpus. Source group: "${group}".

Sources to sweep (use WebFetch/WebSearch; skip entries marked [covered]):
${list}

Read docs/en/list.md to see the ~280 existing article titles.
Topics already proposed in past runs (do NOT re-propose):
${knownTopics}

Find up to 6 candidate topics that would make durable, teachable FEE
articles (evergreen mechanics over news; must have primary sources).
For group "codebases", a candidate is an architecture/pattern tour of one
[candidate] repo, suited to the Codebase Studies category.
For suggestedCategory use the EXACT directory name under docs/en/.
Return only genuinely new material not covered by an existing article title.`
}

phase('Sweep')
const groups = ['platform', 'codebases', 'digests']
const sweep = await parallel([
  () => agent(
    `For each category directory under docs/en/ in this repo (skip list.md,
faq.md, index.md), report: name (exact dir name), dir (repo-relative path),
maxId (the highest numeric "id" frontmatter value among its .md files).
Use Glob/Grep/Read. Be exact — these ids seed new article numbering.`,
    { label: 'corpus', schema: CORPUS_SCHEMA }
  ),
  ...groups.map(g => () =>
    agent(scoutPrompt(g, sources[g] || []), { label: `scout:${g}`, schema: CANDIDATES_SCHEMA })
  ),
])
const corpus = sweep[0]
if (!corpus) throw new Error('corpus inventory agent failed; aborting run')
const uncovered = groups.filter((g, i) => !sweep[i + 1])
uncovered.forEach(g => log(`scout group "${g}" returned nothing — not covered this run`))
const candidates = sweep.slice(1).filter(Boolean).flatMap(r => r.candidates)
log(`${candidates.length} raw candidates from ${3 - uncovered.length}/3 scout groups`)
if (candidates.length === 0) {
  return { produced: [], dispositions: [], uncovered }
}

phase('Classify')
const classified = await agent(
  `Classify each candidate topic against the existing FEE corpus.
Read docs/en/list.md (full inventory) and spot-check any article whose title
looks close to a candidate. For each candidate decide:
- "new-article": genuinely uncovered, deserves its own article
- "append": materially updates ONE existing article (set targetArticle to its
  repo-relative EN path) — e.g. a spec change worth a Changelog entry or new section
- "skip": already covered or too thin/newsy to teach
Keep category as an EXACT directory name under docs/en/ (fix wrong guesses).

Candidates:
${JSON.stringify(candidates, null, 2)}`,
  { label: 'classify', schema: CLASSIFIED_SCHEMA }
)
const viable = classified.candidates.filter(c => c.kind !== 'skip')
const skipped = classified.candidates.filter(c => c.kind === 'skip')
log(`${viable.length} viable after classify (${skipped.length} skipped)`)

phase('Rank')
let accepted = []
let dispositions = skipped.map(c => ({
  title: c.title, disposition: 'rejected', reason: c.reason, feeId: null,
}))
if (viable.length > 0) {
  const ranked = await agent(
    `Rank these FEE article candidates. Score each on: source tier (specs and
platform-official beat aggregators), category fit, durability (evergreen
mechanics over release news), and teachability (has a core mechanic you can
visualize and demonstrate with real code). Mark the best ${maxTopics} at most
as "accepted"; mark near-misses "deferred" and poor fits "rejected", each
with a concrete reason. Give every candidate a kebab-case slug (empty string
for kind=append). Preserve kind, category, sourceUrls, targetArticle as given.

Candidates:
${JSON.stringify(viable, null, 2)}`,
    { label: 'rank', schema: RANKED_SCHEMA }
  )
  accepted = ranked.candidates.filter(c => c.disposition === 'accepted').slice(0, maxTopics)
  dispositions = dispositions.concat(
    ranked.candidates
      .filter(c => c.disposition !== 'accepted')
      .map(c => ({ title: c.title, disposition: c.disposition, reason: c.reason, feeId: null }))
  )
}
log(`${accepted.length} topics accepted for production`)

const nextId = {}
for (const cat of corpus.categories) nextId[cat.name] = cat.maxId + 1
const dirByName = {}
for (const cat of corpus.categories) dirByName[cat.name] = cat.dir
for (const t of accepted) {
  if (t.kind === 'new-article') {
    if (nextId[t.category] === undefined) {
      log(`no id range for category "${t.category}" — dropping "${t.title}"`)
      t.dropped = true
      dispositions.push({ title: t.title, disposition: 'deferred', reason: `unknown category ${t.category}`, feeId: null })
    } else {
      t.feeId = nextId[t.category]++
      t.dir = dirByName[t.category]
    }
  }
}
const toProduce = accepted.filter(t => !t.dropped)

phase('Produce')
const produced = await pipeline(
  toProduce,
  t => agent(
    `Research the topic "${t.title}" for a FEE article. Deep-read these
sources with WebFetch (follow links to primary specs/docs where relevant):
${t.sourceUrls.join('\n')}
Return a fact sheet: every load-bearing claim paired with the URL that
supports it, plus a references list of the sources you actually read.
Only include claims you verified in a fetched source.`,
    { label: `research:${t.slug || t.title.slice(0, 30)}`, phase: 'Produce', schema: FACTS_SCHEMA }
  ),
  (facts, t) => {
    if (!facts) return null
    const target = t.kind === 'new-article'
      ? `Write a NEW article at "${t.dir}/${t.slug}.md" with frontmatter
id: ${t.feeId}, title, state: draft, slug: ${t.slug}, and H1 "# [FEE-${t.feeId}] <title>".
Follow the canonical template in CLAUDE.md (every section, including the
REQUIRED topic-specific section with a topic-named heading).`
      : `EXTEND the existing article ${t.targetArticle}: add the new material
as a new section or Changelog entry per the canonical template in CLAUDE.md.
Do not rewrite unrelated sections.`
    return agent(
      `${CONVENTIONS}
${target}

Topic: ${t.title}
Base every claim on this verified fact sheet (do not add claims beyond it):
${JSON.stringify(facts, null, 2)}

Write the EN file now with the Write/Edit tool. Real code in Example, no
pseudocode. References come from the fact sheet's references list.`,
      { label: `write:${t.slug || 'append'}`, phase: 'Produce', schema: WRITE_SCHEMA }
    ).then(w => (w ? { facts, enPath: w.enPath } : null))
  },
  (prev, t) => {
    if (!prev) return null
    return agent(
      `Adversarially fact-check the article file ${prev.enPath} (only the newly
added content for an append). For each factual claim, verify it against the
fact sheet below; re-fetch the cited URL when in doubt. FIX factual errors
directly in the file with Edit. Also check CLAUDE.md Vue template safety
rules and template compliance; fix violations. Verdict "failed" only if the
article's core premise is unsupported by sources.

Fact sheet:
${JSON.stringify(prev.facts, null, 2)}`,
      { label: `verify:${t.slug || 'append'}`, phase: 'Produce', schema: VERIFY_SCHEMA }
    ).then(v => (v && v.verdict !== 'failed' ? { ...prev, verifierNotes: v.notes } : null))
  },
  (prev, t) => {
    if (!prev) return null
    const zhTarget = t.kind === 'new-article'
      ? `Create the zh-TW mirror at the same path with docs/en/ replaced by docs/zh-tw/.`
      : `Mirror the newly added EN section into the zh-TW counterpart of ${t.targetArticle} (same path under docs/zh-tw/).`
    return agent(
      `${CONVENTIONS}
Translate the EN content of ${prev.enPath} into Traditional Chinese (zh-TW).
${zhTarget}
Use the zh-TW section-header map in CLAUDE.md. Keep code blocks, URLs, and
technical identifiers untranslated. Translate the topic-specific section
heading naturally. Keep frontmatter ids/slug identical; translate title.
Write the file with the Write tool.`,
      { label: `translate:${t.slug || 'append'}`, phase: 'Produce', schema: TRANSLATE_SCHEMA }
    ).then(z => (z ? { ...prev, zhPath: z.zhPath } : null))
  }
)

const results = []
toProduce.forEach((t, i) => {
  const r = produced[i]
  if (r) {
    results.push({
      feeId: t.feeId || null, kind: t.kind, title: t.title, category: t.category,
      slug: t.slug || null, targetArticle: t.targetArticle || null,
      enPath: r.enPath, zhPath: r.zhPath, verifierNotes: r.verifierNotes,
    })
    dispositions.push({ title: t.title, disposition: 'accepted', reason: t.reason, feeId: t.feeId || null })
  } else {
    log(`production failed for "${t.title}" — deferred`)
    dispositions.push({ title: t.title, disposition: 'deferred', reason: 'production pipeline failed this run', feeId: null })
  }
})

return { produced: results, dispositions, uncovered }
```

- [ ] **Step 2: Syntax-check the script**

The Workflow runtime executes the script body as top-level statements inside
an async function, so the file legitimately contains top-level `return` —
which plain `node --check` rejects in both module and CommonJS goals.
Compile (without executing) a check-time copy wrapped the same way the
runtime wraps it:

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('.claude/workflows/fee-discover.js', 'utf8').replace(/^export /gm, '');
new (require('vm').Script)('(async () => {' + src + '})()');
console.log('SYNTAX_OK');
"
```
Expected: `SYNTAX_OK` (undefined globals like `agent`/`args` are fine — `vm.Script` only compiles).

- [ ] **Step 3: Commit**

```bash
git add .claude/workflows/fee-discover.js
git commit -m "chore(harness): add fee-discover workflow script"
```

---

### Task 3: Skill wrapper `.claude/skills/fee-discover/SKILL.md`

**Files:**
- Create: `.claude/skills/fee-discover/SKILL.md`

**Interfaces:**
- Consumes: the workflow script's return value (Task 2 `Produces` shape); state files from Task 1.
- Produces: the `/fee-discover` command available in this project.

- [ ] **Step 1: Write the skill**

````markdown
---
name: fee-discover
description: Use when the user runs /fee-discover or asks to sweep external sources for new FEE material. Orchestrates the fee-discover workflow, lands produced articles, updates harness state, writes the run report, and commits to main.
---

# /fee-discover — Discover and Draft New FEE Material

Manually triggered. Sweeps the source registry, drafts up to N new
articles (EN + zh-TW), commits directly to main with a run report.

Argument: optional max accepted topics (default 4). `/fee-discover 2`.

## Steps

### 1. Load state

- Read `docs/superpowers/harness/sources.yaml` and parse it (YAML).
- Read `docs/superpowers/harness/discovery-log.json` and parse it.
- Determine today's date as YYYY-MM-DD.
- Confirm `git status` is clean enough that new docs commits won't tangle
  with unrelated changes; if the working tree has unrelated staged changes, stop and ask.

### 2. Run the workflow

Invoke the Workflow tool:

- `scriptPath`: `.claude/workflows/fee-discover.js`
- `args`: `{ "maxTopics": <N>, "sources": <parsed sources.yaml>, "discoveryLog": <parsed discovery-log.json>, "today": "<YYYY-MM-DD>" }`

Wait for completion. The return value contains `produced`, `dispositions`,
`uncovered`. If `produced` is empty, skip to step 6 (still log dispositions
and write a report).

### 3. Index lines (list.md)

For each `produced` entry with `kind: new-article`:

- In `docs/en/list.md`, insert `- [<feeId>.<EN title>](<slug>)` in ascending
  id order within the article's category block (match surrounding format exactly).
- In `docs/zh-tw/list.md`, insert the same line with the zh-TW title from
  the zh-TW file's frontmatter.

`kind: append` entries do not change list.md.

### 4. Build gate

Run `pnpm docs:build`. It MUST pass.

- On failure: identify the offending file from the error, fix trivial
  violations (Vue template safety, broken link) yourself; if the file is
  unsalvageable, `git checkout --` / delete that article's EN+zh-TW files and
  its list.md lines, mark it deferred in dispositions with the reason, and
  re-run the build until green.

### 5. Sanity review

For each produced article, read the EN file once end-to-end and check: the
References URLs appear genuinely used (not decorative), the topic-specific
section exists, frontmatter matches conventions, and the zh-TW mirror exists
with parallel sections. Fix small issues directly; anything structural sends
the article to the same revert-and-defer path as step 4.

### 6. Update harness state

- Append every entry in `dispositions` to `discovery-log.json` `topics`,
  adding `"date": "<today>"`.
- For each produced article, upsert into `audit-ledger.json`:
  `{"<enPath>": {"id": <feeId or target id>, "lastAudited": "<today>", "findings": {"factual": 0, "depth": 0, "template": 0}, "notes": "written+verified by fee-discover run"}}`
- Write `docs/superpowers/harness/reports/<today>-discover.md`:

```markdown
# Discover Run — <today>

## Produced
- FEE-<id> <title> (<category>) — <enPath> / <zhPath>. Verifier: <verifierNotes>

## Deferred / Rejected
- <title> — <disposition>: <reason>

## Coverage gaps
- <uncovered scout groups, or "none">
```

### 7. Commit

In this order, matching repo conventions (no emojis, no AI attribution):

1. Per new article: `git add <enPath> <zhPath>` then
   `docs(<category kebab, e.g. progressive-web-apps>): add <Title> (FEE-<id>)`
   (match category token style from `git log` for that directory).
   Per append: `docs(<category>): extend FEE-<target id> with <topic>`.
2. If list.md changed: `docs(list): regenerate sidebar for FEE-<ids>`.
3. Harness state + report: `chore(harness): record discover run <today>`.

### 8. Report to user

Summarize: produced articles (id, title, links to files), deferred/rejected
with reasons, uncovered groups, and the report path. Do not push.
````

- [ ] **Step 2: Verify skill registration**

Run: `ls .claude/skills/fee-discover/SKILL.md` and confirm frontmatter has `name` and `description` (skills load per-session; a new session or /fee-discover invocation will pick it up).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/fee-discover/SKILL.md
git commit -m "chore(harness): add /fee-discover command wrapper"
```

---

### Task 4: Smoke run and owner review

**Files:**
- Modify: (produced by the run) new article files, `docs/en/list.md`, `docs/zh-tw/list.md`, harness state files.

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Run `/fee-discover 1`** (one topic max — cheapest full-path exercise).

- [ ] **Step 2: Verify the run's artifacts**

- The produced article exists in both languages, follows the template, References resolve (spot-fetch 2 URLs).
- `pnpm docs:build` passes.
- `discovery-log.json` gained entries for every candidate disposition; `audit-ledger.json` has the new article; the report file exists.
- Commits follow conventions (`git log --oneline -5`).

- [ ] **Step 3: Owner reviews the produced article and report**

Present the article and report to the owner. Adjust prompts in
`.claude/workflows/fee-discover.js` based on feedback (topic quality, depth,
tone) before any larger runs.
