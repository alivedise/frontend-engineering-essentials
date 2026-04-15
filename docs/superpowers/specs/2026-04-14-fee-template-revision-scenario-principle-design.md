# FEE Template Revision: Scenario Section & Principle Removal

## Goal

Improve FEE article quality by (1) removing the redundant `## Principle` section from all articles and absorbing its normative content into `## Best Practices`, and (2) adding a new `## Scenario` section to all 100–400 series articles that grounds the reader in a concrete product situation before the technical mechanics.

## Background

The current article template contains both `## Principle` and `## Best Practices`. Both sections carry RFC-2119 normative content (MUST/SHOULD/MUST NOT). `## Principle` is a 1-2 paragraph prose summary; `## Best Practices` itemizes the same stance as bulleted paragraphs. This duplication adds length without adding signal. Readers either read both or skip to Best Practices directly.

The 100–400 series articles (HTML, CSS, JavaScript Core, Browser APIs) cover platform APIs and language mechanics. These articles have strong technical explanations but no explicit product-situation anchor — a reader knows how `IntersectionObserver` works but may not immediately see "this is what I reach for when I need lazy-loading without scroll polling." A Scenario section supplies this missing context.

## Scope

**Pass 1 — Principle removal:** All FEE articles across all categories, EN and zh-TW. Approximately 180 articles × 2 languages = ~360 files. FEE-0 updated to remove Principle from the documented template.

**Pass 2 — Scenario addition:** 100–400 series articles only, EN and zh-TW. 51 articles × 2 languages = 102 files. FEE-0 updated to document Scenario as a category-specific section for 100–400.

## Article Structure After Both Passes

### All articles (post Pass 1)

```
Opening paragraphs
## Design Thinking
## Best Practices
## Visual
## Example
## Common Mistakes
## Related FEEs
## References
```

### 100–400 series articles (post Pass 2)

```
Opening paragraphs
## Scenario          ← new
## Design Thinking
## Best Practices
## Visual
## Example
## Common Mistakes
## Related FEEs
## References
```

zh-TW heading for Scenario: `## 使用情境`

## Pass 1: Principle Removal

### What to remove

The entire `## Principle` section (EN) / `## 原則` section (zh-TW) and its body content.

### Migration rule

Before deleting, scan the Principle body for any MUST/SHOULD/MUST NOT normative statement that does not already appear as a bullet in `## Best Practices`. Migrate it as a new Best Practices bullet using the bold-prefix format:

```
**MUST** <normative statement in present tense>.
```

Content that fully duplicates an existing Best Practices bullet is dropped without migration.

### FEE-0 update

Remove the Principle entry from the section listing in FEE-0. Update both EN and zh-TW versions.

### Batching

One batch per category, processed in category order. Commit after each category batch.

## Pass 2: Scenario Addition

### Placement

Immediately after the opening paragraphs, before `## Design Thinking`.

### Content rules

- Exactly 1 paragraph, 3-5 sentences
- Opens with a product situation or user-facing feature — not with the API name
- Names the specific problem that makes the API or feature necessary
- Leads the reader to see why the API exists before they learn how it works
- Prose only by default
- A short inline code snippet is permitted only when the product situation cannot be understood without seeing the invocation shape (for example, multi-tab communication APIs where the setup is central to the scenario)

### Quality bar

A well-written Scenario answers: "What am I building, and why does this API become the right tool?" A poor Scenario is generic ("This API is useful in many situations") or restates the article title ("When you need to observe intersections..."). Reject any Scenario that could apply to more than one article unchanged.

### Example (Intersection Observer — illustrative, not a real article)

> You are building a long-form article page where images below the fold should not load until the user scrolls near them. Polling `getBoundingClientRect()` on a scroll event works but fires hundreds of times per second and forces layout recalculation on every call. You need a way to be notified when a specific element enters the viewport without touching the scroll event at all.

### zh-TW requirements

- Section heading: `## 使用情境`
- Full prose translation — do not translate word-for-word; adapt the product situation naturally to zh-TW reading patterns
- Same length and quality bar as EN

### FEE-0 update

Add Scenario to the documented template, noting it applies to 100–400 series articles only. Update both EN and zh-TW versions.

### Batching

Four batches, one per category:

| Batch | Category | Articles |
|---|---|---|
| Scenario-A | HTML and Semantic Markup (100–108) | 9 |
| Scenario-B | CSS and Layout Systems (200–210) | 11 |
| Scenario-C | JavaScript Core and Runtime (300–313) | 14 |
| Scenario-D | Browser APIs and Web Platform (400–416) | 17 |

Commit after each batch.

## Implementation Workflow

Both passes use the subagent-driven development workflow: one subagent per batch, spec compliance review followed by code quality review after each batch.

Pass 1 must be fully committed before Pass 2 begins, so Scenario is always added to articles that already have the post-Pass-1 structure.

## Success Criteria

- No `## Principle` or `## 原則` section exists in any article after Pass 1
- Every Best Practices section after Pass 1 contains all normative content that was in the corresponding Principle section
- Every 100–400 series article after Pass 2 contains a `## Scenario` / `## 使用情境` section immediately before `## Design Thinking`
- No Scenario section exists in any article outside the 100–400 series
- FEE-0 accurately documents the updated template after both passes
- All articles remain 301+ lines after edits (301 is the floor; no upper limit — do not truncate content to hit a number)
