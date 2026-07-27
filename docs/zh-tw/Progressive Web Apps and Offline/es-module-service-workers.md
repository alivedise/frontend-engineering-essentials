---
id: 1315
title: "ES 模組 Service Worker（type: 'module'）與靜態 import 遷移"
state: draft
slug: es-module-service-workers
reviewed: hardened
reviewed_on: 2026-07-25
---

# [FEE-1315] ES 模組 Service Worker（type: 'module'）與靜態 import 遷移

:::info
模組 Service Worker 讓你可以把 `importScripts('./x.js')` 換成頂層的 `import { x } from './x.js'`，作法是在 `navigator.serviceWorker.register()` 傳入 `{ type: 'module' }`。Chrome 與 Edge 在版本 91（2021 年 4 至 5 月）支援，Safari 在版本 15 支援，Firefox 147（Bugzilla 1360870 RESOLVED FIXED，於 2026-01-13 發布）補上了將近四年半的落差。即使在模組模式下，仍有兩項模組特性維持禁用：規格禁止動態 `import()`，呼叫會拋出錯誤；頂層 await 也是刻意不開放的。這兩項禁令都只在模組模式下強制執行。從傳統 Service Worker 延續下來的，是背後的理由：依賴圖必須在 install 階段就能解析完成，而且事件監聽器必須同步註冊。原始碼層面的遷移是機械式的，但對於不支援模組 Service Worker 的瀏覽器，會引入打包工具的取捨。
:::

## 背景

自從 Service Worker API 在 2014 年推出以來，`importScripts()` 一直是組合 Service Worker 程式碼的唯一方式。Worker 的模組腳本支援是分階段落地的：先是 dedicated worker，接著是 shared worker，最後才是 Service Worker。W3C ServiceWorker 議題 #831 由 domenic 於 2016-02-12 開立，追蹤把 `WorkerType type = "classic"` 加入 `RegistrationOptions` 並更新註冊流程的工作。Chromium 在版本 91 率先支援；Mozilla 的 Bugzilla 1360870 一直開著，直到 Firefox 147 標記為 RESOLVED FIXED。隨著 Firefox 147 上線，這個功能在所有主要引擎達到 Baseline newly available（根據 caniuse，全球追蹤使用率約 93%）。

## 視覺對比

| 面向 | 傳統 Service Worker | 模組 Service Worker |
| --- | --- | --- |
| 註冊 | `register('sw.js')`（預設 `type: 'classic'`） | `register('sw.js', { type: 'module' })` |
| 引入機制 | 頂層 `importScripts('./x.js')` | 頂層 `import { x } from './x.js'` |
| 在此 scope 中呼叫 `importScripts()` | 允許 | 拋出 `TypeError`（訊息提示改用 `import`） |
| 動態 `import()` | 不適用 | 規格禁止；呼叫會拋出錯誤 |
| 頂層 await | 不適用 | 刻意不允許 |
| 依賴變更時的更新檢查 | 由 `importScripts()` 目標觸發 | 由匯入的模組內容觸發 |

## 範例

從頁面註冊一個模組 Service Worker：

```js
// page.js
await navigator.serviceWorker.register('es-module-sw.js', { type: 'module' });
```

Service Worker 檔案本身使用靜態 `import` 宣告，所有事件監聽器在頂層同步註冊：

```js
// es-module-sw.js
import { precache } from './cache.js';
import { routeFetch } from './router.js';

self.addEventListener('install', (event) => {
  event.waitUntil(precache(['/', '/app.css', '/app.js']));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(routeFetch(event.request));
});
```

如果同一個檔案呼叫 `importScripts('./legacy.js')`，呼叫會拋出 `TypeError`。MDN 對 `WorkerGlobalScope.importScripts()` 的例外條款寫道：「Thrown if the current `WorkerGlobalScope` is a module (use `import` instead).」同一頁的註記確認：「the method cannot be used in module workers, which instead load dependencies using `import` statements.」

當 `./cache.js` 或 `./router.js` 的內容變更時，瀏覽器會觸發 Service Worker 更新流程。web.dev 寫道：「Scripts imported via ES modules can trigger the service worker update flow if their contents change, matching the behavior of `importScripts()`.」

## 最佳實踐

