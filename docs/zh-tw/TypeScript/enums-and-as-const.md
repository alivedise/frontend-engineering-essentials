---
id: 1713
title: "Enum 與 `as const` 替代方案"
state: draft
slug: enums-and-as-const
category: TypeScript
level: mid
---

# [FEE-1713] Enum 與 `as const` 替代方案

:::info
TypeScript 提供數值、字串與異質的 `enum` 宣告，另有 `const enum` 形式，會在每個使用點直接內嵌值。一般 enum 會產出執行期物件；`const enum` 宣告則不會留下任何東西。官方手冊目前引導讀者改用在普通物件上加 `as const`，透過 `keyof typeof` 推導成員聯集。TypeScript 5.0 同時調整了 enum 語意，讓每個成員獲得獨特的字面型別，填補 enum 收斂長期存在的缺口。本文說明各種形式的適用時機、應避開的陷阱，以及 `isolatedModules` 如何改寫這個選擇。
:::

## 背景

TypeScript 的 `enum` 早於型別系統大多數的字面聯集機制。手冊描述三種形式：成員自動遞增的數值 enum、每個成員指派字面字串的字串 enum，以及混合兩者的異質 enum（手冊指出字串 enum「允許你在程式執行時給出有意義且可讀的值，與成員名稱本身無關」，並不鼓勵混用數字與字串）。

執行期的產出將兩大模式區分開來。一般數值或字串 enum 會編譯成參與模組匯出的執行期物件。`const enum` 行為不同：手冊說明「const enum 只能使用常數 enum 表示式，且與一般 enum 不同，編譯期會被完全移除。Const enum 成員會在使用點被內嵌。」這種內嵌既是效能吸引力的來源，也是後文章節要處理的工具鏈痛點來源。

## 視覺對比

| 特性 | `enum`（一般） | `const enum` | `as const` 物件 | 字面聯集 |
| --- | --- | --- | --- | --- |
| 執行期產出 | 含成員的物件 | 無（內嵌） | 普通物件字面值 | 無 |
| 反向對映 | 僅數值 | 僅數值 | 否 | 否 |
| Bundler 對 DCE 友好度 | 物件匯出較難 DCE | 可內嵌，但有版本偏移風險 | 普通物件字面值與 bundler 的死碼消除搭配較順 | 無可消除 |
| 與 `isolatedModules` 相容 | 是 | 對 ambient 匯入為否 | 是 | 是 |
| Nominal 或 structural | 表現為 nominal（名義） | 表現為 nominal（名義） | structural（結構） | structural（結構） |

## 範例

### `const enum` 與其內嵌輸出

```ts
const enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}

function move(d: Direction) {
  if (d === Direction.Up) return [0, -1];
  if (d === Direction.Down) return [0, 1];
  return [0, 0];
}

move(Direction.Up);
```

編譯後，每個呼叫點對 `Direction.Up` 的參照都會被替換成數值字面量 `1`；執行期並沒有 `Direction` 物件存在。這正是手冊所述行為：const enum 成員在使用點被內嵌，宣告本身被移除。

### `as const` 替代方案與 `keyof typeof`

```ts
const Direction = {
  Up: 1,
  Down: 2,
  Left: 3,
  Right: 4,
} as const;

type DirectionKey = keyof typeof Direction;
// "Up" | "Down" | "Left" | "Right"

type DirectionValue = (typeof Direction)[keyof typeof Direction];
// 1 | 2 | 3 | 4

function move(d: DirectionValue) {
  if (d === Direction.Up) return [0, -1];
  return [0, 0];
}
```

`as const` 斷言凍結字面型別；手冊的 `keyof typeof` 慣用法（手冊示例為 `type LogLevelStrings = keyof typeof LogLevel`）用於抽出鍵聯集。值在執行期是帶有 `readonly` 屬性的普通物件，可透過與其他常數相同的模組系統匯出。

## 最佳實踐

- **MUST NOT** 從發佈的函式庫匯出 `const enum`。使用 `isolatedModules` 或 Babel 之類單檔轉譯器的消費端無法讀取宣告模組以解析內嵌值；Jamieson 引用的部落格文章記錄了「TypeScript 必須讀取兩個模組才能判斷」該值，而隔離式轉譯器拒絕這麼做。
- **MUST** 避免將 enum 值與具有相同底層型別的非 enum 原生值比較。TypeScript 編譯器允許這類比較，這正是 `@typescript-eslint/no-unsafe-enum-comparison` 存在的原因；該規則文件指出「允許將 enum 值與非 enum 值比較」。
- **SHOULD** 在新程式碼中優先選擇 `as const` 物件或字面聯集，而非新增 `enum` 宣告。手冊指出「在現代 TypeScript 中，當加上 `as const` 的物件已足夠時，你可能並不需要 enum」。
- **SHOULD** 當該固定集合不承擔任何執行期物件責任時，採用像 `"left" | "right" | "center"` 的字面聯集。手冊的 everyday-types 頁面將聯集描述為「只接受一組已知值的函式」的表達方式。
- **MAY** 在應用程式碼中保留既有的 `enum` 宣告，若人因利益（在 `Enum.Member` 上的自動完成、成組命名空間）超過遷移成本；TS 5.0 的字面型別升級已補齊早期大部分收斂缺口。

## 設計思維

`isolatedModules` 存在的原因是 Babel 之類的非 TypeScript 轉譯器一次只處理單一檔案。tsconfig 參考說明這類轉譯器「一次只操作單一檔案，代表它們無法套用需要理解完整型別系統的程式碼轉換」。`const enum` 匯入跨越了這個界線：將 `Direction.Up` 替換成 `1` 需要讀取另一個模組以查找成員的值。tsconfig 頁面寫得明確：「在不知道 const enum 成員值的情況下，其他轉譯器無法替換這些對數字的參照，若放任不管執行期會錯誤。因此當 isolatedModules 設定時，參照 ambient const enum 成員屬於錯誤。」

社群反應各有不同。TypeScript issue #41641 提議淘汰 `const enum` 並總結工具鏈成本：「const enum 對工具來說特別棘手… 它與 isolatedModules 不相容。」該提案遭到否決，因此 `const enum` 仍受支援，但討論串記錄了許多樣式指南為何迴避它。手冊建議的 `as const` 物件從另一個角度反映同樣的壓力。

## 深入探討

### 反向對映的不對稱性

數值 enum 會同時產出前向與反向對映：`Direction[1]` 回傳 `"Up"`。字串 enum 成員則不會：手冊指出「字串 enum 成員_不會_產生任何反向對映」。仰賴 `SomeEnum[value]` 以復原名稱的程式碼在數值 enum 上可用，但對字串 enum 會無聲地回傳 `undefined`。每個程式碼庫應挑一種 enum 類型，或完全避免反向對映查找。

### `const enum` 的版本偏移陷阱

手冊警告 `const enum`「很容易在編譯期內嵌相依套件版本 A 的值，卻在執行期匯入版本 B。版本 A 與 B 的 enum 可能有不同的值，若你不夠小心，會導致令人意外的 bug，例如 `if` 敘述走向錯誤的分支」。使 `const enum` 吸引人的內嵌機制，同時也是讓編譯器與執行期在數值上產生歧異的機制。一般 enum 與 `as const` 物件沒有這類 bug，因為執行期讀取的值來自實際載入的模組。

### TypeScript 5.0 的 union-enum 變更

TypeScript 5.0 重新設計了 enum 成員的型別化方式。發行公告指出「TypeScript 5.0 設法為每個計算成員建立獨特型別，使所有 enum 都成為 union enum。這代表所有 enum 現在都可以被收斂，並讓成員也能被當成型別參照」。在 5.0 之前，「每當 TypeScript 遇到這些情況，便會默默退回並採用舊的 enum 策略。這等同放棄聯集與字面型別的所有好處」。單一計算成員過去會使整個 enum 降級為舊策略，破壞 `switch` 敘述內的收斂，也禁止逐成員的型別參照。仰賴含計算成員 enum 收斂的程式碼需要 TS 5.0 或更新版本。

## 延伸閱讀

- [型別系統基礎與型別推論](/zh-tw/TypeScript/1701)
- [工具型別與型別操作](/zh-tw/TypeScript/1703)
- [`satisfies` 運算子](/zh-tw/TypeScript/satisfies-operator)

## 參考資料

- TypeScript Team, "Enums," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/enums.html
- TypeScript Team, "Everyday Types," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- TypeScript Team, "isolatedModules," TSConfig Reference. https://www.typescriptlang.org/tsconfig/isolatedModules.html
- Daniel Rosenwasser, "Announcing TypeScript 3.4," Microsoft DevBlogs (2019). https://devblogs.microsoft.com/typescript/announcing-typescript-3-4/
- Daniel Rosenwasser, "Announcing TypeScript 5.0," Microsoft DevBlogs (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- typescript-eslint, "no-unsafe-enum-comparison." https://typescript-eslint.io/rules/no-unsafe-enum-comparison/
- Nicholas Jamieson, "Don't Export Const Enums." https://ncjamieson.com/dont-export-const-enums/
- Ryan Cavanaugh, "Proposal: Deprecate `const enum`," TypeScript Issue #41641. https://github.com/microsoft/TypeScript/issues/41641
