---
id: 1712
title: "型別專用匯入與 `verbatimModuleSyntax`"
state: draft
slug: type-only-imports
category: TypeScript
level: mid
---

# [FEE-1712] 型別專用匯入與 `verbatimModuleSyntax`

:::info
TypeScript 3.8 推出 `import type` 與 `export type` 作為專屬語法，用於在 emit 時被剝除的匯入與匯出。TypeScript 4.5 再為具名 specifier 加入行內 `type` 修飾符，使值繫結與型別繫結能共用同一個 import 語句。TypeScript 5.0 隨後推出 `verbatimModuleSyntax`，以單一選項取代先前的 `importsNotUsedAsValues` 與 `preserveValueImports`，並讓 emit 遵循簡明規則：沒有 `type` 標記者保留，帶有 `type` 標記者剝除。
:::

## 背景

TypeScript 3.8 為型別專用的模組繫結引入了專屬語法。3.8 的 release notes 描述 `import type` 為一種「only imports declarations to be used for type annotations and declarations」的形式，並指出它「always gets fully erased, so there's no remnant of it at runtime.」`export type` 對稱存在：同一份 release notes 描述它為一種「can be used for type contexts, and is also erased from TypeScript's output.」的 export。

TypeScript 4.5 放寬了語句層級的限制。4.5 的公告指出「TypeScript 4.5 allows a `type` modifier on individual named imports, so that you can mix and match as needed」，因此單一 `import` 行能同時帶有值 specifier 與型別 specifier。

TypeScript 5.0 整合了設定面。5.0 公告平實地描述這個新選項：「With this new option, what you see is what you get. The rules are much simpler — any imports or exports without a `type` modifier are left around. Anything that uses the `type` modifier is dropped entirely.」同一篇文章也提到「because `--verbatimModuleSyntax` provides a more consistent story than `--importsNotUsedAsValues` and `--preserveValueImports`, those two existing flags are being deprecated in its favor.」

## 視覺對比

下表比較同一段原始碼在三種 emit 模式下的行為。

| Source syntax | Default TS emit (import elision) | Legacy `importsNotUsedAsValues: "preserve"` | `verbatimModuleSyntax: true` |
| --- | --- | --- | --- |
| `import { Car } from "./car"` used only as a type | Import dropped entirely, including module side effects (Claim 7) | Import preserved as written | Error unless the specifier is marked `type`; no silent elision |
| `import type { A } from "a"` | Erased from output (Claim 16) | Erased | Erased (Claim 11) |
| `import { b, type c, type d } from "bcd"` | `b` kept; `c`, `d` erased when TS detects them as types | Full import preserved including `c`, `d` as runtime bindings | Rewritten to `import { b } from "bcd"` (Claim 11) |
| Bare `import "./car"` (side effect only) | Preserved (no bindings to elide) | Preserved | Preserved |

最後一欄遵循一條規則：未標 `type` 的 specifier 保留；標 `type` 的 specifier 不保留（Claim 8）。

## 範例

先從一個同時匯出值與型別的模組，以及一個需要兩者的消費者開始。

```ts
// some-module.ts
export interface BaseType {
  id: string;
}

export function someFunc(x: BaseType): void {
  console.log(x.id);
}
```

```ts
// consumer.ts
import { someFunc, type BaseType } from "./some-module.js";

const record: BaseType = { id: "abc" };
someFunc(record);
```

4.5 的公告指出在這個寫法下「`BaseType` is always guaranteed to be erased and `someFunc` will be preserved.」在 `verbatimModuleSyntax` 之下，TSConfig reference 列出同樣的改寫：`import { b, type c, type d } from "bcd";` 會「rewritten to `import { b } from \"bcd\";`.」因此 emit 出的 JavaScript 是：

```js
// consumer.js
import { someFunc } from "./some-module.js";

const record = { id: "abc" };
someFunc(record);
```

接著考慮一個頂層執行副作用程式碼的模組。

```ts
// car.ts
console.log("car module loaded");

export class Car {
  drive(): void {}
}
```

```ts
// garage.ts
import { Car } from "./car";

export function describe(c: Car): string {
  return c.constructor.name;
}
```

`Car` 只在 `describe` 內的型別位置出現。在預設 TypeScript emit 下，5.0 的 release notes 觀察到「the import was dropped entirely. That actually makes a difference for modules that have side-effects.」`"car module loaded"` 這行記錄會靜默消失，因為整行 `import { Car } from "./car"` 被省略。明確寫成 `import { type Car } from "./car"` 可以表達意圖；額外加上 `import "./car";` 可保留副作用；而 `verbatimModuleSyntax` 會強制作者將 specifier 標為 `type`，仍然擦除該 import，但讓決策在原始碼中可見。

## 最佳實踐

- **MUST** 當啟用 `isolatedModules` 或 `verbatimModuleSyntax` 時，為每個型別專用 specifier 加上 `type` 標記。TSConfig reference 指出 `isolatedModules`「tells TypeScript to warn you if you write certain code that can't be correctly interpreted by a single-file transpilation process」，這涵蓋 Babel、swc 與 esbuild（Claim 12）。
- **MUST** 在重新匯出型別時使用 `export type`。TSConfig reference 警告「TypeScript allows you to import a type and then re-export it. However, TypeScript can't tell if `SomeType` is a type or a value, so it's possible that the re-export won't be preserved when the code is transpiled by another tool」（Claim 13）。
- **SHOULD** 在新專案啟用 `verbatimModuleSyntax`。5.0 公告將它定位為 `importsNotUsedAsValues` 與 `preserveValueImports` 兩者的取代者（Claim 9），也將 emit 簡化成單一可讀規則（Claim 8）。
- **SHOULD** 當消費者依賴某個模組的頂層副作用時，明確加上 `import "./side-effect-module";` 這種空匯入。Claim 7 顯示若具副作用的模組的每個具名繫結都只作為型別使用，該 import 可能被省略。
- **MAY** 對匯入全為型別的檔案繼續使用語句層級的 `import type { ... }`。行內 `type` specifier 用於處理混合情境，並未取代語句形式（Claim 3）。

## 設計思維

import 省略之所以是預設行為，是因為 TypeScript 原本的 emit 目標是產出慣用的 JavaScript：只作為型別參照存在的 import 不應出現於輸出。5.0 的 release notes 以平實的語句說明機制：「By default, TypeScript does something called import elision. Basically, if you write something like … TypeScript detects that you're only using an import for types and drops the import entirely.」

省略行為具備隱晦性，因為編譯器參照的並不只有本地使用位置。5.0 公告指出「TypeScript's emit strategy for JavaScript also has another few layers of complexity — import elision isn't always just driven by how an import is used — it often consults how a value is declared as well.」一個 import 是否存活，取決於上游宣告的種類（interface、type alias、class、function、`const`），因此兩個在呼叫端看起來完全相同的 import，可能因為讀者看不見的事實而 emit 出不同結果。

`verbatimModuleSyntax` 以該種聰明性換取在地性。5.0 公告將這項取捨總結為「what you see is what you get」：由作者而非編譯器決定哪些 specifier 是執行期值、哪些是型別。Reviewer 不必為了預測 emit 跨檔案比對宣告，而無法執行跨檔案分析的外部 transpiler（Claim 12）也會產出與 `tsc` 相同的輸出。

## 深入探討

副作用省略是頭號邊緣案例。Claim 7 指出，當 `Car` 僅因型別目的從一個頂層執行程式碼的模組匯入時，整個 import 會被省略，並連同副作用一併消失。兩個安全修法是：將 specifier 標為 `type`（明示擦除意圖），以及在需要副作用時加上 `import "./car";`。

在 `verbatimModuleSyntax` 之下，ECMAScript 模組語法不會被靜默改寫為 CommonJS。5.0 公告指出「under this flag, ECMAScript imports and exports won't be rewritten to require calls when your settings or file extension implied a different module system. Instead, you'll get an error.」在此 flag 下若某檔案應 emit 為 CommonJS，就必須使用舊式的 `import foo = require(...)` 與 `export =` 寫法，而不使用 ES `import`/`export` 語句。

語句形式的 `import type` 有一項小的語法限制。Handbook 的 modules reference 指出「a type-only import declaration may not declare both a default import and named bindings, since it appears ambiguous whether `type` applies to the default import or to the entire import declaration.」同時需要預設匯入與具名繫結的開發者，必須拆成兩個語句，或在具名 specifier 上使用行內 `type` 標記。

值也可以透過 `import type` 匯入，但僅限於非 emit 位置。Handbook 指出「even values can be imported with `import type`, but since they won't exist in the output JavaScript, they can only be used in non-emitting positions」，涵蓋 `typeof`、泛型引數與型別參照。若把此類繫結當值呼叫，會是編譯錯誤，因為輸出 JavaScript 中不存在它。

## 延伸閱讀

- [Node.js ESM、`.mts`/`.cts` 與 `nodenext` 模組解析](/zh-tw/TypeScript/node-esm-and-nodenext)
- [tsconfig 與 Strict Mode](/zh-tw/TypeScript/1706)
- [宣告檔與 DefinitelyTyped](/zh-tw/TypeScript/1705)

## 參考資料

- Microsoft, "TypeScript 3.8 Release Notes," TypeScript Handbook (2020). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- Daniel Rosenwasser, "Announcing TypeScript 4.5," TypeScript Blog (2021). https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- Daniel Rosenwasser, "Announcing TypeScript 5.0," TypeScript Blog (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- Microsoft, "TypeScript 5.0 Release Notes," TypeScript Handbook (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- Microsoft, "TSConfig Reference: `verbatimModuleSyntax`," TypeScript Documentation (2023). https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html
- Microsoft, "TSConfig Reference," TypeScript Documentation (2023). https://www.typescriptlang.org/tsconfig/
- Microsoft, "Modules Reference," TypeScript Handbook (2023). https://www.typescriptlang.org/docs/handbook/modules/reference.html
