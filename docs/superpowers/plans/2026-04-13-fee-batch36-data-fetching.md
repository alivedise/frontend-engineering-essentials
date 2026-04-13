# FEE Batch 36 — Data Fetching & Client-Server Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write all 8 Data Fetching & Client-Server Integration category articles (FEE-1800 through FEE-1807) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW translation. Articles follow the standard FEE format. The category covers application-layer data fetching patterns — what you build on top of the `fetch` primitive covered in FEE-403. Framework examples use React with TanStack Query (React Query v5) as the reference implementation, noting that the patterns apply across frameworks.

**Tech Stack:** Markdown, content authoring. Reference `docs/en/Developer Experience and Tooling/1603.md` for format. Reference `docs/en/Browser APIs and Web Platform/403.md` for context on what the fetch primitive layer covers (to avoid duplication).

---

## File Map

**New directories to create:**
- `docs/en/Data Fetching and Client-Server Integration/`
- `docs/zh-tw/Data Fetching and Client-Server Integration/`

**Files to create (EN):**
- `docs/en/Data Fetching and Client-Server Integration/1800.md`
- `docs/en/Data Fetching and Client-Server Integration/1801.md`
- `docs/en/Data Fetching and Client-Server Integration/1802.md`
- `docs/en/Data Fetching and Client-Server Integration/1803.md`
- `docs/en/Data Fetching and Client-Server Integration/1804.md`
- `docs/en/Data Fetching and Client-Server Integration/1805.md`
- `docs/en/Data Fetching and Client-Server Integration/1806.md`
- `docs/en/Data Fetching and Client-Server Integration/1807.md`

**Files to create (zh-TW):** Mirror under `docs/zh-tw/Data Fetching and Client-Server Integration/`.

---

## Format Reference

Read `docs/en/Developer Experience and Tooling/1603.md` before writing. Key rules: no code blocks or `###` subheadings inside `## Best Practices`; RFC-2119 bold-prefix paragraphs only; BP prefix severity must match body severity.

---

