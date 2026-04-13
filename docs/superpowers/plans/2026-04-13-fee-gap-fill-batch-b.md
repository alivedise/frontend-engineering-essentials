# FEE Gap-Fill Batch B — JavaScript Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 5 gap-fill articles for the JavaScript Core category (FEE-309–313) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/JavaScript Core and Runtime/309.md` — WeakMap, WeakSet & Weak References
- `docs/en/JavaScript Core and Runtime/310.md` — Symbols & Well-Known Symbols
- `docs/en/JavaScript Core and Runtime/311.md` — Proxy & Reflect API
- `docs/en/JavaScript Core and Runtime/312.md` — `this` Binding & Context Edge Cases
- `docs/en/JavaScript Core and Runtime/313.md` — Structured Clone & `structuredClone()`

**Files to create (zh-TW):** Mirror under `docs/zh-tw/JavaScript Core and Runtime/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Key rules:
- `## Principle` — 1–2 paragraphs, RFC-2119 MUST/SHOULD/MUST NOT
- `## Design Thinking` — `###` subsections with prose
- `## Best Practices` — bold-prefix paragraphs only; NO code, NO `###`, NO bullets
- `## Visual` — one Mermaid diagram
- `## Example` — one realistic code block
- `## Common Mistakes` — optional
- `## Related FEEs` / `## References` — 3+ each

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

Target: 300+ lines per file.

---

### Task 1: FEE-309 WeakMap, WeakSet & Weak References

