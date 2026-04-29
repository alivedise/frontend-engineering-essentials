---
id: 1313
title: "Background Fetch API：長時間下載的背景任務"
state: draft
slug: background-fetch
---

# [FEE-1313] Background Fetch API：長時間下載的背景任務

:::info
Background Fetch API 用來管理可能耗時較久的下載，例如電影、音訊檔案、軟體套件（MDN）。頁面可以關閉、Service Worker 可以閒置，瀏覽器仍會代為持續傳輸，並在系統下載介面顯示進度與取消按鈕（Jake Archibald, 2018；WICG editor's draft）。Background Sync 處理的是另一種形態的工作——當網路恢復時重送的短小排隊變更——而瀏覽器若任務執行過久就會將其終止（MDN）。本文說明如何從頁面發起 Background Fetch、如何在成功處理器中將回應落地到 Cache API，以及如何在 Fetch、Sync 與更廣的 Service Worker 背景任務家族之間做出取捨。
:::

## 背景

Background Fetch API 解決了 MDN 文件中明確指出的問題：「當 Web 應用程式需要使用者下載大型檔案時，這通常會造成困擾，因為使用者必須持續停留在頁面才能完成下載。」平台先前用於 Service Worker 背景任務的機制 Background Sync 並未涵蓋此情境。MDN 指出，Background Sync「無法用於下載大型檔案這類長時間任務。Background Sync 要求 Service Worker 必須持續存活直到 fetch 完成，而為了節省電力並避免不必要的背景任務，瀏覽器在某個時點會終止任務。Background Fetch API 解決了這個問題。」Jake Archibald 在 2018 年的 Chrome Developers 文章中描繪了同一條界線：Background Sync 期間 Service Worker 必須保持存活，這對於發送一則訊息沒問題，但長時間任務會被瀏覽器終止。Background Fetch 為電影、Podcast、軟體、AI 模型權重、遊戲關卡而設計——這些是由多個網路資源組成、但對使用者而言屬於單一邏輯資產的套件（Archibald, 2018；Steiner, web.dev）。

## 視覺對比

| 面向 | Background Fetch | Background Sync |
|---|---|---|
| **發起位置** | 主執行緒／頁面呼叫 `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)` | 頁面呼叫 `registration.sync.register(tag)`；任務於 Service Worker 的 `sync` 事件中執行 |
| **使用情境形態** | 大型、長時間執行的 GET：電影、Podcast、遊戲關卡、AI 模型權重、軟體套件 | 小型、可重試的變更操作：離線時無法送出而排隊的 POST/PATCH（例如已撰寫的郵件或聊天訊息） |
| **使用者可見 UI** | 瀏覽器繪製的系統下載 UI，含標題、圖示、位元組進度、取消按鈕；UI 無法被無聲關閉，且必須顯示來源 origin | 不可見：網路恢復後完全在 Service Worker 內執行；無平台 UI |
| **生命週期** | 在所有頁面與 Worker 關閉後仍持續運作；瀏覽器主導傳輸直到完成。成功時會喚醒 SW 處理 `backgroundfetchsuccess`。 | 受限於 Service Worker 的存活期間。SW 必須在排隊任務期間保持存活；任務過長時瀏覽器會將其終止。 |

## 範例

頁面端發起的呼叫，取自 MDN 的 Podcast 範例。頁面以 id、兩個 URL、標題、圖示，以及 `downloadTotal` 註冊一次 fetch，使系統 UI 能呈現精準的位元組進度：

```js
const swReg = await navigator.serviceWorker.ready;
const bgFetch = await swReg.backgroundFetch.fetch(
  'my-fetch',
  ['/ep-5.mp3', 'ep-5-artwork.jpg'],
  {
    title: 'Episode 5: Interesting things.',
    icons: [{ sizes: '300x300', src: '/ep-5-icon.png', type: 'image/png' }],
    downloadTotal: 60 * 1024 * 1024,
  },
);
```

如 Chrome Developers 文章所述：「若使用者在步驟 1 之後關閉了你網站的所有頁面，沒關係，下載會繼續。」WICG 規範重申了同樣的特性：「即使使用者關閉所有指向該 origin 的視窗與 Worker，仍允許 fetch（請求與回應）繼續。」傳輸過程中，「瀏覽器會以使用者可見的方式執行 fetch，向使用者顯示進度並提供取消下載的方式」（MDN）。

當所有個別請求都完成後，瀏覽器會喚醒 Service Worker 並派送 `backgroundfetchsuccess`。處理器從 `event.registration` 取出回應並儲存——通常存入 Cache API——並可呼叫 `event.updateUI()` 更新系統 UI：

