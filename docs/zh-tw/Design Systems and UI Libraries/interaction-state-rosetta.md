---
id: 918
title: "互動狀態對照表 — Focused、Activated、Selected、Pressed、Current"
state: draft
slug: interaction-state-rosetta
reviewed: hardened
reviewed_on: 2026-07-25
---

# [FEE-918] 互動狀態對照表 — Focused、Activated、Selected、Pressed、Current

:::info
「active」這個字在打造 UI 的各個領域中帶有四個彼此無關的含義：Material Design 用「activated」表示清單中當前項目的持久游標、CSS 的 `:active` 在指標按下時瞬時界定、ARIA 的 `aria-activedescendant` 回報複合元件內的虛擬焦點，以及口語上把 selected、pressed、focused 與 current-page 全部混為一談。本文透過一張對照表與五列詞彙集合（Focused、Activated、Selected、Pressed、Current），將設計師詞彙對應到 CSS 偽類與 ARIA 屬性。讓對應關係可讀的底層軸線是狀態基數（state cardinality），它區分一次只允許一個出現的概念與允許多個的概念。同一條軸線也說明了為何「activated」與 `:focus` 不能合併為同一個工程概念，即使設計師經常對兩者都使用「active」這個字。
:::

## 背景

這五個狀態詞彙有三段彼此獨立、從未被調和的歷史。動態 CSS 偽類 `:hover` 與 `:focus` 最早定義於 CSS2（W3C Recommendation，1998 年 5 月），`:active` 則可追溯至更早的 CSS1（W3C Recommendation，1996 年 12 月）；三者的基本行為原封不動地延續進穩定版的 CSS 2.1 修訂版（W3C Recommendation，2011 年），而它們的設計時間都早於「互動狀態」成為設計系統概念之前。WAI-ARIA 1.0（2014）為輔助技術引入了語意狀態屬性：`aria-selected`、`aria-pressed`、`aria-activedescendant`。WAI-ARIA 1.1（W3C Recommendation，2017 年 12 月 14 日）之後補上 `aria-current`，補齊了本對照表所依賴的屬性集合。同樣於 2014 年推出的 Material Design，引入「activated」作為清單中當前項目的持久視覺狀態，與「selected」和「pressed」有所區別。對照表中 ARIA 那半邊目前的權威參考是 WAI-ARIA 1.2，於 2023 年 6 月 6 日成為 W3C Recommendation。DOM 焦點的單一性質則由 HTML Living Standard 規範定義，`document.activeElement` 是其 JavaScript 存取入口。

## 視覺對比

| 設計師術語 | Material 名稱 | CSS 偽類 | ARIA 屬性 | 基數 | 使用時機 |
|---|---|---|---|---|---|
| Focused | Focused | `:focus` / `:focus-visible` | 無直接對應（DOM focus 為事實來源）；虛擬焦點使用 `aria-activedescendant` | 每個瀏覽情境嚴格單一 | 鍵盤或程式化的焦點目標 |
| Activated | Activated | 無直接偽類；透過 `[aria-current]` 或 `[aria-selected]` 屬性選擇器或狀態 class 來鎖定 | 最接近的語意：`aria-current`、`aria-activedescendant` | 在單一邏輯集合內單一；跨獨立集合可多重 | 失焦後仍存續的當前項目指示器 |
| Selected | Selected | 無偽類；透過 `[aria-selected="true"]` 鎖定 | `aria-selected`（在 `gridcell`、`option`、`row`、`tab` 上有效，並繼承至 `columnheader`、`rowheader`、`treeitem`） | 在 `aria-multiselectable="true"` 的多選中可多重；單選時為單一 | option 風格元件中的「被選中以執行操作」 |
| Pressed | Pressed（toggle on） | `:active` 為瞬時界定，並非正確對應；透過 `[aria-pressed="true"]` 鎖定 | `aria-pressed`（三態切換） | 每個切換按鈕單一；工具列中跨按鈕互相獨立 | 切換按鈕的開啟狀態 |
| Current | （無 Material 等價詞） | 無偽類；透過 `[aria-current]` 鎖定 | `aria-current`（值：`page`、`step`、`location`、`date`、`time`、`true`） | 每個邏輯集合嚴格單一 | 當前頁面、當前步驟、當前位置的指示器 |

