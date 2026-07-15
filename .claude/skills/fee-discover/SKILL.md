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
- Confirm the working tree has NO uncommitted changes under `docs/` — if not
  clean, ABORT the run with a clear message (this command runs unattended;
  do not ask questions).
- Create the run branch from up-to-date main:
  `git fetch origin && git checkout -b harness/discover-<today> origin/main`
  (if the branch already exists from a same-day run, suffix `-2`, `-3`, ...).
  All commits in this run land on this branch, never on main.

### 2. Run the workflow

Invoke the Workflow tool:

- `scriptPath`: `.claude/workflows/fee-discover.js`
- `args`: `{ "maxTopics": <N>, "sources": <parsed sources.yaml>, "discoveryLog": <parsed discovery-log.json> }`

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
the article to the same revert-and-defer path as step 4. Also, for each
`kind: new-article` entry, confirm its enPath/zhPath is a newly created file
(`git status` shows it as untracked), not a modification of a pre-existing
article — a modified pre-existing file means a slug collision: send it
through step 4's revert-and-defer path. (`kind: append` entries legitimately
modify pre-existing articles; this check does not apply to them.)

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

If the report file already exists (same-day rerun), append a `## Run N`
section instead of overwriting.

### 7. Commit (on the run branch)

In this order, matching repo conventions (no emojis, no AI attribution):

1. Per new article: `git add <enPath> <zhPath>` then
   `docs(<category kebab, e.g. progressive-web-apps>): add <Title> (FEE-<id>)`
   (match category token style from `git log` for that directory).
   Per append: `docs(<category>): extend FEE-<target id> with <topic>`.
2. If list.md changed: `docs(list): regenerate sidebar for FEE-<ids>`.
3. Harness state + report: `chore(harness): record discover run <today>`.

### 8. Open the PR

- Confirm `git status` is clean; investigate and report anything left over —
  stray modifications mean an agent violated scope.
- Push the branch: `git push -u origin harness/discover-<today>`.
- Open the PR against main:
  `gh pr create --title "Discover run <today>: FEE-<ids>" --body <body>`
  where the body contains: produced articles (id, title, category),
  deferred/rejected topics with reasons, uncovered scout groups, and a
  pointer to the committed report file. No emojis, no AI attribution.
- Switch back to main: `git checkout main` (leave main untouched).
- Report to the user: the PR URL plus a one-paragraph summary. The PR is the
  human review surface — do not merge it yourself.