```js
self.addEventListener('backgroundfetchsuccess', (event) => {
  const bgFetch = event.registration;
  event.waitUntil(async function () {
    const cache = await caches.open('movies');
    const records = await bgFetch.matchAll();
    await Promise.all(records.map(async (record) => {
      const response = await record.responseReady;
      await cache.put(record.request, response);
    }));
    await event.updateUI({ title: 'Episode 5 ready to listen!' });
  }());
});
```

Service Worker 可觀察到的四個生命週期事件分別是 `backgroundfetchsuccess`、`backgroundfetchfail`、`backgroundfetchabort` 與 `backgroundfetchclick`（MDN）。另一項使此 API 與一般 `fetch()` 區別的能力：「Background Fetch API 允許使用者離線時即啟動 fetch，連線恢復後便會開始。若使用者再次離線，流程會暫停直到再度連線」（MDN）。

## 最佳實踐

- **MUST** 在 `BackgroundFetchOptions` 中設定 `downloadTotal`，使瀏覽器系統 UI 能呈現精準的位元組進度。WICG 規範在選項字典上定義了 `downloadTotal`，MDN 範例也基於此理由傳入位元組總數。沒有它，UI 無法顯示傳輸進度。
- **MUST** 分別處理 `backgroundfetchfail` 與 `backgroundfetchabort`。MDN 將兩者定義為獨立事件：`fail` 在「Background Fetch 操作中至少有一個請求失敗時」觸發，`abort` 在「Background Fetch 操作被使用者或應用程式取消時」觸發。清理分支不同——失敗時的部分 cache 狀態通常會被丟棄；abort 由使用者主動觸發，可能值得呈現不同的訊息。
- **MUST** 在 `backgroundfetchsuccess` 處理器內、registration 被回收前取出回應。MDN 指出：「在此事件的處理器中，Service Worker 可以擷取並儲存回應（例如使用 `Cache` API）。要存取回應資料，Service Worker 使用事件的 `registration` 屬性。」將工作包在 `event.waitUntil(...)` 中可讓 Service Worker 維持足夠的存活時間以落地每個回應。
- **SHOULD** 將 Background Fetch 作為漸進增強功能上線。caniuse 顯示 Chrome 自 74 起支援、Edge 自 79 起支援，而 Firefox 與 Safari 完全不支援。MDN 將此功能標記為「有限可用……非 Baseline，因為它在某些最廣為使用的瀏覽器中無法運作」。Steiner 的 web.dev 文章對 AI 模型下載也採取同樣的立場：在支援的環境使用此 API「顯著改善使用者體驗」，同時保留一般 `fetch()` 作為退路。
- **SHOULD** 將傳給 `fetch(id, ...)` 的唯一 `id` 作為後續狀態的查詢鍵。`BackgroundFetchManager` 是「以 Background Fetch ID 為鍵、`BackgroundFetchRegistration` 物件為值的對應」（MDN），其中 `get(id)` 回傳進行中的 registration，`getIds()` 列出所有 ID。
- **MAY** 從 `backgroundfetchsuccess` 處理器呼叫 `event.updateUI()`，在完成後變更標題或圖示。MDN：「Service Worker 可以更新該 UI 以顯示操作已成功完成。為此，處理器會呼叫事件的 `updateUI()` 方法，傳入新的標題與／或圖示。」

## 設計思維

Background Fetch 的 UI 是強制顯示且不可關閉的，這是規範刻意的設計。WICG 規範要求「UI 必須顯著顯示 bgFetch 的 Service Worker registration scope URL 之 origin」，且「在 bgFetch 的結果尚未脫離空字串前……UI 不得在未中止的情況下被關閉」。將其與生命週期保證——「即使使用者關閉所有指向該 origin 的視窗與 Worker」fetch 仍持續——配對來看，取捨便清晰可見。瀏覽器讓頁面取得真正長壽命的背景工作能力，交換的是一個顯示來源 origin、並提供使用者終止開關的常駐 UI。正是這組配對讓此 API 可以延續超過頁面生命週期；若沒有可見 UI，相同的生命週期保證將成為隱藏背景活動的攻擊面。

## Background Fetch 與 Background Sync 的取捨

選擇 Background Fetch 還是 Background Sync（以及延伸出的 Periodic Background Sync，已於 FEE-1307 涵蓋）的起點，是工作本身的形態。下方的四列矩陣列出決策面向。

