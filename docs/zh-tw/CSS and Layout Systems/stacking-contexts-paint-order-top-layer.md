---
id: 211
title: "Stacking Context、繪製順序與 Top Layer"
state: draft
slug: stacking-contexts-paint-order-top-layer
---

# [FEE-211] Stacking Context、繪製順序與 Top Layer

:::info
Stacking context（堆疊上下文）是把 HTML 元素沿著一條假想的 z 軸、相對於使用者做三維排列的概念模型；一個 stacking context 內的元素，堆疊時獨立於外部元素。這種獨立性解釋了經典的失敗案例：`z-index: 9999` 仍然被壓在兄弟元素的 header 底下，因為 z-index 的值只在其父 stacking context 內有意義。在每個 context 內部，CSS 2 附錄 E 定義了一套固定的由後往前繪製順序，任何 z-index 值都無法跨越 context 邊界重新排序。由瀏覽器管理的 top layer 位於文件所有其他圖層之上，`dialog.showModal()`、Popover API 與全螢幕都會把元素放進去，讓 overlay 程式碼不必再堆高 z-index。
:::

## 背景

MDN 將 stacking context 定義為「沿著一條假想的 z 軸、相對於使用者對 HTML 元素所做的三維概念化」，並保證 context 內的元素堆疊時獨立於外部元素（MDN, "Stacking context," 2025）。這項保證也是經典堆疊 bug 的來源：由於「子 stacking context 的 z-index 值只在其父 stacking context 內有意義」，任何 z-index 值都無法把後代抬到其 stacking context 祖先的兄弟元素之上。規範性的繪製規則收在 CSS 2 規格的附錄 E（Bos et al., 2011），較新的 CSS Positioned Layout Module Level 3（Etemad & Atkins, 2025）也明確指回附錄 E 作為繪製規則的依據。最新登場的是 top layer：MDN 詞彙表（2025）收錄其定義，Jhey Tompkins 則在 Chrome for Developers 部落格（2022）以「z-index:10000 的解方」把它介紹給實務開發者。本文涵蓋三件事：什麼會建立 stacking context、內容在其中的繪製順序，以及何時該放下 z-index、改用 top layer。

## 視覺對比

依 MDN 的觸發清單（2025），以下條件會建立 stacking context：

| 觸發類別 | 條件 |
| --- | --- |
| 文件根節點 | `<html>` 元素 |
| 定位 | `position: absolute` 或 `relative` 搭配非 `auto` 的 `z-index`；`position: fixed`；`position: sticky` |
| Flex 與 grid | flex item 或 grid item 搭配非 `auto` 的 `z-index` |
| 視覺效果 | `opacity` 小於 1；`mix-blend-mode` 非 `normal`；`transform`、`scale`、`rotate`、`translate`、`filter`、`backdrop-filter`、`perspective`、`clip-path`，或 `mask` / `mask-image` / `mask-border` 任一設為非 `none` 的值 |
| 明確宣告 | `isolation: isolate` |
| 效能提示 | `will-change` 搭配符合條件的值 |
| Containment | `contain: layout` 或 `contain: paint`；`container-type: size` 或 `inline-size` |
| 瀏覽器管理 | 放入 top layer 的元素 |
| 動畫 | 對上述屬性套用 forwards 填充的 keyframe 動畫 |

在每個 stacking context 內部，CSS 2 附錄 E 依固定順序由後往前繪製：

1. 建立該 context 的元素本身的背景與邊框
2. z-index 為負的 stacking context，「依 z-index 順序（最負者優先），其次依樹狀順序」
3. in-flow 的區塊層級內容
4. 「所有未定位的浮動後代，依樹狀順序」
5. 行內內容
6. 「所有 `z-index: auto` 或 `z-index: 0` 的定位後代，依樹狀順序」
7. z-index 大於等於 1 的 stacking context，「依 z-index 順序（最小者優先），其次依樹狀順序」

## 範例

