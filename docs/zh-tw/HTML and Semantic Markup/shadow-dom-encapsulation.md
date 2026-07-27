---
id: 117
title: "Shadow DOM 封裝"
state: draft
slug: shadow-dom-encapsulation
level: mid
---

# [FEE-117] Shadow DOM 封裝

:::info
Shadow DOM 會為一個元素附加一棵封裝的 DOM 子樹：子樹內的樣式不會外洩，頁面樣式也不會滲入，`document.querySelector` 也無法穿透這道邊界看見裡面的內容。Web Components 中最受矚目的往往是 Custom Elements，但 Shadow DOM 其實是另一個獨立的原語（primitive），即使沒有任何自訂元素、只用在一個普通的 `<div>` 上，它依然能運作。瀏覽器內部其實已經仰賴同一道邊界數十年：`<video>` 的控制列、`<input type="range">` 的滑塊、`<details>` 的可展開內容區，以及 `<select>` 的下拉選單，全都是瀏覽器自行附加在自己身上的 shadow tree，這也是為什麼替它們設定樣式時，得改用 `::-webkit-media-controls-panel` 或 `::details-content` 這類虛擬元素，而不是一般的子元素選擇器。本文把這道邊界本身當作主題，獨立於 FEE-105 所建構的自訂元素外殼之外。
:::

## 背景

Dimitri Glazkov 是 Google 內參與 Web Components 提案的工程師，他在 2011 年 1 月寫道，瀏覽器早在任何頁面作者能使用 shadow DOM 之前，就已經「偷偷地使用」它多年：一個 `<input type="range">` 早就有軌道與滑塊，一個 `<video>` 也早就有完整的控制列，全都是用普通的 HTML 與 CSS 打造，卻藏在 JavaScript 無法觸及的子樹裡（Glazkov, 2011）。隨後的提案把這個內部機制一般化成一套可供作者使用的 API。Shadow DOM v0 於 2013 年在 Chrome 的實驗旗標下推出，v1 規範於 2016 年定案，到了 2020 年，每個主流引擎，Chromium、Firefox 與 WebKit，都已支援；完整的 Web Components 時間線請見 [FEE-105：Web Components 與自訂元素](/zh-tw/HTML%20and%20Semantic%20Markup/105)。

FEE-105 把 Shadow DOM 當作 Web Components 技術堆疊的其中一項成分，與 Custom Elements、Templates 和 Slots 並列。本文則把這項成分單獨抽出來討論。`attachShadow()` 是定義在 `Element` 本身上的方法，並非定義在任何透過 `customElements.define()` 註冊的類別上，因此一個普通的 `<div>` 就能附加 shadow root，完全不需要任何自訂元素。這個 API 的歷史有個特別之處：它在成為頁面作者可用的 API 之前，早就存在於瀏覽器內部。公開版本唯一的任務，就是把瀏覽器原本就仰賴、用於自身控制項的那道邊界公開出來，這也是為什麼本文的最後一節會直接回到那些控制項本身。

[FEE-205：CSS 架構與作用域策略](/zh-tw/CSS%20and%20Layout%20Systems/205) 涵蓋了從命名慣例到 `@scope` 的 CSS 作用域光譜，Shadow DOM 是這個光譜上最徹底的一端：唯一由瀏覽器強制執行、而非仰賴建置工具或慣例的一端。本文從那個光譜的終點接續下去，涵蓋這道邊界的完整行為，不只是樣式作用域，還包括 DOM 走訪、ARIA 參照、事件傳播，以及瀏覽器自身對同一機制的歷史用法。

## 視覺對比

Shadow 邊界不是一道牆。它其實是好幾道剛好疊在同一個位置的獨立牆面：一道管腳本存取、一道管樣式規則、一道管 id 參照、一道管事件。有些會在兩種模式下都能穿越，有些完全不能穿越，而事件是否能穿越，則取決於派送當下設定的一個旗標。

