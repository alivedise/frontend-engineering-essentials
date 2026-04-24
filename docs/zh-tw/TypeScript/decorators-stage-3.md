---
id: 1711
title: Decorators（Stage 3 ECMAScript）
state: draft
slug: decorators-stage-3
category: TypeScript
level: senior
allow_no_custom_section: true
# reason: decorator mechanics fill the standard sections end-to-end; no stage-specific subtopic warrants its own heading beyond what Deep Dive already covers.
---

# [FEE-1711] Decorators（Stage 3 ECMAScript）

:::info
Decorator 是用來客製化類別與其成員的函式。TypeScript 5.0 將 stage-3 ECMAScript 提案以標準語言特性形式釋出，使 `@decorator` 語法能在不啟用 `--experimentalDecorators` 旗標的情況下完成編譯。Stage-3 形式採用與先前實驗性 decorator 不同的 API：每個 decorator 會收到被裝飾的值以及一個具型別的 context 物件，而合法目標的範圍也更窄。本文涵蓋 stage-3 的語意、套用模型，以及與實驗性 decorator 之間的遷移落差。
:::

## 背景

Decorator 在 TypeScript 中有一段長歷史。原本藏在 `--experimentalDecorators` 後的實作，追隨 TC39 decorator 提案的早期草案，早於該提案的穩定化階段。TC39 提案經過數次改寫，才定型為當前的 stage-3 設計（TC39, proposal-decorators）。

TypeScript 5.0 將 stage-3 形式以非實驗性語言特性形式釋出，支援「以可重用的方式客製化類別與其成員」（TypeScript, 5.0 release notes）。在 TS 5.0 及之後的版本中，`@decorator` 寫法預設即為合法語法：「先前任何不搭配 `--experimentalDecorators` 而使用 decorator 的嘗試都會觸發錯誤。現在 decorator 預設對所有新程式碼均為合法」（Microsoft DevBlog, "Announcing TypeScript 5.0"）。該旗標仍存在並可用於選擇舊行為，但預設已切換為 stage-3。

仍有一項文件上的陷阱。位於 `/docs/handbook/decorators.html` 的 Handbook 頁面仍在描述實驗性 stage-2 decorator，且頁面上帶有明確告示：「本文件指涉一個實驗性的 stage 2 decorator 實作。Stage 3 decorator 支援自 TypeScript 5.0 起提供」（TypeScript Handbook, Decorators）。閱讀 decorator 教學時，複製程式碼前請先確認其目標為 stage-2 還是 stage-3 API。stage-3 的正式參考為 TS 5.0 的 release-notes 頁面。

## 視覺對比

堆疊的 decorator 以由下往上的順序套用：最靠近成員的 decorator 先行包裝，每個外層 decorator 再包裝其下層的結果。規範將此流程拆為類別定義期間執行的三個階段（TC39, proposal-decorators）。

| 階段 | 發生的事 | 出處 |
| --- | --- | --- |
| 1. Evaluate | Decorator 運算式以由左至右（依原始碼順序由上至下）求值，產生 decorator 函式。 | TC39 proposal-decorators |
| 2. Call | 每個 decorator 於類別定義期間被呼叫，時機在方法已求值、但建構子與原型尚未組裝之前。最內層（最靠近成員）先被呼叫；外層 decorator 會收到內層呼叫的結果。 | TC39 proposal-decorators |
| 3. Apply | 所有 decorator 的結果一起套用，在每個 decorator 都被呼叫後，才對建構子與原型進行變更。 | TC39 proposal-decorators |

以經典堆疊範例 `@bound @loggedMethod greet()` 為例：`@loggedMethod` 首先套用於原方法，接著 `@bound` 套用於 `@loggedMethod` 的結果（TypeScript 5.0 release notes）。

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
- **MUST** 將 stage-3 decorator 限制於六種可被尋址的元素類型：類別、方法、getter、setter、欄位與 auto-accessor（TC39 proposal-decorators）。
- **MUST NOT** 在 stage-3 decorator 下依賴 `reflect-metadata` 或 `--emitDecoratorMetadata`。Stage-3 提案「與 `--emitDecoratorMetadata` 不相容」（Microsoft DevBlog, "Announcing TypeScript 5.0"）。執行期型別 metadata 不在 stage-3 範圍內，另以獨立 TC39 提案追蹤。
- **SHOULD** 在匯出類別上選擇單一 decorator 位置。Stage-3 允許 `@register export default class Foo {}` 或 `export default @register class Bar {}`，但對同一類別「前 *且* 後皆寫是不被允許的」（TypeScript 5.0 release notes）。
- **MAY** 讓依賴參數 decorator 或 emit metadata 的框架程式碼（例如以參數注入為基礎建構的 DI 容器）繼續使用 `--experimentalDecorators`。這些框架在未經原上游重新設計前無法遷移至 stage-3。

## 設計思維

Stage-3 decorator 是形如 `(value, context) => replacement | void` 的函式。Context 物件帶有 `kind`、`name`、`access`，以及可選的 `private` / `static` 旗標，再加上 `addInitializer` 掛鉤：「type Decorator = (value: Input, context: { kind: string; name: string | symbol; access: { get?(): unknown; set?(value: unknown): void }; private?: boolean; static?: boolean; addInitializer(initializer: () => void): void; }) => Output | void」（TC39 proposal-decorators）。Decorator 擁有的每項能力都呈現在該 context 上，使契約在局部便可推理。

Stage-3 設計比 TypeScript 原本實作的 stage-2 提案更窄。Stage-2 允許 decorator 新增任意類別元素、以對引擎建模而言成本高昂的方式重塑類別。Stage-3 有意識地移除這些能力：該提案之所以更窄，是「為了讓 decorator 的語意保持『範圍良好』且符合直覺，並簡化實作」（TC39 proposal-decorators）。此取捨以彈性換取可預測性：stage-3 decorator 無法將類別改寫為結構上不同的東西，作為回報，讀者與引擎只需檢視它所作用的六種元素類型，即可推理被裝飾的類別。

參數 decorator 是此收斂下最顯眼的犧牲品。原本依賴參數 decorator 搭配 emit metadata 進行依賴注入（DI）的框架，並沒有等價替代可供遷移；它們在 stage-3 下需要另一種機制，通常是透過類別 decorator 做顯式註冊。

## 深入探討

Auto-accessor 是隨 stage-3 decorator 一同導入的新類別成員形式。`accessor foo = 0;` 會宣告一個儲存槽，並產生對應的 get 與 set 方法。裝飾 auto-accessor 可提供具型別的 `get`、`set` 與 `init` 掛鉤，使 decorator 能攔截讀取、寫入與初始化，而不必手寫成對的 accessor。規範將 auto-accessor 與類別、方法、getter、setter、欄位並列為六種可被裝飾的 kind 之一：「Decorators apply to these kinds: \"class\", \"method\", \"getter\", \"setter\", \"field\", and \"accessor\"」（TC39 proposal-decorators）。

回傳值語意相當嚴格。Decorator「可以用一個具有相同語意的匹配值取代被裝飾的值」（TC39 proposal-decorators）。方法 decorator 可以回傳一個函式；欄位 decorator 可以回傳一個 initializer 函式；類別 decorator 可以回傳一個新類別。回傳 `undefined` 保留原值不變。回傳與被裝飾 kind 不相符的形狀則為錯誤。

當多個 decorator 互動時，三階段套用模型至關重要。所有 decorator 運算式在任一 decorator 執行之前全部求值完畢，因此運算式中的副作用（例如讀取 decorator factory 的引數）會依原始碼順序發生，與 decorator 彼此包裝的方式無關。Decorator 接著在類別定義期被呼叫，「時機在方法已求值、但建構子與原型尚未組裝之前」。最後，所有結果一同套用，「在全部 decorator 都被呼叫完之後，一口氣」對建構子與原型進行變更（TC39 proposal-decorators）。因此 decorator 無法觀察組裝中途的類別；它只看到被交給它的那個值。

## 延伸閱讀

- [類別、存取修飾詞與 `#` 私有欄位](/zh-tw/TypeScript/classes-and-private-fields)
- [型別系統基礎與型別推論](/zh-tw/TypeScript/1701)
- [tsconfig 與 Strict Mode](/zh-tw/TypeScript/1706)

## 參考資料

- Microsoft, "Announcing TypeScript 5.0," Microsoft DevBlog (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- TypeScript Team, "TypeScript 5.0 Release Notes," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- TC39, "proposal-decorators," GitHub (2023). https://github.com/tc39/proposal-decorators
- TypeScript Team, "Decorators (Handbook)," typescriptlang.org (2023). https://www.typescriptlang.org/docs/handbook/decorators.html