### Task 1: FEE-1800 Data Fetching Overview

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1800.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1800.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1800
  title: Data Fetching & Client-Server Integration Overview
  state: draft
  overview: true
  category: Data Fetching and Client-Server Integration
  ---
  ```

  **Opening context (3–4 paragraphs):**
  - Every frontend application that communicates with a backend solves the same set of problems: how to initiate a request, what to show while waiting, how to handle failure, how to avoid refetching data the application already has, and how to keep the UI consistent with the server's state. These are not framework problems — they are inherent in the architecture of client-server communication. Frameworks and libraries provide defaults; understanding the underlying problems allows engineers to configure those defaults correctly and override them when needed.
  - The distinction between server state and client state is the central organizing concept of this category. Client state — form input, UI open/close, selected tab — is owned by the application and changes only when the user acts. Server state — user profile, list of items, order status — is owned by the server and can change at any time. The strategies for managing these two kinds of state are fundamentally different, and conflating them leads to stale UI, redundant fetches, and over-complicated state stores.
  - This category covers the application-level layer built on top of the `fetch` primitive (FEE-403). Articles move from request lifecycle patterns through server state management libraries, GraphQL clients, caching, mutations, pagination, and error/loading states. The reference implementation uses TanStack Query (React Query v5) and React, but the patterns apply across frameworks.

  **`## Design Thinking` subsections:**
  - `### Server state vs. client state: different problems, different tools` — Server state is remote, asynchronous, shared between users, and can become stale without the client's knowledge. Client state is local, synchronous, owned by the application, and changes only in response to explicit actions. Using a general-purpose client state store (Redux, Zustand) to manage server state produces code that manually reimplements caching, stale detection, and background refetching — problems that server state libraries solve by default.
  - `### The stale-while-revalidate pattern` — The SWR strategy serves cached data immediately (avoiding a loading state for data the application already has) while triggering a background revalidation to update the cache. This pattern is the foundation of TanStack Query and SWR library. The result: perceived performance improves because the UI shows something immediately; consistency improves because the background fetch keeps data current.
  - `### The cascade problem in data fetching` — Sequential dependent requests — fetch user, then fetch user's organization, then fetch organization's projects — produce waterfalls: each request waits for the previous to complete. The total latency is the sum of all request latencies. Parallel requests, query prefetching, and server-side data loading (SSR) are the three strategies for eliminating waterfalls.

  **`## Best Practices`:**

  **MUST separate server state from client state and manage each with the appropriate tool.** Server state — data fetched from an API — belongs in a server state library (TanStack Query, SWR) that handles caching, background revalidation, deduplication, and stale detection automatically. Storing server state in a general-purpose client state store (Redux, Zustand, Context) requires manually implementing these behaviors and produces code that is more complex, less consistent, and harder to maintain.

  **MUST handle loading, error, and empty states for every data-fetching operation.** An unhandled loading state produces a blank screen or partial render. An unhandled error state leaves the user with no feedback and no recovery path. An unhandled empty state renders incorrectly when the server returns a valid but empty collection. These are not edge cases — they are normal states in the request lifecycle that every fetch operation transitions through.

  **SHOULD colocate data fetching logic with the component that consumes the data rather than hoisting all fetch calls to a top-level provider.** Colocated queries are self-contained: the component declares what data it needs, the library deduplicates concurrent requests for the same data, and the component unmounts cleanly when removed. Top-level providers create invisible dependencies between components and make the data flow difficult to trace.

  **`## Related FEEs`:**
  - FEE-403 — Fetch, Streams & Network APIs (the primitive layer)
  - FEE-600 — State Management Overview (server vs. client state boundary)
  - FEE-1801 — Fetch Patterns & Request Lifecycle
  - FEE-1807 — Error Handling & Loading States

  **`## References`:**
  - TanStack Query documentation — https://tanstack.com/query/latest
  - SWR documentation — https://swr.vercel.app/
  - stale-while-revalidate RFC 5861 — https://datatracker.ietf.org/doc/html/rfc5861

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1800`, `title: 資料獲取與客戶端-伺服器整合總覽`, `state: draft`, `overview: true`, `category: Data Fetching and Client-Server Integration`

  Key terms: 伺服器狀態（server state）、客戶端狀態（client state）、過期重新驗證（stale-while-revalidate）、快取（cache）、瀑布式請求（request waterfall）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1800.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1800.md"
  git commit -m "feat(fee): add FEE-1800 Data Fetching Overview (EN + zh-TW)"
  ```

---

