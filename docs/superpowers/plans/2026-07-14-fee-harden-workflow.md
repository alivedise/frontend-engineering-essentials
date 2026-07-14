# /fee-harden Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/fee-harden` command: a manually-triggered multi-agent workflow that audits existing FEE articles reader-first across four calibrated lenses, revises them, adversarially verifies every revision with a separate agent, syncs zh-TW mirrors, and commits to `main` with a run report.

**Architecture:** Mirrors `/fee-discover`: a project skill (`.claude/skills/fee-harden/SKILL.md`) wraps a Workflow script (`.claude/workflows/fee-harden.js`). The wrapper does everything deterministic (batch selection from `audit-ledger.json`, the `pnpm docs:build` gate, revert of failed articles, ledger updates, report, commits). The script runs a per-article pipeline with no cross-article barriers: Audit (reader-first, four lenses) → Revise (separate agent) → Verify (adversarial, separate context, max 2 rounds with one fix pass) → Sync (zh-TW mirror). Reviser and verifier separation is a spec MUST, calibrated on FEE-703.

**Tech Stack:** Claude Code Workflow tool (plain-JS orchestration), project skill, existing `docs/superpowers/harness/audit-ledger.json`. No new dependencies.

**Plan deviations from spec (with reason):** default batch size is 5, not the spec's 10 — the FEE-703 calibration measured roughly 300-400k subagent tokens per article through the full audit→revise→verify×2→sync loop, so 10 articles per run front-loads too much cost before the owner has seen automated output. The spec's per-category grouped commits are kept.

## Global Constraints

- Commit messages: no emojis, no AI/Claude attribution; harden commits follow `docs(<category-kebab>): harden FEE-<ids> (<lens summary>)`, e.g. `docs(rendering-performance): harden FEE-703 hydration facts, tone, and reader gaps`.
- Lens priority (binding, from the calibrated spec): tone > organization/reader-model > references-mining > factual/staleness; template compliance is a mechanical checklist, not a lens.
- Reviser and verifier MUST be different agents with separate contexts; every revision (not only factual) is verified.
- Tone fixes replace AI patterns with one concrete example or a plain statement — never a reworded version of the same pattern. Named patterns: negation tricolons, "not X but Y" constructions, em-dash appositive chains, paragraph-final summary flourishes.
- Both languages are audited and revised; zh-TW mirrors the final EN state using the CLAUDE.md section-header map.
- Scope discipline: agents touch only the article files assigned to them; index/list files and neighboring articles are off-limits (a fee-discover run showed agents will otherwise "helpfully" edit list.md).
- `pnpm docs:build` MUST pass before any commit; a failing article pair is reverted (`git checkout -- <paths>`) and recorded as `reverted` in the ledger notes, never committed broken.
- All paths relative to the repo root. Workflow args may arrive as a JSON string — parse defensively (same guard as fee-discover.js).
- Workflow scripts cannot call `Date.now()`/`new Date()`; the wrapper supplies dates.

---

### Task 1: Workflow script `.claude/workflows/fee-harden.js`

**Files:**
- Create: `.claude/workflows/fee-harden.js`

**Interfaces:**
- Consumes: `args = { batch: [{ enPath, zhPath, id }] }` (wrapper-selected; `id` is the FEE id number or null).
- Produces (return value):

```json
{
  "results": [{
    "enPath": "docs/en/.../x.md", "zhPath": "docs/zh-tw/.../x.md", "id": 607,
    "status": "revised | clean | reverted | failed",
    "findings": { "tone": 2, "organization": 1, "references": 0, "factual": 3, "template": 1 },
    "notes": "one-paragraph audit+verify summary"
  }]
}
```
- `status` semantics: `clean` = audit found nothing actionable, no edits; `revised` = edits applied and verify passed; `reverted` = verify still unclean after the fix round, wrapper must `git checkout --` the EN file; `failed` = an agent died mid-pipeline, wrapper must check `git status` for partial edits and revert if dirty.

- [ ] **Step 1: Write the script**

