---
id: 1310
title: "Origin Private File System (OPFS) for High-Performance Local Storage"
state: draft
slug: opfs
---

# [FEE-1310] Origin Private File System (OPFS) for High-Performance Local Storage

:::info
The Origin Private File System (OPFS) is a sandboxed, per-origin storage endpoint of the File System API that exposes file and directory handles without involving the user-visible filesystem. It reached Baseline Widely available in March 2023 via `navigator.storage.getDirectory()`, and its synchronous worker-only handle (`FileSystemSyncAccessHandle`) is the substrate that lets SQLite-WASM run with persistence in the browser. This article explains the OPFS surface, contrasts the sync and async APIs, and grounds the discussion in production data from Notion's WASM SQLite rollout.
:::

## Context

OPFS is defined by the WHATWG File System spec as a storage endpoint provided as part of the File System API, "private to the origin of the page and not visible to the user like the regular file system" (MDN, *Origin private file system*). Browsers persist OPFS contents to disk, but applications "cannot expect to find the created files matched one-to-one. The OPFS is not intended to be visible to the user" (MDN). Because the file system never escapes the origin sandbox, "permission prompts and security checks are not required to access files in the OPFS" (MDN), which separates OPFS from the user-facing File System Access pickers.

The entry point is `navigator.storage.getDirectory()`, which returns a `FileSystemDirectoryHandle` rooted at an empty per-origin directory (MDN, *StorageManager.getDirectory*). MDN records `getDirectory()` as Baseline Widely available, "available across browsers since March 2023." The worker-only synchronous handle followed shortly after: WebKit shipped `FileSystemSyncAccessHandle` for OPFS in macOS 12.2 / iOS 15.2 (Liu, WebKit blog, 2023), completing cross-engine availability alongside Chromium (Chrome 102) and Firefox.

## Visual

| API surface | Context | Locking | Latency profile | Headline use case |
|---|---|---|---|---|
| `navigator.storage.getDirectory()` | Window + Worker | n/a (returns root handle) | Async | Bootstrap an OPFS root (MDN) |
| `FileSystemFileHandle.createWritable()` | Window + Worker | Shared | Async | Streaming writes, multiple cooperating writers (WHATWG FS spec) |
| `FileSystemFileHandle.createSyncAccessHandle()` | Dedicated Worker only | Exclusive | Synchronous read/write/flush | High-throughput backends such as SQLite-WASM (WHATWG FS spec; WebKit blog, 2023) |

## Example

The headline production example is SQLite-WASM persisted on OPFS. SQLite's own persistence documentation states the requirement directly: "OPFS offers a handful of synchronous APIs which are required by this API. A file can be opened in asynchronous mode without any sort of locking, but acquiring access to the synchronous APIs requires what OPFS calls a 'sync access handle'" (sqlite.org/wasm). The C-level SQLite API is not promise-driven, so the VFS implementation needs synchronous reads and writes against the underlying file. The Chrome team frames the combination as the long-promised replacement for the deprecated Web SQL feature: "The SQLite Wasm library with the Origin Private File System persistence backend is our fulfillment of this promise," and "the synchronous nature of this method brings performance advantages" (Steiner, Chrome for Developers blog, 2023).

The Notion engineering team published the largest publicly documented production data point. They report: "Each Web Worker accesses the SQLite database using the OPFS SyncAccessHandle Pool VFS implementation, which works on all major browsers." The measured outcome: "Using SQLite improved page navigation times by 20 percent in all modern browsers," with 28-33 percent gains in distant geographies (Notion engineering blog).

A minimal OPFS bootstrap looks like this:

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

The worker boundary is mandatory: the WHATWG spec scopes the interface with `[Exposed]=DedicatedWorker interface FileSystemSyncAccessHandle`, and MDN states the class is "only accessible inside dedicated Web Workers (so that its methods do not block execution on the main thread) for files within the origin private file system."

## Best Practices

- **MUST** call `createSyncAccessHandle()` only from a dedicated worker. The interface is scoped `[Exposed]=DedicatedWorker` in the WHATWG FS spec, and MDN documents the same constraint to prevent main-thread blocking.
- **MUST** treat `NoModificationAllowedError` as the contention signal when opening a `readwrite` sync access handle. MDN, *createSyncAccessHandle*: "Thrown if the browser is not able to acquire a lock on the file associated with the file handle. This could be because mode is set to readwrite and an attempt is made to open multiple handles simultaneously."
- **MUST** call `close()` on a sync access handle when finished. The WHATWG FS spec states that creating a sync access handle "takes an exclusive lock on the file entry... This prevents creation of further FileSystemSyncAccessHandles or FileSystemWritableFileStreams for the entry, until the access handle is closed."
- **SHOULD** pick the lock model deliberately: shared (`FileSystemWritableFileStream`) when multiple writers compose, exclusive (`FileSystemSyncAccessHandle`) when one path needs end-to-end control. WHATWG FS spec: "A FileSystemWritableFileStream requires a shared lock, while a FileSystemSyncAccessHandle requires an exclusive one."
- **SHOULD** budget OPFS against the same StorageManager quota as other origin storage and observe usage via `navigator.storage.estimate()`. MDN: "The OPFS is subject to browser storage quota restrictions, just like any other origin-partitioned storage mechanism (for example IndexedDB API)."
- **MAY** treat clearing site data as a destructive event for OPFS contents. MDN: "Clearing storage data for the site deletes the OPFS." Applications that cache derivable data only are unaffected; applications that store user-authored bytes need an export path.

