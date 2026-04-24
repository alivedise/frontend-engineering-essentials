---
id: 114
title: "虛擬鍵盤 UX — `inputmode`、`enterkeyhint` 與純文字編輯"
state: draft
slug: virtual-keyboard-ux
category: HTML and Semantic Markup
level: mid
---

# [FEE-114] 虛擬鍵盤 UX：inputmode、enterkeyhint 與純文字編輯

:::info
行動裝置使用者透過螢幕鍵盤填寫你的表單，該鍵盤的佈局與 Enter 鍵標籤由瀏覽器決定。HTML 提供四個提示來引導這個決定：`inputmode`、`enterkeyhint`、`autocapitalize` 與 `contenteditable="plaintext-only"`。本文對照每個屬性實際控制什麼、截至 2026 年的 Baseline 支援狀態，以及為何這些提示能補強正確的 `type`、`<label>` 與 ARIA 語意，卻無法取代它們。
:::

## 背景

`inputmode` 是一項表現層提示。MDN 指出「`inputmode` 屬性不會對輸入強制任何有效性要求」（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)）。設定 `inputmode="numeric"` 會讓作業系統顯示數字鍵盤，但除非同時套用 `pattern` 或 `type` 約束，欄位仍會接受貼上的字母。此屬性存在的理由在於 `type="number"` 帶有驗證、微調器與地區解析，許多實務欄位（信用卡號、OTP、郵遞區號）並不需要。

`enterkeyhint` 對 Enter 鍵採相同原理。此屬性可將 Enter 重新標示為 `enter`、`done`、`go`、`next`、`previous`、`search` 或 `send` 之一（[MDN `enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)）。搭配 `autocapitalize`（管理虛擬鍵盤的 Shift 狀態）與 `contenteditable="plaintext-only"`（貼上時去除富格式），這四個屬性涵蓋了過去需要 JavaScript 啟發式處理的大部分行動輸入細節。

## 視覺對比

| 屬性 | 控制項目 | 可接受值 | 影響 AT？ | 對實體鍵盤效果 |
|---|---|---|---|---|
| `inputmode` | 虛擬鍵盤佈局 | `none`、`text`、`tel`、`url`、`email`、`numeric`、`decimal`、`search` | 否 | 無 |
| `enterkeyhint` | Enter 鍵標籤／圖示 | `enter`、`done`、`go`、`next`、`previous`、`search`、`send` | 否 | 無 |
| `contenteditable="plaintext-only"` | 可編輯區域；貼上時去除格式 | `plaintext-only`（相對於 `true`／`false`） | 是（區域變為可編輯） | 適用於所有輸入路徑 |
| `autocapitalize` | 虛擬鍵盤的 Shift 狀態 | `none`、`sentences`、`words`、`characters`、`on`、`off` | 否 | 無 |
| VirtualKeyboard API | 關閉自動視窗縮放；公開鍵盤矩形 | `navigator.virtualKeyboard.overlaysContent`、`geometrychange` 事件、`env(keyboard-inset-*)` | 否 | 無 |

## 範例

### 數字鍵盤：`numeric` vs `decimal`

這兩個值產生不同的數字鍵盤。MDN 將 `decimal` 描述為「含有數字與使用者地區小數分隔符（通常為 . 或 ,）的分數數字輸入鍵盤」，而 `numeric` 則是「數字輸入鍵盤，只需 0–9 的數字」（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)）。

```html
<!-- One-time passcode: only digits. -->
<label for="otp">One-time code</label>
<input id="otp" name="otp" type="text" inputmode="numeric"
       pattern="[0-9]*" autocomplete="one-time-code" maxlength="6" />

<!-- Price in USD or EUR: needs the locale decimal separator. -->
<label for="price">Price</label>
<input id="price" name="price" type="text" inputmode="decimal" />
```

### 多欄位表單搭配 `enterkeyhint`

```html
<form id="signup">
  <label for="given">First name</label>
  <input id="given" name="given" type="text" enterkeyhint="next" autocapitalize="words" />

  <label for="family">Last name</label>
  <input id="family" name="family" type="text" enterkeyhint="next" autocapitalize="words" />

  <label for="email">Email</label>
  <input id="email" name="email" type="email" enterkeyhint="done" />

  <button type="submit">Create account</button>
</form>
```

前兩個輸入框的 Enter 鍵帶有往前指向的標籤；最後一個顯示為 "Done"（或作業系統對應的圖示）。在 Enter 時移動焦點仍需 JavaScript，該屬性只更動標籤（詳見深入探討）。

### 聊天輸入框搭配 `plaintext-only`

```html
<div
  id="composer"
  role="textbox"
  aria-label="Message"
  aria-multiline="true"
  contenteditable="plaintext-only"
  enterkeyhint="send"></div>
<button type="button" id="send">Send</button>
```

將帶格式的內容貼入此 div 會去除行內樣式與標籤，只留下純文字，同時元素仍會隨內容成長。MDN 對照兩個值：「若內容被貼入 `contenteditable="true"` 的元素，所有格式會保留。若內容被貼入 `contenteditable="plaintext-only"` 的元素，所有格式會被移除。」（[MDN `contenteditable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable)）