一個 sticky header 加一個 tooltip 就能重現 `z-index: 9999` 的失敗：

```html
<header style="position: sticky; top: 0; z-index: 10">Site header</header>

<section style="position: relative; z-index: 1">
  <button>Details</button>
  <div class="tooltip" style="position: absolute; z-index: 9999">
    I still render under the header.
  </div>
</section>
```

`<section>` 設了 `position: relative` 與非 `auto` 的 z-index，因此形成 stacking context。tooltip 的 `z-index: 9999` 在該 context 內部解析，整個 context 則以 1 對 10 的值與 header 競爭。如 MDN 所述，「子 stacking context 的 z-index 值只在其父 stacking context 內有意義」，tooltip 設多大都贏不了。

Top layer 直接讓這場競爭消失：

```html
<dialog id="confirm">
  <p>Discard unsaved changes?</p>
  <button>Discard</button>
</dialog>

<script>
  document.querySelector('#confirm').showModal();
</script>
```

以 `HTMLDialogElement.showModal()` 開啟的 modal dialog 會渲染進 top layer，也就是「一個橫跨整個 viewport 寬高、位於網頁文件中所有其他圖層之上的特定圖層」（MDN 詞彙表，2025）。Chrome for Developers 部落格寫道：「你不需要對 `<dialog>` 套用任何樣式，它就會出現在所有其他內容之上。」header 的 `z-index: 10` 從頭到尾沒有進入比較。

## 最佳實踐

- **必須（MUST）** overlay 一律優先採用原生 top-layer API（`dialog.showModal()`、Popover API、全螢幕），而非堆高 z-index：modal dialog 不需要任何堆疊 CSS 就會出現在所有內容之上（Chrome for Developers, 2022）。
- **應該（SHOULD）** 需要刻意建立 stacking context 時，使用 `isolation: isolate`：`isolate` 值的定義是「必須建立一個新的 stacking context」（MDN, "isolation," 2025），而且沒有 `opacity`、`transform` 這類附帶觸發的副作用。
- **應該（SHOULD）** 用瀏覽器 DevTools 除錯堆疊 bug，而非逐段刪 CSS 二分排查：Chrome DevTools 已加入內建的 top-layer 元素檢視功能，於 Chrome Canary 105 以預覽版推出（「Chrome DevTools 正在加入 top layer 元素支援，讓你能檢視 top layer」，Chrome for Developers, 2022）。
- **可以（MAY）** 將 `isolation` 與 `mix-blend-mode`、`z-index` 搭配使用：MDN 指出這個屬性「與 mix-blend-mode 和 z-index 一起使用時特別有用」（MDN, "isolation," 2025）。

## 設計思維

在 z-index 與 top layer 之間選擇，等於在作者指定的順序與瀏覽器管理的順序之間選擇。作者指定的 z-index 讓每一層的位置都明白寫在樣式表裡，代價是 Chrome for Developers 部落格標題點名的那種層層加碼：「z-index:10000 的解方」。Top-layer 提升則交出這份作者控制權：瀏覽器逕自把提升的元素放在所有其他圖層之上，z-index 與 DOM 階層都不再影響結果。第二個取捨是 stacking context 的建立方式。`opacity` 小於 1 或 `transform` 這類附帶觸發，會把 stacking context 與一項視覺變化綁在一起；`isolation: isolate` 除了建立 context 之外別無其他效果，所以 MDN 才把 isolation 定義為「決定元素是否必須建立新 stacking context」的屬性。

## 深入探討

**`z-index: 0` 與 `z-index: auto` 的差別。** 對 `relative` 與 `absolute` 定位的元素，兩個值都在附錄 E 的同一步驟繪製：「所有 `z-index: auto` 或 `z-index: 0` 的定位後代，依樹狀順序」。分歧在 context 的建立：MDN 的觸發清單要求「非 `auto` 的 `z-index` 值」，因此 `z-index: 0` 會建立新的 stacking context，`auto` 不會。兩個外觀相同的版面，只要有後代自行設定 z-index，行為就可能立刻分道揚鑣。

