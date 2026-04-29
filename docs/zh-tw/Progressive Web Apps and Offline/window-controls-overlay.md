---
id: 1312
title: "桌面 PWA 的 Window Controls Overlay 與 display_override"
state: draft
slug: window-controls-overlay
---

# [FEE-1312] 桌面 PWA 的 Window Controls Overlay 與 display_override

:::info
Window Controls Overlay（WCO）讓桌面端安裝的 PWA 隱藏作業系統預設的標題列，把網頁內容繪製到整個視窗表面，並把最大化、最小化與關閉按鈕以覆蓋層形式繪製在最上層（MDN）。啟用方式為 manifest 中的 `display_override: ["window-controls-overlay"]`，瀏覽器會依陣列順序解析，再退回舊有的 `display` 成員（MDN `display_override`）。啟用後的覆蓋層會暴露四個 CSS `env(titlebar-area-*)` 變數，將佈局對齊到標題列矩形，同時提供 `navigator.windowControlsOverlay` JS 介面，內含 `visible` 旗標、`getTitlebarAreaRect()` 方法以及 `geometrychange` 事件（WICG、MDN）。截至 2026 年僅 Chromium 系列支援；Firefox 與 Safari 並未實作 WCO，因此退回鏈本身就是部署故事的一部分（caniuse）。
:::

## 背景

桌面 PWA 模式起初透過 `display: standalone` 讓已安裝的應用程式擁有獨立視窗，該模式仍保留瀏覽器繪製的標題列，最上方的條帶仍處於開發者觸及範圍之外。WICG 草擬的 Window Controls Overlay 規格填補了這項落差，讓 PWA「隱藏預設視窗標題列，並在應用程式視窗的整個表面顯示自己的內容，把控制按鈕（最大化、最小化、關閉）轉為覆蓋層」（MDN Window_Controls_Overlay_API）。啟用路徑透過較新的 `display_override` manifest 成員，MDN 描述其為「依序考慮的顯示模式陣列，套用第一個受支援的顯示模式」，並「讓開發者提供瀏覽器在使用 `display` 成員之前會考慮的顯示模式序列」（MDN `display_override`）。覆蓋層的 CSS 介面為四個定義標題列矩形的 `env()` 變數（WICG），JS 介面則是透過 `navigator.windowControlsOverlay` 取得的 `WindowControlsOverlay` 介面（MDN）。截至 2026 年，caniuse 紀錄 WCO 在 Chrome、Edge、Opera 受支援，在 Firefox 與 Safari 則否，因此每個 WCO 部署都會搭配退回方案，給未支援平台的多數使用者使用。

## 視覺對比

| 層級 | 介面 | 用途 | 來源 |
| --- | --- | --- | --- |
| Manifest | `display_override: ["window-controls-overlay"]`（搭配 `display: "standalone"` 作為退回值） | 讓 PWA 啟用 WCO；陣列依序解析，第一個受支援模式勝出 | web.dev（Baker、Steiner）；MDN `display_override` |
| Manifest 退回 | `display` 成員 | 當 `display_override` 中沒有任一項目受支援時使用 | MDN `display_override` |
| CSS 佈局 | `env(titlebar-area-x)`、`env(titlebar-area-y)`、`env(titlebar-area-width)`、`env(titlebar-area-height)` | 四個定義標題列矩形的 `length` 變數；WCO 未啟用時退回值生效 | WICG；web.dev |
| CSS 拖曳 | `app-region: drag` / `app-region: no-drag`（目前僅 `-webkit-app-region`） | 在覆蓋層條帶內標記 OS 層級可拖曳區域 | web.dev；WICG |
| JS 偵測 | `"windowControlsOverlay" in navigator` | 對 API 介面進行特性偵測 | MDN `Navigator.windowControlsOverlay` |
| JS 狀態 | `navigator.windowControlsOverlay.visible`、`getTitlebarAreaRect()` | 讀取覆蓋層是否啟用以及標題列矩形位置 | MDN `WindowControlsOverlay` |
| JS 事件 | `navigator.windowControlsOverlay` 上的 `geometrychange` | 在覆蓋層尺寸改變、頁面縮放變動或其他 UI 出現/消失時觸發 | WICG；web.dev |
| 瀏覽器支援 | Chrome 105+、Edge 105+、Opera 91+ 支援；Firefox 與 Safari 不支援 | 定義退回族群的規模 | caniuse |

## 範例

PWA 啟用 WCO，並依 env() 矩形配置自訂標題列。manifest 宣告退回鏈，將 `standalone` 作為退回值，讓不支援 WCO 的瀏覽器仍會把應用程式安裝到獨立視窗：

```json
{
  "display": "standalone",
  "display_override": ["window-controls-overlay"]
}
```

CSS 將標題列內容對齊到四個 `env(titlebar-area-*)` 變數，並使用退回值，讓相同標記在覆蓋層未啟用時（例如 PWA 在分頁中執行，或於 Firefox/Safari 中執行）以行內方式呈現：

```css
.titlebar {
  position: fixed;
  left: env(titlebar-area-x, 0);
  top: env(titlebar-area-y, 0);
  width: env(titlebar-area-width, 100%);
  height: env(titlebar-area-height, 33px);
  -webkit-app-region: drag;
}

.titlebar button {
  -webkit-app-region: no-drag;
}
```

JS 對 API 進行特性偵測、讀取目前矩形，並監聽幾何變更事件，以便標題列 UI 能在使用者調整視窗大小或變更頁面縮放時隨之調整：

```js
if ("windowControlsOverlay" in navigator) {
  const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
  // rect.x, rect.y, rect.width, rect.height match the env() variables.

  navigator.windowControlsOverlay.addEventListener("geometrychange", (e) => {
    const span = document.querySelector(".titlebar .label");
    span.hidden = e.titlebarAreaRect.width < 800;
  });
}
```

幾何變更片段呼應了 web.dev 範例：監聽器讀取 `e.titlebarAreaRect`，當標題列區域過窄時隱藏標籤。依 WICG 規格，`geometrychange` 在覆蓋層的寬度或高度變化時觸發，「例如使用者調整瀏覽器視窗大小、變更頁面縮放因子，或其他 UI 在覆蓋層上出現或消失時」。

## 最佳實踐

- **MUST** 透過 `display_override` 宣告 WCO，並明確以 `display: "standalone"`（或其他受支援模式）作為退回值，因為 `display_override` 陣列「依序考慮，套用第一個受支援的顯示模式」，且當沒有任一項目受支援時，瀏覽器會退回到 `display`（MDN `display_override`）。
- **MUST** 在每個 `env(titlebar-area-*)` 引用中提供退回值，因為當 WCO 未啟用時，頁面會以一般 HTML 行內呈現，退回值會生效（web.dev）。
- **MUST** 在讀取 `getTitlebarAreaRect()` 或訂閱 `geometrychange` 之前先以 `"windowControlsOverlay" in navigator` 做特性偵測，因為該屬性是 `WindowControlsOverlay` 介面的存取閘門（MDN `Navigator.windowControlsOverlay`）。
- **MUST** 將 `navigator.windowControlsOverlay.visible === false` 視為與非 WCO 分支相同的渲染狀態，因為規格將 PWA 在分頁中執行或被解除安裝時的覆蓋層定義為不可見（WICG）。
- **SHOULD** 以 `app-region: drag` 標記標題列條帶，並以 `app-region: no-drag` 重新標記互動元素（按鈕、輸入欄位），呼應 web.dev 對在自訂標題列上恢復視窗拖曳行為的指引。
- **SHOULD** 目前仍使用 `-webkit-app-region` 前綴，因為規格紀錄「目前瀏覽器僅支援 `-webkit-app-region`」（WICG）。
- **SHOULD** 訂閱 `geometrychange`，並在每次事件觸發時重新評估標題列佈局，因為覆蓋層矩形會在視窗調整大小、頁面縮放變動或其他 UI 出現於覆蓋層上時變化（WICG；web.dev）。
- **SHOULD** 規劃 Firefox 與 Safari 會退回到下一個 `display_override` 項目（最終退回到 `display`），因為 caniuse 將兩者於現行版本中標記為不支援。
- **MAY** 在啟動時讀取一次 `navigator.windowControlsOverlay.getTitlebarAreaRect()` 作為初始佈局依據，後續仰賴 `geometrychange` 事件更新，因為矩形 API 與事件酬載（`e.titlebarAreaRect`）暴露相同的矩形（MDN `WindowControlsOverlay`；web.dev）。
- **MAY** 將標題列幾何視為指紋識別輸入，避免將其記錄給第三方，因為 WICG 規格指出「啟用 Window Controls Overlay 會擴大指紋識別表面，因為覆蓋層大小可能因 OS、文字縮放、OS 字型大小、OS 縮放因子與網頁內容縮放因子而變化」。

## 設計思維

WCO 以統一的瀏覽器標題列換取整個表面的畫布，所交換的是拖曳行為的歸屬。一旦標題列條帶成為網頁內容，OS 層級的視窗拖曳預設就在該區域失效；規格透過 `app-region: drag` / `no-drag` 配對恢復拖曳（web.dev），代價是一個 Chromium 前綴屬性，WICG 規格紀錄這是目前唯一推出的形式。第二項取捨在功能介面與指紋識別之間：透過 `env()`、`getTitlebarAreaRect()` 與 `geometrychange` 暴露的幾何矩形啟用了響應式標題列，同樣的介面也擴大了指紋識別，因為矩形隨 OS、文字縮放、OS 字型大小、OS 縮放與頁面縮放而變化（WICG）。第三項取捨在 `display_override` 本身：把 `window-controls-overlay` 這類較積極的模式排在前面，可在支援的瀏覽器上最大化畫布，而 `display` 退回值則在 Firefox 與 Safari 上保留完整的安裝體驗（MDN `display_override`；caniuse）。

## 標題列客製化生命週期

啟用握手共有五個狀態。每個狀態指出驅動該狀態的介面。

1. **Manifest 宣告。** Manifest 設定 `display_override: ["window-controls-overlay"]`，並保留 `display` 值如 `"standalone"`。覆蓋陣列「依序考慮，套用第一個受支援的顯示模式」，`display_override`「讓開發者提供瀏覽器在使用 `display` 成員之前會考慮的顯示模式序列」（MDN `display_override`）。依 web.dev 指引，啟用方式是把 `"window-controls-overlay"` 加為 `display_override` 的主要成員。
2. **安裝／啟動解析。** 使用者在桌面 OS 上將 PWA 安裝為獨立視窗時，Chromium 系瀏覽器會走訪該陣列、接受 `window-controls-overlay`，並啟用覆蓋層。該顯示模式「僅在應用程式於獨立 PWA 視窗中且於桌面作業系統上時生效」（MDN `display_override`）。不支援的瀏覽器「要不就完全不考慮 `display_override` 的 web app manifest 屬性，要不就無法識別 `window-controls-overlay`，因此依退回鏈使用下一個可能值」（WICG）。caniuse 紀錄 Firefox 與 Safari 為不支援，因此這些引擎會把鏈退回到 `display`。若 PWA 在分頁中執行而非獨立 PWA 視窗，規格指出覆蓋層「將不會可見」（WICG）。
3. **`windowControlsOverlay.visible` 解析。** 頁面載入後，腳本讀取 `navigator.windowControlsOverlay.visible`，「一個布林值，指出視窗控制覆蓋層是否可見」（MDN `WindowControlsOverlay`）。同一屬性回報這次啟用是否生效：`true` 代表 env() 矩形與覆蓋層按鈕運作中，`false` 代表頁面以行內方式渲染並使用 env() 退回值。
4. **CSS `env(titlebar-area-*)` 佈局。** 覆蓋層啟用時，四個「標題列區域環境變數」——`titlebar-area-x`、`titlebar-area-y`、`titlebar-area-width`、`titlebar-area-height`，型別皆為 `length`（WICG）——定義開發者可繪製的矩形。web.dev 建議搭配退回值使用變數（`left: env(titlebar-area-x, 0);`），讓「為視窗控制覆蓋層構建的 HTML 將以一般 HTML 內容形式行內顯示，且 `env()` 變數的退回值會在 WCO 未啟用時生效」。`app-region: drag`（目前為 `-webkit-app-region`）標記 OS 層級可拖曳條帶；`app-region: no-drag` 讓互動元素退出該行為（web.dev；WICG）。
5. **`geometrychange` 事件流程。** 覆蓋層啟用期間，使用者代理會在「[覆蓋層] 寬度或高度變化（例如使用者調整瀏覽器視窗大小、變更頁面縮放因子，或其他 UI 在 [覆蓋層] 上出現或消失）」時觸發 `geometrychange`（WICG）。web.dev 展示兩種等效的訂閱形式：指派給 `navigator.windowControlsOverlay.ongeometrychange`，或呼叫 `addEventListener("geometrychange", ...)`；事件酬載暴露 `e.titlebarAreaRect` 供執行時佈局決策使用（`span.hidden = e.titlebarAreaRect.width < 800;`）。當使用者把 PWA 移回分頁或解除安裝時，`visible` 翻轉為 `false`，頁面回到狀態 4 描述的 env() 退回路徑。

對於不遵守 `display_override: ["window-controls-overlay"]` 的瀏覽器——目前的 Firefox 與 Safari（caniuse），以及 PWA 未安裝或於分頁中執行的環境（WICG）——同一份原始碼可不變動地運作：manifest 退回到 `display`，env() 變數解析到退回值，`"windowControlsOverlay" in navigator` 後方的 JS 分支則被跳過。WICG 規格直接陳述此契約：「若使用者代理不支援 WCO，開發者可為 `display_override` 透過 `display` 提供合理退回，並對 CSS 變數與 JS 物件採對應退回方案。」

## 延伸閱讀

- [FEE-1301 Web App Manifest baseline](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1301)
- [FEE-1311 PWA OS Integration Manifest Members](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/pwa-os-integration-manifest)

## 參考資料

- Amanda Baker and Thomas Steiner, "Customize the window controls overlay of your PWA's title bar," web.dev (2022, updated). https://web.dev/articles/window-controls-overlay
- WICG, "Window Controls Overlay" (Editor's Draft). https://wicg.github.io/window-controls-overlay/
- MDN contributors, "Window Controls Overlay API." https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
- MDN contributors, "display_override — Web App Manifest." https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display_override
- MDN contributors, "WindowControlsOverlay." https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay
- MDN contributors, "Navigator.windowControlsOverlay." https://developer.mozilla.org/en-US/docs/Web/API/Navigator/windowControlsOverlay
- caniuse.com, "WindowControlsOverlay." https://caniuse.com/mdn-api_windowcontrolsoverlay
