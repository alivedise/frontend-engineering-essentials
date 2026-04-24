---
id: 1710
title: "類別、存取修飾詞與 `#` 私有欄位"
state: draft
slug: classes-and-private-fields
category: TypeScript
level: mid
---

# [FEE-1710] 類別、存取修飾詞與 `#` 私有欄位

:::info
TypeScript 的類別同時承載兩套平行的私有性系統。`public`、`protected`、`private` 關鍵字屬於型別層，在 emit 後會消失。`#` 前綴欄位語法已由 TC39 於 Stage 4 標準化，以類似 closure 的語意在執行期強制私有性。本文說明兩者各自適用的時機、差異，以及函式庫實際能依賴哪一種保證。
:::

## 背景

TypeScript 早在 JavaScript 之前就繼承了 C# 風格的類別模型。Handbook 的 Classes 章節將 `public`、`protected`、`private` 描述為編譯期可見性修飾詞：「Like other aspects of TypeScript's type system, `private` and `protected` are only enforced during type checking.」編譯產生的 JavaScript 僅包含一般屬性，不帶任何執行期的可見性中繼資料。

TC39 走了另一條路。Class fields 提案引入新的語法形式 `#name`，其私有性屬於語言本身而非型別系統。TypeScript 3.8（2020）納入該特性：「TypeScript 3.8 brings support for ECMAScript's private fields, part of the stage-3 class fields proposal.」該提案已於 TC39 追蹤表推進至 Stage 4，代表 `#` 私有欄位已是 ECMAScript 標準的一部分，並在所有現代引擎中出貨。

這兩套系統如今並存。TypeScript 修飾詞仍用於型別層意圖與面向子類別的契約，`#` 語法則涵蓋任何必須對執行期呼叫者隱藏的成員。在兩者之間抉擇，是現代 TypeScript 類別設計的核心決策。

## 視覺對比

| 面向                              | `public`        | `protected`             | `private` (TS)          | `#private` (ECMAScript)    |
| ------------------------------- | --------------- | ----------------------- | ----------------------- | -------------------------- |
| 執行期強制                           | 無（可見）          | 否                       | 否                       | 是（TypeError）              |
| 編譯期強制                           | 無              | 是                       | 是                       | 是（SyntaxError）            |
| 子類別可見                           | 是              | 是                       | 否                       | 否                         |
| 同層類別可見                          | 是              | 否                       | 否                       | 否                         |
| 位於原型鏈上                          | 是（方法）         | 是（方法）                 | 是（方法）                 | 否                         |
| 反射無法觸及                          | 否              | 否                       | 否                       | 是                         |
| 由 emit 產物擦除                      | 無              | 是                       | 是                       | 否                         |
| 可與另一套組合使用                       | 是              | 是                       | 是（可配 `readonly`）       | 無法與 TS 修飾詞組合              |

最後一列對應的規則是，TypeScript 存取修飾詞不能裝飾 `#` 欄位：「TypeScript accessibility modifiers like `public` or `private` can't be used on private fields.」

## 範例

### 參數屬性

參數屬性把常見的「先宣告再賦值」樣式壓縮進建構子簽章中。Handbook 描述這項規則：「TypeScript offers special syntax for turning a constructor parameter into a class property with the same name and value. These are called parameter properties and are created by prefixing a constructor argument with one of the visibility modifiers `public`, `private`, `protected`, or `readonly`.」

```ts
class Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
    private label: string,
  ) {}

  describe() {
    return `${this.label}: (${this.x}, ${this.y})`;
  }
}

const p = new Point(1, 2, "origin");
p.describe(); // "origin: (1, 2)"
```

emit 後的 JavaScript 會在建構子本體內把每個參數指派到 `this`。可見性修飾詞不會保留到輸出中，所以純 JavaScript 呼叫者在執行期仍能讀取 `p.label`。

### 以 `#` 欄位進行 `in` 品牌檢查

`in` 運算子同時兼具對私有欄位的品牌檢查功能。MDN 說明其行為：「You can use the `in` operator to check whether an externally defined object possesses a private element. This will return `true` if the private field or method exists, and `false` otherwise.」

```ts
class Money {
  #amount: number;
  #currency: string;

  constructor(amount: number, currency: string) {
    this.#amount = amount;
    this.#currency = currency;
  }

  static isMoney(value: unknown): value is Money {
    return typeof value === "object" && value !== null && #amount in value;
  }

  add(other: Money): Money {
    if (this.#currency !== other.#currency) throw new Error("currency mismatch");
    return new Money(this.#amount + other.#amount, this.#currency);
  }
}

Money.isMoney(new Money(10, "USD")); // true
Money.isMoney({ amount: 10 });        // false — no #amount brand
```

品牌檢查對類別自身建構出的實例回傳成功，對任何長得相似的物件則回傳失敗，為使用者定義的型別守衛提供一般結構型別無法提供的執行期訊號。

## 最佳實踐

- **MAY** 省略 `public`：預設可見性即為 `public`，是否寫出關鍵字屬於風格選擇。Handbook 指出：「The default visibility of class members is `public`. A `public` member can be accessed anywhere.」
- **SHOULD** 將 `protected` 用於基底類別的擴充點。`protected` 成員對宣告類別的子類別可見，子類別可將其放寬為 `public`，但同層類別之間不可存取。
- **MUST** 在目標為真正封裝時採用 `#` 私有欄位。外部的 JavaScript 呼叫者無法透過方括號存取或任何反射 API 讀取 `#` 欄位；TypeScript 的 `private` 在 emit 時會被擦除。
- **MUST NOT** 將 TypeScript 修飾詞與 `#` 語法並用。「TypeScript accessibility modifiers like `public` or `private` can't be used on private fields」—— `#` 前綴本身已是唯一的可見性標記。
- **SHOULD** 以 `readonly` 標記僅供建構期寫入的屬性，禁止建構子外的重新指派：「Fields may be prefixed with the `readonly` modifier. This prevents assignments to the field outside of the constructor.」
- **MAY** 以 `abstract` 建模開放式繼承階層。抽象成員沒有實作；類別本身無法被直接實例化，由具體子類別補上缺少的部分。
- **SHOULD** 在函式庫內部優先採用 `#` 欄位。TS 3.8 release notes 強調此項契約：「If you're a library author, removing or renaming a private field should never cause a breaking change.」

## 設計思維

TypeScript 原先的 `private` 位於編譯器的型別檢查側。型別系統知道某個成員是私有的，執行期則不知道。TS 3.8 release notes 寫明：「TypeScript's `private` modifiers are fully erased — that means that at runtime, it acts entirely like a normal property and there's no way to tell that it was declared with a `private` modifier.」這種設計通常被稱為「soft privacy」（軟私有性、編譯期私有），因為有心的呼叫者仍可透過方括號存取或移除型別標註來觸及該欄位。

TC39 提案則採取了另一種取捨。私有欄位使用類似 closure 或 WeakMap 的語意，能抵抗反射與 metaprogramming：「This differs from JavaScript properties, which support various kinds of reflection and metaprogramming, and is instead analogous to mechanisms like closures and WeakMap.」這堵住了軟私有性留下的後門，代價是放棄呼叫端有時會仰賴的功能 —— 以 `Object.keys` 迭代、以 spread 複製等。

Stage 4 標準化之所以重要有兩個理由。其一，該特性如今屬於語言本身，而非轉譯器附帶的便利設施，因此舊版的 down-level target 不再是預設假設。其二，下游工具（型別檢查器、bundler、debugger）可以仰賴其語意保持穩定。當欄位絕不可外流時採用 `#`。當目標是由 code review 強制、執行期無需介入的 API 契約時，採用 TypeScript `private`。

## 深入探討

**`TypeError` 與 `SyntaxError`。** 兩種不同的錯誤類別負責守護 `#` 欄位。解析階段偵測對宣告類別未引入名稱的引用：「It is a syntax error to refer to `#` names from outside of the class. It is also a syntax error to refer to private elements that were not declared in the class body, or to attempt to remove declared elements with delete.」執行期則守護相反情況：引用在類別內部語法合法，但接收者是外人。TS 3.8 notes 描述此路徑：「accessing a private field on any other type will result in a `TypeError`!」

**子類別命名碰撞免疫。** 每個 `#name` 都以其宣告類別為範圍，這消除了一整類繼承相關的 bug。TS 3.8 notes 描述此屬性：「When using ECMAScript `#` private fields, no subclass ever has to worry about collisions in field naming. Every private field name is uniquely scoped to its containing class.」同一繼承階層中的兩個類別可以同時宣告 `#state`，各自保有獨立的儲存空間。

**不在原型上繼承。** 私有元素不屬於原型鏈，也不被子類別繼承。MDN：「Private elements are not part of the prototypical inheritance model since they can only be accessed within the current class's body and aren't inherited by subclasses. Private elements with the same name within different classes are entirely different and do not interoperate with each other.」觸及 `this.#foo` 的方法僅對宣告 `#foo` 的類別實例有效。

**硬私有性邊界。** 以上規則組合起來構成 TypeScript 團隊所稱的「hard privacy」（硬私有性、執行期私有）：「Private fields can't be accessed or even detected outside of the containing class — even by JS users! Sometimes we call this hard privacy.」外部的任何偵測手段 —— `in`、`hasOwnProperty`、debugger 檢視、`JSON.stringify` —— 都無法顯現該欄位。

**多型 `this`。** 私有性之外，TypeScript 在類別本體內提供多型 `this` 型別：「In classes, a special type called `this` refers dynamically to the type of the current class.」回傳 `this` 的 builder 方法在子類別實例上呼叫時會保留子類別型別，使 fluent API 在繼承下也能運作，無需泛型雜技。

## 延伸閱讀

- [型別系統基礎與型別推論](/zh-tw/TypeScript/1701)
- [Decorators（Stage 3 ECMAScript）](/zh-tw/TypeScript/decorators-stage-3)
- [tsconfig 與 Strict Mode](/zh-tw/TypeScript/1706)

## 參考資料

- Microsoft, "Classes — TypeScript Handbook," TypeScript documentation (2024). https://www.typescriptlang.org/docs/handbook/2/classes.html
- Daniel Rosenwasser, "Announcing TypeScript 3.8 — ECMAScript Private Fields," TypeScript Release Notes (2020). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- Daniel Rosenwasser, "Announcing TypeScript 3.8," Microsoft DevBlogs (2020). https://devblogs.microsoft.com/typescript/announcing-typescript-3-8/
- Daniel Rosenwasser, "Announcing TypeScript 5.0," Microsoft DevBlogs (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- TC39, "Class field declarations for JavaScript (proposal-class-fields)," TC39 proposals (2021). https://github.com/tc39/proposal-class-fields
- MDN contributors, "Private properties — JavaScript," MDN Web Docs (2024). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
