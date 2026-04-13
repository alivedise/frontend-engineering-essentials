# FEE Gap-Fill Batch G — Security, PWA & Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 8 gap-fill articles — 3 for Security (FEE-1208–1210), 2 for PWA (FEE-1308–1309), and 3 for Observability (FEE-1408–1410) — in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/Security/1208.md` — Subresource Integrity (SRI)
- `docs/en/Security/1209.md` — Open Redirect Prevention & URL Validation
- `docs/en/Security/1210.md` — Client-Side Key Derivation & Web Crypto API
- `docs/en/Progressive Web Apps and Offline/1308.md` — App Shell Architecture
- `docs/en/Progressive Web Apps and Offline/1309.md` — Update Detection & Refresh Prompts
- `docs/en/Observability and Error Tracking/1408.md` — OpenTelemetry Trace Correlation in the Browser
- `docs/en/Observability and Error Tracking/1409.md` — Privacy-Respecting Observability
- `docs/en/Observability and Error Tracking/1410.md` — Observability for Internal Tools & Admin UIs

**Files to create (zh-TW):** Mirror under `docs/zh-tw/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Batch 12+ template: Opening → `## Principle` → `## Design Thinking` → `## Best Practices` → `## Visual` → `## Example` → `## Common Mistakes` (optional) → `## Related FEEs` → `## References`. Target: 300+ lines per file.

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

---

### Task 1: FEE-1208 Subresource Integrity (SRI)

**Files:**
- Create: `docs/en/Security/1208.md`
- Create: `docs/zh-tw/Security/1208.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1208
  title: Subresource Integrity (SRI)
  state: draft
  category: Security
  ---
  ```

  **H1:** `# Subresource Integrity (SRI)`

  **Opening (2–4 paragraphs covering):**
  - When a web page loads a JavaScript library or stylesheet from a CDN, it trusts that the CDN serves the exact file that was deployed. This trust is misplaced: CDN infrastructure can be compromised, accounts can be hijacked, and supply chain attacks have demonstrated that popular CDN-hosted libraries can be silently replaced with malicious versions that exfiltrate user data or inject cryptocurrency miners.
  - Subresource Integrity (SRI) allows a page to cryptographically verify that a resource matches an expected hash before executing it. The `integrity` attribute on `<script>` and `<link>` elements specifies a Base64-encoded hash (`sha256-`, `sha384-`, or `sha512-`). The browser downloads the resource, computes its hash, and executes it only if the hash matches. A mismatch blocks the resource and logs a violation — the CDN's content has changed.
  - SRI is a defense-in-depth measure, not a substitute for a Content Security Policy. CSP restricts which origins can serve resources; SRI verifies the content of individual resources from allowed origins. Used together, they address complementary threat models: CSP blocks resources from unexpected origins; SRI blocks unexpected content from expected origins.

  **`## Principle`:**

  Engineers MUST add `integrity` and `crossorigin` attributes to all `<script>` and `<link rel="stylesheet">` elements that load resources from third-party CDNs. Without `integrity`, the browser trusts whatever the CDN serves. Without `crossorigin="anonymous"`, the browser cannot perform SRI validation on cross-origin resources (the response must be CORS-enabled for the browser to inspect its content). Both attributes are required; either alone is insufficient.

  Engineers SHOULD automate SRI hash generation in the build pipeline rather than computing hashes manually. A hash computed at build time from the exact resource bytes is authoritative; a hash computed from a downloaded file may differ if the CDN serves a slightly different response (different line endings, different compression). Build tools that inline external resources or that download and bundle CDN resources can output `integrity` values automatically.

  **`## Design Thinking` subsections:**
  - `### Hash algorithm selection` — `sha384` is the recommended algorithm; `sha256` is acceptable; `sha512` provides stronger guarantees at higher hash size. Multiple hashes can be provided space-separated; the browser uses any match.
  - `### SRI and CDN caching` — SRI only verifies the content at load time; it does not prevent the CDN from serving a different version on a subsequent request. Once the resource has changed, the hash mismatch blocks loading. This is the correct behavior: it surfaces the change immediately.
  - `### CSP require-sri-for directive` — `require-sri-for script` (still experimental in some browsers) makes SRI mandatory for all script elements; loading a script without an `integrity` attribute is blocked. This enforces SRI as a policy rather than a per-element discipline.
  - `### SRI for first-party resources` — SRI is typically used for third-party CDN resources. For first-party resources served from your own CDN, SRI provides protection against CDN compromise but requires updating the hash whenever the resource changes. Build pipelines that auto-generate hashes in HTML templates make this practical.

  **`## Best Practices`:**

  **MUST add `integrity` and `crossorigin="anonymous"` to every `<script>` or `<link rel="stylesheet">` that loads from a third-party CDN.** The `integrity` hash verifies the content; `crossorigin="anonymous"` enables CORS mode, which is required for the browser to read the response body and validate the hash. Without `crossorigin`, the SRI check is silently skipped on cross-origin resources.

  **SHOULD generate SRI hashes programmatically from the actual resource bytes using a build tool or CDN tooling.** Manually computing a hash from a CDN URL leaves the hash vulnerable to version drift — if the CDN URL serves different content at different times (before/after a deploy), the manually computed hash may not match the actual file. Using `openssl dgst -sha384 -binary < resource.js | base64` on the exact file bytes produces an authoritative hash.

  **SHOULD include SRI hash generation as part of the process of adding any new third-party CDN script.** The process: download the resource → compute the hash → add the hash to the HTML template with `integrity` and `crossorigin`. This is a one-time cost per CDN resource that provides permanent protection.

  **`## Visual`:** Mermaid sequence diagram: browser loads page → finds `<script integrity="sha384-...">` → downloads script from CDN → computes hash → hash matches: execute script / hash mismatch: block script and report violation.

  **`## Example`:** SRI on a CDN-hosted script:
  ```html
  <script
    src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"
    integrity="sha384-cB9+oNBzBCHqGBU1jxGDW6JJqGVaAVKKKKKGGGGG=="
    crossorigin="anonymous"
    defer
  ></script>
  ```
  Generate hash: `curl -s https://cdn.example.com/lib.js | openssl dgst -sha384 -binary | base64`

  **`## Common Mistakes`:**
  - Adding `integrity` without `crossorigin` — SRI check silently skipped
  - Computing the hash from a gzipped response instead of the raw file — hash will always mismatch
  - Not updating the hash after the CDN resource is intentionally upgraded

  **`## Related FEEs`:**
  - FEE-1200 — Security Overview
  - FEE-1201 — Content Security Policy
  - FEE-108 — HTML Security Attributes
  - FEE-1205 — Supply Chain Security

  **`## References`:**
  - MDN: Subresource Integrity — https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
  - SRI Hash Generator — https://www.srihash.org
  - W3C SRI specification — https://www.w3.org/TR/SRI/
  - OWASP: Third Party JavaScript Management — https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1208
  title: 子資源完整性（SRI）
  state: draft
  category: Security
  ---
  ```
  **H1:** `# 子資源完整性（SRI）`

  Related FEE titles:
  - FEE-1200 — 資訊安全總覽
  - FEE-1201 — 內容安全政策（CSP）
  - FEE-108 — HTML 安全屬性
  - FEE-1205 — 軟體供應鏈安全

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/Security/1208.md docs/zh-tw/Security/1208.md
  git commit -m "feat(fee-1208): subresource integrity (SRI) — EN + zh-TW"
  ```

---

### Task 2: FEE-1209 Open Redirect Prevention & URL Validation

**Files:**
- Create: `docs/en/Security/1209.md`
- Create: `docs/zh-tw/Security/1209.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1209
  title: Open Redirect Prevention & URL Validation
  state: draft
  category: Security
  ---
  ```

  **H1:** `# Open Redirect Prevention & URL Validation`

  **Opening (2–4 paragraphs covering):**
  - An open redirect vulnerability allows an attacker to craft a URL on a trusted domain that redirects users to an arbitrary external URL. The attack vector: `https://trusted.example.com/login?redirect=https://phishing.example.com`. The user sees `trusted.example.com` in the address bar and trusts the link; after authentication, they are silently redirected to the attacker's site. Open redirects are used in phishing campaigns, credential harvesting, and as components of OAuth token hijacking attacks.
  - URL validation is the mitigation: before redirecting a user to a URL from any untrusted source (query parameters, path segments, form fields, localStorage), validate that the URL meets the requirements — same-origin, allowlisted path, or allowlisted domain. The `URL` constructor provides a safe, spec-compliant way to parse URLs without string manipulation that can be bypassed by encoding tricks.
  - Server-side rendering applications face an additional concern: Server-Side Request Forgery (SSRF). When an SSR route takes a URL from user input and makes a server-side fetch to that URL, an attacker can supply an internal network URL (`http://169.254.169.254/` for AWS metadata) and access internal infrastructure. URL validation at the SSR boundary must apply the same origin allowlisting as the client-side redirect.

  **`## Principle`:**

  Engineers MUST validate all redirect URLs from user-controlled sources before redirecting. Validation MUST use the `URL` constructor to parse the URL safely, check the origin against an allowlist, and reject any URL that does not pass validation — not a regex against the URL string, which is susceptible to encoding bypasses (`%2F`, Unicode lookalike characters, null bytes). The safest validation is a same-origin check: `new URL(redirectUrl, window.location.origin).origin === window.location.origin`.

  Engineers MUST NOT construct redirect URLs from user input using string concatenation or template literals. A redirect URL of `'/dashboard' + userInput` is safe only if `userInput` cannot contain `//` or a scheme; `https://example.com` + `userInput` is never safe. Use the `URL` constructor and extract the `pathname` to ensure the redirect stays within the current origin.

  **`## Design Thinking` subsections:**
  - `### Same-origin vs. allowlist validation` — Same-origin is the strictest and simplest: only redirect to the current origin. Allowlist is appropriate for multi-domain applications where redirecting to `app.example.com` or `docs.example.com` is legitimate. Blocklist is never appropriate: attackers find bypasses for any blocklist.
  - `### URL constructor for safe parsing` — `new URL(untrusted, base)` safely parses relative and absolute URLs. The `origin`, `pathname`, `hostname` properties provide normalized, decoded values that cannot be bypassed by encoding tricks. Why regex matching on URL strings is unsafe.
  - `### OAuth redirect URI validation` — The `redirect_uri` parameter in OAuth flows is a common open redirect target. Authorization servers must validate the `redirect_uri` against a pre-registered list. Frontend applications must not accept a `redirect_uri` from the URL bar and pass it directly to the OAuth flow.
  - `### SSRF in SSR contexts` — SSR routes that fetch URLs from user input. Allowlisting allowed hostnames server-side. The AWS instance metadata endpoint as the canonical SSRF target to block.

  **`## Best Practices`:**

  **MUST use the `URL` constructor to parse and validate redirect URLs, not string matching or regex.** `new URL(input, location.href)` produces a normalized URL object. Checking `url.origin === location.origin` validates same-origin. Checking `allowedOrigins.includes(url.origin)` validates an allowlist. String-based checks can be bypassed by URL encoding (`%2F`), protocol-relative URLs (`//evil.com`), and Unicode lookalikes.

  **MUST NOT pass user-supplied redirect URLs to `window.location.href`, `router.push()`, or `res.redirect()` without validation.** Any value from `new URLSearchParams(window.location.search).get('redirect')` is attacker-controlled and must be treated as untrusted input. The validation must happen before the redirect, not after.

  **SHOULD apply the same URL validation to server-side redirect logic in SSR frameworks.** Next.js `redirect()`, Express `res.redirect()`, and other SSR redirect mechanisms that accept URL values from query parameters must validate those URLs against the same origin allowlist as client-side redirects. An open redirect on the server is exploitable even when client-side redirects are locked down.

  **`## Visual`:** Mermaid flowchart: untrusted redirect URL received → parse with `new URL()` → extract origin → compare against allowlist → allowed: perform redirect / not allowed: redirect to safe default (home page).

  **`## Example`:** Safe redirect URL validation:
  ```js
  const ALLOWED_ORIGINS = new Set(['https://app.example.com', 'https://docs.example.com']);
  function getSafeRedirectUrl(untrusted, fallback = '/') {
    try {
      const url = new URL(untrusted, window.location.origin);
      // Same-origin is always safe:
      if (url.origin === window.location.origin) return url.pathname + url.search;
      // Or allowlisted external origins:
      if (ALLOWED_ORIGINS.has(url.origin)) return url.href;
    } catch { /* invalid URL */ }
    return fallback;
  }
  const redirectTarget = getSafeRedirectUrl(searchParams.get('redirect'));
  router.push(redirectTarget);
  ```

  **`## Related FEEs`:**
  - FEE-1200 — Security Overview
  - FEE-1203 — XSS Prevention
  - FEE-1201 — Content Security Policy
  - FEE-606 — URL State & Routing

  **`## References`:**
  - OWASP: Unvalidated Redirects and Forwards — https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
  - MDN: URL constructor — https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
  - PortSwigger: Open redirection — https://portswigger.net/web-security/open-redirect

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1209
  title: 開放重新導向防護與 URL 驗證
  state: draft
  category: Security
  ---
  ```
  **H1:** `# 開放重新導向防護與 URL 驗證`

  Related FEE titles:
  - FEE-1200 — 資訊安全總覽
  - FEE-1203 — 跨網站指令碼（XSS）防護
  - FEE-1201 — 內容安全政策（CSP）
  - FEE-606 — URL 狀態與路由

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/Security/1209.md docs/zh-tw/Security/1209.md
  git commit -m "feat(fee-1209): open redirect prevention & URL validation — EN + zh-TW"
  ```

---

### Task 3: FEE-1210 Client-Side Key Derivation & Web Crypto API

**Files:**
- Create: `docs/en/Security/1210.md`
- Create: `docs/zh-tw/Security/1210.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1210
  title: Client-Side Key Derivation & Web Crypto API
  state: draft
  category: Security
  ---
  ```

  **H1:** `# Client-Side Key Derivation & Web Crypto API`

  **Opening (2–4 paragraphs covering):**
  - The Web Crypto API (`window.crypto.subtle`) provides native browser cryptographic primitives: key generation, key derivation, encryption, decryption, signing, and verification. These operations run in a native implementation, not JavaScript — they are faster and not vulnerable to timing side channels that affect JavaScript implementations.
  - Client-side cryptography is appropriate for a specific set of use cases: end-to-end encrypted messaging (where the server must not see plaintext), encrypted local storage (where the user's data is protected even if the server is compromised), and cryptographic proofs (where the client needs to sign data). It is not appropriate as a replacement for server-side security: encrypting data before sending it to a server that holds the key provides no security benefit; the server can decrypt anything the client sent.
  - Key derivation is the process of producing a cryptographic key from a user-supplied password or passphrase. PBKDF2 (Password-Based Key Derivation Function 2) and HKDF (HMAC-based Key Derivation Function) are the standardized algorithms. PBKDF2 with a high iteration count is designed to be slow, making brute-force attacks expensive. HKDF derives multiple keys from a single input key material.

  **`## Principle`:**

  Engineers MUST use `crypto.subtle.deriveKey` with PBKDF2 (minimum 600,000 iterations as of OWASP 2023 guidance) when deriving an encryption key from a user password in the browser. Using fewer iterations makes the derived key more vulnerable to offline brute-force attacks. The iteration count should be configurable and increased over time as hardware improves.

  Engineers MUST NOT use client-side cryptography to protect data that is also held in plaintext on the server. Encrypting data client-side and then sending it to a server that stores both the ciphertext and the encryption key provides no security benefit — an attacker who compromises the server can decrypt the ciphertext. Client-side encryption provides meaningful security only when the server never has access to the key.

  **`## Design Thinking` subsections:**
  - `### Web Crypto API structure` — `crypto.subtle` operations return Promises. `CryptoKey` objects are non-exportable by default — they cannot be serialized to JavaScript values. `generateKey`, `importKey`, `exportKey`, `deriveKey`, `deriveBits`, `encrypt`, `decrypt`, `sign`, `verify`, `digest`.
  - `### PBKDF2 for password-based keys` — Algorithm parameters: `hash: 'SHA-256'`, `iterations: 600000`, `salt` (random, stored alongside ciphertext). The salt prevents rainbow table attacks; the iteration count makes brute force expensive.
  - `### AES-GCM for encryption` — AES-GCM (Galois/Counter Mode) provides authenticated encryption — it verifies data integrity in addition to confidentiality. Algorithm parameters: `iv` (12 bytes, random per encryption, stored alongside ciphertext), `tagLength: 128`.
  - `### Key storage in the browser` — `CryptoKey` objects can be stored in IndexedDB (non-exportable keys remain non-exportable in IDB). Storing raw key bytes in localStorage exposes them to XSS. IDB with non-exportable keys provides the best security for persistent key storage.
  - `### When client-side crypto is inappropriate` — Server-side authentication (the server must verify credentials), data integrity checks where the server is the authority, and any scenario where the server needs to read the data.

  **`## Best Practices`:**

  **MUST use a cryptographically random salt and IV for every PBKDF2 key derivation and AES-GCM encryption operation.** The salt prevents rainbow table attacks on derived keys; a different salt per user means that the same password produces a different key for each user. The IV (initialization vector) for AES-GCM must be unique per encryption; reusing an IV with the same key compromises the encryption. Both salt and IV should be generated with `crypto.getRandomValues()` and stored alongside the ciphertext.

  **SHOULD use `crypto.subtle` rather than a JavaScript cryptography library (CryptoJS, forge) for performance-sensitive or security-critical operations.** `crypto.subtle` is a native implementation that is not vulnerable to timing side channels that affect JavaScript arithmetic. It is also faster than JavaScript implementations for large data. CryptoJS and similar libraries are acceptable for non-security-critical uses, but `crypto.subtle` is the correct choice for production security implementations.

  **MUST NOT store raw key bytes or derived key material in `localStorage` or `sessionStorage`.** These storage mechanisms are accessible to all JavaScript on the page, including injected scripts from XSS attacks. `CryptoKey` objects stored in IndexedDB as non-exportable are inaccessible to JavaScript — they can be used for operations but not read — providing meaningful isolation from XSS.

  **`## Visual`:** Mermaid sequence diagram showing encrypted local storage: user enters password → `PBKDF2.deriveKey(password, salt)` → `AES-GCM.encrypt(data, derivedKey, iv)` → store `{ salt, iv, ciphertext }` in IndexedDB. Decryption path reverses the sequence.

  **`## Example`:** Password-based AES-GCM encryption with Web Crypto:
  ```js
  async function encrypt(password, data) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
    );
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(data));
    return { salt, iv, ciphertext };
  }
  ```

  **`## Related FEEs`:**
  - FEE-1200 — Security Overview
  - FEE-1202 — Authentication & Token Storage
  - FEE-404 — Storage & State Persistence

  **`## References`:**
  - MDN: Web Crypto API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
  - MDN: SubtleCrypto — https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
  - OWASP: Password Storage Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
  - W3C Web Cryptography API — https://www.w3.org/TR/WebCryptoAPI/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1210
  title: 用戶端金鑰衍生與 Web Crypto API
  state: draft
  category: Security
  ---
  ```
  **H1:** `# 用戶端金鑰衍生與 Web Crypto API`

  Related FEE titles:
  - FEE-1200 — 資訊安全總覽
  - FEE-1202 — 身份驗證與 Token 儲存
  - FEE-404 — 儲存與狀態持久化

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/Security/1210.md docs/zh-tw/Security/1210.md
  git commit -m "feat(fee-1210): client-side key derivation & Web Crypto API — EN + zh-TW"
  ```

---

### Task 4: FEE-1308 App Shell Architecture

**Files:**
- Create: `docs/en/Progressive Web Apps and Offline/1308.md`
- Create: `docs/zh-tw/Progressive Web Apps and Offline/1308.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1308
  title: App Shell Architecture
  state: draft
  category: Progressive Web Apps and Offline
  ---
  ```

  **H1:** `# App Shell Architecture`

  **Opening (2–4 paragraphs covering):**
  - The App Shell model separates the UI chrome that is always present — navigation, header, footer, layout skeleton — from the dynamic content that changes per page. The shell is pre-cached by the service worker at install time and served instantly from cache on all subsequent visits, regardless of network condition. The dynamic content loads into the shell after the shell renders, via fetch or streaming.
  - The result is an application that feels instant on repeat visits: the skeleton of the page appears in milliseconds from cache, and the content fills in as it loads. On a slow network, the shell renders immediately while the content loads in the background. Offline, pages that have been previously visited are served from cache; the shell renders for unvisited pages while an offline indicator informs the user.
  - The App Shell model is a specific implementation of the Cache First strategy (FEE-1303) applied to the application's structural layer. It is most appropriate for single-page applications where the navigation chrome is consistent across all routes. Multi-page applications with distinct layouts per route may not benefit uniformly from a single cached shell.

  **`## Principle`:**

  Engineers SHOULD pre-cache the App Shell — the HTML skeleton, critical CSS, and application JS bundle — in the service worker's `install` event using `cache.addAll()`. The shell must be a minimal set of resources: only what is required to render the navigable skeleton without content. Pre-caching too many resources at install time delays the `activate` event and the service worker becoming operational on first visit.

  Engineers MUST version the App Shell cache and delete old cache versions in the service worker's `activate` event. An App Shell that is cached indefinitely with no versioning mechanism will never update even when the HTML and JS bundles change. Versioning the cache name (e.g., `app-shell-v3`) and deleting all caches whose names do not match the current version ensures users receive updated shells after deployment.

  **`## Design Thinking` subsections:**
  - `### Shell vs. content separation` — What goes in the shell: navigation markup, layout CSS, application entry point JS. What does not: page-specific content, API data, images that are unique to a page. The shell is what every route shares.
  - `### Streaming into the shell` — SSR with streaming allows the server to send the shell's HTML immediately, before the dynamic content is ready. The browser renders the shell while the server continues generating content. React 18's `<Suspense>` and streaming SSR integrate with the App Shell model.
  - `### Shell cache invalidation` — When the shell HTML references versioned JS and CSS bundles (e.g., `/app.abc123.js`), a new build produces new bundle filenames. The shell HTML must also be updated to reference the new filenames, which invalidates the shell cache. Cache versioning handles this correctly.
  - `### App Shell and SPA routing` — In an SPA, the service worker intercepts navigation requests and serves the cached shell HTML for all routes. The SPA's client-side router renders the appropriate component after the shell loads.

  **`## Best Practices`:**

  **MUST pre-cache only the minimum resources required to render the App Shell skeleton in the service worker `install` event.** Every resource added to `cache.addAll()` must be fetched and cached before the `install` event resolves. Pre-caching large images, non-critical fonts, or page-specific resources delays activation and increases data usage on first install. The shell should be a few KB of HTML, CSS, and the application entry point JS.

  **MUST use a versioned cache name for the App Shell and delete all unrecognized caches in the `activate` event.** Cache names like `shell-v1`, `shell-v2` allow new deployments to use a new cache while the `activate` event cleans up the old one. Without cleanup, old caches accumulate indefinitely, consuming storage on the user's device.

  **SHOULD configure the service worker to serve the cached App Shell HTML for all navigation requests to unrecognized routes in an SPA.** When a user navigates directly to `/profile` or `/settings`, the browser sends a navigation request that the service worker intercepts. The correct response is the cached shell HTML; the SPA's client-side router then renders the route. Without this, a direct navigation to any route other than `/` returns a 404 when offline.

  **`## Visual`:** Mermaid diagram showing App Shell lifecycle: install event → pre-cache shell resources → activate event → delete old caches → navigation request → serve shell from cache → dynamic content fetched from network → rendered in shell.

  **`## Example`:** Service worker App Shell caching:
  ```js
  const SHELL_CACHE = 'shell-v2';
  const SHELL_RESOURCES = ['/', '/app.js', '/styles.css', '/offline.html'];
  self.addEventListener('install', e => e.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_RESOURCES))
  ));
  self.addEventListener('activate', e => e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k)))
    )
  ));
  self.addEventListener('fetch', e => {
    if (e.request.mode === 'navigate') {
      e.respondWith(caches.match('/').then(r => r || fetch(e.request)));
    }
  });
  ```

  **`## Related FEEs`:**
  - FEE-1300 — Progressive Web Apps & Offline Overview
  - FEE-1302 — Service Workers
  - FEE-1303 — Caching Strategies
  - FEE-1309 — Update Detection & Refresh Prompts

  **`## References`:**
  - web.dev: App Shell Model — https://web.dev/articles/app-shell
  - MDN: Service Worker API — https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  - Google Developers: PWA Training — https://web.dev/learn/pwa/

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1308
  title: App Shell 架構
  state: draft
  category: Progressive Web Apps and Offline
  ---
  ```
  **H1:** `# App Shell 架構`

  Related FEE titles:
  - FEE-1300 — Progressive Web Apps 與離線功能概覽
  - FEE-1302 — Service Worker
  - FEE-1303 — 快取策略
  - FEE-1309 — 更新偵測與重新整理提示

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Progressive Web Apps and Offline/1308.md" "docs/zh-tw/Progressive Web Apps and Offline/1308.md"
  git commit -m "feat(fee-1308): app shell architecture — EN + zh-TW"
  ```

---

### Task 5: FEE-1309 Update Detection & Refresh Prompts

**Files:**
- Create: `docs/en/Progressive Web Apps and Offline/1309.md`
- Create: `docs/zh-tw/Progressive Web Apps and Offline/1309.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1309
  title: Update Detection & Refresh Prompts
  state: draft
  category: Progressive Web Apps and Offline
  ---
  ```

  **H1:** `# Update Detection & Refresh Prompts`

  **Opening (2–4 paragraphs covering):**
  - Service workers create a caching layer between the application and the network. This improves performance and enables offline functionality — but it also means that users may be running an old version of the application after a new version has been deployed. The service worker lifecycle governs when new versions become active: a new service worker file is installed but waits in a `waiting` state until all existing tabs are closed before it activates and controls the page.
  - Applications that need users to receive updates promptly — for security patches, critical bug fixes, or feature releases that affect data compatibility — cannot rely on passive cache expiration. They must detect when a new service worker is available, notify the user, and provide a way to activate the new version without requiring the user to close all tabs manually.
  - The pattern is: detect `waiting` state via the service worker registration, show an in-app "Update available" prompt with a "Refresh" button, and on user confirmation, send a `SKIP_WAITING` message to the waiting service worker to force activation, then reload the page. The `skipWaiting()` trade-off — forced activation before all tabs close — is acceptable in controlled update flows but problematic when applied automatically.

  **`## Principle`:**

  Engineers SHOULD detect new service worker availability by listening to the `updatefound` event on the service worker registration and monitoring the `statechange` of the installing service worker. When the new service worker reaches the `installed` state (meaning it is waiting), the application should display an update prompt to the user. Automatically calling `skipWaiting()` without user consent can cause data inconsistency if the user has multiple tabs open with uncommitted state.

  Engineers MUST call `window.location.reload()` after `skipWaiting()` activates the new service worker. The page must reload to use the new service worker's cache; a page that does not reload continues running the old JavaScript even after the new service worker is active. The reload must be triggered either by the page after receiving a message from the service worker that activation is complete, or by the service worker broadcasting a message to all controlled clients.

  **`## Design Thinking` subsections:**
  - `### Service worker lifecycle` — `installing` → `installed` (waiting) → `activating` → `activated`. A new SW enters `waiting` if any tab still has the old SW active. `skipWaiting()` skips the waiting phase. `clients.claim()` in `activate` immediately controls all open clients.
  - `### skipWaiting trade-offs` — Automatic `skipWaiting` is convenient but risky: if Tab A has unsaved form state and Tab B triggers a skipWaiting, Tab A's service worker is replaced mid-session. User-initiated `skipWaiting` via a prompt is the safe pattern.
  - `### Broadcasting to all tabs` — When the new SW is activated (after `skipWaiting`), it should broadcast a message to all controlled clients so each tab can reload. `clients.matchAll().then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))`.
  - `### Workbox injectManifest and update detection` — Workbox provides `workbox-window` which abstracts the registration and update detection lifecycle into a simpler API. `wb.addEventListener('waiting', showUpdatePrompt)`.

  **`## Best Practices`:**

  **SHOULD show an explicit user-facing update prompt rather than automatically calling `skipWaiting()`.** An automatic `skipWaiting()` can interrupt users who have uncommitted work in other tabs, causing data loss or UI inconsistency. A prompt gives users the choice to update now or later, preserving their current session.

  **MUST trigger `window.location.reload()` after the new service worker is activated.** The page cannot update to use the new service worker's cache and new JavaScript without a reload. Post-activation reload should be triggered by the service worker broadcasting `SW_UPDATED` to the controlling tab, not by a timer.

  **SHOULD use `workbox-window` to simplify the service worker registration and update detection lifecycle in production applications.** `workbox-window` handles the `updatefound`/`statechange` event wiring, provides a `waiting` event when a new SW is waiting, and exposes a `messageSkipWaiting()` method that sends the `SKIP_WAITING` message. This reduces the boilerplate for update detection to a few lines.

  **`## Visual`:** Mermaid sequence diagram: SW update flow: new deploy → browser detects new SW → SW installs → SW enters waiting → app shows update prompt → user clicks Refresh → app sends SKIP_WAITING → SW activates → SW broadcasts SW_UPDATED → app reloads.

  **`## Example`:** Update detection with workbox-window:
  ```js
  import { Workbox } from 'workbox-window';
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');
    wb.addEventListener('waiting', () => {
      if (confirm('A new version is available. Refresh to update?')) {
        wb.addEventListener('controlling', () => window.location.reload());
        wb.messageSkipWaiting();
      }
    });
    wb.register();
  }
  ```

  **`## Related FEEs`:**
  - FEE-1300 — Progressive Web Apps & Offline Overview
  - FEE-1302 — Service Workers
  - FEE-1303 — Caching Strategies
  - FEE-1308 — App Shell Architecture

  **`## References`:**
  - web.dev: Service worker lifecycle — https://web.dev/articles/service-worker-lifecycle
  - Workbox: workbox-window — https://developer.chrome.com/docs/workbox/modules/workbox-window
  - MDN: Service Worker: skipWaiting() — https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1309
  title: 更新偵測與重新整理提示
  state: draft
  category: Progressive Web Apps and Offline
  ---
  ```
  **H1:** `# 更新偵測與重新整理提示`

  Related FEE titles:
  - FEE-1300 — Progressive Web Apps 與離線功能概覽
  - FEE-1302 — Service Worker
  - FEE-1303 — 快取策略
  - FEE-1308 — App Shell 架構

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Progressive Web Apps and Offline/1309.md" "docs/zh-tw/Progressive Web Apps and Offline/1309.md"
  git commit -m "feat(fee-1309): update detection & refresh prompts — EN + zh-TW"
  ```

---

### Task 6: FEE-1408 OpenTelemetry Trace Correlation in the Browser

**Files:**
- Create: `docs/en/Observability and Error Tracking/1408.md`
- Create: `docs/zh-tw/Observability and Error Tracking/1408.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1408
  title: OpenTelemetry Trace Correlation in the Browser
  state: draft
  category: Observability and Error Tracking
  ---
  ```

  **H1:** `# OpenTelemetry Trace Correlation in the Browser`

  **Opening (2–4 paragraphs covering):**
  - OpenTelemetry (OTel) is the CNCF standard for distributed tracing, metrics, and logs. In a distributed system, a single user action may trigger requests to multiple backend services; a trace connects all the spans across services into a single view of the request flow. Browser-side OTel extends this trace from the user's click to the backend service that ultimately served the data — creating end-to-end visibility from UI interaction to database query.
  - The correlation mechanism is the `traceparent` HTTP header (W3C Trace Context specification). When the browser makes a fetch request, the OTel SDK automatically injects `traceparent` into the request headers. The backend reads this header, extracts the trace ID and parent span ID, and continues the trace. Any backend that is also instrumented with OTel automatically links its spans to the browser-originated trace.
  - Browser-side OTel uses `@opentelemetry/sdk-trace-web` and instrumentation packages for `fetch` and `XMLHttpRequest`. The browser SDK creates spans for network requests and user interactions, reports them to an OTel Collector (via OTLP/HTTP), and the Collector forwards them to the observability backend (Jaeger, Zipkin, Honeycomb, Grafana Tempo).

  **`## Principle`:**

  Engineers SHOULD instrument browser fetch calls with the OTel `FetchInstrumentation` to automatically propagate trace context to all API requests. Automatic propagation via the instrumentation package requires no per-request changes to the application's fetching code; the `traceparent` header is injected by the instrumentation layer. Manual propagation — adding `traceparent` headers in application code — is fragile and bypasses the benefits of the OTel SDK's context propagation.

  Engineers MUST configure the OTel SDK with an appropriate sampling rate for browser telemetry. Browser applications have many users; a 100% sampling rate produces enormous trace volume that overwhelms storage and increases costs. Head-based sampling at 1–10% is typical for high-traffic applications; tail-based sampling (sample traces with errors or high latency) provides better signal quality at lower volume.

  **`## Design Thinking` subsections:**
  - `### W3C Trace Context standard` — The `traceparent` header format: `00-{traceId}-{spanId}-{flags}`. `tracestate` for vendor-specific context. Browser and backend must use compatible propagators; OTel's W3C propagator is the default.
  - `### OTLP/HTTP vs. OTLP/gRPC` — Browser environments can only use OTLP/HTTP (gRPC is not available in the browser). The OTel Collector must expose an OTLP/HTTP endpoint. CORS headers must allow the browser's origin to send to the Collector.
  - `### User interaction spans` — Manual spans for user interactions: `tracer.startSpan('button.click')`, set attributes, end span. Correlates user actions with the API calls they trigger.
  - `### Privacy and PII in spans` — Browser spans must not include PII: user IDs, email addresses, form values. OTel span attributes are sent to the Collector and stored in the observability backend; any PII included in attributes is stored in those systems.

  **`## Best Practices`:**

  **MUST configure CORS on the OTel Collector to allow requests from the browser application's origin.** Browser-to-Collector requests are cross-origin; without CORS headers on the Collector, the browser blocks the telemetry upload. Configure the Collector's `otlp` receiver to allow the application's origin, or use a same-origin proxy that forwards to the Collector.

  **SHOULD sample browser telemetry at a rate below 100% and instrument only user actions and API calls — not render cycles, scroll events, or other high-frequency events.** High-frequency browser events at 100% sampling generate enormous trace volume. Focus instrumentation on the events that provide diagnostic value: user-initiated actions, navigation transitions, API request/response pairs.

  **MUST NOT include PII (user email, user ID, form values) as span attribute values.** Span attributes are stored in the observability backend and accessible to anyone with access to that system. Sanitize span attributes to contain only non-identifying metadata: route name, response status code, component name.

  **`## Visual`:** Mermaid sequence diagram showing trace propagation: user clicks → browser creates span → fetch with `traceparent` header → API gateway continues trace → microservice A continues trace → database query span. Show the single trace ID connecting all spans.

  **`## Example`:** OTel browser SDK setup with fetch instrumentation:
  ```js
  import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
  import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
  import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
  import { registerInstrumentations } from '@opentelemetry/instrumentation';
  import { W3CTraceContextPropagator } from '@opentelemetry/core';
  const provider = new WebTracerProvider();
  provider.register({ propagator: new W3CTraceContextPropagator() });
  provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter({ url: '/otel/v1/traces' })));
  registerInstrumentations({
    instrumentations: [new FetchInstrumentation({ propagateTraceHeaderCorsUrls: [/api\.example\.com/] })],
  });
  ```

  **`## Related FEEs`:**
  - FEE-1400 — Observability & Error Tracking Overview
  - FEE-1404 — Performance Monitoring & Tracing
  - FEE-403 — Fetch, Streams & Network APIs
  - FEE-1409 — Privacy-Respecting Observability

  **`## References`:**
  - OpenTelemetry: Browser SDK — https://opentelemetry.io/docs/instrumentation/js/getting-started/browser/
  - W3C Trace Context — https://www.w3.org/TR/trace-context/
  - OTel JS: FetchInstrumentation — https://github.com/open-telemetry/opentelemetry-js

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1408
  title: 瀏覽器中的 OpenTelemetry Trace 關聯
  state: draft
  category: Observability and Error Tracking
  ---
  ```
  **H1:** `# 瀏覽器中的 OpenTelemetry Trace 關聯`

  Related FEE titles:
  - FEE-1400 — 可觀測性與錯誤追蹤總覽
  - FEE-1404 — 效能監控與追蹤
  - FEE-403 — Fetch、串流與網路 API
  - FEE-1409 — 尊重隱私的可觀測性

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Observability and Error Tracking/1408.md" "docs/zh-tw/Observability and Error Tracking/1408.md"
  git commit -m "feat(fee-1408): OpenTelemetry trace correlation in the browser — EN + zh-TW"
  ```

---

### Task 7: FEE-1409 Privacy-Respecting Observability

**Files:**
- Create: `docs/en/Observability and Error Tracking/1409.md`
- Create: `docs/zh-tw/Observability and Error Tracking/1409.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1409
  title: Privacy-Respecting Observability
  state: draft
  category: Observability and Error Tracking
  ---
  ```

  **H1:** `# Privacy-Respecting Observability`

  **Opening (2–4 paragraphs covering):**
  - Observability tools — error trackers, session replay, RUM — collect data from users' browsers. Without deliberate design, this collection drifts toward privacy violations: stack traces that include form values, session replays that capture passwords and credit card numbers, error payloads that include personally identifiable information. GDPR, CCPA, and similar regulations require that this data collection be disclosed, consented to, and minimized to what is necessary.
  - Privacy-respecting observability means collecting the signals needed to identify and diagnose problems — error rates, latency distributions, affected browser versions, reproduction paths — without collecting data that identifies individuals or captures sensitive content. The principle of data minimization: collect only what is necessary to answer the diagnostic questions, nothing more.
  - The operational challenge is that observability data naturally accumulates detail. Error payloads include message and stack trace; RUM collects page URLs; session replay captures DOM mutations. Each category has privacy implications that must be addressed: stack traces must be scrubbed of PII, URLs must not contain user identifiers in path segments, session replay must mask sensitive fields.

  **`## Principle`:**

  Engineers MUST scrub PII from error payloads before transmitting them to error tracking services. Stack trace messages, captured variables, and breadcrumbs can include user-supplied values — form input, API response bodies, URL parameters containing user tokens. The Sentry `beforeSend` hook, Datadog RUM's `beforeSend` callback, and equivalent APIs in other error trackers provide a scrubbing point. Scrubbing must be applied before transmission; data in the error tracking service cannot be retroactively deleted.

  Engineers SHOULD apply sampling to RUM and session replay telemetry rather than capturing every user session. 100% session replay capture produces a massive dataset where most sessions are uneventful, and increases both storage costs and PII exposure surface. Sampling 1–5% of sessions (or targeting sessions that include errors) captures the diagnostic signal with substantially lower data collection volume.

  **`## Design Thinking` subsections:**
  - `### GDPR data minimization principle` — Collect only the minimum data necessary for the stated purpose. Observability's purpose is diagnosing bugs and performance problems. User email addresses, full names, and financial data are not necessary for this purpose.
  - `### Consent-gated telemetry` — Observability telemetry that includes user session data requires consent under GDPR. Two patterns: collect anonymized performance metrics without consent (no PII, no session identifiers); collect session replay only after explicit opt-in consent.
  - `### PII scrubbing strategies` — Allowlist approach: only specific fields are sent. Blocklist approach: specific known-PII fields are redacted. Regex scrubbing: patterns like email addresses and credit card numbers in error messages are replaced with `[REDACTED]`. Allowlist is safer but requires maintenance.
  - `### URL anonymization` — URLs in performance metrics and error context often contain user IDs in path segments (`/users/12345/profile`) or query parameters (`?token=abc`). Parameterize paths before logging: `/users/:id/profile`. Strip or redact query parameters that contain session tokens.

  **`## Best Practices`:**

  **MUST configure a `beforeSend` hook in error tracking tools to scrub PII from error payloads before transmission.** The hook receives the error event object and returns the (possibly modified) object. Remove or redact: user identifiers in `user.email`/`user.username` (replace with anonymized IDs), form input values in captured variables, auth tokens in breadcrumb URLs, API response bodies that contain user data.

  **SHOULD use a sampling rate below 100% for session replay and RUM, targeting sessions with errors or high-latency interactions for capture.** Session replay at 100% captures every user interaction for every user in every session. At 1% sampling with error-triggered capture, the diagnostic value is similar at a fraction of the data collection volume. Most sessions are uneventful; the sessions with errors are the ones that matter.

  **MUST mask sensitive input fields in session replay tools.** Session replay SDKs (FullStory, LogRocket, PostHog) provide DOM masking configuration. Password fields, credit card fields, SSN fields, and any `<input type="password">` must be masked. Some tools apply masking automatically to `type="password"` but not to other sensitive fields; explicitly configure masking for all fields that contain sensitive user input.

  **`## Visual`:** Mermaid data flow diagram: browser → telemetry SDK → `beforeSend` hook (scrub PII) → sampler (apply sampling rate) → observability backend. Annotate where PII is removed and where sampling reduces volume.

  **`## Example`:** Sentry `beforeSend` hook for PII scrubbing:
  ```js
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    beforeSend(event) {
      // Remove user PII
      if (event.user) { event.user = { id: event.user.id }; } // keep only anonymized ID
      // Scrub auth tokens from URLs in breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs.values = event.breadcrumbs.values.map(b => ({
          ...b,
          data: b.data ? { ...b.data, url: b.data.url?.replace(/token=[^&]+/, 'token=[REDACTED]') } : b.data,
        }));
      }
      return event;
    },
  });
  ```

  **`## Related FEEs`:**
  - FEE-1400 — Observability & Error Tracking Overview
  - FEE-1401 — Error Tracking with Sentry
  - FEE-1402 — Real User Monitoring & Core Web Vitals
  - FEE-1408 — OpenTelemetry Trace Correlation in the Browser

  **`## References`:**
  - Sentry: Data Management and Privacy — https://docs.sentry.io/security-legal-pii/scrubbing/
  - GDPR Article 5: Data minimization — https://gdpr-info.eu/art-5-gdpr/
  - OWASP: Logging Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1409
  title: 尊重隱私的可觀測性
  state: draft
  category: Observability and Error Tracking
  ---
  ```
  **H1:** `# 尊重隱私的可觀測性`

  Related FEE titles:
  - FEE-1400 — 可觀測性與錯誤追蹤總覽
  - FEE-1401 — 使用 Sentry 進行錯誤追蹤
  - FEE-1402 — 真實用戶監控與 Core Web Vitals
  - FEE-1408 — 瀏覽器中的 OpenTelemetry Trace 關聯

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Observability and Error Tracking/1409.md" "docs/zh-tw/Observability and Error Tracking/1409.md"
  git commit -m "feat(fee-1409): privacy-respecting observability — EN + zh-TW"
  ```

---

### Task 8: FEE-1410 Observability for Internal Tools & Admin UIs

**Files:**
- Create: `docs/en/Observability and Error Tracking/1410.md`
- Create: `docs/zh-tw/Observability and Error Tracking/1410.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1410
  title: Observability for Internal Tools & Admin UIs
  state: draft
  category: Observability and Error Tracking
  ---
  ```

  **H1:** `# Observability for Internal Tools & Admin UIs`

  **Opening (2–4 paragraphs covering):**
  - Internal tools — admin dashboards, CRM interfaces, back-office workflows, and ops tools — are built for a small number of authenticated users who are often technical. The common assumption is that these tools do not need observability because user-facing bugs will be reported immediately. This assumption fails in practice: support escalations arrive with "it doesn't work" rather than a reproducible error; slow admin queries degrade the performance of downstream operations; access control bugs in admin tools have outsized security impact.
  - The argument for observability in internal tools is not volume — few users mean few errors — but severity. An admin tool that mispermissions a user, fails to process a support ticket, or silently drops a batch operation has consequences disproportionate to its usage. Errors that would be caught quickly by high traffic volume are invisible in low-traffic internal tools until they affect a critical operation.
  - The observability stack for internal tools is typically lighter than for public-facing applications: a simple error tracker (Sentry, Rollbar), structured console logging, and RUM for the few critical workflows. Full session replay and sophisticated sampling strategies are unnecessary; what matters is that every error is captured and actionable.

  **`## Principle`:**

  Engineers SHOULD instrument every internal tool with error tracking that captures every unhandled error, not a sampled subset. Public-facing applications use sampling because volume is high and costs would be prohibitive at 100%. Internal tools have low traffic; 100% error capture is affordable and appropriate. A single missed error in an admin tool may affect an SLA, a compliance record, or a user's access rights.

  Engineers SHOULD log every destructive or high-impact action in an internal tool as a structured event — user ID, action type, target entity, timestamp, outcome. This is an audit log, not telemetry; it is the record of what happened and who did it. Audit logs must be immutable and retained according to compliance requirements. They provide the context needed to diagnose support escalations months after the fact.

  **`## Design Thinking` subsections:**
  - `### Error vs. audit logging` — Error logs capture unexpected failures; audit logs capture expected, intentional actions. Both are necessary in internal tools. Error logs go to Sentry/Rollbar; audit logs go to a structured log store (database, CloudWatch Logs, Elasticsearch).
  - `### Structured logging for internal tools` — `console.log` is insufficient for debugging production issues. Use a structured logging library (winston, pino) that outputs JSON with consistent fields: `timestamp`, `level`, `component`, `action`, `userId`, `entityId`, `outcome`.
  - `### Performance monitoring for critical workflows` — Admin operations that are slow are often slow because they process large amounts of data. RUM for internal tools should focus on the specific workflows that affect SLA — batch processing pages, report generation, bulk edit operations.
  - `### Access control error monitoring` — Permission errors in admin tools are often silent: a user receives a 403 and assumes the feature doesn't exist. Monitoring permission errors (distinct from user authentication failures) surfaces access control gaps and misconfigured roles.

  **`## Best Practices`:**

  **MUST capture all unhandled errors in internal tools with a 100% sampling rate.** Internal tools typically have tens or hundreds of active users, not millions. The volume is low enough that 100% error capture is affordable, and the consequence of a missed error — a failed admin operation, a permission bug, a data corruption — is high enough to justify full coverage.

  **SHOULD implement structured audit logging for all write operations in internal tools.** Every action that creates, modifies, or deletes data should produce a structured log entry: who performed the action, what was changed, when, and what the outcome was. This is non-negotiable for tools that handle financial data, user access rights, or compliance-sensitive operations.

  **SHOULD monitor HTTP 4xx and 5xx error rates on internal tool API calls separately from user authentication failures.** 403 errors from permission checks are expected; a sudden spike indicates a misconfigured role or an access control regression. 500 errors from internal tool API routes indicate server-side failures in admin operations that may leave data in an inconsistent state.

  **`## Visual`:** Mermaid diagram showing the observability stack for an internal tool: user action → browser (error tracking: 100% sample rate) + (audit log: every write) → structured logs → log aggregation (CloudWatch/ELK) → alerts for error rate spikes and audit log gaps.

  **`## Example`:** Structured audit log for an admin action:
  ```js
  async function deleteUser(adminId, targetUserId) {
    logger.info({
      action: 'user.delete', adminId, targetUserId,
      timestamp: new Date().toISOString(), status: 'initiated'
    });
    try {
      await userService.delete(targetUserId);
      logger.info({ action: 'user.delete', adminId, targetUserId, status: 'success' });
    } catch (error) {
      logger.error({ action: 'user.delete', adminId, targetUserId, status: 'failed', error: error.message });
      Sentry.captureException(error, { extra: { adminId, targetUserId } });
      throw error;
    }
  }
  ```

  **`## Related FEEs`:**
  - FEE-1400 — Observability & Error Tracking Overview
  - FEE-1401 — Error Tracking with Sentry
  - FEE-1403 — Logging & Structured Logging
  - FEE-1409 — Privacy-Respecting Observability

  **`## References`:**
  - Sentry: Getting Started — https://docs.sentry.io/platforms/javascript/
  - pino: Structured logging — https://github.com/pinojs/pino
  - OWASP: Logging Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 1410
  title: 內部工具與管理介面的可觀測性
  state: draft
  category: Observability and Error Tracking
  ---
  ```
  **H1:** `# 內部工具與管理介面的可觀測性`

  Related FEE titles:
  - FEE-1400 — 可觀測性與錯誤追蹤總覽
  - FEE-1401 — 使用 Sentry 進行錯誤追蹤
  - FEE-1403 — 日誌記錄與結構化日誌
  - FEE-1409 — 尊重隱私的可觀測性

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Observability and Error Tracking/1410.md" "docs/zh-tw/Observability and Error Tracking/1410.md"
  git commit -m "feat(fee-1410): observability for internal tools & admin UIs — EN + zh-TW"
  ```

---

### Task 9: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [1207.SSR & Server Component Security](1207)`, add:
  ```
  - [1208.Subresource Integrity (SRI)](1208)
  - [1209.Open Redirect Prevention & URL Validation](1209)
  - [1210.Client-Side Key Derivation & Web Crypto API](1210)
  ```

  After `- [1307.PWA in Production](1307)`, add:
  ```
  - [1308.App Shell Architecture](1308)
  - [1309.Update Detection & Refresh Prompts](1309)
  ```

  After `- [1407.Session Replay & Production Debugging](1407)`, add:
  ```
  - [1408.OpenTelemetry Trace Correlation in the Browser](1408)
  - [1409.Privacy-Respecting Observability](1409)
  - [1410.Observability for Internal Tools & Admin UIs](1410)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [1207.伺服器端渲染（SSR）與伺服器元件安全](1207)`, add:
  ```
  - [1208.子資源完整性（SRI）](1208)
  - [1209.開放重新導向防護與 URL 驗證](1209)
  - [1210.用戶端金鑰衍生與 Web Crypto API](1210)
  ```

  After `- [1307.PWA 上線實務](1307)`, add:
  ```
  - [1308.App Shell 架構](1308)
  - [1309.更新偵測與重新整理提示](1309)
  ```

  After `- [1407.工作階段重播與正式環境除錯](1407)`, add:
  ```
  - [1408.瀏覽器中的 OpenTelemetry Trace 關聯](1408)
  - [1409.尊重隱私的可觀測性](1409)
  - [1410.內部工具與管理介面的可觀測性](1410)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-1208–1210, 1308–1309, 1408–1410 to list files"
  ```
