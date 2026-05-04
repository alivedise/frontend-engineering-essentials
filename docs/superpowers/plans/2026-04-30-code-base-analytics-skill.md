# code-base-analytics Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `code-base-analytics` skill that produces multi-lens architecture tour articles, then validate it by producing FEE-1801 = Three.js Architecture Tour after reframing the existing FEE-1801 to FEE-1810.

**Architecture:** New skill at `~/.claude/skills/code-base-analytics/` owns the analysis pass, lens selection, tour-article template, and writer prompt. Reuses translator and `polish-documents` from existing infrastructure. Articles go in the existing `Codebase Studies` category.

**Tech Stack:** Bash + grep + awk for the analyzer. Markdown for skill files. VitePress (existing) for articles. Reuses validators from `~/.claude/skills/expanding-category-articles/`.

**Spec:** `docs/superpowers/specs/2026-04-30-code-base-analytics-skill-design.md`

---

## File Structure

**New skill files at `~/.claude/skills/code-base-analytics/`:**

| Path | Responsibility |
|---|---|
| `SKILL.md` | Manifest: when-to-use, invocation, pipeline overview, red flags |
| `templates/tour-article.md` | Canonical tour-article template |
| `prompts/research-subagent.md` | Per-lens research subagent prompt |
| `prompts/writer-subagent.md` | Writer subagent prompt for the tour shape |
| `prompts/translator-subagent.md` | Translator prompt (vendored from `expanding-category-articles`) |
| `scripts/clone-target.sh` | Shallow-clone target at pinned tag |
| `scripts/analyze-codebase.sh` | Deterministic structural analysis |
| `scripts/validate-frontmatter.sh` | Vendored, patched to require `studied_at` |
| `scripts/validate-tour-citations.sh` | Gate: every `## <Lens>` section has a commit-pinned citation |

**Note on `validate-structure.sh`:** The spec called for a patch to make `Best Practices` optional. On inspection, the existing validator in `~/.claude/skills/expanding-category-articles/scripts/validate-structure.sh` already accepts tour articles unchanged: it requires at least one topic-specific section (anything outside the canonical Context/Visual/Example/Best Practices/Design Thinking/Deep Dive/Related Topics/References/Changelog set), and lens sections like `## Class Hierarchy & Inheritance` qualify. No patch is needed. Phase 3 Task 3.8 uses the existing validator directly.

**Repo-side article changes (in a worktree):**

| Path | Change |
|---|---|
| `docs/en/Codebase Studies/threejs-dispose-lifecycle.md` | Frontmatter `id: 1801` → `id: 1810`; H1 `[FEE-1801]` → `[FEE-1810]` |
| `docs/zh-tw/Codebase Studies/threejs-dispose-lifecycle.md` | Same renumbering |
| `docs/en/Codebase Studies/codebase-studies-overview.md` | Inbound link `FEE-1801` → `FEE-1810` |
| `docs/zh-tw/Codebase Studies/codebase-studies-overview.md` | Inbound link `FEE-1801` → `FEE-1810` |
| `docs/en/Component Architecture and Design Patterns/501.md` | Cross-link to FEE-1801 → FEE-1810 (if any) |
| `docs/en/Component Architecture and Design Patterns/506.md` | Cross-link to FEE-1801 → FEE-1810 (if any) |
| `docs/en/Codebase Studies/threejs-architecture-tour.md` | NEW: Three.js Architecture Tour, FEE-1801 |
| `docs/zh-tw/Codebase Studies/threejs-architecture-tour.md` | NEW: zh-TW counterpart |
| `docs/superpowers/research/threejs-architecture-tour/*.md` | Findings + analysis artifacts |
| `docs/en/list.md`, `docs/zh-tw/list.md` | Sidebar regen |

---

## Phase 0: Reframe existing FEE-1801 → FEE-1810

### Setup: worktree

- [ ] **Step 1: Create worktree for this work**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git worktree add .worktrees/build-code-base-analytics -b build/code-base-analytics-2026-04-30
cd .worktrees/build-code-base-analytics
```

Expected: new worktree at `.worktrees/build-code-base-analytics`, on branch `build/code-base-analytics-2026-04-30`.

### Task 0.1: Renumber EN article frontmatter and H1

**Files:**
- Modify: `docs/en/Codebase Studies/threejs-dispose-lifecycle.md` (frontmatter id, H1)

- [ ] **Step 1: Update frontmatter id**

Edit `docs/en/Codebase Studies/threejs-dispose-lifecycle.md`:

```yaml
---
id: 1810
title: "Three.js — The Dispose Lifecycle Contract"
state: draft
slug: threejs-dispose-lifecycle
studied_at: "three.js r172 (2025-04-15)"
---
```

(Change only `id: 1801` → `id: 1810`.)

- [ ] **Step 2: Update H1**

Edit the H1 line:

```markdown
# [FEE-1810] Three.js — The Dispose Lifecycle Contract
```

(Change only `[FEE-1801]` → `[FEE-1810]`.)

- [ ] **Step 3: Validate frontmatter**

Run: `bash ~/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh "docs/en/Codebase Studies/threejs-dispose-lifecycle.md"`

Expected: `frontmatter OK (id=1810, slug=threejs-dispose-lifecycle, state=draft)`.

### Task 0.2: Renumber zh-TW article frontmatter and H1

**Files:**
- Modify: `docs/zh-tw/Codebase Studies/threejs-dispose-lifecycle.md`

- [ ] **Step 1: Update frontmatter id**

Same change as EN (`id: 1801` → `id: 1810`).

- [ ] **Step 2: Update H1**

Same change as EN (`[FEE-1801]` → `[FEE-1810]`).

- [ ] **Step 3: Validate frontmatter**

Run: `bash ~/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh "docs/zh-tw/Codebase Studies/threejs-dispose-lifecycle.md"`

Expected: `frontmatter OK (id=1810, ...)`.

### Task 0.3: Update inbound cross-references

**Files (search and patch):**
- Modify: `docs/en/Codebase Studies/codebase-studies-overview.md` (any reference to FEE-1801)
- Modify: `docs/zh-tw/Codebase Studies/codebase-studies-overview.md` (same)
- Modify (if hits): `docs/en/Component Architecture and Design Patterns/501.md`, `506.md`
- Modify (if hits): `docs/zh-tw/Component Architecture and Design Patterns/501.md`, `506.md`

- [ ] **Step 1: Find all inbound references to FEE-1801 / 1801**

Run:

```bash
grep -rn "FEE-1801\|1801\b" docs/en/ docs/zh-tw/ --include='*.md' | grep -v "threejs-dispose-lifecycle.md"
```

Expected: a list of files referencing the old id. Record the list.

- [ ] **Step 2: Replace each `FEE-1801` reference with `FEE-1810`**

For each file in the list, run an Edit changing:
- `FEE-1801` → `FEE-1810`
- `[FEE-1801 Three.js — The Dispose Lifecycle Contract]` → `[FEE-1810 Three.js — The Dispose Lifecycle Contract]` (if the link text uses the prefix)

Do NOT change `1801` references that are about other things (e.g., a year, an unrelated number). Read each match in context.

- [ ] **Step 3: Re-grep to confirm zero remaining inbound references**

Run:

```bash
grep -rn "FEE-1801" docs/en/ docs/zh-tw/ --include='*.md' | grep -v "threejs-dispose-lifecycle.md"
```

Expected: empty output.

### Task 0.4: Commit Phase 0 reframe

- [ ] **Step 1: Commit**

```bash
git add docs/en/Codebase\ Studies/threejs-dispose-lifecycle.md \
        docs/zh-tw/Codebase\ Studies/threejs-dispose-lifecycle.md \
        docs/en/Codebase\ Studies/codebase-studies-overview.md \
        docs/zh-tw/Codebase\ Studies/codebase-studies-overview.md
