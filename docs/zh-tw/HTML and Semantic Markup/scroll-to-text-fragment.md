---
id: 109
title: 滾動至文字片段（URL 文字指示）
state: draft
slug: scroll-to-text-fragment
category: HTML and Semantic Markup
level: mid
---

# [FEE-109] Scroll-to-Text Fragment (URL Text Directives)

:::info
文字片段是一段附加於 URL 之後的字串，會告訴瀏覽器滾動至頁面上某一段文字並加上高亮，目標頁面本身無須任何標記。此功能以 WICG 規格發布，已在 Chrome、Firefox 與 Safari 落地，讓作者能深入連結到自己無法控制的文章、規格書與參考資料。本篇涵蓋指示語法、撰寫限制、`::target-text` 擬元素，以及目前仍限制此功能的無障礙落差。
:::

## 背景

傳統的 URL 片段（`#section-id`）只能指向文件作者在 HTML 中放置的 `id`。滾動至文字片段規格引入一個新的 URL 組件，稱為 **fragment directive（片段指示）**，以 `:~:` 作為分隔。MDN 直接記錄了這項約定：「`:~:` 又稱為 _the fragment directive_，這段字元序列告訴瀏覽器，接下來是一個或多個使用者代理指令，這些指令會在載入過程中從 URL 被剝除，使作者腳本無法直接與其互動。」

目前唯一定義的指示是 `text=`。其語法為 `#:~:text=[prefix-,]textStart[,textEnd][,-suffix]`，其中 `textStart` 為必填，而 `textEnd`、`prefix-`、`-suffix` 為選填的消歧義欄位，當起始字串本身不夠唯一時使用。由於指示位於 `:~:` 之後，瀏覽器會在腳本執行前將其從 `location.hash` 移除，使這個機制避開頁面 JavaScript。

目前沒有跨瀏覽器的 JavaScript API 可產生文字片段。作者仰賴 Chrome、Edge、Firefox 與 Safari 上的「Link to Text Fragment」瀏覽器擴充功能，或第一方 UI：Chrome 右鍵的「Copy link to highlight」，以及 Safari 18.2 右鍵選單中的「Copy Link with Highlight」。

## 視覺對比

| 形式 | URL 片段 | 使用時機 |
| --- | --- | --- |
| 僅 `textStart` | `#:~:text=quick%20brown%20fox` | 該段文字在文件中唯一。 |
| `textStart,textEnd` | `#:~:text=quick%20brown,lazy%20dog` | 高亮一段範圍；只需指名起點與終點。 |
| `prefix-,textStart` | `#:~:text=the-,quick%20brown%20fox` | 相同詞句在文件中出現多次；以 `prefix-` 消歧義。 |
| `textStart,-suffix` | `#:~:text=fox,-jumps` | 依詞句後方內容消歧義。 |
| 完整邊界 | `#:~:text=the-,quick%20brown,lazy%20dog,-jumps` | 範圍匹配且兩端都需要消歧義。 |
| 多重指示 | `#:~:text=first&text=second` | 在單次導覽中高亮多段不連續文字。 |

## 範例

指向 MDN 文字片段頁面、目標詞句為「fragment directive」的連結：

```
https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments#:~:text=fragment%20directive
```

使用 `textStart,textEnd` 的邊界範圍：

```
https://example.com/article#:~:text=Once%20upon,happily%20ever%20after
```

當起始字串出現多次時，以 `prefix-` 與 `-suffix` 消歧義：

```
https://example.com/docs#:~:text=install-,the%20CLI,-globally
```

帶有兩個指示、於同一次導覽中高亮兩段文字的 URL：

```
https://example.com/post#:~:text=first%20highlight&text=second%20highlight
```

以 `::target-text` 重新設計高亮樣式。使用者代理預設為 `:root::target-text { color: MarkText; background: Mark; }`；作者可以覆寫：

```css
::target-text {
  background-color: #fff3a3;
  color: #111;
}
```

`::target-text` 是 highlight 擬元素，因此僅支援一小組不影響排版的屬性（色彩、文字裝飾、文字陰影）。會導致文件重排的屬性會被拒絕。

## 最佳實踐

