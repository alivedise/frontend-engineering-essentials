---
title: code-base-analytics — Multi-Lens Codebase Tour Skill
date: 2026-04-30
status: Approved for planning
slug: code-base-analytics-skill
related: 2026-04-29-codebase-studies-category-design.md
---

# code-base-analytics — Multi-Lens Codebase Tour Skill

## Why this skill

The Codebase Studies category v1 produced single-pattern articles
(FEE-1801 Three.js Dispose Lifecycle, FEE-1802 esbuild Parallelism,
FEE-1803 TanStack Query Observer). Each article goes deep on one
architectural choice but a reader who opens Three.js for the first
time still misses the forest: how Three.js uses OOP to organise
modules, how it handles inheritance, how it manages module
complexity. These are three architectural lenses on one codebase that
deserve to land in one place.

The original category design held back "multi-pattern project tour
articles" for v1. This spec reverses that decision and builds a skill
that produces them.

The skill is opinionated: it computes a deterministic structural
analysis of the target codebase before any prose is written, and the
analysis output is the article's anchor. The writer cannot be vague
because every lens section is grounded in specific numbers ("312
`extends` edges, max chain depth 4") and specific source files at
the pinned tag.

## Output article shape

One bilingual article per codebase, in the existing
`Codebase Studies` category. The article is a multi-lens architecture
tour — 4-6 `## <Lens>` sections, each ending with a "What to look for
elsewhere" recognition transfer bullet. Tour articles are 2500-4500
words; lenses with existing single-pattern satellites are shorter
(300-500 words, cross-link to satellite); lenses without satellites
are full-depth (600-900 words).

Tour articles do **not** include `## Best Practices`. The recognition
transfer is descriptive, not prescriptive. RFC 2119 rules belong in
single-pattern satellite articles, where one pattern earns its own
prescriptive depth.

## When to use

- Producing a multi-lens architecture tour for a named open-source codebase.
- Codebase has at least ~100 source files and a non-trivial class graph or module tree.
- Codebase has a stable tagged release that pins `studied_at`.

## When NOT to use

- Single-pattern deep dives — those stay hand-authored in the satellite article shape.
- Adding articles to non-Codebase-Studies categories.
- Codebases too small for a tour (the analyzer's lens-selection floor of 4 will refuse).
- Closed-source codebases — no public source links, no commit pinning.
- Multi-codebase comparison articles ("Vite vs Rollup architecture") — single-codebase focus is the v1 contract.

## Invocation

```
/code-base-analytics <github-url-or-local-path> [--tag=<git-tag>] [--id=<FEE-id>] [--slug=<kebab-slug>]
```

- `<github-url-or-local-path>` — required. Target codebase.
- `--tag` — optional. Git tag for `studied_at` pinning. Defaults to latest tagged release detected from `git tag --list`.
- `--id` — optional. Target FEE id. Defaults to the next free id under `docs/en/Codebase Studies/`.
- `--slug` — optional. Article slug. Defaults to `<codebase>-architecture-tour`.

## Pipeline

```
1. Clone target at pinned tag → temp dir under .worktrees/code-base-studies/clones/
2. Analyze (deterministic bash/grep pass) → analysis.json + analysis.md
3. Lens selection (controller reads analysis output, picks 4-6 lenses) → lenses.md
4. Research subagent (per lens, parallel) → findings/<slug>/<lens>.md
5. Writer subagent → docs/en/Codebase Studies/<slug>.md
6. Translator subagent → docs/zh-tw/Codebase Studies/<slug>.md
7. Polish (polish-documents skill on EN, then on zh-TW)
8. Gates (validate-frontmatter, validate-structure, check-references, validate-tour-citations, findings coverage, id uniqueness)
9. Atomic commit
10. pnpm docs:build to regenerate list.md, separate commit
```

## Phase 2 — Deterministic analysis

The analyzer runs `analyze-codebase.sh` over the cloned repo. Output
is two artifacts in `docs/superpowers/research/<slug>/`:

- `analysis.json` — structured machine-readable data.
- `analysis.md` — human-readable summary; the file the writer reads.

Signal categories computed (lightweight bash/grep, no AST):

| Category | What's computed | Tools |
|---|---|---|
| Repo shape | file count by extension, directory tree (3 levels deep), top 20 biggest files, LOC histogram, license, first/latest commit date, tag list | `find`, `wc`, `git log` |
| Class graph | every `class X extends Y` edge, adjacency list, max depth, universal base classes (most-extended), longest inheritance chain | `grep -rE` + small awk script |
| Modules | top-level entry exports, re-export depth, file-naming clusters (`WebGL*`, `*Loader`), imports-per-file histogram, simple cycle detection | grep on `import`/`from`/`require` |
| Public API | exported symbols at the entry point, taxonomy (class/function/constant), count | parse entry file regex |
| Hot path heuristics | files containing `render`/`tick`/`update`/`loop`/`frame` in function/method names; args named `dt`/`delta`/`time` | grep |
| Extension points | functions/methods named `register*`/`add*Plugin`/`use*`/`extend*`; presence of `plugins/`/`extensions/`/`addons/` folders | grep + `find` |
| Build/test | `package.json` scripts, test framework detection, build tool detection | parse `package.json`, presence checks |

What the analyzer does NOT do: TypeScript-aware type resolution,
real call graphs, runtime profiling, performance benchmarking.
Heuristics only. Every claim in the article is verified by the
research subagent reading the actual source file at the pinned tag —
the analysis output anchors the claim, the source file confirms it.

## Phase 3 — Lens selection

The controller reads `analysis.md` and applies firing rules to pick
4-6 lenses. Output is `lenses.md`.

Firing rules:

| Lens | Fires when |
|---|---|
| Class Hierarchy & Inheritance | `extends` edges > 30 AND max depth ≥ 2 AND a universal base has ≥ 5 direct children |
| Module Decomposition | total source files > 100 AND top-level directory count between 5 and 25 |
| Public API Surface | entry exports > 50 OR re-export depth > 2 |
| Hot Path / Render Loop | render-keyword cluster fires AND ≥ 1 method named `render`/`tick`/`update`/`step` exists in a top-level coordinator file |
| Extension Points | `register*` / `add*Plugin` style functions found OR a top-level `plugins/`/`extensions/` folder exists |
| Build & Test Layout | `package.json` scripts > 5 OR multiple test directories OR non-trivial build config |
| Resource Lifecycle | `dispose`/`destroy`/`release`/`close` symbols > 5 AND the universal base does NOT define one |

Floor: 4 lenses. If fewer fire, the skill exits with
`target codebase too small for a tour — consider a single-pattern article instead`.

Cap: 6 lenses. If more fire, the controller picks the 6 with the
strongest quantitative signals (specific edge counts beat keyword
matches in comments) and lists the rest under `## Out of scope` for
reviewer visibility.

Each non-firing lens gets one line in `lenses.md` stating which
threshold failed, so the human reviewer can sanity-check the cuts.

When a fired lens has an existing single-pattern satellite article
in the same Codebase Studies wing, the lens section in the tour is
shorter (300-500 words) and ends with a cross-link to the satellite.
Lenses without a satellite get the full 600-900 word treatment.

## Phase 4 — Research subagent (per lens, parallel)

| | |
|---|---|
| Tools | `Read`, `Grep`, `Bash` (read-only on the clone), `WebFetch` (only to verify that source URLs at the pinned tag exist) |
| Input | the lens excerpt from `analysis.md`, the lens heading, path to the cloned repo, the pinned git tag |
| Output | `docs/superpowers/research/<slug>/<lens>.md` containing: named pattern (2-4 words, bolded), quantitative anchor from the analysis, 2-3 commit-pinned source URLs with pulled quotes, what-to-look-for-elsewhere closing bullet |

Hard rule: every claim must cite either the analysis output (for
numbers) or a specific file/line at the pinned tag (for source
claims). No internal-knowledge filler.

Dispatch: 4-6 research subagents in parallel, one per fired lens.
Each gets only its own lens excerpt — no global view. Same isolation
principle as `expanding-category-articles`.

## Phase 5 — Writer subagent

| | |
|---|---|
| Tools | `Read`, `Write` |
| Input | All N per-lens findings docs, `templates/tour-article.md`, locale=`en`, the assigned FEE id, the assigned slug, the `studied_at` string |
| Output | One EN article file at `docs/en/Codebase Studies/<slug>.md` |

Hard rule: every `## <Lens>` section's claims trace to one of the N
findings files. No claim that isn't already in some findings doc.
The template is canonical; the writer does not read existing
category articles to infer structure.

Section budgets:

- `:::info` hook — 3-5 sentences, includes the studied tag.
- `## Context` — 200-400 words. Codebase identity, why studied.
- `## Visual` — one Mermaid diagram OR one structured table. Tours default to a class-graph diagram or a module-map table.
- `## Example` — one concrete code citation, ≤30 lines, exemplifying the codebase's style.
- `## <Lens 1>` … `## <Lens N>` — 300-500 words if a satellite article exists, 600-900 words if no satellite. Each ends with `**What to look for elsewhere:** <recognition signals>`.
- `## Design Thinking` (optional) — explicit trade-offs the codebase made.
- `## Internal References` — cross-links to satellites + abstract pattern articles in FEE-500s.
- `## References` — commit-pinned URLs only.

## Phase 6 — Translator subagent

Reused verbatim from `expanding-category-articles`. Same heading map
(Context → 背景, Design Thinking → 設計思維, Internal References →
延伸閱讀, References → 參考資料, etc.). Same rules: preserve heading
hierarchy, code blocks verbatim, URLs verbatim, frontmatter id and
slug preserved, title translated naturally.

## Phase 7 — Polish

`Skill(polish-documents, <en path>)` then `Skill(polish-documents,
<zh-tw path>)`. Verbatim invocation of the existing skill. No inline
grep-and-edit substitution.

## Phase 8 — Validation gates

In order, before commit. Any failure blocks; controller asks user to
fix-retry, skip, or abort.

| # | Gate | Source |
|---|---|---|
| 1 | `validate-frontmatter.sh` (with `studied_at` required) | reused from `expanding-category-articles`, one new required-field check |
| 2 | `validate-structure.sh` | reused; needs a small patch to accept tour-shape (no `## Best Practices` required) |
| 3 | `check-references.sh` | reused; same false-positive tolerance as the rest of the project (caniuse 302 etc.) |
| 4 | `validate-tour-citations.sh` (new) | every `## <Lens>` section contains at least one URL with the studied tag in the path (`/blob/<tag>/...` or matching SHA pattern) |
| 5 | findings coverage | inline controller check: each lens cites ≥ 2 commit-pinned URLs that also appear in `## References` |
| 6 | id uniqueness | existing pattern: scan every `id:` value under `docs/en/Codebase Studies/` |

## Phase 9 — Commit

Single atomic commit per article:

```
docs(codebase-studies): add <Codebase> Architecture Tour (FEE-<id>)
```

The commit includes EN + zh-TW articles, all per-lens findings docs,
the analysis artifacts (`analysis.md`, `analysis.json`, `lenses.md`).
The clone directory under `.worktrees/code-base-studies/clones/` is
NOT committed (it stays in `.gitignore`).

## Phase 10 — Sidebar regen

After the article commit lands, regenerate the sidebar:

```
pnpm docs:build
git add docs/en/list.md docs/zh-tw/list.md
git commit -m "docs(list): regenerate sidebar for FEE-<id> (<Codebase> Tour)"
```

Same convention as every other article-add workflow in this repo.

## Article template

`templates/tour-article.md` (canonical):

```markdown
---
id: <ID>
title: "<Codebase> — Architecture Tour"
state: draft
slug: <kebab-slug>
studied_at: "<project> <version> (<YYYY-MM-DD>)"
---

# [FEE-<ID>] <Codebase> — Architecture Tour

:::info
<3-5 sentence hook. Names the codebase, the studied tag, the lenses
covered, the single most distinctive architectural fact.>
:::

## Context
<200-400 words. Codebase identity, history, why it's worth studying.
Names the maintainers and the size of the public footprint.>

## Visual
<One Mermaid diagram OR one structured table. Tours default to a
class-graph diagram or a module-map table.>

## Example
<One concrete code citation, ≤30 lines, pulled verbatim from the
pinned tag. Exemplifies the codebase's style.>

## <Lens 1>
<Named pattern in bold first sentence. Quantitative anchor from
analysis. 2-3 commit-pinned source citations. Closes with:
**What to look for elsewhere:** <recognition signals>.>

## <Lens 2>
[... 4-6 lenses total ...]

## Design Thinking
<Optional. Trade-offs the codebase explicitly made.>

## Internal References
- [<Satellite article>](/en/Codebase%20Studies/<satellite-slug>)
- [<Abstract pattern>](/en/<category>/<slug>)

## References
- <Author>, "<Title>," <Repo> at <tag> (<year>). <URL>
```

zh-TW heading map matches the project's existing convention (Context
→ 背景, Visual → 視覺對比, Example → 範例, Design Thinking →
設計思維, Internal References → 延伸閱讀, References → 參考資料).
Lens headings are author-specific and translate naturally.

## ID convention

The skill produces tour articles at the next free FEE id under
`docs/en/Codebase Studies/`. The convention going forward:

- `18x0` — codebase tour articles (1800 = category overview, 1801 =
  Three.js tour, future codebases get 1802, 1803, ... when reframed).
- `18xy` — codebase satellite articles (1810s = Three.js satellites,
  1820s = future esbuild satellites, 1830s = future TanStack Query
  satellites).

Existing FEE-1802 (esbuild Parallelism) and FEE-1803 (TanStack Query
Observer) are technically satellites under the new scheme but keep
their current ids for now. Renumbering them is out of scope; a note
records the inconsistency for future cleanup.

## The FEE-1801 reframe

Handled by Phase 0 of the implementation plan, not the skill itself:

1. **Phase 0a** — rename existing FEE-1801 to FEE-1810. Update id in
   frontmatter, leave the slug `threejs-dispose-lifecycle` as-is
   (still descriptive). Update internal references in the FEE-1800
   overview, the article's own cross-links, and any inbound links
   from FEE-501 / FEE-506.
2. **Phase 0b** — regenerate `list.md`, single atomic commit.
3. **Phase 1+** — invoke `code-base-analytics` with target
   `https://github.com/mrdoob/three.js`, tag `r172` (or latest
   stable), id `1801`. Skill produces FEE-1801 = Three.js Architecture
   Tour.

## Deliverables

This spec produces:

1. The `code-base-analytics` skill at `~/.claude/skills/code-base-analytics/`:
   - `SKILL.md` (skill manifest)
   - `scripts/clone-target.sh`, `scripts/analyze-codebase.sh`, `scripts/validate-tour-citations.sh`
   - `templates/tour-article.md`
   - `prompts/research-subagent.md`, `prompts/writer-subagent.md`
2. Phase 0 reframe: existing FEE-1801 renamed to FEE-1810 (frontmatter id, internal references).
3. New FEE-1801 = Three.js Architecture Tour, produced by invoking the skill on Three.js r172.
4. `validate-structure.sh` patched in the host repo to accept the tour shape (optional Best Practices).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Lens selection produces a thin tour for a borderline codebase | medium | 4-lens floor → skill exits with explicit message |
| Analyzer returns wrong counts (multiline `extends`, dynamic class generation, generated code) | medium | Writer is required to cross-check claims against actual source files at the pinned tag, not just the analysis. Findings docs cite specific file paths. |
| Cloned repo is large (Three.js ~800MB at full depth) | low | Clone with `--depth 1 --branch <tag>` (~80MB). Cleanup after success; preserve on failure for debugging. |
| Tour article rot as the codebase publishes new tags | high | `studied_at` frontmatter is the contract — articles describe a snapshot. Updating to a newer tag is a legitimate future PR. |
| Lens overlap with abstract-pattern articles in FEE-500s | medium | Each lens cross-links the abstract pattern in `## Internal References`. The tour cites the codebase as the witness; abstract patterns remain canonical theory. |
| Subagent fan-out cost (4-6 research + writer + translator + 2× polish ≈ 8-10 invocations) | low | Acceptable for one-shot per codebase. Would need rethinking only if scaled to a continuous-batch mode. |

## Out of scope for v1

- Multi-codebase comparison tours.
- Performance / benchmark lens.
- Real static analysis (TypeScript compiler API, tree-sitter).
- Auto-update when the studied codebase publishes a new tag.
- Auto-renumbering existing FEE-1802 (esbuild) and FEE-1803 (TanStack
  Query) to fit the new `18xy` convention.
- Tour articles for codebases other than Three.js. The skill is built
  to be reusable, but only Three.js is delivered in v1.
- Tooling for non-JS codebases beyond minimal Go/Rust/Python signal
  extraction. The analyzer is precise for JS-ish code; other languages
  get partial coverage.

## What's next

After this spec is approved:

1. The implementation plan (writing-plans skill) breaks the
   deliverables into bite-sized tasks: Phase 0 reframe of FEE-1801,
   skill scaffolding, scripts, prompts, template, the
   `validate-structure.sh` patch, and the Three.js invocation.
2. Subagent-driven development executes the plan with fresh
   subagents per task, two-stage review per task.
3. The Three.js Architecture Tour is the deliverable that validates
   the skill end-to-end. If it doesn't fix the disappointment, the
   skill needs another pass.