# Add any other files modified in Step 2 of Task 0.3.

git commit -m "docs(codebase-studies): reframe FEE-1801 dispose lifecycle as satellite FEE-1810"
```

- [ ] **Step 2: Verify**

Run: `git log -1 --stat`

Expected: 4+ files changed showing the renumbering.

---

## Phase 1: Skill scaffolding

### Task 1.1: Create skill directory and SKILL.md manifest

**Files:**
- Create: `~/.claude/skills/code-base-analytics/SKILL.md`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p ~/.claude/skills/code-base-analytics/{scripts,templates,prompts}
```

- [ ] **Step 2: Write SKILL.md**

Create `~/.claude/skills/code-base-analytics/SKILL.md` with this exact content:

````markdown
---
name: code-base-analytics
description: Use when producing a multi-lens architecture tour article for an open-source codebase in a bilingual VitePress doc-site (BEE/AEE/ADE/FEE/DEE). Computes a deterministic structural analysis of the target, picks 4-6 architectural lenses, then drives subagents to produce one bilingual tour article.
---

# Code-Base Analytics

## Overview

Analyse one open-source codebase at a pinned git tag, then produce one bilingual architecture tour article (EN + zh-TW) covering 4-6 architectural lenses. The skill is opinionated: it computes a deterministic structural analysis (file counts, class graph, module tree, exports surface) before any prose is written, and the analysis output is the article's anchor.

## When to Use

- Producing a multi-lens architecture tour for a named open-source codebase.
- Codebase has at least ~100 source files and a non-trivial class graph or module tree.
- Codebase has a stable tagged release that pins `studied_at`.
- Target repo is the FEE site (or a sibling BEE/AEE/ADE/DEE) with `docs/en/Codebase Studies/` and `docs/zh-tw/Codebase Studies/`.

## When NOT to Use

