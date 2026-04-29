I have enough verified sources. Now I'll compile findings.

```
---
topic: Origin Private File System (OPFS) for High-Performance Local Storage
id: 1310
slug: opfs
sources_reviewed: 11
claims: 15
---

# Findings: Origin Private File System (OPFS) for High-Performance Local Storage

**Proposed topic-specific section:** `## Sync vs Async API Surface`.

## Claims

### Claim 1
- **Text:** OPFS is a storage endpoint exposed by the File System API that is private to the origin and not visible to the user the way the regular filesystem is.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- **Pulled quote:** "The origin private file system (OPFS) is a storage endpoint provided as part of the File System API, which is private to the origin of the page and not visible to the user like the regular file system."

### Claim 2
- **Text:** Browsers persist OPFS contents to disk, but applications cannot expect a one-to-one mapping with user-visible files; the OPFS is not intended to be browseable by the user.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- **Pulled quote:** "Browsers persist the contents of the OPFS to disk somewhere, but you cannot expect to find the created files matched one-to-one. The OPFS is not intended to be visible to the user."

### Claim 3
- **Text:** Because OPFS is sandboxed and not exposed to the user, OPFS access does not require the permission prompts and security checks that gate the user-facing File System Access API.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- **Pulled quote:** "Permission prompts and security checks are not required to access files in the OPFS."

### Claim 4
- **Text:** The entry point to the OPFS is `navigator.storage.getDirectory()`, returning a `FileSystemDirectoryHandle` that is the empty root of the per-origin file system.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory
- **Pulled quote:** "The getDirectory() method of the StorageManager interface is used to obtain a reference to a FileSystemDirectoryHandle object allowing access to a directory and its contents, stored in the origin private file system (OPFS)."

### Claim 5
- **Text:** `navigator.storage.getDirectory()` is Baseline Widely available, having shipped across all major browsers since March 2023.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory
- **Pulled quote:** "Baseline Widely available — This feature is well established and works across many devices and browser versions. It's been available across browsers since March 2023."

### Claim 6
- **Text:** The synchronous variant of OPFS access (`FileSystemSyncAccessHandle`) is restricted to dedicated Web Workers; it is not callable from the main thread.
- **Target section:** Sync vs Async API Surface
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle
- **Pulled quote:** "This class is only accessible inside dedicated Web Workers (so that its methods do not block execution on the main thread) for files within the origin private file system, which is not visible to end-users."

### Claim 7
- **Text:** `FileSystemSyncAccessHandle` exposes synchronous `read()`, `write()`, `flush()`, `close()`, `getSize()`, and `truncate()` methods; this synchronous shape is what enables high-performance use cases such as WebAssembly.
- **Target section:** Sync vs Async API Surface
- **Source URL:** https://fs.spec.whatwg.org/
- **Pulled quote:** "The returned FileSystemSyncAccessHandle offers synchronous methods. This allows for higher performance on contexts where asynchronous operations come with high overhead, e.g., WebAssembly."

### Claim 8
- **Text:** The spec scopes `FileSystemSyncAccessHandle` to dedicated workers via WebIDL: `[Exposed]=DedicatedWorker interface FileSystemSyncAccessHandle`.
- **Target section:** Sync vs Async API Surface
- **Source URL:** https://fs.spec.whatwg.org/
- **Pulled quote:** "[Exposed]=DedicatedWorker interface FileSystemSyncAccessHandle"

### Claim 9
- **Text:** Creating a sync access handle takes an exclusive lock on the underlying file entry, blocking creation of further sync handles or writable streams against the same entry until close.
- **Target section:** Best Practices
- **Source URL:** https://fs.spec.whatwg.org/
- **Pulled quote:** "Creating a FileSystemSyncAccessHandle takes an exclusive lock on the file entry...This prevents creation of further FileSystemSyncAccessHandles or FileSystemWritableFileStreams for the entry, until the access handle is closed."

### Claim 10
- **Text:** A `FileSystemWritableFileStream` requires only a shared lock, so two writers can compose, while sync access handles enforce exclusivity — the caller picks the contention model that matches their use case.
- **Target section:** Best Practices
- **Source URL:** https://fs.spec.whatwg.org/
- **Pulled quote:** "Locks help prevent concurrent modifications to a file. A FileSystemWritableFileStream requires a shared lock, while a FileSystemSyncAccessHandle requires an exclusive one."

### Claim 11
- **Text:** Attempting to open a second `readwrite` sync access handle on a locked file throws `NoModificationAllowedError`, which is how applications detect contention.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle
- **Pulled quote:** "NoModificationAllowedError DOMException: Thrown if the browser is not able to acquire a lock on the file associated with the file handle. This could be because mode is set to readwrite and an attempt is made to open multiple handles simultaneously."

