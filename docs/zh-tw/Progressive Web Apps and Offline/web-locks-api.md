---
id: 1314
title: "Web Locks API：跨分頁與 Service Worker 對 Tab 協調"
state: draft
slug: web-locks-api
---

# [FEE-1314] Web Locks API：跨分頁與 Service Worker 對 Tab 協調

:::info
Web Locks API 讓分頁與 Worker 中的程式碼以非同步方式取得具名鎖定，於回呼執行期間持有，並在回呼回傳之 Promise 結算時釋放（MDN Web Locks API；MDN LockManager.request()）。鎖定以來源（origin）為界，範圍涵蓋共用同一儲存區（storage bucket）的 agent，因此 Service Worker 與其視窗可競爭同一鎖定（MDN Web Locks API；W3C Web Locks Working Draft）。此 API 支援 `'exclusive'`（預設）與 `'shared'` 兩種模式以表達 readers-writer 語意，另提供 `ifAvailable`、`signal` 與 `steal` 旗標以涵蓋非阻塞、限時等待與復原情境（W3C Web Locks Working Draft；MDN LockManager.request()）。此 API 於 2022 年 3 月達到 Baseline 廣泛可用（MDN Web Locks API）。鎖定的存活期繫結於回呼回傳之 Promise：提早回傳即釋放，回傳一個永不解析的 Promise 則使鎖定持有至該執行環境的存活期結束（MDN LockManager.request()；W3C Web Locks Explainer）。
:::

## 背景

Web Locks API 在 2018-09-04 由 Pete LePage 於〈New in Chrome 69〉中宣布隨 Chrome 69 推出，定位為一個非同步原語，用於在工作前後取得、持有與釋放鎖定（developer.chrome.com/blog/new-in-chrome-69）。其機制目前由 W3C Web Locks Working Draft 規範，並由 MDN 的 Web Locks API、LockManager、LockManager.request() 與 LockManager.query() 等頁面記錄。如 W3C Web Locks Explainer 所述，所欲填補的缺口是：「使用情境需要跨多個 agent cluster 的協調；Atomics 操作對 SharedArrayBuffer 之操作受限於單一 agent cluster」——因此 Web Locks 補足 `Atomics` 無法承擔的跨 cluster 互斥角色。W3C Working Draft 將鎖定範圍界定為「共用一個儲存區的 agent；可能跨越多個 agent cluster」，這正是 Service Worker 與其視窗能夠競爭同一名稱的根據。據 MDN 所述，鎖定以來源為界進行隔離：「Lock 以來源為範圍；來自 `https://example.com` 分頁所取得的鎖定，對來自 `https://example.org:8080` 分頁所取得的鎖定無任何影響，因為兩者為不同來源。」Baseline 廣泛可用的狀態於 2022 年 3 月達成（MDN Web Locks API）。

## 視覺對比

| 面向 | 行為 | 來源 |
|---|---|---|
| 鎖定存活期 | 繫結於回呼回傳之 Promise；於回呼回傳或拋出時釋放。 | MDN LockManager.request()（Claim 2） |
| `request()` 回傳值 | 一個 `Promise`，於鎖定釋放後以回呼結果 resolve 或 reject，若被中止則 reject。 | MDN LockManager.request()（Claim 3） |
| 預設模式 | `'exclusive'`：阻擋同名稱的所有其他持有者。 | W3C Working Draft（Claim 4） |
| 共享模式 | `'shared'`：可有多個共享持有者並存；exclusive 請求會阻擋直到所有共享持有者釋放。 | W3C Working Draft；MDN Web Locks API（Claims 4-5） |
| `ifAvailable: true` | 跳過排隊；若鎖定已被持有，回呼會以 `null` 執行。 | MDN LockManager.request()（Claim 6） |
| `signal` | 一個 `AbortSignal`，於 abort 時丟棄尚未授予的請求。 | MDN LockManager.request()（Claim 7） |
| `steal: true` | 釋放任何同名鎖定並授予該請求，搶占排隊中的請求；先前持有者失去其互斥保證。 | MDN LockManager.request()；W3C Working Draft §3.2.1（Claims 8-9） |
| 診斷 | `navigator.locks.query()` 回傳 `{ held, pending }` 兩個 `LockInfo`（{ name, mode, clientId }）陣列。 | MDN LockManager.query()（Claims 11-12） |
| 來源範圍 | 僅同來源；不同來源之分頁絕不會競爭。 | MDN Web Locks API（Claim 13） |
| 跨 cluster 範圍 | 在同一來源內，鎖定範圍涵蓋共用一個儲存區的 agent，可能跨越多個 agent cluster（因此 SW 與視窗能夠競爭）。 | W3C Working Draft；W3C Explainer（Claims 14-15） |
| 安全環境 | 僅於安全環境（HTTPS）可用。 | MDN LockManager（Claim 18） |
| Worker 可用性 | 於 Web Worker 中可用（依規範的儲存區範圍亦於 Service Worker 中可用）。 | MDN LockManager；W3C Working Draft（Claims 19, 14） |
| Baseline | 自 2022 年 3 月起廣泛可用。 | MDN Web Locks API（Claim 20） |

