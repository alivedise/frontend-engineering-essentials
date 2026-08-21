---
id: 112
title: "`<search>` 地標元素"
state: draft
slug: search-landmark-element
category: HTML and Semantic Markup
level: mid
---

# [FEE-112] `<search>` 地標元素

:::info
`<search>` 元素是一個 HTML 容器，在語意上標示頁面中負責搜尋或篩選功能的區域。它於 2023 年 3 月 24 日被加入 HTML Living Standard，不需任何顯式屬性即帶有 `search` 的隱式 ARIA 角色。Baseline Widely available 支援於 2023 年 10 月達成，過去需要透過 ARIA 才能呈現的每一個現代地標，現在都有對應的原生 HTML 元素。使用它來包裹全站搜尋、分面篩選面板，以及頁內的地點查找表單，輔助科技便可透過地標巡覽公開這些區域。
:::

## 背景

HTML Living Standard 對此元素的定義為：「The search element represents a part of a document or application that contains a set of form controls or other content related to performing a search or filtering operation.」此範圍同時涵蓋搜尋表單與篩選 UI，因此名稱並不限定於單一的關鍵字查詢模式。

依 ARIA in HTML 規範，`<search>` 帶有 `search` 的隱式角色，屬於地標角色。無須 `role` 屬性即可在無障礙樹中產生地標。

2023 年 3 月之前，要公開搜尋地標的唯一做法是對 `<form>` 或 `<div>` 容器加上 `role="search"`。Scott O'Hara 對此次新增的說明總結了這個里程碑：「With the addition of `search`, now every ARIA landmark has a native HTML equivalent.」WebKit 是最早推出此元素的瀏覽器，Safari 17 beta 發布文寫道：「We are excited to be the first browser to ship this new `<search>` element, now supported in Safari 17.0.」Firefox 118 與 Chromium 118 於 2023 年 10 月跟進。

MDN 記錄目前的互通性狀態為：「Baseline Widely available. This feature is well established and works across many devices and browser versions. It's been available across browsers since October 2023.」2023 年 10 月即為此元素的 Baseline 跨越點。

## 視覺對比

| 地標 | 隱式角色 | 使用時機 |
| --- | --- | --- |
| `<header>` | `banner`（作為 `<body>` 直接子元素時） | 全站頁頭、商標、主要導覽骨架 |
| `<nav>` | `navigation` | 站內或頁內導覽的連結群組 |
| `<main>` | `main` | 文件的主要內容，包含搜尋結果 |
| `<aside>` | `complementary` | 輔助相關內容，例如側邊欄或引言區 |
| `<footer>` | `contentinfo`（作為 `<body>` 直接子元素時） | 全站頁尾資訊 |
| `<form role="search">` | `search`（透過顯式 ARIA） | `<search>` 出現前針對搜尋表單的舊有模式 |
| `<search>` | `search` | 包含搜尋輸入框、篩選器、建議列表或快捷搜尋連結的區域 |

JAWS、NVDA 與 VoiceOver 等螢幕報讀器會透過瀏覽器的無障礙 API 公開此地標，與 `role="search"` 的既有行為一致：「expose the search landmark in the browser's accessibility API, allowing people using assistive technology...to discover this content area.」

## 範例

一個同時擁有全站頁頭搜尋與區段範圍產品篩選的網站，會在同一頁面使用兩個 `<search>` 地標。

```html
<header>
  <a href="/">Acme</a>
  <search aria-label="Sitewide">
    <form action="/search" role="search">
      <label for="global-q">Search articles</label>
      <input id="global-q" name="q" type="search" />
      <button type="submit">Go</button>
    </form>
  </search>
</header>

<main>
  <h1>Climbing shoes</h1>

  <search aria-label="Product filters">
    <form action="/shoes" method="get">
      <fieldset>
        <legend>Filter shoes</legend>
        <label for="brand">Brand</label>
        <select id="brand" name="brand">
          <option value="">Any</option>
          <option value="scarpa">Scarpa</option>
          <option value="la-sportiva">La Sportiva</option>
        </select>

        <label for="size">Size</label>
        <input id="size" name="size" type="number" min="35" max="48" />

        <button type="submit">Apply filters</button>
      </fieldset>
    </form>
  </search>

  <section aria-label="Results">
    <!-- Search and filter results live in main content, not inside <search>. -->
  </section>
</main>
```