## 範例

### 範例 A — 側邊欄導覽項目

側邊欄連結至數個應用區域，其中一個代表使用者所在的頁面。當前頁面語意屬於 `aria-current="page"`，而視覺處理則分散到 `:focus-visible`、`:hover` 與 `:active`。

```html
<nav aria-label="Primary">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/settings" aria-current="page">Settings</a></li>
  </ul>
</nav>
```

```css
nav a {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  color: inherit;
  text-decoration: none;
}

/* 持久的當前頁面狀態 — 失焦後仍存續，不依賴指標。 */
nav a[aria-current="page"] {
  background: var(--surface-current);
  font-weight: 600;
}

/* 僅在使用者代理判斷顯示焦點環有幫助時，才呈現鍵盤焦點環。 */
nav a:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Hover 色調 — 指標位於連結上方時瞬時生效。 */
nav a:hover {
  background: var(--surface-hover);
}

/* :active — 僅在指標按下時保持，用於觸覺式按壓回饋，
   絕不用於持久的當前頁面指示器。 */
nav a:active {
  transform: translateY(1px);
}
```

在正確實作下，螢幕閱讀器會將當前連結朗讀為：

```
Settings, current page, link
```

常見的錯誤實作是把 `aria-selected="true"` 加在當前連結上。同樣的朗讀就變成：

```
Settings, selected, link
```

該朗讀在語意上有誤，因為該連結指示的是當前頁面，而「selected」隱含的是被選中以執行操作的語意。MDN 文件明確指出 `aria-current` 與 `aria-selected` 在 `gridcell`、`option`、`row`、`tab` 等角色上並不可互換，反之亦然：`aria-selected` 在導覽中也不能替代 `aria-current`。

### 範例 B — 多選檔案清單

檔案清單允許同時選中多個項目，並使用獨立於選取集合的鍵盤游標。擁有此清單的 `listbox` 帶有 `aria-multiselectable="true"` 與 DOM focus，而 `aria-activedescendant` 則指向當前作為鍵盤游標的 option。

```html
<ul
  id="files"
  role="listbox"
  aria-label="Files"
  aria-multiselectable="true"
  aria-activedescendant="file-3"
  tabindex="0"
>
  <li id="file-1" role="option" aria-selected="true">budget.xlsx</li>
  <li id="file-2" role="option" aria-selected="false">notes.md</li>
  <li id="file-3" role="option" aria-selected="true">design.fig</li>
  <li id="file-4" role="option" aria-selected="false">README.txt</li>
</ul>
```

```css
#files {
  list-style: none;
  margin: 0;
  padding: 0;
}

#files:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* 允許多重：任意數量的 option 都可同時帶有 aria-selected="true"。 */
#files [role="option"][aria-selected="true"] {
  background: var(--surface-selected);
  font-weight: 600;
}

/* 鍵盤游標是 id 與容器 aria-activedescendant 相符的後代元素。
   針對 option 本身的 :focus 永遠不會命中 — DOM focus 落在 listbox 容器上。 */
#files[aria-activedescendant="file-1"] #file-1,
#files[aria-activedescendant="file-2"] #file-2,
#files[aria-activedescendant="file-3"] #file-3,
#files[aria-activedescendant="file-4"] #file-4 {
  box-shadow: inset 0 0 0 2px var(--cursor-ring);
}
```

