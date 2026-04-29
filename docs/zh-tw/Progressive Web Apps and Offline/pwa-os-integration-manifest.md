---
id: 1311
title: "PWA 作業系統整合 Manifest 成員（file_handlers、protocol_handlers、share_target、launch_handler）"
state: draft
slug: pwa-os-integration-manifest
---

# [FEE-1311] PWA 作業系統整合 Manifest 成員（file_handlers、protocol_handlers、share_target、launch_handler）

:::info
W3C Web Application Manifest 規範定義一組基線可選成員，並提供延伸鉤點以納入其他規範新增的成員。其中四個延伸成員 `file_handlers`、`protocol_handlers`、`share_target`、`launch_handler` 讓已安裝的 PWA 在 OS 的檔案、URL、分享、啟動流程裡與原生應用程式平起平坐。本文整理它們的 schema、OS 觸發點、傳遞 API、瀏覽器支援度與常見陷阱。依 MDN 相容性公告，這四個成員目前皆為「Limited availability」且僅限於 Chromium。
:::

## 背景

W3C Web Application Manifest 規範（[W3C TR/appmanifest](https://www.w3.org/TR/appmanifest/)）將根層級可選成員列為 `background_color`、`dir`、`display`、`icons`、`id`、`lang`、`name`、`orientation`、`scope`、`short_name`、`shortcuts`、`start_url`、`theme_color`，並提供延伸鉤點，內容指出「鼓勵其他為 manifest 新增成員的規範在演算法的此處掛入本規範」。`file_handlers`、`protocol_handlers`、`share_target`、`launch_handler` 並未定義於這份基線文件。它們落在 WICG manifest-incubations、WICG Web App Launch Handler 規範以及 W3C TAG Web Share Target 草案。Manifest 層級的 `protocol_handlers` 於 Chrome 96 隨附推出，由 Microsoft Edge 團隊（Fabio Rocha、Diego González、Connor Moody、Samuel Tang）實作並撰寫規範。檔案處理依 Thomas Steiner 撰寫的 Chrome capabilities 頁面說明，在 Chrome 102+ 與 Edge 102+ 的桌面平台推出，Firefox 與 Safari 皆未支援。MDN 的相容性公告將這四個成員都標示為「Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers」。本文與基線 manifest 文章（FEE-1301）互補，僅涵蓋 OS 整合的延伸成員。

## 視覺對比

| 成員 | Schema 形狀 | OS 啟動觸發點 | 傳遞 API | 瀏覽器支援（2026 年 4 月） | 常見陷阱 |
|---|---|---|---|---|---|
| `file_handlers` | `[{action, accept: {mime: [exts]}, icons?, launch_type?}]` | 使用者於 OS 檔案總管開啟已註冊類型的檔案 | `window.launchQueue.setConsumer` callback 收到 `LaunchParams.files`（`FileSystemHandle` 陣列） | Limited：Chrome/Edge 102+ 桌面；Firefox/Safari 不支援 | `action` URL 必須位於 `scope` 內；單次啟動權限提示在被忽略三次後會進入封禁 |
| `protocol_handlers` | `[{protocol, url}]`（HTTPS，含 `%s` 佔位符） | 使用者啟用 `web+foo://...` 連結或 safelisted-scheme 連結 | 瀏覽器導向至代換後的 `url` | Limited：Chrome/Edge 96+；Firefox/Safari 不支援 | 自訂 scheme 必須以 `web+` 開頭並使用小寫 ASCII；非 safelist 的裸 scheme 會被拒絕 |
| `share_target` | `{action, method?, enctype?, params: {title?, text?, url?, files?: [{name, accept}]}}` | 使用者在原生 OS 分享面板挑選此 PWA（須安裝後） | `GET` 查詢字串或 `POST` 表單資料，由 service worker `fetch` 攔截 | Limited：Chromium 系包含 Android/ChromeOS 安裝後；Firefox/Safari 不支援 | POST 處理端應回覆 `303 See Other` 以避免重新整理導致重複送出；輸入資料必須驗證 |
| `launch_handler` | `{client_mode: "auto" \| "navigate-new" \| "navigate-existing" \| "focus-existing" \| string[]}` | 任何進入 PWA 的深層連結、檔案、protocol、分享啟動 | `client_mode` 選擇視窗重用策略；`LaunchParams.targetURL` 將 URL 暴露給既有視窗 | Limited：Chromium 系；Firefox/Safari 不支援 | 早期草案的 `route_to` 已移除；`auto` 為預設值 |

## 範例

一款 markdown 編輯器 PWA 將自己註冊為 `.md` 檔案、`web+md` URL scheme、分享面板的 OS 處理端，並採用單一視窗的啟動策略。Manifest 片段：

```json
{
  "name": "Markpad",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "file_handlers": [
    {
      "action": "/open",
      "accept": {
        "text/markdown": [".md", ".markdown"]
      },
      "launch_type": "single-client"
    }
  ],
  "protocol_handlers": [
    {
      "protocol": "web+md",
      "url": "/handle?uri=%s"
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        { "name": "attachments", "accept": ["text/markdown", ".md"] }
      ]
    }
  },
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}
```

當使用者於 Finder 或檔案總管開啟 `notes.md`，瀏覽器依 MDN file_handlers 參考的描述，已於「installation time 讀取 [manifest] 並將該應用程式於作業系統層級關聯到一組指定的檔案類型」。瀏覽器在 `/open` 啟動 PWA。應用程式碼（MDN 參考指出「處理檔案是在主執行緒上的應用程式碼裡完成，並非在應用程式的 service worker」）透過 `launchQueue` 接收檔案：

```js
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    if (!launchParams.files || launchParams.files.length === 0) return;
    for (const handle of launchParams.files) {
      const file = await handle.getFile();
      const text = await file.text();
      openInEditor(file.name, text);
    }
  });
}
```

依 Chrome 檔案處理 capabilities 頁面，「啟動會被排入佇列直到指定的 consumer 接手處理，而 consumer 對每次啟動會被呼叫恰好一次」。依 MDN 的 `LaunchParams` 參考，`LaunchParams.files` 是「一個唯讀的 `FileSystemHandle` 物件陣列，代表隨啟動導覽傳入的檔案」。

當使用者點擊 `web+md://gist/abc123` 連結，瀏覽器會以完整 URL 取代 `%s`，將 PWA 導向至 `/handle?uri=web%2Bmd%3A%2F%2Fgist%2Fabc123`。MDN protocol_handlers 參考將 `url` 定義為「Required HTTPS URL within the application `scope` that will handle the protocol」，並指出「`%s` token 將會被以 protocol handler scheme 開頭的 URL 取代」。

當使用者從其他應用程式分享 `.md` 檔案，OS 分享面板會列出 Markpad。瀏覽器以 `multipart/form-data` POST 至 `/share`，由 service worker 攔截。MDN share_target 參考建議「該 `POST` 請求最好以 HTTP 303 See Other 重新導向回應，以避免使用者重新整理頁面時送出多次 `POST` 請求」。

`launch_handler.client_mode: "navigate-existing"` 讓後續的啟動重用既有視窗。依 MDN Launch Handler API 參考，`navigate-existing` 表示「web app 視窗中最近互動的瀏覽情境會被導向至目標啟動 URL」。

## 最佳實踐

- **MUST** 將每個 handler 的 `action` 與 `url` 維持在 PWA 的導覽 scope 內。MDN file_handlers 參考指出：「This URL must be within the navigation scope of the PWA, which is the set of URLs that the PWA can navigate to. The navigation scope of a PWA defaults to its `start_url` member, but can also be defined by using the `scope` member.」相同的 scope 約束適用於 `protocol_handlers.url` 與 `share_target.action`。
- **MUST** 將自訂 protocol scheme 以 `web+` 為前綴並接續小寫 ASCII 字母。依 MDN `registerProtocolHandler` 參考（manifest-incubations 規範性引用），自訂 scheme「Begins with `web+`; Contains at least one letter after the `web+` prefix; Contains only lowercase ASCII letters」。在 safelist（`bitcoin`、`ftp`、`ftps`、`geo`、`im`、`irc`、`ircs`、`magnet`、`mailto`、`matrix`、`mms`、`news`、`nntp`、`openpgp4fpr`、`sftp`、`sip`、`sms`、`smsto`、`ssh`、`tel`、`urn`、`webcal`、`wtai`、`xmpp`）之外，裸 scheme 會被拒絕。
- **MUST** 在出貨 `file_handlers` 時註冊 `launchQueue` consumer。依 MDN file_handlers 參考，「web 開發者也需要在應用程式 JavaScript 程式碼中使用 `window.launchQueue` 來處理進來的檔案」。若無 consumer，啟動的檔案會無限期排隊。
- **MUST** 對傳入 `share_target` 的資料進行驗證。依 MDN share_target 參考：「Similar to HTML form submissions, you should be cautious about data that is sent to your application via the share target. Be sure to validate incoming data before using it.」
- **MUST** 對接受檔案的分享目標使用 `method: "POST"` 搭配 `enctype: "multipart/form-data"`。依 MDN share_target 參考：「Use `POST` if the shared data includes binary data like image(s), or if it changes the target app, for example, if it creates a data point like a bookmark.」
- **SHOULD** 對 share-target POST 回覆 `303 See Other` 以防止重新整理時重複提交，依前引 MDN share_target 參考。
- **SHOULD** 將檔案處理權限提示視為使用者可恢復的選擇。依 Chrome 檔案處理 capabilities 頁面（Thomas Steiner）：「This permission will show every time until the user clicks to **Allow** or **Block** file handling for the site, or ignores the prompt three times (after which Chromium will embargo and block this permission).」
- **SHOULD** 以「安裝」作為分享目標的註冊邊界。依 MDN share_target 參考，「Your PWA can only act as a web share target if it has been installed.」
- **MAY** 省略 `launch_handler` 並接受預設值。依 WICG Web App Launch Handler API，`auto` 是「the user agent's default launch routing behaviour」，並在 `launch_handler` 缺席或無效時作為預設值。

## 深入探討

四個成員在如何將情境傳遞給執行中的 PWA 上各有差異。`file_handlers` 與 `launch_handler` 都透過 `window.launchQueue` 暴露狀態：file-handler 啟動會以 `FileSystemHandle` 物件填入 `LaunchParams.files`；依 MDN Launch Handler API 參考，`client_mode: "focus-existing"` 「會將目標啟動 URL 填入 `LaunchParams` 物件的 `targetURL` 屬性，並傳給 `window.launchQueue.setConsumer()` 的 callback 函式」。`protocol_handlers` 不使用 `launchQueue`，僅將代換後的 URL 直接導覽過去。`share_target` 採用普通的 HTTP 請求，包括 `GET` 查詢字串或 `POST` 表單資料，service worker 可透過 `fetch` handler 攔截。

`launch_handler.client_mode` 接受字串，也接受陣列。依 WICG Web App Launch Handler 規範：「If unspecified, launch_handler defaults to `{\"client_mode\": \"auto\"}`. The `client_mode` property also accepts a list (array) of values, where the first valid value will be used.」依 MDN，四個規範性數值為：

- `focus-existing` — web app 視窗中最近互動的瀏覽情境會被聚焦；`targetURL` 透過 `launchQueue` 暴露。
- `navigate-existing` — 最近互動的瀏覽情境會被導向至目標 URL。
- `navigate-new` — 在 web app 視窗中建立新的瀏覽情境。
- `auto` — 由 user agent 決定；此為預設值，並在所提供值無效時作為退路。

早期試行的屬性名稱 `route_to` 已於穩定版發行前移除。依 Chrome launch-handler capabilities 頁面（Thomas Steiner），舊版 Chrome 文件曾提及 `route_to`，而目前 WICG 規範（位於 `wicg.github.io/web-app-launch/`）僅將 `client_mode` 規範化。作者不應撰寫 `route_to`，將其視為歷史脈絡。

`file_handlers` 中的 `accept` 字典將 MIME 類型對應到副檔名清單。依 WICG manifest-incubations 規範，每個 handler 項目帶有 `action`、`name`、`accept`（「a dictionary mapping MIME types to a list of file extensions」）、`icons`、`launch_type`（「either `single-client` or `multiple-clients`」）。MDN 參考確認每個 handler 物件「must contain the following values (`action` and `accept` are required)」。

## 成員參考矩陣

四個成員在 schema、OS 介面、傳遞 API、支援等級與最常見陷阱上各有差異。

### `file_handlers`

| 欄位 | 必填 | 備註 |
|---|---|---|
| `action` | 是 | 在 `scope` 內的導覽 URL。 |
| `accept` | 是 | 將 MIME 類型對應到副檔名陣列的物件。 |
| `name` | 否 | 檔案類型關聯的顯示名稱。 |
| `icons` | 否 | 用於 OS 檔案類型圖示的 icon 物件陣列。 |
| `launch_type` | 否 | `single-client` 或 `multiple-clients`。 |

- OS 介面：檔案總管／「Open with…」選單。
- 註冊時機：安裝時。依 MDN，「read by the browser at installation time to associate the application with a given set of file types at the operating system level.」
- 傳遞：`window.launchQueue.setConsumer(callback)`；`callback` 接收的 `LaunchParams` 之 `files` 為 `FileSystemHandle` 物件陣列。
- 瀏覽器支援（2026 年 4 月）：Chrome 102+、Edge 102+，僅限桌面平台。Firefox 與 Safari 不支援。MDN：「Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers.」
- 權限模型：單次啟動提示，被忽略三次後封禁（Chrome capabilities 頁面）。

### `protocol_handlers`

| 欄位 | 必填 | 備註 |
|---|---|---|
| `protocol` | 是 | safelisted scheme，或以 `web+` 為前綴的小寫 ASCII 自訂 scheme。 |
| `url` | 是 | 在 `scope` 內的 HTTPS URL，含 `%s` 佔位符。相對 URL 以 manifest URL 為基礎解析。 |

- OS 介面：任何能觸發已註冊 scheme 的 URL 啟用器，例如瀏覽器、電子郵件用戶端、原生應用程式。
- 註冊時機：安裝時。
- 傳遞：導覽至以啟用 URL 取代 `%s` 後產生的 URL。
- 瀏覽器支援（2026 年 4 月）：Chrome 96+、Edge 96+。Firefox 與 Safari 不支援。MDN：「Limited availability… This is an experimental technology.」
- 常見陷阱：未列入 safelist 的裸 scheme（無 `web+` 前綴）會被拒絕。

### `share_target`

| 欄位 | 必填 | 備註 |
|---|---|---|
| `action` | 是 | 在 `scope` 內接收分享內容的 URL。 |
| `method` | 否 | `GET` 或 `POST`。 |
| `enctype` | 否 | `POST` 請求的編碼方式；含檔案時使用 `multipart/form-data`。 |
| `params.title` | 否 | 分享標題的查詢／表單參數名稱。 |
| `params.text` | 否 | 分享文字的查詢／表單參數名稱。 |
| `params.url` | 否 | 分享 URL 的查詢／表單參數名稱。 |
| `params.files` | 否 | 由 `{ name, accept }` 條目組成的分享檔案陣列。 |

- OS 介面：原生分享面板。
- 註冊時機：安裝時；僅在安裝後註冊（「Your PWA can only act as a web share target if it has been installed.」）。
- 傳遞：對 `action` 發出 HTTP 請求（GET 查詢字串或 POST 表單），通常由 service worker `fetch` handler 攔截。
- 瀏覽器支援（2026 年 4 月）：Chromium 系，包含 Android 與 ChromeOS 安裝後。Firefox 與 Safari 不支援。MDN：「Limited availability — This feature is not Baseline… It is marked as experimental.」
- Method 指引（MDN + W3C TAG 草案）：GET 適用於「when the share target drafts a message for subsequent user approval」；POST 建議用於「if the share target performs a side-effect without any user interaction」。

### `launch_handler`

| 欄位 | 必填 | 備註 |
|---|---|---|
| `client_mode` | 否 | `auto`、`navigate-new`、`navigate-existing`、`focus-existing` 之一，或這些值組成的陣列（取首個有效值）。預設為 `auto`。 |

- OS 介面：所有開啟 PWA 的啟動路徑，包括 file handlers、protocol handlers、share targets、深層連結、安裝圖示點擊。
- 註冊時機：安裝時註冊，啟動時套用。
- 傳遞：由 user agent 在導覽前做出視窗路由決策；`focus-existing` 模式下，`LaunchParams.targetURL` 透過 `launchQueue` 暴露。
- 瀏覽器支援（2026 年 4 月）：Chromium 系。Firefox 與 Safari 不支援。MDN：「Limited availability… This is an experimental technology.」
- 常見陷阱：`route_to`（早期試行名稱）已移除；目前 WICG 規範僅將 `client_mode` 列為規範性。

## Manifest 對 OS 介面映射

| OS 介面 | 觸發來源 | Manifest 成員 | 影響範圍 |
|---|---|---|---|
| 檔案總管／「Open with…」 | 使用者開啟已註冊 MIME 類型或副檔名的檔案 | `file_handlers` | 安裝時建立的 PWA 關聯 |
| URL/URI 啟用器（瀏覽器、郵件用戶端、原生應用程式） | 使用者點擊 `web+foo://…` 或 safelisted scheme 連結 | `protocol_handlers` | 安裝時建立的 PWA 關聯 |
| 原生分享面板 | 使用者於其他應用程式分享時挑選此 PWA | `share_target` | 僅在安裝後可見 |
| 任何啟動的視窗路由 | 上述任何來源加上深層連結與主畫面啟動 | `launch_handler` | 套用於每一次進入 PWA 的啟動 |

前三個成員會將 PWA 註冊在特定的 OS 介面上。`launch_handler` 修改每次啟動在既有與新瀏覽情境之間的路由方式；它與其他三者是組合關係，本身並未註冊新介面。

## 延伸閱讀

- [FEE-1301 Web App Manifest baseline](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1301)

## 參考資料

- W3C, "Web Application Manifest" (W3C). https://www.w3.org/TR/appmanifest/
- WICG, "Manifest Incubations" (WICG). https://wicg.github.io/manifest-incubations/
- WICG, "Web App Launch Handler API" (WICG). https://wicg.github.io/web-app-launch/
- W3C TAG, "Web Share Target API" (W3C). https://w3c.github.io/web-share-target/
- MDN contributors, "file_handlers — Web App Manifest Reference," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers
- MDN contributors, "protocol_handlers — Web App Manifest Reference," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers
- MDN contributors, "share_target — Web App Manifest Reference," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- MDN contributors, "Launch Handler API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API
- MDN contributors, "LaunchParams," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/LaunchParams
- MDN contributors, "Navigator: registerProtocolHandler() method," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler
- Thomas Steiner, "Let installed web applications handle files," Chrome for Developers. https://developer.chrome.com/docs/capabilities/web-apis/file-handling
- Thomas Steiner, "Launch handler," Chrome for Developers. https://developer.chrome.com/docs/web-platform/launch-handler
- Thomas Steiner, "URL protocol handler registration for PWAs," Chrome for Developers. https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler
- web.dev, "Learn PWA: OS Integration," web.dev. https://web.dev/learn/pwa/os-integration
