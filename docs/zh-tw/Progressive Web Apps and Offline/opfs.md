---
id: 1310
title: "高效能本地儲存的 Origin Private File System (OPFS)"
state: draft
slug: opfs
---

# [FEE-1310] 高效能本地儲存的 Origin Private File System (OPFS)

:::info
Origin Private File System (OPFS) 是 File System API 中的一個沙箱化、依來源（per-origin）隔離的儲存端點，提供檔案與目錄的 handle，並完全不涉及使用者可見的檔案系統。OPFS 透過 `navigator.storage.getDirectory()` 於 2023 年 3 月達到 Baseline Widely available；其僅限 worker 的同步 handle（`FileSystemSyncAccessHandle`）則是 SQLite-WASM 能在瀏覽器中持久化的關鍵基礎。本文說明 OPFS 的 API 表面、比較同步與非同步介面，並以 Notion 在 WASM SQLite 部署中的生產環境資料作為佐證。
:::

## 背景

OPFS 由 WHATWG File System 規範定義，作為 File System API 的一部分提供的儲存端點，「對頁面所屬的 origin 為私有，且不像一般檔案系統那樣對使用者可見」（MDN, *Origin private file system*）。瀏覽器會把 OPFS 內容持久化到磁碟，但應用程式「不應期望能找到一對一對應的建立檔案。OPFS 並不打算讓使用者看得見」（MDN）。由於這個檔案系統永遠不會脫離 origin 沙箱，「存取 OPFS 中的檔案不需要權限提示與安全檢查」（MDN），這一點將 OPFS 與面向使用者的 File System Access picker 區隔開來。

入口點是 `navigator.storage.getDirectory()`，會回傳一個以每個 origin 各自的空目錄為根的 `FileSystemDirectoryHandle`（MDN, *StorageManager.getDirectory*）。MDN 將 `getDirectory()` 列為 Baseline Widely available，「自 2023 年 3 月起跨瀏覽器可用」。僅限 worker 的同步 handle 緊接著也跟上：WebKit 在 macOS 12.2 / iOS 15.2 為 OPFS 推出 `FileSystemSyncAccessHandle`（Liu, WebKit 部落格, 2023），與 Chromium（Chrome 102）和 Firefox 一起完成跨引擎可用性。

## 視覺對比

| API 表面 | 執行情境 | 鎖定模型 | 延遲特性 | 代表性使用場景 |
|---|---|---|---|---|
| `navigator.storage.getDirectory()` | Window + Worker | n/a（回傳 root handle） | 非同步 | 啟動 OPFS root（MDN） |
| `FileSystemFileHandle.createWritable()` | Window + Worker | 共享 | 非同步 | 串流寫入、多個協作寫入者（WHATWG FS 規範） |
| `FileSystemFileHandle.createSyncAccessHandle()` | 僅限 Dedicated Worker | 獨佔 | 同步 read/write/flush | 高吞吐後端，例如 SQLite-WASM（WHATWG FS 規範；WebKit 部落格, 2023） |

## 範例

最具代表性的生產級範例是把 SQLite-WASM 持久化在 OPFS 上。SQLite 自家的持久化文件直白地陳述了這項需求：「OPFS 提供少數幾個本 API 所需要的同步 API。檔案可以以非同步模式開啟而不需任何鎖定，但要取得同步 API 的存取權，必須使用 OPFS 所稱的 'sync access handle'」（sqlite.org/wasm）。SQLite 的 C 層 API 並非由 promise 驅動，所以 VFS 實作需要對底層檔案進行同步讀寫。Chrome 團隊把這個組合定位為長久承諾、用以取代已棄用的 Web SQL 的方案：「以 Origin Private File System 為持久化後端的 SQLite Wasm 函式庫，正是我們對這項承諾的兌現」，以及「此方法的同步特性帶來效能上的優勢」（Steiner, Chrome for Developers 部落格, 2023）。

Notion 工程團隊發布了目前公開文件中規模最大的生產環境資料點。他們指出：「每個 Web Worker 透過 OPFS SyncAccessHandle Pool VFS 實作存取 SQLite 資料庫，這項實作在所有主流瀏覽器上都能運作。」量測結果為：「採用 SQLite 在所有現代瀏覽器中將頁面導覽時間提升了 20%」，在地理位置較遠的地區則有 28-33% 的改善（Notion 工程部落格）。

