---
title: Expanding-Category-Articles — Polish Enforcement (Phase 4d)
date: 2026-04-24
status: Approved for planning
affects:
  - /Users/alive/.claude/skills/expanding-category-articles/SKILL.md
---

# Expanding-Category-Articles — Polish Enforcement (Phase 4d)

## Problem

Across the 2026-04-24 TypeScript expansion (FEE-1709..1716) and the HTML
expansion (FEE-109..116), the `polish-documents` skill was invoked in full
exactly once (FEE-1709 EN only). Every other EN + zh-TW file was "polished"
inline — a grep-then-Edit pass covering the common style rules
(EN-1/EN-7/ZH-1/ZH-8 and a few em-dash cases) but skipping the broader
ruleset that `polish-documents` covers (EN-2/EN-4/EN-5/EN-6/EN-8,
ZH-2/ZH-3/ZH-5/ZH-6/ZH-7/ZH-9, ZH-F1/F2/F3 CJK-ASCII spacing rules, length
tightening, and weasel-word removal).

The root cause is not an absent gate — it is that Phase 4d's current wording
leaves "inline polish" as an available interpretation, and the Red Flags
section does not name that shortcut as a violation. Skill runners (including
the author during the two batches above) rationalize away full invocation
by pointing to writer-prompt style prohibitions as sufficient coverage.

## Goals

1. Close the "inline polish is fine" interpretation in Phase 4d.
2. Name "I'll inline-polish; it's faster" as a Pattern A Red Flag.
3. Keep the change minimal — no new gate script, no structural-commit
   requirement, no retroactive retrofit of already-shipped articles.

## Non-goals

- Structural enforcement via a separate polish commit or a git-log-scanning
  Phase 5 gate.
- Retroactive polish of FEE-109..116 or FEE-1709..1716.
- Changes to the `polish-documents` skill itself.

## Design

### A. `SKILL.md` Phase 4d — mandatory invocation

Replace the current one-line Phase 4d:

```markdown
**4d. Polish** — run the `polish-documents` skill on both `docs/en/<category>/<slug>.md` and `docs/zh-tw/<category>/<slug>.md`.
```

With:

```markdown
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

Accept the summary each run prints. Any Skipped-(needs-author-input) items
surface to the caller; they are not reasons to abort the article but should
be flagged in the commit body or to the user if non-trivial.
```

### B. `SKILL.md` Red Flags — add the inline-polish shortcut

In the existing Red Flags list, append one entry immediately after the
existing Pattern A items:

```markdown
- "I'll do inline polish with grep + Edit; it covers the important rules; it's faster" — Pattern A, Phase 4d skip. The writer prompt only covers the most visible style rules (contrastive negation, em-dash chains, puffery preambles). `polish-documents` covers ~20 rules across EN, ZH, and formatting, plus length and weasel-word tightening. Inline polish reliably misses ZH-F1 CJK-ASCII spacing, EN-4/EN-5 unanchored modifiers in anything but the most obvious cases, and ZH-2/ZH-6/ZH-9. Invoke the skill.
```

## Risks

- **Budget concern**: two `polish-documents` calls per article × N articles
  is real cost, but this is the price of the skill's stated contract.
- **Runner still skips**: wording alone does not stop a determined shortcut.
  If a future batch recreates the skip pattern, escalate to enforcement
  option (b) from the brainstorm — structural polish-commit per article
  with a Phase 5 git-log scanner.

## Success criteria

- Phase 4d reads as a MUST and explicitly rules out inline substitution.
- Red Flags list names the inline-polish shortcut as Pattern A with a
  one-sentence explanation of what the skill catches that inline polish
  misses.
- The skill continues to pass its existing `tests/` scenarios (Phase 4d
  test coverage today is descriptive, not mechanical; this spec does not
  add new tests).
