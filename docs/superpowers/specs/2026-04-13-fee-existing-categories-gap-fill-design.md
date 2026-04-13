# FEE Existing Categories Gap-Fill Design

## Goal

Add 53 new articles across all 16 existing FEE categories to fill genuine coverage gaps. Each article ships in both English (`docs/en/`) and Traditional Chinese (`docs/zh-tw/`). Article counts vary by category (2–5) based on how many real gaps exist, not a uniform quota.

## Article Template

All articles follow the Batch 12+ FEE template:

1. **Opening** — 2–4 paragraphs, no headers. Sets stakes, establishes the concept, previews tradeoffs.
2. **## Principle** — normative rules in RFC-2119 language (MUST / SHOULD / MUST NOT). Bold-prefixed paragraphs, no bullets or code.
3. **## Design Thinking** — `###` subsections exploring the why, tradeoffs, mental models.
4. **## Best Practices** — bold-prefixed paragraphs (MUST/SHOULD/MUST NOT prefix matches body severity). No bullets, no code, no `###` headings inside.
5. **## Visual** — one Mermaid diagram.
6. **## Example** — one realistic code block demonstrating the central technique.
7. **## Common Mistakes** — optional; include when there are non-obvious pitfalls.
8. **## Related FEEs** — 3+ cross-references.
9. **## References** — 3+ URLs.

Target: 300+ lines per file.

zh-TW section headers: 原則 / 設計思維 / 最佳實踐 / 視覺呈現 / 範例 / 常見錯誤 / 相關 FEE / 參考資料

RFC-2119 severity: MUST prefix → MUST body; SHOULD prefix → SHOULD body; MUST NOT prefix → MUST NOT body.

## Implementation Strategy

Same research-then-write strategy as prior batches:
1. Research the topic (MDN, specs, community patterns)
2. Write EN article to full template
3. Write zh-TW translation/adaptation
4. Commit both files together

## New Articles by Category

### HTML (100s) — 2 articles

| ID  | EN Title                                      | zh-TW Title                  |
|-----|-----------------------------------------------|------------------------------|
| 107 | Structured Data & Schema.org                  | 結構化資料與 Schema.org       |
| 108 | HTML Security Attributes                      | HTML 安全屬性                 |

**107** covers `<script type="application/ld+json">`, JSON-LD vs. Microdata vs. RDFa, SEO and rich results, structured data validation.

**108** covers `crossorigin`, `referrerpolicy`, `sandbox` on iframes, `rel="noopener noreferrer"`, `integrity` (SRI preview — deeper treatment in 1208), and when each attribute is required vs. optional.

### CSS (200s) — 3 articles

| ID  | EN Title                                         | zh-TW Title                    |
|-----|--------------------------------------------------|--------------------------------|
| 208 | CSS Subgrid                                      | CSS Subgrid                    |
| 209 | CSS Containment & `contain`                      | CSS Containment 與 `contain`   |
| 210 | Backdrop Filter, Mix-Blend-Mode & Visual Effects | 背景濾鏡、混合模式與視覺特效   |

**208** covers `subgrid` on rows and columns, alignment inheritance across nested grids, when subgrid solves problems that explicit grid cannot.

**209** covers `contain: layout`, `contain: paint`, `contain: strict`, `content-visibility: auto`, CLS impact and performance budgets for off-screen content.

**210** covers `backdrop-filter`, `mix-blend-mode`, `isolation`, `filter`, GPU compositing implications, progressive enhancement for non-supporting browsers.

### JavaScript Core (300s) — 5 articles

| ID  | EN Title                                   | zh-TW Title                        |
|-----|--------------------------------------------|------------------------------------|
| 309 | WeakMap, WeakSet & Weak References         | WeakMap、WeakSet 與弱引用           |
| 310 | Symbols & Well-Known Symbols               | Symbol 與內建 Symbol                |
| 311 | Proxy & Reflect API                        | Proxy 與 Reflect API               |
| 312 | `this` Binding & Context Edge Cases        | `this` 綁定與情境邊界案例           |
| 313 | Structured Clone & `structuredClone()`     | 結構化複製與 `structuredClone()`    |

