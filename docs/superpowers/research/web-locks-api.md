I have enough verified material across all required facets. Returning the structured findings document below.

---

# FEE-1314 Findings: Web Locks API for Cross-Tab and SW-to-Tab Coordination

## Source Verification

All sources WebFetch-verified on 2026-04-26.

| # | Source | URL | Status |
|---|--------|-----|--------|
| 1 | W3C Web Locks (Working Draft) | https://www.w3.org/TR/web-locks/ | Verified |
| 2 | MDN Web Locks API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API | Verified |
| 3 | MDN LockManager | https://developer.mozilla.org/en-US/docs/Web/API/LockManager | Verified |
| 4 | MDN LockManager.request() | https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request | Verified |
| 5 | MDN LockManager.query() | https://developer.mozilla.org/en-US/docs/Web/API/LockManager/query | Verified |
| 6 | W3C Web Locks Explainer | https://github.com/w3c/web-locks/blob/main/EXPLAINER.md | Verified |
| 7 | Chrome 69 Release Notes (Pete LePage, 2018-09-04) | https://developer.chrome.com/blog/new-in-chrome-69 | Verified |

## Claims with Verbatim Quotes

**Claim 1 — Core purpose: scoped, asynchronous mutual exclusion across same-origin contexts.**
- Source: MDN Web Locks API
- Quote: "The **Web Locks API** allows scripts running in one tab or worker to asynchronously acquire a lock, hold it while work is performed, then release it. While held, no other script executing in the same origin can acquire the same lock, which allows a web app running in multiple tabs or workers to coordinate work and the use of resources."

**Claim 2 — Lock lifetime is tied to the callback's returned promise.**
- Source: MDN LockManager.request()
- Quote: "Method called when the lock is granted. The lock is automatically released when the callback returns (or an exception is thrown). Usually the callback is an async function, which causes the lock to be released only when the async function has completely finished."

**Claim 3 — `request()` returns a promise resolving with the callback's result after the lock is released.**
- Source: MDN LockManager.request()
- Quote: "The requested `Lock` is passed to a callback, while the function itself returns a `Promise` that resolves (or rejects) with the result of the callback after the lock is released, or rejects if the request is aborted."

**Claim 4 — Mode `'exclusive'` (default) blocks all other holders; mode `'shared'` allows multiple shared holders but blocks exclusive requests.**
- Source: W3C Web Locks Spec
- Quote: "If an 'exclusive' lock is held, then no other locks with that name can be granted. If a 'shared' lock is held, other 'shared' locks with that name can be granted — but not any 'exclusive' locks."

**Claim 5 — Shared/exclusive modes implement readers-writer.**
- Source: MDN Web Locks API
- Quote: "The default mode is \"exclusive\", but \"shared\" can be specified. There can be only one \"exclusive\" holder of a lock, but multiple \"shared\" requests can be granted at the same time. This can be used to implement the readers-writer pattern."

**Claim 6 — `ifAvailable: true` returns `null` instead of queueing when the lock is held.**
- Source: MDN LockManager.request()
- Quote: "If `true`, the lock request will only be granted if it is not already held. If it cannot be granted, the callback will be invoked with `null` instead of a `Lock` instance. The default value is `false`."

**Claim 7 — `signal` option binds an AbortSignal that drops a not-yet-granted request.**
- Source: MDN LockManager.request()
- Quote: "An `AbortSignal` ... if specified and the `AbortController` is aborted, the lock request is dropped if it was not already granted."

**Claim 8 — `steal: true` releases any held lock with that name and grants the request, preempting the queue.**
- Source: MDN LockManager.request()
- Quote: "If `true`, then any held locks with the same name will be released, and the request will be granted, preempting any queued requests for it. The default value is `false`."

**Claim 9 — Stealing is intended only when a holder is presumed dead; the prior holder runs without exclusion guarantees afterward.**
- Source: W3C Web Locks Spec §3.2.1
- Quote: "If a web application detects an unrecoverable state — for example, some coordination point like a Service Worker determines that a tab holding a lock is no longer responding — then it can \"steal\" a lock ... When used, code previously holding a lock will now be executing without guarantees that it is the sole context with access to the resource."