### Task 2: FEE-1801 Fetch Patterns & Request Lifecycle

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1801.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1801.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1801`, `title: Fetch Patterns & Request Lifecycle`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** Before a server state library abstracts the request lifecycle, every data fetch involves the same sequence: construct the request, send it, await the response, check the status, parse the body, handle errors, and update the application. The details of this sequence — how to share base URL configuration, how to attach authentication headers, how to cancel in-flight requests, how to handle non-200 responses — are application concerns that every project resolves in its own way. Consistent resolution prevents the subtle bugs (stale responses updating state after unmount, auth headers missing on retried requests) that emerge when each fetch call is written independently.

  **`## Design Thinking` subsections:**
  - `### Base URL and header configuration: centralize once` — Repeating `https://api.example.com` in every fetch call and attaching `Authorization: Bearer ${token}` manually creates two maintenance points that must be updated together. A configured client (using a factory function, axios instance, or wrapper) captures these once.
  - `### AbortController and request cancellation` — When a component unmounts while a request is in-flight, the response arriving after unmount updates state on an unmounted component. `AbortController` allows the request to be cancelled. TanStack Query and SWR handle cancellation automatically; when using raw `fetch`, the cleanup function of the effect must call `controller.abort()`.
  - `### Non-200 responses: fetch does not throw` — The Fetch API resolves for any completed HTTP response, including 4xx and 5xx. A response with status 404 or 500 does not cause the promise to reject. Application code that checks only for network errors — caught by `catch` — misses HTTP errors. Status must be checked explicitly.

  **`## Best Practices`:**

  **MUST check `response.ok` or `response.status` explicitly after every `fetch` call before parsing the response body.** The Fetch API resolves its promise for any completed HTTP response regardless of status code. A 404 or 500 response does not reject the promise — it resolves with a response object whose `ok` property is `false`. Code that skips the status check and calls `response.json()` directly will silently attempt to parse an error response as valid data.

  **MUST cancel in-flight requests when the component that initiated them unmounts.** An asynchronous callback that calls `setState` after its component has unmounted produces a React warning in development and a no-op state update in production — but it consumes memory and can produce incorrect UI if the component remounts before the stale response arrives. Pass an `AbortSignal` from an `AbortController` to the fetch call and call `controller.abort()` in the effect cleanup.

  **SHOULD centralize base URL, default headers, and authentication token attachment in a single configured request function rather than repeating them at each call site.** A wrapper function or configured client instance is the single place that is updated when the API base URL changes, when the authentication scheme changes, or when a default header is added. Call sites that reach around the wrapper require individual updates and are a source of inconsistency.

  **SHOULD type API response shapes with TypeScript interfaces and validate them with a schema library at the boundary rather than asserting with `as ResponseType`.** See FEE-1708 for the validation pattern. A type assertion on a fetch response trusts the server to return the declared shape — a trust that is violated by backend changes, API versioning, and network errors returning HTML error pages instead of JSON.

  **`## Related FEEs`:**
  - FEE-403 — Fetch, Streams & Network APIs
  - FEE-1708 — Runtime Validation & Schema Libraries
  - FEE-1807 — Error Handling & Loading States

  **`## References`:**
  - MDN: Using the Fetch API — https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - MDN: AbortController — https://developer.mozilla.org/en-US/docs/Web/API/AbortController

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1801`, `title: Fetch 模式與請求生命週期`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: 請求生命週期（request lifecycle）、取消請求（request cancellation）、基礎 URL（base URL）、回應狀態（response status）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1801.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1801.md"
  git commit -m "feat(fee): add FEE-1801 Fetch Patterns & Request Lifecycle (EN + zh-TW)"
  ```

---