```js
const listbox = document.getElementById("files");
const options = Array.from(listbox.querySelectorAll('[role="option"]'));

function activeIndex() {
  const id = listbox.getAttribute("aria-activedescendant");
  return options.findIndex((el) => el.id === id);
}

function moveCursor(delta) {
  const next = Math.max(0, Math.min(options.length - 1, activeIndex() + delta));
  listbox.setAttribute("aria-activedescendant", options[next].id);
}

function toggleSelection() {
  const current = options[activeIndex()];
  const next = current.getAttribute("aria-selected") === "true" ? "false" : "true";
  current.setAttribute("aria-selected", next);
}

listbox.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowDown":
      moveCursor(1);
      event.preventDefault();
      break;
    case "ArrowUp":
      moveCursor(-1);
      event.preventDefault();
      break;
    case " ":
      toggleSelection();
      event.preventDefault();
      break;
  }
});
```

方向鍵移動 active descendant 而不觸動選取集合；空白鍵切換 active descendant 當前所指 option 的選取狀態。ARIA Authoring Practices Guide 指出 listbox 角色支援 `aria-activedescendant` 作為在 option 元素間移動 DOM focus 的替代方案，而多選可重排範例則說明 focus 與 selection 是刻意解耦的，使用者得以在 option 間移動 focus 而不影響哪些 option 帶有選取屬性。

## 最佳實踐

- **MUST** 使用 `aria-current` 在導覽集合中標記當前頁面、步驟或位置，且 **MUST NOT** 為此目的以 `aria-selected` 替代。MDN 文件明確警告勿在 `gridcell`、`option`、`row`、`tab` 角色中以 `aria-current` 替代 `aria-selected`，反向警告同樣適用於導覽情境。螢幕閱讀器會以不同措辭朗讀這兩種狀態。
- **MUST NOT** 以 CSS `:active` 偽類表達持久的「activated」或「pressed」狀態。`:active` 代表主滑鼠按鍵按下期間的啟動狀態，因此使用者一鬆開手指它就會釋放，無法表達失焦後仍存續的切換狀態。
- **MUST** 在多個子項目可能同時帶有 `aria-selected="true"` 時，於擁有它的角色（grid、listbox、tablist）上設定 `aria-multiselectable="true"`。僅在子項目上加 `aria-selected` 而省略擁有者屬性，會讓輔助技術失去「允許多重選取」的提示。
- **SHOULD** 鍵盤焦點環優先使用 `:focus-visible` 而非 `:focus`。`:focus` 永遠命中焦點元素，而 `:focus-visible` 僅在使用者代理判斷使用者需要知道焦點位置時才命中，這可抑制滑鼠點擊後不必要的焦點環。
- **SHOULD** 以語意意圖命名元件 prop（`isCurrent`、`isSelected`、`isPressed`），取代涵蓋一切的 `isActive`。這屬於專案編輯指引：沒有任何規範強制此命名，但模糊的 prop 名稱會把設計師與工程師之間的詞彙落差洩漏進程式碼庫，且 linter 無法捕捉錯誤的含義。
- **MAY** 在同一元素上疊加多種狀態（focused + selected + current），前提是設計系統指定了確定性的視覺優先順序，避免兩個衝突的狀態視覺在不同頁面上產生不一致的渲染。

## 設計思維

Material 的「activated」沒有 ARIA 等價詞，因為這兩套詞彙是為正交的受眾打造的。Material 描述視覺狀態給視力正常的使用者：當項目成為清單中的持久游標時，像素渲染要做什麼。ARIA 描述語意狀態給輔助技術：平台告訴螢幕閱讀器某元素在複合元件中扮演的角色。「activated」與任何單一 ARIA 屬性的重疊只是部分：導覽中的持久當前項目指示器對應 `aria-current`，option 元件中的持久選取對應 `aria-selected`，而鍵盤游標的意義則對應 `aria-activedescendant`。沒有任何單一 ARIA 屬性能複製 Material 的「activated」，因為 Material 並無需要為視力正常的受眾消歧這三種子情況。

把元件 prop 命名為 `isActive` 在每個使用端都會耗費閱讀時間。叫做 `isCurrent` 的 prop 大約一秒就能告訴讀者該元件對應當前頁面情況；`isActive` 則必須打開實作才能發現該 prop 控制的是五種狀態中的哪一個，以及元件最終會發出哪個 ARIA 屬性。這個成本會累積，因為這種歧義對型別檢查器是不可見的。無論 prop 想驅動的底層狀態為何，`isActive: boolean` 都能通過審查。

## 深入探討

狀態疊加在真實元件中是常態：多選 grid 中的某一列可能同時處於 hover、鍵盤游標（active descendant）以及 `aria-selected="true"`。這些維度大多彼此獨立。focused 不蘊含 selected，selected 也不蘊含 current。當兩個狀態視覺發生衝突時，定義視覺優先順序的責任由設計系統承擔，因為瀏覽器會繪製每一條命中規則。

ARIA 陷阱在於 `aria-activedescendant`。MDN 文件明確指出該屬性「負責向輔助技術提供哪個元素具有焦點的資訊，但實際上並不建立焦點」。W3C WAI-ARIA 1.2 規範給出了底層的使用者代理契約：在實作 `aria-activedescendant` 時，使用者代理會把 DOM focus 保留在容器元素上，或保留在控制該容器元素的 input 元素上，同時把桌面焦點事件與狀態傳達給輔助技術，彷彿 `aria-activedescendant` 所引用的元素具有焦點。在此模式下，針對個別 option 的 `:focus` CSS 規則永遠不會命中，因為 DOM focus 始終落在複合容器上，使用者卻把焦點感知為位於 option 上。option 上的視覺游標必須透過將容器 `aria-activedescendant` 值與 option `id` 配對的屬性選擇器鏈來設定樣式，或透過 `:has()`，絕不可透過 `:focus`。混用這兩種模式（在 option 間移動 DOM focus 同時設定 `aria-activedescendant`）是無效的：ARIA Authoring Practices Guide 將 `aria-activedescendant` 與 DOM-focus-moving（roving tabindex）視為單一複合元件內的兩個替代方案，並非可組合的策略。

## 狀態基數規則

三個分類化解了詞彙衝突。

### 第 1 類 — 嚴格單一

- DOM `:focus` 在每個瀏覽情境中為單一。HTML Living Standard 指定每個 Document 中只有一個可聚焦區域作為該文件的 focused area。
- `aria-current` 在每個邏輯集合中為單一。MDN 指引指示作者僅將集合中的一個元素以 `aria-current` 標記為當前。
- `document.activeElement` 是單一 DOM focus 狀態的 JavaScript 存取入口，回傳那個接收鍵盤事件的元素。

意涵：設計師要求「每一個選中列都顯示 focus」時，這在工程層次是錯誤的請求。他們想要的視覺是每一列上的環或填色，對應到允許多重的 `aria-selected`，而非字面上對每一列的 focus。

### 第 2 類 — 允許多重

- 當擁有者角色帶有 `aria-multiselectable="true"` 時，多個子元素可同時帶有 `aria-selected="true"`，這就是規範定義的多選 listbox / grid / tablist 契約。
- 在多選 listbox 中，focus 與 selection 是刻意解耦的，因此使用者可在 option 間移動 active descendant 而不影響哪些 option 帶有 `aria-selected="true"`。
- `aria-pressed` 在每個切換按鈕上互相獨立，因此工具列可同時帶有多個處於按下狀態的切換按鈕而沒有任何矛盾。

意涵：設計師「同時有多個項目處於 activated」的設計稿，對應到允許多重的 `aria-selected`（並在擁有者上加 `aria-multiselectable`）時可以實作，而對應到 `:focus` 則無法實作，因為 `:focus` 嚴格單一。

### 第 3 類 — 瞬時界定

- `:active` 代表使用者啟動元素的狀態，從主滑鼠按鍵按下開始，到放開為止，因此無法在手勢結束後持續。
- `:focus-within` 在元素本身或其任一後代具有焦點時命中，焦點離開該子樹的瞬間即釋放。
- `:hover` 在指標位於元素上方時命中，指標離開的瞬間即釋放。