- **MUST** 對每個參數值進行百分比編碼，並跳脫 `-`、`&`、`,`，讓瀏覽器不會將其解讀為指示語法。web.dev 指出：「所有參數值都需要進行百分比編碼。對連字號 `-`、&符號 `&` 與逗號 `,` 尤其重要。」
- **MUST** 在 `noopener` 環境下開啟攜帶文字片段的跨來源連結。依 MDN：「你應該在 `noopener` 環境下開啟連結——你需要在 `<a>` 元素上加 `rel="noopener"`，並在使用此功能時於 `window.open()` 呼叫加上 `noopener`。」
- **MUST** 將此指示視為盡力而為（best-effort）。當字串匹配失敗或瀏覽器不支援文字片段時，「整個文字片段會被忽略，連結會指向文件頂端」，因此連結在沒有滾動效果時也 MUST 仍具可用性。
- **SHOULD** 在露出「複製高亮連結」按鈕之前，先以 `document.fragmentDirective` 進行特性偵測。Firefox 131 釋出說明確認了這個介面：「開發者現在也可以透過 `Document.fragmentDirective` 屬性（`FragmentDirective` 介面的實例）是否存在，來對文字片段支援進行特性偵測。」
- **SHOULD** 以文件頂端或穩定的 `id` 錨點作為主要目標，讓 `:~:text=` 負責微調位置。這能讓連結在舊版 Safari、iframe 與程式化導覽中維持可用。
- **MAY** 當同時高亮多段相關文字比單一錨點位置更重要時，以 `&` 串接多個 `text=` 指示。
- **MUST NOT** 在 iframe 或程式化導覽中依賴此指示。web.dev：「文字片段指示只在由使用者互動觸發的完整（非同頁）導覽中生效。……文字片段指示只套用在主框架上。」

## 設計思維

`:~:` 分隔符號的選擇，是為了讓 fragment directive 能與傳統 `#anchor` 片段共存，也能容納 WICG 未來可能加入的其他指示。規格對此留白寫得直接：「本規格只引入文字指示，但未來可能加入其他指示。」這個選擇有兩個值得指出的後果。

第一，指示在作者腳本看到它之前，就已從 `location.hash` 被剝除。這樣的隔離避免腳本覆寫或觀察使用者代理被指示執行的動作，這也是為何對跨來源導覽而言，`noopener` 是硬性要求而非建議。

第二，由於語法為未來指示預留了空間，作者應將 `:~:text=...` 視為唯一穩定形式。自行解析片段的客製工具必須跳過 directive 區塊。

## 深入探討

**匹配語義。** 匹配不分大小寫。`textStart`、`textEnd`、`prefix-`、`-suffix` 每一項都必須位於同一個區塊級元素內，但整段 `textStart,textEnd` 範圍可以跨越區塊邊界。這條規則說明了為何從渲染後的段落複製出的指示，在目標頁面以 `<li>` 或 `<p>` 重新包裝內容之後會匹配失敗；起始字串已經不再容納於單一區塊。

**無障礙落差。** WICG 議題追蹤記錄得直白：「在無障礙層面，瀏覽器至少需要通知無障礙 API 頁面滾動到的節點。然而此功能有顯著的無障礙挑戰。輔助科技使用者無從感知視覺上高亮的確切文字——他們只知道文字起始所在的節點。」螢幕閱讀器使用者因此只能得知頁面滾動到某個容器，卻無法得知該容器中哪一段文字被高亮。滾動後的焦點處理在各引擎未標準化，使鍵盤使用者會依瀏覽器不同而落在不同位置。

## 瀏覽器支援對照

| 引擎 | 首次發布 | 消費端支援 | 內建作者 UI | `::target-text` 樣式 |
| --- | --- | --- | --- | --- |
| Chromium（Chrome、Edge） | Chrome 80，2020 年 2 月 | 是 | 右鍵「Copy link to highlight」 | 是 |
| Gecko（Firefox） | Firefox 131，2024 年 10 月 1 日 | 是；`document.fragmentDirective` 對外暴露供特性偵測 | 無第一方產生器；僅擴充功能 | 是 |
| WebKit（Safari） | Safari 18.2，2024 年 12 月 11 日 | 是 | 右鍵「Copy Link with Highlight」，依 WebKit 18.2 釋出說明：「從右鍵選單選擇『Copy Link with Highlight』。……瀏覽器會將文字片段滾動至可見範圍，並以持續高亮標記。」 | 是 |

三個引擎都遵守 MDN 記載的靜默回退規則，因此今天撰寫的連結，在早於這些版本的環境中會退化為文件頂端的導覽。以 `document.fragmentDirective` 決定是否要對外露出自家的「複製高亮連結」按鈕。

## 延伸閱讀

- [`hidden="until-found"` 與 `beforematch` 事件](/zh-tw/HTML%20and%20Semantic%20Markup/hidden-until-found-and-beforematch)
- [HTML API 與漸進增強](/zh-tw/HTML%20and%20Semantic%20Markup/106)

## 參考資料

- MDN Web Docs, "Text fragments," Mozilla. https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
- WICG, "Scroll To Text Fragment" (Editor's Draft). https://wicg.github.io/scroll-to-text-fragment/
- Thomas Steiner, "Boldly link where no one has linked before: Text Fragments," web.dev (2020). https://web.dev/articles/text-fragments
- MDN Web Docs, "::target-text," Mozilla. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::target-text
- Mozilla, "Firefox 131 for developers," MDN. https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/131
- Jen Simmons et al., "WebKit Features in Safari 18.2," WebKit Blog (2024). https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- WICG, "Accessibility of text fragments (issue #142)," GitHub. https://github.com/WICG/scroll-to-text-fragment/issues/142