## 範例

最基本的取得與釋放形式，引自 MDN LockManager.request()：

```javascript
await navigator.locks.request("my_resource", async (lock) => {
  // The lock was granted.
});
```

依 MDN LockManager.request()（Claim 2）所述，「鎖定會在回呼回傳（或拋出例外）時自動釋放。回呼通常為 async function，這使得鎖定僅在 async function 完全結束時才會釋放。」

readers-writer 模式以 `'shared'` 與 `'exclusive'` 實作，引自 MDN LockManager.request()：

```javascript
async function doRead() {
  await navigator.locks.request("my_resource", { mode: "shared" }, async (lock) => {
    // Read code here.
  });
}
async function doWrite() {
  await navigator.locks.request("my_resource", { mode: "exclusive" }, async (lock) => {
    // Write code here.
  });
}
```

依 MDN Web Locks API（Claim 5）所述：「一個鎖定僅能有一個 \"exclusive\" 持有者，但可同時授予多個 \"shared\" 請求。此特性可用以實作 readers-writer 模式。」

非阻塞探詢以 `ifAvailable`，引自 MDN LockManager.request()：

```javascript
await navigator.locks.request("my_resource", { ifAvailable: true }, async (lock) => {
  if (!lock) {
    // The lock was not granted - get out fast.
    return;
  }
  // The lock was granted...
});
```

依 MDN LockManager.request()（Claim 6）所述：「若為 `true`，鎖定請求僅在尚未被持有時才會被授予。若無法授予，回呼會以 `null` 取代 `Lock` 實例被呼叫。」

限時等待以 `signal`，引自 MDN LockManager.request()：

```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 200);
try {
  await navigator.locks.request("my_resource", { signal: controller.signal }, async (lock) => {
    // The lock was acquired!
  });
} catch (ex) {
  if (ex.name === "AbortError") { /* timed out */ }
}
```

依 MDN LockManager.request()（Claim 7）所述，`AbortSignal`「若有指定且 `AbortController` 被中止，鎖定請求若尚未被授予則會被丟棄。」

以 `query()` 進行診斷，引自 MDN LockManager.query()：

```javascript
const state = await navigator.locks.query();
for (const lock of state.held) { console.log(`held: ${lock.name}, ${lock.mode}`); }
for (const req of state.pending) { console.log(`pending: ${req.name}, ${req.mode}`); }
```

依 MDN LockManager.query()（Claims 11-12）所述，已 resolve 的值包含 `held` 陣列與 `pending` 陣列，兩者皆為 `LockInfo` 物件，各帶有 `name`、`mode`（`"exclusive"` 或 `"shared"`）與 `clientId`（與 `Client.id` 相符）。

## 最佳實踐

