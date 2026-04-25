---
id: 910
title: W3C DTCG Format Module — Complete Token Spec Reference
state: draft
slug: dtcg-token-format-spec
category: Design Systems and UI Libraries
level: mid
---

# [FEE-910] W3C DTCG Format Module — Complete Token Spec Reference

:::info
The W3C Design Tokens Community Group (DTCG) Format Module defines a JSON-based interchange format for design tokens. It reached its first stable version, 2025.10, on 28 October 2025. This article covers the file shape, the type primitives, the seven composite types, alias resolution, and tooling. Use it as a reference when adopting `.tokens.json` across design tools and code pipelines.
:::

## Context

The Design Tokens Community Group was [proposed on 31 July 2019](https://www.w3.org/community/blog/2019/07/31/proposed-group-design-tokens-community-group/) by Kaelig Deloumeau-Prigent with the chartered goal "to provide standards upon which products and design tools can rely for sharing stylistic pieces of a design system at scale." Until late 2025, every implementation tracked one of several editor's drafts, with subtle disagreements about reserved keys, alias syntax, and composite shape.

That changed on 28 October 2025, when the DTCG [announced the first stable version, 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), declaring the specification "unlocks interoperability across design tools and code." The release was co-developed by 20+ organisations (Adobe, Google, Microsoft, Meta, Figma, Sketch, Salesforce, Shopify, and others), with Style Dictionary, Tokens Studio, and Terrazzo serving as reference implementations alongside Penpot, Framer, Knapsack, Supernova, and zeroheight. The [Format Module editor's drafts](https://www.designtokens.org/tr/drafts/format/) remain the canonical source for implementers tracking subsequent revisions.

## Visual

| Concept | Required key | Optional reserved keys | Notes |
| --- | --- | --- | --- |
| Token | `$value` | `$type`, `$description`, `$extensions`, `$deprecated` | Any JSON object with `$value` is a token |
| Group | (none) | `$type`, `$description`, `$extensions` | Any JSON object without `$value`; nests via plain JSON keys |
| Alias | `$value: "{group.token}"` | — | Dot-separated path to another token |
| File | — | — | `.tokens` or `.tokens.json`; media type `application/design-tokens+json` |

## Example

A minimal `.tokens.json` file with a group, a primitive, an alias, and a composite shadow:

```json
{
  "color": {
    "$type": "color",
    "brand": { "$value": "#0055ff" },
    "primary": { "$value": "{color.brand}" }
  },
  "elevation": {
    "card": {
      "$type": "shadow",
      "$value": {
        "color": "{color.brand}",
        "offsetX": "0px",
        "offsetY": "2px",
        "blur": "8px",
        "spread": "0px"
      }
    }
  }
}
```

`color.primary` resolves through `color.brand` to `#0055ff`. The `elevation.card` shadow inlines an alias for its `color` member, which the spec permits per-property inside composites. Per the DTCG glossary, this file would carry the `.tokens.json` extension and be served as `application/design-tokens+json`, falling back to `application/json` where unsupported.

## Best Practices

- **MUST** mark every token with a `$value` property; any object without `$value` is a group, per the spec text "An object with a $value property is a token."
- **MUST** declare `$type` either on the token or on an ancestor group when the type is not derivable from an alias chain. Group-level `$type` is inheritable by descendants.
- **MUST** namespace anything you put under `$extensions`; the spec defines `$extensions` as the slot where "tools MAY add proprietary, user-, team- or vendor-specific data," and namespacing prevents collisions across tools.
- **SHOULD** use `.tokens.json` (or `.tokens`) as the file extension and `application/design-tokens+json` as the media type, matching the DTCG glossary's published convention.
- **SHOULD** prefer alias references (`{group.token}`) for cross-token relationships rather than duplicated literal values; aliases survive theme swaps and refactors.
- **MAY** mark deprecated tokens with `$deprecated: true` (or a string reason). Consumers can warn or filter on this without breaking existing references.

## Design Thinking

DTCG made two calibration choices worth understanding before adopting it.

Dollar-prefixed reserved keys (`$value`, `$type`, `$description`, `$extensions`, `$deprecated`) trade JSON ergonomics for a clean separation between metadata and authored token paths. The prefix means a group can contain a token named `value` without colliding with the spec's `$value` key. The cost is that every consumer ships a small parser and every author types one extra character per metadata field.

`$type` is group-inheritable. The trade-off is concision against locality: declare `$type: "color"` once on a colour group and never repeat it, at the cost that a reader skimming a deep token must walk up the tree to learn its type. The spec resolves the ambiguity deterministically (see Deep Dive), so tooling stays predictable.

## Deep Dive

**Type resolution.** When `$type` is omitted, the spec mandates a deterministic walk: "If the $type property is not set on a token, then the token's type MUST be determined as follows: If the token's value is a reference... Otherwise, if any of the token's parent groups have a $type property." The resolver follows aliases first, then walks parent groups. If neither path yields a `$type`, the token is invalid.

**Alias chains.** Aliases use the `{group.token}` dot syntax. The spec permits chains: "Aliases MAY reference other aliases. In this case, tools MUST follow each reference until they find a token with an explicit value." Every chain MUST terminate at a real value, and circular references are forbidden. Implementations typically detect cycles by tracking visited paths during resolution.

**Composite member aliases.** Inside composite types, each member field MAY itself be an alias. This is what lets a shadow's `color` member point at a brand colour while the rest of the shadow stays inline.

## DTCG Composite Type Reference

The Format Module defines eight type primitives and seven composite types. Composite types reference primitives; some composites also reference other composites (e.g. `border.style` is a `strokeStyle`).

| Type | Category | `$value` shape | Notes |
| --- | --- | --- | --- |
| `color` | Primitive | Hex string or structured object | Represents a colour in the UI |
| `dimension` | Primitive | Numeric + unit (e.g. `"16px"`, `"1rem"`) | Represents an amount of distance |
| `duration` | Primitive | Milliseconds (number or `"100ms"`) | Length of time, used by transitions |
| `fontFamily` | Primitive | String or array of strings | Single family or fallback stack |
| `fontWeight` | Primitive | Number 1-1000 or named keyword | E.g. `400`, `"bold"` |
| `number` | Primitive | Number | Unitless scalar |
| `cubicBezier` | Primitive (composite-feeder) | `[x1, y1, x2, y2]` | Used by `transition.timingFunction` |
| `strokeStyle` | Primitive (composite-feeder) | String keyword or dashed pattern object | Used by `border.style` |
| `shadow` | Composite | `{color, offsetX, offsetY, blur, spread}` or array | Single shadow or stacked array; each member MAY alias |
| `border` | Composite | `{color, width, style}` | `style` is a `strokeStyle` |
| `transition` | Composite | `{duration, delay, timingFunction}` | `timingFunction` is a `cubicBezier` |
| `typography` | Composite | `{fontFamily, fontSize, fontWeight, letterSpacing, lineHeight}` | Aggregates five primitives |
| `gradient` | Composite | Array of colour stops | See Format Module draft for full member shape |
| Stroke style (composite) | Composite | Dashed pattern object | Object form of `strokeStyle`; used inside borders |
| Composed token | Composite | Variant-specific | Spec leaves room for additional composites |

The spec text anchors these directly: "Represents a shadow style. The $type property MUST be set to the string shadow"; "Represents a border style. The $type property MUST be set to the string border"; "Represents a animated transition between two states"; and the typography type "An object with the following properties: ... fontFamily ... fontSize ... fontWeight ... letterSpacing ... lineHeight."

## Tooling Interop

Three reference implementations cover most production pipelines as of 2025.10:

- **Style Dictionary 4+.** Per the [DTCG integration page](https://styledictionary.com/info/dtcg/), "As of version 4, Style Dictionary has first-class support for the DTCG format." Version 5 tracks 2025.10 follow-ups. Style Dictionary remains the most common transform pipeline from `.tokens.json` to platform outputs (CSS variables, iOS, Android, Tailwind config).
- **Tokens Studio for Figma.** The [token format docs](https://docs.tokens.studio/manage-settings/token-format) note that "The DTCG format prefixes the properties of a design token in the JSON file with the dollar sign ($)." Tokens Studio defaults to DTCG and offers a one-shot conversion of an entire token JSON between legacy and DTCG layouts.
- **Terrazzo.** Listed in the 2025.10 announcement as a reference implementation alongside Style Dictionary and Tokens Studio.

Figma's first-party Variables REST API export still has gaps for typography, shadow, and gradient round-trips. If you need full composite fidelity from Figma, route through Tokens Studio or post-process the Variables export.

## Related Topics

- [Design Tokens (FEE-901)](/en/Design%20Systems%20and%20UI%20Libraries/901)

## References

- Design Tokens Community Group, "Design Tokens Format Module (Editor's Drafts)," W3C CG (2025). https://www.designtokens.org/tr/drafts/format/
- Design Tokens Community Group, "Design Tokens Specification Reaches First Stable Version," W3C CG blog (2025). https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- Kaelig Deloumeau-Prigent, "Proposed Group: Design Tokens Community Group," W3C Community blog (2019). https://www.w3.org/community/blog/2019/07/31/proposed-group-design-tokens-community-group/
- Design Tokens Community Group, "Glossary," designtokens.org (2025). https://www.designtokens.org/glossary/
- Style Dictionary, "DTCG Format Support," styledictionary.com (2025). https://styledictionary.com/info/dtcg/
- Tokens Studio, "Token Format," docs.tokens.studio (2025). https://docs.tokens.studio/manage-settings/token-format
- Design Tokens Community Group, "community-group repository," GitHub (2025). https://github.com/design-tokens/community-group