```js
export const meta = {
  name: 'fee-harden',
  description: 'Reader-first audit, revise, adversarially verify, and zh-sync existing FEE articles',
  phases: [
    { title: 'Audit', detail: 'reader-first four-lens audit per article' },
    { title: 'Revise', detail: 'apply findings, lens-priority order' },
    { title: 'Verify', detail: 'independent adversarial verification, max 2 rounds' },
    { title: 'Sync', detail: 'mirror final EN state to zh-TW' },
  ],
}

// args may arrive as a JSON string depending on the invoking harness
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
const batch = input.batch || []
if (!batch.length) return { results: [] }

const AUDIT_SCHEMA = {
  type: 'object',
  required: ['findings', 'summary'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['lens', 'severity', 'location', 'statement', 'suggestedFix'],
        properties: {
          lens: { type: 'string', enum: ['tone', 'organization', 'references', 'factual', 'template'] },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          location: { type: 'string', description: 'file:line or section name' },
          statement: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
    summary: { type: 'string', description: 'reader verdict: would you trust this article? what does it do well?' },
  },
}

const REVISE_SCHEMA = {
  type: 'object',
  required: ['changed', 'editsSummary'],
  properties: {
    changed: { type: 'boolean' },
    editsSummary: { type: 'string' },
    declined: { type: 'string', description: 'findings you chose not to apply, with reasons' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['verdict', 'notes'],
  properties: {
    verdict: { type: 'string', enum: ['clean', 'issues'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['statement', 'location', 'fix'],
        properties: {
          statement: { type: 'string' }, location: { type: 'string' }, fix: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
  },
}

const FIX_SCHEMA = {
  type: 'object',
  required: ['applied'],
  properties: { applied: { type: 'string', description: 'what was fixed' } },
}

const SYNC_SCHEMA = {
  type: 'object',
  required: ['zhPath', 'passagesUpdated'],
  properties: { zhPath: { type: 'string' }, passagesUpdated: { type: 'number' } },
}

const TONE_BLACKLIST = `
Named AI-tone patterns to hunt (both languages):
- Negation tricolon: "buttons do not respond, forms do not validate, dynamic
  components do not update" / 「按鈕不會回應點擊、表單不會驗證、動態元件不會更新」
- "not X but Y" contrast framing: "The question is not whether to hydrate, but..."
- Em-dash appositive chains stacking three-plus glosses in one sentence
- Paragraph-final summary flourishes that restate the paragraph
Fix rule: replace the pattern with ONE concrete example or a plain statement.
Rewording the pattern into a fresh tricolon or contrast is a failed fix.`

const SCOPE_RULE = `
Scope discipline (hard rule): edit ONLY the file(s) named in this prompt.
Do not touch docs/en/list.md, docs/zh-tw/list.md, other articles, configs,
or anything else, even if you notice problems there — report them in your
notes instead.`

function auditPrompt(a) {
  return `You are auditing one documentation article, reader-first. Article:
${a.enPath} (EN) and its mirror ${a.zhPath} (zh-TW). Read CLAUDE.md first for
the canonical template and conventions.

Step 1 — READ AS A READER. Read the EN article start to finish once, as a
senior frontend engineer trying to learn from it. Record where you stumble,
every term used before it is introduced, and every question the text provokes
but does not answer. Skim the zh-TW mirror for parity and translated-AI-tone.

Step 2 — VERIFY. Go back and check load-bearing claims against the article's
own References plus official docs (WebFetch/WebSearch). Flag claims the cited
sources contradict, stale version claims (today's world, not the world at
writing time), and dead URLs. Check whether cited sources contain concepts
the body should absorb, and whether references use terms the body never defines.

Report findings in these lenses, priority order: tone (highest), organization
(dependency check / provoked-question check / framework neutrality),
references (mining + terminology alignment), factual, template (mechanical
checklist: section order vs CLAUDE.md, frontmatter, Vue template safety).
${TONE_BLACKLIST}
Read-only: do NOT edit any file. Severity: blocker = misleads the reader on
the article's core promise; major = a reader acting on it gets burned; minor
= polish.`
}

function revisePrompt(a, audit) {
  return `You are revising the article ${a.enPath} (EN ONLY — the zh-TW mirror
is synced by a later agent). Read CLAUDE.md first. Apply the audit findings
below in lens-priority order: tone, organization, references, factual,
template. Preserve what the audit praised; do not rewrite untouched sections.
${TONE_BLACKLIST}
${SCOPE_RULE}
For organization findings, answer the reader's provoked questions in place
(add the missing paragraph or gloss); introduce every proper noun at first
substantive use. For factual findings, base corrections only on the sources
the audit cites — do not add new unsourced claims. You may decline a finding
you believe is wrong; record it in "declined" with a reason.