**309** covers garbage collection semantics, `WeakRef`, `FinalizationRegistry`, use cases (private data, caches, DOM-object associations).

**310** covers Symbol as unique keys, well-known symbols (`Symbol.iterator`, `Symbol.toPrimitive`, `Symbol.hasInstance`), metaprogramming hooks, Symbol in object property enumeration.

**311** covers get/set/has/deleteProperty/apply traps, `Reflect` as the default trap delegation target, observable objects, validation proxies, the performance cost of proxies.

**312** covers implicit vs. explicit binding, `call`/`apply`/`bind`, arrow functions and lexical `this`, class fields, `this` in event handlers and callbacks, common pitfalls.

**313** covers the Structured Clone algorithm, `structuredClone()` vs. JSON round-trip vs. `Object.assign`, what can and cannot be cloned, `MessageChannel` and `postMessage` context, use in Web Workers.

### Browser APIs (400s) — 5 articles

| ID  | EN Title                                           | zh-TW Title                              |
|-----|----------------------------------------------------|------------------------------------------|
| 412 | `requestAnimationFrame` & Animation Timing         | `requestAnimationFrame` 與動畫計時       |
| 413 | Geolocation, Device Orientation & Device APIs      | 地理位置、裝置方向與裝置 API             |
| 414 | Broadcast Channel & SharedWorker                   | Broadcast Channel 與 SharedWorker        |
| 415 | Permissions API                                    | Permissions API                          |
| 416 | Web Speech API                                     | Web Speech API                           |

**412** covers `rAF` scheduling, `cancelAnimationFrame`, `performance.now()`, `PerformanceObserver`, avoiding layout thrash in animation loops, `requestIdleCallback`.

**413** covers `navigator.geolocation`, `DeviceOrientationEvent`, `DeviceMotionEvent`, permissions, battery API status, privacy implications and user consent patterns.

**414** covers `BroadcastChannel` for same-origin tab communication, `SharedWorker` for shared state across tabs, use cases (session sync, coordinated caching), compared to `localStorage` events.

**415** covers `navigator.permissions.query()`, permission states (granted/denied/prompt), requesting and revoking permissions, designing permission-request UX that respects the user.

**416** covers `SpeechSynthesisUtterance`, `SpeechRecognition`, browser support and polyfill strategy, accessibility implications, progressive enhancement.

### Component Architecture (500s) — 4 articles

| ID  | EN Title                                        | zh-TW Title                          |
|-----|-------------------------------------------------|--------------------------------------|
| 510 | Compound Component Pattern                      | 複合元件模式                          |
| 511 | Provider Hierarchy & Context Composition        | Provider 層級與 Context 組合          |
| 512 | Component-Level Memoization                     | 元件層級的記憶化                      |
| 513 | Testing Component Contracts                     | 測試元件契約                          |

**510** covers the compound component pattern (Tabs/Tab/TabPanel style), implicit state sharing via context, the difference between compound components and render props, API ergonomics.

**511** covers provider stacking, context selector pattern (avoiding unnecessary re-renders), `use()` hook (React 19), when to split vs. merge contexts.

**512** covers `React.memo`, `useMemo`, `useCallback`, the cost of memoization itself, profiler-driven decisions, when memoization makes things worse.

**513** covers testing props/slots/events as the public API, avoiding implementation detail testing, interaction contracts, storybook play functions as contract tests.

### State Management (600s) — 3 articles

| ID  | EN Title                       | zh-TW Title          |
|-----|--------------------------------|----------------------|
| 608 | Optimistic Updates             | 樂觀更新              |
| 609 | Form State Management          | 表單狀態管理          |
| 610 | Undo/Redo Patterns             | 復原與重做模式        |