### Task 3: FEE-1802 Server State Management

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1802.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1802.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1802`, `title: Server State Management`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** Server state management libraries — TanStack Query, SWR, RTK Query — solve a specific problem: fetching remote data, caching it, keeping it fresh, and synchronizing it across components. Before these libraries became standard, teams managed server state with Redux stores that manually implemented what the libraries provide by default: loading flags, error states, cache invalidation, and refetch triggers. The libraries do not replace client state management — they complement it by handling the server-side slice.

  **`## Design Thinking` subsections:**
  - `### Query keys as cache identifiers` — TanStack Query uses query keys — arrays or primitives that uniquely identify a query — as the cache key. `['user', userId]` and `['user', otherUserId]` are separate cache entries. When a mutation updates a user, invalidating `['user', userId]` triggers background refetching for every component subscribed to that key. Designing query keys with structure (resource type first, parameters after) makes invalidation predictable.
  - `### Stale time vs. garbage collection time` — `staleTime` controls when a cached response is considered fresh enough to use without background refetching (default: 0ms — always refetch). `gcTime` (previously `cacheTime`) controls how long an unused cached entry is kept before being garbage collected (default: 5 minutes). Setting a non-zero `staleTime` for data that changes infrequently — user profiles, configuration — eliminates redundant requests.
  - `### Dependent queries` — When a query depends on the result of a previous query (fetch user, then fetch user's organization), use the `enabled` option to defer the second query until the first resolves. This is cleaner than nesting callbacks and integrates with the library's loading/error state management.

  **`## Best Practices`:**

  **MUST structure query keys as arrays with the resource type as the first element and query-specific parameters (IDs, filters) as subsequent elements.** This structure enables targeted invalidation: `queryClient.invalidateQueries({ queryKey: ['users'] })` invalidates all user queries; `queryClient.invalidateQueries({ queryKey: ['users', userId] })` invalidates one. Flat string keys or inconsistent structures make invalidation broad and unpredictable.

  **MUST set `staleTime` to a non-zero value for data that changes infrequently.** The default `staleTime` of 0 means every component mount triggers a background refetch. For data like user profiles, configuration, and reference lists — data that changes on the scale of minutes to hours — a `staleTime` of 60000ms (one minute) or more eliminates redundant fetches without sacrificing consistency.

  **SHOULD use the `enabled` query option to defer dependent queries rather than nesting fetch calls.** A second query that depends on a first query's result should set `enabled: !!firstResult.data`. The library handles the loading state of both queries consistently, avoids the waterfall of nested callbacks, and provides a single error state surface for both queries.

  **SHOULD configure a global `QueryClient` with project-appropriate defaults for `staleTime`, `retry`, and `refetchOnWindowFocus` rather than relying on library defaults.** Library defaults are conservative and correct for general use but rarely optimal for a specific application. A global configuration captures the project's data freshness requirements in one place; per-query overrides handle exceptions.

  **`## Related FEEs`:**
  - FEE-600 — State Management Overview
  - FEE-1800 — Data Fetching Overview
  - FEE-1804 — Caching Strategies & Invalidation
  - FEE-1805 — Optimistic Updates & Mutation Patterns

  **`## References`:**
  - TanStack Query: Query Keys — https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
  - TanStack Query: Important Defaults — https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
  - SWR: Options — https://swr.vercel.app/docs/api

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1802`, `title: 伺服器狀態管理`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: 查詢鍵（query key）、快取失效（cache invalidation）、過期時間（stale time）、垃圾回收時間（garbage collection time）、依賴查詢（dependent query）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1802.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1802.md"
  git commit -m "feat(fee): add FEE-1802 Server State Management (EN + zh-TW)"
  ```

---

### Task 4: FEE-1803 GraphQL Client Integration

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1803.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1803.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1803`, `title: GraphQL Client Integration`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** GraphQL changes the data fetching contract from "fetch this endpoint" to "fetch these fields." The client declares the exact shape of the data it needs in a query document; the server returns exactly that shape. This eliminates over-fetching (receiving more data than needed) and under-fetching (needing a second request for related data). The cost is a more complex client layer: query documents, normalized caching, fragment composition, and code generation for TypeScript types.

  **`## Design Thinking` subsections:**
  - `### Normalized vs. document caching` — Apollo Client uses a normalized cache: entities are stored by `__typename:id` and shared across queries. A mutation that updates a user updates every query in the cache that includes that user. urql defaults to a document cache: each query result is stored as-is, and invalidation clears entire query results. Normalized caching is more powerful but more complex; document caching is simpler and often sufficient.
  - `### Code generation for type safety` — Writing TypeScript types for GraphQL responses manually is a maintenance hazard — they drift from the schema as the backend evolves. GraphQL Code Generator produces TypeScript types and typed query hooks directly from the schema and query documents. This makes the type boundary between frontend and backend explicit and automatically maintained.
  - `### Fragments as reusable field sets` — A fragment defines a named set of fields on a type: `fragment UserFields on User { id name email }`. Components that need the same fields use the same fragment. When a new field is needed, it is added to the fragment in one place. Fragments also enable fragment colocation: each component declares the fields it needs, and the parent query composes them.

  **`## Best Practices`:**

  **MUST use GraphQL Code Generator to produce TypeScript types from the schema and query documents rather than writing types manually.** Manually written types for GraphQL responses are not validated against the schema and drift silently when the backend schema evolves. Generated types are produced from the actual schema and query documents, ensuring that the TypeScript types match what the server will return. Run code generation as part of the development workflow and in CI.

  **MUST colocate query documents with the components that use them rather than storing them in a separate queries file.** A query document that lives in the component file makes the component's data dependencies visible without navigating to another file. It also enables fragment colocation: each component defines the fragment for its own fields, and parent components compose them into full queries.

  **SHOULD use fragments to share field sets across queries and components rather than repeating field lists.** Repeated field lists create the same drift problem as repeated type declarations: adding a new required field requires finding and updating every query that lists those fields. A fragment is updated once and all queries that use it gain the field automatically.

  **SHOULD configure the Apollo Client cache's `typePolicies` or urql's cache exchanges for entities that the application mutates frequently.** Default caching behavior may not correctly merge update responses with cached data. Configuring `keyFields` for entities with non-standard IDs and `merge` functions for paginated fields ensures that mutations and subscriptions update the cache predictably.

  **`## Related FEEs`:**
  - FEE-1800 — Data Fetching Overview
  - FEE-1802 — Server State Management
  - FEE-1804 — Caching Strategies & Invalidation
  - FEE-1708 — Runtime Validation & Schema Libraries

  **`## References`:**
  - Apollo Client documentation — https://www.apollographql.com/docs/react/
  - urql documentation — https://urql.dev/
  - GraphQL Code Generator — https://the-guild.dev/graphql/codegen

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1803`, `title: GraphQL 客戶端整合`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: 正規化快取（normalized cache）、文件快取（document cache）、程式碼生成（code generation）、片段（fragment）、查詢文件（query document）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1803.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1803.md"
  git commit -m "feat(fee): add FEE-1803 GraphQL Client Integration (EN + zh-TW)"
  ```

---

### Task 5: FEE-1804 Caching Strategies & Invalidation

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1804.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1804.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1804`, `title: Caching Strategies & Invalidation`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** Caching is not a single strategy — it is a spectrum from "always use cached data" to "never use cached data," with most real applications occupying a position that varies by data type. User profiles change rarely; shopping cart totals change on every mutation; real-time prices change continuously. A caching strategy that applies the same rules to all data types either wastes requests on infrequently-changing data or serves stale data where freshness matters.

  **`## Design Thinking` subsections:**
  - `### Cache layers: HTTP vs. application` — HTTP caching (Cache-Control, ETag, Last-Modified) operates at the network layer and is controlled by server response headers. Application caching (TanStack Query's in-memory cache, Apollo's normalized cache) operates in JavaScript and is controlled by the client. Both layers are useful; they solve different problems. HTTP caching reduces network requests; application caching eliminates component-level loading states for data already in memory.
  - `### Invalidation strategies: time-based vs. event-based` — Time-based invalidation (staleTime) serves data for a configurable duration before considering it stale. Event-based invalidation (call `invalidateQueries` after a mutation) marks data as stale immediately when a user action changes it. Most applications use both: time-based invalidation for background freshness, event-based invalidation for immediate consistency after mutations.
  - `### Cache keys and specificity` — The granularity of cache keys determines the granularity of invalidation. A key of `['users']` invalidates all user queries when any user changes. A key of `['users', userId]` invalidates only the specific user. Designing keys to match invalidation boundaries — what data changes together — is the central cache architecture decision.

  **`## Best Practices`:**

  **MUST invalidate queries immediately after mutations that change the data they represent.** Showing stale data after a user action — a list that still shows a deleted item, a balance that hasn't updated after a payment — produces confusion and the perception of a broken application. Call `queryClient.invalidateQueries({ queryKey: [resourceKey] })` in the mutation's `onSuccess` callback to trigger background refetching.

  **MUST set `Cache-Control` response headers on API responses to control browser and CDN caching behavior independently of the application cache.** Application-layer caching does not affect network-layer caching. Responses without `Cache-Control` headers get the browser's default caching behavior, which varies by browser and request type. Explicit `Cache-Control: no-store` for private data and `Cache-Control: max-age=3600` for public static data are intentional decisions that should not be left to browser defaults.

  **SHOULD use optimistic updates (see FEE-1805) for mutations where the expected result is deterministic rather than invalidating and waiting for a refetch.** Invalidating and refetching after a mutation introduces a loading state between the user's action and the UI update. For mutations with predictable outcomes — toggling a boolean, updating a name — updating the cache immediately and rolling back on error produces a more responsive experience.

  **SHOULD structure query keys hierarchically so that broad and specific invalidation are both possible.** A key structure of `['users', { status: 'active' }]` allows invalidating all users (`['users']`) or only active users. Flat keys like `'active-users'` allow only one granularity of invalidation. Design keys to match the natural invalidation boundaries in the application domain.

  **`## Related FEEs`:**
  - FEE-1802 — Server State Management
  - FEE-1805 — Optimistic Updates & Mutation Patterns
  - FEE-1303 — Service Worker Caching Strategies (PWA context)

  **`## References`:**
  - TanStack Query: Query Invalidation — https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
  - MDN: HTTP caching — https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
  - Google: HTTP Caching — https://web.dev/articles/http-cache

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1804`, `title: 快取策略與失效`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: HTTP 快取（HTTP caching）、應用程式快取（application cache）、失效策略（invalidation strategy）、快取鍵（cache key）、時間型失效（time-based invalidation）、事件型失效（event-based invalidation）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1804.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1804.md"
  git commit -m "feat(fee): add FEE-1804 Caching Strategies & Invalidation (EN + zh-TW)"
  ```

---

### Task 6: FEE-1805 Optimistic Updates & Mutation Patterns

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1805.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1805.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1805`, `title: Optimistic Updates & Mutation Patterns`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** A mutation is any operation that changes server state: creating a record, updating a field, deleting an item. The naive pattern — send the request, wait for success, update the UI — introduces latency between user action and visual feedback. On a fast connection the delay is imperceptible; on a slow connection it makes the application feel broken. Optimistic updates invert this: update the UI immediately with the expected result, send the request in the background, and roll back if the request fails.

  **`## Design Thinking` subsections:**
  - `### When optimistic updates are appropriate` — Optimistic updates work well when the expected mutation result is deterministic from the client's perspective: toggling a boolean, removing an item from a list, incrementing a counter. They work poorly when the server may reject the mutation or transform the data in ways the client cannot predict — form submissions with server-side validation, operations with side effects, operations where the server generates the new value (IDs, timestamps).
  - `### Rollback and error recovery` — An optimistic update that fails must restore the previous cache state. TanStack Query's `onMutate` callback returns the previous cache snapshot, which `onError` uses to reset. The rollback must happen before the error is shown to the user — a flash of incorrect data followed by a rollback is worse than no optimistic update.
  - `### Mutation queuing and concurrent mutations` — When a user triggers multiple mutations in rapid succession (clicking like/unlike repeatedly), concurrent mutations can produce out-of-order cache updates. Debouncing the trigger, queuing mutations, or using a last-write-wins strategy are the three approaches. The right choice depends on the operation's semantics.

  **`## Best Practices`:**

  **MUST save the previous cache state in `onMutate` and restore it in `onError` when implementing optimistic updates.** An optimistic update that fails without rollback leaves the UI in an incorrect state — showing data that does not reflect server reality. The rollback pattern in TanStack Query (`context` returned from `onMutate`, used in `onError`) is the standard implementation. Every optimistic update must have a corresponding rollback path.

  **MUST call `invalidateQueries` in `onSettled` (not `onSuccess`) to refetch data after a mutation that affects cached queries.** `onSuccess` fires only on successful mutations; `onSettled` fires after both success and error. Invalidating in `onSettled` ensures the cache reflects server state after the operation completes regardless of outcome — after a successful mutation to confirm the optimistic update, and after a failed mutation to confirm the rollback.

  **SHOULD use optimistic updates only for mutations where the expected result is deterministic from the client's perspective.** Form submissions that may be rejected by server-side validation, operations that trigger server-generated values (IDs, timestamps), and operations with complex side effects should not use optimistic updates — the client cannot reliably predict the new cache state, and an incorrect optimistic update requires a confusing rollback.

  **`## Related FEEs`:**
  - FEE-1802 — Server State Management
  - FEE-1804 — Caching Strategies & Invalidation

  **`## References`:**
  - TanStack Query: Optimistic Updates — https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  - TanStack Query: Mutations — https://tanstack.com/query/latest/docs/framework/react/guides/mutations

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1805`, `title: 樂觀更新與變更模式`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: 樂觀更新（optimistic update）、回滾（rollback）、變更（mutation）、快取快照（cache snapshot）、並發變更（concurrent mutations）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1805.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1805.md"
  git commit -m "feat(fee): add FEE-1805 Optimistic Updates & Mutation Patterns (EN + zh-TW)"
  ```

---

### Task 7: FEE-1806 Pagination & Infinite Loading

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1806.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1806.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1806`, `title: Pagination & Infinite Loading`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** Pagination is the mechanism that limits the amount of data transferred in a single response and allows the client to fetch additional pages on demand. The two dominant strategies — offset pagination and cursor pagination — have different performance characteristics and different implications for the client implementation. Infinite loading (fetching more results as the user scrolls) is a UX pattern built on either strategy and requires additional client-side concerns: maintaining accumulated results, triggering the next fetch, and handling the end-of-list state.

  **`## Design Thinking` subsections:**
  - `### Offset vs. cursor pagination` — Offset pagination uses a page number or item offset: `?page=2` or `?offset=20`. It is easy to implement and supports random-access navigation (jump to page 10), but produces inconsistent results when items are added or deleted between pages — items can appear twice or be skipped. Cursor pagination uses an opaque cursor pointing to the last fetched item: `?after=cursor123`. It is consistent regardless of insertions/deletions and is the recommended strategy for infinite scroll, but does not support random access.
  - `### Accumulating results in the client` — TanStack Query's `useInfiniteQuery` stores all fetched pages as an array and provides `fetchNextPage` and `hasNextPage` automatically. Without this abstraction, accumulating pages requires merging arrays in state, which produces stale closure bugs when the state update is inside an effect.
  - `### Virtualization for long lists` — Rendering thousands of DOM nodes for an accumulated infinite scroll list degrades scroll performance. Libraries like TanStack Virtual or react-window render only the visible items plus a buffer, keeping the DOM size constant regardless of how many items have been loaded.

  **`## Best Practices`:**

  **MUST use cursor-based pagination for infinite scroll implementations rather than offset-based pagination.** Offset pagination is inconsistent when the underlying list changes between page fetches: an item added at the top shifts all subsequent items, causing the next page fetch to skip an item or repeat one. Cursor pagination is anchored to a specific item and is consistent regardless of concurrent insertions or deletions.

  **MUST handle the end-of-list state explicitly when implementing infinite loading.** When `hasNextPage` is `false`, the "load more" trigger — whether a button or an intersection observer — must be disabled or hidden. Continuing to call `fetchNextPage` after all pages are fetched produces redundant requests. The end-of-list state is also a signal to render a "no more items" indicator rather than an endless loading spinner.

  **SHOULD use virtualization for lists that accumulate more than a few hundred items.** Rendering every accumulated item as a DOM node causes scroll jank at large counts. TanStack Virtual and react-window maintain a constant DOM size by rendering only visible items. The threshold for virtualization depends on item complexity, but a list that users can reasonably scroll to 500+ items should be virtualized.

  **`## Related FEEs`:**
  - FEE-1802 — Server State Management
  - FEE-1800 — Data Fetching Overview

  **`## References`:**
  - TanStack Query: Infinite Queries — https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
  - TanStack Virtual — https://tanstack.com/virtual/latest
  - Relay Cursor Connections Specification — https://relay.dev/graphql/connections.htm

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1806`, `title: 分頁與無限載入`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: 游標分頁（cursor pagination）、偏移分頁（offset pagination）、無限捲動（infinite scroll）、虛擬化（virtualization）、清單結尾狀態（end-of-list state）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1806.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1806.md"
  git commit -m "feat(fee): add FEE-1806 Pagination & Infinite Loading (EN + zh-TW)"
  ```

---

### Task 8: FEE-1807 Error Handling & Loading States

**Files:**
- Create: `docs/en/Data Fetching and Client-Server Integration/1807.md`
- Create: `docs/zh-tw/Data Fetching and Client-Server Integration/1807.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1807`, `title: Error Handling & Loading States`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  **Opening context:** A data-fetching operation has four states: idle (not yet triggered), loading (request in flight), success (data available), and error (request failed). Every component that fetches data must handle all four states — not because errors are common, but because they are inevitable, and because the difference between "shows a loading state" and "shows nothing" is the difference between a usable application and a broken one. The patterns for communicating these states to users have become standardized enough that choosing from them is more important than inventing new ones.

  **`## Design Thinking` subsections:**
  - `### Skeleton screens vs. spinners` — A spinner communicates "something is happening" without information about what or how much. A skeleton screen — a layout-matching placeholder — communicates structure and reduces the perception of latency by giving the user a preview of the content shape. Spinners are appropriate for operations with unpredictable duration or small UI areas; skeleton screens are appropriate for content that has a known layout.
  - `### Error boundary placement strategy` — React error boundaries catch rendering errors but not async errors. For async error states from data fetching, the pattern is to throw the error in the render function when `isError` is true, and to wrap the component in an error boundary. TanStack Query supports this with `throwOnError: true`. The placement of the error boundary determines the scope of the error UI — a per-component boundary shows an error in-place; a page-level boundary shows a full-page error state.
  - `### Retry logic` — TanStack Query retries failed requests three times with exponential backoff by default. Retry is appropriate for transient network failures; it is not appropriate for 4xx client errors (the request is wrong — retrying will not help). Configure `retry` to return `false` for 4xx responses and a count for network failures.

  **`## Best Practices`:**

  **MUST render distinct UI for loading, error, and empty states rather than relying on the success state to handle all cases.** An absent loading state produces a blank screen or a partial render that flickers when data arrives. An absent error state leaves the user with no information and no recovery path. An absent empty state renders a component designed for content with no content — often broken layout or invisible "no items" text that the design assumed would never appear.

  **MUST configure retry logic to distinguish between transient failures and client errors.** The default TanStack Query retry of 3 attempts is appropriate for network failures. For 4xx responses — the request is malformed or unauthorized — retry wastes time and produces confusing behavior. Set `retry: (failureCount, error) => error.status >= 500` to retry only server errors.

  **SHOULD use skeleton screens for content with a known layout and spinners only for operations where the result shape is unpredictable or the UI area is small.** A skeleton screen sets accurate expectations about the content's structure and reduces perceived latency. A spinner fills time without information. The choice communicates something to the user: a skeleton says "here is where the content will be"; a spinner says "something is happening."

  **SHOULD reset error state when the user triggers a retry action rather than requiring a full page refresh.** TanStack Query provides `refetch()` from the `useQuery` hook. An error state that shows a "Try again" button and calls `refetch()` in its `onClick` handler gives the user agency and avoids the jarring experience of a full page reload for a transient error.

  **`## Common Mistakes`:**

  **Showing a loading state indefinitely when a request stalls.** A request that never completes — due to a hung server or a cancelled request — leaves the loading state visible indefinitely. Set a request timeout using `AbortController` and a `setTimeout`, and handle the `AbortError` as a distinct error state with a "Request timed out" message.

  **`## Related FEEs`:**
  - FEE-1800 — Data Fetching Overview
  - FEE-1802 — Server State Management
  - FEE-507 — Error Boundaries & Resilience Patterns

  **`## References`:**
  - TanStack Query: Error Handling — https://tanstack.com/query/latest/docs/framework/react/guides/query-retries
  - Nielsen Norman Group: Progress Indicators — https://www.nngroup.com/articles/progress-indicators/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1807`, `title: 錯誤處理與載入狀態`, `state: draft`, `category: Data Fetching and Client-Server Integration`

  Key terms: 載入狀態（loading state）、錯誤狀態（error state）、空狀態（empty state）、骨架畫面（skeleton screen）、重試邏輯（retry logic）、錯誤邊界（error boundary）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Data Fetching and Client-Server Integration/1807.md" "docs/zh-tw/Data Fetching and Client-Server Integration/1807.md"
  git commit -m "feat(fee): add FEE-1807 Error Handling & Loading States (EN + zh-TW)"
  ```