- Single-pattern deep dives — those stay hand-authored in the satellite article shape.
- Adding articles to non-Codebase-Studies categories.
- Codebases too small for a tour (the analyzer's lens-selection floor of 4 will refuse).
- Closed-source codebases.
- Multi-codebase comparison articles.

## Invocation

```
/code-base-analytics <github-url-or-local-path> [--tag=<git-tag>] [--id=<FEE-id>] [--slug=<kebab-slug>]
```

- `<github-url-or-local-path>` — required.
- `--tag` — optional. Git tag for `studied_at`. Defaults to latest tagged release.
- `--id` — optional. Target FEE id. Defaults to next free id under `docs/en/Codebase Studies/`.
- `--slug` — optional. Article slug. Defaults to `<codebase>-architecture-tour`.

## Preconditions (verify before any file writes)

1. CWD is a git repository with a clean working tree.
2. Both `docs/en/Codebase Studies/` and `docs/zh-tw/Codebase Studies/` exist.
3. Target codebase is reachable (HTTPS clone) and the requested tag exists.

Any failure → print the specific problem and exit. Do not proceed.

## Pipeline

```
1. Clone (scripts/clone-target.sh) → temp dir under .worktrees/code-base-studies/clones/<slug>/
2. Analyze (scripts/analyze-codebase.sh) → docs/superpowers/research/<slug>/{analysis.json, analysis.md}
3. Lens selection (controller reads analysis.md, applies firing rules) → docs/superpowers/research/<slug>/lenses.md
4. Research subagents (per lens, parallel) → docs/superpowers/research/<slug>/<lens>.md
5. Writer subagent → docs/en/Codebase Studies/<slug>.md
6. Translator subagent → docs/zh-tw/Codebase Studies/<slug>.md
7. Polish: Skill(polish-documents, en path) then Skill(polish-documents, zh-tw path)
8. Gates: validate-frontmatter (both), validate-structure (both), check-references (EN), validate-tour-citations (EN), findings coverage, id uniqueness
9. Atomic commit
10. pnpm docs:build → list.md regen → separate commit
```

## Lens firing rules

| Lens | Fires when |
|---|---|
| Class Hierarchy & Inheritance | `extends` edges > 30 AND max depth ≥ 2 AND a universal base has ≥ 5 direct children |
| Module Decomposition | total source files > 100 AND top-level directory count between 5 and 25 |
| Public API Surface | entry exports > 50 OR re-export depth > 2 |
| Hot Path / Render Loop | render-keyword cluster fires AND ≥ 1 method named `render`/`tick`/`update`/`step` exists |
| Extension Points | `register*` / `add*Plugin` style functions found OR a top-level `plugins/`/`extensions/`/`addons/` folder exists |
| Build & Test Layout | `package.json` scripts > 5 OR multiple test directories OR non-trivial build config |
| Resource Lifecycle | `dispose`/`destroy`/`release`/`close` symbols > 5 AND the universal base does NOT define one |

Floor: 4 lenses. Below 4 fired, exit with `target codebase too small for a tour — consider a single-pattern article instead`. Cap: 6 lenses. Above 6, pick the 6 with strongest quantitative signals; list the rest under `## Out of scope` for reviewer visibility.

## Subagent contracts

| Role | Tools | Input | Output |
|---|---|---|---|
| Research | `Read`, `Grep`, `Bash` (read-only on clone), `WebFetch` (verify pinned URLs only) | lens excerpt from `analysis.md`, lens heading, clone path, pinned tag | `<lens>.md` per-lens findings |
| Writer | `Read`, `Write` | all per-lens findings, template, locale=en, id, slug, studied_at | one EN article file |
| Translator | `Read`, `Write` | completed EN article | zh-TW article file |

Dispatch: 4-6 research subagents in parallel, one per fired lens.

## Red Flags — STOP

- "I'll skip the analysis pass; I know this codebase" — Pattern A. The skill's whole value is the deterministic analysis.
- "I'll let the writer pick lenses freely" — Pattern A. Lens selection MUST come from firing rules applied to analysis output.
- "I'll skip zh-TW" — Pattern A. Bilingual is non-negotiable.
- "I'll do inline polish with grep + Edit" — Pattern A. Invoke `polish-documents` skill.
- "I'll cite `main` or `HEAD` in source URLs" — Pattern A. Tour articles use commit-pinned URLs only.

## References

- Spec: `docs/superpowers/specs/2026-04-30-code-base-analytics-skill-design.md` (in each consumer repo).
- Related skills: `expanding-category-articles` (translator + polish reuse), `polish-documents` (Phase 7), `using-git-worktrees`.
````

- [ ] **Step 3: Verify file exists and is non-empty**

Run: `wc -l ~/.claude/skills/code-base-analytics/SKILL.md`

Expected: ~80 lines.

### Task 1.2: Write tour-article template

**Files:**
- Create: `~/.claude/skills/code-base-analytics/templates/tour-article.md`

- [ ] **Step 1: Write template file**

Create `~/.claude/skills/code-base-analytics/templates/tour-article.md` with this exact content:

````markdown
---
id: <ID>
title: "<Codebase> — Architecture Tour"
state: draft
slug: <kebab-slug>
studied_at: "<project> <version> (<YYYY-MM-DD>)"
---

# [FEE-<ID>] <Codebase> — Architecture Tour

:::info
<3-5 sentence hook. Names the codebase, the studied tag, the lenses covered, the single most distinctive architectural fact. Every claim must be backed by a finding in some per-lens findings doc.>
:::

## Context

<200-400 words. Codebase identity, history, why it's worth studying. Names the maintainers and the size of the public footprint. Each factual claim traces to the analysis or a per-lens finding.>

## Visual

<One Mermaid diagram OR one structured table. Tours default to a class-graph diagram or a module-map table because they cover many lenses. Use the `mermaid` fenced block if a diagram; otherwise a markdown table.>

```mermaid
<diagram>
```

## Example

<One concrete code citation, ≤30 lines, pulled verbatim from the pinned tag. Exemplifies the codebase's style — what the reader sees when they first open this codebase. Cite the file path and line range above the block.>

## <Lens 1>

<Named pattern in bold first sentence (2-4 words, memorable). Quantitative anchor from the analysis ("47 classes extend Object3D, max chain depth 4"). 2-3 commit-pinned source citations. Closes with:>

**What to look for elsewhere:** <recognition signals — what to grep for, which file structures to inspect, to spot the same pattern in other codebases>.

## <Lens 2>

<Same shape.>

[... 4-6 lenses total. Lenses with existing satellite articles: 300-500 words. Lenses without satellites: 600-900 words.]

## Design Thinking

<Optional. Trade-offs the codebase explicitly made. Each grounded in a finding.>

## Internal References

<Cross-links to satellite articles in this category and abstract pattern articles in FEE-500s. Markdown links to the slug URL (not the numeric id), unless the target is pre-slug.>

- [<Satellite article>](/en/Codebase%20Studies/<satellite-slug>)
- [<Abstract pattern>](/en/<category>/<slug>)

## References

<Commit-pinned URLs only. Format: `- <Author>, "<Title>," <Repo> at <tag> (<year>). <URL>`. Every URL must include `/blob/<tag>/...` or a matching SHA.>

- <Author>, "<Title>," <Repo> at <tag> (<year>). <URL>
````

- [ ] **Step 2: Verify**

Run: `wc -l ~/.claude/skills/code-base-analytics/templates/tour-article.md`

Expected: ~50 lines.

### Task 1.3: Write research subagent prompt

**Files:**
- Create: `~/.claude/skills/code-base-analytics/prompts/research-subagent.md`

- [ ] **Step 1: Write prompt file**

Create `~/.claude/skills/code-base-analytics/prompts/research-subagent.md` with this exact content:

````markdown
# Research subagent prompt — per-lens

You are a research subagent in the `code-base-analytics` pipeline. Your job is to produce ONE per-lens findings document for the lens you've been assigned.

## Inputs (provided by the controller)

- **Lens heading:** the `## <Lens>` heading the writer will use.
- **Lens excerpt from `analysis.md`:** the relevant section of the deterministic analysis (numbers, signals, file lists).
- **Clone path:** absolute path to the cloned repo at the pinned tag.
- **Pinned tag:** the git tag, e.g., `r172`.
- **Output path:** where to write your findings doc, e.g., `docs/superpowers/research/<slug>/<lens-slug>.md`.

## Your output

A markdown file at the output path with this structure:

```markdown
# Findings: <Lens heading>

## Named pattern

**<Pattern name in 2-4 words>**: one-sentence definition.

## Quantitative anchor

<The number(s) from the analysis output, restated with specific identifiers.>

Example: "Three.js's class graph has 312 `extends` edges. The universal base is `Object3D`, with 47 direct subclasses. The longest inheritance chain is depth 4: `Object3D → Mesh → SkinnedMesh → InstancedMesh`."

## Source citations

For each load-bearing claim, cite the actual file at the pinned tag:

- **Claim:** ...
  - **File:** `src/path/to/File.js`
  - **Lines:** L42-L78
  - **URL:** `https://github.com/<org>/<repo>/blob/<tag>/src/path/to/File.js#L42-L78`
  - **Pulled quote:** "..." (verbatim from source)

(Minimum 2, target 3 source citations.)

## What to look for elsewhere

A 1-2 sentence recognition signal: what to grep for, which file structures to inspect, to spot the same pattern in other codebases.
```

## Hard rules

- **Every claim cites either the analysis output (for numbers) or a specific file/line at the pinned tag (for source claims). No internal-knowledge filler.**
- Use the actual `Read` and `Grep` tools to verify each citation against the cloned repo.
- All URLs MUST be commit-pinned: `/blob/<tag>/...` (not `/main/`, not `/master/`, not `/HEAD/`).
- The named pattern is the article's handle. 2-4 words. Memorable. Bold on first appearance.
- The "what to look for elsewhere" bullet is the recognition transfer. It is the actionable takeaway.

## Process

1. Read the lens excerpt from `analysis.md` to understand what the analysis surfaced.
2. Read the cloned repo's relevant files at the pinned tag to verify each claim.
3. Compose findings according to the structure above.
4. Write the file to the output path.
5. Reply with:
   - Path written
   - Number of source citations
   - Any analysis number you could NOT verify against source (these need writer judgment).
````

- [ ] **Step 2: Verify**

Run: `wc -l ~/.claude/skills/code-base-analytics/prompts/research-subagent.md`

Expected: ~50 lines.

### Task 1.4: Write writer subagent prompt

**Files:**
- Create: `~/.claude/skills/code-base-analytics/prompts/writer-subagent.md`

- [ ] **Step 1: Write prompt file**

Create `~/.claude/skills/code-base-analytics/prompts/writer-subagent.md` with this exact content:

````markdown
# Writer subagent prompt — tour article

You are the writer subagent in the `code-base-analytics` pipeline. Your job is to compose ONE EN architecture tour article from N per-lens findings docs.

## Inputs (provided by the controller)

- **All N per-lens findings docs:** absolute paths.
- **Template:** `~/.claude/skills/code-base-analytics/templates/tour-article.md`.
- **Locale:** `en`.
- **Assigned FEE id, slug, studied_at:** from the invocation.
- **Output path:** `docs/en/Codebase Studies/<slug>.md`.

## Your output

One EN article file at the output path, following the template VERBATIM.

## Section budgets

- `:::info` hook: 3-5 sentences. Includes the studied tag.
- `## Context`: 200-400 words. Codebase identity, why it's worth studying.
- `## Visual`: one Mermaid diagram OR one structured table.
- `## Example`: one code citation ≤30 lines pulled from the pinned tag, with file path + line range above the block.
- `## <Lens 1>` … `## <Lens N>`: 4-6 sections.
  - 300-500 words if a satellite article exists for this lens (cross-link to satellite for depth).
  - 600-900 words if no satellite (full single-pattern treatment inside the tour).
  - Each ends with `**What to look for elsewhere:** <recognition signals>`.
- `## Design Thinking` (optional): trade-offs the codebase explicitly made.
- `## Internal References`: cross-links to satellites + abstract pattern articles in FEE-500s.
- `## References`: commit-pinned URLs only.

## Hard rules (verbatim)

> Any claim not in some per-lens findings doc MUST NOT appear in the article. Do not add internal knowledge. Do not invent citations. Every URL in your References section must come from one of the per-lens findings docs.
>
> Use the template VERBATIM. Do NOT read existing category articles to infer structure. The template is canonical.
>
> Style prohibitions (user's global CLAUDE.md):
> - No contrastive negation ("not X but Y")
> - No em-dash chains of filler
> - No unanchored superlatives
> - No puffery preambles ("the core insight:", "the key takeaway:")
> - No undefined modifiers
> - No "可以 X 可以 Y 可以 Z" stacking
>
> Tour articles do NOT have a `## Best Practices` section. The recognition transfer lives inline as the closing "what to look for elsewhere" bullet on each lens.
>
> All URLs in `## References` MUST be commit-pinned: `/blob/<tag>/...` (not `/main/`, not `/master/`, not `/HEAD/`).
>
> Markdown safety: never use backtick code spans for inline code containing `{{ }}` (use `<code v-pre>...</code>` instead, per the project's CLAUDE.md).

## Process

1. Read the template file.
2. Read all N per-lens findings docs.
3. Read the project's `CLAUDE.md` for FEE-specific conventions.
4. Compose the article respecting every rule above. The lens order in the article matches the order in `lenses.md` (provided by controller).
5. Write the file to the output path.
6. Reply with:
   - Path written
   - Section headings used (in order)
   - Number of `## <Lens>` sections
   - Number of References entries
   - Any findings claim that did NOT make it into the article and why.
````

- [ ] **Step 2: Verify**

Run: `wc -l ~/.claude/skills/code-base-analytics/prompts/writer-subagent.md`

Expected: ~70 lines.

### Task 1.5: Vendor translator prompt from `expanding-category-articles`

**Files:**
- Create: `~/.claude/skills/code-base-analytics/prompts/translator-subagent.md`

- [ ] **Step 1: Locate the existing translator instructions**

Run:

```bash
grep -A 20 "Translator rules" ~/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: the verbatim translator-rules block from the existing skill (5-7 bullet lines).

- [ ] **Step 2: Write the translator prompt file**

Create `~/.claude/skills/code-base-analytics/prompts/translator-subagent.md` with this exact content:

````markdown
# Translator subagent prompt — zh-TW counterpart

You are the translator subagent in the `code-base-analytics` pipeline. Your job is to translate ONE completed EN tour article to zh-TW.

## Inputs

- **EN article:** `docs/en/Codebase Studies/<slug>.md`
- **Output path:** `docs/zh-tw/Codebase Studies/<slug>.md`

## Hard rules (verbatim from `expanding-category-articles`, augmented for tour shape)

> - Preserve heading hierarchy exactly (count and levels match).
> - Preserve Mermaid diagram count and position; translate node label text only.
> - Preserve non-Mermaid code blocks verbatim (variable names, error messages, identifiers, type names, API names stay in English).
> - Preserve every URL verbatim; translate inline anchor text.
> - Preserve frontmatter `id`, `slug`, and `studied_at`; translate `title` naturally.
> - Preserve `:::info` blocks; translate the prose inside.
> - Preserve table structure (column count, alignment); translate cell prose where applicable; technical identifiers stay English.

## Section header map

- Context → 背景
- Visual → 視覺對比
- Example → 範例
- Design Thinking → 設計思維
- Internal References → 延伸閱讀
- References → 參考資料

Lens headings are author-specific. Translate naturally (e.g., `## Class Hierarchy & Inheritance` → 「## 類別層級與繼承」). The `**What to look for elsewhere:**` bullet at the end of each lens translates to `**在其他程式碼中如何辨認：**`.

## Style prohibitions (zh-TW, user's global CLAUDE.md)

- 不使用「不是 X，而是 Y」對比否定
- 不使用「是 A，不是 B」無意義對比
- 不使用「說得很清楚」自我標榜
- 不使用破折號串接冗語
- 不使用未定義的模糊形容詞
- 不使用未指明受詞的動詞
- 不使用「可以 X 可以 Y 可以 Z」排比

## Process

1. Read the EN article (full).
2. Translate section by section, preserving structure.
3. Write the zh-TW file to the output path.
4. Reply with: path, heading count match, URL count preserved, any translation difficulties.
````

- [ ] **Step 3: Verify**

Run: `wc -l ~/.claude/skills/code-base-analytics/prompts/translator-subagent.md`

Expected: ~50 lines.

### Task 1.6: Commit Phase 1 scaffolding

- [ ] **Step 1: Commit**

The skill files live in `~/.claude/skills/`, OUTSIDE the FEE repo. They are user-global. There is no commit needed inside the FEE repo for these files — they are tracked separately by the user's claude config.

Confirm files exist:

```bash
ls -R ~/.claude/skills/code-base-analytics/
```

Expected output:

```
SKILL.md  prompts/  scripts/  templates/

prompts:
research-subagent.md  translator-subagent.md  writer-subagent.md

scripts:

templates:
tour-article.md
```

(Scripts dir is empty until Phase 2.)

---

## Phase 2: Scripts

### Task 2.1: Write `clone-target.sh`

**Files:**
- Create: `~/.claude/skills/code-base-analytics/scripts/clone-target.sh`

- [ ] **Step 1: Write the script**

Create `~/.claude/skills/code-base-analytics/scripts/clone-target.sh` with this content:

```bash
#!/usr/bin/env bash
# Usage: clone-target.sh <github-url> <tag> <output-dir>
# Performs a shallow clone of <github-url> at <tag> into <output-dir>.
# Exits 0 on success, 1 on bad input, 2 on clone failure.

set -euo pipefail

url="${1:?Usage: clone-target.sh <github-url> <tag> <output-dir>}"
tag="${2:?Usage: clone-target.sh <github-url> <tag> <output-dir>}"
out="${3:?Usage: clone-target.sh <github-url> <tag> <output-dir>}"

if [[ -d "$out" ]]; then
    echo "Output dir already exists: $out" >&2
    echo "Remove it first or pick a different path." >&2
    exit 1
fi

mkdir -p "$(dirname "$out")"

echo "Cloning $url at $tag into $out (shallow)..."

if ! git clone --depth 1 --branch "$tag" "$url" "$out" 2>&1; then
    echo "Clone failed. Verify the URL and tag exist." >&2
    exit 2
fi

# Verify the tag is checked out
cd "$out"
checked_tag=$(git describe --tags --exact-match 2>/dev/null || echo "<no-tag>")
if [[ "$checked_tag" != "$tag" ]]; then
    echo "Warning: HEAD is not exactly tagged $tag (got: $checked_tag)" >&2
fi

echo "Clone OK at: $out (tag: $checked_tag)"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/.claude/skills/code-base-analytics/scripts/clone-target.sh
```

- [ ] **Step 3: Smoke-test against a small public repo**

Run:

```bash
TMPDIR=$(mktemp -d)
~/.claude/skills/code-base-analytics/scripts/clone-target.sh https://github.com/sindresorhus/is.git v6.3.0 "$TMPDIR/is-test"
ls "$TMPDIR/is-test/source/" | head
rm -rf "$TMPDIR"
```

Expected: clone succeeds, `Clone OK at: $TMPDIR/is-test (tag: v6.3.0)`, ls shows source files.

### Task 2.2: Write `analyze-codebase.sh`

**Files:**
- Create: `~/.claude/skills/code-base-analytics/scripts/analyze-codebase.sh`

This is the meatiest script. It produces `analysis.md` and `analysis.json`.

- [ ] **Step 1: Write the script**

Create `~/.claude/skills/code-base-analytics/scripts/analyze-codebase.sh` with this content:

```bash
#!/usr/bin/env bash
# Usage: analyze-codebase.sh <clone-dir> <output-dir>
# Runs a deterministic structural analysis on the cloned repo.
# Produces: <output-dir>/analysis.md and <output-dir>/analysis.json.

set -euo pipefail

clone="${1:?Usage: analyze-codebase.sh <clone-dir> <output-dir>}"
out="${2:?Usage: analyze-codebase.sh <clone-dir> <output-dir>}"

mkdir -p "$out"

# Locate source root: prefer src/, fall back to lib/, src-tauri/, packages/, or repo root.
src_root="$clone"
for candidate in src lib src-tauri packages; do
    if [[ -d "$clone/$candidate" ]]; then
        src_root="$clone/$candidate"
        break
    fi
done

# --- Repo shape ---
total_files=$(find "$src_root" -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.go' -o -name '*.py' -o -name '*.rs' \) | wc -l | xargs)
top_dirs=$(find "$src_root" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
top_dir_count=$(echo "$top_dirs" | grep -c . || echo 0)

# Lines of code per file, top 20 biggest
top_files=$(find "$src_root" -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.ts' -o -name '*.tsx' -o -name '*.go' -o -name '*.py' -o -name '*.rs' \) -exec wc -l {} \; 2>/dev/null | sort -rn | head -20 | awk '{ sub(/.*\//, "src/", $2); print $1 " " $2 }')

# Git metadata
cd "$clone"
license=$( [[ -f LICENSE ]] && head -1 LICENSE || echo "no LICENSE file at root")
first_commit=$(git log --reverse --format=%aI 2>/dev/null | head -1)
latest_commit=$(git log --format=%aI 2>/dev/null | head -1)
total_commits=$(git rev-list --count HEAD 2>/dev/null || echo "?")
all_tags=$(git tag --list --sort=-v:refname 2>/dev/null | head -10 || echo "")
cd - >/dev/null

# --- Class graph ---
extends_lines=$(grep -rE '^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?class[[:space:]]+[A-Za-z_][A-Za-z0-9_]*[[:space:]]+extends[[:space:]]+[A-Za-z_][A-Za-z0-9_]*' "$src_root" 2>/dev/null || true)
extends_count=$(echo "$extends_lines" | grep -c . 2>/dev/null || echo 0)

# Adjacency list: child parent (one per line)
echo "$extends_lines" | sed -nE 's/.*class[[:space:]]+([A-Za-z_][A-Za-z0-9_]*)[[:space:]]+extends[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\1 \2/p' | sort -u > "$out/extends-edges.txt"

# Universal base: most-extended class (the parent appearing most often)
universal_base=""
universal_base_count=0
if [[ -s "$out/extends-edges.txt" ]]; then
    universal_base=$(awk '{print $2}' "$out/extends-edges.txt" | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
    universal_base_count=$(awk -v b="$universal_base" '$2 == b' "$out/extends-edges.txt" | wc -l | xargs)
fi

# Max chain depth via simple iterative DFS over the edge list
max_depth=0
longest_chain=""
if [[ -s "$out/extends-edges.txt" ]]; then
    # awk computes depth from each leaf class up to a class with no parent in the graph
    read -r max_depth longest_chain <<< $(awk '
        { parent[$1]=$2; classes[$1]=1; classes[$2]=1 }
        END {
            for (c in classes) {
                d=0; chain=c; cur=c;
                while (parent[cur]) {
                    cur=parent[cur]; d++; chain=chain " -> " cur;
                    if (d > 20) break  # cycle guard
                }
                if (d > max_d) { max_d=d; max_chain=chain }
            }
            print max_d, max_chain
        }
    ' "$out/extends-edges.txt")
fi

# --- Modules ---
# Top-level entry: package.json "main" or "exports", else common entry filenames
entry_file=""
if [[ -f "$clone/package.json" ]]; then
    entry_file=$(node -e "
        try {
            const pkg = require('$clone/package.json');
            console.log(pkg.module || pkg.main || (pkg.exports && (typeof pkg.exports === 'string' ? pkg.exports : pkg.exports['.'])) || '');
        } catch(e) { console.log(''); }
    " 2>/dev/null || echo "")
fi
# Fallback: look for src/index.js, src/Three.js, etc.
if [[ -z "$entry_file" ]]; then
    for fn in index.js index.ts main.js Three.js; do
        if [[ -f "$src_root/$fn" ]]; then entry_file="$fn"; break; fi
    done
fi

entry_exports_count=0
if [[ -n "$entry_file" ]] && [[ -f "$clone/$entry_file" ]]; then
    entry_exports_count=$(grep -cE '^export[[:space:]]' "$clone/$entry_file" 2>/dev/null || echo 0)
elif [[ -n "$entry_file" ]] && [[ -f "$src_root/$entry_file" ]]; then
    entry_exports_count=$(grep -cE '^export[[:space:]]' "$src_root/$entry_file" 2>/dev/null || echo 0)
fi

# File-naming clusters (a cluster = a prefix of >=3 files starting with the same capitalized prefix)
naming_clusters=$(find "$src_root" -type f \( -name '*.js' -o -name '*.ts' \) -exec basename {} \; 2>/dev/null \
    | grep -oE '^[A-Z][A-Za-z]+' \
    | sort | uniq -c | awk '$1 >= 3 { print $1 " " $2 }' | sort -rn | head -10)

# --- Hot path heuristics ---
hot_keyword_hits=$(grep -rE 'function (render|tick|update|step|loop)|^\s*(render|tick|update|step|loop)[[:space:]]*\(' "$src_root" 2>/dev/null | wc -l | xargs)

# --- Extension points ---
ext_keyword_hits=$(grep -rE 'function (register|use|extend|addPlugin)|^\s*(register|use|extend|addPlugin)[A-Z][[:space:]]*\(' "$src_root" 2>/dev/null | wc -l | xargs)
ext_dir_present="no"
for d in plugins extensions addons; do
    if [[ -d "$src_root/$d" ]]; then ext_dir_present="yes ($d)"; break; fi
done

# --- Resource lifecycle ---
dispose_hits=$(grep -rE '\.(dispose|destroy|release|close)[[:space:]]*\(|^\s*(dispose|destroy|release|close)[[:space:]]*\(' "$src_root" 2>/dev/null | wc -l | xargs)

# --- Build/test ---
test_dirs=$(find "$clone" -mindepth 1 -maxdepth 3 -type d \( -name test -o -name tests -o -name __tests__ -o -name spec \) 2>/dev/null | wc -l | xargs)
package_scripts="0"
if [[ -f "$clone/package.json" ]]; then
    package_scripts=$(node -e "try { console.log(Object.keys(require('$clone/package.json').scripts || {}).length); } catch(e) { console.log(0); }" 2>/dev/null || echo 0)
fi

# --- Write analysis.md ---
cat > "$out/analysis.md" <<MD
# Codebase analysis

**Clone:** $clone
**Source root:** $src_root

## Repo shape

- Source files (js/ts/go/py/rs): $total_files
- Top-level subdirs of source root: $top_dir_count ($top_dirs)
- License: $license
- First commit: $first_commit
- Latest commit: $latest_commit
- Total commits: $total_commits
- Recent tags: $(echo "$all_tags" | head -5 | tr '\n' ' ')

### Top 20 biggest source files

\`\`\`
$top_files
\`\`\`

## Class graph

- Total \`extends\` edges: $extends_count
- Universal base: \`$universal_base\` ($universal_base_count direct subclasses)
- Max chain depth: $max_depth
- Longest chain: \`$longest_chain\`

(Full edge list at \`extends-edges.txt\`.)

## Modules

- Entry file: $entry_file
- Top-level exports from entry: $entry_exports_count

### File-naming clusters (≥3 files sharing a prefix)

\`\`\`
$naming_clusters
\`\`\`

## Hot path heuristics

- Function/method hits for render|tick|update|step|loop: $hot_keyword_hits

## Extension points

- register/use/extend/addPlugin function hits: $ext_keyword_hits
- Dedicated plugin/extension/addon dir: $ext_dir_present

## Resource lifecycle

- dispose/destroy/release/close call sites: $dispose_hits

## Build & test

- \`package.json\` scripts: $package_scripts
- Test directories detected: $test_dirs
MD

# --- Write analysis.json ---
cat > "$out/analysis.json" <<JSON
{
  "clone": "$clone",
  "src_root": "$src_root",
  "repo_shape": {
    "total_source_files": $total_files,
    "top_dir_count": $top_dir_count,
    "license": "$license",
    "first_commit": "$first_commit",
    "latest_commit": "$latest_commit",
    "total_commits": "$total_commits"
  },
  "class_graph": {
    "extends_count": $extends_count,
    "universal_base": "$universal_base",
    "universal_base_subclass_count": $universal_base_count,
    "max_chain_depth": $max_depth,
    "longest_chain": "$longest_chain"
  },
  "modules": {
    "entry_file": "$entry_file",
    "entry_exports_count": $entry_exports_count
  },
  "hot_path": {
    "keyword_hits": $hot_keyword_hits
  },
  "extension_points": {
    "keyword_hits": $ext_keyword_hits,
    "dedicated_dir": "$ext_dir_present"
  },
  "resource_lifecycle": {
    "dispose_hits": $dispose_hits
  },
  "build_test": {
    "package_scripts": $package_scripts,
    "test_dirs": $test_dirs
  }
}
JSON

echo "Analysis written: $out/analysis.md, $out/analysis.json"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/.claude/skills/code-base-analytics/scripts/analyze-codebase.sh
```

- [ ] **Step 3: Test on a known fixture (Three.js shallow clone)**

Run:

```bash
TMPDIR=$(mktemp -d)
~/.claude/skills/code-base-analytics/scripts/clone-target.sh https://github.com/mrdoob/three.js.git r172 "$TMPDIR/three"
~/.claude/skills/code-base-analytics/scripts/analyze-codebase.sh "$TMPDIR/three" "$TMPDIR/analysis"
cat "$TMPDIR/analysis/analysis.md"
```

Expected: `analysis.md` shows non-zero `extends` count (Three.js has hundreds), a universal base name (likely `Object3D` or `EventDispatcher`), max chain depth ≥ 2.

Acceptance criteria for the analyzer (verify by reading the output):

- `extends_count` ≥ 30
- `universal_base` is `Object3D` (or another class with ≥ 5 direct children — let the data speak)
- `max_chain_depth` ≥ 2
- `total_source_files` > 100
- `top_dir_count` between 5 and 25

If any of these are off, debug the analyzer until they make sense for Three.js.

- [ ] **Step 4: Cleanup test artifacts**

```bash
rm -rf "$TMPDIR"
```

### Task 2.3: Vendor and patch `validate-frontmatter.sh` (require `studied_at`)

**Files:**
- Create: `~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh`

- [ ] **Step 1: Copy the existing script as a starting point**

```bash
cp ~/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh \
   ~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh
```

- [ ] **Step 2: Patch to require `studied_at`**

Edit `~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh`. Find the line:

```bash
for field in id title state slug; do
```

Change to:

```bash
for field in id title state slug studied_at; do
```

That's the only change.

- [ ] **Step 3: Make executable**

```bash
chmod +x ~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh
```

- [ ] **Step 4: Test against the renumbered FEE-1810 article (which has `studied_at`)**

```bash
~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh \
  "/Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/en/Codebase Studies/threejs-dispose-lifecycle.md"
```

Expected: `frontmatter OK (id=1810, slug=threejs-dispose-lifecycle, state=draft)`.

- [ ] **Step 5: Test against an article WITHOUT `studied_at` (should fail)**

```bash
~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh \
  "/Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/en/Progressive Web Apps and Offline/opfs.md"
```

Expected: `missing required frontmatter field 'studied_at'`, exit code 1.

### Task 2.4: Write `validate-tour-citations.sh`

**Files:**
- Create: `~/.claude/skills/code-base-analytics/scripts/validate-tour-citations.sh`

- [ ] **Step 1: Write the script**

Create `~/.claude/skills/code-base-analytics/scripts/validate-tour-citations.sh` with this content:

```bash
#!/usr/bin/env bash
# Usage: validate-tour-citations.sh <markdown-file> <studied-tag>
# Asserts that every "## " section other than canonical ones contains at least one URL
# matching /blob/<studied-tag>/... format.
# Exit 0 if all lens sections cite at least one pinned URL. Exit 1 otherwise.

set -euo pipefail

file="${1:?Usage: validate-tour-citations.sh <file.md> <studied-tag>}"
tag="${2:?Usage: validate-tour-citations.sh <file.md> <studied-tag>}"

if [[ ! -f "$file" ]]; then
    echo "Error: file not found: $file" >&2
    exit 2
fi

# Canonical sections that don't need a citation:
canonical='^## (Context|Visual|Example|Design Thinking|Internal References|References|Changelog|Out of scope)[[:space:]]*$'

# Extract lens sections: each "## <heading>" until next "## " or EOF.
awk -v tag="$tag" -v canonical="$canonical" '
    /^## / {
        if (current && !is_canonical) {
            sections[current] = body
        }
        current = $0
        body = ""
        is_canonical = (match(current, canonical) > 0)
        next
    }
    {
        body = body "\n" $0
    }
    END {
        if (current && !is_canonical) {
            sections[current] = body
        }
        bad = 0
        for (s in sections) {
            if (sections[s] ~ ("/blob/" tag "/") || sections[s] ~ "github.com/[^/]+/[^/]+/(commit|tree|blob)/[a-f0-9]+") {
                ok++
            } else {
                print "Lens section without commit-pinned citation: " s > "/dev/stderr"
                bad++
            }
        }
        if (bad > 0) exit 1
        print "Tour citations OK: " ok " lens section(s) each have at least one /blob/" tag "/ URL"
    }
' "$file"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/.claude/skills/code-base-analytics/scripts/validate-tour-citations.sh
```

- [ ] **Step 3: Test against the renumbered FEE-1810 article**

```bash
~/.claude/skills/code-base-analytics/scripts/validate-tour-citations.sh \
  "/Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/en/Codebase Studies/threejs-dispose-lifecycle.md" \
  r172
```

Expected: `Tour citations OK: 1 lens section(s) each have at least one /blob/r172/ URL` (the satellite has one topic-specific section: `## The Dispose Lifecycle Contract`).

### Task 2.5: Verify all scripts are present and executable

- [ ] **Step 1: Inventory**

```bash
ls -la ~/.claude/skills/code-base-analytics/scripts/
```

Expected: 4 files, all executable (`-rwxr-xr-x`):

- `analyze-codebase.sh`
- `clone-target.sh`
- `validate-frontmatter.sh`
- `validate-tour-citations.sh`

---

## Phase 3: Three.js Architecture Tour invocation

This phase invokes the skill end-to-end on Three.js. It produces FEE-1801 = Three.js Architecture Tour.

### Task 3.1: Clone Three.js at r172

- [ ] **Step 1: Clone**

From the worktree:

```bash
cd /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics
mkdir -p .worktrees/code-base-studies/clones
~/.claude/skills/code-base-analytics/scripts/clone-target.sh \
  https://github.com/mrdoob/three.js.git r172 \
  .worktrees/code-base-studies/clones/three
```

Expected: `Clone OK at: .worktrees/code-base-studies/clones/three (tag: r172)`.

- [ ] **Step 2: Confirm `.worktrees/` is gitignored** (already so for FEE; verify)

Run: `git check-ignore -v .worktrees/code-base-studies/clones/three/`

Expected: matches a `.gitignore` rule. If not, add `.worktrees/` to `.gitignore` and commit (Jesse rule: fix broken things immediately).

### Task 3.2: Run the analyzer on Three.js

- [ ] **Step 1: Create research output directory**

```bash
mkdir -p docs/superpowers/research/threejs-architecture-tour
```

- [ ] **Step 2: Run analyzer**

```bash
~/.claude/skills/code-base-analytics/scripts/analyze-codebase.sh \
  .worktrees/code-base-studies/clones/three \
  docs/superpowers/research/threejs-architecture-tour
```

Expected: `Analysis written: docs/superpowers/research/threejs-architecture-tour/analysis.md, .../analysis.json`.

- [ ] **Step 3: Eyeball the analysis output**

```bash
cat docs/superpowers/research/threejs-architecture-tour/analysis.md
```

Expected (illustrative, real numbers will differ):

- `extends` edges: > 100
- universal base: `Object3D` or `EventDispatcher`, with > 10 direct subclasses
- max chain depth: ≥ 3
- top dirs include: `core`, `renderers`, `materials`, `lights`, `cameras`, `objects`, `loaders`
- entry file: something like `Three.js`

### Task 3.3: Lens selection (controller decision)

The controller (the human running this plan, or the executor agent) reads `analysis.md` and applies the firing rules from `SKILL.md`.

- [ ] **Step 1: Apply firing rules**

For each lens, check the threshold against the analysis numbers. Expected outcome for Three.js (illustrative):

| Lens | Fires? | Why |
|---|---|---|
| Class Hierarchy & Inheritance | YES | extends edges > 30, universal base > 5 children |
| Module Decomposition | YES | source files > 100, top dirs in 5-25 range |
| Public API Surface | YES | entry exports > 50 |
| Hot Path / Render Loop | YES | render-keyword cluster fires; `WebGLRenderer.render()` exists |
| Extension Points | maybe | check `loaders/`, `addons/`; depend on signal strength |
| Build & Test Layout | maybe | depends on `package.json` scripts count |
| Resource Lifecycle | YES | many `dispose()` symbols, none on `Object3D` |

If 5+ fire, pick the strongest 5. If exactly 4 fire, take all 4. If <4 fire, debug the analyzer.

- [ ] **Step 2: Write `lenses.md`**

Create `docs/superpowers/research/threejs-architecture-tour/lenses.md` with this structure:

```markdown
# Lenses for Three.js Architecture Tour

## Fired (covered in the article)

1. `## Class Hierarchy & Inheritance` — anchor: <num> extends edges, universal base `Object3D` with <num> direct subclasses, max chain depth <num>.
2. `## Module Decomposition` — anchor: <num> source files across <num> top-level dirs.
3. `## Public API Surface` — anchor: <num> top-level exports.
4. `## Hot Path / Render Loop` — anchor: `WebGLRenderer.render()` and the per-frame call structure.
5. `## Resource Lifecycle Contract` — anchor: <num> dispose call sites; satellite article exists at FEE-1810 (cross-link, shorter section).

## Did not fire

- Extension Points: keyword hits <num>, threshold not cleared.
- Build & Test Layout: package scripts <num>, threshold not cleared.

(Adjust based on actual analysis numbers.)
```

- [ ] **Step 3: Commit the analysis artifacts**

```bash
git add docs/superpowers/research/threejs-architecture-tour/
git commit -m "research(threejs-architecture-tour): analyze Three.js r172 and select lenses"
```

### Task 3.4: Dispatch research subagents (per lens, parallel)

For each fired lens, dispatch a research subagent in parallel.

- [ ] **Step 1: Dispatch all research subagents in one tool-use round**

For each lens, send an Agent invocation (general-purpose) with:

- The prompt from `~/.claude/skills/code-base-analytics/prompts/research-subagent.md` rendered in.
- The lens excerpt from `analysis.md`.
- Clone path: `.worktrees/code-base-studies/clones/three`.
- Pinned tag: `r172`.
- Output path: `docs/superpowers/research/threejs-architecture-tour/<lens-slug>.md` where `<lens-slug>` is kebab-case of the lens heading.

Example dispatch for the Class Hierarchy lens:

```
Agent({
  description: "Research lens: Three.js class hierarchy",
  subagent_type: "general-purpose",
  prompt: """
You are a research subagent in the code-base-analytics pipeline.

[render full prompt from ~/.claude/skills/code-base-analytics/prompts/research-subagent.md here]

Inputs:
- Lens heading: ## Class Hierarchy & Inheritance
- Lens excerpt from analysis.md: [paste the relevant section]
- Clone path: /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/.worktrees/code-base-studies/clones/three
- Pinned tag: r172
- Output path: /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/superpowers/research/threejs-architecture-tour/class-hierarchy-and-inheritance.md

Begin.
"""
})
```

Dispatch one Agent call per fired lens, all in a single tool-use message (parallel).

- [ ] **Step 2: Verify all per-lens findings docs exist**

```bash
ls docs/superpowers/research/threejs-architecture-tour/*.md
```

Expected: `analysis.md`, `lenses.md`, plus one `<lens-slug>.md` per fired lens (4-6 total).

- [ ] **Step 3: Smoke-check the findings docs**

```bash
for f in docs/superpowers/research/threejs-architecture-tour/*.md; do
    echo "=== $f ==="
    grep -c "/blob/r172/" "$f" || echo 0
done
```

Expected: each per-lens findings doc has ≥ 2 URLs containing `/blob/r172/`.

### Task 3.5: Dispatch writer subagent (EN tour article)

- [ ] **Step 1: Dispatch writer subagent**

```
Agent({
  description: "Write Three.js Architecture Tour EN",
  subagent_type: "general-purpose",
  prompt: """
You are the writer subagent in the code-base-analytics pipeline.

[render full prompt from ~/.claude/skills/code-base-analytics/prompts/writer-subagent.md here]

Inputs:
- Per-lens findings docs (paths):
  [list each <lens-slug>.md path]
- Template: ~/.claude/skills/code-base-analytics/templates/tour-article.md
- Locale: en
- Assigned FEE id: 1801
- Slug: threejs-architecture-tour
- studied_at: "three.js r172 (2025-04-15)"
- Output path: /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/en/Codebase Studies/threejs-architecture-tour.md

Project conventions: read /Users/alive/Projects/frontend-engineering-essentials/CLAUDE.md.

Begin.
"""
})
```

- [ ] **Step 2: Verify EN article exists and has the right shape**

```bash
ls -la "docs/en/Codebase Studies/threejs-architecture-tour.md"
grep "^## " "docs/en/Codebase Studies/threejs-architecture-tour.md"
```

Expected: file present, headings include `## Context`, `## Visual`, `## Example`, 4-6 lens sections, `## Internal References`, `## References`, optional `## Design Thinking`. NO `## Best Practices`.

### Task 3.6: Dispatch translator subagent (zh-TW)

- [ ] **Step 1: Dispatch translator subagent**

```
Agent({
  description: "Translate Three.js Architecture Tour to zh-TW",
  subagent_type: "general-purpose",
  prompt: """
You are the translator subagent in the code-base-analytics pipeline.

[render full prompt from ~/.claude/skills/code-base-analytics/prompts/translator-subagent.md here]

Inputs:
- EN article: /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/en/Codebase Studies/threejs-architecture-tour.md
- Output path: /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/zh-tw/Codebase Studies/threejs-architecture-tour.md

Begin.
"""
})
```

- [ ] **Step 2: Verify zh-TW article exists**

```bash
ls -la "docs/zh-tw/Codebase Studies/threejs-architecture-tour.md"
diff <(grep "^## " "docs/en/Codebase Studies/threejs-architecture-tour.md" | wc -l) \
     <(grep "^## " "docs/zh-tw/Codebase Studies/threejs-architecture-tour.md" | wc -l)
```

Expected: zh-TW present; heading count matches EN exactly.

### Task 3.7: Polish EN and zh-TW

- [ ] **Step 1: Polish EN**

```
Skill(polish-documents, /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/en/Codebase Studies/threejs-architecture-tour.md)
```

- [ ] **Step 2: Polish zh-TW**

```
Skill(polish-documents, /Users/alive/Projects/frontend-engineering-essentials/.worktrees/build-code-base-analytics/docs/zh-tw/Codebase Studies/threejs-architecture-tour.md)
```

Accept the polish skill's summary output for each. Any `Skipped (needs author input)` items get noted in the eventual commit body if non-trivial.

### Task 3.8: Run all gates

- [ ] **Step 1: Frontmatter (both files)**

```bash
~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh \
  "docs/en/Codebase Studies/threejs-architecture-tour.md"
~/.claude/skills/code-base-analytics/scripts/validate-frontmatter.sh \
  "docs/zh-tw/Codebase Studies/threejs-architecture-tour.md"
```

Expected: both report `frontmatter OK (id=1801, ...)`.

- [ ] **Step 2: Structure (both files)**

```bash
bash ~/.claude/skills/expanding-category-articles/scripts/validate-structure.sh \
  "docs/en/Codebase Studies/threejs-architecture-tour.md"
bash ~/.claude/skills/expanding-category-articles/scripts/validate-structure.sh \
  "docs/zh-tw/Codebase Studies/threejs-architecture-tour.md"
```

Expected: both report `structure OK (N topic-specific section(s))` where N is at least the number of fired lenses.

- [ ] **Step 3: References (EN)**

```bash
bash ~/.claude/skills/expanding-category-articles/scripts/check-references.sh \
  "docs/en/Codebase Studies/threejs-architecture-tour.md"
```

Expected: `all N reference URLs OK`. Known false positives (caniuse 302, npm 403, apple 404 on HEAD) are project-accepted; do not block on those.

- [ ] **Step 4: Tour citations (EN)**

```bash
~/.claude/skills/code-base-analytics/scripts/validate-tour-citations.sh \
  "docs/en/Codebase Studies/threejs-architecture-tour.md" r172
```

Expected: `Tour citations OK: N lens section(s) each have at least one /blob/r172/ URL` (N = number of fired lenses).

- [ ] **Step 5: Findings coverage**

For each per-lens findings doc, check that ≥ 2 of its URLs appear in the article's `## References` section:

```bash
ARTICLE="docs/en/Codebase Studies/threejs-architecture-tour.md"
ARTICLE_REFS=$(awk '/^## References/,/^## [^R]/' "$ARTICLE" | grep -oE 'https?://[^[:space:])"]+' | sort -u)
for f in docs/superpowers/research/threejs-architecture-tour/*.md; do
    [[ "$(basename "$f")" =~ ^(analysis|lenses)\.md$ ]] && continue
    SHARED=$(grep -oE 'https?://[^[:space:])"]+' "$f" | sort -u | comm -12 - <(echo "$ARTICLE_REFS") | wc -l | xargs)
    echo "$(basename "$f"): $SHARED shared URLs"
done
```

Expected: every lens findings doc shares ≥ 2 URLs with the article's References.

- [ ] **Step 6: ID uniqueness**

```bash
grep -hE '^id: ' docs/en/Codebase\ Studies/*.md | sort | uniq -c | sort -rn | head
```

Expected: each `id:` value appears exactly once.

### Task 3.9: Commit FEE-1801 = Three.js Architecture Tour

- [ ] **Step 1: Commit article + research artifacts**

```bash
git add "docs/en/Codebase Studies/threejs-architecture-tour.md" \
        "docs/zh-tw/Codebase Studies/threejs-architecture-tour.md" \
        docs/superpowers/research/threejs-architecture-tour/
git commit -m "docs(codebase-studies): add Three.js Architecture Tour (FEE-1801)"
```

- [ ] **Step 2: Verify**

```bash
git log -1 --stat
```

Expected: commit landed, multiple files added (the article + per-lens findings + analysis artifacts).

### Task 3.10: Regenerate sidebar

- [ ] **Step 1: Build**

```bash
pnpm install   # if not already installed in the worktree
pnpm docs:build
```

Expected: build completes; `docs/en/list.md` and `docs/zh-tw/list.md` updated.

- [ ] **Step 2: Verify list.md picked up the changes**

```bash
grep -E "1801|1810" docs/en/list.md
```

Expected: a line for FEE-1801 (`Three.js — Architecture Tour`) and a line for FEE-1810 (`Three.js — The Dispose Lifecycle Contract`).

- [ ] **Step 3: Commit list.md regen**

```bash
git add docs/en/list.md docs/zh-tw/list.md
git commit -m "docs(list): regenerate sidebar for FEE-1801 (Three.js Architecture Tour) and FEE-1810 reframe"
```

### Task 3.11: Final sanity check

- [ ] **Step 1: Inspect the branch's commit history**

```bash
git log --oneline main..HEAD
```

Expected (in chronological order):

1. `docs(codebase-studies): reframe FEE-1801 dispose lifecycle as satellite FEE-1810`
2. `research(threejs-architecture-tour): analyze Three.js r172 and select lenses`
3. `docs(codebase-studies): add Three.js Architecture Tour (FEE-1801)`
4. `docs(list): regenerate sidebar for FEE-1801 (Three.js Architecture Tour) and FEE-1810 reframe`

Plus possibly a `chore(gitignore): add .worktrees/code-base-studies/` if Task 3.1 Step 2 needed it.

- [ ] **Step 2: Hand off**

Report to the user:

- Worktree path: `.worktrees/build-code-base-analytics/`
- Branch: `build/code-base-analytics-2026-04-30`
- New article: FEE-1801 = Three.js Architecture Tour
- Reframed article: FEE-1810 = Three.js — The Dispose Lifecycle Contract (was FEE-1801)
- New skill: `~/.claude/skills/code-base-analytics/` (user-global, not in this repo)
- Next step: user reviews the worktree, decides merge-and-push or further iteration.