### Claim 12
- **Text:** OPFS shares the StorageManager quota system with other origin storage; usage is observable through `navigator.storage.estimate()`, and clearing site data deletes the OPFS.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- **Pulled quote:** "The OPFS is subject to browser storage quota restrictions, just like any other origin-partitioned storage mechanism (for example IndexedDB API). You can access the amount of storage space the OPFS is using via navigator.storage.estimate(). ... Clearing storage data for the site deletes the OPFS."

### Claim 13
- **Text:** OPFS sync access handles back SQLite-WASM in the browser; SQLite's VFS layer requires synchronous OPFS APIs because the C-level SQLite API cannot be driven by promises.
- **Target section:** Example
- **Source URL:** https://sqlite.org/wasm/doc/trunk/persistence.md
- **Pulled quote:** "OPFS offers a handful of synchronous APIs which are required by this API. A file can be opened in asynchronous mode without any sort of locking, but acquiring access to the synchronous APIs requires what OPFS calls a 'sync access handle.'"

### Claim 14
- **Text:** The Chrome team frames OPFS-backed SQLite-WASM as the long-promised replacement for the deprecated Web SQL feature; the synchronous variant on dedicated workers is what makes the performance numbers credible.
- **Target section:** Example
- **Source URL:** https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/
- **Pulled quote:** "The SQLite Wasm library with the Origin Private File System persistence backend is our fulfillment of this promise" and "The synchronous nature of this method brings performance advantages."

### Claim 15
- **Text:** Production deployments report measurable wins: Notion shipped a WASM SQLite + OPFS sync-handle-pool VFS in workers and saw page navigation speed up 20 percent across modern browsers, with 28-33 percent gains in distant geographies.
- **Target section:** Example
- **Source URL:** https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite
- **Pulled quote:** "Each Web Worker accesses the SQLite database using the OPFS SyncAccessHandle Pool VFS implementation, which works on all major browsers." and "Using SQLite improved page navigation times by 20 percent in all modern browsers."

### Claim 16
- **Text:** Safari shipped FileSystemSyncAccessHandle for OPFS in macOS 12.2 / iOS 15.2, completing cross-engine availability with Chromium (Chrome 102, March 2022 intent) and Firefox.
- **Target section:** Visual
- **Source URL:** https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/
- **Pulled quote:** "FileSystemSyncAccessHandle is only available in Worker. ... It is available in Safari on: macOS 12.2 and above, iOS 15.2 and above" (by Sihui Liu).

## Reference URLs
- https://fs.spec.whatwg.org/
- https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
- https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle
- https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
- https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory
- https://web.dev/articles/origin-private-file-system
- https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/
- https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/
- https://sqlite.org/wasm/doc/trunk/persistence.md
- https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite
- https://groups.google.com/a/chromium.org/g/blink-dev/c/OR0poFdzEpo

## Research notes
- (Adjacency: FEE-617 Offline-First IndexedDB — KV/structured-clone storage. OPFS is byte-stream/file storage with sync-in-worker access; cross-link, distinct scope.)
- (Adjacency: FEE-410 File API, Clipboard & Drag-and-Drop — user-picker File System Access. OPFS has no picker, no user visibility; cross-link, distinct scope.)
- WHATWG spec confirms there is no transactional model: locks are the only primitive, and atomicity (write-temp-then-rename, or sequencing under an exclusive sync handle) is the caller's responsibility. The spec does not provide multi-file transactions.
- Cross-engine status as of 2026-04: `getDirectory()` is Baseline Widely Available since March 2023 per MDN; `FileSystemSyncAccessHandle` is implemented in Chrome 102+, WebKit (macOS 12.2 / iOS 15.2+), and Firefox.
- The Chrome blog post (Thomas Steiner, 2023-01-11) and the WebKit blog post (Sihui Liu, 2023-02-17) both explicitly tie sync access handles to SQLite-WASM as the headline use case. SQLite's own persistence doc independently confirms the requirement.
- The Notion engineering post is the strongest production data point for measured impact and the worker-only "one tab at a time" tradeoff inherent to the SyncAccessHandle Pool VFS.

## Rejected sources
- https://chromestatus.com/feature/5702777582911488 — page returned only a title with no extractable status content; superseded by the verifiable blink-dev intent thread (https://groups.google.com/a/chromium.org/g/blink-dev/c/OR0poFdzEpo).
- https://web.dev/articles/sqlite-wasm-in-browsers — 404, article does not exist at this URL. Substituted with the verifiable Chrome for Developers blog post (developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/).
- Wikipedia / anonymous Medium / AI-SEO posts surfaced in search were not fetched per source-tier rule.
```
agentId: a4644e7c4804f8773 (use SendMessage with to: 'a4644e7c4804f8773' to continue this agent)
<usage>total_tokens: 46383
tool_uses: 21
duration_ms: 151495</usage>