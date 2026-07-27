---
id: 115
title: "HTML Sanitizer API — `setHTML()` vs `setHTMLUnsafe()` vs `innerHTML`"
state: draft
slug: html-sanitizer-api
category: HTML and Semantic Markup
level: senior
reviewed: tone
reviewed_on: 2026-07-27
---

# [FEE-115] HTML Sanitizer API — setHTML() vs setHTMLUnsafe() vs innerHTML

:::info
HTML Sanitizer API 引入兩個元素方法 `setHTML()` 與 `setHTMLUnsafe()`，與 `innerHTML` 並列，並將 HTML 字串轉成 DOM 子樹的過程形式化。`setHTML()` 會解析字串並以 XSS 安全的允許清單過濾，兩步驟合一；`setHTMLUnsafe()` 解析時不清毒，但支援 declarative shadow DOM（宣告式 shadow DOM）且可接受 `Sanitizer`。`innerHTML` 作為舊有 setter 保留下來，既不清毒也不會解析宣告式 shadow root。對於需要渲染使用者產生 HTML 的資深工程師，重點是 `setHTML()` 被設計為在處理不受信任輸入時直接替換 `innerHTML` 的選項，截至 2026 年 4 月，Chrome、Edge、Firefox 已支援，Safari 尚未支援。
:::

## 背景

HTML Sanitizer API 讓開發者能把 HTML 字串插入 DOM 或 shadow DOM 時，過濾掉不想要的元素、屬性及其他 HTML 實體 ([MDN HTML Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API))。目前字串轉 DOM 的邊界有三個進入點，各自有明確的契約：

- `Element.innerHTML` 將字串解析進宿主元素，不做清毒，且會靜默丟棄宣告式 shadow root。
- `Element.setHTMLUnsafe(input, options?)` 解析字串，預設不清毒；若未傳入 sanitizer，輸入中的所有 HTML 實體都會被注入 ([MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe))。它也會將 `<template shadowrootmode>` 解析為真正的 shadow root。
- `Element.setHTML(input, options?)` 解析並依 XSS 安全允許清單清毒，單一步驟完成。

`Unsafe` 版本之所以存在，是因為 `innerHTML` 會靜默丟棄 declarative shadow DOM：使用 `setHTMLUnsafe()` 時，輸入中的宣告式 shadow root 會被解析進 DOM，這與 `Element.innerHTML` 的行為不同 ([MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe))。伺服器渲染元件若輸出 `<template shadowrootmode="open">` 標記，需要這項行為，因此平台在 API 層面將 parser 與 sanitizer 拆開。

## 視覺對比

| 方法 | 解析 declarative shadow DOM？ | 預設清毒？ | 移除 XSS 不安全元素？ |
| --- | --- | --- | --- |
| `innerHTML` | 否 | 否 | 否 |
| `setHTMLUnsafe()` | 是 | 否（預設）；可透過 `Sanitizer` 設定 | 僅當呼叫端主動傳入 sanitizer |
| `setHTML()` | 是 | 是（XSS 安全允許清單） | 是，永遠移除，即使帶自訂設定 |

## 範例

### 以 `setHTML()` 取代 Markdown 渲染器中的 `innerHTML`

```js
import { marked } from "marked";

const source = await fetch("/comments/42.md").then((r) => r.text());
const html = marked.parse(source);

const target = document.querySelector("#comment-body");

// Before: XSS-prone
// target.innerHTML = html;

// After: one-step parse + XSS-safe sanitize
if (target.setHTML) {
  target.setHTML(html);
} else {
  // See Best Practices for the polyfill path.
  target.innerHTML = window.DOMPurify.sanitize(html);
}
```

### 以 `setHTMLUnsafe()` 處理含宣告式 shadow root 的受信任樣板

```html
<div id="card-host"></div>

<script>
  const trustedTemplate = `
    <template shadowrootmode="open">
      <style>:host { display: block; padding: 1rem; }</style>
      <slot></slot>
    </template>
    <h2>Hello, world</h2>
  `;

  // innerHTML would drop the <template shadowrootmode>; setHTMLUnsafe does not.
  document.getElementById("card-host").setHTMLUnsafe(trustedTemplate);
</script>
```

### 自訂 `SanitizerConfig` 搭配 `elements` 與 `removeAttributes`

```js
const config = {
  elements: [
    "p",
    "strong",
    "em",
    "code",
    "pre",
    { name: "a", attributes: ["href", "rel", "target"] },
  ],
  removeAttributes: ["style"],
  comments: false,
};

document.querySelector("#preview").setHTML(userMarkup, { sanitizer: config });
```

`SanitizerConfig` 可接受 `elements`、`attributes`、`removeElements`、`removeAttributes`、`replaceWithChildrenElements`、`comments`、`dataAttributes` 等欄位 ([MDN SanitizerConfig](https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig))。常見部署場景包含 Markdown 渲染出的 HTML、WYSIWYG 貼上處理，以及不受信任的郵件預覽 ([WICG Sanitizer API](https://wicg.github.io/sanitizer-api/))。

## 最佳實踐

- **MUST** 當 HTML 字串來自使用者輸入、網路內容，或任何信任邊界之外的來源時，以 `setHTML()` 取代 `innerHTML`。`setHTML()` 方法提供 XSS 安全的方式來解析並清毒 HTML，在設定使用者提供的 HTML 字串時，被建議作為 `Element.innerHTML` 的直接替代 ([MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML))。
- **MUST** 在使用 Sanitizer API 的同時維持嚴格的 Content Security Policy。CSP 屬於縱深防禦，可阻擋惡意腳本執行，並不能取代避免和及時修復 XSS 漏洞的責任 ([web.dev strict CSP](https://web.dev/articles/strict-csp))。
- **SHOULD** 使用前先以 `"setHTML" in Element.prototype` 做特徵偵測，因為瀏覽器支援尚未普及（見「失效模式」）。
- **SHOULD** 為不支援的瀏覽器安裝 polyfill fallback。Mozilla 的 `sanitizer-polyfill` 會改寫建構子參數，底層呼叫 DOMPurify ([mozilla/sanitizer-polyfill](https://github.com/mozilla/sanitizer-polyfill))；DOMPurify 本身是針對 HTML、MathML、SVG 的 DOM-only XSS sanitizer ([cure53/DOMPurify](https://github.com/cure53/DOMPurify))。
- **SHOULD** 將 `setHTMLUnsafe()` 限定於由團隊撰寫或可控的標記，例如伺服器渲染且附帶宣告式 shadow root 的元件。
- **MAY** 當預設允許清單過窄時（例如產品需要保留 `data-*` 屬性），在 `setHTML()` 上層套用自訂 `SanitizerConfig`。

## 設計思維

Sanitizer API 早期草案由 `Sanitizer.sanitize()` 方法回傳清毒後的字串。這種設計迫使呼叫端把輸出再次經由 `innerHTML` 回送，而這會重新解析標記。HTML 解析具備上下文相依性，輸入字串的詮釋方式取決於目前被插入的節點 ([Frederik Braun, "Why setHTML?"](https://frederikbraun.de/why-sethtml.html))。某個上下文下清毒後的字串，若在另一個上下文被重新解析，可能變形為 sanitizer 原本會拒絕的內容，這就是突變式 XSS（mXSS）類型的漏洞。規格作者把「清毒後再指派」折疊成單一元素方法，使 parser 只在目標上下文、sanitizer 的控制下執行一次：「Sanitizer API 的核心功能其實就是 `Element.setHTML(input)`……沒有多餘的解析。沒有模糊的上下文。只是設定 HTML。」 ([Frederik Braun, "Why setHTML?"](https://frederikbraun.de/why-sethtml.html))。

在使用者地盤的前例是 DOMPurify，一個針對 HTML、MathML、SVG 的 DOM-only、高效能、高容錯 XSS sanitizer ([cure53/DOMPurify](https://github.com/cure53/DOMPurify))。DOMPurify 的 `sanitize()` 回傳字串，因此帶有相同的二次解析風險，而原生 API 現在避開了這點。平台採納 DOMPurify 的允許清單哲學，同時捨棄回傳字串的形狀；原生 API 推薦的 polyfill 以 `Sanitizer` 形狀的介面委派給 DOMPurify ([mozilla/sanitizer-polyfill](https://github.com/mozilla/sanitizer-polyfill))。

## 深入探討

`setHTMLUnsafe()` 對宣告多個宣告式 shadow root 的宿主有一條細節規則。若 HTML 字串在同一個 shadow 宿主下定義了多個宣告式 shadow root，只會建立第一個 `ShadowRoot`，後續的宣告會被解析為該 shadow root 內的 `<template>` 元素 ([MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe))。若 hydration 管線不慎在同一宿主下輸出兩個 `<template shadowrootmode="open">` 子節點，第二個會被靜默降級為巢狀 `<template>`，而不會拋出錯誤。從多來源組合伺服器渲染元件的團隊，應在輸出階段就去重 shadow root，因為事後除錯「缺少 shadow root」問題要檢視 DOM 樹，而非輸入字串。

## 失效模式與清毒無法涵蓋的範圍

Sanitizer API 提升了 DOM 注入安全性的底線，值得點出它未能處理的邊角。

**即使帶自訂設定也永遠被移除的元素。**安全方法會移除任何被視為 XSS 不安全的元素與屬性，即使 sanitizer 設定允許也一樣。特別是以下元素永遠會被移除：`<script>`、`<frame>`、`<iframe>`、`<embed>`、`<object>`、`<use>`，以及事件處理器屬性 ([MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML))。將 `<iframe>` 列在 `elements` 下的設定仍會被移除。可執行腳本的 URL scheme 也不會被直接過濾，它們之所以失效，是因為承載它們的元素被移除。

**預設 sanitizer 的範圍比 XSS 安全更廣。**預設設定會移除已知的 XSS 不安全項目、可能被用於點擊劫持、假冒或其他攻擊的額外項目，以及註解和 `data-*` 屬性 ([MDN default sanitizer configuration](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration))。依賴 `data-*` 作為分析或 hydration hook 的產品介面，在預設設定下會看到這些屬性消失。

**`removeUnsafe()` 不等於預設設定。**呼叫 `Sanitizer.removeUnsafe()`，或將自訂 sanitizer 傳入安全清毒方法，只會移除 XSS 不安全項目，而不會移除額外項目、註解與 `data-*` 屬性 ([MDN default sanitizer configuration](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration))。把 `removeUnsafe()` 視為等同預設允許清單，會讓點擊劫持與假冒向量繼續存在。

**允許清單與移除清單在同一維度下互斥。**同一個設定中同時指定 `elements` 與 `removeElements`（或同時指定 `attributes` 與 `removeAttributes`）會被拒絕；其他欄位組合則可接受 ([MDN HTML Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API))。團隊若要遷移細緻的 DOMPurify 設定，應先在每個維度挑定一種模型再翻譯。

**2026 年 4 月的瀏覽器支援。**Chrome 146 與 Edge 146 已出貨此 API，Firefox 於 148（2026 年 2 月）加入支援。Safari 在 Can I Use 矩陣中尚無支援版本 ([Can I Use mdn-api_sanitizer](https://caniuse.com/mdn-api_sanitizer))。MDN 將此功能標為 Limited Availability，明確指出它不屬於 Baseline，因為它在部分使用率最高的瀏覽器中並不運作 ([MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML))。針對 Safari 使用者的生產程式碼 MUST 進行特徵偵測，並回退至 `sanitizer-polyfill` 或 DOMPurify ([mozilla/sanitizer-polyfill](https://github.com/mozilla/sanitizer-polyfill))。

## 延伸閱讀

- [HTML 安全屬性](/zh-tw/HTML%20and%20Semantic%20Markup/108)
- [Web Components 與自訂元素](/zh-tw/HTML%20and%20Semantic%20Markup/105)

## 參考資料

- MDN, "HTML Sanitizer API." https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
- MDN, "Element: setHTML() method." https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- MDN, "Element: setHTMLUnsafe() method." https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe
- MDN, "Sanitizer." https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer
- MDN, "SanitizerConfig." https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig
- MDN, "Default sanitizer configuration." https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration
- WICG, "HTML Sanitizer API (Editor's Draft)." https://wicg.github.io/sanitizer-api/
- Frederik Braun, "Why setHTML?" https://frederikbraun.de/why-sethtml.html
- cure53, "DOMPurify." https://github.com/cure53/DOMPurify
- Mozilla, "sanitizer-polyfill." https://github.com/mozilla/sanitizer-polyfill
- web.dev, "Mitigate cross-site scripting (XSS) with a strict Content Security Policy." https://web.dev/articles/strict-csp
