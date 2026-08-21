---
id: 611
title: "框架 Signals 比較（Solid、Vue、Preact、Angular）"
state: draft
slug: framework-signals
reviewed: hardened
reviewed_on: 2026-07-15
---

# [FEE-611] 框架 Signals 比較（Solid、Vue、Preact、Angular）

:::info
Solid、Vue、Preact 與 Angular 各自提供 signal 風格的響應式原語，四者收斂出相同的形態：一個在讀取時記錄讀者、在寫入時重新執行讀者的值容器。剩下的差異——呼叫 getter 或 `.value` 存取、預設等值判斷、effect 語意——都是刻意的設計決策，比較這些差異是理解細粒度響應式運作方式、以及 TC39 Signals 提案想要統一的內容最直接的途徑。本文涵蓋這些 userland 實作與其底層共用的演算法；語言層級的提案本身則由 [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) 涵蓋。
:::

## 背景

這個原語的歷史比本文標題中的任何一個框架都久遠。Knockout.js 早在 2010 年就推出了 `observable` 與 `computed`，細粒度響應式其實是經典 Observer 模式的一種變體，而狀態、衍生狀態與 effect 這套三段式詞彙，也早於下表列出的四個框架就已存在。S.js 於 2013 年引入了響應式所有權（reactive ownership）機制——一個計算擁有其子計算，並在重新執行時將子計算釋放；MobX 則在 2015 年開創了 push-pull 混合模式，保證「系統中的每個部分在一次變動中只會執行一次」。Solid 將這條脈絡濃縮為現代介面，透過 `createSignal` 回傳 getter／setter 配對。Vue 的 Composition API 透過 `ref()` 提供相同形態的原語。Preact 將 signals 包裝為框架無關的核心（`@preact/signals-core`），並提供 Preact 與 React 的綁定。Angular 在 v17 將 `signal()` 與 `computed()` 穩定化，`effect()` 則於 v20 跟進。Svelte 5 的 runes 運作於相同的模型之上，但將 signal 視為「一項底層實作細節」，這也是為什麼比較表中沒有 Svelte 的 signal 物件可供列入。四個團隊沿著這條共同脈絡收斂到同一個原語，正是剩餘差異值得深入探討的原因：每一項差異都是經過考量的設計決策，合在一起便構成了 TC39 統一工作的原始材料，其提案層級的故事則屬於 [FEE-10005](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md)。

## 視覺對比

| 面向            | Solid                          | Vue                             | Preact                          | Angular                         |
| ----------------- | ------------------------------ | ------------------------------- | ------------------------------- | ------------------------------- |
| 讀取語法       | `count()`（呼叫 getter）        | `count.value`                   | `count.value`                   | `count()`（呼叫 signal）         |
| 寫入語法      | `setCount(next)`（setter）      | `count.value = next`            | `count.value = next`            | `count.set(next)` / `count.update(fn)` |
| 預設等值判斷  | 新值 `===` 舊值則略過；可用 `equals` 選項覆寫 | 僅在新值不同時觸發（`Object.is` 風格檢查） | 賦值與現值相等則略過更新 | `Object.is` 風格：未變則略過 |
| Computed 原語| `createMemo`                   | `computed`                      | `computed`                      | `computed`                      |
| Effect 原語  | `createEffect`                 | `watchEffect` / `watch`         | `effect`                        | `effect`                        |

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

有一項不對稱值得留意：Angular 的 signal 本身就是 getter 函式，因此可以像 Solid 的獨立 getter 一樣被傳遞，而 `set` 與 `update` 則是掛在同一個函式物件上的方法，並非獨立的 setter。

## 最佳實踐

