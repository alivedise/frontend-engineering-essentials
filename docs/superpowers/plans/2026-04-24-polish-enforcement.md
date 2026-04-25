---
title: Polish Enforcement — Implementation Plan
date: 2026-04-24
status: Ready for execution
spec: docs/superpowers/specs/2026-04-24-polish-enforcement-design.md
---

# Polish Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten Phase 4d of the `expanding-category-articles` skill so that future runs invoke the `polish-documents` skill on every EN + zh-TW article, and add a Red Flag entry that names the inline-polish shortcut as a Pattern A workflow gap.

**Architecture:** Two targeted in-place edits to `SKILL.md`. No new files, no scripts, no tests. Verification is `grep`-based: confirm the new wording is present and the previous one-line Phase 4d is replaced.

**Tech Stack:** Markdown only. Skill directory is at `/Users/alive/.claude/skills/expanding-category-articles/` and is **not a git repository** — edits take effect immediately as file changes; no `git add`/`git commit` step.

---

## Repository note

The skill repo is plain files (no git). Apply the edits directly; do NOT attempt to commit them in the skill directory. The spec doc at `docs/superpowers/specs/2026-04-24-polish-enforcement-design.md` already has its own commit on the FEE main branch.

---

## Task 1: Strengthen Phase 4d — mandatory polish-documents invocation

**Files:**
- Modify: `/Users/alive/.claude/skills/expanding-category-articles/SKILL.md` (Phase 4d block, currently a single line at line 103)

- [ ] **Step 1: Read the current Phase 4d line in `SKILL.md`**

Run:

```bash
grep -n "^\*\*4d\." /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: one matching line at line 103 reading exactly:

```
**4d. Polish** — run the `polish-documents` skill on both `docs/en/<category>/<slug>.md` and `docs/zh-tw/<category>/<slug>.md`.
```

- [ ] **Step 2: Replace the Phase 4d block**

Use the `Edit` tool on `SKILL.md` with `old_string`:

```
**4d. Polish** — run the `polish-documents` skill on both `docs/en/<category>/<slug>.md` and `docs/zh-tw/<category>/<slug>.md`.
```

and `new_string`:

```
**4d. Polish** — invoke the `polish-documents` skill on both locale files.
This is a MUST; inline grep-and-edit passes do NOT substitute for the full
ruleset the skill enforces (length tightening, weasel words, ZH-F1
CJK-ASCII spacing, and the rule categories the writer prompt does not
mention).

Invocations, in order:

```
Skill(polish-documents, docs/en/<category>/<slug>.md)
Skill(polish-documents, docs/zh-tw/<category>/<slug>.md)
```

Accept the summary each run prints. Any `Skipped (needs author input)`
items surface to the caller; they are not reasons to abort the article
but should be flagged in the commit body or to the user if non-trivial.
```

- [ ] **Step 3: Verify the new Phase 4d block is in place**

Run:

```bash
grep -n -A 12 "^\*\*4d\. Polish" /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: the output starts with `**4d. Polish** — invoke the` and contains the literal string `This is a MUST` plus the two `Skill(polish-documents, ...)` invocation lines. Total ~12 lines.

Run:

```bash
grep -c "run the \`polish-documents\` skill on both \`docs/en" /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: `0`. The old wording must be gone.

- [ ] **Step 4: Sanity-check the surrounding sections still read correctly**

Run:

```bash
grep -n "^\*\*4[a-f]\." /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: the six `**4a.` through `**4f.` headers are present in order, with the new `**4d.` line. No phase header was accidentally consumed.

---

## Task 2: Add Red Flag — inline-polish shortcut

**Files:**
- Modify: `/Users/alive/.claude/skills/expanding-category-articles/SKILL.md` (Red Flags list, currently lines 144-152)

- [ ] **Step 1: Read the current Red Flags block**

Run:

```bash
grep -n -A 10 "^## Red Flags" /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: the section header `## Red Flags — STOP and restart the phase` followed by the explanatory line and five existing bullets ending with the Pattern C fabrication entry plus the trailing context line "If you catch yourself thinking any of these: abort, re-read this skill, restart the phase."

- [ ] **Step 2: Insert the new Red Flag bullet**

Use the `Edit` tool with `old_string`:

```
- "I'll skip zh-TW; easy to add later" — Pattern A, bilingual skip
- "Let me peek at an existing article to see structure" — Pattern B, template drift
```

and `new_string`:

```
- "I'll skip zh-TW; easy to add later" — Pattern A, bilingual skip
- "I'll do inline polish with grep + Edit; it covers the important rules; it's faster" — Pattern A, Phase 4d skip. The writer prompt only covers the most visible style rules (contrastive negation, em-dash chains, puffery preambles). `polish-documents` covers ~20 rules across EN, ZH, and formatting, plus length and weasel-word tightening. Inline polish reliably misses ZH-F1 CJK-ASCII spacing, EN-4/EN-5 unanchored modifiers in anything but the most obvious cases, and ZH-2/ZH-6/ZH-9. Invoke the skill.
- "Let me peek at an existing article to see structure" — Pattern B, template drift
```

- [ ] **Step 3: Verify the new Red Flag bullet is in place**

Run:

```bash
grep -c "I'll do inline polish with grep" /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: `1`.

Run:

```bash
grep -E "^- \"" /Users/alive/.claude/skills/expanding-category-articles/SKILL.md | wc -l | tr -d ' '
```

Expected: `6` (was 5; added one).

Run:

```bash
grep -n "^## Red Flags\|^- \"" /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: the Red Flags header is at its existing line number and is followed by 6 bullets in this order:

1. `"I'll draft directly without the research subagent"` — Pattern A, workflow gap
2. `"This URL is obviously valid"` — Pattern A, gate skip
3. `"I'll skip zh-TW; easy to add later"` — Pattern A, bilingual skip
4. `"I'll do inline polish with grep + Edit; ..."` — Pattern A, Phase 4d skip *(new)*
5. `"Let me peek at an existing article to see structure"` — Pattern B, template drift
6. `"I'll use my own knowledge for Best Practices; faster"` — Pattern C, fabrication

- [ ] **Step 4: Final sanity-check — full SKILL.md still parses as a single document**

Run:

```bash
wc -l /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
head -1 /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
tail -1 /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
```

Expected: line count is `prior_count + ~13 lines` (Phase 4d expanded by ~10, Red Flags expanded by 1 wrapped bullet ≈ 1 line). First line is the H1 `# Expanding Category Articles`. Last line is the existing References footer `- Related skills: ...`. Document boundaries intact.

---

## Self-review (plan author only; not executed)

- **Spec coverage:** Section A of the spec → Task 1 (Phase 4d wording). Section B → Task 2 (Red Flag entry). Goals 1, 2, 3 all addressed; non-goals (no new gate, no retroactive retrofit, no `polish-documents` changes) all respected.
- **Placeholder scan:** Every step lists exact commands or exact `Edit` arguments. No "TBD"/"TODO"/"similar to Task N".
- **Type consistency:** No code, no types — just markdown edits with verbatim `old_string`/`new_string` content.
- **Skill repo is not git-tracked:** The plan does not include any `git add`/`git commit` step in the skill directory. Edits take effect on save.