Audit findings:
${JSON.stringify(audit.findings, null, 2)}

Audit reader summary (what to preserve):
${audit.summary}

Edit the file now with Edit/Write.`
}

function verifyPrompt(a) {
  return `You are an adversarial verifier with no stake in the revision. The
article ${a.enPath} was just revised by another agent (its uncommitted diff:
run \`git diff -- "${a.enPath}"\`). Your job is to REFUTE the revision:
assume every ADDED claim is wrong until a primary source proves otherwise
(WebFetch/WebSearch official docs — never blogs echoing each other), and
check whether the edits introduced NEW tone violations or reader-model
regressions (a term now used before introduction, a new unanswered question).
${TONE_BLACKLIST}
Also check internal consistency: does any unedited sentence now contradict an
edited one? Read-only: do NOT edit any file. Verdict "clean" only if no
finding survives your honest effort to refute.`
}

function fixPrompt(a, findings) {
  return `You are fixing verified defects in ${a.enPath}. Apply EXACTLY these
fixes, nothing else. Read the file, make the edits with Edit, confirm each.
${SCOPE_RULE}

Defects:
${JSON.stringify(findings, null, 2)}`
}

function syncPrompt(a) {
  return `You are syncing a revised EN article into its zh-TW mirror.
EN (final state): ${a.enPath}. Its uncommitted changes: run
\`git diff -- "${a.enPath}"\`. zh-TW mirror to update: ${a.zhPath}.
Read CLAUDE.md first (zh-TW section-header map, Vue template safety).
Apply every EN change at the corresponding location in the zh file,
translated naturally into Traditional Chinese (Taiwan). Match the zh file's
existing terminology and punctuation conventions. Do NOT reintroduce AI-tone
patterns the EN edits removed (no negation tricolons, no 「不是X,而是Y」).
${SCOPE_RULE.replace('file(s) named in this prompt', `zh-TW file ${a.zhPath} only`)}
After editing, re-read the changed zh sections once and confirm section count
and order still parallel the EN file. Full orthographic correctness for
Traditional Chinese is required.`
}

function shortName(p) {
  const m = p.match(/([^/]+)\.md$/)
  return m ? m[1] : p
}