- **MUST** 在來源內依邏輯資源切分鎖定名稱，因鎖定以來源為範圍，其他來源的分頁無法干擾（MDN Web Locks API，Claim 13）。
- **MUST** 於安全環境（HTTPS）呼叫此 API，因 MDN LockManager（Claim 18）將 Web Locks 列為僅於安全環境可用之功能。
- **MUST NOT** 同時組合互斥旗標：`steal` 與 `ifAvailable` 同時出現，或 `signal` 與 `steal`、`ifAvailable` 任一同時出現，皆會依 MDN LockManager.request()（Claim 10）拋出 `NotSupportedError`。同一來源亦指出 `name` 開頭為連字號也會拋例外。
- **MUST** 將 `steal: true` 視為僅供復原之用。依 W3C Working Draft §3.2.1（Claim 9），偷取適用於「某協調點（如 Service Worker）判定持有鎖定的分頁已不再回應」的情境，並指出「先前持有鎖定的程式碼將不再具備獨佔資源存取的保證。」
- **SHOULD** 從回呼回傳工作之 Promise，使鎖定持有時間恰好涵蓋工作期間，並於完成或例外時釋放，依 MDN LockManager.request()（Claim 2）。
- **SHOULD** 對讀取路徑使用 `'shared'`、寫入路徑使用 `'exclusive'`，以實作 MDN Web Locks API（Claim 5）所指 readers-writer 模式。
- **SHOULD** 當所欲行為為「忙碌時跳過」時，優先採用 `ifAvailable: true` 而非短間隔輪詢，依 MDN LockManager.request()（Claim 6）。
- **SHOULD** 當呼叫端無法無限等待時，以 `AbortSignal` 搭配於逾時觸發 abort 的 controller 設定等待上限，依 MDN LockManager.request()（Claim 7）。
- **MAY** 透過於分頁存活期持有 exclusive 鎖定來實作 leader election，W3C Web Locks Explainer（Claim 17）支持此模式：「指定一個『主要分頁』。此分頁是唯一應執行某些操作者……它持有一個鎖定且永不釋放。」MDN Web Locks API（Claim 16）給出典型範例：以 `"my_net_db_sync"` 鎖定，使僅有一個分頁負責同步網路與 IndexedDB。
- **MAY** 呼叫 `navigator.locks.query()` 進行診斷，依 MDN LockManager.query()（Claim 11），其回傳該來源 `held` 與 `pending` 的快照。

## 設計思維

Web Locks 以即時性換取協調性。無法被授予的請求會加入以名稱分組的隊列等待，因此呼叫端若不可阻塞，需採用 `ifAvailable: true`（忙碌時跳過，Claim 6）或 `signal`（逾時後丟棄，Claim 7）。預設的 `'exclusive'` 模式提供最強保證且心智模型最簡單；`'shared'` 則用於需要讀取並行的情境（Claim 5），其代價是必須將每條程式碼路徑分類為讀者或寫者。

跨 cluster 範圍（W3C Explainer，Claim 15）使 Web Locks 與 `Atomics` 對 `SharedArrayBuffer` 的操作有所區隔：鎖定可橫跨 agent cluster，因此 Service Worker 與其視窗能夠競爭同一名稱（W3C Working Draft，Claim 14）。其代價在於鎖定狀態存在於瀏覽器以來源為界的協調層，而非共享記憶體中，因此語意僅為非同步（`request()` 之回呼接收已授予的 `Lock`；此 API 並無同步版本）。

`steal: true` 是當隊列假設持有者仍存在時的明示逃生口。依 W3C Working Draft §3.2.1（Claim 9），其代價是先前持有者其後將失去互斥執行保證——意即復原程式碼必須先重置被偷取鎖定原本所保護的共享資源，搶占的執行環境才得以繼續。

## 深入探討

授予演算法規範於 W3C Working Draft §2.5 與 §4.4（Claim 22）。當沒有同名稱的已持有鎖定產生衝突時，請求即可被授予：對 `'exclusive'` 而言，不可有任何同名的已持有鎖定；對 `'shared'` 而言，不可有任何同名的已持有鎖定處於 `'exclusive'` 模式。隊列以對頭優先方式處理：「每個資源僅評估隊列中的第一個請求；若任一請求無法被授予則停止處理。」對頭阻塞意味著隊列開頭一個無法被授予的請求，會卡住同名稱後續本可被授予的請求；此為規範授予語意的固有特性。

診斷時的鎖定識別資訊由 `LockInfo` 提供。依 MDN LockManager.query()（Claim 12），每筆條目暴露 `name`、`mode`（`"exclusive"` 或 `"shared"`）與 `clientId`——並指出「`clientId` ……與 `Client.id` 為相同值」，此將鎖定狀態關聯至特定 client（視窗、worker 或 service worker client），使 Service Worker 能將已持有鎖定與所屬分頁進行對應。

依 MDN LockManager.request()（Claim 3），此方法回傳一個 `Promise`，在鎖定釋放後以回呼結果 resolve，若請求被中止則 reject。結合 Claim 2（鎖定於回呼回傳或拋出時釋放），這構成了結構化並行的形態：鎖定的存活期恰好等於回呼之 Promise 的詞法作用域，且不會有忘記呼叫的 `unlock()`。

## 鎖取得模式

研究文件列舉七種 `mode` 加旗標的典型組態。每一列將真實協調需求對應到 MDN LockManager.request()（Claims 2-10）與 W3C Web Locks Explainer（Claim 17）所提供的 API 表面。held 與 pending 的區別屬執行期視角：請求僅在規範的授予演算法（Claim 22）放行時才成為 held 條目；在此之前置於 pending 隊列中，並可透過 `navigator.locks.query()`（Claim 11）觀察。

