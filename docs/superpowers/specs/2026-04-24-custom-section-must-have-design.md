---
title: Custom Section Must-Have — Skill + FEE Template Alignment
date: 2026-04-24
status: Approved for planning
affects:
  - /Users/alive/.claude/skills/expanding-category-articles
  - /Users/alive/Projects/frontend-engineering-essentials/CLAUDE.md
  - docs/en/TypeScript/{enums-and-as-const,node-esm-and-nodenext,compiler-performance}.md (retrofit)
---

# Custom Section Must-Have — Skill + FEE Template Alignment

## Problem

Of the 8 articles added in the 2026-04-24 TypeScript expansion batch, only
`satisfies-operator` and `conditional-types-and-infer` contain a
topic-specific `##` section. The other six followed the skill template's
"topic-specific section (optional)" language and omitted it. The result is a
corpus where most articles plateau at the same seven standard headings, which
both flattens the reading experience and removes a signal that the article
has an angle worth a dedicated sub-topic.

The skill template currently marks the topic-specific section as optional,
and the FEE `CLAUDE.md` article template carries the same optionality plus a
few FEE-specific headings (`Scenario`, `Internal References`, `Changelog`)
that have drifted from the skill template. These two drifts compound: writers
are neither required to add a custom section nor aligned on section
vocabulary.

## Goals

1. Require each new FEE article to include at least one topic-specific
   `##` section unless the article declares an explicit escape in
   frontmatter.
2. Align the FEE `CLAUDE.md` template with the skill template's section
   names and required-section posture, preserving Changelog as an optional
   section.
3. Retrofit three already-merged 2026-04-24 articles whose findings docs
   already contain topic-specific claims that deserve their own section.

## Non-goals

- Renaming or restructuring existing FEE articles beyond the three targeted
  retrofits. Articles that pre-date this design keep their current headings.
- Introducing a CI gate that enforces the new rule across the repo
  retroactively. The validation script runs at article-write time in the
  skill pipeline; retroactive enforcement is a separate decision.
- Changing the zh-TW translation flow or vocabulary beyond updating the
  Section Header Map to match the new EN section names.

## Design

### A. Skill edits

Target: `/Users/alive/.claude/skills/expanding-category-articles/`

**A1. `templates/article.md` — sections**

Canonical order (required sections in bold):

- YAML frontmatter (`id`, `title`, `state`, `slug`)
- `# [<REPO>-<ID>] <Title>` (FEE / BEE / ADE / DEE / AEE)
- `:::info` hook (3-5 sentences)
- **`## Context`**
- **`## Visual`**
- **`## Example`**
- **`## Best Practices`**
- `## Design Thinking` (optional)
- `## Deep Dive` (optional)
- **`## <Topic-Specific Section>`** — new required; heading names the angle
- **`## Related Topics`**
- **`## References`**
- `## Changelog` (optional)

The topic-specific section sits between Deep Dive and Related Topics so
the article narrows from general discussion → deep mechanics → the
angle-specific payoff → outgoing links.

The topic-specific section's placeholder prose explains common patterns
("Protocol State Machine", "Wire Format", "Version Reference", "Failure
Modes", "Footgun Matrix", "Migration Guide", "Compatibility Table") and
names the escape hatch (see A2).

**A2. `scripts/validate-structure.sh` — new**

Validates that an article contains at least one `##` heading outside the
canonical set:

```
Context, Visual, Example, Best Practices,
Design Thinking, Deep Dive,
Related Topics, References, Changelog
```

Escape: frontmatter `allow_no_custom_section: true` with a required
adjacent comment explaining why. The script greps the frontmatter for
`allow_no_custom_section:[[:space:]]*true` and for a comment of the form
`# reason: <prose>` on the line above or below. Both must be present for
the escape to apply.

Exit 0 if canonical-only + escape-present, or if ≥1 non-canonical `##`
heading is present. Exit 1 with the offending file path and the canonical
set otherwise. Exit 2 on bad input.

**A3. `SKILL.md` Phase 4e — gate ordering**

```
1. validate-frontmatter.sh (EN + zh-TW)
2. validate-structure.sh   (EN + zh-TW)   -- new
3. check-references.sh     (EN)
4. findings URL coverage   (≥3 URLs in both findings and References)
```

A gate failure leaves the files in place and asks the user to fix-retry,
skip, or abort. Same escalation as existing gates.

**A4. `SKILL.md` Phase 4b writer hard-rule block**

Append one bullet verbatim to the writer subagent's prompt:

> Include at least one topic-specific `##` section whose heading names the
> angle your article adds beyond Context / Visual / Example / Best Practices
> / Design Thinking / Deep Dive. If you cannot think of one, set the
> frontmatter flag `allow_no_custom_section: true` and add a comment
> explaining why the topic has no depth beyond the standard sections.

**A5. `templates/research-brief.md` — PER-ARTICLE mode**

Add one line to the claim-coverage instruction:

> Propose a topic-specific section heading in your findings doc (e.g.,
> "Protocol State Machine", "Version Reference", "Failure Modes") and
> attach at least one claim to it. If the topic truly has no angle beyond
> the standard sections, say so explicitly in the Research notes so the
> writer can justify the `allow_no_custom_section` escape.

### B. FEE CLAUDE.md replacement

Target: `/Users/alive/Projects/frontend-engineering-essentials/CLAUDE.md`

**B1. "FEE Article Template" block — full replacement**

```
---
id: {ID}
title: "{TITLE}"
state: draft
slug: {kebab-slug}
---

# [FEE-{ID}] {TITLE}

:::info
One-paragraph hook (3-5 sentences).
:::

## Context
## Visual
## Example
## Best Practices
## Design Thinking              (optional)
## Deep Dive                    (optional)
## <Topic-specific section>     (required)
## Related Topics
## References
## Changelog                    (optional)
```

Drops `## Scenario` — scenario content folds into Context or the
topic-specific section. Renames `## Internal References` → `## Related
Topics`. Keeps `## Changelog` as an optional trailing section.

Existing FEE articles keep their old headings; no bulk rename. Future
articles follow the new canonical.

**B2. zh-TW section header map update**

In CLAUDE.md's section-header-translation table, replace:

| Drop | Reason |
|---|---|
| Scenario → 情境 | Scenario retired |
| Internal References → 內部參考 | renamed |

Add:

| EN | zh-TW |
|---|---|
| Related Topics | 延伸閱讀 |

`Changelog → 變更紀錄` stays.

### C. Targeted retrofit

Branch: `retrofit/typescript-custom-sections-2026-04-24` in a fresh
worktree at `../frontend-engineering-essentials-retrofit-typescript-custom-sections-2026-04-24/`
(sibling to the primary repo).

| Article | New section | Source claims (already in findings) |
|---|---|---|
| 1713 `enums-and-as-const` | `## TypeScript 5.0 Union Enum Transition` | Claims 11, 12 (pre-5.0 silent fallback; all-enums-union change) |
| 1714 `node-esm-and-nodenext` | `## Dual Package Hazard` | Claim 16 (promoted from Deep Dive; expand to include mitigation guidance from the same claim) |
| 1716 `compiler-performance` | `## Native Go Port (TypeScript 7.0)` | Claim 16 (promoted; elevate 10x / 77.8s→7.5s numbers) |

**Pipeline per retrofit:**

1. Writer subagent: receives the findings doc + the existing article path
   + the new custom-section spec. Instruction: add ONLY the new section
   in the right position (between Deep Dive and Related Topics). Do NOT
   rewrite existing sections. Return a unified diff or an Edit call.
2. Translator subagent: mirrors the new section into zh-TW.
3. Run gates: validate-structure.sh must now pass without the escape
   frontmatter. validate-frontmatter.sh + check-references.sh unchanged.
4. One atomic commit per article:
   `docs(typescript): add <section name> to FEE-<id>`.

**Articles left as-is** (1710, 1711, 1712): get a tiny commit that adds
`allow_no_custom_section: true` + an adjacent justification comment to
frontmatter, so validate-structure.sh passes on them.

```
---
id: 1710
title: "..."
state: draft
slug: classes-and-private-fields
category: TypeScript
level: mid
allow_no_custom_section: true
# reason: article fully covered by standard sections;
# no tooling/version/protocol angle warrants a dedicated section.
---
```

One commit for the three escape annotations:
`docs(typescript): annotate allow_no_custom_section on FEE-1710/1711/1712`.

### D. Order of operations

1. Skill edits (A1-A5) applied in a separate commit in the skill
   repository (`/Users/alive/.claude/skills/expanding-category-articles`).
   Committed independently from the FEE repo changes.
2. FEE `CLAUDE.md` replacement (B1, B2) applied on `main` in the FEE
   repo as a single commit.
3. Retrofit branch + commits (C) in a worktree, merged to `main` via
   fast-forward after gates pass.

## Risks

- **Risk:** the validation script's escape mechanism (frontmatter flag +
  comment) could be gamed by writers who add the flag without a meaningful
  comment. Mitigation: the comment's existence is all the script checks;
  quality of the justification is a human review concern, surfaced at PR
  time.
- **Risk:** the three retrofit articles gain a new section whose claims
  come from an already-committed findings doc, but the writer might still
  fabricate connective tissue. Mitigation: writer prompt reuses the
  existing HARD RULE forbidding claims not present in the findings doc.
- **Risk:** zh-TW translators may miss the new section in retrofit
  articles if they use a cached version. Mitigation: the retrofit
  pipeline dispatches a fresh translator subagent per article, with the
  updated EN file as input.

## Success criteria

- Skill `validate-structure.sh` rejects an article with only canonical
  `##` headings and no escape, accepts one with either a custom heading
  or a valid escape.
- `SKILL.md` Phase 4e lists validate-structure.sh as gate 2 of 4.
- FEE `CLAUDE.md` template matches skill template's required-section set,
  drops Scenario and Internal References, keeps Changelog optional.
- Articles 1713, 1714, 1716 each contain exactly one new topic-specific
  `##` section grounded in a findings claim, in both EN and zh-TW.
- Articles 1710, 1711, 1712 carry the escape frontmatter with a
  meaningful justification comment; validation passes on them.
