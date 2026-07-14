---
title: FEE Content Harness — Harden Existing Articles + Discover New Material
date: 2026-07-13
status: Approved
---

# FEE Content Harness — Design

## Problem

The repository holds 281 EN articles (each with a zh-TW parallel), nearly all
in `state: draft`. Two recurring needs have no repeatable process today:

1. **Hardening** — existing articles contain factual drift and occasional
   hallucinations (see commit `bd55192`, which fixed hallucinated claims in
   the FEE-600 overview). There is no systematic fact-check, depth audit, or
   template-compliance sweep, and no record of which articles were last
   verified.
2. **Discovery** — new material lands only via ad-hoc category-expansion
   sessions. There is no periodic sweep of external sources that proposes
   and drafts new articles or appends updates to existing ones.

## Decisions (settled with the owner)

- **Discovery sources**: platform-official sources (browser release notes,
  web.dev, TC39/WHATWG/CSSWG proposals, Baseline/web-features), well-known
  OSS codebases (feeding Codebase Studies), and curated digests
  (JavaScript Weekly, Frontend Focus archives). Framework/tool changelogs
  are explicitly out of scope for now.
- **Hardening priorities**: fact-checking, depth reinforcement, and
  structure/template compliance. Article state promotion (draft →
  reviewing → approved) is out of scope.
- **Execution**: manual trigger, local machine. No cron or cloud
  scheduling in v1; the commands must be schedulable later without
  design changes.
- **Landing** (revised 2026-07-14): fully autonomous — from invoking the
  command to opening a PR, no human intervention. Each run lands its
  commits on a branch `harness/<command>-<date>`, pushes it, and opens a
  PR whose body summarizes the run; the owner's only touchpoint is PR
  review. Direct-commit-to-main (the v1 model) is retired. Commit-message
  conventions unchanged (no emojis, no AI attribution); the run report is
  committed on the branch. Preconditions that fail (dirty tree) abort the
  run with a message instead of asking — an aborted run is a visible
  non-event, not an interactive prompt.

## Architecture

Two independent slash commands, each wrapping a multi-agent Workflow
script, sharing committed state files. Runs are batch-sized and
ledger-driven so the 281-article corpus is covered across many small runs
rather than one monolithic pass.

```
.claude/
  skills/
    fee-harden/SKILL.md      # command wrapper: load state, invoke workflow, land results
    fee-discover/SKILL.md
  workflows/
    fee-harden.js            # multi-agent orchestration script
    fee-discover.js
docs/superpowers/harness/
  audit-ledger.json          # per-article audit history (drives batch selection)
  sources.yaml               # tiered source registry for discovery
  discovery-log.json         # proposed/accepted/rejected topics (dedup memory)
  reports/                   # one markdown report per run
```

Rationale for two commands instead of one: the two jobs have different
rhythms (hardening rotates through a fixed corpus; discovery reacts to
external signals), different tuning knobs, and different failure modes.
Coupling them would make both worse.

### Shared state

**`audit-ledger.json`** — one entry per EN article:

```json
{
  "docs/en/State Management/600.md": {
    "id": 600,
    "lastAudited": "2026-07-13",
    "findings": { "tone": 2, "organization": 1, "references": 0, "factual": 3, "template": 0 },
    "notes": "overview hallucination fixed; example verified against Zustand docs"
  }
}
```

fee-discover entries predate the five-lens calibration and use
`{factual, depth, template}`; selection reads only `lastAudited`, so both
shapes coexist.

Batch selection = never-audited first, then stalest `lastAudited`.
Articles touched by a discovery run get their ledger entry refreshed (a
freshly written article is by construction freshly audited).

**`sources.yaml`** — tiered registry:

```yaml
platform:            # tier 1-2: specs, proposals, platform release notes
  - name: Chrome Release Notes
    url: https://developer.chrome.com/release-notes
  - name: TC39 Proposals
    url: https://github.com/tc39/proposals
  # ... web.dev, WebKit blog, Firefox release notes, CSSWG drafts, Baseline
codebases:           # candidates for Codebase Studies
  - name: three.js   # already covered: FEE-1801/1810
    status: covered
  - name: vite
    status: candidate
digests:             # tier 3: curated aggregation
  - name: JavaScript Weekly
    url: https://javascriptweekly.com/issues
```

**`discovery-log.json`** — every topic ever proposed, with disposition
(`accepted` / `rejected` / `deferred`) and the FEE id if accepted. Scouts
check this before proposing; prevents re-proposing rejected topics.

**Why run state is committed (not a separate store).** Orthodox pipeline
systems (Airflow, Airbyte, distributed cron) keep run state in a metadata
database because they are multi-writer, high-frequency, and large-state.
None of that holds here (single owner, manual trigger, a few KB of JSON),
so this design follows the git-scraping pattern instead — git as the
state store, commit history as the audit trail. Two local reasons beyond
scale: (a) ledger entries are only meaningful against the content version
they audited, so state and articles must share one history and revert
atomically; (b) the dedup memory must survive re-clones and machine
switches, which a gitignored local file would not. Each run lands exactly
one `chore(harness)` state commit to bound history noise.
**Revisit if**: runs become scheduled/high-frequency, multiple
writers appear, or reports start polluting `git log` — then move state to
a dedicated branch, git notes, or an external store.

### `/fee-harden [batch-size]` — harden existing articles

Default batch: 10 articles. Pipeline (per article, no barriers between
articles):

1. **Select** — wrapper reads the ledger, picks the batch, passes article
   paths + repo conventions into the workflow as `args`.
2. **Audit** — one agent per article reads EN + zh-TW *as a reader first*
   (record stumbles and the questions the text provokes, then verify), and
   produces structured findings across four lenses. Priority order was
   calibrated with the owner on FEE-703 (2026-07-13/14) and is binding:
   - *Tone (highest)*: flag AI-pattern sentences in both languages —
     negation tricolons ("buttons do not respond, forms do not validate,
     dynamic components do not update"), "not X but Y" constructions,
     em-dash appositive chains, paragraph-final summary flourishes. Fix by
     replacing with one concrete example or a plain statement, not by
     rephrasing the pattern.
   - *Organization / reader model*: (a) dependency check — every proper
     noun introduced or linked before first substantive use; (b)
     provoked-question check — list the questions a reader naturally asks
     at each section and verify the article answers them; (c) framework
     neutrality of the main narrative.
   - *References mining*: concepts in cited sources worth absorbing into
     the body; references must not use terms the body never defines; the
     annotation must match what the source actually says.
   - *Factual/staleness*: extract load-bearing claims; verify each against
     the article's own References plus official docs (WebFetch/WebSearch).
     Flag hallucinations, stale version claims, dead reference URLs, and
     claims contradicted by the article's own cited sources.
   Template compliance (section order, frontmatter, Vue template safety)
   rides along as a mechanical checklist, not a lens.
3. **Adversarial verify** — the reviser and the verifier MUST be different
   agents with separate contexts. Every revision (not only factual
   findings) goes to an independent verifier prompted to refute it using
   primary sources and to check for newly introduced tone/organization
   regressions. The verify loop runs up to three fix+verify rounds (the
   2026-07-14 smoke run showed round two can surface NEW findings with
   concrete fixes; a two-round cap discarded an otherwise-verified
   revision). An article still unclean after three rounds is dropped from
   the PR and listed in the PR body as needing attention. Only revisions
   that survive land. Calibration evidence:
   on FEE-703 the reviser inverted a source's meaning while fixing a
   different source-inversion — the same failure class it was correcting —
   and only the independent verifier caught it.
4. **Apply** — an editor agent applies confirmed fixes to the EN file,
   then mirrors the changes into the zh-TW counterpart (parallel
   structure, translated section headings per the CLAUDE.md map).
   Articles are disjoint files, so parallel editing needs no worktrees.
5. **Gate** — after all edits: `pnpm docs:build` must pass (catches Vue
   template safety violations and broken links at compile time). On
   failure, the offending file's changes are reverted and logged in the
   report rather than committed broken.
6. **Land** — wrapper updates `audit-ledger.json`, writes
   `reports/YYYY-MM-DD-harden.md` (per-article findings, what was fixed,
   what was rejected by verification, what was skipped), commits in
   per-category groups: `docs(<category>): harden FEE-xxx, FEE-yyy (fact-check + depth)`.

### `/fee-discover [max-topics]` — discover and draft new material

Default: up to 4 accepted topics per run. Pipeline:

1. **Sweep** — three scout agents in parallel, one per source group in
   `sources.yaml` (platform / codebases / digests). Each returns candidate
   topics with source URLs and a one-line rationale. Scouts receive the
   category list and the discovery-log so they self-filter known topics.
2. **Dedup + gap match** (barrier — needs all candidates) — merge, then
   classify each candidate against the existing corpus (`docs/en/list.md`
   + ledger): `new-article` / `append-to-existing` (e.g. a Changelog entry
   or new section on an existing FEE) / `skip`.
3. **Rank** — a judge agent scores survivors on source tier, category fit,
   durability (evergreen mechanics over news), and teachability. Top N
   proceed; the rest are logged as `deferred` or `rejected` with reasons.
4. **Produce** — per accepted topic:
   - *new-article*: research agent deep-reads sources → writer produces
     the EN article per the canonical template (References must be the
     actually-fetched URLs) → verifier fact-checks the draft against the
     fetched sources → translator produces the zh-TW parallel.
   - *append-to-existing*: editor agent adds the section/Changelog entry
     to both languages, verifier checks it.
5. **Integrate** — assign FEE id within the category's numbering range,
   add one line each to `docs/en/list.md` and `docs/zh-tw/list.md`
   (the sidebar itself regenerates from frontmatter at build time),
   run `pnpm docs:build` gate.
6. **Land** — one commit per article (`docs(<category>): add <Title> (FEE-xxxx)`),
   plus a `docs(list): regenerate sidebar for FEE-xxxx` commit, update
   `discovery-log.json` and the ledger, write `reports/YYYY-MM-DD-discover.md`.

## Error handling

- A scout/auditor agent that dies or returns nothing drops its item from
  the run (logged in the report as "not covered"), never aborts the whole run.
- The build gate is all-or-nothing per file: a file that breaks the build
  is reverted, not committed.
- Workflow scripts log every silently-dropped item (`log()`); reports list
  skipped/failed items explicitly so coverage gaps are visible.
- Reruns are safe: the ledger and discovery-log make both commands
  idempotent at the selection layer.

## Verification plan

- Dry-run `/fee-harden 2` on two known-thin articles; confirm findings are
  real (spot-check against sources), zh-TW mirrors the EN edits, build
  passes, ledger and report are written.
- Dry-run `/fee-discover 1`; confirm the accepted topic is genuinely
  absent from the corpus, References resolve, list.md lines added in both
  languages, build passes.
- First few production runs reviewed by the owner via run reports before
  any scheduling discussion.

## Out of scope (v1)

- Cron / cloud scheduling (design already supports adding it later — the
  commands are self-contained).
- Article state promotion (draft → reviewing → approved).
- Framework/tool changelog sources.
- Backfilling ledger data for past ad-hoc fixes.