## Design Thinking

The trade-off OPFS forces is locking model versus topology. A `FileSystemWritableFileStream` is shareable, so several actors can stream into the same file with cooperative semantics, but it does not expose synchronous primitives. A `FileSystemSyncAccessHandle` exposes synchronous `read`, `write`, `flush`, `close`, `getSize`, and `truncate` — the shape SQLite-WASM needs — but pays for that with an exclusive lock that is held for the lifetime of the handle (WHATWG FS spec). Notion's "SyncAccessHandle Pool VFS" choice illustrates the consequence: it works across all major browsers, and it imposes a one-tab-at-a-time model on the database file because the exclusive lock cannot be shared (Notion engineering blog).

A second calibration is transactional scope. The WHATWG spec offers locks as the only primitive; multi-file atomicity is the caller's responsibility. Applications that need transactional grouping across files build it on top of an exclusive sync handle, or sequence writes through a single owning worker.

## Sync vs Async API Surface

The two API shapes diverge on context, locking, and latency, and that divergence is what determines where OPFS code can live.

The asynchronous surface is reachable from both window and worker contexts. The window-side flow uses `navigator.storage.getDirectory()` to obtain a `FileSystemDirectoryHandle`, then `getFileHandle(name, { create: true })` to obtain a `FileSystemFileHandle`, and finally `getFile()` for reads or `createWritable()` for streaming writes. `createWritable()` takes a shared lock, so multiple cooperating writers can compose against the same file (WHATWG FS spec: "A FileSystemWritableFileStream requires a shared lock"). All these operations are promise-based, so they integrate with main-thread UI code without blocking concerns, and they pay the typical async overhead per call.

The synchronous surface is intentionally narrower. `FileSystemFileHandle.createSyncAccessHandle()` returns a `FileSystemSyncAccessHandle` whose methods — `read(buffer, options)`, `write(buffer, options)`, `flush()`, `close()`, `getSize()`, `truncate(newSize)` — are synchronous, with no promise wrappers. The WHATWG FS spec calls out the motivation directly: "The returned FileSystemSyncAccessHandle offers synchronous methods. This allows for higher performance on contexts where asynchronous operations come with high overhead, e.g., WebAssembly." The interface is restricted: `[Exposed]=DedicatedWorker interface FileSystemSyncAccessHandle` (WHATWG FS spec), reinforced by MDN's note that the class "is only accessible inside dedicated Web Workers... for files within the origin private file system."

The locking model is the second axis of difference. Sync access handles are exclusive: "Creating a FileSystemSyncAccessHandle takes an exclusive lock on the file entry... This prevents creation of further FileSystemSyncAccessHandles or FileSystemWritableFileStreams for the entry, until the access handle is closed" (WHATWG FS spec). Code that opens a second `readwrite` sync access handle on the same file observes `NoModificationAllowedError` (MDN, *createSyncAccessHandle*). Async writable streams, by contrast, take a shared lock and admit multiple writers.

The performance characteristics follow from the shapes. SQLite's persistence doc records that the C-level VFS cannot be driven by promises, which is why SQLite-WASM hosts itself on the sync handle: "acquiring access to the synchronous APIs requires what OPFS calls a 'sync access handle'" (sqlite.org/wasm). The Chrome team attributes the resulting throughput directly to the sync shape: "The synchronous nature of this method brings performance advantages" (Steiner, Chrome for Developers blog, 2023). The practical headroom shows up in Notion's measurements — 20 percent faster page navigation in modern browsers, 28-33 percent in distant geographies, with the worker-only OPFS SyncAccessHandle Pool VFS as the substrate (Notion engineering blog).

## Related Topics

- [File System Access API](/en/Browser%20APIs%20and%20Standards/410) — user-visible pickers and file handles, the public counterpart to the OPFS sandbox
- [IndexedDB and Dexie](/en/State%20Management%20and%20Data%20Flow/617) — structured-record storage; reach for OPFS instead when the workload is raw bytes or a synchronous VFS such as SQLite-WASM
- [Persistent Storage and StorageManager](/en/Browser%20APIs%20and%20Standards/404) — the quota and persistence model that OPFS shares with other origin storage

## References

- WHATWG, "File System Standard," WHATWG (living standard). https://fs.spec.whatwg.org/
- MDN contributors, "Origin private file system," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- MDN contributors, "FileSystemSyncAccessHandle," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle
- MDN contributors, "FileSystemFileHandle.createSyncAccessHandle()," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle
- MDN contributors, "StorageManager.getDirectory()," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory
- Sihui Liu, "The File System Access API with Origin Private File System," WebKit Blog (2023). https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/
- Thomas Steiner, "SQLite Wasm in the browser backed by the Origin Private File System," Chrome for Developers Blog (2023). https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/
- SQLite, "Persistent Storage Options for SQLite Wasm," sqlite.org. https://sqlite.org/wasm/doc/trunk/persistence.md
- Notion Engineering, "How we sped up Notion in the browser with WASM SQLite," Notion Blog. https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite
