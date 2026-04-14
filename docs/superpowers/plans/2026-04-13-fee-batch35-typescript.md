# FEE Batch 35 — TypeScript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write all 9 TypeScript category articles (FEE-1700 through FEE-1708) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW translation. Articles follow the standard FEE format: frontmatter → context paragraph → Design Thinking (### subsections) → Best Practices (RFC-2119 bold-prefix paragraphs) → Visual/Example where applicable → Common Mistakes where warranted → Related FEEs → References. No code blocks or ### subheadings inside Best Practices sections.

**Tech Stack:** Markdown, Handlebars (none — pure content authoring). Reference existing articles in `docs/en/Developer Experience and Tooling/` for format examples.

---

## File Map

**New directories to create:**
- `docs/en/TypeScript/`
- `docs/zh-tw/TypeScript/`

**Files to create (EN):**
- `docs/en/TypeScript/1700.md` — overview
- `docs/en/TypeScript/1701.md` — Type System Fundamentals & Type Inference
- `docs/en/TypeScript/1702.md` — Generics
- `docs/en/TypeScript/1703.md` — Utility Types & Type Manipulation
- `docs/en/TypeScript/1704.md` — Narrowing & Type Guards
- `docs/en/TypeScript/1705.md` — Declaration Files & DefinitelyTyped
- `docs/en/TypeScript/1706.md` — tsconfig & Strict Mode
- `docs/en/TypeScript/1707.md` — TypeScript in React
- `docs/en/TypeScript/1708.md` — Runtime Validation & Schema Libraries

**Files to create (zh-TW):** Mirror of the above under `docs/zh-tw/TypeScript/`.

---

## Format Reference

Before writing any article, read `docs/en/Developer Experience and Tooling/1603.md` as a format reference. Key rules:

- Frontmatter: `id`, `title`, `state: draft`, `category: TypeScript`
- H1: `# Title` (no `[FEE-XXXX]` prefix for 1600s+ articles)
- Opening: 2–4 paragraphs of context before any `##` heading
- `## Design Thinking` contains `###` subsections with prose
- `## Best Practices` contains RFC-2119 bold-prefix paragraphs only — no code blocks, no `###` subheadings, no bullet lists
- BP prefix severity must match body severity: `MUST` prefix → body uses MUST; `SHOULD` prefix → body stays SHOULD
- zh-TW `## 最佳實踐` uses parenthetical keywords: 必須（MUST）、應該（SHOULD）、禁止（MUST NOT）
- zh-TW section headers: `## 設計思維`, `## 最佳實踐`, `## 視覺呈現`, `## 範例`, `## 常見錯誤`, `## 相關 FEE`, `## 參考資料`

---

### Task 1: FEE-1700 TypeScript Overview

**Files:**
- Create: `docs/en/TypeScript/1700.md`
- Create: `docs/zh-tw/TypeScript/1700.md`

- [ ] **Step 1: Write EN article**

  Create `docs/en/TypeScript/1700.md` with the following content:

  **Frontmatter:**
  ```
  ---
  id: 1700
  title: TypeScript Overview
  state: draft
  overview: true
  category: TypeScript
  ---
  ```

  **H1:** `# TypeScript Overview`

  **Opening context (write 3–4 paragraphs covering):**
  - TypeScript is a statically typed superset of JavaScript that compiles to plain JavaScript. Every valid JavaScript file is a valid TypeScript file. TypeScript adds a type system that is erased at compile time — it produces no runtime overhead.
  - The fundamental value: TypeScript moves a class of errors from runtime to compile time. A mistyped property name, a function called with the wrong argument type, a null dereference — these are errors that JavaScript discovers only when the code runs. TypeScript discovers them when the code is written.
  - The tradeoff: TypeScript requires a compilation step and a tsconfig, adds syntax to read and write, and creates a maintenance obligation for type declarations. The question is not whether TypeScript is good but whether the project's context — team size, codebase lifetime, complexity — justifies the overhead. For most teams building anything that will be maintained, it does.
  - This overview maps the TypeScript category: each article covers one facet of the type system or one application concern. The order — fundamentals, generics, utility types, narrowing, declarations, configuration, React integration, runtime validation — mirrors the order a developer would encounter these topics when adding TypeScript to a real project.

  **`## Design Thinking` subsections:**
  - `### TypeScript's type system is structural, not nominal` — Explain structural typing: two types are compatible if they have the same shape, regardless of name. This is why a function expecting `{ name: string }` accepts any object with a `name` string property. This differs from Java/C# nominal typing and has practical consequences for how interfaces and type aliases behave.
  - `### The cost of adopting TypeScript scales with delay` — Retrofitting TypeScript onto an existing JavaScript codebase requires touching every file. Teams that delay adoption until the codebase is large face a migration that takes weeks, introduces `any` annotations as escape hatches, and produces incomplete coverage until the escapes are resolved. Starting with TypeScript costs one afternoon of configuration.
  - `### TypeScript is not a substitute for runtime validation` — TypeScript types are erased at compile time. An API response typed as `User` is not validated as `User` — it is trusted as `User`. Data from external sources (APIs, localStorage, URL parameters) must be validated at runtime with a schema library. This distinction is covered in FEE-1708.

  **`## Best Practices`** — write these rules exactly as shown, as prose paragraphs with bold RFC-2119 prefixes:

  **MUST add TypeScript to new projects from day one, not retrofit it after the codebase grows.** Retrofitting TypeScript requires touching every file to add type annotations and resolve errors. Teams that defer adoption until the codebase is large face a multi-week migration that produces `any` annotations as escape hatches — annotations that persist long after the migration is nominally complete, leaving silent gaps in type coverage. The configuration cost of TypeScript at project start is measured in minutes; the migration cost grows proportionally with codebase size.

  **MUST enable the `strict` flag in `tsconfig.json` at project initialization.** Strict mode activates `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, and `strictPropertyInitialization` together. The cost of resolving strict-mode errors is lowest when the codebase is small. Enabling strict mode after the codebase grows requires fixing hundreds of pre-existing errors and produces a prolonged broken-build state. Enabling individual strict flags without the umbrella `strict` flag also risks missing new strict checks added in future TypeScript versions.

  **MUST NOT use `@ts-ignore` without a comment explaining the reason and the conditions under which it can be removed.** A bare `@ts-ignore` suppresses the type error and removes all record of why. When the underlying issue is resolved upstream — a library ships its own types, a structural change makes the cast unnecessary — the directive remains indefinitely, invisibly widening the type safety gap. Every suppression directive is technical debt; treating it as such means documenting it.

  **SHOULD measure TypeScript adoption quality by the rate of type-related runtime errors in production, not by type coverage percentage.** Type coverage tools measure how much of the codebase has explicit type annotations, but a codebase with 95% coverage and liberal `any` usage can have worse type safety than one with 80% coverage and strict mode enabled. Production error rates caused by property-does-not-exist or cannot-read-property-of-undefined errors are the signal that TypeScript is meant to eliminate.

  **`## Related FEEs`:**
  - FEE-301 — Event Loop & Async Model (TypeScript's async/await types build on the runtime model)
  - FEE-1701 — Type System Fundamentals & Type Inference
  - FEE-1706 — tsconfig & Strict Mode
  - FEE-1708 — Runtime Validation & Schema Libraries

  **`## References`:**
  - TypeScript Handbook — https://www.typescriptlang.org/docs/handbook/intro.html
  - TypeScript FAQ — https://github.com/microsoft/TypeScript/wiki/FAQ
  - TypeScript Deep Dive (Basarat) — https://basarat.gitbook.io/typescript/

- [ ] **Step 2: Verify EN format**

  Check:
  - [ ] Frontmatter has `id: 1700`, `state: draft`, `overview: true`, `category: TypeScript`
  - [ ] H1 is `# TypeScript Overview` with no `[FEE-1700]` prefix
  - [ ] `## Best Practices` has no code blocks, no `###` subheadings, no bullet lists
  - [ ] Each BP rule has a bold prefix with a single RFC-2119 keyword (MUST/SHOULD/MUST NOT)
  - [ ] Body of each BP rule uses the same severity level as its prefix keyword

- [ ] **Step 3: Write zh-TW article**

  Create `docs/zh-tw/TypeScript/1700.md` with the following content:

  **Frontmatter:**
  ```
  ---
  id: 1700
  title: TypeScript 總覽
  state: draft
  overview: true
  category: TypeScript
  ---
  ```

  **H1:** `# TypeScript 總覽`

  **Opening context:** Translate the EN opening paragraphs into Traditional Chinese. Key terms: 靜態型別（static typing）、型別系統（type system）、編譯時期（compile time）、執行時期（runtime）、超集合（superset）。

  **`## 設計思維` subsections:**
  - `### TypeScript 的型別系統是結構性的，而非名義性的`
  - `### 採用 TypeScript 的成本隨延遲而增加`
  - `### TypeScript 不能取代執行時期驗證`

  **`## 最佳實踐`** — translate each BP rule exactly. RFC-2119 keywords use parenthetical format:

  **必須（MUST）在新專案一開始就加入 TypeScript，而非等到程式碼庫成長後再補加。** [Translate the EN rule body.]

  **必須（MUST）在專案初始化時於 `tsconfig.json` 中啟用 `strict` 旗標。** [Translate the EN rule body.]

  **禁止（MUST NOT）在沒有說明原因的情況下使用 `@ts-ignore`。** [Translate the EN rule body, noting the condition for removal: 說明可移除的時機。]

  **應該（SHOULD）以生產環境中與型別相關的執行時期錯誤率來衡量 TypeScript 採用品質，而非型別覆蓋率。** [Translate the EN rule body.]

  **`## 相關 FEE`:** Mirror the EN Related FEEs with Chinese descriptions.
  **`## 參考資料`:** Mirror the EN References.

- [ ] **Step 4: Verify zh-TW format**

  Check:
  - [ ] Frontmatter matches EN except title is Chinese
  - [ ] Section headers use zh-TW names (`## 設計思維`, `## 最佳實踐`, etc.)
  - [ ] BP keywords use parenthetical format: 必須（MUST）、應該（SHOULD）、禁止（MUST NOT）
  - [ ] No code blocks inside `## 最佳實踐`

- [ ] **Step 5: Commit**

  ```bash
  git add docs/en/TypeScript/1700.md docs/zh-tw/TypeScript/1700.md
  git commit -m "feat(fee): add FEE-1700 TypeScript Overview (EN + zh-TW)"
  ```

---

### Task 2: FEE-1701 Type System Fundamentals & Type Inference

**Files:**
- Create: `docs/en/TypeScript/1701.md`
- Create: `docs/zh-tw/TypeScript/1701.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1701
  title: Type System Fundamentals & Type Inference
  state: draft
  category: TypeScript
  ---
  ```

  **Opening context (3–4 paragraphs):**
  - TypeScript's type system has two modes of operation: explicit annotation (the developer states the type) and inference (TypeScript derives the type from the value or context). Most of the time, inference is sufficient and annotation is noise. Understanding where each belongs is the first practical TypeScript skill.
  - The primitive types (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) and the escape hatches (`any`, `unknown`, `never`) form the foundation. `any` disables type checking. `unknown` is the safe alternative — it accepts any value but forces narrowing before use. `never` represents unreachable code and drives exhaustiveness checking.
  - Union types (`string | number`) and intersection types (`A & B`) let the type system express "one of these" and "all of these" respectively. Literal types (`'success' | 'error'`) turn string/number/boolean values into types, enabling discriminated unions and exhaustiveness checking.

  **`## Design Thinking` subsections:**
  - `### Inference eliminates annotation noise` — TypeScript infers the type of `const x = 42` as `number`, `const arr = [1, 2, 3]` as `number[]`, and function return types from the return expression. Annotating these manually adds maintenance burden without safety benefit. The boundary where annotation matters: function parameters (inference cannot reach across call sites), public API return types (explicit contract), and variable declarations that will be assigned later.
  - `### any vs unknown: the difference matters` — `any` is a bidirectional escape: a value typed as `any` can be assigned to any type and can have any operation performed on it without error. `unknown` is one-directional: any value can be assigned to `unknown`, but `unknown` cannot be used until narrowed. This makes `unknown` safe for representing genuinely unknown input (JSON responses, error catch clauses) while `any` is safe for nothing.
  - `### never as correctness proof` — A function that throws always returns `never`. A switch statement that handles all cases of a union has a default branch that is unreachable — TypeScript types that branch as `never`. Assigning the value to a variable typed `never` (`const _: never = value`) causes a compile error if a new union member is added without updating the switch. This pattern is called exhaustiveness checking.

  **`## Best Practices`:**

  **MUST prefer `unknown` over `any` for values of genuinely unknown type.** `any` disables all type checking for the value and everything derived from it — a property access on an `any` value returns `any`, spreading the unsafety silently through the codebase. `unknown` forces explicit narrowing before use, preserving the type safety guarantee. Use `unknown` in error catch clauses, for deserialized JSON, and for any value whose shape is not known at the call site.

  **MUST use `never` exhaustiveness checks in switch statements and discriminated union handlers.** When a switch statement handles a discriminated union, the default branch should assign the value to a `never`-typed variable. If a new member is added to the union without updating the switch, the assignment fails to compile. This pattern makes the switch a compile-time contract: adding a variant without handling it is a build error, not a silent runtime fallthrough.

  **SHOULD let TypeScript infer types for local variables, array/object literals, and function return types where the return expression makes the type obvious.** Explicit annotations at inference sites add line noise and create a second source of truth that can drift from the actual type. Reserve explicit annotations for function parameters, public API return types, and variables that are declared before assignment.

  **SHOULD use literal types and union types to model domain values rather than widening to string or number.** A status field typed as `'pending' | 'fulfilled' | 'rejected'` is more precise than `string` and enables exhaustiveness checking wherever the field is switched on. Widening to `string` discards the constraint and removes the compile-time guarantee that all states are handled.

  **`## Related FEEs`:**
  - FEE-1700 — TypeScript Overview
  - FEE-1702 — Generics
  - FEE-1704 — Narrowing & Type Guards

  **`## References`:**
  - TypeScript Handbook: Basic Types — https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
  - TypeScript Handbook: Narrowing — https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - TypeScript Handbook: More on Functions — https://www.typescriptlang.org/docs/handbook/2/functions.html

- [ ] **Step 2: Verify EN format**
  - [ ] No code blocks in `## Best Practices`
  - [ ] BP prefix severity matches body severity
  - [ ] `never` exhaustiveness pattern described without code block

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1701`, `title: 型別系統基礎與型別推論`, `state: draft`, `category: TypeScript`

  **`## 設計思維` subsections:**
  - `### 推論消除多餘的型別標註`
  - `### any 與 unknown 的差異至關重要`
  - `### never 作為正確性證明`

  **`## 最佳實踐`** — translate all four BP rules with parenthetical RFC-2119 keywords. Key terms: 未知型別（unknown type）、型別收窄（narrowing）、窮舉性檢查（exhaustiveness check）、聯合型別（union type）、字面型別（literal type）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1701.md docs/zh-tw/TypeScript/1701.md
  git commit -m "feat(fee): add FEE-1701 Type System Fundamentals (EN + zh-TW)"
  ```

---

### Task 3: FEE-1702 Generics

**Files:**
- Create: `docs/en/TypeScript/1702.md`
- Create: `docs/zh-tw/TypeScript/1702.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1702`, `title: Generics`, `state: draft`, `category: TypeScript`

  **Opening context (3–4 paragraphs):**
  - Generics allow a function, interface, or class to operate on a type that is determined at the call site rather than at definition time. A function that wraps a value in an array — `function wrap<T>(value: T): T[]` — works correctly for any type without losing the type information that a non-generic `function wrap(value: any): any[]` would discard.
  - The power of generics is type propagation: the relationship between input types and output types is preserved. A function that returns the first element of an array typed as `T[]` returns `T`, not `unknown`. The caller knows what they will receive without needing a type assertion.
  - Generics are commonly overused. A generic type parameter that appears only once — used in the input and nowhere else — adds complexity without benefit. Generic constraints are the mechanism for restricting what types a parameter can be: `<T extends string>` limits T to string subtypes; `<T extends { id: number }>` limits T to objects with an `id` field.

  **`## Design Thinking` subsections:**
  - `### Generics preserve type information across operations` — Show the contrast between `identity(value: any): any` (loses type) and `identity<T>(value: T): T` (preserves type). The generic version allows the caller to know the return type is the same as the input type.
  - `### Constraints express the minimum required shape` — A generic function that accesses `value.length` can use `<T extends { length: number }>` instead of `<T extends string | Array<any>>`. This is narrower about intent (any value with a length) and wider about capability (accepts typed arrays, strings, custom objects).
  - `### When not to use generics` — A function that takes `string | number` and returns `string | number` does not benefit from a generic. A generic `<T extends string | number>(value: T): T` is harder to read and provides no additional safety. Use a union type when the relationship between input and output types is symmetric; use a generic when the output type is derived from the specific input type.

  **`## Best Practices`:**

  **MUST constrain generic type parameters when the function body accesses a property or method of the parameter.** Using `<T extends { id: string }>` instead of bare `<T>` when the function accesses `value.id` makes the requirement explicit, produces a better error message when the constraint is violated, and prevents callers from passing incompatible types that would fail at runtime.

  **MUST NOT define a generic type parameter that appears only in the return type or only once in the entire signature.** A parameter that appears only once cannot be inferred from call-site arguments and requires explicit annotation at every call. If the caller must always write `fn<string>(arg)` rather than `fn(arg)`, the generic is not providing inference — it is requiring annotation. A simpler overload or union type is clearer.

  **SHOULD name single-letter type parameters only when the parameter is truly interchangeable with any type.** `T` is appropriate for a generic identity function. When a type parameter has semantic meaning — it represents a resource type, a key type, an entity — name it: `ResourceType`, `KeyType`, `EntityShape`. Meaningful names make complex generic signatures readable without requiring documentation.

  **SHOULD use `infer` in conditional types to extract component types from composite types rather than requiring callers to provide type arguments explicitly.** `ReturnType<typeof fn>` uses `infer` to extract the return type from a function type without the caller needing to annotate it. Writing `infer R` in a conditional type is the right tool when a utility type needs to "reach inside" another type to extract a part.

  **`## Related FEEs`:**
  - FEE-1701 — Type System Fundamentals & Type Inference
  - FEE-1703 — Utility Types & Type Manipulation

  **`## References`:**
  - TypeScript Handbook: Generics — https://www.typescriptlang.org/docs/handbook/2/generics.html
  - TypeScript Handbook: Conditional Types — https://www.typescriptlang.org/docs/handbook/2/conditional-types.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1702`, `title: 泛型`, `state: draft`, `category: TypeScript`

  Key zh-TW terms: 泛型（generics）、型別參數（type parameter）、型別推論（type inference）、型別約束（type constraint）、條件型別（conditional types）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1702.md docs/zh-tw/TypeScript/1702.md
  git commit -m "feat(fee): add FEE-1702 Generics (EN + zh-TW)"
  ```

---

### Task 4: FEE-1703 Utility Types & Type Manipulation

**Files:**
- Create: `docs/en/TypeScript/1703.md`
- Create: `docs/zh-tw/TypeScript/1703.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1703`, `title: Utility Types & Type Manipulation`, `state: draft`, `category: TypeScript`

  **Opening context:** TypeScript ships a library of generic utility types that transform existing types into new ones. These utilities — `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Exclude`, `Extract`, `ReturnType`, `Parameters`, `NonNullable`, `Record` — eliminate the need to manually redefine type shapes when a variant of an existing type is needed. Manually redefined shapes drift when the source type changes; structural derivation stays synchronized automatically.

  **`## Design Thinking` subsections:**
  - `### Derivation vs. duplication` — A type that duplicates a subset of another type's fields will silently fall out of sync when the source type evolves. `Pick<User, 'id' | 'name'>` automatically reflects any changes to `User`'s `id` and `name` fields.
  - `### Mapped types: the engine behind utility types` — Explain that `Partial<T>`, `Readonly<T>` etc. are built on mapped types: `{ [K in keyof T]?: T[K] }`. Understanding the pattern lets developers build custom utilities when the built-ins don't fit.
  - `### Template literal types for string transformation` — TypeScript 4.1+ supports `Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>`, `Uncapitalize<S>` and template literal types (``type EventName = `on${Capitalize<string>}``). These enable type-level string manipulation for event names, CSS property derivation, and API key naming.

  **`## Best Practices`:**

  **MUST use `Pick<T, K>` and `Omit<T, K>` rather than redefining type shapes manually when a subset or exclusion of an existing type is needed.** Manual redefinition creates a second source of truth that diverges silently when the source type adds, removes, or renames fields. Structural derivation with `Pick` and `Omit` is a declaration of intent — "this type is this subset of that type" — that TypeScript enforces automatically.

  **MUST use `Readonly<T>` for objects passed as configuration, stored as module-level constants, or used as default values.** `Readonly<T>` prevents accidental mutation at call sites with no runtime overhead — the check is compile-time only. For deeply nested objects where shallow readonly is insufficient, use `as const` on the literal value, which produces a deeply readonly type.

  **SHOULD use `ReturnType<typeof fn>` and `Parameters<typeof fn>` to derive types from existing function signatures rather than duplicating them.** When a function's signature changes, types derived from `ReturnType` and `Parameters` update automatically. Separately maintained type declarations require a manual update and a human to notice the mismatch.

  **SHOULD build custom mapped types when the built-in utilities do not express the required transformation.** The pattern `{ [K in keyof T]: ... }` is the foundation of all built-in utilities and is available to application code. A custom mapped type that makes all values of an object `Promise<V>` — `{ [K in keyof T]: Promise<T[K]> }` — is idiomatic TypeScript, not an advanced technique.

  **`## Related FEEs`:**
  - FEE-1702 — Generics
  - FEE-1704 — Narrowing & Type Guards

  **`## References`:**
  - TypeScript Handbook: Utility Types — https://www.typescriptlang.org/docs/handbook/utility-types.html
  - TypeScript Handbook: Mapped Types — https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
  - TypeScript Handbook: Template Literal Types — https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1703`, `title: 工具型別與型別操作`, `state: draft`, `category: TypeScript`

  Key zh-TW terms: 工具型別（utility types）、映射型別（mapped types）、結構性衍生（structural derivation）、樣板字面型別（template literal types）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1703.md docs/zh-tw/TypeScript/1703.md
  git commit -m "feat(fee): add FEE-1703 Utility Types & Type Manipulation (EN + zh-TW)"
  ```

---

### Task 5: FEE-1704 Narrowing & Type Guards

**Files:**
- Create: `docs/en/TypeScript/1704.md`
- Create: `docs/zh-tw/TypeScript/1704.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1704`, `title: Narrowing & Type Guards`, `state: draft`, `category: TypeScript`

  **Opening context:** Narrowing is TypeScript's mechanism for refining a value's type within a conditional branch. When code checks `typeof value === 'string'`, TypeScript knows that within the true branch, `value` is `string`. This check — and similar checks using `instanceof`, the `in` operator, equality comparisons, and truthiness — are called type guards. TypeScript understands them without explicit annotation and narrows automatically.

  **`## Design Thinking` subsections:**
  - `### Built-in narrowing operations` — `typeof` narrows primitives; `instanceof` narrows class instances; `in` narrows objects with a specific property; truthiness narrows away `null | undefined`; equality (`=== 'value'`) narrows to literal types. TypeScript tracks these through control flow.
  - `### Discriminated unions: the most powerful narrowing pattern` — A union where each member has a literal `type` or `kind` field with a unique value is a discriminated union. Switching on `type` narrows each branch to the specific member. This is more readable and more maintainable than `instanceof` chains.
  - `### When custom type guards are necessary` — When a narrowing condition is complex enough to extract into a function, the return type `value is T` tells TypeScript that the function's truth return means the parameter is `T`. Without the predicate syntax, the extracted function returns `boolean` and the narrowing is lost at the call site.

  **`## Best Practices`:**

  **MUST use discriminated unions with a literal `type` or `kind` field for sum types rather than optional fields or `instanceof` checks.** Discriminated unions enable exhaustiveness checking (see FEE-1701), produce clean narrowing in switch statements without custom guards, and are serializable without prototype information. A union of `{ type: 'circle'; radius: number } | { type: 'rectangle'; width: number; height: number }` is unambiguous in every branch.

  **MUST write type predicates (`value is T`) as the return type of custom guard functions rather than returning `boolean`.** A guard function that returns `boolean` does not propagate the narrowing to the call site — TypeScript sees only a boolean, not a narrowing assertion. The predicate syntax `function isUser(value: unknown): value is User` tells TypeScript that a `true` return means the parameter satisfies the `User` type, and narrowing flows correctly into the truthy branch at every call site.

  **SHOULD prefer `in` operator and discriminated union narrowing over `instanceof` narrowing for plain data objects.** `instanceof` creates coupling to a specific constructor function, breaks across iframe boundaries (where two instances of the same class have different constructor references), and does not work for objects created by deserialization (JSON objects never have class prototypes). Discriminated unions and `in` narrowing work on plain objects.

  **SHOULD use assertion functions (`function assert(condition): asserts condition`) to encode preconditions that must hold at a specific point in the code.** An assertion function that throws on a falsy condition tells TypeScript that after the call, the condition is true. This is useful for guarding initialization values and for expressing invariants that TypeScript cannot infer from control flow alone.

  **`## Related FEEs`:**
  - FEE-1701 — Type System Fundamentals & Type Inference
  - FEE-1703 — Utility Types & Type Manipulation
  - FEE-1708 — Runtime Validation & Schema Libraries

  **`## References`:**
  - TypeScript Handbook: Narrowing — https://www.typescriptlang.org/docs/handbook/2/narrowing.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1704`, `title: 型別收窄與型別守衛`, `state: draft`, `category: TypeScript`

  Key terms: 型別收窄（narrowing）、型別守衛（type guard）、辨別聯合（discriminated union）、型別述詞（type predicate）、斷言函式（assertion function）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1704.md docs/zh-tw/TypeScript/1704.md
  git commit -m "feat(fee): add FEE-1704 Narrowing & Type Guards (EN + zh-TW)"
  ```

---

### Task 6: FEE-1705 Declaration Files & DefinitelyTyped

**Files:**
- Create: `docs/en/TypeScript/1705.md`
- Create: `docs/zh-tw/TypeScript/1705.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1705`, `title: Declaration Files & DefinitelyTyped`, `state: draft`, `category: TypeScript`

  **Opening context:** TypeScript types for a library can come from three sources: bundled with the library (the `types` field in `package.json`), from the DefinitelyTyped community repository via `@types/<package>` packages, or from a hand-written `.d.ts` file in the project. The priority order is: bundled > `@types` > project-local. Understanding this chain prevents the common failure of writing a `.d.ts` file for a library that already has community types.

  **`## Design Thinking` subsections:**
  - `### .d.ts files: declarations without implementation` — A declaration file is TypeScript syntax with no runtime value — it describes the shape of a JavaScript module without emitting any code. It is the bridge between the JavaScript world (where types are absent) and the TypeScript world (where types are required).
  - `### Module augmentation: extending third-party types` — When a library's types are incomplete or incorrect, module augmentation allows the project to extend them without forking the package. `declare module 'library-name' { interface Options { newField: string } }` adds `newField` to the library's `Options` interface globally. This is tracked in version control and removed cleanly when the upstream type is fixed.
  - `### When to write project-local declarations` — When a library has no `@types` package and no bundled types, a minimal `.d.ts` file with `declare module 'lib-name'` (a wildcard declaration) silences the error while providing no type safety. This is acceptable as a temporary measure. A complete declaration should be contributed upstream to DefinitelyTyped.

  **`## Best Practices`:**

  **MUST install `@types/<package>` for every JavaScript dependency used in TypeScript files before concluding that a library has no type support.** Many widely used libraries ship types via DefinitelyTyped rather than bundling them. Running `npm install --save-dev @types/<package>` is the first step; checking the DefinitelyTyped search at https://www.typescriptlang.org/dt/search is the second. A library genuinely without types is rare for anything in the npm top 10,000.

  **MUST NOT write manual type declarations for packages that have official or DefinitelyTyped-published types.** Manual declarations go stale when the library updates and create false confidence — the TypeScript compiler accepts the code while the actual library behavior may differ from the declared types. Always check for existing types before writing `.d.ts` files.

  **SHOULD use module augmentation to extend third-party types rather than casting at call sites.** Module augmentation is a declaration that TypeScript enforces everywhere the augmented type is used. A cast (`as ExtendedOptions`) suppresses the error at one call site without informing other call sites that the field exists. Augmentation is also removed cleanly when the upstream type is fixed — search and replace on cast sites is not.

  **SHOULD contribute missing or corrected types to DefinitelyTyped rather than maintaining project-local declarations indefinitely.** A `.d.ts` file maintained in one project benefits only that project and creates an ongoing maintenance obligation. Types contributed to DefinitelyTyped are versioned, tested, and available to the entire ecosystem. The contribution process is documented at https://github.com/DefinitelyTyped/DefinitelyTyped.

  **`## Related FEEs`:**
  - FEE-1700 — TypeScript Overview
  - FEE-1706 — tsconfig & Strict Mode

  **`## References`:**
  - TypeScript Handbook: Declaration Files — https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html
  - DefinitelyTyped GitHub — https://github.com/DefinitelyTyped/DefinitelyTyped
  - TypeScript search for @types packages — https://www.typescriptlang.org/dt/search

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1705`, `title: 宣告檔案與 DefinitelyTyped`, `state: draft`, `category: TypeScript`

  Key terms: 宣告檔案（declaration file）、模組擴增（module augmentation）、型別套件（type package）、社群型別（community types）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1705.md docs/zh-tw/TypeScript/1705.md
  git commit -m "feat(fee): add FEE-1705 Declaration Files & DefinitelyTyped (EN + zh-TW)"
  ```

---

### Task 7: FEE-1706 tsconfig & Strict Mode

**Files:**
- Create: `docs/en/TypeScript/1706.md`
- Create: `docs/zh-tw/TypeScript/1706.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1706`, `title: tsconfig & Strict Mode`, `state: draft`, `category: TypeScript`

  **Opening context:** `tsconfig.json` is the TypeScript compiler's configuration file. It controls which files are compiled, what JavaScript version is targeted, how modules are resolved, and what type checks are enforced. Most projects need fewer than twenty options; understanding the ten that matter most and the common misconfiguration mistakes prevents the silent type-check gaps that undermine TypeScript's value.

  **`## Design Thinking` subsections:**
  - `### The strict flag as a unit` — `strict: true` is not one flag — it is an umbrella that enables a group of related checks (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.) together. As TypeScript adds new strict checks in future versions, they will be included under `strict: true` automatically. Enabling strict checks individually risks missing new additions.
  - `### Module resolution: the source of most configuration confusion` — The `moduleResolution` option controls how TypeScript resolves `import` paths. `"node"` (the legacy default) does not understand `package.json` `exports` fields, which most modern packages use. `"bundler"` (TypeScript 5+) matches how bundlers like Vite and webpack resolve modules. Mismatch between TypeScript's resolution and the bundler's resolution produces imports that type-check but fail at runtime.
  - `### Project references for monorepos` — Large projects with multiple packages benefit from TypeScript project references: each package has its own `tsconfig.json`, and the root config lists them as references. This enables incremental compilation, build ordering, and cross-package type checking.

  **`## Best Practices`:**

  **MUST enable `strict: true` in every project `tsconfig.json` and never disable it by enabling individual flags without the umbrella.** Strict mode is the minimum threshold at which TypeScript's type system catches the bugs it was designed to catch — null dereferences, implicit any, function argument variance. Disabling specific checks to silence errors is a form of type debt that compounds: once the team learns that strict checks can be disabled, the pattern spreads.

  **MUST set `moduleResolution` to `"bundler"` for projects using Vite, webpack, or another bundler, and `"node16"` or `"nodenext"` for projects running directly on Node.js.** The default `"node"` resolution does not understand `exports` fields in `package.json`, causing TypeScript to resolve imports differently than the bundler or runtime does. This mismatch produces false "module not found" errors and misses import-path errors that the runtime will surface.

  **SHOULD keep `tsconfig.json` at the project root and use `extends` to share a base configuration across packages in a monorepo.** A shared base config captures common options (`strict`, `target`, `lib`) in one place. Package-level configs extend the base and add package-specific options (`outDir`, `rootDir`, `paths`). This prevents option drift across packages.

  **SHOULD use `paths` in `tsconfig.json` to define import aliases and keep them in sync with the bundler's alias configuration.** Import aliases like `@/components/Button` are defined in both `tsconfig.json` (for TypeScript) and the bundler config (for runtime). When they fall out of sync, TypeScript accepts the import but the bundler rejects it. Treat both configs as a single unit that changes together.

  **`## Related FEEs`:**
  - FEE-1700 — TypeScript Overview
  - FEE-1705 — Declaration Files & DefinitelyTyped
  - FEE-800 — Build Tooling Overview (bundler alias configuration)

  **`## References`:**
  - TypeScript: tsconfig reference — https://www.typescriptlang.org/tsconfig
  - TypeScript: Module Resolution — https://www.typescriptlang.org/docs/handbook/modules/theory.html
  - TypeScript Project References — https://www.typescriptlang.org/docs/handbook/project-references.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1706`, `title: tsconfig 與嚴格模式`, `state: draft`, `category: TypeScript`

  Key terms: 嚴格模式（strict mode）、模組解析（module resolution）、專案參考（project references）、增量編譯（incremental compilation）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1706.md docs/zh-tw/TypeScript/1706.md
  git commit -m "feat(fee): add FEE-1706 tsconfig & Strict Mode (EN + zh-TW)"
  ```

---

### Task 8: FEE-1707 TypeScript in React

**Files:**
- Create: `docs/en/TypeScript/1707.md`
- Create: `docs/zh-tw/TypeScript/1707.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1707`, `title: TypeScript in React`, `state: draft`, `category: TypeScript`

  **Opening context:** TypeScript and React compose well because React's component model maps naturally onto TypeScript's structural type system — a component is a function from props to JSX, and a function type is exactly what TypeScript excels at typing. The practical questions are specific: how to type event handlers, how to type refs, how to type generic components, how to type children. Each has a TypeScript idiom that is more precise than reaching for `any` or guessing.

  **`## Design Thinking` subsections:**
  - `### Avoiding React.FC` — `React.FC` was the recommended annotation for function components but is now discouraged. It implicitly includes `children` in props (removed in React 18 types), it prevents using generics on components, and it adds a layer of indirection. Annotating the function's parameter directly (`({ name }: { name: string }) => <div>{name}</div>`) is cleaner.
  - `### Deriving prop types from HTML elements` — A wrapper component like `<Button>` should accept all valid HTML button attributes plus its own props. `React.ComponentProps<'button'>` gives the full set. `Omit<React.ComponentProps<'button'>, 'onClick'> & { onClick: (id: string) => void }` overrides a specific prop. This is more complete and lower maintenance than enumerating HTML props manually.
  - `### Typing refs correctly` — `useRef` has two signatures: `useRef<T>(initialValue: T)` returns a mutable ref; `useRef<T>(null)` returns a ref that React will assign. For DOM refs, always use `useRef<HTMLElement>(null)` where `HTMLElement` is the specific element type (`HTMLInputElement`, `HTMLButtonElement`). The initial value `null` must match the type parameter being nullable.

  **`## Best Practices`:**

  **MUST NOT use `React.FC` for component type annotations.** `React.FC` implicitly adds `children` to props (a pre-React-18 pattern that was removed from the recommended practice), prevents components from being typed as generics, and adds annotation overhead without benefit. Type the component's props parameter directly: `function MyComponent({ name }: MyComponentProps)`.

  **MUST type event handler props with React's synthetic event types rather than native DOM event types.** `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`, and `React.FormEvent<HTMLFormElement>` represent React's synthetic events, which have a stable cross-browser interface. Native DOM event types (`Event`, `MouseEvent`) reflect browser-specific implementations and are the wrong type for React event handlers.

  **MUST use `React.ComponentProps<'element'>` to derive prop types when building wrapper components around HTML elements.** Manually enumerating HTML attributes — `className`, `disabled`, `aria-label`, etc. — creates an incomplete list that must be updated whenever a new HTML attribute becomes relevant. `React.ComponentProps<'button'>` includes all valid attributes and stays current with the React types package.

  **SHOULD use `forwardRef` with explicit generic type arguments when a component needs to forward a ref.** `React.forwardRef<HTMLButtonElement, ButtonProps>` makes the ref type explicit and prevents callers from assigning the ref to an incompatible element type. The generic arguments are ordered `<ElementType, PropsType>` — the element type first, then the props.

  **`## Related FEEs`:**
  - FEE-1701 — Type System Fundamentals & Type Inference
  - FEE-1703 — Utility Types & Type Manipulation
  - FEE-501 — Component Composition Patterns

  **`## References`:**
  - React TypeScript Cheatsheet — https://react-typescript-cheatsheet.netlify.app/
  - React: Using TypeScript — https://react.dev/learn/typescript
  - TypeScript Handbook: JSX — https://www.typescriptlang.org/docs/handbook/jsx.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1707`, `title: TypeScript 與 React`, `state: draft`, `category: TypeScript`

  Key terms: 合成事件（synthetic event）、轉發 ref（forwarding ref）、元件屬性型別（component prop types）、泛型元件（generic component）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1707.md docs/zh-tw/TypeScript/1707.md
  git commit -m "feat(fee): add FEE-1707 TypeScript in React (EN + zh-TW)"
  ```

---

### Task 9: FEE-1708 Runtime Validation & Schema Libraries

**Files:**
- Create: `docs/en/TypeScript/1708.md`
- Create: `docs/zh-tw/TypeScript/1708.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1708`, `title: Runtime Validation & Schema Libraries`, `state: draft`, `category: TypeScript`

  **Opening context:** TypeScript's type system is erased at compile time. A type annotation on an API response, a URL parameter, or a localStorage value is a promise, not a guarantee — it tells TypeScript how to type the value, but it does not validate that the value actually conforms to that type at runtime. A type assertion (`as User`) is not validation. It is a claim that the developer trusts to be true. When the claim is wrong, the failure is silent until the mistyped property is accessed.

  **`## Design Thinking` subsections:**
  - `### The boundary problem` — TypeScript provides complete type safety for code written within the project. It provides no safety for data that enters the project from outside — API responses, URL query parameters, localStorage, environment variables, user-uploaded files. These are the boundaries where runtime validation is required.
  - `### Schema as single source of truth` — A schema library like Zod defines the shape of data in one place and derives the TypeScript type from that schema (`z.infer<typeof schema>`). The schema is both the validator (runtime) and the type (compile-time). Maintaining a separate TypeScript interface alongside a validation function creates two sources of truth that drift when the schema changes.
  - `### parse vs. safeParse` — `parse` throws a `ZodError` on invalid data. `safeParse` returns `{ success: true, data: T } | { success: false, error: ZodError }`. In application code that handles API responses or form submissions, `safeParse` integrates with TypeScript's narrowing: the `success: true` branch narrows `data` to the validated type. The `parse` variant is appropriate in test setup and initialization code where a failure should halt execution.

  **`## Best Practices`:**

  **MUST validate all data at system boundaries — API responses, URL parameters, localStorage values, and environment variables — with a schema library before treating the data as the declared TypeScript type.** TypeScript types are erased at runtime. A type assertion (`as User`) on an API response does not validate the response — it suppresses TypeScript's complaint while the runtime value may have missing fields, wrong types, or extra properties that cause failures when accessed. Validation at boundaries is the mechanism that makes TypeScript's static guarantees meaningful.

  **MUST derive the TypeScript type from the schema using the library's inference utility rather than maintaining parallel declarations.** Zod's `z.infer<typeof schema>` and Valibot's `InferOutput<typeof schema>` produce a TypeScript type that is exactly what the schema validates. When the schema changes, the type changes automatically. A separately maintained interface that duplicates the schema's fields creates a maintenance obligation that produces silent drift: the schema rejects data that the type accepts.

  **SHOULD use `safeParse` (Zod) or the equivalent non-throwing parse function in application code that handles data from external sources.** `parse` throws a `ZodError` on invalid data, which requires try/catch at every validation call site. `safeParse` returns a discriminated union result that integrates with TypeScript's control flow narrowing — the success branch provides the validated typed value; the failure branch provides the structured error. This pattern is composable and avoids exception-based control flow.

  **SHOULD validate environment variables at application startup using a schema, not with ad-hoc `process.env.VAR || 'default'` patterns.** Environment variables are strings. An API URL, a port number, and a feature flag all arrive as strings regardless of their intended types. A startup validation schema (using Zod or t3-env) coerces and validates all required environment variables at boot time, producing a typed configuration object and a clear error on startup if required variables are missing or malformed — before any request is handled.

  **`## Common Mistakes`:**

  **Using type assertions instead of validation.** `const user = data as User` tells TypeScript to treat `data` as `User` without checking. If `data` is missing a required field, the runtime failure occurs far from the assertion site, making the bug hard to trace. Assertions are appropriate only when the developer has out-of-band knowledge that TypeScript cannot verify — not as a substitute for validation.

  **`## Related FEEs`:**
  - FEE-1701 — Type System Fundamentals & Type Inference
  - FEE-1704 — Narrowing & Type Guards
  - FEE-1903 — Schema Validation (forms context)
  - FEE-1807 — Error Handling & Loading States (API context)

  **`## References`:**
  - Zod documentation — https://zod.dev/
  - Valibot documentation — https://valibot.dev/
  - t3-env (environment variable validation) — https://env.t3.gg/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1708`, `title: 執行時期驗證與結構描述函式庫`, `state: draft`, `category: TypeScript`

  Key terms: 執行時期驗證（runtime validation）、系統邊界（system boundary）、結構描述（schema）、型別推論（type inference）、安全解析（safe parse）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/TypeScript/1708.md docs/zh-tw/TypeScript/1708.md
  git commit -m "feat(fee): add FEE-1708 Runtime Validation & Schema Libraries (EN + zh-TW)"
  ```
