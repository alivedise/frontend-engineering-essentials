---
topic: Style Dictionary 4 Build Pipeline
id: 911
slug: style-dictionary-4-pipeline
sources_reviewed: 11
claims: 20
---

# Findings: Style Dictionary 4 Build Pipeline — Transforms, Formats, Hooks

**Proposed topic-specific section:** `## Hook Type Reference Table`.

## Claims

### Claim 1
- **Text:** Build sequence: parsers → deep-merge → preprocessors → transforms → formats → output (+ actions).
- **Target section:** Context
- **Source URL:** https://styledictionary.com/info/architecture/
- **Pulled quote:** "Style Dictionary takes all the files it found and performs a deep merge... it then performs all the transforms defined in your config in order... for each file defined in the platform it formats the token object and write the output to a file."

### Claim 2
- **Text:** Transform = function modifying name, value, or attributes for a target platform.
- **Target section:** Context
- **Source URL:** https://styledictionary.com/reference/hooks/transforms/
- **Pulled quote:** "Transforms are functions that modify a token so that it can be understood by a specific platform."

### Claim 3
- **Text:** v4 groups extension points under `hooks` with plural keys: `hooks.transforms`, `hooks.formats`, `hooks.filters`, `hooks.parsers`, `hooks.preprocessors`, `hooks.actions`, `hooks.fileHeaders`.
- **Target section:** Hook Type Reference Table
- **Source URL:** https://styledictionary.com/versions/v4/migration/
- **Pulled quote:** "Hooks are now all grouped under the `hooks` property, they all use plural form vs singular."

### Claim 4
- **Text:** Transform types: `value`, `name`, `attribute`. Value transform changes how the token renders.
- **Target section:** Hook Type Reference Table
- **Source URL:** https://styledictionary.com/reference/hooks/transforms/
- **Pulled quote:** "Attribute: An attribute transform adds to the attributes object on a design token...Name: A name transform transforms the name of a design token...Value: The value transform is the most important as this is the one that modifies the value or changes the representation of the value."

### Claim 5
- **Text:** Transitive transforms run on a referenced value's already-transformed output, instead of being skipped because the input was a reference.
- **Target section:** Deep Dive
- **Source URL:** https://styledictionary.com/reference/hooks/transforms/
- **Pulled quote:** "You can define transitive transforms which allow you to transform a referenced value."

### Claim 6
- **Text:** Reference resolution is iterative: transform non-referenced → resolve refs to non-referenced → transform → repeat.
- **Target section:** Deep Dive
- **Source URL:** https://styledictionary.com/reference/hooks/transforms/
- **Pulled quote:** "Style Dictionary will transform and resolve values iteratively."

### Claim 7
- **Text:** Pre-built transformGroups include `css`, `scss`, `js`, `android`, `ios-swift`, `compose`, `flutter`, `react-native`.
- **Target section:** Best Practices
- **Source URL:** https://styledictionary.com/reference/hooks/transform-groups/predefined/
- **Pulled quote:** "css: attribute/cti, name/kebab, time/seconds, html/icon, size/rem, color/css, asset/url, fontFamily/css, cubicBezier/css, strokeStyle/css/shorthand, border/css/shorthand, typography/css/shorthand, transition/css/shorthand, shadow/css/shorthand"

### Claim 8
- **Text:** Custom format: `(args) => string`.
- **Target section:** Example
- **Source URL:** https://styledictionary.com/reference/hooks/formats/
- **Pulled quote:** "A format has a name and a format function, which takes an object as the argument and should return a string which is then written to a file."

### Claim 9
- **Text:** `outputReferences: true` keeps `var(--color-base)` references in the output instead of flattening.
- **Target section:** Best Practices
- **Source URL:** https://styledictionary.com/reference/hooks/formats/
- **Pulled quote:** "With this configuration...This would be the output...The css variables file now keeps the references you have in your Style Dictionary!"

### Claim 10
- **Text:** File-level `filter` lets one format produce multiple files scoped to token subsets.
- **Target section:** Best Practices
- **Source URL:** https://styledictionary.com/reference/hooks/formats/
- **Pulled quote:** "A special file configuration is `filter`, which will filter the tokens before they get to the format."

### Claim 11
- **Text:** Format authors detect DTCG via `usesDtcg` arg ($value/$type/$description keys).
- **Target section:** Example
- **Source URL:** https://styledictionary.com/reference/hooks/formats/
- **Pulled quote:** "`usesDtcg` tells you whether the Design Token Community Group spec is used with $ prefixes ($value, $type etc.)"

