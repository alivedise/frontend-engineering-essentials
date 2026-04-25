---
topic: W3C DTCG Format Module — Complete Token Spec Reference
id: 910
slug: dtcg-token-format-spec
sources_reviewed: 7
claims: 15
---

# Findings: W3C DTCG Format Module — Complete Token Spec Reference

**Proposed topic-specific section:** `## DTCG Composite Type Reference`.

## Claims

### Claim 1
- **Text:** DTCG was proposed on 31 July 2019 by Kaelig Deloumeau-Prigent for standardising design-token interchange.
- **Target section:** Context
- **Source URL:** https://www.w3.org/community/blog/2019/07/31/proposed-group-design-tokens-community-group/
- **Pulled quote:** "The Design Tokens Community Group's goal is to provide standards upon which products and design tools can rely for sharing stylistic pieces of a design system at scale."

### Claim 2
- **Text:** First stable Format Module version 2025.10 announced 28 October 2025.
- **Target section:** Context
- **Source URL:** https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- **Pulled quote:** "The specification unlocks interoperability across design tools and code. Design systems teams can now maintain one source of truth that works everywhere."

### Claim 3
- **Text:** A token has a `$value`; a group is any JSON object without `$value`. Groups nest via plain JSON keys.
- **Target section:** Best Practices
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "An object with a $value property is a token."

### Claim 4
- **Text:** Optional reserved keys: `$type` (group-inheritable), `$description`, `$extensions` (vendor-namespaced), `$deprecated` (with reason).
- **Target section:** Best Practices
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "The optional $extensions property is an object where tools MAY add proprietary, user-, team- or vendor-specific data."

### Claim 5
- **Text:** When `$type` omitted, resolution walks parent groups and follows aliases until a `$type` is found.
- **Target section:** Deep Dive
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "If the $type property is not set on a token, then the token's type MUST be determined as follows: If the token's value is a reference... Otherwise, if any of the token's parent groups have a $type property."

### Claim 6
- **Text:** Aliases use `{group.token}` dot syntax; chains MUST resolve to a value, circular references forbidden.
- **Target section:** Deep Dive
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "Aliases MAY reference other aliases. In this case, tools MUST follow each reference until they find a token with an explicit value."

### Claim 7
- **Text:** Six primitives: `color`, `dimension`, `duration`, `fontFamily`, `fontWeight`, `number`. Plus `cubicBezier` and `strokeStyle` underpin composites.
- **Target section:** DTCG Composite Type Reference
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "color | Represents a color in the UI", "dimension | Represents an amount of distance", "duration | Represents the length of time in milliseconds".

### Claim 8
- **Text:** `shadow` token: single object or array of `{color, offsetX, offsetY, blur, spread}`; each member can be an alias.
- **Target section:** DTCG Composite Type Reference
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "Represents a shadow style. The $type property MUST be set to the string shadow."

### Claim 9
- **Text:** `border` token: `color` + `width` + `style`. `style` is itself a `strokeStyle`.
- **Target section:** DTCG Composite Type Reference
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "Represents a border style. The $type property MUST be set to the string border."

### Claim 10
- **Text:** `transition` token bundles `duration`, `delay`, and `timingFunction` (cubicBezier).
- **Target section:** DTCG Composite Type Reference
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "Represents a animated transition between two states."

### Claim 11
- **Text:** `typography` aggregates `fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`.
- **Target section:** DTCG Composite Type Reference
- **Source URL:** https://www.designtokens.org/tr/drafts/format/
- **Pulled quote:** "An object with the following properties: ... fontFamily ... fontSize ... fontWeight ... letterSpacing ... lineHeight"

### Claim 12
- **Text:** `.tokens` / `.tokens.json` extensions; media type `application/design-tokens+json`, fallback `application/json`.
- **Target section:** Best Practices
- **Source URL:** https://www.designtokens.org/glossary/
- **Pulled quote:** "A JSON file containing design tokens, typically using the .tokens or .tokens.json file extension."

### Claim 13
- **Text:** Style Dictionary 4 has first-class DTCG support; 2025.10 follow-ups in v5.
- **Target section:** Tooling Interop
- **Source URL:** https://styledictionary.com/info/dtcg/
- **Pulled quote:** "As of version 4, Style Dictionary has first-class support for the DTCG format."

### Claim 14
- **Text:** Tokens Studio for Figma defaults to DTCG dollar-prefixed format; converts entire token JSON to/from legacy.
- **Target section:** Tooling Interop
- **Source URL:** https://docs.tokens.studio/manage-settings/token-format
- **Pulled quote:** "The DTCG format prefixes the properties of a design token in the JSON file with the dollar sign ($)."

### Claim 15
- **Text:** 2025.10 co-developed by 20+ orgs (Adobe, Google, Microsoft, Meta, Figma, Sketch, Salesforce, Shopify, etc.). Reference implementations: Style Dictionary, Tokens Studio, Terrazzo.
- **Target section:** Context
- **Source URL:** https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- **Pulled quote:** "Style Dictionary, Tokens Studio, and Terrazzo serve as reference implementations, with additional support from Penpot, Figma, Sketch, Framer, Knapsack, Supernova, and zeroheight."

## Reference URLs

- https://www.designtokens.org/tr/drafts/format/
- https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- https://www.w3.org/community/blog/2019/07/31/proposed-group-design-tokens-community-group/
- https://www.designtokens.org/glossary/
- https://styledictionary.com/info/dtcg/
- https://docs.tokens.studio/manage-settings/token-format
- https://github.com/design-tokens/community-group

## Research notes

- Composite type reference table is the article's load-bearing custom section.
- Gradient composite truncated in fetch — describe at high level + spec link.
- Figma's first-party Variables REST API export still has gaps for typography/shadow/gradient round-trip — note in tooling interop.
