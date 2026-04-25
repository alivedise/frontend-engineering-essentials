---
topic: Offline-First State with IndexedDB (idb, Dexie)
id: 617
slug: offline-first-indexeddb
sources_reviewed: 12
claims: 15
---

# Findings: Offline-First State with IndexedDB (idb, Dexie)

**Proposed topic-specific section:** `## Sync-on-Reconnect Strategy`.

## Claims

### Claim 1
- **Text:** IndexedDB is a low-level browser API for client-side storage of significant amounts of structured data with index-backed high-performance lookups.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Pulled quote:** "IndexedDB is a low-level API for client-side storage of significant amounts of structured data, including files/blobs. This API uses indexes to enable high-performance searches of this data."

### Claim 2
- **Text:** IndexedDB is transactional and asynchronous; JavaScript object-oriented store keyed by structured-clonable values.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Pulled quote:** "IndexedDB is a transactional database system, like an SQL-based Relational Database Management System (RDBMS). However, unlike SQL-based RDBMSes, which use fixed-column tables, IndexedDB is a JavaScript-based object-oriented database."

### Claim 3
- **Text:** All read/write happens inside transactions; failed action rolls back to pre-transaction state.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/articles/indexeddb
- **Pulled quote:** "All read or write operations in IndexedDB must be part of a transaction." "If one of the actions in a transaction fails, all of them are applied and the database returns to the state it was in before the transaction began."

### Claim 4
- **Text:** Transaction is only active during the task that created it and inside its requests' success/error handlers; placing requests while inactive throws.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
- **Pulled quote:** "A transaction alternates between active and inactive states between event loop tasks. It's active in the task when it was created, and in each task of the requests' success or error event handlers. It's inactive in all other tasks, in which case placing requests will fail."

### Claim 5
- **Text:** Transactions auto-commit when no further requests pending. Awaiting unrelated promise between operations breaks the transaction.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
- **Pulled quote:** "If no new requests are placed when the transaction is active, and there are no other outstanding requests, the transaction will automatically commit."

### Claim 6
- **Text:** Schema migrations run inside `upgradeneeded` event when requested version exceeds stored version; runs once per version bump.
- **Target section:** Deep Dive
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event
- **Pulled quote:** "The versionchange event is fired when a database structure change (upgradeneeded event send on an IDBOpenDBRequest or IDBFactory.deleteDatabase) was requested elsewhere"

### Claim 7
- **Text:** `idb` (Jake Archibald) is ~1.19KB brotli'd promisifying wrapper; mirrors IndexedDB API and converts every IDBRequest into a promise.
- **Target section:** Best Practices
- **Source URL:** https://github.com/jakearchibald/idb
- **Pulled quote:** "This is a tiny (~1.19kB brotli'd) library that mostly mirrors the IndexedDB API, but with small improvements that make a big difference to usability." "Any method that usually returns an IDBRequest object will now return a promise for the result."

### Claim 8
- **Text:** Dexie is ORM-like wrapper adding versioned schema definition with `version().stores()`, indexed `where()` queries, transactions, hooks, bulk operations.
- **Target section:** Best Practices
- **Source URL:** https://dexie.org/docs/Dexie/Dexie
- **Pulled quote:** "Dexie.js is a library that makes it super simple to use indexedDB - the standard client-side database in browsers."

### Claim 9
- **Text:** Dexie's `liveQuery()` (3.1+) turns a Dexie querier into an Observable that re-emits on writes affecting the result.
- **Target section:** Example
- **Source URL:** https://dexie.org/docs/liveQuery()
- **Pulled quote:** "Turns a Promise-returning function that queries Dexie into an Observable." "Whenever a database change is made that would affect the result of your querier, your querier callback will be re-executed and your observable will emit the new result."

### Claim 10
- **Text:** `navigator.storage.estimate()` returns approximate `quota` and `usage` in bytes.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- **Pulled quote:** "quota - A numeric value in bytes which provides a conservative approximation of the total storage the user's device or computer has available for the site origin or Web app." "usage - A numeric value in bytes approximating the amount of storage space currently being used."

### Claim 11
- **Text:** Persistent storage opt-in via `navigator.storage.persist()`; when granted, bucket exempt from UA eviction under storage pressure.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- **Pulled quote:** "The persist() method of the StorageManager interface requests permission to use persistent storage, and returns a Promise that resolves to true if permission is granted and bucket mode is persistent."

### Claim 12
- **Text:** Background Sync API lets a page register a tag handled by service worker via `sync` event once the device regains stable connection.
- **Target section:** Sync-on-Reconnect Strategy
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- **Pulled quote:** "The Background Synchronization API enables a web app to defer tasks so that they can be run in a service worker once the user has a stable network connection."

### Claim 13
- **Text:** Workbox's `workbox-background-sync` Queue persists failed requests in IndexedDB and replays them on reconnect; falls back to replay on service-worker startup in browsers without native Background Sync.
- **Target section:** Sync-on-Reconnect Strategy
- **Source URL:** https://developer.chrome.com/docs/workbox/modules/workbox-background-sync
- **Pulled quote:** "A class to manage storing failed requests in IndexedDB and retrying them later." "Browsers that don't support the BackgroundSync API will retry the queue every time the service worker is started up."

### Claim 14
- **Text:** Cross-tab coordination: open connection receives `versionchange` event when another tab opens higher schema version; `BroadcastChannel` provides same-origin pub/sub.
- **Target section:** Sync-on-Reconnect Strategy
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
- **Pulled quote:** "The BroadcastChannel interface represents a named channel that any browsing context of a given origin can subscribe to. It allows communication between different documents (in different windows, tabs, frames or iframes) of the same origin."

### Claim 15
- **Text:** Background Sync is currently limited-availability + secure-context only. Production sync-on-reconnect must include fallback path triggered by `online` events or service-worker startup.
- **Target section:** Sync-on-Reconnect Strategy
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- **Pulled quote:** "Limited availability - This feature is not Baseline because it does not work in some of the most widely-used browsers." "Secure context: This feature is available only in secure contexts (HTTPS)."

## Reference URLs

- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
- https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
- https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- https://web.dev/articles/indexeddb
- https://github.com/jakearchibald/idb
- https://dexie.org/docs/Dexie/Dexie
- https://dexie.org/docs/liveQuery()
- https://developer.chrome.com/docs/workbox/modules/workbox-background-sync

## Research notes

- Conflict resolution → cross-link to FEE-615 (Yjs/Automerge); keep mention to one paragraph.
- Dexie 3.1+ added `liveQuery()` (not Dexie 4 as the brief stated).
- Visual: offline mutation lifecycle — user action → optimistic update in IDB → queue entry → reconnect → Background Sync replay → server ack → reconciliation.