### Claim 12
- **Text:** Custom parsers let token sources live in YAML, JS5, TS, etc., as long as parser returns JSON-serialisable.
- **Target section:** Hook Type Reference Table
- **Source URL:** https://styledictionary.com/reference/hooks/parsers/
- **Pulled quote:** "you can define custom parsers to parse design token files."

### Claim 13
- **Text:** Preprocessors operate on the merged dictionary as a whole, after parsing and before transform. Global or per-platform.
- **Target section:** Hook Type Reference Table
- **Source URL:** https://styledictionary.com/reference/hooks/preprocessors/
- **Pulled quote:** "you can define custom preprocessors to process the dictionary object as a whole, after all token files have been parsed and combined into one."

### Claim 14
- **Text:** Actions are escape hatches for non-text artifacts (sprites, copying images, generating binaries).
- **Target section:** Example
- **Source URL:** https://styledictionary.com/reference/hooks/actions/
- **Pulled quote:** "Actions provide a way to run custom build code such as generating binary assets like images."

### Claim 15
- **Text:** v4 has first-class DTCG support; an instance uses DTCG OR legacy keys, not both.
- **Target section:** Migration from 3.x
- **Source URL:** https://styledictionary.com/info/dtcg/
- **Pulled quote:** "As of version 4, Style Dictionary has first-class support for the DTCG format."

### Claim 16
- **Text:** v4 ships ESM-only and is browser-compatible. Library rewritten as instantiable class.
- **Target section:** Migration from 3.x
- **Source URL:** https://styledictionary.com/versions/v4/migration/
- **Pulled quote:** "Style Dictionary has been entirely rewritten in ES Modules, in a way that is browser-compatible out of the box."

### Claim 17
- **Text:** v4 build APIs (`extend`, `exportPlatform`, `getPlatform`, `buildAllPlatforms`) are now async — must `await`.
- **Target section:** Migration from 3.x
- **Source URL:** https://styledictionary.com/versions/v4/migration/
- **Pulled quote:** "The following StyleDictionary class methods are now async: `extend()`, `exportPlatform()`, `getPlatform()`, `buildAllPlatforms()`."

### Claim 18
- **Text:** Type routing now reads `token.type` directly, replacing v3's CTI dependency.
- **Target section:** Migration from 3.x
- **Source URL:** https://styledictionary.com/versions/v4/migration/
- **Pulled quote:** "In version 4, we have removed almost all hard-coupling/reliances on CTI structure and instead we will look for a `token.type` property."

### Claim 19
- **Text:** Deprecated `properties`/`allProperties` removed; use `tokens`/`allTokens`.
- **Target section:** Migration from 3.x
- **Source URL:** https://github.com/amzn/style-dictionary/releases/tag/v4.0.0
- **Pulled quote:** "allProperties / properties was deprecated in v3, and is now removed from StyleDictionary.Core, use allTokens and tokens instead."

### Claim 20
- **Text:** Filters live under `hooks.filters` in v4, replacing singular `filter` namespace.
- **Target section:** Migration from 3.x
- **Source URL:** https://github.com/amzn/style-dictionary/releases/tag/v4.0.0
- **Pulled quote:** "Filters, when registered, are put inside the hooks.filters property now, as opposed to filter."

## Reference URLs

- https://styledictionary.com/info/architecture/
- https://styledictionary.com/reference/hooks/transforms/
- https://styledictionary.com/reference/hooks/transform-groups/predefined/
- https://styledictionary.com/reference/hooks/formats/
- https://styledictionary.com/reference/hooks/parsers/
- https://styledictionary.com/reference/hooks/preprocessors/
- https://styledictionary.com/reference/hooks/actions/
- https://styledictionary.com/reference/config/
- https://styledictionary.com/info/dtcg/
- https://styledictionary.com/versions/v4/migration/
- https://github.com/amzn/style-dictionary/releases/tag/v4.0.0

## Research notes

- "Hook Type Reference Table" is the highest-value differentiator (official docs spread it across 8 separate pages).
- "Migration from 3.x" is also strong; can be a sub-section.
- v4 phase order (parsers → preprocessors → transforms → formats → actions) implied across pages but never published as one diagram. Visual section should draw the full chain.
- DTCG 2025.10 partial support; treat as "first-class for stable subset, not latest draft".
- `outputReferences` accepts a function (token-aware predicate) in v4.
