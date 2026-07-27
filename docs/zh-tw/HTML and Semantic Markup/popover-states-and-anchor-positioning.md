---
id: 111
title: Popover API 狀態與 Anchor Positioning 整合
state: draft
slug: popover-states-and-anchor-positioning
category: HTML and Semantic Markup
level: senior
reviewed: tone
reviewed_on: 2026-07-27
---

# [FEE-111] Popover API 狀態與 Anchor Positioning 整合

:::info
Popover API 提供三種宣告式狀態（`auto`、`manual`、`hint`），用於決定輕量關閉 (light-dismiss) 行為、互斥規則，以及 Tab 順序語意。顯示中的 popover 會被提升至 top layer，繪製於其他所有堆疊脈絡之上。隨著 CSS anchor positioning 在 2026 年進入 Baseline，popover 可透過隱式錨定，或透過明確的 `anchor-name` / `position-anchor` 宣告與觸發器 (invoker) 對齊，並在視窗裁切偏好位置時優雅退回。本文涵蓋狀態語意、焦點與關閉演算法，以及取代 JavaScript 佈局運算的 anchor positioning 基元。
:::

## 背景

HTML `popover` 全域屬性接受三種狀態值：`auto`、`hint`、`manual`（Claim 1）。每種狀態改變 user agent 在 popover 顯示時的行為，以及它與其他可見 popover 互動的方式：

- **`popover="auto"`** 是預設的選單/對話框行為。popover 在外部點擊或按 Esc 時輕量關閉 (light-dismiss)，顯示新的 auto popover 會關閉任何先前可見且無關聯的 auto popover。除非巢狀嵌套，否則同時僅會顯示一個 auto popover（Claim 2）。
- **`popover="manual"`** 完全不參與輕量關閉 (light-dismiss)。多個獨立的 manual popover 可同時顯示，且每個僅透過宣告式觸發器 (invoker) 或 `showPopover()` / `hidePopover()` / `togglePopover()` 方法顯示或隱藏（Claim 3）。
- **`popover="hint"`** 在外部互動時輕量關閉 (light-dismiss) 並關閉其他可見的 hint，但不影響任何開啟中的 auto popover。這讓 `hint` 適合覆蓋於開啟選單之上的 hover 或 focus tooltip（Claim 4）。

三種狀態共享一項渲染特性：一旦顯示，popover 即被提升至 top layer。瀏覽器移除 `display: none`，重排堆疊順序使 popover 繪製於頁面上其他所有脈絡之上，並管理 backdrop 偽元素（Claim 6）。top layer 提升正是讓 popover 擺脫 `overflow: hidden` 祖先與 `transform` 建立的堆疊脈絡的機制，無需手動 portal 處理。

## 視覺對比

| 狀態 | 輕量關閉 (light-dismiss)？ | 關閉其他 `auto`？ | 關閉其他 `hint`？ | 多個同時可見？ | Baseline |
| --- | --- | --- | --- | --- | --- |
| `auto` | 是（外部點擊、Esc） | 是（除非巢狀嵌套） | 是 | 一次一個 | Baseline 2025 |
| `manual` | 否 | 否 | 否 | 多個 | Baseline 2025 |
| `hint` | 是（外部點擊、Esc） | 否 | 是 | 一次一個 | 尚未進入 Baseline（Chrome/Edge 133+、Firefox 149+、Opera 118+；Safari 至 26.5 仍待支援） |

前兩列依據 Claim 2 與 Claim 3；`hint` 列依據 Claim 4。核心 API 的 Baseline 狀態來自 Claim 15；`hint` 特定支援矩陣來自 Claim 16。

## 範例

一個觸發按鈕開啟 auto popover，其位置透過明確的 CSS 錨定綁定至按鈕。`position-try-fallbacks` 讓 popover 在視窗裁切其偏好邊緣時翻轉。

```html
<button
  popovertarget="user-menu"
  popovertargetaction="toggle"
  id="user-menu-trigger"
>
  Account
</button>

<div id="user-menu" popover="auto">
  <ul role="menu">
    <li role="menuitem"><a href="/profile">Profile</a></li>
    <li role="menuitem"><a href="/settings">Settings</a></li>
    <li role="menuitem"><a href="/logout">Sign out</a></li>
  </ul>
</div>
```