phase('Audit')
const results = await pipeline(
  batch,
  a => agent(auditPrompt(a), { label: `audit:${shortName(a.enPath)}`, phase: 'Audit', schema: AUDIT_SCHEMA }),
  async (audit, a) => {
    if (!audit) return { status: 'failed', notes: 'audit agent failed' }
    const counts = { tone: 0, organization: 0, references: 0, factual: 0, template: 0 }
    for (const f of audit.findings) counts[f.lens] = (counts[f.lens] || 0) + 1
    if (!audit.findings.length) {
      return { status: 'clean', findings: counts, notes: audit.summary }
    }
    const revised = await agent(revisePrompt(a, audit), {
      label: `revise:${shortName(a.enPath)}`, phase: 'Revise', schema: REVISE_SCHEMA,
    })
    if (!revised) return { status: 'failed', findings: counts, notes: 'revise agent failed after audit found issues' }
    if (!revised.changed) {
      return { status: 'clean', findings: counts, notes: `audit findings all declined: ${revised.declined || 'no reason given'}` }
    }
    return { status: 'revised-unverified', findings: counts, audit, revised }
  },
  async (prev, a) => {
    if (!prev || prev.status !== 'revised-unverified') return prev
    let verdict = await agent(verifyPrompt(a), {
      label: `verify:${shortName(a.enPath)}`, phase: 'Verify', schema: VERIFY_SCHEMA,
    })
    if (!verdict) return { ...prev, status: 'failed', notes: 'verify agent failed; treat article as dirty' }
    if (verdict.verdict === 'issues' && (verdict.findings || []).length) {
      const fixed = await agent(fixPrompt(a, verdict.findings), {
        label: `fix:${shortName(a.enPath)}`, phase: 'Verify', schema: FIX_SCHEMA,
      })
      if (!fixed) return { ...prev, status: 'failed', notes: 'fix agent failed mid-verify; treat article as dirty' }
      verdict = await agent(verifyPrompt(a), {
        label: `reverify:${shortName(a.enPath)}`, phase: 'Verify', schema: VERIFY_SCHEMA,
      })
      if (!verdict) return { ...prev, status: 'failed', notes: 'reverify agent failed; treat article as dirty' }
    }
    if (verdict.verdict !== 'clean') {
      log(`${a.enPath}: verify still unclean after fix round — marking for revert`)
      return { ...prev, status: 'reverted', notes: `unresolved after 2 verify rounds: ${verdict.notes}` }
    }
    return { ...prev, status: 'verified', verifyNotes: verdict.notes }
  },
  async (prev, a) => {
    if (!prev || prev.status !== 'verified') return prev
    const synced = await agent(syncPrompt(a), {
      label: `sync:${shortName(a.enPath)}`, phase: 'Sync', schema: SYNC_SCHEMA,
    })
    if (!synced) {
      log(`${a.enPath}: zh sync failed — EN revision stands, zh needs manual sync`)
      return { ...prev, status: 'revised', notes: `${prev.verifyNotes} | WARNING: zh-TW sync agent failed, mirror not updated` }
    }
    return { ...prev, status: 'revised', notes: `${prev.verifyNotes} | zh synced (${synced.passagesUpdated} passages)` }
  }
)

return {
  results: batch.map((a, i) => {
    const r = results[i] || { status: 'failed', notes: 'pipeline dropped this article' }
    return {
      enPath: a.enPath, zhPath: a.zhPath, id: a.id || null,
      status: r.status, findings: r.findings || null, notes: r.notes || '',
    }
  }),
}
```

- [ ] **Step 2: Syntax-check the script**

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('.claude/workflows/fee-harden.js', 'utf8').replace(/^export /gm, '');
new (require('vm').Script)('(async () => {' + src + '})()');
console.log('SYNTAX_OK');
"
```
Expected: `SYNTAX_OK`

- [ ] **Step 3: Commit**

```bash
git add .claude/workflows/fee-harden.js
git commit -m "chore(harness): add fee-harden workflow script"
```

---

### Task 2: Skill wrapper `.claude/skills/fee-harden/SKILL.md`

**Files:**
- Create: `.claude/skills/fee-harden/SKILL.md`

**Interfaces:**
- Consumes: Task 1's return shape; `docs/superpowers/harness/audit-ledger.json`.
- Produces: the `/fee-harden` command.

- [ ] **Step 1: Write the skill**

````markdown
---
name: fee-harden
description: Use when the user runs /fee-harden or asks to harden, sharpen, or audit existing FEE articles. Selects the stalest articles from the audit ledger, runs the reader-first audit/revise/verify/sync workflow, lands results, updates the ledger, and commits to main.
---

# /fee-harden — Harden Existing FEE Articles

Manually triggered. Audits a ledger-selected batch reader-first across four
calibrated lenses (tone > organization > references > factual), revises,
adversarially verifies with a separate agent, syncs zh-TW, commits to main.

Argument: optional batch size (default 5). `/fee-harden 2`.

## Steps

### 1. Select the batch

- Read `docs/superpowers/harness/audit-ledger.json`.
- Confirm `git status` has no unrelated staged changes; stop and ask if it does.
- Enumerate candidates and pick the batch with:

```bash
node -e "
const fs = require('fs'), path = require('path');
const N = Number(process.argv[1] || 5);
const ledger = JSON.parse(fs.readFileSync('docs/superpowers/harness/audit-ledger.json', 'utf8'));
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md') && !['list.md', 'faq.md', 'index.md'].includes(e.name)) files.push(p);
  }
})('docs/en');
const never = files.filter(f => !ledger[f]).sort();
const stale = files.filter(f => ledger[f]).sort((a, b) => ledger[a].lastAudited.localeCompare(ledger[b].lastAudited));
const batch = never.concat(stale).slice(0, N).map(enPath => {
  const src = fs.readFileSync(enPath, 'utf8');
  const m = src.match(/^id:\s*(\d+)/m);
  return { enPath, zhPath: enPath.replace('docs/en/', 'docs/zh-tw/'), id: m ? Number(m[1]) : null };
});
console.log(JSON.stringify(batch, null, 2));
" <N>
```