**608** covers optimistic UI patterns, rollback on failure, conflict resolution, integration with server state libraries (TanStack Query `mutate`), loading vs. optimistic states.

**609** covers form state as a distinct category (dirty/pristine/touched/valid), library trade-offs (React Hook Form vs. Formik vs. TanStack Form), controlled vs. uncontrolled inputs in form context, submission state.

**610** covers command pattern for undo/redo, immutable state snapshots, history stack size limits, collaborative editing considerations.

### Rendering & Performance (700s) — 4 articles

| ID  | EN Title                                           | zh-TW Title                              |
|-----|----------------------------------------------------|------------------------------------------|
| 709 | INP Deep Dive: Interaction to Next Paint           | INP 深度解析：從互動到下一幀繪製          |
| 710 | GPU-Accelerated Animations & `will-change`         | GPU 加速動畫與 `will-change`             |
| 711 | Resource Hints: `prefetch`, `preload`, `preconnect`| 資源提示：`prefetch`、`preload`、`preconnect` |
| 712 | Critical Rendering Path & Paint Timing             | 關鍵渲染路徑與繪製計時                    |

**709** covers INP as a Core Web Vital, interaction phases (input delay, processing time, presentation delay), `PerformanceLongAnimationFrameObserver`, optimization strategies (scheduler API, `isInputPending`).

**710** covers compositor thread vs. main thread, which CSS properties trigger compositing, `will-change` as a hint (not a guarantee), memory implications, debugging with DevTools layers panel.

**711** covers `<link rel="preload">`, `<link rel="prefetch">`, `<link rel="preconnect">`, `<link rel="dns-prefetch">`, `modulepreload`, when to use each, over-hinting pitfalls.

**712** covers HTML parsing → CSSOM → render tree → layout → paint → composite, render-blocking resources, `DOMContentLoaded` vs. `load`, `PerformancePaintTiming` (`first-paint`, `first-contentful-paint`).

### Build Tooling (800s) — 3 articles

| ID  | EN Title                                         | zh-TW Title                          |
|-----|--------------------------------------------------|--------------------------------------|
| 808 | Module Federation                                | Module Federation                    |
| 809 | Tree-Shaking Patterns & Side-Effect Marking      | Tree-Shaking 模式與副作用標記        |
| 810 | TypeScript Integration in the Build Pipeline     | TypeScript 在構建流程中的整合        |

**808** covers Webpack Module Federation, shared dependency negotiation, runtime chunk loading, micro-frontend integration, version skew risks.

**809** covers ES module static analysis, `sideEffects` in `package.json`, barrel file anti-patterns, `/*#__PURE__*/` annotation, measuring tree-shaking effectiveness.

**810** covers `tsc --noEmit` for type checking vs. esbuild/SWC for transpilation, declaration emit, project references in monorepos, type-check parallelism in CI.

### Design Systems (900s) — 2 articles

| ID  | EN Title                        | zh-TW Title            |
|-----|---------------------------------|------------------------|
| 908 | Variant & Token Composition     | 變體與設計代幣組合      |
| 909 | Multi-Brand Design Systems      | 多品牌設計系統          |

**908** covers compound variant patterns (CVA, `cva()`, `tailwind-variants`), semantic token layering (primitive → semantic → component tokens), resolving variant conflicts.

**909** covers brand token overrides, theme namespacing, shared component logic with brand-specific visuals, build-time vs. runtime theming trade-offs.

### Accessibility (1000s) — 3 articles

| ID   | EN Title                                         | zh-TW Title                          |
|------|--------------------------------------------------|--------------------------------------|
| 1008 | Cognitive Accessibility                          | 認知無障礙                            |
| 1009 | Motion & Animation Accessibility                 | 動態與動畫無障礙                      |
| 1010 | Accessibility & Internationalization Intersection| 無障礙與國際化的交集                  |

**1008** covers WCAG 2.2 cognitive criteria, plain language, error recovery, consistent navigation, cognitive load reduction patterns.

**1009** covers `prefers-reduced-motion`, vestibular disorders, WCAG 2.3 (three flashes), parallax patterns, safe animation fallbacks.

**1010** covers directionality (`dir="rtl"`), language attributes and screen reader pronunciation, locale-sensitive ARIA labels, numeric and date formats in accessible context.

### Testing (1100s) — 4 articles

| ID   | EN Title                                    | zh-TW Title                    |
|------|---------------------------------------------|--------------------------------|
| 1108 | Snapshot Testing                            | 快照測試                        |
| 1109 | API Mocking with MSW & Integration Testing  | 使用 MSW 進行 API 模擬與整合測試 |
| 1110 | Performance Testing in CI                   | CI 中的效能測試                 |
| 1111 | Diagnosing & Fixing Flaky Tests             | 診斷與修復不穩定測試             |

**1108** covers inline vs. external snapshots, when snapshots add value vs. create noise, updating snapshots safely, snapshot drift.

**1109** covers MSW request handlers, integration tests that use real browser fetch, seeding server state, MSW in Storybook.

**1110** covers Lighthouse CI, `web-vitals` assertion in Playwright, performance budgets as CI gates, regression detection.

**1111** covers categories of flakiness (async timing, environment state, test order dependence), retry strategies, quarantine patterns, root-cause investigation.

### Security (1200s) — 3 articles

| ID   | EN Title                                           | zh-TW Title                          |
|------|----------------------------------------------------|--------------------------------------|
| 1208 | Subresource Integrity (SRI)                        | 子資源完整性（SRI）                   |
| 1209 | Open Redirect Prevention & URL Validation          | 開放重新導向防護與 URL 驗證           |
| 1210 | Client-Side Key Derivation & Web Crypto API        | 用戶端金鑰衍生與 Web Crypto API       |

**1208** covers `integrity` attribute, hash generation, SRI with CDN-hosted libraries, `require-sri-for` CSP directive, automated SRI in build pipeline.

**1209** covers open redirect attack vectors, `URL` constructor for safe parsing, allowlist vs. blocklist validation, `rel="noopener"` redirect chains, SSRF in SSR.

**1210** covers `crypto.subtle`, key derivation functions (PBKDF2, HKDF), symmetric encryption (`AES-GCM`), when client-side crypto is appropriate vs. dangerous, key storage in browser.

### PWA (1300s) — 2 articles

| ID   | EN Title                          | zh-TW Title              |
|------|-----------------------------------|--------------------------|
| 1308 | App Shell Architecture            | App Shell 架構            |
| 1309 | Update Detection & Refresh Prompts| 更新偵測與重新整理提示    |

**1308** covers the app shell model, separating UI chrome from dynamic content, pre-caching the shell, route-level streaming with shells.

**1309** covers detecting new service worker versions, `skipWaiting` + `clients.claim` trade-offs, user-facing update prompts, avoiding stuck caches.

### Observability (1400s) — 3 articles

| ID   | EN Title                                           | zh-TW Title                          |
|------|----------------------------------------------------|--------------------------------------|
| 1408 | OpenTelemetry Trace Correlation in the Browser     | 瀏覽器中的 OpenTelemetry Trace 關聯   |
| 1409 | Privacy-Respecting Observability                   | 尊重隱私的可觀測性                    |
| 1410 | Observability for Internal Tools & Admin UIs       | 內部工具與管理介面的可觀測性          |

**1408** covers `traceparent` header propagation, browser-side span creation, correlating frontend traces with backend traces, `@opentelemetry/sdk-trace-web`.

**1409** covers GDPR/CCPA implications for RUM, data minimization patterns, sampling strategies, consent-gated telemetry, PII scrubbing in logs.

**1410** covers why internal tools need observability (debugging support escalations, detecting slow admin queries), lightweight RUM for low-traffic UIs, error context for non-public apps.

### CI/CD (1500s) — 3 articles

| ID   | EN Title                                      | zh-TW Title                      |
|------|-----------------------------------------------|----------------------------------|
| 1508 | Cache Invalidation at Scale                   | 大規模快取失效                    |
| 1509 | Rollback Strategies for Frontend Deployments  | 前端部署的回滾策略                |
| 1510 | Multi-Region & Edge Deployments               | 多區域與邊緣部署                  |

**1508** covers cache-busted asset filenames, CDN purge APIs, `Cache-Control: immutable`, HTML file cache strategy, stale-while-revalidate in CI context.

**1509** covers instant rollback via CDN pointer swap, feature-flag rollback vs. deploy rollback, automated rollback triggers (error rate spike), rollback testing in staging.

**1510** covers edge function deployment (Cloudflare Workers, Vercel Edge), latency-based routing, geo-partitioned data compliance, cache coherence across regions.

### DX Tooling (1600s) — 2 articles

| ID   | EN Title                                    | zh-TW Title                    |
|------|---------------------------------------------|--------------------------------|
| 1608 | Debugging Workflows & DevTools Profiling    | 除錯工作流程與 DevTools 分析    |
| 1609 | Local Development Environment Setup        | 本地開發環境建置                |

**1608** covers breakpoints, conditional breakpoints, logpoints, Performance panel flame charts, Memory panel heap snapshots, network throttling for mobile simulation.

**1609** covers `nvm`/`fnm` for Node version management, `direnv` for per-project env vars, Docker-based local services, making onboarding reproducible.

## Article Numbering

Articles continue the existing numbering sequence within each category. Numbers assigned above (107–108, 208–210, 309–313, 412–416, 510–513, 608–610, 709–712, 808–810, 908–909, 1008–1010, 1108–1111, 1208–1210, 1308–1309, 1408–1410, 1508–1510, 1608–1609) are final.

## File Paths

Each article produces two files:
- `docs/en/<Category>/<ID>.md`
- `docs/zh-tw/<Category>/<ID>.md`

Category folder names match existing conventions:

| Category | Folder name |
|----------|-------------|
| HTML     | `HTML and Semantic Markup` |
| CSS      | `CSS and Layout Systems` |
| JavaScript Core | `JavaScript Core and Runtime` |
| Browser APIs | `Browser APIs and Web Platform` |
| Component Architecture | `Component Architecture and Design Patterns` |
| State Management | `State Management` |
| Rendering | `Rendering and Performance` |
| Build Tooling | `Build Tooling and Module Systems` |
| Design Systems | `Design Systems and UI Libraries` |
| Accessibility | `Accessibility` |
| Testing | `Testing Strategies` |
| Security | `Security` |
| PWA | `Progressive Web Apps and Offline` |
| Observability | `Observability and Error Tracking` |
| CI/CD | `CI CD and Deployment` |
| DX Tooling | `Developer Experience and Tooling` |

After all articles in a batch are written, update both `docs/en/list.md` and `docs/zh-tw/list.md` to include the new entries.

## Implementation Plan Batching

Split into 8 implementation plans roughly grouped by category proximity:

| Plan | Categories | Articles |
|------|-----------|---------|
| Batch A | HTML (2) + CSS (3) | 5 |
| Batch B | JavaScript Core (5) | 5 |
| Batch C | Browser APIs (5) | 5 |
| Batch D | Component Architecture (4) + State Management (3) | 7 |
| Batch E | Rendering (4) + Build Tooling (3) | 7 |
| Batch F | Design Systems (2) + Accessibility (3) + Testing (4) | 9 |
| Batch G | Security (3) + PWA (2) + Observability (3) | 8 |
| Batch H | CI/CD (3) + DX Tooling (2) | 5 |

Total: 53 articles across 16 categories.