最簡的 OPFS 啟動程式如下：

```js
// Main thread: get an OPFS directory handle and a file handle.
const root = await navigator.storage.getDirectory();
const fileHandle = await root.getFileHandle('cache.bin', { create: true });

// Pass the file handle to a dedicated worker for synchronous I/O.
const worker = new Worker('./io-worker.js', { type: 'module' });
worker.postMessage({ fileHandle });
```

```js
// io-worker.js — runs inside a dedicated worker.
self.onmessage = async ({ data: { fileHandle } }) => {
  const access = await fileHandle.createSyncAccessHandle();
  const buf = new Uint8Array(1024);
  access.read(buf, { at: 0 });
  access.write(buf, { at: 0 });
  access.flush();
  access.close();
};
```

Worker 邊界是必要條件：WHATWG 規範以 `[Exposed]=DedicatedWorker interface FileSystemSyncAccessHandle` 限定該介面的暴露範圍，MDN 也說明此類別「只能在 dedicated Web Workers 內存取（以避免其方法在主執行緒上造成阻塞），並僅作用於 origin private file system 中的檔案」。

## 最佳實踐

- **MUST** call `createSyncAccessHandle()` only from a dedicated worker：WHATWG FS 規範以 `[Exposed]=DedicatedWorker` 限定此介面，MDN 也記錄相同限制，目的是避免阻塞主執行緒。
- **MUST** treat `NoModificationAllowedError` as the contention signal when opening a `readwrite` sync access handle：MDN, *createSyncAccessHandle* 寫道：「當瀏覽器無法取得對應檔案的鎖時即會拋出。可能原因是 mode 設為 readwrite 並嘗試同時開啟多個 handle。」
- **MUST** call `close()` on a sync access handle when finished：WHATWG FS 規範指出，建立 sync access handle「會對該 file entry 取得獨佔鎖……在 access handle 關閉之前，這會阻止為該 entry 再建立其他 FileSystemSyncAccessHandle 或 FileSystemWritableFileStream」。
- **SHOULD** pick the lock model deliberately：當多個寫入者協同操作時選擇共享鎖（`FileSystemWritableFileStream`），當單一路徑需要端到端控制時選擇獨佔鎖（`FileSystemSyncAccessHandle`）。WHATWG FS 規範：「FileSystemWritableFileStream 需要共享鎖，而 FileSystemSyncAccessHandle 需要獨佔鎖。」
- **SHOULD** budget OPFS against the same StorageManager quota as other origin storage and observe usage via `navigator.storage.estimate()`：MDN：「OPFS 與其他依 origin 切分的儲存機制（例如 IndexedDB API）一樣，受瀏覽器儲存配額限制。」
- **MAY** treat clearing site data as a destructive event for OPFS contents：MDN：「清除網站儲存資料會刪除 OPFS。」只快取可重新衍生資料的應用程式不受影響；儲存使用者撰寫位元組的應用程式則需要提供匯出路徑。

## 設計思維

OPFS 帶來的取捨在於鎖定模型對上拓樸結構。`FileSystemWritableFileStream` 可被共享，因此多個參與者可以以協作語意串流寫入同一個檔案，但它不提供同步原語。`FileSystemSyncAccessHandle` 提供同步的 `read`、`write`、`flush`、`close`、`getSize` 與 `truncate`——也就是 SQLite-WASM 所需的形狀——但代價是在 handle 整個生命週期內持有獨佔鎖（WHATWG FS 規範）。Notion 採用「SyncAccessHandle Pool VFS」的選擇便彰顯了這個後果：它能在所有主流瀏覽器運作，而由於獨佔鎖無法共享，它對資料庫檔案強制了一次只能由一個分頁存取的模型（Notion 工程部落格）。

第二個校準點是交易範圍。WHATWG 規範僅以鎖作為原語；跨檔案的多檔原子性由呼叫端自行負責。需要跨檔案交易性分組的應用程式，會在獨佔的 sync handle 之上自行構築，或是把寫入序列化到單一擁有者 worker 中執行。

## 同步與非同步 API 表面

兩種 API 形狀在執行情境、鎖定模型與延遲三個面向上分歧，而這個分歧決定了 OPFS 程式碼能存在於哪裡。

