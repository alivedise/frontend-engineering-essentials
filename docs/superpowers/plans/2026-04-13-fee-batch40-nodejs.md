# FEE Batch 40 — Node.js for Frontend Engineers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write all 7 Node.js for Frontend Engineers category articles (FEE-2200 through FEE-2206) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW translation. Articles follow the standard FEE format. The category is written from the perspective of frontend engineers who understand the browser environment and need to build a mental model of Node.js and the server-side layer. Framework examples use Next.js as the primary reference (most widely adopted), with notes on Nuxt and Remix where the patterns differ.

**Tech Stack:** Markdown, content authoring. Reference `docs/en/Developer Experience and Tooling/1603.md` for format.

---

## File Map

**New directories to create:**
- `docs/en/Node.js for Frontend Engineers/`
- `docs/zh-tw/Node.js for Frontend Engineers/`

**Files to create (EN):** `2200.md` through `2206.md` under `docs/en/Node.js for Frontend Engineers/`
**Files to create (zh-TW):** Mirror under `docs/zh-tw/Node.js for Frontend Engineers/`

---

### Task 1: FEE-2200 Node.js for Frontend Engineers Overview

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2200.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2200.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 2200
  title: Node.js for Frontend Engineers Overview
  state: draft
  overview: true
  category: Node.js for Frontend Engineers
  ---
  ```

  **Opening context (3–4 paragraphs):**
  - Frontend engineers have always run Node.js — every build tool, dev server, and linter in the frontend ecosystem runs on Node.js. But running Node.js as a build tool is different from writing Node.js application code. The shift to server-side rendering, API routes, edge functions, and backend-for-frontend patterns means frontend engineers now routinely write code that runs on the server. This code runs in a different environment with different capabilities, different failure modes, and different security concerns than browser code.
  - The mental model transfer from browser to Node.js is mostly straightforward — JavaScript is JavaScript — but the differences are significant enough to cause bugs. There is no `window`, no `document`, no browser APIs. There is `process`, `fs`, and access to system resources. Secrets can be stored in environment variables without exposure to the client. Requests arrive as HTTP, not as user interactions. Understanding these differences prevents the class of bugs that come from browser assumptions surviving the environment change.
  - This category covers Node.js from the frontend engineer's perspective: the runtime model, server-side rendering patterns (framework-agnostic), API routes and the BFF pattern, edge functions and their constraints, middleware patterns, and environment variable management. It assumes familiarity with the browser JavaScript environment and frames the Node.js concepts in terms of browser analogues where applicable.

  **`## Design Thinking` subsections:**
  - `### The server/client boundary` — The fundamental concept in modern full-stack frontend is the server/client boundary: code that runs on the server has access to secrets, databases, and the file system but has no window or DOM; code that runs in the browser has access to user interaction, browser APIs, and the visual layer but must not contain secrets. The boundary is enforced by build tools and framework conventions, but it is the developer's responsibility to understand which side of the boundary each piece of code belongs on.
  - `### Node.js vs. the edge runtime` — Node.js is a full-featured JavaScript runtime with access to the entire Node.js API surface. The edge runtime (Vercel Edge Functions, Cloudflare Workers, Next.js Edge Runtime) is a subset runtime based on V8 isolates — it provides the Web APIs (`fetch`, `Request`, `Response`, `crypto`) but not Node.js built-ins (`fs`, `child_process`, `http`). Code written for the edge runtime cannot use Node.js-specific packages. This distinction matters for choosing where server-side code should run.
  - `### Security on the server` — Browser code runs in a sandboxed environment where the damage from bugs is limited. Server code runs with access to databases, secrets, and infrastructure. An injection vulnerability in browser code is a client-side problem; the same vulnerability in server code can expose the entire database. Server code requires the same security discipline as backend code: input validation at every entry point, parameterized queries, no secret exposure in responses.

  **`## Best Practices`:**

  **MUST treat all user-provided input as untrusted on the server, regardless of whether it was validated on the client.** Client-side validation can be bypassed by sending requests directly to the API route. Server-side validation must be independent and complete. Input that reaches a database query, a file path, or a shell command without server-side validation is a potential injection vulnerability.

  **MUST keep secrets (API keys, database credentials, signing keys) in server-only environment variables and never expose them to the client bundle.** In Next.js, environment variables without the `NEXT_PUBLIC_` prefix are available only on the server. Exposing secrets in the client bundle — accidentally including them in a server component that serializes to the client, or using them in a component that runs on both sides — makes them visible to anyone who inspects the bundle.

  **SHOULD use TypeScript for server-side code at the same strictness level as client-side code.** The type safety argument is stronger on the server: a type error in server code can expose incorrect data to all users, not just the user experiencing the bug. The same `strict: true` tsconfig applies; the same schema validation at boundaries applies.

  **`## Related FEEs`:**
  - FEE-2201 — Node.js Runtime Model
  - FEE-2202 — Server-Side Rendering Patterns
  - FEE-2206 — Environment Variables & Configuration
  - FEE-700 — Rendering & Performance Overview

  **`## References`:**
  - Node.js documentation — https://nodejs.org/en/docs/
  - Next.js: Server Components — https://nextjs.org/docs/app/building-your-application/rendering/server-components
  - Cloudflare Workers: Runtime APIs — https://developers.cloudflare.com/workers/runtime-apis/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2200`, `title: 前端工程師的 Node.js 總覽`, `state: draft`, `overview: true`, `category: Node.js for Frontend Engineers`

  Key terms: 伺服器/客戶端邊界（server/client boundary）、邊緣執行環境（edge runtime）、Node.js 執行環境（Node.js runtime）、伺服器端安全（server-side security）、環境變數（environment variables）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2200.md" "docs/zh-tw/Node.js for Frontend Engineers/2200.md"
  git commit -m "feat(fee): add FEE-2200 Node.js for Frontend Engineers Overview (EN + zh-TW)"
  ```

---

### Task 2: FEE-2201 Node.js Runtime Model

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2201.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2201.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2201`, `title: Node.js Runtime Model`, `state: draft`, `category: Node.js for Frontend Engineers`

  **Opening context:** Node.js uses the same V8 JavaScript engine as Chrome and the same event loop model as the browser. The async/await, Promises, and event loop that frontend engineers already understand work the same way on the server. The differences are in the environment: the global object is `global` (or `globalThis`), not `window`; the module system was originally CommonJS (`require`) before ESM adoption; file system, network, and process APIs are available; and the execution context is a long-lived process, not a tab that closes.

  **`## Design Thinking` subsections:**
  - `### The event loop on the server` — Node.js's event loop is single-threaded: I/O callbacks, timers, and Promise microtasks all execute on one thread. A synchronous operation that blocks the thread — a large JSON parse, a CPU-intensive computation, a synchronous file read — blocks all other request processing until it completes. This is the same reason `while` loops in browser JavaScript freeze the UI, except the consequence on a server is blocking all concurrent request handling.
  - `### CommonJS vs. ESM` — Node.js originally used CommonJS (`require`, `module.exports`). ESM (`import`, `export`) is now supported natively in Node.js 12+ and is the preferred format for new code. The two systems cannot be mixed without adaptation: a `.mjs` file uses ESM; a `.cjs` file uses CommonJS; `"type": "module"` in `package.json` makes `.js` files use ESM. Most modern Node.js frameworks (Next.js, Nuxt, Astro) use ESM by default.
  - `### Process lifetime vs. request lifetime` — A browser tab has a lifetime aligned to the page session. A Node.js server process has a lifetime aligned to the deployment — it handles thousands of requests before being restarted. This has two implications: (1) memory leaks accumulate across requests and eventually crash the process; (2) process-level state (module-level variables) persists across requests and must not contain per-request data.

  **`## Best Practices`:**

  **MUST NOT perform synchronous blocking I/O in Node.js request handlers.** `fs.readFileSync`, `execSync`, and other synchronous I/O operations block the event loop for all concurrent requests until they complete. Use async equivalents: `fs.readFile` with `await`, `fs.promises.readFile`, or `import { readFile } from 'fs/promises'`. The async versions yield the event loop during I/O, allowing other requests to be processed concurrently.

  **MUST NOT store per-request state in module-level variables.** Module-level variables in Node.js persist for the lifetime of the process — across all requests. A module-level variable assigned in one request is visible in the next request from a different user. Per-request state belongs in the request handler's local scope or in request-scoped storage (AsyncLocalStorage).

  **SHOULD use Node.js ESM (`import`/`export`) for new server-side code and configure `"type": "module"` in `package.json` rather than using CommonJS.** ESM is the standard for JavaScript modules, supported by all modern bundlers, runtimes, and browsers. New projects should not adopt CommonJS. Existing CommonJS code can be migrated incrementally.

  **`## Related FEEs`:**
  - FEE-301 — Event Loop & Async Model (browser context)
  - FEE-2200 — Node.js for Frontend Engineers Overview

  **`## References`:**
  - Node.js: Event Loop documentation — https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick
  - Node.js: ES Modules — https://nodejs.org/api/esm.html
  - Node.js: AsyncLocalStorage — https://nodejs.org/api/async_context.html#class-asynclocalstorage

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2201`, `title: Node.js 執行環境模型`, `state: draft`, `category: Node.js for Frontend Engineers`

  Key terms: 事件迴圈（event loop）、非同步 I/O（async I/O）、CommonJS、ES 模組（ES modules）、行程級別狀態（process-level state）、非同步本地儲存（AsyncLocalStorage）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2201.md" "docs/zh-tw/Node.js for Frontend Engineers/2201.md"
  git commit -m "feat(fee): add FEE-2201 Node.js Runtime Model (EN + zh-TW)"
  ```

