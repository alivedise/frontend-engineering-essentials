---
topic: Node.js ESM, `.mts`/`.cts` & `nodenext` Module Resolution
id: 1714
slug: node-esm-and-nodenext
sources_reviewed: 9
claims: 16
---

# Findings: Node.js ESM, `.mts`/`.cts` & `nodenext` Module Resolution

**Generated:** 2026-04-24
**Target article:** FEE-1714 — node-esm-and-nodenext
**Subagent mode:** PER-ARTICLE

## Claims

### Claim 1

- **Text:** Node.js decides whether a JavaScript file is an ES module or CommonJS by two signals: the file extension (`.mjs` for ESM, `.cjs` for CJS) or the nearest parent `package.json`'s `"type"` field.
- **Target section:** Context
- **Source URL:** https://nodejs.org/api/esm.html
- **Pulled quote:** "Authors can tell Node.js to interpret JavaScript as an ES module via the `.mjs` file extension, the `package.json` `\"type\"` field with a value `\"module\"`, or the `--input-type` flag with a value of `\"module\"`."

### Claim 2

- **Text:** A `package.json` `"type"` field of `"module"` makes every nearby `.js` file an ES module; absent or `"commonjs"` means CJS.
- **Target section:** Context
- **Source URL:** https://nodejs.org/api/packages.html
- **Pulled quote:** "The `\"type\"` field defines the module format that Node.js uses for all `.js` files that have that `package.json` file as their nearest parent. Files ending with `.js` are loaded as ES modules when the nearest parent `package.json` file contains a top-level field `\"type\"` with a value of `\"module\"`."

### Claim 3

- **Text:** Node's ESM resolver performs no extension guessing and no folder-main resolution; relative imports must include the file extension.
- **Target section:** Context
- **Source URL:** https://nodejs.org/api/esm.html
- **Pulled quote:** "A file extension must be provided when using the `import` keyword to resolve relative or absolute specifiers. Directory indexes (e.g. `'./startup/index.js'`) must also be fully specified."

### Claim 4

- **Text:** The ESM default resolver explicitly lists "No default extensions" and "No folder mains" as properties.
- **Target section:** Design Thinking
- **Source URL:** https://nodejs.org/api/esm.html
- **Pulled quote:** "The default resolver has the following properties: ... No default extensions. No folder mains."

### Claim 5

- **Text:** TypeScript 4.7 added two source file extensions, `.mts` and `.cts`, which mirror Node's `.mjs`/`.cjs` and emit to those extensions in the build output.
- **Target section:** Context
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- **Pulled quote:** "TypeScript supports two new source file extensions: `.mts` and `.cts`. When TypeScript emits these to JavaScript files, it will emit them to `.mjs` and `.cjs` respectively."

### Claim 6

- **Text:** Under `node16`/`nodenext`, the extension determines module format unconditionally: `.mts`/`.mjs`/`.d.mts` are always ESM and `.cts`/`.cjs`/`.d.cts` are always CJS, while `.ts`/`.js`/`.d.ts` follow the nearest `package.json` `"type"`.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **Pulled quote:** "`.mts`/`.mjs`/`.d.mts` files are always ES modules. `.cts`/`.cjs`/`.d.cts` files are always CommonJS modules. `.ts`/`.tsx`/`.js`/`.jsx`/`.d.ts` files are ES modules if the nearest ancestor package.json file contains `\"type\": \"module\"`, otherwise CommonJS modules."

### Claim 7

- **Text:** `node16` and `nodenext` are the only correct `module` options for code targeting Node.js v12 or later.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **Pulled quote:** "**node16**, **node18**, and **nodenext** are the **only correct `module` options** for all apps and libraries that are intended to run in Node.js v12 or later, whether they use ES modules or not."

### Claim 8

- **Text:** Under `node16`/`nodenext`, TypeScript walks up from each source file to find the nearest `package.json` and uses it to decide both how imports resolve and how the file is emitted.
- **Target section:** Deep Dive
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- **Pulled quote:** "When TypeScript finds a `.ts`, `.tsx`, `.js`, or `.jsx` file, it will walk up looking for a `package.json` to see whether that file is an ES module, and use that to determine: how to find other modules which that file imports and how to transform that file if producing outputs."

### Claim 9