非同步介面在 window 與 worker 兩種情境中都可達。window 端流程使用 `navigator.storage.getDirectory()` 取得 `FileSystemDirectoryHandle`，再以 `getFileHandle(name, { create: true })` 取得 `FileSystemFileHandle`，最後以 `getFile()` 進行讀取或以 `createWritable()` 進行串流寫入。`createWritable()` 取得共享鎖，因此多個協作寫入者可以對同一個檔案合作（WHATWG FS 規範：「FileSystemWritableFileStream 需要共享鎖」）。這些操作都是 promise-based，能與主執行緒 UI 程式碼整合而不需擔心阻塞，並付出每次呼叫的典型非同步開銷。

同步介面則刻意地較為窄小。`FileSystemFileHandle.createSyncAccessHandle()` 回傳一個 `FileSystemSyncAccessHandle`，其方法——`read(buffer, options)`、`write(buffer, options)`、`flush()`、`close()`、`getSize()`、`truncate(newSize)`——皆為同步呼叫，沒有 promise 包裝。WHATWG FS 規範直接點出動機：「回傳的 FileSystemSyncAccessHandle 提供同步方法。這讓非同步操作開銷較高的執行情境（例如 WebAssembly）能取得更高效能。」介面有所限縮：`[Exposed]=DedicatedWorker interface FileSystemSyncAccessHandle`（WHATWG FS 規範），並由 MDN 重申該類別「只能在 dedicated Web Workers 中存取……並僅作用於 origin private file system 中的檔案」。

鎖定模型是第二個差異軸。Sync access handle 為獨佔：「建立 FileSystemSyncAccessHandle 會對該 file entry 取得獨佔鎖……在 access handle 關閉之前，這會阻止為該 entry 再建立其他 FileSystemSyncAccessHandle 或 FileSystemWritableFileStream」（WHATWG FS 規範）。對同一個檔案開啟第二個 `readwrite` sync access handle 會觀察到 `NoModificationAllowedError`（MDN, *createSyncAccessHandle*）。相對地，非同步可寫串流取得共享鎖，允許多個寫入者並存。

效能特性源自上述形狀。SQLite 的持久化文件記載 C 層 VFS 無法由 promise 驅動，因此 SQLite-WASM 將自身寄宿於 sync handle 上：「要取得同步 API 的存取權，必須使用 OPFS 所稱的 'sync access handle'」（sqlite.org/wasm）。Chrome 團隊把由此產生的吞吐量直接歸因於同步形狀：「此方法的同步特性帶來效能上的優勢」（Steiner, Chrome for Developers 部落格, 2023）。實務上的提升空間在 Notion 的量測中顯現——現代瀏覽器中頁面導覽快上 20%，地理位置較遠的地區快上 28-33%，底層基礎正是僅限 worker 的 OPFS SyncAccessHandle Pool VFS（Notion 工程部落格）。

## 延伸閱讀

- [File System Access API](/zh-tw/Browser%20APIs%20and%20Standards/410) — 使用者可見的 picker 與檔案 handle，是 OPFS 沙箱在公開面的對應物
- [IndexedDB and Dexie](/zh-tw/State%20Management%20and%20Data%20Flow/617) — 結構化記錄儲存；當工作負載是原始位元組或像 SQLite-WASM 這類同步 VFS 時，改用 OPFS
- [Persistent Storage and StorageManager](/zh-tw/Browser%20APIs%20and%20Standards/404) — OPFS 與其他 origin 儲存共享的配額與持久化模型

## 參考資料

- WHATWG, "File System Standard," WHATWG (living standard). https://fs.spec.whatwg.org/
- MDN contributors, "Origin private file system," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- MDN contributors, "FileSystemSyncAccessHandle," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle
- MDN contributors, "FileSystemFileHandle.createSyncAccessHandle()," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle
- MDN contributors, "StorageManager.getDirectory()," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory
- Sihui Liu, "The File System Access API with Origin Private File System," WebKit Blog (2023). https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/
- Thomas Steiner, "SQLite Wasm in the browser backed by the Origin Private File System," Chrome for Developers Blog (2023). https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/
- SQLite, "Persistent Storage Options for SQLite Wasm," sqlite.org. https://sqlite.org/wasm/doc/trunk/persistence.md
- Notion Engineering, "How we sped up Notion in the browser with WASM SQLite," Notion Blog. https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite
