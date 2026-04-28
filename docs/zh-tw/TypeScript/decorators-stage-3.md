---
id: 1711
title: Decorators（Stage 3 ECMAScript）
state: draft
slug: decorators-stage-3
category: TypeScript
level: senior
allow_no_custom_section: true
# reason: TypeScript 端的注意點（版本／旗標矩陣、Handbook 陷阱、ClassMethodDecoratorContext 型別）已填滿標準小節；提案層級的機制由 FEE-10300 涵蓋。
---

# [FEE-1711] Decorators（Stage 3 ECMAScript）

:::info
TypeScript 5.0 將 TC39 Stage 3 decorator 以非實驗性語言特性形式釋出，使 `@decorator` 在不啟用 `--experimentalDecorators` 旗標的情況下即可編譯。本文聚焦於 TypeScript 端的議題：決定使用哪一套 decorator 系統的 TS 版本×旗標矩陣、仍然殘留的 Handbook 陷阱、具型別的 `ClassMethodDecoratorContext` API，以及與實驗性 decorator 之間的遷移落差。提案層級的說明（六種 decorator 形式的完整簽章、`addInitializer` 語意、`Symbol.metadata`，以及跨語言歷史）由 [FEE-10300](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10300.md) 涵蓋。
:::

## 背景

Decorator 在 TypeScript 中有一段長歷史。原本藏在 `--experimentalDecorators` 後的實作，追隨 TC39 decorator 提案的早期草案，早於該提案的穩定化階段。TC39 提案經過數次改寫，才定型為當前的 stage-3 設計（TC39, proposal-decorators）。

TypeScript 5.0 將 stage-3 形式以非實驗性語言特性形式釋出，支援「以可重用的方式客製化類別與其成員」（TypeScript, 5.0 release notes）。在 TS 5.0 及之後的版本中，`@decorator` 寫法預設即為合法語法：「先前任何不搭配 `--experimentalDecorators` 而使用 decorator 的嘗試都會觸發錯誤。現在 decorator 預設對所有新程式碼均為合法」（Microsoft DevBlog, "Announcing TypeScript 5.0"）。該旗標仍存在並可用於選擇舊行為，但預設已切換為 stage-3。

仍有一項文件上的陷阱。位於 `/docs/handbook/decorators.html` 的 Handbook 頁面仍在描述實驗性 stage-2 decorator，且頁面上帶有明確告示：「本文件指涉一個實驗性的 stage 2 decorator 實作。Stage 3 decorator 支援自 TypeScript 5.0 起提供」（TypeScript Handbook, Decorators）。閱讀 decorator 教學時，複製程式碼前請先確認其目標為 stage-2 還是 stage-3 API。stage-3 的正式參考為 TS 5.0 的 release-notes 頁面。

## 視覺對比

某個 TypeScript 專案實際使用哪一套 decorator 系統，由 TypeScript 版本與 `tsconfig.json` 中的 `experimentalDecorators` 設定共同決定：

| TypeScript 版本 | tsconfig 中的 `experimentalDecorators` | 實際使用的系統 |
| --- | --- | --- |
| < 5.0 | `true`（必要） | 舊版 stage-2 |
| 5.0+ | `true` | 舊版 stage-2（旗標覆寫預設） |
| 5.0+ | `false` 或未設定 | **TC39 Stage 3（預設）** |

採用 TC39 風格簽章 `(value, context) => …` 的函式庫，無法在舊版設定下被消費；編譯器會回報簽章不相容的錯誤。反之亦然：使用 `(target, key, descriptor)` 的舊版 decorator 在 stage-3 下也不會通過型別檢查或正確執行。

## 範例

Stage-3 下的方法 decorator 會收到原方法以及一個 `ClassMethodDecoratorContext`。該 context 帶有 `name`、`private`、`static` 與 `addInitializer`，因此能對「印出進入與離開紀錄」的 logger 提供具型別的簽章：

```ts
function loggedMethod(
  originalMethod: any,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }

  return replacementMethod;
}

class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}
```

回傳值會取代原方法。由於此 decorator 回傳一個具有相同呼叫簽章的函式，其替換方法符合規範對回傳替換所要求的「matching semantics」規則。

`@bound` decorator 展示 context API 的另一半：`addInitializer` 可註冊在建構期間執行的程式碼，正是 per-instance 綁定該放置的位置：

```ts
function bound(
  originalMethod: any,
  context: ClassMethodDecoratorContext
) {
  const methodName = context.name;
  if (context.private) {
    throw new Error("'bound' cannot decorate private methods.");
  }
  context.addInitializer(function () {
    (this as any)[methodName] = (this as any)[methodName].bind(this);
  });
}
```

當寫成 `@bound @loggedMethod greet()` 時，logger 先包裝原方法，接著 `@bound` 註冊一個 initializer，把已記錄版本的方法綁定至每個實例。

## 最佳實踐

- **MUST** 在 TS 5.0 或之後的版本撰寫新 decorator 時以 stage-3 API 為目標。Stage-3 的簽章與 emit 結果與實驗性 decorator 差異足以讓「任何既有 decorator 函式都不太可能」在未經改寫的情況下同時支援兩種模式（TypeScript 5.0 release notes）。
- **MUST NOT** 在 stage-3 下嘗試裝飾建構子參數或方法參數。該提案「不允許裝飾參數」（Microsoft DevBlog, "Announcing TypeScript 5.0"）；參數 decorator 仍屬實驗性專屬功能。
- **MUST NOT** 在 stage-3 decorator 下依賴 `reflect-metadata` 或 `--emitDecoratorMetadata`。Stage-3 提案「與 `--emitDecoratorMetadata` 不相容」（Microsoft DevBlog, "Announcing TypeScript 5.0"）。執行期型別 metadata 不在 stage-3 範圍內，另以獨立 TC39 提案追蹤。
- **SHOULD** 在匯出類別上選擇單一 decorator 位置。Stage-3 允許 `@register export default class Foo {}` 或 `export default @register class Bar {}`，但對同一類別「前 *且* 後皆寫是不被允許的」（TypeScript 5.0 release notes）。
- **MAY** 讓依賴參數 decorator 或 emit metadata 的框架程式碼（例如以參數注入為基礎建構的 DI 容器）繼續使用 `--experimentalDecorators`。這些框架在未經原上游重新設計前無法遷移至 stage-3。

## 延伸閱讀

- [FEE-10300 Decorators — Class、Method 與 Field Decorators](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10300.md) — 提案層級的完整參考：六種 decorator 形式的完整簽章、`addInitializer` 規則、`Symbol.metadata`，以及跨語言歷史。
- [類別、存取修飾詞與 `#` 私有欄位](/zh-tw/TypeScript/classes-and-private-fields)
- [型別系統基礎與型別推論](/zh-tw/TypeScript/1701)
- [tsconfig 與 Strict Mode](/zh-tw/TypeScript/1706)

## 參考資料

- Microsoft, "Announcing TypeScript 5.0," Microsoft DevBlog (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- TypeScript Team, "TypeScript 5.0 Release Notes," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- TC39, "proposal-decorators," GitHub (2023). https://github.com/tc39/proposal-decorators
- TypeScript Team, "Decorators (Handbook)," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/decorators.html