觸發器 (invoker) 透過 `popovertarget` 以 id 連接至 popover；`popovertargetaction` 接受 `toggle`（預設）、`show` 或 `hide`（Claim 5）。由於 popover 處於 `auto` 狀態，點擊外部或按 Esc 會關閉它，而顯示第二個 auto popover 會關閉這個。

```css
#user-menu-trigger {
  anchor-name: --user-menu-anchor;
}

#user-menu {
  position: absolute;
  position-anchor: --user-menu-anchor;
  top: anchor(bottom);
  left: anchor(left);
  margin-block-start: 0.5rem;

  position-try-fallbacks:
    flip-block,
    flip-inline,
    flip-block flip-inline;
}
```

觸發器發布錨名；popover 以 `position-anchor` 取用，並透過 `anchor()` 函式讀取邊緣（Claim 12）。若偏好位置溢出視窗，`position-try-fallbacks` 依序走訪每個選項並採用第一個合適者；若無一合適，則退回原始位置（Claim 13）。

若需命令式控制，`togglePopover()` 接受一組選項物件，其 `source` 成員識別觸發器 (invoker)，該元素會被註冊至鍵盤 Tab 順序，並建立隱式錨定參考（Claim 10）：

```js
const menu = document.getElementById('user-menu');
const trigger = document.getElementById('user-menu-trigger');

menu.addEventListener('beforetoggle', (event) => {
  console.log(event.oldState, '→', event.newState); // 'closed' → 'open'
});

trigger.addEventListener('click', () => {
  menu.togglePopover({ source: trigger });
});
```

`beforetoggle` 與 `toggle` 事件暴露 `oldState` 與 `newState`，各為 `'open'` 或 `'closed'`（Claim 9）。

## 最佳實踐

- **MUST** 讓 user agent 管理 popover 開啟/關閉時的焦點。顯示 popover 會將其內容插入鍵盤 Tab 順序，Esc 關閉時焦點返回觸發器 (invoker)（Claim 8）。自訂焦點陷阱會與此行為衝突並破壞 Esc 處理。
- **MUST** 在依賴 `popover="hint"` 前進行功能偵測。它在 Chromium 133+、Firefox 149+ 與 Opera 118+ 出貨，但在 Safari 與 Safari iOS 至 26.5 仍未實作（Claim 16）。核心 API（`auto`、`manual`、`popovertarget`、DOM 方法）已於 Baseline 2025 達成，在所有常青引擎皆可運作（Claim 15）。
- **SHOULD** 依互動模型挑選狀態。選單、對話框與揭露介面僅需一個同時可見時使用 `auto`。持續浮動面板（聊天抽屜、檢查器 widget）須承受外部點擊時使用 `manual`。覆蓋於開啟選單之上的 tooltip 使用 `hint`，其中外部互動時的輕量關閉 (light-dismiss) 可接受，但 auto popover 須保持開啟（Claim 4）。
- **SHOULD** 為 `hint` 無法使用之處提供替代方案。在功能測試後退回 `popover="auto"`，或在不需要分層互動時以 `role="tooltip"` 內聯渲染 tooltip 內容（Claim 16）。
- **SHOULD** 優先採用宣告式呼叫（`popovertarget` + `popovertargetaction`）而非腳本式 `togglePopover()` 呼叫。宣告式路徑無需 JavaScript，參與表單語意，並於腳本載入失敗時保持可存取（Claim 5）。
- **MAY** 當觸發器 (invoker) 非直接祖先或 `popovertarget` 連接不切實際時，呼叫 `togglePopover({ source })`。傳遞 `source` 可維持鍵盤焦點順序正確，並建立隱式錨定關聯（Claim 10）。

## 深入探討

### 輕量關閉 (light-dismiss) 演算法

HTML 規範將 light dismiss 定義為：當使用者點擊一個 `popover` 屬性處於 Auto 狀態且開啟中的 popover 之外時，將其關閉（Claim 7）。同一演算法亦適用於 Hint 狀態，額外規則為 hint 不關閉開啟中的 auto popover（Claim 4）。觸發器 (invoker) 本身的點擊不屬於「外部」互動；user agent 的命中測試透過 `popovertarget` 或 `source` 選項識別觸發器與 popover 的關聯。

### 巢狀 popover

