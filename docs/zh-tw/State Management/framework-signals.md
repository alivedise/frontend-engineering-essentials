---
id: 611
title: "框架 Signals 比較（Solid、Vue、Preact、Angular）"
state: draft
slug: framework-signals
---

# [FEE-611] 框架 Signals 比較（Solid、Vue、Preact、Angular）

:::info
Solid、Vue、Preact 與 Angular 各自在 userland 提供 signal 風格的響應式原語。原語形態收斂（值容器在讀取時自動追蹤依賴、在寫入時觸發 effect），但 API 在讀取語法、寫入語法、預設等值判斷與 computed／effect 命名上有所差異。本文是跨框架函式庫作者所需的 API 介面對照。語言層級的統一提案則由 [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) 涵蓋。
:::

## 背景

跨框架 signal 原語的歷史、無 glitch 語意與 TC39 標準化進度，於 [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) 以提案層級進行說明。本文則收斂至各框架今日所提供的 userland API。Solid 透過 `createSignal` 建立了現代介面，回傳 getter／setter 配對。Vue 的 Composition API 透過 `ref()` 提供相同形態的原語。Preact 將 signals 包裝為框架無關的核心（`@preact/signals-core`），並提供 Preact 與 React 的綁定。Angular 在 v17 將 signals 推出為穩定 API。釐清四者在讀取語法、預設等值判斷、命名上的差異，會決定單一核心是否足以支撐四種綁定，或是各框架需要各自的轉接層。

## 情境

某位函式庫作者正在為共用設計系統打造狀態容器，需要決定要對外暴露哪一種響應式原語，因為同一份元件邏輯可能執行於 Solid、Vue、Preact 或 Angular 應用之內。

## 最佳實踐

- **必須**將每個框架的 signal 視為不可跨執行期攜帶的原語。每種實作都有自己的自動追蹤機制，一個框架的 signal 不會替另一個框架的消費者建立訂閱關係，這正是 TC39 標準化工作的明確動機。
- **必須不要**在 Solid 中依賴某個 signal 更新時所訂閱 effect 的觸發順序。Solid 文件指出「順序可能變動」且「effect 的執行順序未受保證，不應被依賴」。
- **應該**在 Angular 中優先以 signal 寫入來驅動變更偵測，而非依賴 Zone.js 修補的非同步 API。Angular zoneless 指南將「在模板中讀取的 signal 被更新」列為 zoneless 的觸發條件，從而免除 Zone.js 對瀏覽器 API 的修補。
- **應該**在設計 Preact 風格 API 時，讓 signal 在多次變動之間維持相同身份。Preact signal 是「具有 `.value` 屬性的物件……signal 的值可以變動，但 signal 本身始終不變」，這讓消費者可持有對容器的參照，無需在每次變動時都從父層重新讀取。
- **可以**仰賴框架的自動追蹤，而非為衍生計算手動宣告依賴陣列。Solid 的 `createEffect` 文件指出「Solid 會自動追蹤 effect 的依賴，所以你無需手動指定它們」。

## 範例

Solid：

```js
import { createSignal } from "solid-js";
const [count, setCount] = createSignal(0);
console.log(count());        // 0
setCount(count() + 1);
```

Vue：

```js
import { ref } from "vue";
const count = ref(0);
console.log(count.value);    // 0
count.value++;
```

Preact：

```js
import { signal } from "@preact/signals-core";
const count = signal(0);
console.log(count.value);    // 0
count.value++;
```

Angular：

```ts
import { signal } from "@angular/core";
const count = signal(0);
console.log(count());        // 0
count.set(count() + 1);
```

每段程式片段都涵蓋各框架文件所記載的讀寫介面：Solid 的 getter／setter 配對、Vue 在 `ref` 上的 `.value` 存取器、Preact 在 signal 物件上的 `.value`，以及 Angular 以函式呼叫讀取 signal、再以 `set`／`update` 寫入。

## 跨框架 API 比較

| 面向            | Solid                          | Vue                             | Preact                          | Angular                         |
| ----------------- | ------------------------------ | ------------------------------- | ------------------------------- | ------------------------------- |
| 讀取語法       | `count()`（呼叫 getter）        | `count.value`                   | `count.value`                   | `count()`（呼叫 signal）         |
| 寫入語法      | `setCount(next)`（setter）      | `count.value = next`            | `count.value = next`            | `count.set(next)` / `count.update(fn)` |
| 預設等值判斷  | memo 值未變則略過更新 | `ref` 淺層／`reactive` 深層 | `.value` 寫入時即觸發 | `Object.is` 風格：未變則略過 |
| Computed 原語| `createMemo`                   | `computed`                      | `computed`                      | `computed`                      |
| Effect 原語  | `createEffect`                 | `watchEffect` / `watch`         | `effect`                        | `effect`                        |

讀取與寫入兩列分別錨定於 Solid `createSignal` 的 getter／setter 合約、Vue `ref` 的 `.value` 語意、Preact 在穩定 signal 物件上的 `.value` 存取器，以及 Angular signals 指南。等值列則反映 Solid memo 在等值時略過的行為，以及各框架容器所記載的響應式行為。

## 內部參考

- [FEE-10005 Signals — 語言內建的響應式原語](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) — 此原語的 TC39 提案層級說明：歷史、無 glitch 不變式、polyfill 內部運作。
- FEE-616 — React 19 表單狀態，將其 hook 協作模式對照於 signal 模型。
- FEE-614 — XState v5 actor 模型，將編排式狀態機對照於細粒度的 signal 圖。

## 參考資料

- Solid, "Signals," docs.solidjs.com. https://docs.solidjs.com/concepts/signals
- Solid, "Effects," docs.solidjs.com. https://docs.solidjs.com/concepts/effects
- Solid, "Memos," docs.solidjs.com. https://docs.solidjs.com/concepts/derived-values/memos
- Preact, "Signals," preactjs.com. https://preactjs.com/guide/v10/signals/
- Angular, "Signals," angular.dev. https://angular.dev/guide/signals
- Angular, "Zoneless," angular.dev. https://angular.dev/guide/zoneless
- Vue, "Reactivity API: Core," vuejs.org. https://vuejs.org/api/reactivity-core.html
- Vue, "Reactivity in Depth," vuejs.org. https://vuejs.org/guide/extras/reactivity-in-depth.html