| 使用情境 | mode | flags | 原因 |
|---|---|---|---|
| 僅一個分頁更新 auth token | `'exclusive'` | （無）——首位呼叫者勝出，其餘排隊並於完成時 resolve | 預設 mutex；達成工作去重，因為排隊回呼會繼承已更新的 token。 |
| 跨分頁序列化 IDB 寫入 | `'exclusive'` | （無） | 包覆 IDB transaction，使同一時間僅有一個分頁處於寫入中。 |
| 多讀者單寫者（快取設定） | 讀者 `'shared'`，寫者 `'exclusive'` | （無） | readers-writer 模式（MDN Web Locks API，Claim 5）。 |
| 忙碌時跳過的背景更新 | `'exclusive'` | `ifAvailable: true` | 若另一分頁已在更新，直接退出而不排隊（Claim 6）。 |
| 限時等待的操作 | `'exclusive'` | `signal: AbortSignal` 於逾時時 abort | 若未在 N 毫秒內被授予則丟棄請求（Claim 7）。 |
| Leader election（永久持有） | `'exclusive'` | 回呼回傳永不解析的 Promise | 依 W3C Explainer（Claim 17）；次要分頁排隊等待晉升。 |
| 從卡住的持有者復原 | `'exclusive'` | `steal: true` | 先重置共享資源狀態；先前持有者失去其互斥保證（Claim 9）。 |
| 衝突防護（被拒絕的組合） | n/a | `steal+ifAvailable` 被拒絕；`signal+steal` 與 `signal+ifAvailable` 被拒絕 | 規範禁止此等組合；拋出 `NotSupportedError`（Claim 10）。 |

held 與 pending 的狀態機：一次 `request()` 呼叫進入該名稱的 pending 隊列。授予演算法（W3C Working Draft §2.5/§4.4，Claim 22）僅檢查每個名稱隊列的頭部，並在依模式規則無已持有鎖定衝突時放行。放行時，條目移至 held，使用者提供的回呼開始執行；當回呼回傳之 Promise 結算時，鎖定離開 held（Claim 2）。`navigator.locks.query()`（Claim 11）回傳呼叫當下 `held` 與 `pending` 兩陣列的快照。

`ifAvailable: true` 短路了 pending 步驟：若有任何衝突的鎖定處於 held，回呼即以 `null` 被呼叫，而非進入隊列（Claim 6）。`signal` 將條目保留於 pending，但於 abort 時將其移除，並以 abort reason reject `request()`（Claim 7）。`steal: true` 同時繞過隊列與授予規則：強制釋放任何同名的已持有鎖定，搶占排隊中的請求並授予新請求（Claim 8）——其代價如 Claim 9 所述，先前持有者其後失去互斥執行保證。

## 延伸閱讀

- [BroadcastChannel for cross-tab messaging](/zh-tw/Browser%20APIs%20and%20Standards/414) — BroadcastChannel 為廣播式 pub-sub：來源內每個訂閱者都會收到每則發出的訊息。Web Locks 為互斥：在 `'exclusive'` 下單一持有者，或在 `'shared'` 下的 readers-writer。常見模式是兩者並用——以 BroadcastChannel 公告「auth token 已更新」，同時以 Web Locks 確保僅一個分頁負責更新。
- [Service Workers for offline](/zh-tw/Progressive%20Web%20Apps%20and%20Offline/1302) — 依 W3C Working Draft（Claim 14），鎖定範圍涵蓋「共用一個儲存區的 agent；可能跨越多個 agent cluster」，因此 Service Worker 與其控制的視窗可競爭同一鎖定名稱。此性質啟用 MDN Web Locks API（Claim 16）所述以 `"my_net_db_sync"` 為 leader 的 SW 與分頁協調模式。

## 參考資料

- W3C, "Web Locks API," W3C Working Draft (n.d.). https://www.w3.org/TR/web-locks/
- MDN contributors, "Web Locks API," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
- MDN contributors, "LockManager," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/LockManager
- MDN contributors, "LockManager.request()," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request
- MDN contributors, "LockManager.query()," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/LockManager/query
- W3C Web Locks editors, "Web Locks API Explainer," W3C web-locks GitHub repository (n.d.). https://github.com/w3c/web-locks/blob/main/EXPLAINER.md
- Pete LePage, "New in Chrome 69," developer.chrome.com (2018). https://developer.chrome.com/blog/new-in-chrome-69
