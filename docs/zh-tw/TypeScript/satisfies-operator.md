---
id: 1709
title: "`satisfies` 運算子"
state: draft
slug: satisfies-operator
category: TypeScript
level: mid
---

# [FEE-1709] `satisfies` 運算子

:::info
`satisfies` 用來驗證一個表達式可指派至目標型別，同時保留表達式原本推論出的型別。它解決了一個長期存在的兩難：開發者往往想確認表達式符合某個型別，又想留住最具體的推論型別供後續使用。TypeScript 4.9 於 2022 年 11 月推出此運算子，TypeScript 5.0 將其延伸至 JSDoc。本文涵蓋何時該使用 `satisfies`、它與型別註記及 `as` 的差異，以及 `as const satisfies T` 這個搭配字面縮窄與結構驗證的模式。
:::

## 背景

在 `satisfies` 出現之前，TypeScript 開發者有三種工具將表達式對齊到某個型別：型別註記（`const x: T = ...`）、型別斷言（`... as T`），或完全不加註記。每種工具都要付出代價。型別註記會把表達式加寬為 `T`，丟失編譯器原本已推論出的字面資訊。型別斷言則可能悄悄接受本應在指派檢查時失敗的表達式，因為 `as` 允許雙向的不安全轉型。

TypeScript 4.9 發行公告直接描述這個陷阱：「TypeScript 開發者經常面臨一個兩難：我們希望確認某個表達式符合某個型別，同時又想為推論目的保留該表達式最具體的型別。」`satisfies` 運算子鎖定這個兩難。根據同一份發行說明，它「讓我們可以驗證表達式的型別符合某個型別，而不改變該表達式的結果型別」。

這項功能請求可追溯到 2016 年的 `microsoft/TypeScript#7481`，標題為 "Operator to ensure an expression is contextually typed by, and satisfies, some type"。該 issue 開啟後六年，才於 2022 年 11 月隨 4.9 落地。

## 視覺對比

| 形式 | 加寬為目標型別？ | 驗證結構？ | 保留字面型別？ | 允許不安全轉型？ |
| --- | --- | --- | --- | --- |
| `const x = expr`（無註記） | 否 | 否 | 是 | 不適用 |
| `const x: T = expr` | 是 | 是 | 否 | 否 |
| `const x = expr as T` | 是 | 部分（雙向、寬鬆） | 否 | 是 |
| `const x = expr satisfies T` | 否 | 是（可指派性） | 是 | 否 |
| `const x = expr as const satisfies T` | 否 | 是 | 是（readonly 字面） | 否 |

此表追蹤 TypeScript 4.9、5.0 發行說明及 Rauschmayer 2ality 文章所點出的軸向。純字面值帶來最高的推論精度，但完全沒有驗證。型別註記以推論換取驗證。`as` 以安全性換取對型別外觀的控制。`satisfies` 保留窄的推論型別，並加上對目標的可指派性檢查。`as const satisfies T` 則在此之上再加入字面縮窄。

## 範例

代表性範例出自 TypeScript 4.9 發行說明。palette 被標註為 `Record<Colors, string | RGB>`，後續程式碼呼叫 `palette.green.toUpperCase()`。

```ts
type Colors = "red" | "green" | "blue";
type RGB = [red: number, green: number, blue: number];

// Approach A: annotation widens each property.
const palette1: Record<Colors, string | RGB> = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};
// Error: 'palette1.green' could be of type RGB;
// property 'toUpperCase' does not exist on type 'string | RGB'.
palette1.green.toUpperCase();
```

加上型別註記後，每個屬性都被加寬為 `string | RGB`，因此 `toUpperCase()` 這類成員存取會失敗，編譯器已不記得 `green` 實際被指派為字串。

```ts
// Approach B: satisfies validates without widening.
const palette2 = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<Colors, string | RGB>;

palette2.green.toUpperCase(); // OK: still typed as string.
```

依 4.9 發行說明所述：`satisfies Record<Colors, string | RGB>; // toUpperCase() method is still accessible!`。編譯器也會比對拼錯的鍵與約束：若加入 `"platypus": false`，會出現 `error - "platypus" was never listed in 'Colors'`。

Rauschmayer 2ality 文章（2025 年 2 月）的第二個範例則呈現 `as` 與 `satisfies` 在安全性上的落差：

```ts
interface Point {
  x: number;
  y: number;
}

const point5 = { x: 2 } as const as Point; // OK (problematic)
const point6 = { x: 2 } as const satisfies Point;
// Error: Property 'y' is missing in type '{ readonly x: 2 }'.
```

`as` 掩蓋了缺失的 `y` 屬性；`satisfies` 會回報。套用在完整物件上時，`satisfies` 會保留窄的推論型別：`{ x: 2, y: 5 } as const satisfies Point` 的型別仍為 `{ readonly x: 2, readonly y: 5 }`。

## 最佳實踐