**Claim 10 — Mutually exclusive option combinations throw `NotSupportedError`.**
- Source: MDN LockManager.request()
- Quote: "Thrown if `name` starts with a hyphen (`-`), both options `steal` and `ifAvailable` are `true`, or if option `signal` exists and _either_ option `steal` or `ifAvailable` is `true`."

**Claim 11 — `query()` returns a `{held, pending}` snapshot for diagnostics.**
- Source: MDN LockManager.query()
- Quote: "A `Promise` that resolves with an object containing a snapshot of the `LockManager` state. The object has the following properties: `held` — An array of `LockInfo` objects for held locks. `pending` — An array of `LockInfo` objects for pending lock requests."

**Claim 12 — `LockInfo` carries `name`, `mode`, and a `clientId` matching `Client.id`.**
- Source: MDN LockManager.query()
- Quote: "`name` — The name passed to `LockManager.request()` when the lock was requested. `mode` — The access mode passed to `LockManager.request()` when the lock was requested. The mode is either `\"exclusive\"` or `\"shared\"`. `clientId` — The unique identity of the context where `LockManager.request()` is called. This is the same value as `Client.id`."

**Claim 13 — Locks are origin-scoped and span tabs/workers within that origin.**
- Source: MDN Web Locks API
- Quote: "Locks are scoped to origins; the locks acquired by a tab from `https://example.com` have no effect on the locks acquired by a tab from `https://example.org:8080` as they are separate origins."

**Claim 14 — Spec scopes locks to agents sharing a storage bucket, which can span agent clusters (i.e., service worker + windows).**
- Source: W3C Web Locks Spec
- Quote: "Locks ... take place within the scope of agents sharing a storage bucket; this may span multiple agent clusters."

**Claim 15 — Cross-cluster scope is the explicit reason Web Locks exists where Atomics doesn't suffice.**
- Source: W3C Web Locks Explainer
- Quote: "Use cases require coordination across multiple agent clusters; Atomics operations operate on SharedArrayBuffers constrained to a single agent cluster"

**Claim 16 — Leader-election pattern is a canonical use case (one tab syncs net <-> IDB).**
- Source: MDN Web Locks API
- Quote: "if a web app running in multiple tabs wants to ensure that only one tab is syncing data between the network and Indexed DB, each tab could try to acquire a \"my_net_db_sync\" lock, but only one tab will succeed (the leader election pattern.)"

**Claim 17 — Held-forever leader pattern is endorsed by the explainer.**
- Source: W3C Web Locks Explainer
- Quote: "A 'primary tab' is designated. This tab is the only one that should be performing some operations ... It holds a lock and never releases it."

**Claim 18 — Secure-context only.**
- Source: MDN LockManager
- Quote: "**Secure context:** This feature is available only in secure contexts (HTTPS), in some or all supporting browsers."

**Claim 19 — Available in Web Workers (and by extension Service Workers, per spec scope).**
- Source: MDN LockManager
- Quote: "**Note:** This feature is available in Web Workers."

**Claim 20 — Baseline widely available since March 2022.**
- Source: MDN Web Locks API
- Quote: "**Baseline Widely available** - This feature is well established and works across many devices and browser versions. It's been available across browsers since March 2022."

**Claim 21 — Pete LePage's Chrome 69 announcement (origin of the API).**
- Source: developer.chrome.com/blog/new-in-chrome-69 (Pete LePage, 2018-09-04)
- Quote: "The Web Locks API allows you to asynchronously acquire a lock, hold it while work is performed, then release it."

**Claim 22 — Grant algorithm (spec §2.5/§4.4): a request is grantable iff no held lock conflicts; queue is processed in order and head-of-line blocking applies.**
- Source: W3C Web Locks Spec §2.5, §4.4
- Quote: "A request becomes grantable when: \"no lock in held has name equal to name\" (for exclusive mode) or \"no lock in held has mode exclusive and has name equal\" (for shared mode) ... Only the first queued request for each resource is evaluated; processing halts if any request is ungrantable."

## Code Examples (Verbatim from MDN LockManager.request())

Basic acquire-and-release:
```javascript
await navigator.locks.request("my_resource", async (lock) => {
  // The lock was granted.
});
```

Shared / exclusive (readers-writer):
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

Non-blocking probe with `ifAvailable`:
```javascript
await navigator.locks.request("my_resource", { ifAvailable: true }, async (lock) => {
  if (!lock) {
    // The lock was not granted - get out fast.
    return;
  }
  // The lock was granted...
});
```

Bounded wait with `signal`:
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

Diagnostics:
```javascript
const state = await navigator.locks.query();
for (const lock of state.held) { console.log(`held: ${lock.name}, ${lock.mode}`); }
for (const req of state.pending) { console.log(`pending: ${req.name}, ${req.mode}`); }
```

## Lock Acquisition Modes — Decision Matrix (for the topic-specific section)

| Use case | mode | flags | Why |
|----------|------|-------|-----|
| Only one tab refreshes the auth token | `'exclusive'` | (none) — first caller wins, others queue and resolve when done | Default mutex; deduplicates work because the queued callback inherits the refreshed token. |
| Serialize IDB writes across tabs | `'exclusive'` | (none) | Wraps the IDB transaction; FEE-617 mentions Web Locks as the recommended primitive. |
| Many readers, one writer (cached config) | `'shared'` for readers, `'exclusive'` for writer | (none) | Readers-writer pattern (Claim 5). |
| Skip-if-busy background refresh | `'exclusive'` | `ifAvailable: true` | If another tab is already refreshing, exit instead of queueing (Claim 6). |
| Bounded-wait operation | `'exclusive'` | `signal: AbortSignal.timeout(N)` | Drop the request if not granted within N ms (Claim 7). |
| Leader election (held forever) | `'exclusive'` | callback returns a never-resolving promise | Per Explainer (Claim 17); secondary tabs queue waiting for promotion. |
| Recovery from a wedged holder | `'exclusive'` | `steal: true` | Reset shared resource state first; prior holder loses its exclusion guarantee (Claim 9). |
| Conflict guard | n/a | `steal+ifAvailable` is rejected; `signal+steal/ifAvailable` is rejected | Spec disallows these combinations (Claim 10). |

## Distinction Notes (for `## Related Topics`)

- **vs FEE-414 BroadcastChannel:** BroadcastChannel is broadcast pub-sub — every subscriber in the origin receives every posted message. Web Locks is mutual exclusion — exactly one holder (exclusive mode) or readers-writer (shared mode). Many designs use both: BroadcastChannel announces "auth token refreshed," Web Locks ensures only one tab does the refresh.
- **vs FEE-617 IndexedDB:** IndexedDB provides per-database transaction serialization within a single agent, but doesn't coordinate logical writes across tabs (e.g., read-modify-write of a record). Web Locks is the recommended cross-tab primitive — the same MDN page calls out the "my_net_db_sync" leader pattern (Claim 16). Spec scope (Claim 14) covers Service Workers too, so an SW-driven background sync can take the same lock as a foreground tab.

## Adjacency Confirmed

- FEE-414 (BroadcastChannel) — distinct: pub-sub vs mutex; cross-link only.
- FEE-617 (IndexedDB) — Web Locks named explicitly as the leader-election/serialization primitive.

## Notes on Source Tier

- Primary: W3C spec (active Working Draft) and MDN reference pages — both directly fetched and quoted verbatim.
- Secondary: W3C Web Locks Explainer on the spec's GitHub (named editors, w3c-org) — used for design rationale and use-case framing.
- Tertiary: Pete LePage's named-author Chrome 69 blog post (2018) — confirms Chrome shipping origin.
- No anonymous Medium sources used.

## Browser Support Summary

Baseline Widely available since March 2022 (Claim 20). Chrome shipped first in Chrome 69 (Sept 2018, Pete LePage announcement). Secure-context only (Claim 18); available on Window, dedicated/shared workers, and service workers (Claim 19, plus spec storage-bucket scoping in Claim 14).
agentId: a9719988518829179 (use SendMessage with to: 'a9719988518829179' to continue this agent)
<usage>total_tokens: 40795
tool_uses: 13
duration_ms: 131801</usage>