- **MUST** 在 Service Worker 模組的頂層同步註冊所有事件監聽器。annevk 在 W3C 議題 #1407 提到：第一段範例「won't handle the incoming fetch event (needs to be handled synchronously as the event is dispatched after parsing).」`addEventListener('fetch', ...)` 執行前的任何延遲，都會讓 worker 漏掉進行中的事件。
- **MUST NOT** 在模組 Service Worker 中使用頂層 await。jakearchibald 在議題 #1407 寫道：「service workers that use top-level await would be considered bad practice」；wanderview 補充「top-level await would not be protected by a `waitUntil()`」以及「we probably couldn't automatically keep it alive because then it would become an abuse vector.」
- **MUST NOT** 在 Service Worker 內呼叫 `import()`（動態 import）。MDN 寫道：「Dynamic import is disallowed by the specification — calling `import()` will throw.」web.dev 也確認：「Inside of a service worker, only the static syntax is currently supported.」
- **MUST NOT** 從模組模式的 Service Worker 呼叫 `importScripts()`。MDN 表示該呼叫會拋出 `TypeError`，並在訊息中建議改用 `import`。
- **SHOULD** 為早於模組 SW 支援的瀏覽器準備一份打包後的 fallback Service Worker。web.dev 寫道：「Once you have two versions of your service worker available — one that uses ES modules, and the other that doesn't — you'll need to detect what the current browser supports, and register the corresponding service worker script.」web.dev 也表示「the best practices for detecting support are currently in flux」，並指向 W3C ServiceWorker 議題 #1582 取得目前的建議；截至本文撰寫時，尚無穩定可用的同步特性偵測測試。
- **SHOULD** 把一次性的非同步初始化搬到 `install` 事件中，搭配 `event.waitUntil(...)`，而不是嘗試在頂層做非同步初始化。這是上述「不允許頂層 await」與「同步註冊監聽器」要求的延伸。
- **MAY** 仰賴 import graph 來做 SW 更新檢查。根據 web.dev，匯入的模組內容變更會觸發與 `importScripts()` 目標相同的更新流程。

## 設計思維

議題 #1407 點出一項取捨：起動時的非同步寫作便利度，與 fetch 事件的 TTFB 之間。jakearchibald 寫道，允許頂層 await 會讓 Service Worker 在效能敏感事件上變慢（「Awaiting on anything that isn't needed for TTFB is pretty bad」），並列出兩個選項：「1. Allow it … 2. Disable it … I'm leaning towards 2.」規格作者把寫作便利度的好處讓給可預期的事件延遲與同步監聽器註冊。同樣的理由也說明為何禁止動態 `import()`：Service Worker 的離線保證，仰賴其依賴圖在 install 階段就已知；這也正是傳統 Service Worker 只能在 install 期間呼叫 `importScripts()` 的原因。

## 深入探討

Chromium 的「ES Modules in Service Workers」設計文件寫道：「A module script can be used by setting type to 'module' when registering the Service Worker」以及「ES modules can be imported … statically, using the `import … from '...'` syntax.」同一份文件過去曾註明動態 import「currently blocked … but it will change in the future」；截至本文撰寫時，這項變更尚未在各家瀏覽器落地，MDN 的 `ServiceWorker` 頁面把目前狀態記錄為規格層級的硬性禁止：「Service workers allow static import of ECMAScript modules, if supported, using `import`. Dynamic import is disallowed by the specification — calling `import()` will throw.」

caniuse 記錄的瀏覽器支援時間軸：Chrome 91、Edge 91、Opera 77、Samsung Internet 16.0、Safari 15、Firefox 147。Firefox 147 上線之前，曾在 Firefox 146 嘗試過一次，因為 crash bug 1998332 被退回，之後才重新上線。

## 從 importScripts 遷移

大多數團隊要遷移的對象其實是 Workbox，也就是 Google 廣泛使用的 Service Worker 函式庫，而不是手寫的腳本。Workbox 的 CDN 載入方式 `importScripts('https://storage.googleapis.com/workbox-cdn/releases/<version>/workbox-sw.js')`，以及它的 `generateSW` 建置模式，預設都會產生以 `importScripts()` 為基礎的 Service Worker。

六個步驟。前三步是原始碼變更，後三步涉及打包與發佈。

**1. 把 `importScripts()` 呼叫轉成頂層靜態 `import` 宣告。**

之前：

```js
// classic-sw.js
importScripts('./cache.js', './router.js');
self.addEventListener('install', (event) => {
  event.waitUntil(precache(['/']));
});
```

之後：

```js
// module-sw.js
import { precache } from './cache.js';
import { routeFetch } from './router.js';
self.addEventListener('install', (event) => {
  event.waitUntil(precache(['/']));
});
```

**2. 在頁面端的 `register()` 呼叫加上 `{ type: 'module' }`：**

```js
await navigator.serviceWorker.register('module-sw.js', { type: 'module' });
```

MDN 寫道：「'module' — The loaded service worker is in an ES module and the import statement is available on worker contexts.」預設值仍為 `'classic'`。

**3. 把任何一次性的非同步初始化從頂層搬進 `install` 事件。** 因為頂層 await 不可用，原本以 `importScripts(...)` 接著 `await ...` 處理的初始化，必須改在 install handler 內的 `event.waitUntil(...)` 中執行。

**4. 設定打包工具輸出模組格式。**