## 最佳實踐

- **MUST** 為接受分數的貨幣與數量欄位選用 `inputmode="decimal"`。根據 MDN，`numeric` 省略小數分隔符，會導致使用者在 iOS 上無法輸入 `12.50`（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)）。
- **MUST NOT** 將 `inputmode` 當作驗證使用。「`inputmode` 屬性不會對輸入強制任何有效性要求」（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)）。請搭配 `pattern`、`minlength`／`maxlength`，或伺服器端檢查。
- **MUST** 保留 `<label>`、正確的 `type` 與 ARIA 角色。web.dev 將 `inputmode` 與 `type` 視為互補：「搭配適當的表單元素與正確的 `inputmode` 或 `type`，螢幕鍵盤會顯示適當的字元」（[web.dev Forms a11y](https://web.dev/learn/forms/accessibility)）。這些提示不會暴露給輔助科技，因此無法取代標籤。
- **SHOULD** 當欄位語意上承載 email／URL／search，但無法接受對應 `type` 的驗證或預設 UI 時，以 `inputmode` 搭配 `type="text"`。web.dev：「若想保留 `<input>` 的預設使用者介面與預設驗證規則，但仍想要最佳化的螢幕鍵盤，使用 `inputmode` 是一個不錯的選項。」（[web.dev Forms attributes](https://web.dev/learn/forms/attributes)）
- **SHOULD** 在自由格式文字欄位上明確設定 `autocapitalize`。各瀏覽器預設值有差異（深入探討），且該屬性在 `type="url"`、`type="email"`、`type="password"` 上無論你設定何值皆被忽略（[MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)）。
- **MAY** 當頁面自行繪製其頁內鍵盤（例如簽名或 PIN 鍵盤）並希望抑制作業系統鍵盤時，使用 `inputmode="none"`（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)）。

## 深入探討

### `enterkeyhint` 只重新標示，不負責導航

此屬性僅變更 Enter 鍵的符號。Chris Coyier 指出：「若你填入 `next` 或 `previous`，行為完全不變——你必須自己撰寫程式碼」（[CSS-Tricks enterkeyhint](https://css-tricks.com/enterkeyhint/)）。若要在使用者點擊 "Next" 時將焦點移至下一欄位，請監聽 Enter／keydown，並明確對下一個表單控制項呼叫 `.focus()`。

### Android 呈現圖示，iOS 呈現文字

相同屬性在各作業系統上呈現方式不同。CSS-Tricks 記載：「在 Android 上，動作按鈕不總是變成文字，而是使用圖示。因此對 `send` 值，你看到的是一架小紙飛機圖示而不是 'send' 標籤。」（[CSS-Tricks enterkeyhint](https://css-tricks.com/enterkeyhint/)）iOS 則呈現在地化文字（"Done"、"Listo"、"完了"）。請圍繞語意意圖而不是特定符號設計表單，並在發佈前於兩種平台測試。

### `autocapitalize` 瀏覽器預設值

預設值並不一致。MDN：「Chrome 與 Safari 預設為 `on`／`sentences`。Firefox 預設為 `off`／`none`。」（[MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)）一個在 Chrome 上運作正常（設定 `autocapitalize="words"` 時，每個字的首字母大寫）的姓名欄位，若你在他處依賴隱含預設值，在 Firefox 上可能感覺不一致。請在每個相關欄位上設定你想要的值。

實體鍵盤完全繞過此屬性：「`autocapitalize` 在以實體鍵盤打字時不會影響行為」（[MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)）。它在 `type="url"`、`type="email"`、`type="password"` 上也被硬編碼為關閉。

### VirtualKeyboard API：在鍵盤周圍重新排版

預設情況下，當虛擬鍵盤出現時，瀏覽器會縮放視覺視窗。VirtualKeyboard API 翻轉此行為：設定 `navigator.virtualKeyboard.overlaysContent = true` 後，鍵盤會變成覆蓋層，透過 `env(keyboard-inset-height)` 與 `env(keyboard-inset-top)` CSS 環境變數以及 `geometrychange` 事件公開其矩形。Chrome 文件指出：「每當虛擬鍵盤出現或消失，`geometrychange` 事件就會被派送。」（[Chrome VirtualKeyboard](https://developer.chrome.com/docs/web-platform/virtual-keyboard)）

支援有限。MDN 將此 API 列為「Limited availability — 此功能不屬於 Baseline，因其在某些最廣泛使用的瀏覽器中無法運作」（[MDN VirtualKeyboard API](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API)）。請將其視為漸進增強：對 `'virtualKeyboard' in navigator` 做功能偵測，並在 Safari 與 Firefox 上回退至預設的縮放行為。

## 屬性相容性對照

| 功能 | Baseline 狀態 | 推出時間 | 引擎覆蓋 | 備註 |
|---|---|---|---|---|
| `inputmode` | Widely available | 2021 年 12 月起 | Blink、WebKit、Gecko | 「自 2021 年 12 月起在各瀏覽器可用」（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)；[caniuse](https://caniuse.com/input-inputmode)）。安全預設。 |
| `enterkeyhint` | Widely available | 2021 年 11 月起 | Blink、WebKit、Gecko | 「自 2021 年 11 月起在各瀏覽器可用」（[MDN `enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)）。僅標籤，行為留在 JS。 |
| `autocapitalize` | Widely available | — | Blink、WebKit、Gecko | Chrome／Safari 預設為 `sentences`；Firefox 預設為 `none`（[MDN `autocapitalize`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)）。實體鍵盤與 `url`／`email`／`password` 型別上忽略。 |
| `contenteditable="plaintext-only"` | Newly available | 2025 年 3 月 4 日（Firefox 136） | Blink、WebKit、Gecko | 「contenteditable 'plaintext-only' 屬性值組合現為 Baseline Newly available」（[web.dev blog](https://web.dev/blog/contenteditable-plaintext-only-baseline)；[caniuse](https://caniuse.com/mdn-html_global_attributes_contenteditable_plaintext-only)）。為舊版本提供回退至 `contenteditable="true"` 加上貼上清理。 |
| VirtualKeyboard API | Limited availability | Chrome／Edge 94 | 僅 Blink | 不在 Safari 或 Firefox（[MDN VirtualKeyboard API](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API)）。進行功能偵測並增強。 |

值得釘住的具體值：

- `inputmode="tel"` 呈現「電話鍵盤輸入，包含 0–9 數字、星號（*）與井字鍵（#）」（[MDN `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)）。
- `inputmode="none"` 為提供自身輸入介面的頁面抑制作業系統鍵盤（同來源）。
- `enterkeyhint="done"` 表示「沒有更多輸入內容，輸入法編輯器（IME）將被關閉」（[MDN `enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)）。

## 延伸閱讀

- [表單與驗證](/zh-tw/HTML%20and%20Semantic%20Markup/103)
- [HTML API 與漸進增強](/zh-tw/HTML%20and%20Semantic%20Markup/106)

## 參考資料

- MDN contributors, "inputmode," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- MDN contributors, "enterkeyhint," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint
- MDN contributors, "contenteditable," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
- MDN contributors, "autocapitalize," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize
- MDN contributors, "VirtualKeyboard API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
- web.dev, "contenteditable plaintext-only is Baseline Newly available" (2025). https://web.dev/blog/contenteditable-plaintext-only-baseline
- web.dev Learn Forms, "Form attributes." https://web.dev/learn/forms/attributes
- web.dev Learn Forms, "Form accessibility." https://web.dev/learn/forms/accessibility
- Chrome for Developers, "VirtualKeyboard API." https://developer.chrome.com/docs/web-platform/virtual-keyboard
- Chris Coyier, "The `enterkeyhint` attribute," CSS-Tricks. https://css-tricks.com/enterkeyhint/