- **必須**將每個框架的 signal 視為不可跨執行期攜帶的原語。每種實作都有自己的自動追蹤機制，一個框架的 signal 不會替另一個框架的消費者建立訂閱關係，這正是 TC39 標準化工作的明確動機。
- **禁止（MUST NOT）**在 Solid 中依賴某個 signal 更新時所訂閱 effect 的觸發順序。`createEffect` 參考文件指出「多個 effect 之間的執行順序未受保證」。
- **不應該**在 effect 內部寫入 signal。Solid 的 effects 指南將 effect 內的 signal 寫入標記為無限迴圈風險，Angular 的 effect 指南警告不要用 effect 來傳播狀態變化，React 對 `useEffect` 也給出相同的建議：「如果你的 Effect 只是根據其他狀態調整某個狀態，你可能不需要 Effect。」
- **應該**在 Angular 中優先以 signal 寫入來驅動變更偵測，而非依賴 Zone.js 修補的非同步 API。Angular zoneless 指南將「在模板中讀取的 signal 被更新」列為 zoneless 的觸發條件，且自 Angular v21 起 zoneless 變更偵測已是預設值，signal 驅動的更新因此是基準做法，而非遷移目標。
- **應該**在設計 Preact 風格 API 時，讓 signal 在多次變動之間維持相同身份。Preact signal 是「具有 `.value` 屬性的物件……signal 的值可以變動，但 signal 本身始終不變」，這讓消費者可持有對容器的參照，無需在每次變動時都從父層重新讀取。
- **可以**仰賴框架的自動追蹤，而非為衍生計算手動宣告依賴陣列。Solid 的 `createEffect` 文件指出「Solid 會自動追蹤 effect 的依賴，所以你無需手動指定它們」。

## 設計思維

每個 signal 核心都要在同一組失效模式之間取得平衡。push 系統會在來源一變動就立即求值；這樣會過度重新計算，而且菱形依賴（diamond dependency）可能造成 glitch——因為某個節點若能透過兩條路徑從同一個來源抵達，就會被更新兩次，並在過程中短暫暴露不一致的中間值。pull 系統則只在被讀取時才求值；它能維持一致性，但每次存取都要重新走訪整個依賴圖。MobX 在 2015 年確立的 push-pull 混合模式，正是表中每個框架如今採用的做法；Reactively 後來以三色標記（dirty、check、clean）將這個機制明確化：寫入時把成本低廉的標記向下推送至整個圖，讀取時則把值向上拉取，最終只有輸入真正變動的節點才會重新計算。

各實作的主要差異在於支撐這套混合模式的底層資料結構。Preact Signals v1.2 以共用節點構成的雙向鏈結串列取代了以 Set 為基礎的依賴追蹤，使訂閱與取消訂閱都達到 O(1)，也讓節點可以在多次重新執行之間被回收再利用。它也改用版號（每個 signal 一個，另加一個全域版號）而非 dirty 旗標來追蹤過期狀態，原因是惰性 computed「可能會無限期地保留過期、甚至代價高昂的舊值」；當全域版號自上次讀取以來未曾變動時，computed 會完全略過依賴檢查。已被通知但尚未重新執行的節點不會再向下轉發通知，藉此截斷 glitch 的連鎖反應。

alien-signals 由 Vue 語言工具的作者 Johnson Chu 撰寫，把同樣的想法推得更遠。其 README 將其定位為探索「一種 push-pull 式的 signal 演算法」，並列出 Vue 3、Preact、Svelte 與 Reactively 作為影響來源。這個核心禁止使用 Array、Set 與 Map，禁止遞迴（圖的走訪一律以迭代方式進行），並將每一段依賴關係都表示為雙向鏈結串列；Chu 在 js-reactivity-benchmark 套件（該套件本身衍生自 Reactively 的基準測試）上進行基準測試後得出的結論是：「維持演算法的簡潔性，比複雜的排程策略帶來更顯著的改善。」這套演算法後來透過 vuejs/core PR #12349 回流到 Vue——由 Chu 撰寫、Evan You 於 2024 年 12 月合併——依操作種類不同，帶來約 13% 的記憶體用量降低與約 1x 至 3.6x 的效能提升，在計算節點眾多的病態案例中，提升幅度更可超過 30 倍（且會隨圖規模而擴大）。這套重寫後的核心已用於 Vue 3.6，該版本自 2025 年 7 月起歷經 alpha 與 beta 階段，截至 2026 年中仍在 beta（目前穩定版仍停留在 3.5 系列）；Vue 3.6 選用性的 Vapor Mode——編譯元件時不經過虛擬 DOM 直接渲染——採用的正是同一套核心。vuejs/language-tools 直接依賴 alien-signals，XState 則將此演算法移植進 @xstate/store 的 atom 架構之中；這個套件本身也可獨立使用（在 v3.2.x 版本中，其根模組匯出 `signal`、`computed`、`effect` 與 `effectScope`，更底層的 `createReactiveSystem()` 則可透過 `alien-signals/system` 進入點取得）。在 Vue 內部，它仍是一項內部實作細節：對外公開的介面依然是 `ref`、`computed` 與 `watchEffect`。