- **Text:** Emitting the wrong module syntax is unrecoverable at runtime: ESM syntax in a CJS file or `require` calls in an `.mjs` file crash Node.
- **Target section:** Design Thinking
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/theory.html
- **Pulled quote:** "If TypeScript were to emit `/example.js` with `import` and `export` statements in it, Node.js would crash when parsing the file. If TypeScript were to emit `/main.mjs` with `require` calls, Node.js would crash during evaluation."

### Claim 10

- **Text:** Under `node16`/`nodenext`, a file detected as CJS can still be authored with `import`/`export` syntax; the emit rewrites those to `require`/`module.exports`. `verbatimModuleSyntax` prohibits this rewrite.
- **Target section:** Deep Dive
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **Pulled quote:** "TypeScript files that are determined to be in CommonJS format may still use `import` and `export` syntax by default, but the emitted JavaScript will use `require` and `module.exports` instead."

### Claim 11

- **Text:** "Masquerading as CJS" and "Masquerading as ESM" describe packages whose type declarations and JavaScript implementations disagree on module format, detected by tools like Are The Types Wrong.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/arethetypeswrong/arethetypeswrong.github.io
- **Pulled quote:** "Masquerading as CJS ... Masquerading as ESM ... These checks apply specifically to `node10`, `node16`, and `bundler` module resolution modes."

### Claim 12

- **Text:** TypeScript 5.0 added `"moduleResolution": "bundler"` for bundler-first projects; it relaxes Node's strict rules by allowing extensionless imports while still respecting export conditions.
- **Target section:** Best Practices
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "Most modern bundlers use a fusion of the ECMAScript module and CommonJS lookup rules in Node.js. For example, extensionless imports work just fine like in CommonJS, but when looking through the export conditions of a package, they'll prefer an import condition just like in an ECMAScript file."

### Claim 13

- **Text:** Library authors publishing to npm should prefer `node16`/`nodenext` over `bundler`, because `bundler` can hide compatibility issues for consumers who use raw Node.
- **Target section:** Best Practices
- **Source URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- **Pulled quote:** "If you're writing a library that's meant to be published on npm, using the bundler option can hide compatibility issues that may arise for your users who aren't using a bundler. So in these cases, using the node16 or nodenext resolution options is likely to be a better path."

### Claim 14

- **Text:** `"moduleResolution": "bundler"` is "infectious" — code written under it can rely on bundler-only features — whereas code valid under `nodenext` is also valid in bundlers.
- **Target section:** Best Practices
- **Source URL:** https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html
- **Pulled quote:** "`\"moduleResolution\": \"bundler\"` is infectious, allowing code that only works in bundlers to be produced."

### Claim 15

- **Text:** The `package.json` `"exports"` field supports conditional resolution via `"import"`, `"require"`, and `"types"` keys; conditions are matched in declaration order and the `"types"` condition should come first.
- **Target section:** Example
- **Source URL:** https://nodejs.org/api/packages.html
- **Pulled quote:** "`\"types\"` - Can be used by typing systems to resolve the typing file for the given export. This condition should always be included first."

### Claim 16

- **Text:** Publishing a dual CJS/ESM package creates the "dual package hazard": the same package can be loaded twice (once per loader), producing two module instances whose classes and singletons do not share identity.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/GeoffreyBooth/dual-package-hazard
- **Pulled quote:** "The dual package hazard occurs in packages that ship both CJS and ESM entry points, allowing the same package to get loaded twice: once through the CJS loader and once through the ESM loader."

## Reference URLs

- https://nodejs.org/api/esm.html
- https://nodejs.org/api/packages.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- https://www.typescriptlang.org/docs/handbook/modules/reference.html
- https://www.typescriptlang.org/docs/handbook/modules/theory.html
- https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html
- https://github.com/arethetypeswrong/arethetypeswrong.github.io
- https://github.com/GeoffreyBooth/dual-package-hazard

## Rejected sources

- Dev.to & Medium & personal blogs — rejected per source tier rule.

## Research notes

- "Masquerading as CJS/ESM" phrasing originates in Are The Types Wrong tool, not a TS error message. Frame as community/tooling term.
- For the Visual section, a decision flowchart (extension or package.json type -> module kind -> resolution rules) works well.
- For Example section, minimal dual-export package.json with exports conditions is supported by Claim 15.