意涵：「pressed」設計稿幾乎總是描述持久的切換開啟狀態（`aria-pressed="true"`）；瞬時界定的 `:active` 在語意上屬於不同範疇。基數的判斷線索是「使用者是否預期放開滑鼠後仍看到此狀態？」若是，該狀態屬於第 2 類（允許多重），需要 ARIA 屬性，而非 CSS 偽類。

「Activated」與 `:focus` 不能是同一個工程概念，因為它們位於不同的基數類別。「Activated」在清單或 grid 中跨項目允許多重，而 `:focus` 在每個瀏覽情境中嚴格單一。任何把兩者合併的詞彙都會喪失多項目情況或 DOM-focus 單一不變量的其中之一。對照表能成立，是因為每一列都選定一個基數類別並維持其中。

### 快速狀態對照

還有一些不在五列詞彙表中的相關狀態，遵循相同的基數邏輯，值得放在手邊參考。

| 狀態 | CSS | ARIA | 基數 | 備註 |
|---|---|---|---|---|
| Hover | `:hover` | 無 | 瞬時界定 | 僅限指標；指標離開即釋放 |
| Disabled | `:disabled`、`[aria-disabled]` | `aria-disabled` | 每個元素 | `:disabled` 僅命中表單控制項；`aria-disabled` 可用於任何角色 |
| Checked | `:checked` | `aria-checked` | 每個元素 | `:checked` 僅命中表單控制項 |
| Target | `:target` | 無 | 嚴格單一 | 由 URL 片段驅動；每份文件僅一個元素命中 |
| Focus-within | `:focus-within` | 無 | 由後代焦點蘊含 | 命中元素本身或其任一後代，包含跨 shadow DOM |
| Expanded | `[aria-expanded]` | `aria-expanded` | 每個元素 | 用於 disclosure 元件、combobox 與樹狀分支 |

## 延伸閱讀

- [Keyboard Navigation & Focus Management](/zh-tw/Accessibility/1002)
- [Accessible Component Patterns](/zh-tw/Accessibility/1007)
- [React Aria Components — Adobe's Contexts & Slots Composition Model](/zh-tw/Design Systems and UI Libraries/react-aria-components)
- [Framework-Agnostic State Machines — Zag.js and Ark UI](/zh-tw/Design Systems and UI Libraries/zag-and-ark-ui)

## 參考資料

- W3C, "Accessible Rich Internet Applications (WAI-ARIA) 1.2," W3C Recommendation (2023). https://www.w3.org/TR/wai-aria-1.2/
- W3C, "WAI-ARIA 1.2 — aria-activedescendant," W3C Recommendation (2023). https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant
- W3C WAI, "Listbox Pattern," ARIA Authoring Practices Guide (2024). https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
- W3C WAI, "Example Listboxes with Rearrangeable Options," ARIA Authoring Practices Guide (2024). https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
- MDN Contributors, "ARIA: aria-current attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- MDN Contributors, "ARIA: aria-selected attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-selected
- MDN Contributors, "ARIA: aria-pressed attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed
- MDN Contributors, "ARIA: aria-activedescendant attribute," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant
- MDN Contributors, ":focus-visible," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- MDN Contributors, ":focus-within," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within
- MDN Contributors, ":active," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/CSS/:active
- MDN Contributors, "Document: activeElement property," MDN Web Docs (2025). https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
- WHATWG, "HTML Living Standard — Focus," WHATWG (2026). https://html.spec.whatwg.org/multipage/interaction.html#focus
- Adobe, "Selection," React Aria documentation (2025). https://react-aria.adobe.com/selection
- Adobe, "Styling," React Aria documentation (2025). https://react-aria.adobe.com/styling
- Google, "States," Material Design 2 (describes "activated" as a more permanent highlighted-destination state, distinct from the user-choice "selected" state). https://m2.material.io/go/design-states
- Google, "Material Design 3 — Interaction states," Material Design (named-vocabulary reference for "activated"; SPA-rendered, no verbatim quote extracted). https://m3.material.io/foundations/interaction/states/applying-states
