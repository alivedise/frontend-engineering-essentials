---
id: 1715
title: "條件型別與 `infer`"
state: draft
slug: conditional-types-and-infer
category: TypeScript
level: senior
---

# [FEE-1715] 條件型別與 `infer`

:::info
TypeScript 2.8 推出了 `T extends U ? X : Y` 形式的條件型別，並同時引入 `infer` 關鍵字，可在 `extends` 子句中宣告新的型別變數並從被檢查的型別中綁定。TypeScript 4.1 加入模板字串字面型別，並允許條件型別在分支中引用自身，開啟了型別層級的遞迴解析能力。TypeScript 5.4 加入 `NoInfer<T>` 工具型別，讓開發者可指示編譯器在蒐集推論候選時略過某個位置。這些特性結合起來，讓函式庫作者能表達依輸入型別結構而異的非均勻型別映射，正是 `ReturnType`、`Parameters`、`Awaited` 等工具型別的骨幹。
:::

## 背景

條件型別根據型別關係測試在兩個型別之間擇一。TypeScript 2.8 發行說明這樣描述此特性：可用於「表達非均勻的型別映射。條件型別根據以型別關係測試所表達的條件，在兩個可能的型別中擇一」。

語法為 `T extends U ? X : Y`。TypeScript Handbook 陳述規則：「當 `extends` 左側的型別可指派給右側的型別時，會得到第一個分支（『true』分支）的型別；否則會得到後一個分支（『false』分支）的型別。」

一旦選定分支，true 分支便可引用以 `infer` 宣告的新型別變數。2.8 發行說明指出：「在條件型別的 `extends` 子句中，現在可以有 `infer` 宣告，引入一個待推論的型別變數。這類推論出的型別變數可在條件型別的 true 分支中被引用。」`infer` 將條件型別從二元選擇器提升為結構性的模式比對。

## 視覺對比

| 形式 | 當 `T = A \| B \| C` 時的行為 | 適用情境 |
| --- | --- | --- |
| `T extends U ? X : Y`（裸 `T`） | 分配式：展開為 `(A extends U ? X : Y) \| (B extends U ? X : Y) \| (C extends U ? X : Y)` | 對聯集進行逐成員映射（例如 `Exclude`、`Extract`） |
| `[T] extends [U] ? X : Y` | 非分配式：將聯集整體作為單一單位與 `[U]` 比較 | 將聯集視為原子性整體的可指派性測試（例如「`T` 是否恰好為 `never`？」） |

只有當被檢查的型別是裸型別參數時才會觸發分配。2.8 發行說明：「當被檢查的型別為裸型別參數的條件型別稱為 _分配式條件型別_。分配式條件型別在具現化時會自動對聯集型別進行分配。」Handbook 給出脫逃艙：「通常分配行為正是所期望的。若要避免該行為，可將 `extends` 關鍵字兩側各以方括號包住。」

## 範例

### (a) 以 `infer` 擷取陣列元素

```ts
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type A = Flatten<string[]>;      // string
type B = Flatten<number>;        // number
type C = Flatten<Array<0 | 1>>;  // 0 | 1
```

Handbook 說明此模式：「此處我們使用 `infer` 關鍵字宣告式地引入名為 `Item` 的新泛型型別變數，取代在 true 分支中指明如何取得 `Type` 元素型別的做法。」

### (b) `Parameters<T>` 與 `ReturnType<T>`

TypeScript 在 `lib.d.ts` 中內建了數個條件型別。2.8 發行說明列舉：「TypeScript 2.8 在 `lib.d.ts` 加入數個預先定義的條件型別：`Exclude<T, U>`、`Extract<T, U>`、`NonNullable<T>`、`ReturnType<T>`、`InstanceType<T>`。」它們的形狀都結合條件測試與 `infer`：

```ts
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

type R = MyReturnType<(id: string) => number>; // number
type P = MyParameters<(id: string, n: 1 | 2) => void>; // [id: string, n: 1 | 2]
```

### (c) `Awaited<T>`：遞迴拆解

TypeScript 4.5 加入了內建的 `Awaited<T>` 工具型別。4.5 部落格文章：「TypeScript 4.5 引入一個新的工具型別 `Awaited`。此型別用於模擬 `async` 函式中的 `await`、或 `Promise` 上的 `.then()` 方法的行為，特別是它們遞迴拆解 `Promise` 的方式。」

```ts
type A = Awaited<Promise<string>>;                    // string
type B = Awaited<Promise<Promise<number>>>;           // number
type C = Awaited<boolean | Promise<boolean>>;         // boolean
```

機制的簡化草圖：

```ts
type MyAwaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(onfulfilled: infer F, ...args: infer _): any }
    ? F extends (value: infer V, ...args: infer _) => any
        ? MyAwaited<V>
        : never
    : T;
```

4.1 啟用了遞迴，2.8 啟用了 `infer` 位置，兩者缺一不可。

## 最佳實踐

- **SHOULD** 當欲將聯集當作整體測試時，將 `extends` 兩側都以單元素 tuple 包住。Handbook 陳述機制：「若要避免該行為，可將 `extends` 關鍵字兩側各以方括號包住。」常見情境是檢查某型別是否恰好為 `never`：`[T] extends [never]` 會給出正確答案，裸形式 `T extends never` 則不會。
- **SHOULD** 當條件鏈深度巢狀時，以型別別名命名中間結果。遞迴條件型別存在上限：TS 4.1 公告指出「對於足夠複雜的輸入，這些型別可能觸及內部的遞迴深度限制。當觸及該遞迴限制時，會產生編譯時錯誤。」將鏈拆解為命名步驟可讓每層遞迴變淺並提升錯誤訊息的可讀性。
- **MAY** 先考慮 `lib.d.ts` 內建的工具型別，再撰寫客製條件型別。`Exclude`、`Extract`、`NonNullable`、`ReturnType`、`InstanceType` 隨編譯器出貨（2.8 發行說明），涵蓋多數常見形狀而無需自訂。

## 設計思維

預設採用分配行為反映開發者對聯集的直覺。聯集 `A | B | C` 通常被解讀為「A、B、C 三者之一」，逐成員套用映射符合這個心智模型：`Exclude<"a" | "b" | "c", "a">` 應當產出 `"b" | "c"`，而非單一的成員關係測試。2.8 發行說明明確指出規則：被檢查型別為裸型別參數的條件型別在具現化時會進行分配。tuple 技巧 `[T] extends [U]` 則保留給其餘情境，當作者想測試聯集整體的可指派性時使用，例如「`T` 作為一個型別是否可指派給 `U`」或探測 `never`。一個預設加上一個語法脫逃艙，讓常見情境保持簡潔，也讓較不常見的情境在呼叫處展現出明顯的刻意選擇。

## 深入探討

### 變異性與多候選 `infer`

當同一個 `infer` 變數出現在多個位置時，變異性決定候選如何合併。2.8 發行說明描述了雙邊情形：「同一型別變數在共變位置有多個候選時，會推論出聯集型別」，以及「同一型別變數在反變位置有多個候選時，會推論出交集型別」。

```ts
// 共變位置（回傳型別出現兩次）-> 聯集
type Co<T> = T extends { a: infer X; b: infer X } ? X : never;
type U = Co<{ a: string; b: number }>; // string | number

// 反變位置（函式參數）-> 交集
type Contra<T> = T extends ((a: infer X) => void) & ((b: infer X) => void) ? X : never;
type I = Contra<((a: string) => void) & ((b: number) => void)>; // string & number
```

這便是「last overload」與「union-to-intersection」等技巧成立的原理，也是它們脆弱的原因：它們仰賴編譯器在共變與反變位置如何擺放候選。

### 遞迴條件型別

在 4.1 之前，條件型別無法在分支中直接引用自身。4.1 公告解除了此限制：「在 TypeScript 4.1 中，條件型別現在可以在自身分支內立即引用自身，讓撰寫遞迴型別別名更容易。」這便是 `Awaited` 拆解巢狀 `Promise` 的方式、深度 readonly 工具型別下鑽物件型別的方式，以及模板字串字面解析器走過字串的方式。

### 遞迴深度限制

遞迴條件型別有上限。4.1 公告：「對於足夠複雜的輸入，這些型別可能觸及內部的遞迴深度限制。當觸及該遞迴限制時，會產生編譯時錯誤。」發行說明未公開具體的數值限制，因此應將其視為質性預算：縮短遞迴鏈、拆成命名別名，並在輸入可能較大時優先使用迭代式的 tuple 走訪模式，而非深度巢狀的物件遞迴。

## 模板字串字面解析

TypeScript 4.1 引入模板字串字面型別，並允許 `infer` 出現在代入位置。4.1 公告：「在模板字串字面型別中，我們還能做一件特別的事：我們可以從代入位置進行 _推論_。」這讓字串字面型別成為可解析的 token。

```ts
type Greeting<S extends string> =
  S extends `hello, ${infer Name}` ? Name : never;

type N = Greeting<"hello, world">; // "world"

type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];

type Parts = Split<"a,b,c", ",">; // ["a", "b", "c"]
```

## 版本對照

- **TypeScript 4.5** — 內建 `Awaited<T>`。4.5 公告：「TypeScript 4.5 引入一個新的工具型別 `Awaited`……特別是它們遞迴拆解 `Promise` 的方式。」
- **TypeScript 4.7** — 帶約束的推論位置。4.7 公告：「TypeScript 4.7 現在允許在任何 `infer` 型別上加上約束。」`infer X extends U` 形式讓編譯器在無需後續條件型別的情況下窄化推論型別，對於想要數值或字串 token 的模板字串字面解析器相當有用。

  ```ts
  type FirstNumber<T> =
    T extends [infer N extends number, ...unknown[]] ? N : never;

  type X = FirstNumber<[42, "a"]>; // 42
  ```

- **TypeScript 5.4** — `NoInfer<T>`。5.4 公告：「以 `NoInfer<...>` 包住一個型別，即是向 TypeScript 傳達一個訊號：不要深入內部型別去尋找型別推論候選。」可用它將一個泛型參數固定為另一個引數，同時仍對被包住的位置進行型別檢查。

  ```ts
  declare function createStreetLight<C extends string>(
    colors: C[],
    defaultColor?: NoInfer<C>,
  ): void;

  createStreetLight(["red", "yellow", "green"], "red");
  // createStreetLight(["red", "yellow", "green"], "blue"); // error
  ```

## 延伸閱讀

- [泛型](/zh-tw/TypeScript/1702)
- [工具型別與型別操作](/zh-tw/TypeScript/1703)
- [`satisfies` 運算子](/zh-tw/TypeScript/satisfies-operator)

## 參考資料

- Microsoft, "TypeScript 2.8 Release Notes," TypeScript Handbook (2018). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
- Microsoft, "Conditional Types," TypeScript Handbook (2024). https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- Daniel Rosenwasser, "Announcing TypeScript 4.1," TypeScript Blog (2020). https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/
- Daniel Rosenwasser, "Announcing TypeScript 4.5," TypeScript Blog (2021). https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/
- Daniel Rosenwasser, "Announcing TypeScript 4.7," TypeScript Blog (2022). https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
- Daniel Rosenwasser, "Announcing TypeScript 5.4," TypeScript Blog (2024). https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