## 跨框架 API 比較

上表呈現的是同一種形態穿上四套不同的外衣：讀取分為呼叫 getter 與 `.value` 存取兩派，寫入則分為專用的 setter、直接賦值，以及 `set`／`update` 方法。讀取語法那一列的每個儲存格都是一個攔截點，因為 signal 系統的訂閱正是發生在讀取當下。effect 或 computed 執行期間，它會被全域追蹤為「目前正在執行的計算」，在這段期間讀取的任何 signal 都會為它註冊一筆訂閱。這正是為什麼讀取必須發生在追蹤範圍內；把 signal 目前的值複製到一般變數（或是解構出來）會切斷響應性，因為那個一般變數在被存取時不會再觸發讀取；這也是為什麼自動追蹤能把 signal 與事件發射器（event emitter）區分開來——後者的訂閱是明確註冊的，而不是在執行過程中自然形成。

每個執行期的追蹤情境只看得見在該執行期內建立的計算，因此一個框架的 signal 不會替另一個框架的消費者建立訂閱關係。生態系目前可行的解法是 Preact 的套件拆分方式：把狀態邏輯放在框架無關的核心（`@preact/signals-core`）之中，再由薄薄一層綁定把各框架的讀寫介面對應到這個核心上。

表中的等值判斷欄位皆為預設值，其中兩者提供公開的調整開關：Solid 的 `createSignal` 接受 `equals` 選項，可替換或停用 `===` 檢查；Angular 的 `signal()` 與 `computed()` 則接受自訂的等值函式。Vue 與 Preact 的文件未提供覆寫方式。另外，Vue 的 `ref` 預設會將物件值轉為深層響應式；若不需要這種深度，可改用 `shallowRef`。

### Signal 的 effect 與 React 的 useEffect

這個名稱與 React 的 `useEffect` 撞名，而這樣的撞名容易造成誤解。React 官方文件將 `useEffect` 描述為「在渲染之後執行某些程式碼，讓你的元件能與 React 之外的某個系統同步」的手段；effect「在畫面更新之後、commit 結束時執行」，而依賴陣列則是手動宣告、並由 lint 強制檢查（「你無法『選擇』自己的依賴」）。React 的 effect 之所以會重新執行，純粹是因為發生了一次渲染，且其宣告的依賴在兩次渲染之間發生了變化。它本身不持有任何訂閱關係。

signal 的 effect 則是響應式圖中的一個節點。Solid 的文件將 effect 定義為「當其依賴的 signal 變動時就會被觸發的函式」：它們在初始化時執行一次，之後只要依賴變動就會重新執行。Angular 把 effect 定義為「只要一個或多個 signal 值發生變化就會執行的操作」，它至少會執行一次，在變更偵測期間以非同步方式執行，且只追蹤最近一次執行時所讀取的 signal。Preact 的 `effect()` 會立即執行，並自動訂閱其中讀取到的每一個 signal；由於 Preact 的 signal 存在於元件樹之外，這個 effect 的存在完全不需要依附任何元件。