| 面向 | Background Fetch | Background Sync |
|---|---|---|
| **發起位置** | 主執行緒／頁面呼叫 `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)` | 頁面呼叫 `registration.sync.register(tag)`；實際工作於 Service Worker 的 `sync` 事件中執行 |
| **使用情境形態** | 大型、長時間執行的 GET：電影、Podcast、遊戲關卡、AI 模型權重、軟體套件 | 小型、可重試的變更操作：離線時無法送出而排隊的 POST/PATCH，例如已撰寫的郵件或聊天訊息 |
| **使用者可見 UI** | 瀏覽器繪製的系統下載 UI，含標題、圖示、位元組進度、取消按鈕；UI 無法被無聲關閉，且必須顯示來源 origin | 不可見：網路恢復後完全在 Service Worker 內執行；無平台 UI |
| **生命週期** | 在所有頁面與 Worker 關閉後仍持續運作；由瀏覽器（而非 Service Worker）主導傳輸直到完成；成功時 Service Worker 會被喚醒以處理 `backgroundfetchsuccess` 事件 | 受限於 Service Worker 的存活期間——SW 必須在排隊任務期間保持存活；任務過長時瀏覽器會將其終止；於「網路恢復可用時」觸發 |

**發起位置。** Background Fetch 從頁面透過 `serviceWorkerRegistration.backgroundFetch.fetch(id, requests, options)` 發起，呼叫回傳一個 `BackgroundFetchRegistration`（MDN）。Background Sync 同樣由頁面註冊，透過 `registration.sync.register(tag)`，但實際工作會在瀏覽器判斷網路條件足夠時，於 Service Worker 的 `sync` 事件處理器內稍後執行。MDN 的描述：「電子郵件用戶端應用程式可以讓使用者隨時撰寫並寄出訊息，即使裝置沒有網路連線。應用程式前端僅需註冊一個 sync 請求，當網路恢復時 Service Worker 即被喚醒並處理同步。」

**使用情境形態。** Archibald 的文章直接點出 Background Fetch 的領地：「如果你需要下載可能耗時很久的東西，例如電影、Podcast、遊戲關卡，該怎麼辦？」一個遊戲關卡「可能由許多 JavaScript、影像、音訊資源組成。但對使用者而言，那只是『電影』或『關卡』而已。」Steiner 的文章將此清單延伸到 AI 模型權重：「如果使用者失去網路連線或關閉你的網站／Web 應用程式，已下載一部分的模型檔案就會遺失，回到頁面後得從頭開始。」Background Sync 的使用情境正好相反：應用程式已嘗試送出但失敗的小型變更。MDN：「用途可能包含當應用程式被使用時無法送出的請求改在背景送出。」

**使用者可見 UI。** Background Fetch 在規範上就要顯眼。MDN：「瀏覽器隨後會以使用者可見的方式執行 fetch，向使用者顯示進度並提供取消下載的方式。」WICG 規範補上設計思維中已引述的綁定條件：origin 必須顯示、UI 不可被無聲關閉。Background Sync 不顯示任何東西——工作在網路恢復後於 Service Worker 內進行，使用者只看到應用程式自身稍後決定要呈現的內容（例如一則「訊息已送出」的確認）。

**生命週期。** Background Fetch 的特性是「即使使用者關閉所有指向該 origin 的視窗與 Worker，仍允許 fetch（請求與回應）繼續」（WICG）。Background Sync 則要求 Service Worker 必須在排隊任務期間保持存活；如同 MDN 對長時間任務情境的說明：「瀏覽器在某個時點會終止任務。」若工作是耗時數分鐘或數小時的位元組傳輸，能夠存活下來的是 Background Fetch；若工作是網路恢復後一兩秒內就能完成的少量排隊請求，能夠執行的是 Background Sync。

## 延伸閱讀

- [FEE-1306 Push Notifications & Background Sync](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1306) — 同一家族（Service Worker 驅動的背景工作），涵蓋用於重試排隊變更的 `sync` 與用於伺服器主動喚醒的 Push。短小的排隊變更使用 Sync；大型資產使用 Fetch。
- [FEE-1307 Periodic Background Sync](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1307) — 背景任務家族的第三位成員，由瀏覽器排程的週期性更新。
- [FEE-617 IndexedDB / Dexie](/zh-tw/State%20Management%20and%20Data%20Flow/617) — Background Fetch 產出的是 `Response` 物件；要選擇將其落地到何處。HTTP 形態的資產走 Cache API，後續還要處理的 blob 走 IndexedDB。

## 參考資料

- MDN contributors, "Background Fetch API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API
- MDN contributors, "BackgroundFetchManager," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchManager
- MDN contributors, "BackgroundFetchEvent," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/BackgroundFetchEvent
- MDN contributors, "ServiceWorkerGlobalScope: backgroundfetchsuccess event," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/backgroundfetchsuccess_event
- MDN contributors, "Background Synchronization API," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- WICG, "Background Fetch," editor's draft. https://wicg.github.io/background-fetch/
- Jake Archibald, "Introducing Background Fetch," Chrome Developers blog (2018). https://developer.chrome.com/blog/background-fetch
- Thomas Steiner, "Reliably download large files with Background Fetch," web.dev. https://web.dev/articles/background-fetch-ai
- caniuse, "ServiceWorkerRegistration: backgroundFetch property." https://caniuse.com/mdn-api_serviceworkerregistration_backgroundfetch