**Files:**
- Create: `docs/en/JavaScript Core and Runtime/309.md`
- Create: `docs/zh-tw/JavaScript Core and Runtime/309.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 309
  title: WeakMap, WeakSet & Weak References
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```

  **H1:** `# WeakMap, WeakSet & Weak References`

  **Opening (2–4 paragraphs covering):**
  - `WeakMap` and `WeakSet` are collection types that hold weak references to their keys (WeakMap) or values (WeakSet). "Weak" means the reference does not prevent garbage collection: if the only remaining reference to an object is its key in a WeakMap, the garbage collector can reclaim the object and the WeakMap entry disappears. This makes WeakMap and WeakSet invisible to normal iteration — there is no `.forEach`, no `.size`, no way to enumerate contents — because doing so would expose GC timing.
  - The practical implication is that WeakMap is the correct data structure when you need to associate metadata with an object without preventing that object from being garbage-collected when all other references to it are gone. DOM nodes are the canonical example: attaching metadata to a DOM node via a WeakMap means the metadata is automatically cleaned up when the node is removed from the document and collected, with no manual cleanup required.
  - `WeakRef` (ES2021) and `FinalizationRegistry` extend this model to allow explicit weak references to objects and callbacks triggered when objects are collected. These are lower-level primitives, appropriate for cache implementations and resource tracking but not for general application code. The garbage collector's timing is implementation-defined; code that depends on `WeakRef` targets being collected at a specific time will behave inconsistently across engines and across runs.

  **`## Principle`:**

  Engineers SHOULD use `WeakMap` rather than `Map` when associating private metadata or caches with objects that have a lifetime independent of the metadata. A `Map<HTMLElement, EventData>` retains every element it has seen indefinitely, preventing GC even after elements are removed from the DOM. A `WeakMap<HTMLElement, EventData>` releases entries automatically when elements are collected. The correct choice is `WeakMap` whenever the metadata has no independent lifetime — it should live and die with the key object.

  Engineers MUST NOT use `WeakRef` or `FinalizationRegistry` as a substitute for explicit resource cleanup. Garbage collection timing is non-deterministic and engine-specific. A `WeakRef` target may persist for the lifetime of the process or may be collected within milliseconds, depending on the engine's GC strategy and memory pressure. These APIs are appropriate for caches where stale entries are tolerable; they are not appropriate for cleanup that must happen promptly or in a predictable order.

  **`## Design Thinking` subsections:**
  - `### WeakMap as private fields before private fields` — Historical use of WeakMap to implement private class state before `#privateFields` were added to JavaScript. Why it worked and why `#privateFields` is the better choice today.
  - `### DOM metadata without memory leaks` — The Map vs. WeakMap comparison for DOM-associated state. Show that a `Map<Node, Data>` grows indefinitely in a SPA that creates and destroys elements; a `WeakMap<Node, Data>` does not.
  - `### WeakSet for object tagging` — WeakSet as a "has this object been seen" registry. Use case: tracking processed objects in a recursive transform without preventing their collection afterward.
  - `### WeakRef and FinalizationRegistry` — What they are for (caches, debug tooling, proxies to large objects). The invariant: never write code that is correct only if a WeakRef target has been collected, or correct only if it has not.

  **`## Best Practices`:**

  **SHOULD use `WeakMap` to associate metadata with DOM elements, class instances, or other objects when the metadata has no independent lifetime.** The most common misuse is storing DOM-associated state in a `Map<Element, Data>` inside a component or service. When elements are removed from the DOM and replaced, the Map retains the old elements and their data, growing without bound in long-running SPAs. A `WeakMap` releases entries as elements are collected, making this category of memory leak structurally impossible.

  **MUST NOT rely on `FinalizationRegistry` callbacks for resource cleanup that must happen promptly.** File handles, network connections, and timer cancellation must be cleaned up explicitly when they are no longer needed. A `FinalizationRegistry` callback may run seconds, minutes, or never after the tracked object becomes eligible for collection — the spec permits any of these behaviors. Use `FinalizationRegistry` as a safety net for detecting missed explicit cleanup, not as the primary cleanup mechanism.

  **SHOULD prefer `#privateFields` over `WeakMap`-based private data in modern JavaScript.** Private class fields (supported in all modern browsers and Node.js 12+) provide per-instance private storage with syntax that reads like regular property access, without the indirection of a WeakMap lookup. `WeakMap`-based private data remains relevant when the private state must be accessible from outside the class definition (e.g., in factory functions or mixin patterns), but `#privateFields` is the default choice.

  **`## Visual`:** Mermaid diagram showing garbage collection behavior: a `Map` with three Element keys keeping all elements alive even after DOM removal; a `WeakMap` with the same keys showing the collected entries disappearing after DOM removal.

  **`## Example`:** Code block using `WeakMap` to track whether an element has been initialized by a component, avoiding double-initialization without retaining the element:
  ```js
  const initialized = new WeakMap();
  function initComponent(el) {
    if (initialized.has(el)) return;
    initialized.set(el, true);
    // setup...
  }
  ```

  **`## Common Mistakes`:**
  - Using `Map` instead of `WeakMap` for DOM-associated data, causing memory leaks in SPAs
  - Trying to iterate a `WeakMap` or check its `size` (these don't exist by design)
  - Writing `WeakRef`-dependent logic that assumes the target has been collected after a setTimeout

  **`## Related FEEs`:**
  - FEE-300 — JavaScript Core & Runtime Overview
  - FEE-306 — Memory Management & Garbage Collection
  - FEE-401 — DOM Manipulation & Traversal

  **`## References`:**
  - MDN: WeakMap — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
  - MDN: WeakRef — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
  - MDN: FinalizationRegistry — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
  - TC39: WeakRef proposal — https://github.com/tc39/proposal-weakrefs

- [ ] **Step 2: Verify EN format**
  - [ ] `## Best Practices` has no code blocks, no `###`, no bullets
  - [ ] File is 300+ lines

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 309
  title: WeakMap、WeakSet 與弱引用
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```
  **H1:** `# WeakMap、WeakSet 與弱引用`

  Related FEE titles:
  - FEE-300 — JavaScript 核心與執行環境總覽
  - FEE-306 — 記憶體管理與垃圾回收
  - FEE-401 — DOM 操作與遍歷

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/JavaScript Core and Runtime/309.md" "docs/zh-tw/JavaScript Core and Runtime/309.md"
  git commit -m "feat(fee-309): WeakMap, WeakSet & weak references — EN + zh-TW"
  ```

---

### Task 2: FEE-310 Symbols & Well-Known Symbols

**Files:**
- Create: `docs/en/JavaScript Core and Runtime/310.md`
- Create: `docs/zh-tw/JavaScript Core and Runtime/310.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 310
  title: Symbols & Well-Known Symbols
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```

  **H1:** `# Symbols & Well-Known Symbols`

  **Opening (2–4 paragraphs covering):**
  - `Symbol` is a primitive type in JavaScript introduced in ES2015. Every Symbol value is unique — `Symbol('tag') !== Symbol('tag')` — making Symbols suitable as property keys that are guaranteed not to collide with any other property key, whether defined by user code, library code, or the JavaScript engine itself.
  - Well-known Symbols are a set of built-in Symbol values that the JavaScript runtime checks to configure the behavior of built-in operations. `Symbol.iterator` makes an object iterable; `Symbol.toPrimitive` customizes type coercion; `Symbol.hasInstance` customizes `instanceof` behavior; `Symbol.species` customizes the constructor used for derived objects. These Symbols are how the language provides extension points into its own semantics without creating reserved property names.
  - Symbol-keyed properties are not enumerated by `for...in`, `Object.keys()`, or `JSON.stringify()`. They are accessible via `Object.getOwnPropertySymbols()` and `Reflect.ownKeys()`. This makes them useful for attaching metadata or protocol methods to objects without affecting normal property enumeration or serialization.

  **`## Principle`:**

  Engineers SHOULD use `Symbol()` as property keys when adding metadata or protocol hooks to objects that may be shared across library and application code, where property name collisions would silently corrupt behavior. A library that attaches processing state to a user-provided object using a string key like `__processed` risks collision with application code that uses the same key for unrelated purposes. A Symbol key has zero collision probability.

  Engineers MUST NOT use `Symbol.for()` as a substitute for `Symbol()` when the intent is uniqueness. `Symbol.for(key)` returns the same Symbol for the same key from the global Symbol registry — it is explicitly a shared Symbol, not a unique one. Use `Symbol()` for private, unique keys; use `Symbol.for()` only when intentional cross-realm sharing of the same Symbol is required.

  **`## Design Thinking` subsections:**
  - `### Symbol as non-colliding property key` — The difference between string keys and Symbol keys in shared-object scenarios. Library private state patterns.
  - `### Well-known Symbols as extension points` — `Symbol.iterator` and the iterable protocol. `Symbol.toPrimitive` for custom coercion. `Symbol.hasInstance` for custom `instanceof`. `Symbol.asyncIterator` for async iterables.
  - `### Symbol.for and the global registry` — Cross-realm symbols. When you want two pieces of code to share the same Symbol (e.g., a library exporting a Symbol that consumers use). Contrast with module-level `const sym = Symbol()`.
  - `### Symbols in TypeScript` — Typing Symbol-keyed properties with `unique symbol`. Computed property keys.

  **`## Best Practices`:**

  **SHOULD use `Symbol()` for library-internal property keys attached to user-provided objects, not string keys.** String keys like `_internalState` or `__processed` are visible to user code, enumerated by `Object.keys()`, included in `JSON.stringify()` output, and susceptible to collision. A Symbol key is invisible to standard enumeration and guaranteed unique. This is the correct pattern for any library that annotates user objects as part of its implementation.

  **MUST implement `Symbol.iterator` on any custom collection class that should be iterable with `for...of`, spread syntax, destructuring, or `Array.from()`.** The iterable protocol is the JavaScript standard for custom iteration; classes that expose array-like data without implementing the protocol force users to call implementation-specific methods instead of using standard syntax. An object is iterable if and only if it has a `Symbol.iterator` method that returns an iterator.

  **MUST NOT use `Symbol.for()` when the intent is to create a unique, non-shared key.** `Symbol.for('myLib.state')` returns the same Symbol to any code in any realm that calls `Symbol.for('myLib.state')`, including malicious or unrelated code. If uniqueness and non-collisibility are the goal, use `Symbol()` (no registry lookup, guaranteed unique).

  **`## Visual`:** Mermaid diagram showing the Symbol registry: `Symbol()` → unique, heap-only; `Symbol.for('key')` → stored in global registry, returned on subsequent calls with same key.

  **`## Example`:** Code block implementing `Symbol.iterator` on a `Range` class:
  ```js
  class Range {
    constructor(start, end) { this.start = start; this.end = end; }
    [Symbol.iterator]() {
      let current = this.start;
      const end = this.end;
      return { next() { return current <= end ? { value: current++, done: false } : { done: true }; } };
    }
  }
  for (const n of new Range(1, 5)) console.log(n); // 1 2 3 4 5
  ```

  **`## Related FEEs`:**
  - FEE-300 — JavaScript Core & Runtime Overview
  - FEE-308 — Iterators, Generators & Async Iteration
  - FEE-311 — Proxy & Reflect API

  **`## References`:**
  - MDN: Symbol — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
  - MDN: Well-known Symbols — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#well-known_symbols
  - Axel Rauschmayer: Symbols in ECMAScript 6 — https://2ality.com/2014/12/es6-symbols.html

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 310
  title: Symbol 與內建 Symbol
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```
  **H1:** `# Symbol 與內建 Symbol`

  Related FEE titles:
  - FEE-300 — JavaScript 核心與執行環境總覽
  - FEE-308 — 迭代器、產生器與非同步迭代
  - FEE-311 — Proxy 與 Reflect API

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/JavaScript Core and Runtime/310.md" "docs/zh-tw/JavaScript Core and Runtime/310.md"
  git commit -m "feat(fee-310): symbols & well-known symbols — EN + zh-TW"
  ```

---

### Task 3: FEE-311 Proxy & Reflect API

**Files:**
- Create: `docs/en/JavaScript Core and Runtime/311.md`
- Create: `docs/zh-tw/JavaScript Core and Runtime/311.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 311
  title: Proxy & Reflect API
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```

  **H1:** `# Proxy & Reflect API`

  **Opening (2–4 paragraphs covering):**
  - `Proxy` allows a JavaScript object to intercept fundamental operations — property get, property set, function call, `in` operator, `delete`, `Object.keys()`, prototype access — and substitute custom behavior. A Proxy wraps a target object; operations on the Proxy are intercepted by trap functions in a handler object, which can observe, modify, or block each operation.
  - This is the mechanism behind Vue 3's reactivity system, Immer's produce function, and several validation and access-control libraries. The pattern is metaprogramming: code that programs the behavior of other code. Used well, it removes boilerplate by centralizing cross-cutting concerns (validation, change tracking, access logging) in one place. Used carelessly, it creates invisible behavior that makes debugging difficult.
  - `Reflect` is a companion API that provides the default implementation of each Proxy trap as a static method. `Reflect.get(target, prop)` does what a normal property access does; `Reflect.set(target, prop, value)` does what a normal property assignment does. Using `Reflect` inside trap implementations ensures that the default behavior is preserved when a trap does not need to customize a particular operation.

  **`## Principle`:**

  Engineers SHOULD use `Proxy` to centralize cross-cutting concerns — validation, change notification, access logging, lazy initialization — rather than duplicating this logic in every setter or method. The value of Proxy is that it intercepts operations at the object level, not the property level: a single `set` trap covers every property on the target, without enumerating properties at proxy creation time. This makes Proxy appropriate for targets with dynamic property sets, such as API response objects or configuration stores.

  Engineers MUST use `Reflect` methods inside Proxy traps to perform default operations, rather than accessing the target directly. Directly accessing `target[prop]` inside a `get` trap may work for simple objects but breaks for objects with custom property descriptors, accessor properties (getters/setters), or prototype chains. `Reflect.get(target, prop, receiver)` correctly propagates the receiver, which is essential for inherited getters to work correctly through a Proxy.

  **`## Design Thinking` subsections:**
  - `### Available traps` — The 13 handler traps: `get`, `set`, `has`, `deleteProperty`, `apply`, `construct`, `getPrototypeOf`, `setPrototypeOf`, `isExtensible`, `preventExtensions`, `getOwnPropertyDescriptor`, `defineProperty`, `ownKeys`. Which are used in real-world patterns.
  - `### Proxy for reactivity` — How Vue 3 and MobX use `get` traps to track dependencies and `set` traps to trigger updates. The reactive object pattern as a concrete illustration.
  - `### Proxy for validation` — A validation proxy that intercepts `set` operations and throws if the value does not match a schema. Contrast with schema validation at service boundaries (FEE-1708).
  - `### Performance cost` — Proxy adds overhead to every trapped operation. Benchmarks show 5–20x slower property access in microbenchmarks. In real applications, the overhead is negligible unless the proxied operations are in tight loops. Profile before deciding to avoid Proxy for performance reasons.
  - `### Invariants` — Proxy traps are not unrestricted. The spec defines invariants that traps must not violate (e.g., a `get` trap cannot return a different value for a non-writable, non-configurable property). Violating invariants throws a `TypeError`.

  **`## Best Practices`:**

  **SHOULD use `Reflect.<trap>` as the default behavior in every Proxy trap instead of directly operating on the target object.** `Reflect.get(target, prop, receiver)` correctly handles inherited accessors that reference `this` — if the proxy is the `receiver`, `this` inside the accessor refers to the proxy, not the raw target, which is necessary for reactivity systems and other patterns that need the accessor's `this` to be observable.

  **MUST NOT use `Proxy` to intercept and silently swallow operations.** A `set` trap that returns `true` without actually setting the value — to silently reject invalid assignments — makes the call site unaware that the assignment was ignored. The caller receives no error and cannot distinguish between success and silent failure. Traps that reject operations MUST throw an error or return `false` (which causes strict mode to throw `TypeError`).

  **SHOULD restrict Proxy usage to framework and library infrastructure, not application-level business logic.** Proxies make object behavior non-obvious: a developer reading code that assigns `obj.name = 'Alice'` cannot tell from the syntax alone whether a trap intercepts that assignment. Business logic expressed through Proxies is harder to reason about, test, and debug than explicit methods or reducers. Framework authors may accept this tradeoff; application authors generally should not.

  **`## Visual`:** Mermaid sequence diagram showing: caller → proxy (handler.set trap) → validation logic → Reflect.set(target) → target. Also show the error path when validation fails.

  **`## Example`:** A validation proxy that enforces a schema on property assignment:
  ```js
  function createValidated(target, schema) {
    return new Proxy(target, {
      set(obj, prop, value) {
        if (schema[prop] && !schema[prop](value)) {
          throw new TypeError(`Invalid value for ${prop}: ${value}`);
        }
        return Reflect.set(obj, prop, value);
      }
    });
  }
  const user = createValidated({}, { age: v => Number.isInteger(v) && v >= 0 });
  user.age = 25;    // ok
  user.age = -1;    // throws TypeError
  ```

  **`## Common Mistakes`:**
  - Using `target[prop]` instead of `Reflect.get(target, prop, receiver)` in a `get` trap, breaking inherited accessors
  - Returning `true` from a `set` trap without calling `Reflect.set`, silently discarding the assignment
  - Proxying objects that are compared by identity in third-party code — the Proxy and its target are different objects (`proxy !== target`)

  **`## Related FEEs`:**
  - FEE-300 — JavaScript Core & Runtime Overview
  - FEE-310 — Symbols & Well-Known Symbols
  - FEE-502 — Reactive State & Signals (Vue 3 reactivity uses Proxy)

  **`## References`:**
  - MDN: Proxy — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
  - MDN: Reflect — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
  - Axel Rauschmayer: Meta programming with proxies — https://exploringjs.com/es6/ch_proxies.html

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 311
  title: Proxy 與 Reflect API
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```
  **H1:** `# Proxy 與 Reflect API`

  Related FEE titles:
  - FEE-300 — JavaScript 核心與執行環境總覽
  - FEE-310 — Symbol 與內建 Symbol
  - FEE-502 — 響應式狀態與 Signals

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/JavaScript Core and Runtime/311.md" "docs/zh-tw/JavaScript Core and Runtime/311.md"
  git commit -m "feat(fee-311): proxy & reflect API — EN + zh-TW"
  ```

---

### Task 4: FEE-312 `this` Binding & Context Edge Cases

**Files:**
- Create: `docs/en/JavaScript Core and Runtime/312.md`
- Create: `docs/zh-tw/JavaScript Core and Runtime/312.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 312
  title: this Binding & Context Edge Cases
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```

  **H1:** `` # `this` Binding & Context Edge Cases ``

  **Opening (2–4 paragraphs covering):**
  - `this` in JavaScript does not refer to the function where it appears. It refers to the object that is the execution context at the time the function is called. The distinction matters: a function can be defined in one context and called in another, and `this` tracks the call site, not the definition site — with one important exception: arrow functions.
  - There are four binding rules, applied in priority order: new binding (called with `new`), explicit binding (`call`, `apply`, `bind`), implicit binding (called as a method), and default binding (called as a plain function). Arrow functions are not subject to any of these rules; they lexically capture `this` from the enclosing scope at definition time and cannot be rebound.
  - The confusion around `this` arises from the mismatch between how developers intuitively expect `this` to work (lexically, like a variable) and how it actually works (dynamically, based on the call site). Class methods, event handlers, and callbacks each present scenarios where `this` is not what a reader might expect from the syntax. Understanding the rules removes the mystery and replaces guessing with analysis.

  **`## Principle`:**

  Engineers MUST use arrow functions for callbacks and event handlers that need to close over the enclosing `this`, rather than using `.bind(this)` at the call site or assigning `const self = this` to a variable. Arrow functions capture `this` lexically, making the intent explicit in the function definition rather than in a post-definition patch. The arrow function approach is consistent, readable, and produces no behavioral surprises on rebinding attempts — arrow functions cannot be rebound by `call`, `apply`, or `bind`.

  Engineers MUST NOT assume that a method extracted from an object retains its `this` binding. `const fn = obj.method; fn()` invokes `fn` without an implicit receiver; `this` inside `fn` resolves to `undefined` in strict mode and to the global object in non-strict mode. This is the source of the "lost context" class of bugs. Assigning methods to variables, passing them as callbacks, or storing them in arrays extracts them from their original receiver.

  **`## Design Thinking` subsections:**
  - `### The four binding rules` — new > explicit > implicit > default. Priority order with examples of each. How to determine which rule applies at any given call site.
  - `### Arrow functions and lexical this` — Arrow functions are not a syntactic shorthand for regular functions; they are a different kind of function with different `this` semantics. Cannot be used as constructors, have no `arguments` object, cannot be rebound.
  - `### Class fields and method binding` — `onClick = () => { ... }` vs. `onClick() { ... }`. Class field arrow functions bind `this` at instance creation time; prototype methods do not. The memory implication: one function per instance vs. one function on the prototype.
  - `### this in event handlers` — `addEventListener('click', this.handle)` loses context; `addEventListener('click', this.handle.bind(this))` and `addEventListener('click', (e) => this.handle(e))` preserve it. Which to prefer and why.
  - `### this in strict mode` — Default binding in strict mode is `undefined`, not the global object. Explains why strict-mode callback bugs throw `TypeError: Cannot read properties of undefined` rather than silently using global state.

  **`## Best Practices`:**

  **MUST use arrow functions for methods that are passed as callbacks or event handlers and require access to the enclosing class or function's `this`.** An arrow function defined as a class field (`handleClick = (e) => { ... }`) binds `this` to the instance at construction time and can be passed directly to `addEventListener` or as a prop without `.bind()`. This is the idiomatic React and class-based framework pattern.

  **MUST NOT use `.bind(this)` inside `render()` or inside JSX attributes in performance-critical components.** `.bind()` creates a new function object on every call. When used in JSX (`onClick={this.handleClick.bind(this)}`), a new function is created on every render, causing referential inequality on every render and defeating `React.memo` or `shouldComponentUpdate` optimizations. Define bound methods as class fields or use `useCallback` in function components.

  **SHOULD prefer explicit `call`, `apply`, or `bind` over implicit receiver patterns when invoking functions with a specific `this` value that is not the natural owner.** Explicit binding at the call site makes the intended receiver visible to readers. Implicit binding — where `this` is determined by the dot before the method name — is invisible to readers unfamiliar with the object structure.

  **`## Visual`:** Mermaid decision flowchart for determining `this` at runtime: Is it an arrow function? (lexical) → Was it called with `new`? → Was it called with `.call`/`.apply`/`.bind`? → Was it called as `obj.method()`? → Default binding.

  **`## Example`:** Code block contrasting all four patterns:
  ```js
  class Timer {
    constructor() { this.count = 0; }
    // Lost context — don't do this:
    startBroken() { setInterval(function() { this.count++; }, 1000); }
    // Arrow function — correct:
    start() { setInterval(() => { this.count++; }, 1000); }
    // bind — also correct but verbose:
    startBound() { setInterval(this.tick.bind(this), 1000); }
    tick() { this.count++; }
  }
  ```

  **`## Common Mistakes`:**
  - Passing `obj.method` as a callback without binding, losing context
  - Using `.bind(this)` inside render/JSX, creating new functions on every render
  - Expecting `call`/`apply` to rebind an arrow function (they don't)
  - Using arrow functions as prototype methods and wondering why all instances share the same function object (they don't — class field arrows create one per instance)

  **`## Related FEEs`:**
  - FEE-300 — JavaScript Core & Runtime Overview
  - FEE-302 — Closures & Scope Chain
  - FEE-303 — Prototypes & Inheritance

  **`## References`:**
  - MDN: this — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
  - Kyle Simpson: You Don't Know JS — this & Object Prototypes — https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/objects-classes/README.md
  - MDN: Function.prototype.bind — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 312
  title: this 綁定與情境邊界案例
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```
  **H1:** `` # `this` 綁定與情境邊界案例 ``

  Related FEE titles:
  - FEE-300 — JavaScript 核心與執行環境總覽
  - FEE-302 — 閉包與作用域鏈
  - FEE-303 — 原型與繼承

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/JavaScript Core and Runtime/312.md" "docs/zh-tw/JavaScript Core and Runtime/312.md"
  git commit -m "feat(fee-312): this binding & context edge cases — EN + zh-TW"
  ```

---

### Task 5: FEE-313 Structured Clone & `structuredClone()`

**Files:**
- Create: `docs/en/JavaScript Core and Runtime/313.md`
- Create: `docs/zh-tw/JavaScript Core and Runtime/313.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 313
  title: Structured Clone & structuredClone()
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```

  **H1:** `` # Structured Clone & `structuredClone()` ``

  **Opening (2–4 paragraphs covering):**
  - Copying objects in JavaScript is a study in trade-offs. Shallow copies (`Object.assign`, spread syntax) share nested references, so mutations to nested objects affect both the original and the copy. Deep copies via `JSON.parse(JSON.stringify(obj))` drop `undefined` values, dates become strings, functions and Symbols are lost, circular references throw, and special objects like `Map`, `Set`, `ArrayBuffer`, and `RegExp` are not faithfully reproduced. Neither approach is semantically correct for all objects.
  - `structuredClone()`, available in all major browsers since 2022 and in Node.js since 17.0.0, performs a deep clone using the Structured Clone algorithm — the same algorithm used by `postMessage`, `IndexedDB`, and the History API. It correctly clones `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer`, `TypedArray`, `Blob`, `Error`, and circular references. It does not clone functions, DOM nodes, or class instances with prototype methods.
  - The Structured Clone algorithm predates `structuredClone()` as a global function. It has always been accessible indirectly via `MessageChannel`, `History.pushState()`, and other browser APIs that serialize and deserialize their arguments. Understanding the algorithm — what it can and cannot clone — clarifies the behavior of all these APIs, not just `structuredClone()` itself.

  **`## Principle`:**

  Engineers SHOULD use `structuredClone()` as the default deep-clone function for data objects — plain objects, arrays, Maps, Sets, Dates, and similar value-type data. The JSON round-trip (`JSON.parse(JSON.stringify(obj))`) MUST NOT be used as a general-purpose deep clone: it silently drops `undefined` properties, converts `Date` objects to strings, and throws on circular references. These silent data losses are a source of subtle bugs that are difficult to diagnose because the call site produces no error.

  Engineers MUST NOT expect `structuredClone()` to clone class instances with prototype methods, functions, or DOM nodes. `structuredClone()` clones own enumerable properties and the supported types listed in the Structured Clone algorithm specification; it does not preserve prototype chains. A class instance cloned with `structuredClone()` becomes a plain object. Teams that need to clone class instances must implement explicit clone methods or use a serialization library.

  **`## Design Thinking` subsections:**
  - `### The Structured Clone algorithm` — What it supports: primitives, plain objects, arrays, Date, RegExp, Map, Set, ArrayBuffer, TypedArray, Blob, Error, and circular references. What it does not support: functions, DOM nodes, prototype chains, property descriptors, getters/setters.
  - `### `structuredClone()` vs. JSON round-trip` — Side-by-side comparison. JSON loses: `undefined`, functions, `Symbol`, `Date` → string, circular references throw. Structured Clone preserves all supported types faithfully.
  - `### Transfer lists` — `structuredClone(value, { transfer: [arrayBuffer] })` transfers ownership of `ArrayBuffer` to the clone, zeroing the original. This is the mechanism behind `postMessage` transfers. Useful for large binary data to avoid memory duplication.
  - `### MessageChannel as a pre-2022 polyfill` — Before `structuredClone()` was a global function, the pattern was `const { port1 } = new MessageChannel(); port1.postMessage(obj); port1.onmessage = e => cloned = e.data`. The global function replaces this workaround.

  **`## Best Practices`:**

  **SHOULD use `structuredClone()` for all deep-clone operations on plain data objects, replacing `JSON.parse(JSON.stringify(obj))`.** The JSON round-trip is a widely-used but semantically incorrect clone that silently corrupts `Date` values (converted to strings), `undefined` properties (dropped), and circular references (thrown). `structuredClone()` is correct by default for all types it supports, produces an error on unsupported types rather than silently corrupting data, and is available globally in all modern runtimes.

  **MUST use the `transfer` option when passing large `ArrayBuffer` or `TypedArray` data to a Web Worker via `postMessage`, rather than copying.** Transfer moves ownership of the buffer to the recipient context, zeroing the sender's view. This avoids duplicating potentially large binary data in memory. The buffer is unusable in the sending context after transfer, which is the intended behavior: once a Worker owns a buffer, the main thread should not read or write it.

  **MUST NOT rely on `structuredClone()` to clone class instances and preserve their methods.** Class instances lose their prototype chain in the clone; the result is a plain object. If a class instance must survive a clone operation with its methods intact, implement a `clone()` method, use the copy constructor pattern (`new MyClass(original.data)`), or use a serialization library that understands your class hierarchy.

  **`## Visual`:** Comparison table (rendered as Mermaid or Markdown table) showing: type → JSON round-trip result → structuredClone result. Rows: Date, undefined, circular ref, Map, Set, Function, Symbol, ArrayBuffer.

  **`## Example`:** Code block demonstrating `structuredClone()` with a complex object:
  ```js
  const original = {
    date: new Date('2025-01-01'),
    map: new Map([['key', 'value']]),
    nested: { arr: [1, 2, 3] }
  };
  original.self = original; // circular reference
  const clone = structuredClone(original);
  clone.nested.arr.push(4);
  console.log(original.nested.arr); // [1, 2, 3] — not affected
  console.log(clone.date instanceof Date); // true — Date preserved
  ```

  **`## Common Mistakes`:**
  - Using `JSON.parse(JSON.stringify(obj))` on objects that contain `Date` and not noticing the silent string conversion
  - Expecting `structuredClone()` to clone class instances with prototype methods
  - Cloning large `ArrayBuffer` data when transfer would avoid the copy

  **`## Related FEEs`:**
  - FEE-300 — JavaScript Core & Runtime Overview
  - FEE-405 — Web Workers & Concurrency (postMessage and transfer)
  - FEE-404 — Storage & State Persistence (IndexedDB uses the Structured Clone algorithm)

  **`## References`:**
  - MDN: structuredClone() — https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
  - MDN: Structured clone algorithm — https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
  - HTML Living Standard: Structured serialization — https://html.spec.whatwg.org/multipage/structured-data.html

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 313
  title: 結構化複製與 structuredClone()
  state: draft
  category: JavaScript Core and Runtime
  ---
  ```
  **H1:** `` # 結構化複製與 `structuredClone()` ``

  Related FEE titles:
  - FEE-300 — JavaScript 核心與執行環境總覽
  - FEE-405 — Web Workers 與並行處理
  - FEE-404 — 儲存與狀態持久化

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/JavaScript Core and Runtime/313.md" "docs/zh-tw/JavaScript Core and Runtime/313.md"
  git commit -m "feat(fee-313): structured clone & structuredClone() — EN + zh-TW"
  ```

---

### Task 6: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [308.Iterators, Generators & Async Iteration](308)`, add:
  ```
  - [309.WeakMap, WeakSet & Weak References](309)
  - [310.Symbols & Well-Known Symbols](310)
  - [311.Proxy & Reflect API](311)
  - [312.this Binding & Context Edge Cases](312)
  - [313.Structured Clone & structuredClone()](313)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [308.迭代器、產生器與非同步迭代](308)`, add:
  ```
  - [309.WeakMap、WeakSet 與弱引用](309)
  - [310.Symbol 與內建 Symbol](310)
  - [311.Proxy 與 Reflect API](311)
  - [312.this 綁定與情境邊界案例](312)
  - [313.結構化複製與 structuredClone()](313)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-309 through 313 to list files"
  ```