---

### Task 3: FEE-2202 Server-Side Rendering Patterns

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2202.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2202.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2202`, `title: Server-Side Rendering Patterns`, `state: draft`, `category: Node.js for Frontend Engineers`

  **Opening context:** Server-side rendering (SSR) is covered from a performance and rendering-strategy perspective in FEE-701 ("Rendering Strategies: CSR, SSR, SSG & Streaming"). This article covers SSR from the Node.js execution perspective: what happens on the server during a request, how data is fetched, how the server and client hydration contract is maintained, and how to avoid the waterfall patterns that make SSR slower than client-side rendering.

  **`## Design Thinking` subsections:**
  - `### The server rendering request lifecycle` — When a request arrives for an SSR page, the server: (1) parses URL parameters, (2) fetches required data (from a database, API, or cache), (3) renders the component tree to HTML (using `renderToString` or streaming), (4) injects data into the HTML as serialized JSON for hydration, (5) sends the response. Steps 2 and 3 are the performance-sensitive operations. Data fetching in step 2 must be parallel where possible; rendering in step 3 should not be blocked by sequential data fetches.
  - `### Avoiding server-side waterfalls` — A server-side waterfall occurs when data is fetched sequentially rather than in parallel: fetch user, then fetch user's organization, then fetch organization's projects. The total server time is the sum of all fetch durations. Parallel fetching with `Promise.all` reduces this to the duration of the slowest fetch. React Server Components and Next.js's `fetch` deduplication help, but the fundamental pattern — fetch all required data in parallel before rendering — is framework-agnostic.
  - `### The hydration contract` — SSR generates HTML on the server. The client downloads the HTML, displays it (first contentful paint), then downloads and executes JavaScript to "hydrate" the static HTML into an interactive React (or framework) application. For hydration to succeed without a mismatch error, the client's first render must produce the same virtual DOM as the server's render. This means data fetched on the server must be available on the client at hydration time, and no browser-only APIs can be called during the server render.

  **`## Best Practices`:**

  **MUST fetch all data required for a server-rendered page in parallel rather than sequentially.** Sequential data fetching on the server accumulates latency: three 100ms API calls fetched sequentially take 300ms; fetched in parallel, they take 100ms. Use `Promise.all` for parallel fetches with no dependencies between them and structured parallel fetching for the dependency tree of data the page requires.

  **MUST guard browser-only API calls with environment checks when they appear in code that runs on both server and client.** `window`, `document`, `localStorage`, and `navigator` are undefined in Node.js. Code that accesses these in a component that server-renders will throw during the server render. Guard with `typeof window !== 'undefined'` or restructure the code to run browser-only logic in a `useEffect` (which runs only on the client).

  **SHOULD use streaming SSR (React 18's `renderToPipeableStream`, Next.js `Suspense` streaming) rather than `renderToString` for pages with slow data dependencies.** `renderToString` produces a complete HTML string but blocks the response until all data is ready. Streaming sends the shell HTML immediately and streams content as data resolves, producing a faster first byte. Pages with slow non-critical data (comments, recommendations) benefit most.

  **`## Related FEEs`:**
  - FEE-701 — Rendering Strategies: CSR, SSR, SSG & Streaming
  - FEE-703 — Hydration & Partial Hydration
  - FEE-2200 — Node.js for Frontend Engineers Overview

  **`## References`:**
  - React: renderToPipeableStream — https://react.dev/reference/react-dom/server/renderToPipeableStream
  - Next.js: Data Fetching — https://nextjs.org/docs/app/building-your-application/data-fetching

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2202`, `title: 伺服器端渲染模式`, `state: draft`, `category: Node.js for Frontend Engineers`

  Key terms: 伺服器端渲染（SSR）、資料獲取瀑布（data fetching waterfall）、水合（hydration）、串流渲染（streaming SSR）、平行資料獲取（parallel data fetching）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2202.md" "docs/zh-tw/Node.js for Frontend Engineers/2202.md"
  git commit -m "feat(fee): add FEE-2202 Server-Side Rendering Patterns (EN + zh-TW)"
  ```

---

### Task 4: FEE-2203 API Routes & Backend for Frontend

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2203.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2203.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2203`, `title: API Routes & Backend for Frontend`, `state: draft`, `category: Node.js for Frontend Engineers`

  **Opening context:** API routes are server-side request handlers defined alongside frontend code in a full-stack framework. In Next.js, a file at `app/api/route.ts` handles HTTP requests to `/api/...`. API routes eliminate the need for a separate backend service for operations that are closely coupled to the frontend — proxying third-party APIs (to hide API keys), aggregating data from multiple services, handling form submissions, and managing session tokens. The Backend for Frontend (BFF) pattern formalizes this: the BFF is a server-side layer owned by the frontend team that adapts multiple backend services into the shape the frontend needs.

  **`## Design Thinking` subsections:**
  - `### When to use an API route vs. a server component` — React Server Components (Next.js App Router) can fetch data directly from databases and services during render — without an API route. API routes are appropriate when: the client needs to call the server after the initial render (mutations, form submissions, polling), the endpoint needs to be called from multiple clients (mobile app + web app), or the response needs HTTP-level control (custom headers, status codes, streaming).
  - `### The BFF pattern` — A backend service designed for general use returns all data relevant to any consumer. The frontend typically needs a specific subset of that data in a specific shape. The BFF is a thin server layer that fetches from the backend service and transforms the response into the exact shape the frontend needs — reducing payload size, aggregating data from multiple services, and hiding backend complexity from the client.
  - `### API route security` — API routes run on the server with access to secrets, but they are publicly accessible HTTP endpoints. Every API route that modifies data must verify authentication (is this user logged in?) and authorization (does this user have permission to do this?). Missing auth checks in API routes are a common vulnerability in full-stack frameworks.

  **`## Best Practices`:**

  **MUST validate and authenticate every API route that reads or writes sensitive data.** An unauthenticated API route that reads user data is a data exposure vulnerability. An unauthenticated API route that writes data is a data integrity vulnerability. Authentication (verifying identity) and authorization (verifying permission) must both be checked at the start of every sensitive route handler, before any database or service call.

  **MUST validate the shape and content of request bodies in API routes using a schema library before processing them.** Request bodies arrive as arbitrary data. A schema validation at the route entry point — using Zod or an equivalent — ensures that the handler processes only correctly shaped inputs and returns structured validation errors for malformed requests rather than runtime exceptions.

  **SHOULD use the BFF pattern to aggregate and transform data from multiple backend services rather than making multiple API calls from the client.** Multiple client-to-server round-trips for data that is always needed together produce waterfalls and excessive network overhead. A BFF route that fetches and aggregates the data in one server-to-server request reduces the client to one round-trip and keeps aggregation logic on the server where it can access internal services.

  **`## Related FEEs`:**
  - FEE-2200 — Node.js for Frontend Engineers Overview
  - FEE-2205 — Middleware Patterns
  - FEE-1200 — Security Overview
  - FEE-1801 — Fetch Patterns & Request Lifecycle

  **`## References`:**
  - Next.js: Route Handlers — https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  - BFF Pattern (Sam Newman) — https://samnewman.io/patterns/architectural/bff/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2203`, `title: API 路由與前端後端模式`, `state: draft`, `category: Node.js for Frontend Engineers`

  Key terms: API 路由（API route）、前端後端（Backend for Frontend / BFF）、伺服器元件（server component）、請求驗證（request validation）、認證與授權（authentication and authorization）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2203.md" "docs/zh-tw/Node.js for Frontend Engineers/2203.md"
  git commit -m "feat(fee): add FEE-2203 API Routes & Backend for Frontend (EN + zh-TW)"
  ```

---

### Task 5: FEE-2204 Edge Functions & Edge Runtime

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2204.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2204.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2204`, `title: Edge Functions & Edge Runtime`, `state: draft`, `category: Node.js for Frontend Engineers`

  **Opening context:** Edge functions run JavaScript in a restricted runtime (V8 isolates) at CDN edge locations geographically close to the user. The promise: a serverless function that runs in 5ms from the user's nearest edge location rather than 200ms from a central server region. The cost: the edge runtime is not Node.js — it does not have access to Node.js built-in modules (`fs`, `http`, `crypto`), and many npm packages that rely on Node.js APIs will not run at the edge. Understanding what the edge runtime can and cannot do determines whether it is the right execution environment for a given piece of code.

  **`## Design Thinking` subsections:**
  - `### Edge runtime constraints` — The edge runtime provides Web APIs: `fetch`, `Request`, `Response`, `Headers`, `URL`, `TextEncoder`, `TextDecoder`, `crypto` (the Web Crypto API), and `ReadableStream`. It does not provide Node.js built-ins. Code that imports `fs`, `path`, `child_process`, `http`, or any package that depends on these will fail at the edge. Before deploying to the edge, verify that all dependencies are edge-compatible.
  - `### When the edge is the right choice` — Edge functions excel for: request manipulation (A/B routing, authentication redirects, locale redirects) where the decision can be made from the request alone; serving personalized cached content; and latency-sensitive operations where geographic proximity matters. Edge functions are not appropriate for: operations requiring Node.js APIs, database connections (connection pooling at the edge is complex), or computationally expensive operations (V8 isolates have CPU time limits).
  - `### Cold starts and warm execution` — Traditional serverless functions have cold start latency — the first request to an idle function takes longer while the runtime initializes. V8 isolates have near-zero cold start latency because they are lighter weight than a Node.js process. This is the primary performance advantage of the edge runtime over Node.js serverless functions for latency-sensitive operations.

  **`## Best Practices`:**

  **MUST verify that all imports used by edge function code are compatible with the edge runtime before deploying.** Importing a package that uses Node.js built-ins in an edge function causes a build error (in frameworks that check compatibility) or a runtime error (in frameworks that do not). Check compatibility by reviewing the package's documentation or by examining whether it uses Node.js built-ins in its source.

  **SHOULD use edge functions for request-level routing decisions (authentication checks, locale redirects, A/B routing) rather than for data-heavy operations.** Edge functions can read request headers, cookies, and URL parameters and produce redirects or rewrites with minimal latency. This use case — a redirect or rewrite decision made in under 10ms at the network edge — is the highest-value application of edge functions and fits within the edge runtime's constraints without Node.js APIs.

  **SHOULD run database queries and service calls from a Node.js serverless function rather than an edge function.** Database drivers typically use Node.js networking APIs. Edge-compatible database clients exist (Neon, PlanetScale's HTTP API, Cloudflare D1) but are limited in their feature set. Unless the database client is explicitly edge-compatible, run data access code in Node.js serverless functions and use edge functions only for the routing layer.

  **`## Related FEEs`:**
  - FEE-2200 — Node.js for Frontend Engineers Overview
  - FEE-2205 — Middleware Patterns
  - FEE-1503 — Deployment Strategies

  **`## References`:**
  - Vercel: Edge Functions — https://vercel.com/docs/functions/edge-functions
  - Cloudflare Workers: Runtime APIs — https://developers.cloudflare.com/workers/runtime-apis/
  - Next.js: Edge Runtime — https://nextjs.org/docs/app/api-reference/edge

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2204`, `title: 邊緣函式與邊緣執行環境`, `state: draft`, `category: Node.js for Frontend Engineers`

  Key terms: 邊緣函式（edge function）、邊緣執行環境（edge runtime）、V8 隔離器（V8 isolate）、冷啟動（cold start）、CDN 邊緣節點（CDN edge location）、執行環境限制（runtime constraints）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2204.md" "docs/zh-tw/Node.js for Frontend Engineers/2204.md"
  git commit -m "feat(fee): add FEE-2204 Edge Functions & Edge Runtime (EN + zh-TW)"
  ```

---

### Task 6: FEE-2205 Middleware Patterns

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2205.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2205.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2205`, `title: Middleware Patterns`, `state: draft`, `category: Node.js for Frontend Engineers`

  **Opening context:** Middleware is a function that runs before a request reaches its handler. It can inspect the request, modify it, produce a response, or pass control to the next middleware or handler. In Next.js, `middleware.ts` at the project root runs before every request (or a subset defined by the `matcher` config). Middleware is the right place for cross-cutting concerns that apply to many routes: authentication checks, locale routing, security headers, and A/B routing.

  **`## Design Thinking` subsections:**
  - `### What belongs in middleware` — Middleware is appropriate for: authentication redirects (redirect unauthenticated users to login), locale detection and redirect, setting response headers (CORS, security headers, cache-control), A/B testing routing, and geolocation-based routing. Middleware runs on every matching request, so it must be fast. Database queries and slow external API calls do not belong in middleware.
  - `### Middleware execution order` — When multiple middleware functions apply to a request, their execution order matters. In Next.js there is a single `middleware.ts` file — chaining is done within it. In Express and similar frameworks, middleware is registered in order and runs top-to-bottom. The authentication check middleware should run before any middleware that assumes an authenticated user.
  - `### Middleware vs. API route vs. server component` — Middleware runs before the route handler on every request — it sees all requests, not just specific routes. An API route handler runs for requests to a specific path. A server component runs during rendering. The rule: cross-cutting request concerns → middleware. Route-specific logic → API route handler or server component. Do not put rendering or data-fetching logic in middleware.

  **`## Best Practices`:**

  **MUST keep middleware fast — avoid any operation that requires a database query or an external HTTP request in middleware.** Middleware runs on every matching request. A 50ms database call in middleware adds 50ms to every request's latency. Authentication in middleware should be done by verifying a JWT or a signed session cookie in memory, not by querying a database. If database verification is required, do it in the route handler, not in middleware.

  **MUST use `matcher` configuration to limit middleware execution to routes where it is needed.** Middleware that runs on every request including static assets, API routes that handle their own auth, and health check endpoints wastes execution time. `matcher: ['/dashboard/:path*', '/api/:path*']` limits execution to the routes that actually need the middleware's cross-cutting logic.

  **SHOULD add security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) in middleware rather than in individual route handlers.** Security headers that should apply to all responses belong in middleware, where they are set once and apply consistently. Setting them per-route creates the risk of missing a new route or forgetting to update all routes when a header value changes.

  **`## Related FEEs`:**
  - FEE-2200 — Node.js for Frontend Engineers Overview
  - FEE-2203 — API Routes & Backend for Frontend
  - FEE-2204 — Edge Functions & Edge Runtime
  - FEE-1206 — HTTPS, Secure Headers & Cookie Attributes

  **`## References`:**
  - Next.js: Middleware — https://nextjs.org/docs/app/building-your-application/routing/middleware
  - Express: Writing middleware — https://expressjs.com/en/guide/writing-middleware.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2205`, `title: 中介軟體模式`, `state: draft`, `category: Node.js for Frontend Engineers`

  Key terms: 中介軟體（middleware）、請求攔截（request interception）、跨切關注（cross-cutting concern）、安全標頭（security headers）、路由比對器（matcher）、執行順序（execution order）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2205.md" "docs/zh-tw/Node.js for Frontend Engineers/2205.md"
  git commit -m "feat(fee): add FEE-2205 Middleware Patterns (EN + zh-TW)"
  ```

---

### Task 7: FEE-2206 Environment Variables & Configuration

**Files:**
- Create: `docs/en/Node.js for Frontend Engineers/2206.md`
- Create: `docs/zh-tw/Node.js for Frontend Engineers/2206.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 2206`, `title: Environment Variables & Configuration`, `state: draft`, `category: Node.js for Frontend Engineers`

  **Opening context:** Environment variables are the mechanism by which server-side configuration — API keys, database URLs, feature flag values, environment names — is injected into a running application without being hardcoded in source code. The twelve-factor app methodology codifies this as Factor III: config. Frontend applications have an additional constraint: some configuration must be available on the client (public API URLs, analytics IDs) while other configuration must remain server-only (API secret keys, database credentials). This public/secret distinction must be enforced at the framework level, not by convention.

  **`## Design Thinking` subsections:**
  - `### Public vs. server-only variables` — In Next.js, environment variables are server-only by default. Variables prefixed with `NEXT_PUBLIC_` are embedded in the client bundle and are visible to all users. In Vite, variables prefixed with `VITE_` are exposed to the client. The prefix convention enforces the boundary at the framework level: variables without the prefix cannot be accessed in client-side code. Never use the public prefix for secrets.
  - `### Validation at startup` — An application that starts without a required environment variable will fail at runtime — often on a code path that is not hit until a user performs a specific action, not on startup. Validating all required environment variables at startup — before any request is handled — produces a clear error message at deployment time rather than a cryptic runtime error. t3-env and Zod-based startup validation are the standard tools.
  - `### .env file hierarchy` — `.env` contains base defaults committed to version control. `.env.local` contains local overrides not committed (gitignored). `.env.production` contains production-specific values. `.env.local` overrides `.env`. The hierarchy allows base configuration in version control while keeping local and secret values out. Secret values should never be in `.env` committed to version control.

  **`## Best Practices`:**

  **MUST validate all required environment variables at application startup using a schema, not with ad-hoc `process.env.VAR || 'default'` patterns.** `process.env.VAR || 'default'` silently uses the default when the variable is missing, masking configuration errors. A startup schema (using Zod or t3-env) validates types and required status for all variables before the first request is served, producing a clear error with the missing variable name if validation fails.

  **MUST NOT commit `.env.local` or any file containing real secret values to version control.** `.env.local` is listed in `.gitignore` by Next.js and Vite by default for this reason. Real secret values committed to version control are permanently in the repository's history even after being removed — the only remediation is rotating the secret. Add `.env*.local` and `.env.production.local` to `.gitignore` and verify with a pre-commit hook.

  **MUST use the framework's public variable prefix (`NEXT_PUBLIC_`, `VITE_`) only for variables that are genuinely safe to expose to all users.** Public variables are embedded in the client JavaScript bundle and are visible to anyone who inspects the bundle or network traffic. API keys, signing secrets, and database credentials must never be prefixed with a public prefix, regardless of their purpose.

  **SHOULD document all required environment variables in a `.env.example` file committed to version control.** `.env.example` contains all required variable names with placeholder values (no real secrets). New team members and deployment environments use `.env.example` as the template. Without it, missing variables are discovered by running the application and encountering errors, not before.

  **`## Related FEEs`:**
  - FEE-2200 — Node.js for Frontend Engineers Overview
  - FEE-1200 — Security Overview

  **`## References`:**
  - t3-env documentation — https://env.t3.gg/
  - twelve-factor app: Config — https://12factor.net/config
  - Next.js: Environment Variables — https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 2206`, `title: 環境變數與設定管理`, `state: draft`, `category: Node.js for Frontend Engineers`

  Key terms: 環境變數（environment variables）、公開變數（public variables）、機密變數（secret variables）、啟動時期驗證（startup validation）、十二要素應用程式（twelve-factor app）、.env 階層（.env hierarchy）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Node.js for Frontend Engineers/2206.md" "docs/zh-tw/Node.js for Frontend Engineers/2206.md"
  git commit -m "feat(fee): add FEE-2206 Environment Variables & Configuration (EN + zh-TW)"
  ```
