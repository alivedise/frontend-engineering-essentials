---
id: 110
title: '`hidden="until-found"` 與 `beforematch` 事件'
state: draft
slug: hidden-until-found-and-beforematch
category: HTML and Semantic Markup
level: mid
---

# [FEE-110] hidden="until-found" and the beforematch Event

:::info
`hidden` 全域屬性已是列舉型屬性，其 `until-found` 關鍵字狀態告訴瀏覽器將內容視為收合但仍可被頁內尋找與 URL fragment 導覽觸及。當匹配落在此種子樹內時，瀏覽器會觸發一個會冒泡的 `beforematch` 事件、移除 `hidden` 屬性，接著將元素捲動至視野中。此模式讓長 FAQ、可收合文件與分頁區段得以被搜尋，而無需作者自行撰寫 Ctrl+F 展開邏輯。此功能的實作底層為 `content-visibility: hidden`（並非 `display: none`），這也是為何它會參與版面計算，以及為何任何 `display` 覆寫會導致顯現失效。
:::

## 背景

自 WHATWG HTML 規格正式確立互動語意以來，HTML 即提供 `hidden` 布林屬性，但原始定義只有一種渲染模式：完全隱藏元素。此屬性後來升級為列舉型屬性，具備兩種關鍵字狀態：Hidden 與 Hidden Until Found；規格載明「The missing value default is the Not Hidden state, while invalid and empty value defaults both map to the Hidden state.」新關鍵字 `until-found` 將收合變體寫入宣告式 HTML，使作者工具與 user agent 共享相同契約。

這兩種狀態在使用者搜尋頁面或追蹤深度連結時的行為有所差異。Hidden 內容「Will not be rendered」；Hidden Until Found 內容「Will not be rendered, but content inside will be accessible to find-in-page and fragment navigation.」過去需以 JavaScript 先展開面板才能讓 Ctrl+F 看見文字的可收合 UI 模式，現在不再需要這層橋接。

## 視覺對比

| `hidden` 狀態 | 是否渲染？ | 頁內尋找可觸及？ | fragment 導覽可觸及？ | 參與版面？ |
| --- | --- | --- | --- | --- |
| Not Hidden（屬性不存在） | 是 | 是 | 是 | 是 |
| `hidden` / `hidden=""` / 無效值 | 否 | 否 | 否 | 否 |
| `hidden="until-found"` | 否 | 是 | 是 | 是（透過 `content-visibility: hidden`） |

第三列是關鍵差異所在。由於元素仍會產生 box，其邊框、padding 與背景仍會繪製，但內容保持不可見，且其對版面的貢獻在顯現前後維持穩定。

## 範例

一個 FAQ 清單：每個答案一開始皆為收合狀態，當使用者搜尋其中的字詞時自動顯現，並透過 `beforematch` 監聽器以動畫展開：

```html
<section class="faq">
  <article>
    <h3>
      <button type="button" aria-expanded="false" data-toggle>
        How do I cancel my subscription?
      </button>
    </h3>
    <div id="faq-cancel" class="answer" hidden="until-found">
      <p>Open Settings, choose Billing, then Cancel subscription.</p>
    </div>
  </article>

  <article>
    <h3>
      <button type="button" aria-expanded="false" data-toggle>
        Can I export my data?
      </button>
    </h3>
    <div id="faq-export" class="answer" hidden="until-found">
      <p>Yes. Settings, Data, Export as JSON or CSV.</p>
    </div>
  </article>
</section>

<script>
  // Feature detect: if beforematch is unsupported, expand everything now.
  if (!('onbeforematch' in HTMLElement.prototype)) {
    for (const el of document.querySelectorAll('[hidden="until-found"]')) {
      el.removeAttribute('hidden');
    }
  }

  // Ancestor listener: beforematch bubbles, so one listener covers the section.
  document.querySelector('.faq').addEventListener('beforematch', (event) => {
    const panel = event.target;
    panel.classList.add('is-revealing');
    const button = panel.closest('article').querySelector('[data-toggle]');
    if (button) button.setAttribute('aria-expanded', 'true');
  });

  // Manual toggle path: never require find-in-page to reveal content.
  for (const button of document.querySelectorAll('[data-toggle]')) {
    button.addEventListener('click', () => {
      const panel = button.closest('article').querySelector('.answer');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        panel.setAttribute('hidden', 'until-found');
      } else {
        panel.removeAttribute('hidden');
      }
    });
  }
</script>

<style>
  .answer {
    border-left: 2px solid currentColor;
    padding-inline-start: 0.75rem;
  }
  .answer.is-revealing {
    animation: slide-open 180ms ease-out;
  }
  @keyframes slide-open {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
```

`beforematch` 會在顯現之前觸發，因此是「run JavaScript to prepare the content, update analytics, or perform other actions before the hidden content becomes visible to the user.」的適切掛鉤點。

## 最佳實踐

- **MUST** 在頁內尋找之外另行提供明確的切換或展開入口。根據 Chrome 團隊說法，「The `hidden=until-found` content should be revealable without the use of find-in-page.」鍵盤使用者、螢幕閱讀器使用者與行動裝置使用者並非總能觸發頁內尋找匹配。
- **MUST NOT** 將 `hidden="until-found"` 當作安全邊界或隱私邊界。規格載明「Elements that are descendants of a hidden element are still active, which means that script elements can still execute, and form elements can still submit.」敏感標記應於伺服器端省略，而非於客戶端隱藏。
- **SHOULD** 透過 `'onbeforematch' in HTMLElement.prototype` 進行特性偵測，並在舊版瀏覽器上展開所有 `until-found` 面板，以維持搜尋可用性。
- **SHOULD** 當預期以深度連結展開某個 Hidden Until Found 區段時，使用 `href="#id"` 連結至該區段。隱藏元素在其他情況下「shouldn't be linked from visible elements unless using `hidden=\"until-found\"`.」
- **MAY** 當裝飾性邊框、背景與 padding 必須在區段收合時一併消失時，將其放置於巢狀子元素上。由於 `content-visibility: hidden` 實作會保留容器 box 的繪製，文件所載的變通做法即為「Add the border to an element nested inside the container that has `hidden=until-found`」。

## 深入探討

顯現機制依賴 CSS 包含（containment）。瀏覽器「typically implement _hidden until found_ using `content-visibility: hidden`. This means that, unlike elements in the _hidden_ state, elements in the _hidden until-found_ state generate boxes, and: they participate in page layout; their margin, borders, padding, and background are rendered.」子樹在瀏覽器決定顯現之前會跳過渲染與無障礙處理，這也讓搜尋引擎的啟發式判斷能以低成本檢視文字。

`beforematch` 會冒泡。WHATWG 演算法規定：「Fire an event named `beforematch` at ancestorToReveal with the `bubbles` attribute initialized to true.」因此在容器上設置單一委派監聽器即可觀察任一後代內的顯現事件，當頁面有數十個可收合面板時，可大幅降低事件連接成本。

隱藏子樹內的腳本與表單仍會運作。MDN 文件警告「elements that are descendants of a hidden element are still active, which means that script elements can still execute, and form elements can still submit.」若作者假設收合區段對副作用而言是惰性的，便會寫出 bug：自動播放媒體、分析信標、表單自動送出，皆會在 `hidden="until-found"` 子樹內繼續運作。

## 顯現時序模型

顯現動作是一組三步驟序列。當頁內尋找或 fragment 導覽指向 Hidden Until Found 內容時，「the browser will: 1. Fire a `beforematch` event on the hidden element 2. Remove the `hidden` attribute from the element 3. Scroll to the element.」事件處理器因此會在屬性被移除之前執行，這意味著監聽器內對 DOM 的查詢仍會在 `event.target` 上看到 `hidden="until-found"`。監聽器執行的任何同步變動（延遲載入圖片、連接嵌入 widget、預熱分析）都會落在穩定的顯現前狀態。

佈局包含（layout containment）是前置條件。規格載明「If the element in the _hidden until found_ state has a `display` value of `none`, `contents`, or `inline`, then the element will not be revealed by 'Find in page' or fragment navigation.」若作者在列表列上使用 `display: contents` 的工具 CSS，或為了行內風格收合而將面板本身設為 `display: inline`，會悄悄失去顯現能力。請維持 block 等級的 display 值，或將 `hidden="until-found"` 屬性施加於包裹用的 block 元素。

瀏覽器支援在 2026 年已相當普及。Chromium 於 2022 年在 Chrome 102 推出此功能。Firefox 的實作追蹤於 Bugzilla 1761043，「resolved and fixed, with Firefox 139 Branch designated as the target milestone.」WebKit 隨後跟進：「Safari 26.2 adds support for the `hidden=\"until-found\"` attribute.」三大主要引擎皆已支援此功能，因此特性偵測主要作為對舊版瀏覽器的守門，而非長期後備方案。

## 延伸閱讀

- [Scroll-to-Text Fragment（URL 文字指示）](/zh-tw/HTML%20and%20Semantic%20Markup/scroll-to-text-fragment)
- [HTML API 與漸進增強](/zh-tw/HTML%20and%20Semantic%20Markup/106)
- [語意元素與無障礙](/zh-tw/HTML%20and%20Semantic%20Markup/102)

## 參考資料

- WHATWG, "HTML Living Standard — Interaction." https://html.spec.whatwg.org/multipage/interaction.html
- MDN, "hidden — HTML global attribute." https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- MDN, "Element: beforematch event." https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event
- Chrome for Developers, "Making collapsed content accessible with hidden=until-found." https://developer.chrome.com/docs/css-ui/hidden-until-found
- WebKit, "WebKit Features in Safari 26.2." https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- Mozilla, "Bug 1761043 — Implement hidden=until-found attribute." https://bugzilla.mozilla.org/show_bug.cgi?id=1761043
- CSS-Tricks, "Covering hidden=until-found." https://css-tricks.com/covering-hiddenuntil-found/