兩者的對比可以歸納如下：signal 的 effect 只建立一次，透過自動追蹤的讀取來訂閱，因資料寫入而重新執行，且不依附任何元件也能存在；`useEffect` 則是 commit 之後才執行的回呼，只有在渲染發生時才會重新評估是否執行，並受手動宣告的依賴陣列所限制，本身不持有任何訂閱關係。各陣營唯一一致認同的反樣式（anti-pattern）是：不要在 effect 內部寫入狀態——Solid 將此標記為無限迴圈風險，Angular 則警告不要用它來傳播狀態，React 給出的回應是「你可能不需要 Effect」。TC39 提案在這一點上也表明了立場：effect 被刻意排除在提案標準之外，該標準只規範了底層的 `Signal.subtle.Watcher`，供各框架自行在其上建構 effect 排程機制。

## 延伸閱讀

- [FEE-10005 Signals — 語言內建的響應式原語](../Web%20Platform%20Proposals/TC39%20and%20JS%20Proposals/10005.md) — 此原語的 TC39 提案層級說明：歷史、無 glitch 不變式、polyfill 內部運作。
- [React 19 表單狀態](/zh-tw/State%20Management/react-19-form-state) — 將其 hook 協作模式對照於 signal 模型。
- [XState v5：Actor 模型](/zh-tw/State%20Management/xstate-v5-actor-model) — 將編排式狀態機對照於細粒度的 signal 圖。

## 參考資料

- Ryan Carniato, "The Evolution of Signals in JavaScript," dev.to (2023). https://dev.to/playfulprogramming/the-evolution-of-signals-in-javascript-8ob
- Ryan Carniato, "A Hands-on Introduction to Fine-Grained Reactivity," dev.to (2021). https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf
- Joachim Viide, "Signal Boosting," preactjs.com (2022). https://preactjs.com/blog/signal-boosting/
- Lee Mighdoll, "Super Charging Fine-Grained Reactive Performance," dev.to (2022). https://dev.to/milomg/super-charging-fine-grained-reactive-performance-47ph
- Johnson Chu, "alien-signals," GitHub (2026). https://github.com/stackblitz/alien-signals
- Johnson Chu, "vuejs/core PR #12349 (alien-signals reactivity port)," GitHub (2024). https://github.com/vuejs/core/pull/12349
- Vue.js, "v3.6.0-alpha.1," GitHub Releases (2025). https://github.com/vuejs/core/releases/tag/v3.6.0-alpha.1
- React, "Synchronizing with Effects," react.dev (2026). https://react.dev/learn/synchronizing-with-effects
- Angular, "Signal effects," angular.dev (2026). https://angular.dev/guide/signals/effect
- TC39, "JavaScript Signals standard proposal," GitHub (2026). https://github.com/tc39/proposal-signals
- Svelte, "Introducing runes," svelte.dev (2023). https://svelte.dev/blog/runes
- Solid, "Signals," docs.solidjs.com (2026). https://docs.solidjs.com/concepts/signals
- Solid, "Effects," docs.solidjs.com (2026). https://docs.solidjs.com/concepts/effects
- Solid, "createEffect," docs.solidjs.com (2026). https://docs.solidjs.com/reference/basic-reactivity/create-effect
- Solid, "Memos," docs.solidjs.com (2026). https://docs.solidjs.com/concepts/derived-values/memos
- Preact, "Signals," preactjs.com (2026). https://preactjs.com/guide/v10/signals/
- Angular, "Signals," angular.dev (2026). https://angular.dev/guide/signals
- Angular, "Zoneless," angular.dev (2026). https://angular.dev/guide/zoneless
- Vue, "Reactivity API: Core," vuejs.org (2026). https://vuejs.org/api/reactivity-core.html
- Vue, "Reactivity in Depth," vuejs.org (2026). https://vuejs.org/guide/extras/reactivity-in-depth.html