- For any batch entry whose zhPath does not exist on disk, drop it from the
  batch and note it in the report as "missing zh mirror — needs creation, not harden".

### 2. Run the workflow

Invoke the Workflow tool:
- `scriptPath`: `.claude/workflows/fee-harden.js`
- `args`: `{ "batch": <the selected array> }`

Wait for completion. The return value is `{ results: [...] }` with per-article
`status`: `clean` / `revised` / `reverted` / `failed`.

### 3. Revert what the workflow condemned

- For each result with `status: "reverted"`: `git checkout -- "<enPath>"`
  (zh is untouched at that stage).
- For each `status: "failed"`: check `git status` for that article pair; if
  either file is dirty, `git checkout --` both. A failed article must land
  nothing.

### 4. Build gate

Run `pnpm docs:build`. It MUST pass. On failure: identify the offending file;
fix trivial violations (Vue template safety) yourself; if unsalvageable,
revert that article pair, downgrade its status to `reverted`, re-run until green.

### 5. Sanity review

For each `revised` article, read the EN diff (`git diff -- "<enPath>"`) once:
confirm edits stay inside the article, tone fixes did not reword the pattern
into a new pattern, and the zh mirror was actually updated when the notes say
it was. Structural surprises send the pair to the revert path with a note.

### 6. Update harness state

- Determine today's date as YYYY-MM-DD.
- For every article in the batch, upsert `audit-ledger.json`:
  `{"<enPath>": {"id": <id>, "lastAudited": "<today>", "findings": <findings counts or zeros>, "notes": "<status>: <notes, truncated to one line>"}}`
  (`clean`, `revised`, and `reverted`/`failed` all get ledger entries —
  a reverted article records what went wrong and stays at the head of the
  stale queue only if you delete its entry; keep the entry so the next run
  moves on, and list it in the report for manual attention.)
- Write `docs/superpowers/harness/reports/<today>-harden.md`:

```markdown
# Harden Run — <today>

## Revised
- FEE-<id> <enPath> — findings {tone: n, ...}. <notes>

## Clean
- FEE-<id> <enPath> — <notes>

## Reverted / Failed (needs manual attention)
- FEE-<id> <enPath> — <notes>
```

If the report file already exists (same-day rerun), append a `## Run N` section.

### 7. Commit

Order, matching repo conventions (no emojis, no AI attribution):

1. Per category with revised articles: `git add` that category's revised
   EN+zh pairs, then
   `docs(<category-kebab>): harden FEE-<ids> (<dominant lenses, e.g. "tone, reader gaps, facts">)`.
2. Harness state + report: `chore(harness): record harden run <today>`.

### 8. Report to user

Summarize per status group with FEE ids and dominant findings; call out
reverted/failed articles as needing manual attention; give the report path.
Do not push.
````

- [ ] **Step 2: Verify skill file**

Run: `head -4 .claude/skills/fee-harden/SKILL.md` — frontmatter has `name` and `description`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/fee-harden/SKILL.md
git commit -m "chore(harness): add /fee-harden command wrapper"
```

---

### Task 3: Smoke run and owner review

**Files:**
- Modify: (produced by the run) one article pair, `audit-ledger.json`, a new report.

- [ ] **Step 1: Run `/fee-harden 1`** — one article, full pipeline.

- [ ] **Step 2: Verify artifacts**

- The audited article's ledger entry updated; report exists; build passed.
- If revised: EN diff respects the four lenses; zh mirror updated; commits follow conventions.
- If clean/reverted: status and notes are coherent with the audit summary.

- [ ] **Step 3: Owner reviews the revision and report**

Present the diff and report. Prompt adjustments to
`.claude/workflows/fee-harden.js` (especially the tone blacklist and audit
mandate) happen here before larger batches.
