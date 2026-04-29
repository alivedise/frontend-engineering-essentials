---
id: 1314
title: "Web Locks API for Cross-Tab and SW-to-Tab Coordination"
state: draft
slug: web-locks-api
---

# [FEE-1314] Web Locks API for Cross-Tab and SW-to-Tab Coordination

:::info
The Web Locks API lets scripts in tabs and workers asynchronously acquire a named lock, hold it while work runs, and release it when the callback's promise settles (MDN Web Locks API; MDN LockManager.request()). Locks are scoped to an origin and span agents that share a storage bucket, so a service worker and its windows can contend for the same lock (MDN Web Locks API; W3C Web Locks Working Draft). The API supports `'exclusive'` (default) and `'shared'` modes to express readers-writer semantics, plus the `ifAvailable`, `signal`, and `steal` flags for non-blocking, bounded-wait, and recovery scenarios (W3C Web Locks Working Draft; MDN LockManager.request()). It reached Baseline Widely available in March 2022 (MDN Web Locks API). Lock lifetime is tied to the callback's returned promise: return early to release, return a never-resolving promise to hold the lock for the lifetime of the context (MDN LockManager.request(); W3C Web Locks Explainer).
:::

## Context

The Web Locks API was announced for Chrome 69 in Pete LePage's "New in Chrome 69" post on 2018-09-04, framed as an asynchronous primitive to acquire, hold, and release a lock around work (developer.chrome.com/blog/new-in-chrome-69). Its mechanics are now specified by the W3C Web Locks Working Draft and documented across MDN's Web Locks API, LockManager, LockManager.request(), and LockManager.query() pages. The motivating gap, as the W3C Web Locks Explainer states, is that "use cases require coordination across multiple agent clusters; Atomics operations operate on SharedArrayBuffers constrained to a single agent cluster" — so Web Locks fills the cross-cluster mutual-exclusion role that `Atomics` cannot. The W3C Working Draft scopes locks to "agents sharing a storage bucket; this may span multiple agent clusters," which is what allows a service worker and its windows to contend for the same name. Per MDN, locks are origin-isolated: "Locks are scoped to origins; the locks acquired by a tab from `https://example.com` have no effect on the locks acquired by a tab from `https://example.org:8080` as they are separate origins." Baseline Widely available status arrived in March 2022 (MDN Web Locks API).

## Visual

| Aspect | Behavior | Source |
|---|---|---|
| Lock lifetime | Tied to the callback's returned promise; released when the callback returns or throws. | MDN LockManager.request() (Claim 2) |
| `request()` return value | A `Promise` that resolves or rejects with the callback's result after the lock is released, or rejects if aborted. | MDN LockManager.request() (Claim 3) |
| Default mode | `'exclusive'`: blocks all other holders of that name. | W3C Working Draft (Claim 4) |
| Shared mode | `'shared'`: multiple shared holders can coexist; an exclusive request blocks until all shared holders release. | W3C Working Draft; MDN Web Locks API (Claims 4-5) |
| `ifAvailable: true` | Skip queueing; if the lock is held the callback runs with `null`. | MDN LockManager.request() (Claim 6) |
| `signal` | An `AbortSignal` that drops a not-yet-granted request when aborted. | MDN LockManager.request() (Claim 7) |
| `steal: true` | Releases any held lock with that name and grants the request, preempting queued requests; the prior holder loses its exclusion guarantee. | MDN LockManager.request(); W3C Working Draft §3.2.1 (Claims 8-9) |
| Diagnostics | `navigator.locks.query()` returns `{ held, pending }` arrays of `LockInfo` ({ name, mode, clientId }). | MDN LockManager.query() (Claims 11-12) |
| Origin scope | Same-origin only; tabs on different origins never contend. | MDN Web Locks API (Claim 13) |
| Cross-cluster scope | Within an origin, locks span agents that share a storage bucket, which may cross agent clusters (so SW + windows can contend). | W3C Working Draft; W3C Explainer (Claims 14-15) |
| Secure context | Available only in secure contexts (HTTPS). | MDN LockManager (Claim 18) |
| Worker availability | Available in Web Workers (and Service Workers per the spec's storage-bucket scope). | MDN LockManager; W3C Working Draft (Claims 19, 14) |
| Baseline | Widely available since March 2022. | MDN Web Locks API (Claim 20) |

## Example

The basic acquire-and-release form, from MDN LockManager.request():

```javascript
await navigator.locks.request("my_resource", async (lock) => {
  // The lock was granted.
});
```

Per MDN LockManager.request() (Claim 2), "the lock is automatically released when the callback returns (or an exception is thrown). Usually the callback is an async function, which causes the lock to be released only when the async function has completely finished."

Readers-writer with `'shared'` and `'exclusive'`, from MDN LockManager.request():

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

Per MDN Web Locks API (Claim 5): "There can be only one \"exclusive\" holder of a lock, but multiple \"shared\" requests can be granted at the same time. This can be used to implement the readers-writer pattern."

Non-blocking probe with `ifAvailable`, from MDN LockManager.request():

```javascript
await navigator.locks.request("my_resource", { ifAvailable: true }, async (lock) => {
  if (!lock) {
    // The lock was not granted - get out fast.
    return;
  }
  // The lock was granted...
});
```

Per MDN LockManager.request() (Claim 6): "If `true`, the lock request will only be granted if it is not already held. If it cannot be granted, the callback will be invoked with `null` instead of a `Lock` instance."

Bounded wait with `signal`, from MDN LockManager.request():

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

Per MDN LockManager.request() (Claim 7), the `AbortSignal` "if specified and the `AbortController` is aborted, the lock request is dropped if it was not already granted."

Diagnostics via `query()`, from MDN LockManager.query():

```javascript
const state = await navigator.locks.query();
for (const lock of state.held) { console.log(`held: ${lock.name}, ${lock.mode}`); }
for (const req of state.pending) { console.log(`pending: ${req.name}, ${req.mode}`); }
```

Per MDN LockManager.query() (Claims 11-12), the resolved value contains a `held` array and a `pending` array of `LockInfo` objects, each with `name`, `mode` (`"exclusive"` or `"shared"`), and `clientId` (matching `Client.id`).

## Best Practices

- **MUST** scope lock names per logical resource within an origin, since locks are origin-scoped and a tab on another origin cannot interfere (MDN Web Locks API, Claim 13).
- **MUST** call the API from a secure (HTTPS) context, because MDN LockManager (Claim 18) lists Web Locks as a secure-context-only feature.
- **MUST NOT** combine mutually exclusive flags: `steal` and `ifAvailable` together, or `signal` together with either `steal` or `ifAvailable`, throw `NotSupportedError` per MDN LockManager.request() (Claim 10). The same source notes a leading hyphen in `name` also throws.
- **MUST** treat `steal: true` as a recovery action only. Per the W3C Working Draft §3.2.1 (Claim 9), stealing is intended for cases where "some coordination point like a Service Worker determines that a tab holding a lock is no longer responding," after which "code previously holding a lock will now be executing without guarantees that it is the sole context with access to the resource."
- **SHOULD** return the work's promise from the callback so that the lock holds for exactly the duration of the work and releases on completion or exception, per MDN LockManager.request() (Claim 2).
- **SHOULD** use `'shared'` for read paths and `'exclusive'` for write paths to implement the readers-writer pattern called out in MDN Web Locks API (Claim 5).
- **SHOULD** prefer `ifAvailable: true` over short polling when the desired behavior is "skip if busy," per MDN LockManager.request() (Claim 6).
- **SHOULD** bound waits with an `AbortSignal` whose controller aborts on timeout when callers cannot wait indefinitely, per MDN LockManager.request() (Claim 7).
- **MAY** implement leader election by holding an exclusive lock for the lifetime of the tab — the W3C Web Locks Explainer (Claim 17) endorses the pattern: "A 'primary tab' is designated. This tab is the only one that should be performing some operations ... It holds a lock and never releases it." MDN Web Locks API (Claim 16) names the canonical example: a `"my_net_db_sync"` lock so only one tab syncs network and IndexedDB.
- **MAY** call `navigator.locks.query()` for diagnostics, since per MDN LockManager.query() (Claim 11) it returns a snapshot of `held` and `pending` for the origin.

## Design Thinking

Web Locks trades immediacy for coordination. A request that cannot be granted joins a per-name queue and waits, which means callers who must not block need `ifAvailable: true` (skip if busy, Claim 6) or `signal` (drop after a deadline, Claim 7). The default `'exclusive'` mode is the strongest guarantee and the simplest mental model; `'shared'` exists where read concurrency matters (Claim 5), at the cost of having to classify every code path as reader or writer.

The cross-cluster scope (W3C Explainer, Claim 15) is what makes Web Locks distinct from `Atomics` on `SharedArrayBuffer`: locks reach across agent clusters, so a service worker and its windows can contend for the same name (W3C Working Draft, Claim 14). The trade is that lock state lives in the browser's per-origin coordination layer rather than in shared memory, so semantics are async-only (the `request()` callback receives a granted `Lock`; the API has no synchronous variant).

`steal: true` is the explicit escape hatch when the queue assumes a holder still exists. Per the W3C Working Draft §3.2.1 (Claim 9), the cost is that the prior holder runs without exclusion guarantees afterward — meaning recovery code must reset whatever shared resource the stolen lock was protecting before the stealing context proceeds.

## Deep Dive

The grant algorithm is specified in the W3C Working Draft §2.5 and §4.4 (Claim 22). A request becomes grantable when no held lock with the same name conflicts: for `'exclusive'`, no held lock may share the name; for `'shared'`, no held lock with that name may be in `'exclusive'` mode. The queue is processed head-of-line: "Only the first queued request for each resource is evaluated; processing halts if any request is ungrantable." Head-of-line blocking means a single ungrantable request at the head of a queue can stall later grantable requests for the same name; this is intrinsic to the spec's grant semantics.

Lock identity for diagnostics is provided by `LockInfo`. Per MDN LockManager.query() (Claim 12), each entry exposes `name`, `mode` (`"exclusive"` or `"shared"`), and `clientId` — and "`clientId` ... is the same value as `Client.id`," which links lock state to a specific client (window, worker, or service worker client) and lets a service worker correlate held locks with the tabs that own them.

Per MDN LockManager.request() (Claim 3), the method returns a `Promise` that resolves with the callback's result after the lock is released, or rejects if the request is aborted. Combined with Claim 2 (lock released when the callback returns or throws), this gives a structured-concurrency shape: the lock's lifetime is exactly the lexical scope of the callback's promise, and there is no `unlock()` to forget.

## Lock Acquisition Modes

The findings doc enumerates seven canonical configurations of `mode` plus flags. Each row maps a real coordination need onto the API surface from MDN LockManager.request() (Claims 2-10) and the W3C Web Locks Explainer (Claim 17). Held vs pending is the runtime view: a request becomes a held entry only once the spec's grant algorithm (Claim 22) admits it; until then it sits in the pending queue and is observable via `navigator.locks.query()` (Claim 11).

| Use case | mode | flags | Why |
|---|---|---|---|
| Only one tab refreshes the auth token | `'exclusive'` | (none) — first caller wins, others queue and resolve when done | Default mutex; deduplicates work because the queued callback inherits the refreshed token. |
| Serialize IDB writes across tabs | `'exclusive'` | (none) | Wraps the IDB transaction so only one tab is mid-write at a time. |
| Many readers, one writer (cached config) | `'shared'` for readers, `'exclusive'` for writer | (none) | Readers-writer pattern (MDN Web Locks API, Claim 5). |
| Skip-if-busy background refresh | `'exclusive'` | `ifAvailable: true` | If another tab is already refreshing, exit instead of queueing (Claim 6). |
| Bounded-wait operation | `'exclusive'` | `signal: AbortSignal` aborted on timeout | Drop the request if not granted within N ms (Claim 7). |
| Leader election (held forever) | `'exclusive'` | callback returns a never-resolving promise | Per W3C Explainer (Claim 17); secondary tabs queue waiting for promotion. |
| Recovery from a wedged holder | `'exclusive'` | `steal: true` | Reset shared resource state first; prior holder loses its exclusion guarantee (Claim 9). |
| Conflict guard (rejected combinations) | n/a | `steal+ifAvailable` is rejected; `signal+steal` and `signal+ifAvailable` are rejected | Spec disallows these combinations; throws `NotSupportedError` (Claim 10). |

The held-vs-pending state machine: a `request()` call enters the pending queue for its name. The grant algorithm (W3C Working Draft §2.5/§4.4, Claim 22) inspects only the head of each per-name queue and admits it iff no held lock conflicts under the mode rule. On admission, the entry moves to held and the user-supplied callback runs; the lock leaves held when the callback's returned promise settles (Claim 2). `navigator.locks.query()` (Claim 11) returns a snapshot of these two arrays — `held` and `pending` — at the moment of the call.

`ifAvailable: true` short-circuits the pending step: if any conflicting lock is in held, the callback is invoked with `null` instead of being enqueued (Claim 6). `signal` keeps the entry in pending but removes it on abort, rejecting `request()` with the abort reason (Claim 7). `steal: true` bypasses both queue and grant rule: it forcibly releases any held lock with that name, preempts queued requests, and grants the new request (Claim 8) — at the cost stated in Claim 9, that the prior holder runs without exclusion guarantees thereafter.

## Related Topics

- [BroadcastChannel for cross-tab messaging](/en/Browser%20APIs%20and%20Standards/414) — BroadcastChannel is broadcast pub-sub: every subscriber in the origin receives every posted message. Web Locks is mutual exclusion: one holder under `'exclusive'`, or readers-writer under `'shared'`. A common pattern uses both — BroadcastChannel announces "auth token refreshed" while Web Locks ensures only one tab does the refresh.
- [Service Workers for offline](/en/Progressive%20Web%20Apps%20and%20Offline/1302) — Per the W3C Working Draft (Claim 14), locks are scoped to "agents sharing a storage bucket; this may span multiple agent clusters," so a service worker and the windows it controls can contend for the same lock name. This enables the SW-to-tab coordination pattern named in MDN Web Locks API (Claim 16) for a `"my_net_db_sync"` leader.

## References

- W3C, "Web Locks API," W3C Working Draft (n.d.). https://www.w3.org/TR/web-locks/
- MDN contributors, "Web Locks API," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
- MDN contributors, "LockManager," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/LockManager
- MDN contributors, "LockManager.request()," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request
- MDN contributors, "LockManager.query()," MDN Web Docs (n.d.). https://developer.mozilla.org/en-US/docs/Web/API/LockManager/query
- W3C Web Locks editors, "Web Locks API Explainer," W3C web-locks GitHub repository (n.d.). https://github.com/w3c/web-locks/blob/main/EXPLAINER.md
- Pete LePage, "New in Chrome 69," developer.chrome.com (2018). https://developer.chrome.com/blog/new-in-chrome-69