**`z-index: auto` 依定位類型再細分。** CSS Positioned Layout Level 3 畫出更細的界線：在 `z-index: auto` 之下，「fixed 與 sticky 定位的盒子仍然形成 stacking context」，relative 與 absolute 的盒子只是繪製時視同形成一個 stacking context；它們的定位後代，以及原本會自成子 stacking context 的元素，實際上仍參與當前的 stacking context。sticky header 永遠把內容封進單一原子圖層；`z-index: auto` 的 relative 外層則讓定位子元素自由與外部交錯。

**top layer 本身無法成為操作對象。** 依 MDN 詞彙表：「top layer 是瀏覽器內部概念，無法直接從程式碼操作。你能用 CSS 與 JavaScript 選取放進 top layer 的元素，但無法選取 top layer 本身。」

**規範性規則的所在。** CSS 2 附錄 E 仍是繪製順序的規範性依據。Level 3 定位草案指引讀者參閱「CSS2 § 9.9 Layered presentation 與 Appendix E: Elaborate description of Stacking Contexts，了解 z-index、stacking context 與繪製順序的細節」。

## 逃生口：isolation、Portal 與 top layer

三種工具各在系統的不同層次突破堆疊問題。

**`isolation: isolate`** 向內作用。它在需要時建立 stacking context；MDN 之所以把它與 `mix-blend-mode`、`z-index` 並列，是因為隔離一組元素後，其混合模式就不會再與該組背後的內容合成：

```css
.card {
  isolation: isolate;
}
.card .badge {
  mix-blend-mode: multiply; /* blends against .card only, never the page behind it */
}
```

**框架的 portal** 向旁作用。Portal 模式把 DOM 節點搬到別處，以逃離祖先的 stacking context 與裁切；overlay 的標記最後落在樹的其他位置，那裡沒有任何限制性的祖先 context。

**Top layer** 向上作用，而且什麼都不必搬。提升進 top layer 的元素「不必再擔心 z-index 或 DOM 階層」（Chrome for Developers, 2022），dialog 或 popover 留在原本撰寫的樹中位置，卻渲染在整份文件之上。top-layer 元素與其 `::backdrop` 偽元素各自產生 stacking context：「放進 top layer 的元素會產生新的 stacking context，其對應的 ::backdrop 偽元素也是」（MDN 詞彙表，2025）。其中的內容在頁面之上的全新範疇裡堆疊，底下文件的 z-index 競爭永遠碰不到它們。

## 延伸閱讀

- [盒模型與排版模式](/zh-tw/CSS%20and%20Layout%20Systems/202)
- [CSS 包含性與 contain](/zh-tw/CSS%20and%20Layout%20Systems/209)
- [Backdrop Filter、Mix-Blend-Mode 與視覺效果](/zh-tw/CSS%20and%20Layout%20Systems/210)
- [Popover API 狀態與 Anchor Positioning 整合](/zh-tw/HTML%20and%20Semantic%20Markup/popover-states-and-anchor-positioning)

## 參考資料

- MDN contributors, "Stacking context," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context
- Bert Bos et al., "Appendix E. Elaborate description of Stacking Contexts," W3C CSS 2.1 Specification (2011). https://www.w3.org/TR/CSS2/zindex.html
- Elika J. Etemad, Tab Atkins Jr., "CSS Positioned Layout Module Level 3," W3C Working Draft (2025). https://www.w3.org/TR/css-position-3/
- MDN contributors, "Top layer," MDN Web Docs Glossary (2025). https://developer.mozilla.org/en-US/docs/Glossary/Top_layer
- Jhey Tompkins, "Meet the top layer: a solution to z-index:10000," Chrome for Developers Blog (2022). https://developer.chrome.com/blog/what-is-the-top-layer
- MDN contributors, "isolation," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation
