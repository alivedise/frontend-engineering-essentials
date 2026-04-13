# FEE Gap-Fill Batch H — CI/CD & DX Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 5 gap-fill articles — 3 for CI/CD (FEE-1508–1510) and 2 for DX Tooling (FEE-1608–1609) — in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/CI CD and Deployment/1508.md` — Cache Invalidation at Scale
- `docs/en/CI CD and Deployment/1509.md` — Rollback Strategies for Frontend Deployments
- `docs/en/CI CD and Deployment/1510.md` — Multi-Region & Edge Deployments
- `docs/en/Developer Experience and Tooling/1608.md` — Debugging Workflows & DevTools Profiling
- `docs/en/Developer Experience and Tooling/1609.md` — Local Development Environment Setup

**Files to create (zh-TW):** Mirror under `docs/zh-tw/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Batch 12+ template: Opening → `## Principle` → `## Design Thinking` → `## Best Practices` → `## Visual` → `## Example` → `## Common Mistakes` (optional) → `## Related FEEs` → `## References`. Target: 300+ lines per file.

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

---

### Task 1: FEE-1508 Cache Invalidation at Scale

**Files:**
- Create: `docs/en/CI CD and Deployment/1508.md`
- Create: `docs/zh-tw/CI CD and Deployment/1508.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1508
  title: Cache Invalidation at Scale
  state: draft
  category: CI CD and Deployment
  ---
  ```

  **H1:** `# Cache Invalidation at Scale`

  **Opening (2–4 paragraphs covering):**
  - Cache invalidation is one of the two genuinely hard problems in computer science. In frontend deployment, the challenge is specific: static assets (JS, CSS, images) should be cached as long as possible to minimize bandwidth and latency, but when they change, users must receive the new versions immediately — not days later when their browser cache expires. The solution is not shorter cache TTLs; it is content-addressed filenames.
  - Content-addressed filenames — where the filename includes a hash of the file's content — allow long-lived caching and immediate invalidation simultaneously. A bundle named `app.a4f3b2c1.js` can be cached with `Cache-Control: max-age=31536000, immutable`. When the bundle changes, the new build produces `app.e8d7c6b5.js` — a different filename. Old clients continue using `app.a4f3b2c1.js` (from cache) until they reload; new visitors receive `app.e8d7c6b5.js` immediately.
  - The one resource that cannot use content-addressed filenames is the HTML entry point. The HTML file references the current bundles by their content-addressed filenames; it must not be aggressively cached, or clients will load old HTML that references old bundles even after new bundles are deployed. The HTML entry point should use `Cache-Control: no-cache` or a short `max-age` with `must-revalidate`.

  **`## Principle`:**

  Engineers MUST configure content-addressed filenames for all static assets (JS bundles, CSS, fonts, images) and serve them with `Cache-Control: max-age=31536000, immutable`. Content-addressed naming is the only strategy that simultaneously achieves maximum cache efficiency (no re-downloads until the content changes) and immediate invalidation (new content has a new URL). The `immutable` directive tells browsers the asset will never change at this URL, preventing conditional requests even within the `max-age` window.

  Engineers MUST serve HTML entry points with `Cache-Control: no-cache` (or equivalently, `Cache-Control: max-age=0, must-revalidate`). The HTML file contains references to versioned asset URLs; if the HTML is cached by the browser or CDN, a new deployment that changes bundle hashes will not be reflected until the HTML cache expires. `no-cache` causes the browser to revalidate the HTML on every navigation without requiring it to re-download it if the content has not changed (conditional GET with `ETag`).

  **`## Design Thinking` subsections:**
  - `### Content-addressed vs. version-based filenames` — `app.a4f3b2c1.js` (content hash) vs. `app.v2.1.3.js` (version number). Content hashes are more granular: two builds with the same version that produce the same output produce the same hash and use the cached version. Version numbers change even when content does not.
  - `### CDN cache invalidation` — CDN caches (CloudFront, Fastly, Cloudflare) cache responses independently of browser caches. Content-addressed filenames make CDN cache invalidation unnecessary for assets. HTML entry points may need CDN invalidation on deploy if the CDN caches `no-cache` responses (some CDNs do).
  - `### Service worker and asset caching` — Service workers precache content-addressed assets. When the manifest changes (new build), the service worker receives new URLs to cache. Old cached assets are evicted when the service worker activates. Content-addressed URLs are essential for service worker cache correctness.
  - `### Cache busting for third-party resources` — Third-party scripts and stylesheets loaded from external URLs cannot use content-addressed filenames. Options: pin to a specific version URL (e.g., `/v3.2.1/lib.js`) and use SRI; use a self-hosted copy; accept that users may cache an old version.

  **`## Best Practices`:**

  **MUST use content-addressed filenames for all JS, CSS, font, and image assets in production builds.** Vite, webpack, and other bundlers produce content-addressed output by default when configured with `[hash]` in output filename patterns. Verify that production build output filenames contain a content hash before relying on long-lived CDN caching.

  **MUST configure the HTML entry point with `Cache-Control: no-cache` at the CDN or origin server.** Every modern CDN and web server supports per-path cache control configuration. Set `Cache-Control: no-cache` for `*.html` files (or the root path `/`) and `Cache-Control: max-age=31536000, immutable` for all versioned assets. Without this distinction, the HTML entry point may be served from CDN cache long after new bundles are deployed.

  **SHOULD use an ETag-based conditional cache for HTML to avoid re-downloading unchanged content.** `no-cache` causes the browser to revalidate the HTML on every navigation; an ETag allows the server to respond with `304 Not Modified` when the HTML has not changed, avoiding the full HTML download. The combination of `no-cache` (force revalidation) + `ETag` (avoid re-download when unchanged) is the correct pattern for HTML entry points.

  **`## Visual`:** Mermaid diagram showing the asset serving strategy: HTML (`/index.html`) → `no-cache` → always revalidated → points to content-addressed bundles (`app.abc123.js`) → `immutable` → cached forever until URL changes.

  **`## Example`:** Nginx configuration for HTML vs. asset cache headers:
  ```nginx
  # HTML entry points: always revalidate
  location ~* \.html$ {
    add_header Cache-Control "no-cache";
    add_header ETag $request_filename; # simplified; use actual file hash
  }
  # Versioned assets: cache forever
  location ~* \.(js|css|woff2|png|webp)$ {
    add_header Cache-Control "max-age=31536000, immutable";
  }
  ```

  **`## Common Mistakes`:**
  - Serving all assets with a short `max-age` (e.g., 1 hour) without content-addressed filenames — causes unnecessary re-downloads
  - Serving HTML with long `max-age` — users continue to receive old HTML that references stale bundle hashes
  - Using version numbers instead of content hashes — cache busting fires on every deploy even when the bundle content did not change

  **`## Related FEEs`:**
  - FEE-1500 — CI/CD & Deployment Overview
  - FEE-1504 — Production Deployment: Static Hosting & CDN
  - FEE-807 — Build Optimization: Minification, Caching & Output Analysis
  - FEE-1303 — Caching Strategies (Service Worker)

  **`## References`:**
  - web.dev: HTTP caching — https://web.dev/articles/http-cache
  - MDN: Cache-Control — https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
  - Vite: Build output filenames — https://vitejs.dev/config/build-options#build-rollupoptions

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1508
  title: 大規模快取失效
  state: draft
  category: CI CD and Deployment
  ---
  ```
  **H1:** `# 大規模快取失效`

  Related FEE titles:
  - FEE-1500 — CI/CD 與部署總覽
  - FEE-1504 — 正式環境部署：靜態託管與 CDN
  - FEE-807 — 構建最佳化：壓縮、快取與產出分析
  - FEE-1303 — 快取策略

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/CI CD and Deployment/1508.md" "docs/zh-tw/CI CD and Deployment/1508.md"
  git commit -m "feat(fee-1508): cache invalidation at scale — EN + zh-TW"
  ```

---

### Task 2: FEE-1509 Rollback Strategies for Frontend Deployments

**Files:**
- Create: `docs/en/CI CD and Deployment/1509.md`
- Create: `docs/zh-tw/CI CD and Deployment/1509.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1509
  title: Rollback Strategies for Frontend Deployments
  state: draft
  category: CI CD and Deployment
  ---
  ```

  **H1:** `# Rollback Strategies for Frontend Deployments`

  **Opening (2–4 paragraphs covering):**
  - Frontend deployments fail. A production deploy that breaks a critical user flow needs to be reversed quickly, with minimal user impact. The mean time to recovery (MTTR) depends on the rollback strategy in place before the incident: a team that can roll back in two minutes recovers faster than one whose rollback requires a revert PR, a new build, and a manual deploy sequence that takes 20 minutes.
  - Frontend rollback differs from backend rollback because the frontend is typically served as static files from a CDN. Rolling back means serving a previous set of files — not running a previous container or database migration. CDN-based rollback can be instantaneous: swap a pointer from the current deployment to a previous one, and the change propagates globally within seconds.
  - There are three primary rollback mechanisms: instant CDN pointer swap (swap the serving root from new deploy to previous deploy), feature flag rollback (disable the feature that caused the issue without redeploying), and traditional revert-and-redeploy. The correct strategy depends on the deployment infrastructure and the nature of the failure.

  **`## Principle`:**

  Engineers SHOULD design frontend deployment pipelines to retain at least three previous deployments as immutable artifacts that can be re-activated as the live version within five minutes. The retention of previous deployments is what makes instant rollback possible; a deployment pipeline that overwrites the previous version on each deploy has no rollback path other than revert-and-redeploy.

  Engineers SHOULD use feature flags as the first rollback mechanism for features that are toggleable — A/B tested, gradual rollouts, or operator-controlled visibility. A feature flag rollback requires no deployment; it disables the feature for all users within seconds of updating the flag. Feature flag rollback is not appropriate for infrastructure changes, security fixes, or changes that affect all users regardless of feature visibility.

  **`## Design Thinking` subsections:**
  - `### CDN atomic deploys` — Platforms like Vercel, Netlify, and Cloudflare Pages deploy each build as an immutable artifact with a unique URL. Promoting a previous deployment to production is a CDN pointer swap. Self-hosted CDN equivalent: S3/CloudFront with deployment directories (`/deploys/abc123/`) and a CloudFront alias that points to the current directory.
  - `### Versioned deployment artifacts` — Each build produces a versioned artifact (a directory, a container image tag, or a CDN path). Retaining N previous artifacts allows rollback to any previous version. Automated cleanup should retain at least the last 5 deployments.
  - `### Automatic rollback triggers` — CI/CD integrations with error tracking: if error rate exceeds a threshold in the 10 minutes after deploy, trigger automatic rollback. Sentry, Datadog, and other error trackers have webhooks or integrations that can trigger CDN swaps.
  - `### Database migration and frontend rollback` — Frontend rollbacks that involve API contract changes (the old frontend speaks a different API than the current backend) can fail silently. Blue-green deploys, API versioning, and backward-compatible API changes are the mitigations.

  **`## Best Practices`:**

  **MUST retain the last N (minimum 3) deployment artifacts and verify that the rollback path is exercised in staging before a production incident.** A rollback procedure that has never been tested will fail at the worst moment. Include rollback as a step in the staging deployment checklist: deploy, verify, roll back to previous version, verify rollback works, re-deploy. This builds confidence in the rollback mechanism before it is needed in production.

  **SHOULD automate rollback triggering based on post-deploy error rate monitoring.** Manual rollback requires a human to notice the failure, assess severity, decide to roll back, and execute the rollback. Automated rollback triggers this process within two minutes of error rate threshold breach. Configure post-deploy monitoring with a 10-minute window and an error rate trigger at 2–5x the pre-deploy baseline.

  **SHOULD test rollback in a post-deploy canary phase before traffic is fully shifted to the new deployment.** Progressive traffic promotion — 5% to new deployment, monitor 5 minutes, 50% on success, 100% on success — limits blast radius. A canary failure triggers automatic rollback to 0% before the majority of users are affected.

  **`## Visual`:** Mermaid diagram showing deployment artifacts retained: deploy-v1 (retained) → deploy-v2 (retained) → deploy-v3 (current, live). Rollback: CDN pointer moves from deploy-v3 to deploy-v2. deploy-v3 retained for re-promotion if needed.

  **`## Example`:** GitHub Actions deploy with rollback-ready artifact retention on Cloudflare Pages:
  ```yaml
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci && npm run build
        - name: Deploy to Cloudflare Pages
          uses: cloudflare/pages-action@v1
          with:
            apiToken: ${{ secrets.CF_API_TOKEN }}
            accountId: ${{ secrets.CF_ACCOUNT_ID }}
            projectName: my-app
            directory: dist
        # Cloudflare Pages retains all deployments automatically.
        # Rollback: go to Pages dashboard → select previous deployment → "Rollback to this deployment"
  ```

  **`## Related FEEs`:**
  - FEE-1500 — CI/CD & Deployment Overview
  - FEE-1504 — Production Deployment: Static Hosting & CDN
  - FEE-1505 — Deployment Strategies: Canary, Blue-Green & Feature Flags
  - FEE-1508 — Cache Invalidation at Scale

  **`## References`:**
  - Vercel: Instant Rollback — https://vercel.com/docs/deployments/instant-rollback
  - Netlify: Rollbacks — https://docs.netlify.com/site-deploys/manage-deploys/#rollbacks
  - Cloudflare Pages: Rollbacks — https://developers.cloudflare.com/pages/configuration/rollbacks/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1509
  title: 前端部署的回滾策略
  state: draft
  category: CI CD and Deployment
  ---
  ```
  **H1:** `# 前端部署的回滾策略`

  Related FEE titles:
  - FEE-1500 — CI/CD 與部署總覽
  - FEE-1504 — 正式環境部署：靜態託管與 CDN
  - FEE-1505 — 部署策略：金絲雀、藍綠部署與功能旗標
  - FEE-1508 — 大規模快取失效

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/CI CD and Deployment/1509.md" "docs/zh-tw/CI CD and Deployment/1509.md"
  git commit -m "feat(fee-1509): rollback strategies for frontend deployments — EN + zh-TW"
  ```

---

### Task 3: FEE-1510 Multi-Region & Edge Deployments

**Files:**
- Create: `docs/en/CI CD and Deployment/1510.md`
- Create: `docs/zh-tw/CI CD and Deployment/1510.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1510
  title: Multi-Region & Edge Deployments
  state: draft
  category: CI CD and Deployment
  ---
  ```

  **H1:** `# Multi-Region & Edge Deployments`

  **Opening (2–4 paragraphs covering):**
  - A single-region deployment serves all users from one geographic location. Users close to the origin server experience low latency; users on the other side of the globe experience high latency — potentially hundreds of milliseconds — for every API request and every HTML response. CDNs solve this for static assets; multi-region and edge deployments solve it for dynamic HTML and API responses.
  - Edge computing platforms (Cloudflare Workers, Vercel Edge Functions, Netlify Edge Functions, AWS Lambda@Edge) run code at CDN edge locations — servers distributed globally, typically 50–300 within a hundred milliseconds of any user. An edge function that handles SSR, authentication, or API routing runs in the user's region rather than in a single data center. The resulting latency reduction is most significant for TTFB (Time to First Byte) and SSR-rendered pages.
  - Multi-region deployments extend this further by replicating backend services (databases, caches, APIs) across geographic regions. Writes must be routed to a primary region or handled by a distributed database with conflict resolution. Reads can be served from the nearest replica. The combination of edge compute for HTML generation and regional replicas for data access produces near-local latency for globally distributed users.

  **`## Principle`:**

  Engineers SHOULD deploy SSR pages and authentication middleware to edge runtimes rather than single-region serverless functions when serving users across multiple continents. A single-region SSR function adds the user's network latency to the origin and back to every SSR request; an edge function adds only the user's latency to the nearest edge node, which is typically under 20ms for 95% of users globally.

  Engineers MUST consider data residency and compliance requirements before routing data across regions. GDPR requires that EU user data not be processed or stored outside the EU without adequate legal protections. A multi-region deployment that routes EU users' requests to a US data center violates GDPR data transfer restrictions. Regional data partitioning — EU users are served by EU edge functions that access EU databases — is the compliant architecture.

  **`## Design Thinking` subsections:**
  - `### Edge runtime constraints` — Cloudflare Workers and Vercel Edge Runtime do not support Node.js APIs (`fs`, `child_process`, native addons). They use the `workerd` runtime (Workers) or a V8 isolate (Vercel Edge). Libraries must be edge-compatible; database clients must use HTTP-based APIs (Neon, PlanetScale, Turso, Upstash) rather than TCP-based connections.
  - `### Latency-based routing` — CDN providers route edge requests to the nearest PoP automatically. For multi-region backends, latency-based routing (AWS Route 53, Cloudflare Load Balancing) routes API requests to the nearest healthy region.
  - `### Cache coherence across regions` — A user's data updated in one region must be reflected in other regions within an acceptable time window. Strong consistency (synchronous replication) guarantees immediate consistency at the cost of higher write latency. Eventual consistency (asynchronous replication) allows stale reads for a configurable window.
  - `### Regional failover` — A region that becomes unhealthy must be automatically removed from routing and traffic redistributed to healthy regions. Health checks, failover time, and DNS TTL all affect recovery time.

  **`## Best Practices`:**

  **SHOULD use an HTTP-based database client (or edge-compatible driver) for edge functions, not a TCP-based connection pool.** Standard PostgreSQL and MySQL clients use TCP connections; edge runtimes do not support persistent TCP. Use connection poolers like PgBouncer with HTTP proxy, serverless database clients (Neon serverless driver, PlanetScale HTTP API, Turso LibSQL over HTTP), or edge-compatible ORMs.

  **MUST partition user data by regulatory region and ensure edge functions route users to their data's home region.** EU user data must be processed and stored within the EU. Routing EU users through a global edge network to a US-only backend violates GDPR Article 46. Regional configuration — a `CF-IPCountry` or `X-Vercel-IP-Country` header — allows edge middleware to route users to the appropriate regional backend.

  **SHOULD define regional failover behavior explicitly and test it in staging.** A region that fails without a defined failover path produces a complete outage for users in that region. Define failover routes (primary region → secondary region → global CDN fallback) and test each failover scenario: region health check failure, database connection timeout, cold start failure.

  **`## Visual`:** Mermaid diagram showing multi-region architecture: users in EU and US → edge PoPs near each → EU edge routes to EU backend/database, US edge routes to US backend/database. Show failover arrow from EU backend to US backend (cross-region failover).

  **`## Example`:** Cloudflare Worker with regional routing based on IP country:
  ```js
  export default {
    async fetch(request, env) {
      const country = request.headers.get('CF-IPCountry') ?? 'US';
      const isEU = ['DE','FR','IT','ES','NL','PL','SE','NO','DK','FI'].includes(country);
      const apiBase = isEU ? env.EU_API_URL : env.US_API_URL;
      const response = await fetch(`${apiBase}${new URL(request.url).pathname}`, {
        headers: request.headers,
        method: request.method,
        body: request.body,
      });
      return response;
    }
  };
  ```

  **`## Related FEEs`:**
  - FEE-1500 — CI/CD & Deployment Overview
  - FEE-1504 — Production Deployment: Static Hosting & CDN
  - FEE-701 — Rendering Strategies: CSR, SSR, SSG & Streaming
  - FEE-1508 — Cache Invalidation at Scale

  **`## References`:**
  - Cloudflare Workers: Getting Started — https://developers.cloudflare.com/workers/get-started/
  - Vercel Edge Functions — https://vercel.com/docs/functions/edge-functions
  - web.dev: Edge rendering — https://web.dev/articles/rendering-on-the-web

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1510
  title: 多區域與邊緣部署
  state: draft
  category: CI CD and Deployment
  ---
  ```
  **H1:** `# 多區域與邊緣部署`

  Related FEE titles:
  - FEE-1500 — CI/CD 與部署總覽
  - FEE-1504 — 正式環境部署：靜態託管與 CDN
  - FEE-701 — 渲染策略：CSR、SSR、SSG 與串流
  - FEE-1508 — 大規模快取失效

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/CI CD and Deployment/1510.md" "docs/zh-tw/CI CD and Deployment/1510.md"
  git commit -m "feat(fee-1510): multi-region & edge deployments — EN + zh-TW"
  ```

---

### Task 4: FEE-1608 Debugging Workflows & DevTools Profiling

**Files:**
- Create: `docs/en/Developer Experience and Tooling/1608.md`
- Create: `docs/zh-tw/Developer Experience and Tooling/1608.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1608
  title: Debugging Workflows & DevTools Profiling
  state: draft
  category: Developer Experience and Tooling
  ---
  ```

  **H1:** `# Debugging Workflows & DevTools Profiling`

  **Opening (2–4 paragraphs covering):**
  - Browser DevTools are among the most powerful and underused tools in a frontend developer's workflow. Most developers know the Elements panel for inspecting DOM and the Console for logging, but the Debugger, Performance, Memory, and Network panels contain capabilities that reduce debugging time from hours to minutes when used effectively. Understanding what each panel is for and when to reach for it is a skill that compounds over a career.
  - The debugging workflow for most frontend issues follows a pattern: identify the symptom (error message, visual bug, performance problem), select the appropriate tool (debugger for logic errors, performance panel for jank, memory panel for leaks, network panel for request failures), gather data, form a hypothesis, and verify. Skipping straight to changing code based on a first guess is the most common way to spend three hours fixing the wrong thing.
  - Performance profiling in DevTools deserves special attention because the performance problems that most affect users — jank, long tasks, memory leaks — are invisible to casual observation. The Performance panel's flame chart, the Memory panel's heap snapshot, and the Layers panel's compositing view reveal what the browser is actually doing, as opposed to what the developer assumes it is doing.

  **`## Principle`:**

  Engineers SHOULD establish a systematic debugging workflow rather than jumping immediately to code changes. The workflow: reproduce the issue reliably → isolate the minimum reproduction → identify the correct tool → gather data → form hypothesis → verify with a targeted change. Each step reduces the search space for the root cause. A reliable reproduction is the prerequisite for all subsequent steps; a bug that cannot be reliably reproduced cannot be confidently fixed.

  Engineers SHOULD use conditional breakpoints and logpoints in the Debugger panel rather than adding temporary `console.log` statements to source code. Conditional breakpoints (`break if expression is true`) pause execution only when the specific condition is met, reducing noise when debugging loops or event handlers that fire frequently. Logpoints print to the console without modifying the source code and without requiring a redeploy to add or remove them.

  **`## Design Thinking` subsections:**
  - `### Debugger panel: beyond basic breakpoints` — Conditional breakpoints, logpoints, `debugger` statement, call stack inspection, scope variables, watch expressions. Stepping: step over, step into, step out. Blackboxing library code to skip through framework internals. Source maps for debugging minified production code.
  - `### Performance panel: flame chart anatomy` — Main thread timeline, task waterfall, flame chart. Identifying long tasks (red corners), forced reflows (purple), scripting vs. rendering vs. painting time. The "Call Tree" and "Bottom-Up" views for identifying the hot functions.
  - `### Memory panel: finding leaks` — Heap snapshot: take before and after a suspected leak cycle, compare retained objects. Allocation instrumentation on timeline: records all allocations over time. Common leak patterns: event listeners not removed, closure capturing large objects, detached DOM nodes.
  - `### Network panel: request debugging` — Filter by XHR/Fetch, status code, initiator. Timing breakdown (DNS, connection, TTFB, download). Copy as cURL for reproducing requests outside the browser. Throttling to simulate slow networks.

  **`## Best Practices`:**

  **SHOULD use conditional breakpoints instead of `console.log` for debugging events or functions that fire many times.** A `console.log` inside a scroll handler fires hundreds of times during normal user interaction, flooding the console with noise. A conditional breakpoint that pauses only when `targetElement.id === 'submit-btn'` is pressed isolates the specific event without noise and without modifying source code.

  **SHOULD record a Performance profile before and after any optimization change to verify the change had the intended effect.** Performance intuition is unreliable; measurement is the arbiter. A change that "should be faster" may produce no measurable improvement or may improve one metric while degrading another. A 10-second Performance panel recording before and after the change provides evidence.

  **MUST use source maps in production error monitoring to get meaningful stack traces.** Minified production JavaScript produces stack traces that reference `bundle.min.js:1:12345` — useless for debugging. Source maps translate these references back to the original TypeScript or JSX line numbers. Upload source maps to the error tracker (Sentry, Datadog) and configure the build to generate them without serving them publicly.

  **`## Visual`:** Mermaid flowchart of the debugging decision tree: what kind of problem? → logic error (Debugger panel: breakpoints, step through) / visual bug (Elements panel: computed styles, box model) / performance (Performance panel: flame chart) / memory leak (Memory panel: heap snapshot) / network failure (Network panel: request details).

  **`## Example`:** Conditional breakpoint and logpoint syntax (shown as DevTools usage description):
  ```
  Conditional breakpoint:
  - Right-click gutter → Add conditional breakpoint
  - Condition: `event.target.classList.contains('submit-btn')`
  - Only pauses when the specific element triggers the handler

  Logpoint:
  - Right-click gutter → Add logpoint
  - Message: `"Item {id} rendered: {JSON.stringify(item)}"`
  - Prints to console without modifying source; removed without code change
  ```

  ```js
  // Source maps: Vite configuration
  // vite.config.ts
  export default defineConfig({
    build: {
      sourcemap: true, // generate source maps
      // do NOT serve sourcemap files publicly; upload to Sentry instead
    }
  });
  ```

  **`## Common Mistakes`:**
  - Adding `console.log` to production code and forgetting to remove it
  - Profiling in development mode — React DevTools, Redux DevTools, and unminified builds add overhead; profile in production mode for representative results
  - Not using source maps, making production errors undebuggable

  **`## Related FEEs`:**
  - FEE-1600 — Developer Experience & Tooling Overview
  - FEE-1609 — Local Development Environment Setup
  - FEE-704 — Core Web Vitals & Performance Metrics
  - FEE-1401 — Error Tracking with Sentry (source map upload)

  **`## References`:**
  - Chrome DevTools: Overview — https://developer.chrome.com/docs/devtools/
  - Chrome DevTools: Performance — https://developer.chrome.com/docs/devtools/performance/
  - Chrome DevTools: Memory — https://developer.chrome.com/docs/devtools/memory-problems/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1608
  title: 除錯工作流程與 DevTools 分析
  state: draft
  category: Developer Experience and Tooling
  ---
  ```
  **H1:** `# 除錯工作流程與 DevTools 分析`

  Related FEE titles:
  - FEE-1600 — 開發者體驗與工具總覽
  - FEE-1609 — 本地開發環境建置
  - FEE-704 — 核心 Web 指標與效能指標
  - FEE-1401 — 使用 Sentry 進行錯誤追蹤

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Developer Experience and Tooling/1608.md" "docs/zh-tw/Developer Experience and Tooling/1608.md"
  git commit -m "feat(fee-1608): debugging workflows & DevTools profiling — EN + zh-TW"
  ```

---

### Task 5: FEE-1609 Local Development Environment Setup

**Files:**
- Create: `docs/en/Developer Experience and Tooling/1609.md`
- Create: `docs/zh-tw/Developer Experience and Tooling/1609.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1609
  title: Local Development Environment Setup
  state: draft
  category: Developer Experience and Tooling
  ---
  ```

  **H1:** `# Local Development Environment Setup`

  **Opening (2–4 paragraphs covering):**
  - A well-configured local development environment reduces onboarding time for new team members from days to hours, eliminates "works on my machine" inconsistencies, and keeps developers focused on building rather than debugging environment issues. The goal is a setup that is reproducible, version-controlled, and self-documenting — a new developer can clone the repository, run one command, and have a working local environment.
  - Node.js version management, local service dependencies, and environment variables are the three sources of most local environment inconsistencies. A team where one developer uses Node 18 and another uses Node 20 will encounter subtle behavioral differences. A team that expects developers to manually install and configure PostgreSQL, Redis, and other services will have inconsistent versions and configurations across machines. A team that manages environment variables through informal documentation will have developers with stale or missing variables.
  - The solutions are well-established: `fnm` or `nvm` with a `.nvmrc` file for Node version pinning; Docker Compose for local service dependencies; `direnv` with `.envrc` for per-project environment variable management; documented in a `CONTRIBUTING.md` or a bootstrapping script that automates the setup.

  **`## Principle`:**

  Engineers MUST pin the Node.js version for every project using a `.nvmrc`, `.node-version`, or `engines.node` field in `package.json`, and MUST use a version manager (`fnm`, `nvm`, `volta`) to automatically switch to the pinned version when entering the project directory. A project without a pinned Node version relies on each developer's default Node installation, which diverges over time as developers upgrade their system Node or work across projects with different version requirements.

  Engineers SHOULD use Docker Compose to define all local service dependencies — databases, caches, message queues, and other backend services — in a `docker-compose.yml` at the project root. This makes the local service configuration version-controlled, consistent across all developer machines, and reproducible from scratch with `docker compose up`. Services should be accessible at predictable, documented ports.

  **`## Design Thinking` subsections:**
  - `### fnm vs. nvm vs. volta` — `fnm` is fast (written in Rust), supports `.nvmrc` and `.node-version` files, and has automatic version switching. `nvm` is the most widely used but slower. `volta` pins versions per-project in `package.json` with automatic switching. All three are valid choices; `fnm` is recommended for new setups.
  - `### direnv for per-project env vars` — `direnv` loads `.envrc` files automatically when entering a directory and unloads them when leaving. This enables per-project environment variables without polluting the global environment. `.envrc` should be committed with non-secret values; a `.envrc.example` with all variable names (but no values) documents the required variables.
  - `### Docker Compose for local services` — `docker-compose.yml` for PostgreSQL, Redis, Elasticsearch, etc. Named volumes for persistence across container restarts. Health checks to prevent the dev server from starting before services are ready. The `depends_on` option with `condition: service_healthy`.
  - `### Bootstrapping scripts` — A `bin/setup` or `scripts/bootstrap.sh` that installs dependencies, copies `.envrc.example` to `.envrc`, starts Docker services, and runs database migrations. Run once by new developers; idempotent so it can be re-run after updates.
  - `### Consistent developer tooling via package.json scripts` — `npm run dev`, `npm run test`, `npm run build` as the standard entry points. Developers should not need to know the underlying tool names to run common workflows.

  **`## Best Practices`:**

  **MUST commit a `.nvmrc` or `.node-version` file to the repository root with the project's required Node.js version.** This file is read by `fnm`, `nvm`, `volta`, and CI environments to use the correct Node version automatically. Without it, developers and CI may use different Node versions, producing build failures that are hard to reproduce and diagnose.

  **SHOULD provide a bootstrapping script (`bin/setup` or equivalent) that automates the full local environment setup from a clean checkout.** The script should be idempotent (safe to run multiple times), documented at the top of `CONTRIBUTING.md`, and tested periodically by having a team member run it on a fresh machine. An automated setup script reduces onboarding time and ensures that the documented setup process actually works.

  **SHOULD use Docker Compose for all local service dependencies rather than expecting developers to install and configure services manually.** A `docker-compose.yml` with correct version, port, and credential configuration is reproducible and consistent. It requires Docker Desktop but eliminates the need to install PostgreSQL, Redis, or other services directly on the developer's machine, and ensures all developers use the same version and configuration.

  **`## Visual`:** Mermaid diagram of the local development stack: developer machine → fnm (Node version) → package manager (pnpm) → dev server (Vite/Next.js) → local services (Docker Compose: PostgreSQL, Redis) → browser. Show the `.nvmrc` and `docker-compose.yml` as the configuration sources.

  **`## Example`:** Minimal project setup files:

  ```
  # .nvmrc
  20.11.0
  ```

  ```yaml
  # docker-compose.yml
  services:
    postgres:
      image: postgres:16-alpine
      environment:
        POSTGRES_USER: dev
        POSTGRES_PASSWORD: dev
        POSTGRES_DB: app_dev
      ports: ["5432:5432"]
      volumes: [postgres_data:/var/lib/postgresql/data]
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U dev"]
        interval: 5s
        retries: 5
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
  volumes:
    postgres_data:
  ```

  ```bash
  #!/usr/bin/env bash
  # bin/setup — run once after cloning
  set -euo pipefail
  echo "Installing Node $(cat .nvmrc) via fnm..."
  fnm use
  echo "Installing dependencies..."
  pnpm install
  echo "Starting local services..."
  docker compose up -d
  echo "Copying .envrc.example..."
  cp -n .envrc.example .envrc || true
  echo "Setup complete. Run 'pnpm dev' to start."
  ```

  **`## Common Mistakes`:**
  - No `.nvmrc` file — developers silently use different Node versions
  - Environment variables documented in a wiki instead of a committed `.envrc.example` — new developers miss variables
  - Requiring manual PostgreSQL installation instead of Docker Compose
  - A bootstrapping script that is not idempotent — errors on second run discourage use

  **`## Related FEEs`:**
  - FEE-1600 — Developer Experience & Tooling Overview
  - FEE-1605 — TypeScript Configuration
  - FEE-1603 — Git Hooks & Pre-commit Automation
  - FEE-806 — Environment Variables & Build Configuration

  **`## References`:**
  - fnm: Fast Node Manager — https://github.com/Schniz/fnm
  - direnv — https://direnv.net
  - Docker Compose: Getting Started — https://docs.docker.com/compose/gettingstarted/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1609
  title: 本地開發環境建置
  state: draft
  category: Developer Experience and Tooling
  ---
  ```
  **H1:** `# 本地開發環境建置`

  Related FEE titles:
  - FEE-1600 — 開發者體驗與工具總覽
  - FEE-1605 — TypeScript 設定
  - FEE-1603 — Git Hooks 與提交前自動化
  - FEE-806 — 環境變數與構建配置

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Developer Experience and Tooling/1609.md" "docs/zh-tw/Developer Experience and Tooling/1609.md"
  git commit -m "feat(fee-1609): local development environment setup — EN + zh-TW"
  ```

---

### Task 6: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [1507.Release Automation: Semantic Versioning & Changelogs](1507)`, add:
  ```
  - [1508.Cache Invalidation at Scale](1508)
  - [1509.Rollback Strategies for Frontend Deployments](1509)
  - [1510.Multi-Region & Edge Deployments](1510)
  ```

  After `- [1607.Scaffolding & Code Generation](1607)`, add:
  ```
  - [1608.Debugging Workflows & DevTools Profiling](1608)
  - [1609.Local Development Environment Setup](1609)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [1507.發布自動化：語義化版本控制與變更日誌](1507)`, add:
  ```
  - [1508.大規模快取失效](1508)
  - [1509.前端部署的回滾策略](1509)
  - [1510.多區域與邊緣部署](1510)
  ```

  After `- [1607.鷹架工具與程式碼生成](1607)`, add:
  ```
  - [1608.除錯工作流程與 DevTools 分析](1608)
  - [1609.本地開發環境建置](1609)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-1508–1510 and 1608–1609 to list files"
  ```