`<search>` 僅是一個群組化地標，本身不負責提交資料。提交由內嵌的 `<form>` 處理，與 HTML 規範本身的範例一致：`<search><form action="search.php"><label for="query">Find an article</label><input id="query" name="q" type="search"><button type="submit">Go!</button></form></search>`。

## 最佳實踐

- **MUST** 將搜尋結果放在主內容區域，而非放在 `<search>` 內。MDN 指出：「The `<search>` element is not for presenting search results. Rather, search or filtered results should be presented as part of the main content of that web page.」
- **MUST** 當頁面存在多個 `<search>` 地標時，透過 `aria-label` 或 `aria-labelledby` 給予每個地標唯一的無障礙名稱。ARIA Authoring Practices Guide 要求：「If a page includes more than one `search` landmark, each should have a unique label.」
- **SHOULD** 在無障礙名稱中省略「search」字樣以避免重複播報。MDN 的角色參考建議：「avoid labels like `aria-label=\"Sitewide search\"` which would announce as 'sitewide search search'. Use just `aria-label=\"Sitewide\"` instead.」
- **SHOULD** 撰寫新標記時優先使用語意化的 `<search>` 元素而非 `role="search"`：「If possible, prefer using the semantic `<search>` element instead of the `search` role.」
- **SHOULD** 將建議列表、自動完成下拉選單與快捷搜尋連結嵌套於 `<search>` 內：「suggestions and links that are part of 'quick search' functionality within the search or filtering functionality are appropriately nested within the contents of the `<search>` element.」
- **MAY** 在既有的 `<form>` 上保留 `role="search"`，而不將其包在新的 `<search>` 元素裡。MDN 指出：「If your `<input>` of type `search` is already contained within a `<form>`, then wrapping the form in another `<search>` element may be unnecessary markup.」當額外的嵌套無法增加結構意義時，此模式仍可接受。

## 範圍模式

`<search>` 並不限於單一的全站搜尋框。MDN 將其範圍敘述得較廣：「The search or filtering functionality can be for the website or application, the current web page or document, or the entire Internet or subsection thereof.」三種範圍層級對應典型的 UI：

1. **全站搜尋。** 放在 `<header>` 內包裹全域查詢表單的 `<search>`。每頁一個是常見情境。
2. **區段範圍篩選。** 圍繞產品列表、搜尋結果頁或文件索引之篩選面板的 `<search>`。地標涵蓋分面、滑桿、日期區間，以及縮小可見資料集的排序控制項。
3. **第三方範圍。** 圍繞查詢外部語料庫表單的 `<search>`（例如查詢政府資料集或聯合檔案庫的網站）。

當範圍不同時，頁面可攜帶多個 `<search>` 地標。MDN 自身的範例展示了此模式：「This example demonstrates a page with two search features. The first is a global site search located on the header. The second is a search and filter based on the page context.」

**多地標並存時的命名策略：**

- 以搜尋的資料集或區域來命名各地標，而非以動詞 `search` 命名。可用值包含 `aria-label="Sitewide"`、`aria-label="Product filters"`、`aria-label="Knowledge base"`，或透過 `aria-labelledby` 指向既有的可見標題。
- 同一頁的地標之間保持標籤互異。對頁頭搜尋與產品篩選同樣套用 `aria-label="Search"`，會讓輔助科技使用者在地標清單中無法區分它們。
- 當可見標題已為篩選區域命名（例如 `<h2 id="filters">Filter shoes</h2>`），透過 `aria-labelledby="filters"` 重用它，使可見名稱與無障礙名稱保持一致。

一個實用的判斷法：若某區域會被描述為「篩選」或「縮小範圍」而非「閱讀」，它就屬於 `<search>` 地標。

## 延伸閱讀

- [語意元素與無障礙](/zh-tw/HTML%20and%20Semantic%20Markup/102)
- [表單與驗證](/zh-tw/HTML%20and%20Semantic%20Markup/103)

## 參考資料

- WHATWG, "The search element," HTML Living Standard. https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element
- MDN, "`<search>`: The generic search element." https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
- MDN, "ARIA: search role." https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role
- W3C WAI, "Search Landmark Example," ARIA Authoring Practices Guide. https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
- W3C, "ARIA in HTML: `<search>`." https://w3c.github.io/html-aria/#el-search
- Scott O'Hara, "The search element," scottohara.me (2023). https://www.scottohara.me/blog/2023/03/24/search-element.html
- WebKit, "News from WWDC23: Web Features in Safari 17 beta" (2023). https://webkit.org/blog/14445/news-from-wwdc23-web-features-in-safari-17-beta/
