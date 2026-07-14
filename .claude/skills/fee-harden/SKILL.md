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
- Confirm the working tree has NO uncommitted changes (staged or unstaged) under
  `docs/en/` and `docs/zh-tw/` — the workflow runs `git checkout --` on batch
  articles and attributes their `git diff` to the reviser, so pre-existing
  edits would be destroyed or misattributed. Stop and ask if the tree is not clean.
- Enumerate candidates and pick the batch with:

```bash
node -e "
const fs = require('fs'), path = require('path');
const N = Number(process.argv[1] || 5);
const ledger = JSON.parse(fs.readFileSync('docs/superpowers/harness/audit-ledger.json', 'utf8'));
const files = [];
// Web Platform Proposals tracks a different article template; excluded from harden v1.
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'Web Platform Proposals') walk(p); }
    else if (e.name.endsWith('.md') && !['list.md', 'faq.md', 'index.md'].includes(e.name)) files.push(p);
  }
})('docs/en');
const never = files.filter(f => !ledger[f]).sort();
const stale = files.filter(f => ledger[f]).sort((a, b) => ledger[a].lastAudited.localeCompare(ledger[b].lastAudited));
const batch = never.concat(stale).map(enPath => {
  const src = fs.readFileSync(enPath, 'utf8');
  if (/^overview: true/m.test(src)) return null; // overview pages aggregate their category; harden targets articles
  const m = src.match(/^id:\s*(\d+)/m);
  return { enPath, zhPath: enPath.replace('docs/en/', 'docs/zh-tw/'), id: m ? Number(m[1]) : null };
}).filter(Boolean).filter(e => {
  if (fs.existsSync(e.zhPath)) return true;
  console.error('dropped (missing zh mirror): ' + e.enPath);
  return false;
}).slice(0, N);
console.log(JSON.stringify(batch, null, 2));
" <N>
```

- Entries dropped for a missing zh mirror are printed to stderr — list them in
  the report as "missing zh mirror — needs creation, not harden".
- Overview pages (`overview: true` frontmatter) are permanently excluded:
  they aggregate their category, so the reader-first lenses do not apply
  (owner decision, 2026-07-14).

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

## zh desync (needs manual attention)
- FEE-<id> <enPath> — EN revised and verified but the zh sync agent failed; mirror is stale.
```

If the report file already exists (same-day rerun), append a `## Run N` section.

A `revised` result whose notes contain 'zh-TW sync agent failed' goes under
`## zh desync`, and its ledger notes must start with `revised (zh sync FAILED): `.

### 7. Commit

Order, matching repo conventions (no emojis, no AI attribution):

1. Per category with revised articles: `git add` that category's revised
   EN+zh pairs, then
   `docs(<category-kebab>): harden FEE-<ids> (<dominant lenses, e.g. "tone, reader gaps, facts">)`.
   Commit zh-desync articles' EN files too (the revision is verified), but
   naming them in the commit body is not needed — the report and ledger
   carry the flag.
2. Harness state + report: `chore(harness): record harden run <today>`.

### 8. Report to user

Summarize per status group with FEE ids and dominant findings; call out
reverted/failed AND zh-desync articles as needing manual attention; give the
report path. Do not push.

Finally, confirm `git status` is clean; investigate and report anything left
over — stray modifications mean an agent violated scope.