- **MUST** 當目的是驗證結構、而無需改寫型別時，以 `satisfies T` 取代 `as T`。`as` 可能掩蓋缺少的必要屬性（`{ x: 2 } as const as Point` 能通過型別檢查，`{ x: 2 } as const satisfies Point` 則不會），因為 `as` 普遍會改變其左側的型別，且型別檢查不如 `satisfies` 嚴格（Claims 8, 9）。
- **MUST** 若同時需要字面縮窄與結構驗證，請先寫 `as const` 再接 `satisfies`。`as const satisfies T` 可編譯；`satisfies T as const` 不行，因為 `const` 斷言僅能套用於列舉成員、字串、數字、布林、陣列或物件字面值的參照（Claim 11）。
- **SHOULD** 當需要型別檢查又想保留字面推論時採用 `satisfies`，特別針對可選屬性、傳入函式的物件字面值，以及無法附帶內聯註記的 default exports（Claim 14）。
- **SHOULD** 當下游程式碼依賴每個屬性各自的窄型別時，使用 `satisfies` 取代型別註記。`Record<Colors, string | RGB>` 註記會加寬每個屬性，導致 `palette.green.toUpperCase()` 無法通過型別檢查；`satisfies` 保留較窄的推論型別，該呼叫仍可通過（Claims 5, 6, 10）。
- **MAY** 對寬鬆的 interface 套用 `satisfies`，以保留該 interface 原本會抹除的結構細節。若將 `extends` 宣告為陣列的 `ConfigSettings` 物件，在 `satisfies CompilerOptions` 底下仍會保留陣列結構，因為 `satisfies` 僅驗證而不改變型別（Claim 13）。

## 設計思維

這三種工具各自在不同軸向上取捨。型別註記在宣告處提供清晰度，保證變數型別與宣告相符，代價是失去窄的字面推論。`as` 讓開發者掌控產生的型別，卻允許雙向的不安全轉型，缺失的屬性因此可能溜過（Claims 4, 9）。`satisfies` 加入檢查卻不改寫型別：執行可指派性測試，並保留表達式原本推論出的型別。

2016 年的請求把目標定為 "allow implicit conversions only (type compatibility)"，正是六年後這個運算子交付的結果。4.9 發行說明將檢查與保留特性並列：運算子讓開發者「驗證表達式的型別符合某個型別，而不改變該表達式的結果型別」。5.0 公告則將此特性概括為「確保表達式的型別相容，同時不影響型別本身」（Claim 15）。

若想在宣告處同時獲得字面精度與契約檢查，請採用 `satisfies`。若希望變數擁有宣告中的確切型別，不論右側形狀為何，請使用型別註記。若已確知編譯器無法驗證結構，`as` 依然可用；使用門檻較高，因為它繞過 `satisfies` 會執行的檢查。

## 深入探討

`satisfies` 不會帶來 `as const` 的行為。它不會把屬性轉為 `readonly`、不會把原始字面值縮窄為字面型別，也不會把陣列型別收斂為 tuple 型別。那些效果屬於 `as const`。因此 `as const satisfies T` 的組合有順序意義：先由 `as const` 對字面值進行縮窄與凍結，再由 `satisfies T` 將縮窄後的型別對 `T` 做驗證。

反過來寫會失敗。TypeScript repo issue `#51173` 紀錄了 `const` 斷言只能套用於列舉成員、字串、數字、布林、陣列或物件字面值的參照。`satisfies` 執行後，表達式不再被視為上述任一形式，所以 `satisfies T as const` 會在 parse/check 階段被拒絕。

`as const satisfies T` 的順序，就是同時想要窄字面型別與結構驗證時的正確寫法。拿掉其中任一運算子，就會失去對應的特性。

## JSDoc @satisfies

TypeScript 5.0 新增 `@satisfies` 作為 JSDoc 標籤，讓採用 `// @ts-check` 的 JavaScript 檔也能在保留推論型別的同時驗證物件結構。依發行說明所述：「這就是為什麼 TypeScript 5.0 支援一個名為 `@satisfies` 的新 JSDoc 標籤，做的正是同一件事。」此標籤為未標註型別的 JavaScript 使用者鏡像了運算子的行為。

```js
// @ts-check

/**
 * @satisfies {Record<"red" | "green" | "blue", string | number[]>}
 */
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};

palette.green.toUpperCase(); // OK, still string.
```

## 延伸閱讀

- [型別系統基礎與型別推論](/zh-tw/TypeScript/1701)
- [工具型別與型別操作](/zh-tw/TypeScript/1703)
- [型別縮窄與型別防護](/zh-tw/TypeScript/1704)

## 參考資料

- Microsoft TypeScript Team, "Announcing TypeScript 4.9," Microsoft DevBlogs (2022). https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/
- Microsoft TypeScript Team, "TypeScript 4.9," TypeScript Handbook Release Notes (2022). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- Microsoft TypeScript Team, "Announcing TypeScript 5.0," Microsoft DevBlogs (2023). https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
- Microsoft TypeScript Team, "TypeScript 5.0," TypeScript Handbook Release Notes (2023). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- Ryan Cavanaugh et al., "Operator to ensure an expression is contextually typed by, and satisfies, some type," microsoft/TypeScript Issue #7481, GitHub (2016). https://github.com/microsoft/TypeScript/issues/7481
- microsoft/TypeScript contributors, "`as const satisfies T` ordering," microsoft/TypeScript Issue #51173, GitHub (2022). https://github.com/microsoft/TypeScript/issues/51173
- Axel Rauschmayer, "The `satisfies` operator in TypeScript," 2ality (2025). https://2ality.com/2025/02/satisfies-operator.html
