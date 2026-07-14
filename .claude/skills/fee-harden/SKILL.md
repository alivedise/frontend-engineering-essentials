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