當一個 popover 在 DOM 中是另一個的後代、透過 `popovertarget` 連結，或從另一個內部開啟時，兩個 popover 即為巢狀關係。巢狀 popover 規則保留祖先：開啟後代 popover 不關閉其父代，而輕量關閉 (light-dismiss) 後代不傳播至祖先（Claim 7）。因此從父選單開啟的子選單會保持父選單可見，直到使用者關閉整棵樹。

### 明確與隱式錨定綁定

透過 CSS anchor positioning 將 popover 錨定至另一元素有兩種方式：

- **隱式**：每當按鈕透過 `popovertarget` 或 `togglePopover({ source })` 與 popover 關聯時即建立。popover 隨後可透過 `anchor()` 讀取觸發器 (invoker) 邊緣，無需任何 `anchor-name` / `position-anchor` 宣告（Claim 11）。
- **明確**：在錨元素上宣告 `anchor-name: --foo`，在被定位元素上宣告 `position-anchor: --foo`；兩個屬性皆接受 `<dashed-ident>` 值（Claim 12）。明確綁定適用於任意元素配對，非僅觸發器-popover 配對，且支援同時多個錨點。

當 popover 僅有一個觸發器且不需其他錨點時選擇隱式綁定。當 popover 參考多個錨點、視覺錨點不同於啟動控制項，或 popover 在無觸發器情況下顯示（例如來自全域鍵盤快捷鍵）時選擇明確綁定。

## Anchor Positioning 整合

CSS anchor positioning 模組將 tooltip 函式庫長期承擔的責任提升為瀏覽器基元：追蹤參考元素的邊界框並將浮動元素放置於其旁。對 popover 工作而言有三項要點。

**透過觸發器的隱式錨定。** Popover API 在控制項透過 `popovertarget` 或 `togglePopover()` 的 `source` 選項與 popover 關聯時即已建立錨定參考（Claim 11）。常見的「按鈕於下方開啟選單」佈局無需 `anchor-name` 宣告：popover 的 CSS 直接以 `anchor(bottom)`、`anchor(center)` 及其他 `anchor()` 關鍵字讀取觸發器 (invoker) 邊緣。

**明確錨定綁定。** 當錨元素異於觸發器，或一個 popover 錨定至多個錨點時，於錨元素宣告 `anchor-name: --my-anchor`，於被定位元素宣告 `position-anchor: --my-anchor`。兩個屬性皆接受 `<dashed-ident>` 值，且 `anchor-name` 可持有逗號分隔清單，使單一元素服務多個被定位消費者（Claim 12）。

**溢出回退。** `position-try-fallbacks` 接受有序的替代位置清單（如 `flip-block` 與 `flip-inline` 等關鍵字，或具名的 `@position-try` 規則），瀏覽器挑選第一個能讓 popover 留在包含區塊內的選項。若無選項合適，則退回預設位置（Claim 13）。這取代了 tooltip 函式庫歷來以 JavaScript 搭配 `getBoundingClientRect()` 及 resize/scroll 觀察器實作的翻轉重定位邏輯。

**Baseline 時間線。** `anchor-name`、`position-anchor` 與 `position-try-fallbacks` 已達 Baseline 2026，自 2026 年 1 月新增可用，並運作於最新裝置與瀏覽器版本（Claim 14）。Popover API 本身已於一年前達 Baseline 2025（Claim 15），因此採用 Baseline 2025 的團隊今日即可出貨 popover，並在支援矩陣跟上後再疊加 anchor positioning，期間退回靜態位置。

## 延伸閱讀

- [媒體、嵌入與互動元素](/zh-tw/HTML%20and%20Semantic%20Markup/104)
- [HTML API 與漸進增強](/zh-tw/HTML%20and%20Semantic%20Markup/106)

## 參考資料

- MDN, "Popover API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- MDN, "Using the Popover API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- MDN, "popover (global attribute)," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- MDN, "HTMLElement: togglePopover() method," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/togglePopover
- WHATWG, "HTML Standard — Popover," whatwg.org. https://html.spec.whatwg.org/multipage/popover.html
- MDN, "Using CSS anchor positioning," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using
- MDN, "anchor-name," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name
- MDN, "position-anchor," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/position-anchor
- MDN, "position-try-fallbacks," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks
