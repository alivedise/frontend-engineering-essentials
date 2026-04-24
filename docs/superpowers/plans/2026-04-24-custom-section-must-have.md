---
title: Custom Section Must-Have — Implementation Plan
date: 2026-04-24
status: Ready for execution
spec: docs/superpowers/specs/2026-04-24-custom-section-must-have-design.md
---

# Custom Section Must-Have Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a topic-specific `##` section in every new FEE article (with a frontmatter escape for genuinely shallow topics), align the FEE `CLAUDE.md` article template with the skill template, and retrofit three already-merged 2026-04-24 articles that have unused topic-specific claims in their findings docs.

**Architecture:** Three parts, sequential. **Part A** adds a new `validate-structure.sh` gate to the skill, updates the article template and writer/research briefs. **Part B** replaces the article-template block in FEE `CLAUDE.md`. **Part C** retrofits three articles (FEE-1713/1714/1716) in a worktree and annotates three others (FEE-1710/1711/1712) with the `allow_no_custom_section` escape.

**Tech Stack:** Bash (validation script), Markdown (skill docs, CLAUDE.md, article content), VitePress routing (unchanged), git worktrees.

---

## Repositories and paths

- **Skill repo** (Part A): `/Users/alive/.claude/skills/expanding-category-articles/`
- **FEE repo** (Parts B and C): `/Users/alive/Projects/frontend-engineering-essentials/`
- **FEE worktree** (Part C): `/Users/alive/Projects/frontend-engineering-essentials-retrofit-typescript-custom-sections-2026-04-24/` on branch `retrofit/typescript-custom-sections-2026-04-24`.

Commit separately per repo. Parts A and B are independent; Part C depends on Part A being done (the worktree runs the new `validate-structure.sh`).

---

## Part A — Skill edits

### Task A1: Write `validate-structure.sh` (TDD)

**Files:**
- Create: `/Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh`
- Create: `/Users/alive/.claude/skills/expanding-category-articles/scripts/test-validate-structure.sh`

- [ ] **Step 1: Write the failing test script**

Create `scripts/test-validate-structure.sh` with six test cases covering every branch of the gate:

```bash
#!/usr/bin/env bash
# Tests for validate-structure.sh. Run from the skill repo root.
# Uses mktemp fixtures; no permanent writes.

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
script="$here/validate-structure.sh"
fixtures=$(mktemp -d)
trap 'rm -rf "$fixtures"' EXIT

fail=0

expect() {
    local name="$1" want_exit="$2" file="$3"
    set +e
    "$script" "$file" >/dev/null 2>&1
    local got_exit=$?
    set -e
    if [[ "$got_exit" -eq "$want_exit" ]]; then
        echo "PASS: $name (exit $got_exit)"
    else
        echo "FAIL: $name — wanted exit $want_exit, got $got_exit" >&2
        fail=1
    fi
}

# Case 1: has a custom section → exit 0
cat > "$fixtures/ok-custom.md" <<'EOF'
---
id: 1
title: Test
state: draft
slug: test
---
# Test
## Context
## Visual
## Example
## Best Practices
## My Custom Section
## Related Topics
## References
EOF
expect "has custom section" 0 "$fixtures/ok-custom.md"

# Case 2: canonical only, no escape → exit 1
cat > "$fixtures/bad-canonical-only.md" <<'EOF'
---
id: 2
title: Test
state: draft
slug: test
---
# Test
## Context
## Visual
## Example
## Best Practices
## Related Topics
## References
EOF
expect "canonical only, no escape" 1 "$fixtures/bad-canonical-only.md"

# Case 3: escape with reason comment below → exit 0
cat > "$fixtures/ok-escape-below.md" <<'EOF'
---
id: 3
title: Test
state: draft
slug: test
allow_no_custom_section: true
# reason: topic has no depth beyond standard sections
---
# Test
## Context
## Visual
## Example
## Best Practices
## Related Topics
## References
EOF
expect "escape with reason below" 0 "$fixtures/ok-escape-below.md"

# Case 4: escape with reason comment above → exit 0
cat > "$fixtures/ok-escape-above.md" <<'EOF'
---
id: 4
title: Test
state: draft
slug: test
# reason: topic is a direct wrapper, no angle
allow_no_custom_section: true
---
# Test
## Context
## Visual
## Example
## Best Practices
## Related Topics
## References
EOF
expect "escape with reason above" 0 "$fixtures/ok-escape-above.md"

# Case 5: escape without reason → exit 1
cat > "$fixtures/bad-escape-no-reason.md" <<'EOF'
---
id: 5
title: Test
state: draft
slug: test
allow_no_custom_section: true
---
# Test
## Context
## Visual
## Example
## Best Practices
## Related Topics
## References
EOF
expect "escape without reason" 1 "$fixtures/bad-escape-no-reason.md"

# Case 6: file not found → exit 2
expect "file not found" 2 "$fixtures/nonexistent.md"

echo "---"
if [[ "$fail" -eq 0 ]]; then
    echo "All tests passed."
    exit 0
else
    echo "Some tests failed." >&2
    exit 1
fi
```

- [ ] **Step 2: Make the test script executable and run it — expect it to fail**

Run:
```bash
cd /Users/alive/.claude/skills/expanding-category-articles
chmod +x scripts/test-validate-structure.sh
bash scripts/test-validate-structure.sh
```

Expected: the test script fails because `validate-structure.sh` does not exist yet (most likely exit is 2 on every call since the script file is missing; the test harness will report all as failing).

- [ ] **Step 3: Write `validate-structure.sh`**

Create `scripts/validate-structure.sh`:

```bash
#!/usr/bin/env bash
# Usage: validate-structure.sh <markdown-file>
# Exit 0 if article has >=1 topic-specific ## section OR the allow_no_custom_section escape with an adjacent # reason: comment.
# Exit 1 if neither. Exit 2 on bad input.

set -euo pipefail

file="${1:?Usage: validate-structure.sh <file.md>}"

if [[ ! -f "$file" ]]; then
    echo "Error: file not found: $file" >&2
    exit 2
fi

# Canonical section set — anything else counts as topic-specific.
canonical='^## (Context|Visual|Example|Best Practices|Design Thinking|Deep Dive|Related Topics|References|Changelog)[[:space:]]*$'

custom=$(grep -E '^## ' "$file" | grep -vE "$canonical" || true)

if [[ -n "$custom" ]]; then
    count=$(echo "$custom" | wc -l | tr -d ' ')
    echo "$file: structure OK ($count topic-specific section(s))"
    exit 0
fi

# No topic-specific section found. Check for the allow_no_custom_section escape.
fm=$(awk '/^---$/{c++; if(c==2) exit; next} c==1' "$file")

if [[ -z "$fm" ]]; then
    echo "$file: no YAML frontmatter found" >&2
    exit 1
fi

# Read frontmatter into an array so we can look at adjacent lines.
fm_lines=()
while IFS= read -r line; do fm_lines+=("$line"); done <<< "$fm"

for i in "${!fm_lines[@]}"; do
    if [[ "${fm_lines[$i]}" =~ ^allow_no_custom_section:[[:space:]]+true[[:space:]]*$ ]]; then
        above="${fm_lines[$((i-1))]:-}"
        below="${fm_lines[$((i+1))]:-}"
        if [[ "$above" =~ ^#[[:space:]]+reason: ]] || [[ "$below" =~ ^#[[:space:]]+reason: ]]; then
            echo "$file: structure OK (allow_no_custom_section escape with reason)"
            exit 0
        fi
        echo "$file: allow_no_custom_section is set but missing adjacent '# reason: ...' comment" >&2
        exit 1
    fi
done

echo "$file: no topic-specific ## section and no allow_no_custom_section escape" >&2
echo "Canonical sections (not counted): Context, Visual, Example, Best Practices, Design Thinking, Deep Dive, Related Topics, References, Changelog" >&2
exit 1
```

- [ ] **Step 4: Make it executable, rerun the tests — expect all pass**

Run:
```bash
cd /Users/alive/.claude/skills/expanding-category-articles
chmod +x scripts/validate-structure.sh
bash scripts/test-validate-structure.sh
```

Expected: `All tests passed.`; exit 0. Six `PASS` lines.

- [ ] **Step 5: Commit**

```bash
cd /Users/alive/.claude/skills/expanding-category-articles
git add scripts/validate-structure.sh scripts/test-validate-structure.sh
git commit -m "feat(validate-structure): add gate for topic-specific section"
```

---

### Task A2: Update `templates/article.md`

**Files:**
- Modify: `/Users/alive/.claude/skills/expanding-category-articles/templates/article.md`

- [ ] **Step 1: Replace the template with the new canonical order**

Overwrite `templates/article.md` with:

```markdown
---
id: <ID>
title: <Human Title>
state: draft
slug: <kebab-slug>
---

# [BEE-<ID>] <Title>

:::info
<One-paragraph summary: what this article covers, why it matters, and the single biggest takeaway. 3-5 sentences max. Every claim here must be backed by a finding in the findings doc.>
:::

## Context

<History, landscape, key actors/papers. Name the authoritative sources by author + year. Set up the problem the rest of the article solves. Every factual claim traces to a specific claim in the findings doc, referenced by its pulled quote.>

## Visual

<One Mermaid diagram OR one structured table. Visualize the core mechanic introduced in Context. Use the `mermaid` fenced block if a diagram; otherwise a markdown table.>

```mermaid
<diagram>
```

## Example

<Concrete walkthrough: a real protocol exchange, a numbered failure scenario, a code snippet with specific input and output, or a named production system's behavior. Avoid generic pseudocode. Ground the example in a finding with a specific quote or citation.>

## Best Practices

<Actionable guidance. Use RFC 2119 keywords (MUST, SHOULD, MAY) where applicable. Each bullet references a specific constraint or empirical finding from the findings doc. Do NOT invent guidance; every "MUST" must trace to a source.>

- **MUST** <rule>: <why, with inline reference to finding>
- **SHOULD** <rule>: <why, with inline reference to finding>
- **MAY** <rule>: <when, with inline reference to finding>

<!-- Optional sections below. Include when the topic warrants the depth. -->

## Design Thinking

<Trade-offs, calibration choices. Name what gets traded against what (e.g., "more virtual nodes → smoother rebalancing vs. more observability overhead on node failure"). Every trade-off grounded in a finding.>

## Deep Dive

<Internals, proofs, edge cases, formal properties. Cite the paper or spec that establishes each property.>

## <Topic-Specific Section>

<REQUIRED. Rename the heading to name the angle your article adds beyond the standard sections. Patterns that fit here:

- "Protocol State Machine" / "Wire Format" / "Failure Modes" (systems articles)
- "Version Reference" / "Migration Guide" / "Compatibility Table" (API / spec articles)
- "Footgun Matrix" / "Common Pitfalls" (practitioner-facing articles)
- "JSDoc @<tag>" / "Language-Specific Variant" (language feature articles)

If the topic genuinely has no angle beyond the standard sections, set `allow_no_custom_section: true` in the frontmatter with a `# reason: <prose>` comment on an adjacent line. The validation gate treats this as the explicit escape; a reviewer will see the justification at PR time.>

## Related Topics

<Cross-links to sibling articles in the same category or related categories. Markdown links to the slug URL (not the numeric id).>

- [<Related topic>](/en/<category>/<related-slug>)
- [<Another>](/en/<category>/<related-slug>)

## References

<Authoritative sources, verified. Each entry follows the format below. Every URL here MUST appear in the findings doc's "Reference URLs" list.>

- <Author>, "<Title>," <Venue> (<year>). <URL>
- <Author>, "<Title>," <Venue> (<year>). <URL>

## Changelog

<Optional. Track significant spec or API changes over time. Include only when the topic has had breaking changes worth noting to readers on later revisits.>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/alive/.claude/skills/expanding-category-articles
git add templates/article.md
git commit -m "feat(template): make topic-specific section required, add Changelog"
```

---

### Task A3: Update `SKILL.md`

**Files:**
- Modify: `/Users/alive/.claude/skills/expanding-category-articles/SKILL.md`

- [ ] **Step 1: Update Phase 4e gate ordering**

Find this block in `SKILL.md`:

```markdown
**4e. Gates** — run in this order. Any failure → do NOT commit; leave files in place; ask user to fix-retry, skip, or abort.

1. `scripts/validate-frontmatter.sh docs/en/<category>/<slug>.md`
2. `scripts/validate-frontmatter.sh docs/zh-tw/<category>/<slug>.md`
3. `scripts/check-references.sh docs/en/<category>/<slug>.md`
4. Findings coverage: grep the findings doc's "Reference URLs" list, grep the EN article's `## References` section. Require at least 3 URLs present in both.
```

Replace it with:

```markdown
**4e. Gates** — run in this order. Any failure → do NOT commit; leave files in place; ask user to fix-retry, skip, or abort.

1. `scripts/validate-frontmatter.sh docs/en/<category>/<slug>.md`
2. `scripts/validate-frontmatter.sh docs/zh-tw/<category>/<slug>.md`
3. `scripts/validate-structure.sh docs/en/<category>/<slug>.md`
4. `scripts/validate-structure.sh docs/zh-tw/<category>/<slug>.md`
5. `scripts/check-references.sh docs/en/<category>/<slug>.md`
6. Findings coverage: grep the findings doc's "Reference URLs" list, grep the EN article's `## References` section. Require at least 3 URLs present in both.
```

- [ ] **Step 2: Update Phase 4b writer hard-rule block**

Find the "Writer HARD RULE" block (starts with `**Writer HARD RULE** (include verbatim in the writer's prompt):`).

Append one bullet at the end of the blockquote, before the empty line and the next heading. The new bullet is:

```
> - Include at least one topic-specific `##` section whose heading names the angle your article adds beyond Context / Visual / Example / Best Practices / Design Thinking / Deep Dive. If the topic genuinely has no such angle, set `allow_no_custom_section: true` in the frontmatter with a `# reason: <prose>` comment on an adjacent line. The validation gate treats that as the explicit escape.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/.claude/skills/expanding-category-articles
git add SKILL.md
git commit -m "docs(skill): add validate-structure gate + writer rule for custom section"
```

---

### Task A4: Update `templates/research-brief.md`

**Files:**
- Modify: `/Users/alive/.claude/skills/expanding-category-articles/templates/research-brief.md`

- [ ] **Step 1: Add the claim-coverage instruction**

In `templates/research-brief.md`, find the PER-ARTICLE mode procedure block (under `## Mode: PER-ARTICLE`). Find the bullet that reads:

```
4. Each claim's target section must be one of: Context, Visual, Example, Best Practices, Design Thinking, Deep Dive, Related Topics, References, or a topic-specific section name you propose.
```

Add a new bullet immediately after it:

```
5. Propose a concrete topic-specific section heading in your findings (e.g. "Protocol State Machine", "Version Reference", "Failure Modes", "Migration Guide") and attach at least one claim to it. If the topic truly has no angle beyond the standard sections, say so explicitly in the "Research notes" section so the writer can justify the `allow_no_custom_section` escape.
```

Renumber the subsequent bullet from `5.` to `6.`.

- [ ] **Step 2: Commit**

```bash
cd /Users/alive/.claude/skills/expanding-category-articles
git add templates/research-brief.md
git commit -m "docs(research-brief): require topic-specific section proposal"
```

---

## Part B — FEE CLAUDE.md replacement

### Task B1: Replace the FEE article template

**Files:**
- Modify: `/Users/alive/Projects/frontend-engineering-essentials/CLAUDE.md`

- [ ] **Step 1: Replace the "FEE Article Template" block**

In `CLAUDE.md`, find the section that begins with `## FEE Article Template` and ends at the next `## ` heading (currently `## Content Quality`).

Replace the ENTIRE block (from `## FEE Article Template` through the code fence that ends the template) with the following block:

````markdown
## FEE Article Template

Current canonical template (supersedes all prior versions). Mirrors the
`expanding-category-articles` skill template with Changelog retained as an
optional trailing section.

```
---
id: {ID}
title: "{TITLE}"
state: draft
slug: {kebab-slug}
---

# [FEE-{ID}] {TITLE}

:::info
One-paragraph hook (3-5 sentences). Every claim traces to the findings doc.
:::

## Context
History, landscape, prior attempts, the gap this article fills. 3-5 sentences.

## Visual
One Mermaid diagram OR one structured table. Visualize the core mechanic.

## Example
Concrete walkthrough. Real code, real input/output, named systems. No pseudocode.

## Best Practices
MUST / SHOULD / MAY bullets. Each grounded in a specific finding.

## Design Thinking (optional)
Trade-offs, calibration choices. Name what gets traded against what.

## Deep Dive (optional)
Internals, edge cases, formal properties.

## {Topic-specific section}
REQUIRED. Rename the heading to name the angle (e.g. "Migration Guide",
"Version Reference", "Failure Modes", "Footgun Matrix"). If the topic
genuinely has no such angle, set `allow_no_custom_section: true` in
frontmatter with an adjacent `# reason: <prose>` comment.

## Related Topics
Cross-links to sibling articles. Format:
- [<Title>](/en/<category>/<slug>) or (/en/<category>/<id>) for pre-slug files.

## References
3+ verified URLs. Format: `- <Author>, "<Title>," <Venue> (<year>). <URL>`

## Changelog (optional)
Track significant spec or API changes over time. Include only when the
topic has had breaking changes.
```

**zh-TW section header map:**
- Context → 背景
- Visual → 視覺對比
- Example → 範例
- Best Practices → 最佳實踐
- Design Thinking → 設計思維
- Deep Dive → 深入探討
- Related Topics → 延伸閱讀
- References → 參考資料
- Changelog → 變更紀錄

The topic-specific section's heading is authored-specific — translate it
naturally alongside the prose (e.g. "Migration Guide" → 「遷移指南」,
"Version Reference" → 「版本對照」).

Retired sections (kept for pre-2026-04-24 articles; not used in new work):
- `## Scenario` — scenario content folds into `## Context` or the
  topic-specific section.
- `## Internal References` — renamed to `## Related Topics`.
````

- [ ] **Step 2: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add CLAUDE.md
git commit -m "docs(claude): align FEE article template with skill template"
```

---

## Part C — Retrofit

### Task C1: Create retrofit worktree

**Commands:**

- [ ] **Step 1: Create the worktree on a new branch**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git worktree add ../frontend-engineering-essentials-retrofit-typescript-custom-sections-2026-04-24 -b retrofit/typescript-custom-sections-2026-04-24
cd ../frontend-engineering-essentials-retrofit-typescript-custom-sections-2026-04-24
```

- [ ] **Step 2: Verify the worktree is at HEAD and the tree is clean**

```bash
git status
git log --oneline -1
```

Expected: clean working tree. Head matches main tip (the commit for the `2026-04-24-custom-section-must-have-design.md` spec). No `install` step needed because we are only editing markdown.

---

### Task C2: Retrofit FEE-1713 (Enums) — add `## TypeScript 5.0 Union Enum Transition`

**Files:**
- Modify: `docs/en/TypeScript/enums-and-as-const.md`
- Modify: `docs/zh-tw/TypeScript/enums-and-as-const.md`

**Source:** `docs/superpowers/research/enums-and-as-const.md`, Claims 11 and 12 (all enums are now union enums; pre-5.0 silent fallback when a computed member broke union behaviour).

- [ ] **Step 1: Add the new EN section between `## Deep Dive` and `## Related Topics`**

In `docs/en/TypeScript/enums-and-as-const.md`, insert the following block immediately before the `## Related Topics` heading:

```markdown
## TypeScript 5.0 Union Enum Transition

Before TypeScript 5.0, whether an enum became a union of literal types depended on whether every member initializer was a simple constant. If any member carried a computed initializer, the compiler silently reverted to the older non-union representation, losing narrowing and literal-type access for the whole enum. The TS 5.0 release notes describe the fallback directly: "Whenever TypeScript ran into these issues, it would quietly back out and use the old enum strategy. That meant giving up all the advantages of unions and literal types."

TypeScript 5.0 closed the gap by assigning each computed member its own unique literal type: "TypeScript 5.0 manages to make all enums into union enums by creating a unique type for each computed member. That means that all enums can now be narrowed and have their members referenced as types as well."

Practical consequence: under TS 5.0 and later, `type Direction = Direction.Up | Direction.Down` is always a well-formed construction, switch statements over an enum get exhaustiveness checking even when computed members are present, and narrowing with `if (value === Direction.Up)` works regardless of how the enum was initialized. Code written against a pre-5.0 TypeScript that relied on the old fallback (e.g., explicit `type Direction = Direction` rather than the member union) continues to type-check but no longer needs the workaround.

```

- [ ] **Step 2: Add the new zh-TW section at the mirror position**

In `docs/zh-tw/TypeScript/enums-and-as-const.md`, insert immediately before the `## 延伸閱讀` heading:

```markdown
## TypeScript 5.0 Union Enum 轉換

在 TypeScript 5.0 之前，一個 enum 是否會被視為字面型別的聯集，取決於它的每個成員是否都以簡單常數初始化。只要有任一成員帶有計算式初始化，編譯器就會悄悄退回舊的非聯集表示法，使整個 enum 失去窄化與字面型別存取能力。TS 5.0 release notes 對此描述如下：「Whenever TypeScript ran into these issues, it would quietly back out and use the old enum strategy. That meant giving up all the advantages of unions and literal types.」

TypeScript 5.0 透過為每個計算成員指派一個專屬的字面型別來消除此缺口：「TypeScript 5.0 manages to make all enums into union enums by creating a unique type for each computed member. That means that all enums can now be narrowed and have their members referenced as types as well.」

實務影響：在 TS 5.0 之後，`type Direction = Direction.Up | Direction.Down` 始終是合法構造；針對 enum 的 `switch` 即使含有計算成員也能取得窮盡檢查；`if (value === Direction.Up)` 的窄化不再受初始化方式影響。針對舊版 TS 依賴 fallback 的程式（例如改以 `type Direction = Direction` 取代成員聯集）仍可通過型別檢查，但這類 workaround 已非必要。

```

- [ ] **Step 3: Run the gates**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials-retrofit-typescript-custom-sections-2026-04-24
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh docs/en/TypeScript/enums-and-as-const.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh docs/zh-tw/TypeScript/enums-and-as-const.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh docs/en/TypeScript/enums-and-as-const.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh docs/zh-tw/TypeScript/enums-and-as-const.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/check-references.sh docs/en/TypeScript/enums-and-as-const.md
```

Expected: all five gates print `structure OK` / `frontmatter OK` / `all N reference URLs OK`. `validate-structure.sh` reports `1 topic-specific section(s)`.

- [ ] **Step 4: Commit**

```bash
git add docs/en/TypeScript/enums-and-as-const.md docs/zh-tw/TypeScript/enums-and-as-const.md
git commit -m "docs(typescript): add TypeScript 5.0 Union Enum Transition section to FEE-1713"
```

---

### Task C3: Retrofit FEE-1714 (Node ESM) — add `## Dual Package Hazard`

**Files:**
- Modify: `docs/en/TypeScript/node-esm-and-nodenext.md`
- Modify: `docs/zh-tw/TypeScript/node-esm-and-nodenext.md`

**Source:** `docs/superpowers/research/node-esm-and-nodenext.md`, Claim 16 (dual package hazard from GeoffreyBooth repo).

- [ ] **Step 1: Add the new EN section before `## Related Topics`**

In `docs/en/TypeScript/node-esm-and-nodenext.md`, insert immediately before `## Related Topics`:

```markdown
## Dual Package Hazard

Publishing a package that ships both ESM and CJS entry points exposes consumers to the dual package hazard: the same package gets loaded twice — once by the CJS loader, once by the ESM loader — producing two independent module instances. GeoffreyBooth's illustrative repository states the failure mode precisely: "The dual package hazard occurs in packages that ship both CJS and ESM entry points, allowing the same package to get loaded twice: once through the CJS loader and once through the ESM loader."

Two visible symptoms follow. First, singletons are no longer singletons: a cache or registry exported from the package holds separate state in each loader's copy. Second, `instanceof` checks across the boundary silently fail because the class identity differs between the two module copies, even though the classes came from "the same" package.

Mitigations that work in practice:

- **Ship ESM-only when you can.** Node 20+ consumers and every modern bundler handle ESM directly; CJS fallback is carried for historical parity, not real reach.
- **When dual-shipping is required, keep state in a single CJS-only or ESM-only helper package.** Import that package from both the CJS and ESM entry points so the stateful module is loaded once regardless of which loader resolved the outer package.
- **Use `exports` conditions strictly.** The `package.json` `"exports"` field's `"import"` and `"require"` conditions are mutually exclusive. Hand-written paths that bypass the conditions (e.g. a direct subpath import) defeat the intended resolution and can pull in the wrong copy.
- **Never expose class identity across the boundary.** If consumers need an `instanceof` check, expose a brand-check function (`isFoo(x)`) that performs the check internally, so the identity comparison stays inside a single copy of the module.

The hazard is not a TypeScript problem — it exists in any Node runtime that supports both loaders — but TypeScript's emit decisions determine which loader each consumer gets, so the `nodenext` module resolution is the right setting to surface the problem at compile time.

```

- [ ] **Step 2: Add the new zh-TW section at the mirror position**

In `docs/zh-tw/TypeScript/node-esm-and-nodenext.md`, insert immediately before the `## 延伸閱讀` heading:

```markdown
## 雙套件風險（Dual Package Hazard）

同時釋出 ESM 與 CJS 兩種進入點的套件，會讓使用者暴露於雙套件風險：同一個套件會被載入兩次——CJS loader 一次、ESM loader 一次——產生兩個彼此獨立的模組實體。GeoffreyBooth 的示範 repo 直接說明此失效模式：「The dual package hazard occurs in packages that ship both CJS and ESM entry points, allowing the same package to get loaded twice: once through the CJS loader and once through the ESM loader.」

常見症狀有兩個。首先，singleton 不再是 singleton：從套件匯出的 cache 或 registry，會在兩份 loader 的副本中各自持有狀態。其次，跨邊界的 `instanceof` 檢查會悄然失敗，因為兩份模組副本的 class identity 不同，即便這兩個 class「出自同一個套件」。

實務上有效的緩解方式：

- **能只釋出 ESM 就只釋出 ESM。** Node 20+ 消費者與所有現代 bundler 都能直接處理 ESM；保留 CJS fallback 多半是為了歷史相容，不是為了觸及率。
- **若必須雙釋出，將狀態集中到單一 CJS-only 或 ESM-only 的輔助套件。** 從 CJS 與 ESM 進入點共同 import 該輔助套件，使有狀態的模組僅被載入一次，不受外層套件由哪個 loader 解析影響。
- **嚴格使用 `exports` 條件欄位。** `package.json` 的 `"exports"` 欄位中，`"import"` 與 `"require"` 條件互斥。手寫繞過條件的 subpath import 會破壞原本的解析，可能引入錯誤副本。
- **切勿跨邊界暴露 class identity。** 若消費者需要 `instanceof` 檢查，改以品牌檢查函式（`isFoo(x)`）在單一模組副本中完成比較。

此風險本身並非 TypeScript 的問題——只要 Node runtime 同時支援兩種 loader 便會存在——但 TypeScript 的 emit 決策會決定每位消費者遇到的是哪個 loader，因此 `nodenext` 模組解析正是將問題在編譯期浮現的正確設定。

```

- [ ] **Step 3: Run the gates**

```bash
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh docs/en/TypeScript/node-esm-and-nodenext.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh docs/zh-tw/TypeScript/node-esm-and-nodenext.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh docs/en/TypeScript/node-esm-and-nodenext.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh docs/zh-tw/TypeScript/node-esm-and-nodenext.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/check-references.sh docs/en/TypeScript/node-esm-and-nodenext.md
```

Expected: all five gates pass, `validate-structure.sh` reports `1 topic-specific section(s)`.

- [ ] **Step 4: Commit**

```bash
git add docs/en/TypeScript/node-esm-and-nodenext.md docs/zh-tw/TypeScript/node-esm-and-nodenext.md
git commit -m "docs(typescript): add Dual Package Hazard section to FEE-1714"
```

---

### Task C4: Retrofit FEE-1716 (Compiler Performance) — add `## Native Go Port (TypeScript 7.0)`

**Files:**
- Modify: `docs/en/TypeScript/compiler-performance.md`
- Modify: `docs/zh-tw/TypeScript/compiler-performance.md`

**Source:** `docs/superpowers/research/compiler-performance.md`, Claim 16 (native Go port, 10x build improvement, 77.8s→7.5s VS Code self-compile, ships as TypeScript 7.0).

- [ ] **Step 1: Add the new EN section before `## Related Topics`**

In `docs/en/TypeScript/compiler-performance.md`, insert immediately before `## Related Topics`:

```markdown
## Native Go Port (TypeScript 7.0)

In March 2025 Microsoft announced a port of the TypeScript compiler and language service from TypeScript to Go. The announcement states the target impact: "The native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage." The measured data point Microsoft cited in the same post is VS Code's self-compile dropping from 77.8 seconds to 7.5 seconds.

The port ships as TypeScript 7.0. The existing JavaScript-codebased compiler continues as the TypeScript 6.x line to give ecosystem tools time to migrate, so current projects do not have to adopt the Go-based build chain until they are ready.

What stays constant: the language surface is identical. tsconfig options, `@types` packages, declaration-file emission, and the editor integrations that consume `tsserver` all keep their shape. What changes: startup cost for large projects (previously dominated by JIT warmup on the TypeScript host) falls sharply, memory ceilings loosen, and end-to-end CI build times on large codebases compress into the same order as a `gopls` cycle rather than a `node --max-old-space-size` cycle.

Practical stance for 2026 projects: keep the TypeScript-6.x-based `tsc` in your build chain today. Watch the 7.0 preview release channel. When TypeScript 7.0 ships a stable tag, evaluate it first on non-critical builds (documentation pipelines, lint-only CI jobs) and migrate the hot path only once editor integrations you rely on have confirmed parity. The `--extendedDiagnostics` trace from your current build is directly comparable against a 7.0 trace, which is the cheapest way to confirm the expected speedup on a representative project.

```

- [ ] **Step 2: Add the new zh-TW section at the mirror position**

In `docs/zh-tw/TypeScript/compiler-performance.md`, insert immediately before `## 延伸閱讀`:

```markdown
## Go 原生移植（TypeScript 7.0）

2025 年 3 月，Microsoft 宣布將 TypeScript 編譯器與語言服務由 TypeScript 移植到 Go。公告明言目標衝擊：「The native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage.」同一篇公告所引的實測數據是 VS Code 的自我編譯從 77.8 秒縮短至 7.5 秒。

此移植將以 TypeScript 7.0 發佈。現有以 JavaScript 為基底的編譯器會沿用 TypeScript 6.x 版號，給生態系工具遷移時間，因此既有專案無須立刻採用 Go 為基礎的建置鏈。

保持不變的是語言表面：tsconfig 選項、`@types` 套件、宣告檔產出、以及依賴 `tsserver` 的編輯器整合都維持原樣。改變的是：大型專案的啟動成本（先前受 TypeScript 主機端 JIT 暖機影響最鉅）顯著下降，記憶體上限鬆綁，大型程式碼庫的端到端 CI 編譯時長會壓縮到與 `gopls` 週期同量級，而非 `node --max-old-space-size` 週期。

2026 年專案的務實策略：建置鏈先維持在 TypeScript 6.x 基礎的 `tsc`。關注 7.0 preview release channel。一旦 TypeScript 7.0 發佈穩定版標籤，先在非關鍵建置（文件 pipeline、僅跑 lint 的 CI）上評估；等到所需編輯器整合都確認行為對齊，再將主路徑切換過去。現有建置以 `--extendedDiagnostics` 產出的 trace 可直接與 7.0 的 trace 比對，是以代表性專案驗證預期加速幅度的最省成本作法。

```

- [ ] **Step 3: Run the gates**

```bash
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh docs/en/TypeScript/compiler-performance.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-frontmatter.sh docs/zh-tw/TypeScript/compiler-performance.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh docs/en/TypeScript/compiler-performance.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh docs/zh-tw/TypeScript/compiler-performance.md
bash /Users/alive/.claude/skills/expanding-category-articles/scripts/check-references.sh docs/en/TypeScript/compiler-performance.md
```

Expected: all five gates pass, `validate-structure.sh` reports `1 topic-specific section(s)`.

- [ ] **Step 4: Commit**

```bash
git add docs/en/TypeScript/compiler-performance.md docs/zh-tw/TypeScript/compiler-performance.md
git commit -m "docs(typescript): add Native Go Port section to FEE-1716"
```

---

### Task C5: Annotate FEE-1710, FEE-1711, FEE-1712 with `allow_no_custom_section`

**Files:**
- Modify: `docs/en/TypeScript/classes-and-private-fields.md`
- Modify: `docs/zh-tw/TypeScript/classes-and-private-fields.md`
- Modify: `docs/en/TypeScript/decorators-stage-3.md`
- Modify: `docs/zh-tw/TypeScript/decorators-stage-3.md`
- Modify: `docs/en/TypeScript/type-only-imports.md`
- Modify: `docs/zh-tw/TypeScript/type-only-imports.md`

- [ ] **Step 1: Update FEE-1710 frontmatter (EN and zh-TW)**

Both `docs/en/TypeScript/classes-and-private-fields.md` and `docs/zh-tw/TypeScript/classes-and-private-fields.md`:

Replace the closing `---` of the frontmatter (the second `---` line) with:

```yaml
allow_no_custom_section: true
# reason: article fully covered by standard sections; soft-vs-hard privacy and the deep dive already occupy the topic-specific angle without needing a separate heading.
---
```

Concretely: the frontmatter ends with `level: mid` on its own line, then `---`. Insert the two new lines between `level: mid` and the closing `---`, so the file's opening block becomes:

```yaml
---
id: 1710
title: "Classes, Access Modifiers & `#` Private Fields"
state: draft
slug: classes-and-private-fields
category: TypeScript
level: mid
allow_no_custom_section: true
# reason: article fully covered by standard sections; soft-vs-hard privacy and the deep dive already occupy the topic-specific angle without needing a separate heading.
---
```

Apply the same two new lines to the zh-TW file.

- [ ] **Step 2: Update FEE-1711 frontmatter (EN and zh-TW)**

For both `docs/en/TypeScript/decorators-stage-3.md` and `docs/zh-tw/TypeScript/decorators-stage-3.md`, insert the two lines before the closing `---`:

```yaml
allow_no_custom_section: true
# reason: decorator mechanics fill the standard sections end-to-end; no stage-specific subtopic warrants its own heading beyond what Deep Dive already covers.
```

- [ ] **Step 3: Update FEE-1712 frontmatter (EN and zh-TW)**

For both `docs/en/TypeScript/type-only-imports.md` and `docs/zh-tw/TypeScript/type-only-imports.md`, insert the two lines before the closing `---`:

```yaml
allow_no_custom_section: true
# reason: verbatimModuleSyntax semantics are fully exhausted by Context/Example/Deep Dive; elision subtleties belong in Design Thinking, not a separate section.
```

- [ ] **Step 4: Run validate-structure.sh on all six files**

```bash
for f in \
  docs/en/TypeScript/classes-and-private-fields.md \
  docs/zh-tw/TypeScript/classes-and-private-fields.md \
  docs/en/TypeScript/decorators-stage-3.md \
  docs/zh-tw/TypeScript/decorators-stage-3.md \
  docs/en/TypeScript/type-only-imports.md \
  docs/zh-tw/TypeScript/type-only-imports.md; do
  bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh "$f"
done
```

Expected: six lines, each ending with `structure OK (allow_no_custom_section escape with reason)`.

- [ ] **Step 5: Commit**

```bash
git add docs/en/TypeScript/classes-and-private-fields.md \
        docs/zh-tw/TypeScript/classes-and-private-fields.md \
        docs/en/TypeScript/decorators-stage-3.md \
        docs/zh-tw/TypeScript/decorators-stage-3.md \
        docs/en/TypeScript/type-only-imports.md \
        docs/zh-tw/TypeScript/type-only-imports.md
git commit -m "docs(typescript): annotate allow_no_custom_section on FEE-1710/1711/1712"
```

---

### Task C6: Batch-validate every TypeScript article

- [ ] **Step 1: Run validate-structure.sh across the category (EN)**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials-retrofit-typescript-custom-sections-2026-04-24
for f in docs/en/TypeScript/*.md; do
  bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh "$f"
done
```

Expected: every file reports `structure OK` with either a topic-specific count or the escape-with-reason message. No exit-1 reports.

- [ ] **Step 2: Run validate-structure.sh across the category (zh-TW)**

```bash
for f in docs/zh-tw/TypeScript/*.md; do
  bash /Users/alive/.claude/skills/expanding-category-articles/scripts/validate-structure.sh "$f"
done
```

Expected: every file reports `structure OK`. Existing articles 1700-1708 will fail this check unless they already have a topic-specific section. If any exit-1, stop and decide whether to retrofit those too or add the escape. (Out of scope for this plan — likely a follow-up.)

**Note:** pre-existing FEE articles 1700-1708 predate this gate. If Step 2 (or Step 1) reports exit-1 on them, do NOT fix them in this plan. Record them for a separate follow-up issue; do not retrofit them in this change.

---

### Task C7: Merge the retrofit branch to main

- [ ] **Step 1: From the main repo, fast-forward merge the retrofit branch**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git merge --ff-only retrofit/typescript-custom-sections-2026-04-24
```

Expected: fast-forward updating main by four commits (three retrofits + one escape-annotation commit).

- [ ] **Step 2: Confirm git log**

```bash
git log --oneline main -10
```

Expected: the top four commits are the retrofits and the annotation, followed by the spec commit, followed by the earlier expansion commits.

- [ ] **Step 3: Leave the worktree and branch in place for user review**

Do NOT remove the worktree or delete the branch in this plan. The user may want to inspect, push to remote, or discard. End the plan with the worktree intact.

---

## Self-review (plan author only; not executed)

- Every step has either a concrete file edit or a command with expected output — no placeholders.
- Part A adds the gate and updates all four skill touchpoints (template, SKILL.md Phase 4b, SKILL.md Phase 4e, research-brief.md).
- Part B replaces the FEE CLAUDE.md template in one atomic edit.
- Part C covers all eight 2026-04-24 TypeScript articles (3 retrofitted, 3 escaped, 2 already compliant — 1709 `satisfies-operator` and 1715 `conditional-types-and-infer` have custom sections and are not touched).
- Commit boundaries match the spec's "Order of operations": Part A commits are self-contained in the skill repo; Part B is one commit in the FEE repo; Part C is four commits on a retrofit branch, merged by fast-forward.
- The new gate script has its own test harness (Task A1 Step 1), which is the only code in this plan that could regress; all other edits are content.