- **Webpack 5：** 設定 `experiments.outputModule: true` 與 `output.module: true`。Webpack 文件寫道：「Output JavaScript files as module type. … Disabled by default as it's an experimental feature. … `output.module` is an experimental feature and can only be enabled by setting `experiments.outputModule` to `true`.」其影響為：「When enabled, webpack will set `output.iife` to `false`, `output.scriptType` to `'module'` and `terserOptions.module` to `true` internally.」
- **Vite：** 原生支援。Vite 文件指出「The worker script can also use ESM `import` statements instead of `importScripts()`」、worker 建構式「accepts options, which can be used to create 'module' workers」搭配 `{ type: 'module' }`，以及「by default, the worker script will be emitted as a separate chunk in the production build.」
- **Workbox（`workbox-build`）：** 如果遷移前的 Service Worker 是由 Workbox 的 `injectManifest` 模式產生的，遷移範圍會比整份重寫來得窄。根據 Workbox 文件，`injectManifest`「will generate a list of URLs to precache, and add that precache manifest to an existing service worker file. It will otherwise leave the file as-is」，所以傳入它的原始檔案本來就可以是含有靜態 `import` 宣告的 ES 模組；上面提到的 Webpack 或 Vite 設定接著就能把該原始檔輸出為模組。使用 Workbox `generateSW` 模式（該模式會擁有整份 Service Worker 檔案）的團隊，得先改用 `injectManifest` 才適用這個做法。

**5. 為早於模組 SW 支援的瀏覽器，提供兩份 Service Worker 檔案以涵蓋長尾相容期。** web.dev 寫道：「To accommodate browsers that don't have built-in support, you can run your service worker script through an ES module-compatible bundler to create a service worker that includes all of the module code inline, and will work in older browsers.」該註冊哪一個腳本目前尚無定論：web.dev 表示「the best practices for detecting support are currently in flux」，並指向 W3C ServiceWorker 議題 #1582 取得目前的建議，而非給出單一的同步測試方法。

**6. 驗證更新流程。** 根據 web.dev，模組 import 觸發 SW 更新檢查的方式與 `importScripts()` 目標相同。

關於 W3C 議題 #1407 提出的動態載入模式 —— 在 fetch handler 內以 `const modulePromise = import(useFoo ? './foo' : './bar')` 接著 `const { whatever } = await modulePromise` —— 仰賴動態 `import()`，而規格目前在 Service Worker 中禁止此用法。這個模式描述的是瀏覽器尚未解鎖的未來寫作便利度。今日的等價作法，必須以靜態 import 涵蓋所有可能依賴的聯集來表達。

## 延伸閱讀

- [FEE-307 ES Modules](/zh-tw/JavaScript%20Modern%20Capabilities/307)
- [FEE-1302 Service Workers](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1302)
- [FEE-1304 Workbox 與 PWA 工具鏈](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1304)

## 參考資料

- Jeff Posnick, "ES modules in service workers," web.dev (2021). https://web.dev/articles/es-modules-in-sw
- MDN contributors, "ServiceWorkerContainer.register()," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
- MDN contributors, "WorkerGlobalScope.importScripts()," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
- MDN contributors, "ServiceWorker," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
- caniuse, "ServiceWorker API: Support for ECMAScript modules" (2026). https://caniuse.com/mdn-api_serviceworker_ecmascript_modules
- Chromium project, "ES Modules in Service Workers," chromium.googlesource.com (2026). https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/service_worker/es_modules.md
- W3C ServiceWorker, issue #1407, "Top-level await integration for ServiceWorkers running modules" (2019). https://github.com/w3c/ServiceWorker/issues/1407
- W3C ServiceWorker, issue #831, "Support module service workers, and update for ES6" (2016). https://github.com/w3c/ServiceWorker/issues/831
- W3C ServiceWorker, issue #1582, "Feature detection for type=\"module\" support" (2021). https://github.com/w3c/ServiceWorker/issues/1582
- Mozilla Bugzilla, bug 1360870, "Implement 'module' service workers" (2017). https://bugzilla.mozilla.org/show_bug.cgi?id=1360870
- Mozilla Bugzilla, bug 1998332, "Crash in [@ mozilla::dom::ThreadSafeWorkerRef::Private] when opening Instagram" (2025). https://bugzilla.mozilla.org/show_bug.cgi?id=1998332
- Webpack documentation, "output.module," webpack.js.org (2026). https://webpack.js.org/configuration/output/#outputmodule
- Vite documentation, "Web Workers," vite.dev (2026). https://vite.dev/guide/features.html#web-workers
- Chrome for Developers, "workbox-sw," developer.chrome.com (2026). https://developer.chrome.com/docs/workbox/modules/workbox-sw/
- Chrome for Developers, "workbox-build," developer.chrome.com (2026). https://developer.chrome.com/docs/workbox/modules/workbox-build