| 穿越邊界的內容 | Open 模式 | Closed 模式 | 原因 |
|---|---|---|---|
| 從外部腳本讀取 `element.shadowRoot` | 回傳 `ShadowRoot` 物件 | 回傳 `null` | 這是 `mode` 唯一改變的事；渲染結果與 DOM 結構在兩種模式下完全相同 |
| 頁面 CSS 選擇器與 shadow tree 內的 `<style>` 規則 | 雙向皆被阻擋 | 雙向皆被阻擋 | 無論哪種模式，樣式規則都不會穿越 shadow 邊界 |
| 繼承的 CSS 屬性（`color`、`font-family`）與自訂屬性（`--brand-color`） | 會繼承進入 | 會繼承進入 | 自訂屬性本質上是可繼承屬性，穿越邊界的方式與 `color` 相同 |
| 帶有 `part` 屬性的元素 | 可透過 `::part()` 從頁面設定樣式 | 可透過 `::part()` 從頁面設定樣式 | 這是一套明確、與 mode 無關的樣式化 API |
| `id` 參照（`aria-describedby`、`for`、`aria-labelledby`、`list`） | 不會跨邊界解析 | 不會跨邊界解析 | 每個 shadow root 都是自己的 tree scope；IDREF 屬性只會在單一 tree scope 內解析 |
| 以 `composed: false` 派送的事件（大多數自訂事件的預設值） | 停在 shadow root | 停在 shadow root | 除非派送者主動選擇加入，否則 `composed` 預設為 `false` |
| 以 `composed: true` 派送的事件（`click` 等預設的 UI 事件） | 重新標定目標後，繼續進入頁面 | 重新標定目標後，繼續進入頁面 | 事件每穿越一個邊界，`target` 就會被改寫為該邊界的 host |

## 範例

### 1. 在一個普通 `<div>` 上呼叫 `attachShadow()`

Shadow DOM 不需要自訂元素。`attachShadow()` 是 `Element` 上的方法，因此下方「使用者代理 Shadow DOM」一節提到的允許清單中的任何元素，包括一個單純的 `<div>`，都能附加一個 shadow root。

```html
<div id="widget"></div>
<div id="widget-closed"></div>

<script>
// attachShadow() 與 customElements.define() 完全無關。
// 下方兩個 div 都可以換成允許清單中的任何元素。
const openHost = document.querySelector('#widget');
const openShadow = openHost.attachShadow({ mode: 'open' });
openShadow.innerHTML = `
  <style>
    :host { display: block; border: 1px solid #ccc; border-radius: 8px; padding: 1rem; }
    p { margin: 0; color: #333; }
  </style>
  <p>從 shadow tree 渲染而成，不涉及任何自訂元素。</p>
`;

const closedHost = document.querySelector('#widget-closed');
closedHost.attachShadow({ mode: 'closed' }).innerHTML = '<p>相同的標記，但採用 closed 模式。</p>';

// 像 `#widget p { color: red }` 這樣的頁面層級 CSS 無法觸及
// 上面任一個段落：兩者都位於不同的 tree scope。
console.log(document.querySelector('#widget p'));    // null
console.log(openHost.shadowRoot.querySelector('p'));  // <p> 元素
console.log(closedHost.shadowRoot);                   // null

// closed 的樹依然會渲染，也依然能透過具特權的工具存取
//（DevTools 的「Show user agent shadow DOM」設定，本文稍後
// 會再次用到）。closed 模式改變的只是某個 JavaScript 屬性
// 的回傳值，並不會把內容從頁面上移除。
</script>
```

### 2. 用 `<slot>` 與 `::slotted()` 做內容投射

```html
<div id="badge-host">
  <strong slot="label">Beta</strong>
  <span>New pricing page</span>
</div>

<script>
const host = document.querySelector('#badge-host');
const shadow = host.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #ccc;
      font-family: system-ui, sans-serif;
    }
    ::slotted(strong) {
      color: #b45309;
      font-weight: 700;
    }
  </style>
  <slot name="label" part="label"></slot>
  <slot></slot>
`;
</script>
```

具名 slot（`name="label"`）會把 `<strong slot="label">Beta</strong>` 投射到第一個 `<slot>` 裡。`<span>` 沒有 `slot` 屬性，所以會落入第二個未命名的 slot，也就是接收所有未被指定 slot 的子元素的預設 slot。`::slotted(strong)` 從 shadow tree 內部為被投射的 `<strong>` 設定樣式；它只會匹配頂層的被 slot 元素，絕不會匹配它的後代，所以 `::slotted(strong span)` 不會匹配任何東西。`<slot>` 本身帶有的 `part="label"` 屬性是合法的。`part` 是一個全域屬性，可用在 shadow tree 中的任何元素上，包括 `<slot>`，這也為下一個範例鋪路。

### 3. 跨巢狀 shadow tree 的 `::part()` 與 `exportparts`

`::part()` 只看得見直接對它撰寫選擇器的那個元素自身的 shadow tree。再深一層 shadow tree 中的 part，除非有東西透過 `exportparts` 把它轉發出來，否則對外是不可見的。

```html
<div id="panel-host"></div>

<style>
  /* "label" 位於距離頁面兩層 shadow tree 之外，
     但因為 badge 匯出了它，所以在這裡依然可見。 */
  #panel-host::part(label) {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #b45309;
  }
</style>

<script>
// 最內層 host：它自己的 shadow tree 把一個元素標記為 part="label"
const badge = document.createElement('div');
badge.attachShadow({ mode: 'open' }).innerHTML = `<strong part="label">Beta</strong>`;

// 沒有這一行，#panel-host::part(label) 會匹配不到任何東西：
// "label" 屬於 badge 的 shadow tree，對直接的父層選擇器來說
// 深了一層，無法直接觸及。
badge.setAttribute('exportparts', 'label');

// 外層 host：附加自己的 shadow tree，並把內層 host 放進去。
const panelHost = document.querySelector('#panel-host');
panelHost.attachShadow({ mode: 'open' }).appendChild(badge);
</script>
```

`exportparts` 接受一個以逗號分隔的清單。`exportparts="label"` 是 `exportparts="label:label"` 的簡寫；映射寫法 `exportparts="innerName:outerName"` 則讓中間層的元件能在轉發 part 的同時重新命名，因此一個設計系統的包裝元件可以把 `tab` 對外暴露成 `nav-tab`，而完全不需要更動內層元件。

## 最佳實踐

**必須（MUST）把 closed 模式視為隱私訊號，而非安全邊界。** `mode: 'closed'` 只會改變 `element.shadowRoot` 的回傳值；內容依然會渲染，也依然能透過其他方式存取，包括在頁面上執行的瀏覽器擴充功能。MDN 對此說得很直白：closed 模式「不應被視為強力的安全機制，因為它有辦法被繞過」。不要用 closed 模式來隱藏任何真正必須保密的內容，例如未渲染的機密資料；它只適合用來表達「消費者不應該伸手進來碰內部結構」這樣的訊號。

**應（SHOULD）預設使用 open 模式。** open 模式能讓 DevTools 檢查、測試工具與無障礙工具正常運作，而 closed 模式換不到真正的保護，卻要付出這些代價。只有在你明確想勸阻（而非真正阻止）外部走訪時，才保留給 closed 模式。

**不得（MUST NOT）仰賴 ARIA IDREF 屬性能跨越 shadow 邊界。** `aria-describedby`、`for`、`aria-labelledby` 和 `list` 全都只會在單一 tree scope 內解析 id 參照，而一個 shadow root 就是它自己的 tree scope。定義在 light DOM 中的 id，對 shadow tree 內的元素是不可見的，反之亦然。FEE-105 的常見錯誤第 4 點對此有深入說明，包括針對自訂元素、以 `ElementInternals` 為基礎的因應方式；但這條底層規則其實是 Shadow DOM 的特性，而非 Custom Elements 的特性，因此同樣適用於附加在一個普通 `<div>` 上的 shadow root。

**應（SHOULD）主動提供明確的樣式化介面，而不是讓消費者自行猜測。** 用於數值的 CSS 自訂屬性，以及用於可樣式化子元素的 `part`／`::part()`，是平台提供的兩種機制，讓元件能明確表達「消費者被允許碰哪裡」。若外部消費者未來有可能需要為元件套用主題，就應避免（AVOID）設計一棵完全沒有樣式化介面的 shadow tree；那會迫使對方在「複製一份元件」和「放棄封裝」之間二選一，而這兩者都不是真正的解法。

**應（SHOULD）把 `exportparts` 保留給需要穿越超過一層巢狀的 part。** 當可樣式化的元素直接位於 host 自己的 shadow tree 中時，一個 `part` 屬性就已足夠；只有當某個 part 位於外層元件自己並未定義的巢狀 shadow tree 內時，才需要用到 `exportparts`。

**應避免（AVOID）把 `:host-context()` 當作主題化機制使用。** MDN 已將它標記為 deprecated：「這項功能已不再建議使用……它可能已從相關的 Web 標準中移除，或正處於被淘汰的過程中。」它也從未在 Chromium 以外的引擎上實作過。改為把祖先層級的狀態反映（reflect）成 host 上的一個屬性（見下方「深入探討」），再用 `:host()` 讀取那個屬性。

## 設計思維

### mode 實際上保護了什麼

上方「視覺對比」矩陣裡的每一項差異，最終都可以歸結成同一件事：mode 只把關一個 JavaScript 屬性。closed 模式完全不會阻止頁面重新設定 host 的樣式、走訪無障礙樹，或接收從 shadow tree 內部派送的 composed 事件。closed 模式實際上模仿的，是瀏覽器自身與其內建元素之間的關係：`<input>` 和 `<img>` 的 shadow root 永遠對腳本封閉，因此無論頁面做什麼，`element.shadowRoot` 在這兩者上永遠是 `null`（MDN, Element: shadowRoot property）。在作者自訂的元素上選擇 closed 模式，等於在模仿這層關係：它主張這個元件的內部結構，是和滑塊的滑動把手一樣的實作細節；它並沒有隱藏任何 shadow 邊界原本就沒有隱藏的東西。

### 封裝與可主題化之間的拉鋸

如果 shadow 邊界擋下一切，連繼承屬性和自訂屬性都不放行，那麼任何設計系統都得在每一棵 shadow tree 裡重複一份 token，才能為元件套上主題。反過來，如果邊界什麼都不擋，那它就根本稱不上是一道邊界。平台的解法落在這兩個極端之間：繼承屬性和自訂屬性預設會穿越邊界，而 `part`／`exportparts` 與 `::slotted()` 則在牆上開出幾個窄而明確的洞，讓消費者能碰到其他真正需要的東西。

FEE-205 把 Shadow DOM 定位成 CSS 作用域光譜的終點：邊界不再是團隊彼此同意遵守的慣例，而是變成瀏覽器強制執行的規則。同樣的取捨也說明了為什麼 `::part()` 會存在，而不是讓 Shadow DOM 的封裝維持絕對：必須透過具名介面（`part="tab"`、`--brand-color`）才能取得的可主題化能力，其外形是元件作者能自行掌控、也能刻意加上版本規劃的；而透過開放選擇器深入任意後代取得的可主題化能力，一旦有消費者意外找到某個能用的選擇器並依賴它，元件作者就再也無法棄用它而不破壞對方。

瀏覽器在更大的規模上面對的是一模一樣的取捨，而它們如何解決這個問題，直接反映在下方「使用者代理 Shadow DOM」一節所列的虛擬元素中。

## 深入探討

### 事件重新標定目標：`composed` 與 `composedPath()`

在 shadow tree 內部派送的事件，並不會自動抵達外部的監聽器。有兩個條件同時決定它能不能穿越：`bubbles` 必須為 `true`，而且 `composed` 也必須為 `true`。WHATWG DOM Standard 直接在 `Event` 介面上定義了 `composed`：「若事件會呼叫超越其目標所在 ShadowRoot 的監聽器，則為 true；否則為 false。」大多數原生 UI 事件，例如 `click`、`input`、`pointerdown` 及其相關事件，預設就是 composed。`CustomEvent` 除非派送者明確傳入 `{ composed: true }`，否則預設不是 composed；而 `slotchange` 則完全不是 composed，因此它永遠不會抵達 slot 所在 shadow root 之外的監聽器。

當一個既 composed 又 bubbles 的事件真的穿越邊界時，它的 `target` 會在每一個經過的 shadow root 上被重新標定：邊界外的監聽器永遠看不到比最近的 shadow host 更深層的目標，即使這個事件確實源自這個 host 的 shadow tree 內部好幾層之下的元素。

```js
const host = document.querySelector('#widget');
const button = host.shadowRoot.querySelector('button');

document.addEventListener('click', (e) => {
  console.log(e.target);            // <div id="widget"> -- 已被重新
                                     // 標定為 host，而非 button
  console.log(e.composedPath()[0]); // <button> -- 真正的起源仍可透過
                                     // composedPath() 取回
});

button.addEventListener('click', (e) => {
  console.log(e.target); // <button> -- 位於同一個 tree scope 內，
                          // target 不會被重新標定
});
```

`composedPath()` 會回傳完整的傳播路徑，連 host 也包含在內，因此需要事件真正起源（而非邊界安全版、被重新標定過的目標）的程式碼，依然可以取回它。元件若要跨邊界派送自己的訊號，就必須明確選擇加入：

```js
host.dispatchEvent(new CustomEvent('widget-ready', {
  bubbles: true,
  composed: true, // 沒有這一行，事件永遠不會離開 shadow tree
  detail: { ready: true },
}));
```

### `:host`、`:host()`，以及已被 deprecated 的 `:host-context()`

`:host` 從 shadow tree 內部選取 shadow host，在其他任何地方都不會產生效果。`:host()` 接受一個複合選擇器，只有在該選擇器也匹配時才會選中 host，這正是條件式 host 樣式化的運作方式：

```css
:host { display: block; }
:host([disabled]) { opacity: 0.5; }
:host(.compact) { padding: 0.25rem; }
```

`:host-context()` 原本是為了解決另一個問題：根據 shadow tree *外部*的祖先元素來設定 host 的樣式，例如 `<body>` 上的 `dark-theme` class。MDN 現在已將它標記為 deprecated，而且它從來只在 Chromium 上實作過。更具可攜性的替代方案，是讓祖先層級的狀態被反映成 host 自身的一個屬性，讓元件永遠只需要檢查自己：

```css
/* 已被 deprecated，僅限 Chromium：伸出邊界去檢查任意祖先元素 */
:host-context(.dark-theme) { background: #1a1a1a; }

/* 可攜的替代方案：由元件外部的程式碼把祖先狀態反映到 host 上；
   元件本身永遠只檢查自己 */
:host([theme="dark"]) { background: #1a1a1a; }
```

```js
// 應用程式的設定程式碼，而非元件本身：
if (document.body.classList.contains('dark-theme')) {
  myWidget.setAttribute('theme', 'dark');
}
```

### 用於 SSR 的 Declarative Shadow DOM

`attachShadow()` 需要 JavaScript，這代表伺服器渲染的頁面在最初的 HTML 中不會有任何 shadow 內容：shadow tree 要等到腳本執行後才會出現，在較慢的連線下會產生一段無樣式或空白內容的畫面閃爍。Declarative Shadow DOM（DSD）補上了這個缺口。帶有 `shadowrootmode` 屬性的 `<template>` 會被 HTML 剖析器直接辨識，並在完全不涉及腳本的情況下，把其內容附加成父元素的 shadow root：

```html
<div id="badge-host">
  <template shadowrootmode="open">
    <style>
      :host { display: inline-flex; align-items: center; gap: 0.5rem; }
      ::slotted(strong) { color: #b45309; font-weight: 700; }
    </style>
    <slot name="label" part="label"></slot>
    <slot></slot>
  </template>
  <strong slot="label">Beta</strong>
  <span>New pricing page</span>
</div>
```

這正是本文稍早那個純 `<div>` 範例，改寫成可在伺服器端渲染的版本：同樣完全不需要自訂元素。`shadowrootmode` 接受 `open` 或 `closed`。同一個 `<template>` 上的相關布林屬性，`shadowrootdelegatesfocus`、`shadowrootclonable` 與 `shadowrootserializable`，會設定對應的 `ShadowRoot` 屬性（WHATWG HTML Standard, the template element）。

DSD 有兩個特有的陷阱（footgun）。第一，它只在剖析階段生效：宣告式 shadow root 只會為 HTML 剖析器執行期間（包含串流傳輸的 HTML）存在的 `<template shadowrootmode>` 標記附加成功。事後才用 JavaScript 設定這個屬性不會有任何效果，透過 `innerHTML` 插入相同的標記出於安全考量同樣無效；要以程式方式建立，必須改用 `setHTMLUnsafe()` 或 `Document.parseHTMLUnsafe()`。第二，留意舊資料中的屬性名稱：在 2023 年更名為 `shadowrootmode` 之前，Chrome 90 曾推出過一個較早、非標準的 `shadowroot` 屬性。DSD 於 2024 年 8 月達到 Baseline，意即 Chromium、Firefox 與 WebKit 都已支援目前的 `shadowrootmode` 語法，完全符合規範的版本則是在 Chrome 與 Edge 124、Firefox 123 以及 Safari 16.4 上完成（web.dev, Declarative shadow DOM）。

## 使用者代理 Shadow DOM

`Element.prototype.attachShadow()` 只能用在特定的允許清單上：`<article>`、`<aside>`、`<blockquote>`、`<body>`、`<div>`、`<footer>`、`<h1>` 到 `<h6>`、`<header>`、`<main>`、`<nav>`、`<p>`、`<section>`、`<span>`，以及任何合法的 autonomous custom element（MDN, Element.attachShadow()）。`<input>`、`<video>`、`<select>`、`<details>` 和 `<img>` 明顯不在這份清單上。對它們任何一個呼叫 `attachShadow()` 都會擲出 `NotSupportedError`，而這個限制並非隨意設定：這些元素每一個都已經在管理自己的一棵 shadow tree，由瀏覽器建立並擁有，平台不允許在上面再疊加第二棵。

這正是 Glazkov 在 2011 年描述的那套機制：一個滑塊的軌道與滑塊本身、一個影片的控制列，全都「不過是 HTML 與 CSS，藏在一棵 shadow DOM 子樹裡」（Glazkov, 2011）。MDN 直接證實了同一件事的現代版本：「某些內建元素，例如 `<input>` 與 `<img>`，擁有對腳本封閉的使用者代理 shadow root，因此它們的 `shadowRoot` 屬性永遠是 `null`」（MDN, Element: shadowRoot property）。內建元素的 shadow root，並不只是像範例 1 展示的那樣單純處於 closed 狀態；它對 `attachShadow()` 完全不可觸及，因此永遠無法被替換。

### 如何檢視它

以 Chromium 為基礎的瀏覽器可以直接揭露這棵樹。在 DevTools 中開啟設定（F1），勾選「Show user agent shadow DOM」，接著在 Elements 面板中選取任何帶有內建結構的元素：一個 `Shadow root (user-agent)` 節點就會出現，底下是瀏覽器真正的內部標記（devtoolstips.org, Inspect the user-agent DOM）。一個 `<video controls>` 元素展開後，會看到「一大串巢狀的 DOM 節點……用來顯示控制項、進度條等等」，而一個 `<input type="range">` 則會把軌道與滑塊揭露成各自獨立的節點，正是下方那些虛擬元素所鎖定的節點。

### 哪些已標準化，哪些還沒

| 元素 | 使用者代理 shadow 內容 | 樣式化介面 | 已標準化？ |
|---|---|---|---|
| `<video controls>` | 播放╱暫停、時間軸、音量、全螢幕，全都在一個控制面板中 | `::-webkit-media-controls-panel` 及其他 `-webkit-media-controls-*` 系列虛擬元素。僅限 Chromium 與 WebKit；Firefox 未提供對等的樣式化接口 | 否。Chromium 在 2014 年曾考慮徹底移除這些虛擬元素，起因是模糊測試（fuzzer）發現頁面覆寫某個內部控制項的 `display` 會使渲染器當機（blink-dev 郵件群組, 2014）；許多後來被改名為僅限內部使用的 `::-internal-media-controls-*` 前綴，目的正是不讓作者觸及 |
| `<input type="range">` | 一條軌道與一個滑塊 | `::-webkit-slider-thumb` ／ `::-webkit-slider-runnable-track`（Chromium、WebKit）；`::-moz-range-thumb` ／ `::-moz-range-track` ／ `::-moz-range-progress`（Firefox） | 否。MDN 針對 `::-webkit-slider-thumb` 的參考頁面說得很直接：「它不屬於任何標準」 |
| `<details>` ＋ `<summary>` | 可展開╱收合的內容區域 | `::details-content` | 是。已於 2025 年 9 月達到 Baseline |
| `<select>`（透過 `appearance: base-select` 選擇加入） | 下拉選單本體與其圖示 | `::picker(select)`、`::picker-icon` | 正在發展中。需要在 select 與 picker 上都明確選擇加入；截至 2026 年尚未達到 Baseline |

上面表格前兩列與後兩列之間的差距，就是「瀏覽器逐步、事後才開放的實作細節」與「從一開始就為了可樣式化而設計的標準軌道功能」之間的差距。`::-webkit-slider-thumb` 今天能用，是因為 Chromium 與 WebKit 選擇開放它，而不是因為有任何規範要求兩者這麼做。`::details-content` 能用，則是因為 CSS Working Group 把它定義成一個有跨引擎共識支持的真正虛擬元素。應以不同方式對待這兩個類別：把已標準化的部分當作可依賴的基礎去建構，而把 `-webkit-`／`-moz-` 這類前綴虛擬元素視為隨時可能改變形狀的相容層，這正是 Chromium 在 2014 年那場討論中，對自己這些虛擬元素所提出的同一份警告。

### 為什麼這是同一種原語，而不只是類比

重點不在於原生控制項「類似」Shadow DOM。`attachShadow()` 的允許清單、深入探討一節描述的重新標定目標行為，以及最佳實踐中 ARIA footgun 背後的 tree-scope 規則，全都同樣適用於這些元素的內部樹，就跟適用於作者自己的樹一樣，因為它們本來就是同一種樹。搭配 `appearance: base-select` 的 `<select>` 讓這一點變得具體可見：這是平台刻意重新協商一道使用者代理 shadow 邊界的例子，它讓一個真正由作者提供的 `<button>` 成為 select 的第一個 light DOM 子元素，而「傳統」select 完全不允許這麼做，同時仍把選單本體留在 `::picker(select)` 之後。從零打造一個自訂下拉選單，代表得重新推導鍵盤導覽、焦點管理，以及原生 `<select>` 的 shadow tree 早就具備的平台特定行為；學會它的樣式化介面，即使其中一部分是非標準的，也能保留那些行為，只改變外觀。

## 延伸閱讀

- [媒體、嵌入與互動元素](/zh-tw/HTML%20and%20Semantic%20Markup/104)
- [Web Components 與自訂元素](/zh-tw/HTML%20and%20Semantic%20Markup/105)
- [CSS 架構與作用域策略](/zh-tw/CSS%20and%20Layout%20Systems/205)

## 參考資料

- Dimitri Glazkov, "What the Heck is Shadow DOM?," glazkov.com (2011). https://glazkov.com/2011/01/14/what-the-heck-is-shadow-dom/
- MDN Contributors, "Using shadow DOM," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
- MDN Contributors, "Element: attachShadow() method," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
- MDN Contributors, "Element: shadowRoot property," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot
- MDN Contributors, "ShadowRoot," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
- MDN Contributors, "Event: composed property," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
- MDN Contributors, "::part," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::part
- MDN Contributors, "::slotted," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::slotted
- MDN Contributors, ":host," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/:host
- MDN Contributors, ":host-context," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/:host-context
- MDN Contributors, "exportparts," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/exportparts
- MDN Contributors, "::-webkit-slider-thumb," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-slider-thumb
- MDN Contributors, "::details-content," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/CSS/::details-content
- MDN Contributors, "Customizable select elements," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select
- web.dev, "Declarative shadow DOM," web.dev (2024). https://web.dev/articles/declarative-shadow-dom
- W3C, "CSS Shadow Parts Module Level 1," W3C Working Draft (2025). https://www.w3.org/TR/css-shadow-parts-1/
- WHATWG, "DOM Standard," WHATWG (2026). https://dom.spec.whatwg.org/#retarget
- WHATWG, "HTML Standard: The template element," WHATWG (2026). https://html.spec.whatwg.org/multipage/scripting.html#the-template-element
- Philip Jägenstedt et al., "Intent to Deprecate and Remove: ::-webkit-media-controls* pseudo-element selectors," blink-dev mailing list (2014). https://groups.google.com/a/chromium.org/g/blink-dev/c/YCIaYPa_DhI
- devtoolstips.org, "Inspect the user-agent DOM," DevTools Tips (2026). https://devtoolstips.org/tips/en/inspect-user-agent-dom/
