# FEE Gap-Fill Batch D — Component Architecture & State Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 7 gap-fill articles — 4 for Component Architecture (FEE-510–513) and 3 for State Management (FEE-608–610) — in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW article following the Batch 12+ FEE template. Research the topic first, then write. Commit EN + zh-TW together per article.

**Tech Stack:** Markdown content authoring. Reference `docs/en/TypeScript/1706.md` as a format exemplar.

---

## File Map

**Files to create (EN):**
- `docs/en/Component Architecture and Design Patterns/510.md` — Compound Component Pattern
- `docs/en/Component Architecture and Design Patterns/511.md` — Provider Hierarchy & Context Composition
- `docs/en/Component Architecture and Design Patterns/512.md` — Component-Level Memoization
- `docs/en/Component Architecture and Design Patterns/513.md` — Testing Component Contracts
- `docs/en/State Management/608.md` — Optimistic Updates
- `docs/en/State Management/609.md` — Form State Management
- `docs/en/State Management/610.md` — Undo/Redo Patterns

**Files to create (zh-TW):** Mirror under `docs/zh-tw/`.

---

## Format Reference

Read `docs/en/TypeScript/1706.md` before writing. Key rules:
- `## Principle` → 1–2 paragraphs, RFC-2119 only
- `## Best Practices` → bold-prefix prose only, no code/`###`/bullets
- `## Visual` → one Mermaid diagram; `## Example` → one code block
- Target: 300+ lines per file

zh-TW headers: `## 原則` / `## 設計思維` / `## 最佳實踐` / `## 視覺呈現` / `## 範例` / `## 常見錯誤` / `## 相關 FEE` / `## 參考資料`

---

### Task 1: FEE-510 Compound Component Pattern

**Files:**
- Create: `docs/en/Component Architecture and Design Patterns/510.md`
- Create: `docs/zh-tw/Component Architecture and Design Patterns/510.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 510
  title: Compound Component Pattern
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```

  **H1:** `# Compound Component Pattern`

  **Opening (2–4 paragraphs covering):**
  - The compound component pattern structures a complex UI component as a set of cooperating sub-components that share implicit state through a context provider rather than through props passed at every level. A `<Tabs>` component that exposes `<Tabs.List>`, `<Tabs.Tab>`, and `<Tabs.Panel>` is a compound component: the parent `Tabs` manages which tab is active, and each child reads or modifies that state through context — without the consumer of the `Tabs` component needing to pass the active state explicitly to each sub-component.
  - The pattern is widely used in component libraries (Radix UI, Headless UI, React Aria, Reach UI) because it produces APIs that are flexible, composable, and explicit. The consumer controls the DOM structure and ordering of the sub-components; the parent compound component controls the shared behavior. This separation makes components easy to customize without forking.
  - The compound component pattern is a specific application of context — provider/consumer — where the provider is a component and the consumers are its designated sub-components. It is distinct from generic context providers that supply global state: a compound component context is scoped to a specific component tree and has no meaning outside it.

  **`## Principle`:**

  Engineers SHOULD use the compound component pattern for stateful UI components with multiple moving parts that users of the component need to control individually — tabs, accordions, select menus, dialogs, menus, and similar structures. The alternative — a single component that accepts all configuration as props — produces prop explosion and limits layout flexibility. The compound pattern gives consumers structural control while keeping behavioral state internal to the parent.

  Engineers MUST NOT use compound component context to share state between arbitrary components that are not in a known parent/child relationship. Compound component context is implementation state, not application state. Accessing a `<Tabs>` context from a component that is not a descendant of a `<Tabs>` is an error that indicates the context is being misused as a global store. Compound component contexts should throw a descriptive error when consumed outside their intended parent.

  **`## Design Thinking` subsections:**
  - `### Static vs. dynamic sub-components` — `Tabs.List = TabsList` pattern (sub-components as static properties of the parent). Why this co-locates related components in the import surface without requiring separate imports.
  - `### Flexible slot layout` — Compare: `<Tabs tabs={[...]} panels={[...]} />` (rigid) vs. `<Tabs><Tabs.List>...</Tabs.List><Tabs.Panel>...</Tabs.Panel></Tabs>` (flexible). The compound approach allows arbitrary DOM between sub-components.
  - `### Context guard pattern` — `useTabsContext()` that throws `new Error('useTabsContext must be used within <Tabs>')` if `context === undefined`. Prevents accidental misuse and produces actionable error messages.
  - `### Controlled vs. uncontrolled compound components` — A compound component can manage its own state (uncontrolled) or accept state via props (controlled). Providing both via the `value`/`defaultValue`/`onChange` convention.

  **`## Best Practices`:**

  **SHOULD expose sub-components as static properties of the parent component (`Tabs.List`, `Tabs.Panel`) rather than as separate named exports.** Co-locating sub-components as static properties makes the component family discoverable at import time, communicates that the sub-components belong together, and reduces the import surface consumers must manage. `import { Tabs } from './Tabs'` then `<Tabs.Panel>` is ergonomically superior to `import { Tabs, TabsPanel, TabsList } from './Tabs'`.

  **MUST include a context guard in the custom hook used to access compound component context.** The guard — `if (!context) throw new Error('...')` — transforms a confusing `undefined.someProperty` runtime error into an actionable error message that tells the developer what parent component they missed. This is more important in compound components than in global contexts because the constraint (must be a descendant) is not obvious to all consumers.

  **SHOULD provide both controlled and uncontrolled APIs for compound components that manage interactive state.** An accordion that only accepts an external `open` prop cannot be used without wiring up state management. An accordion with a `defaultOpen` prop can be used in simple cases without any state management. The `value`/`defaultValue`/`onChange` convention from HTML form inputs is the appropriate model.

  **`## Visual`:** Mermaid diagram showing the compound component tree: `<Tabs>` (holds state, provides context) → `<Tabs.List>` (reads context to know active tab) → `<Tabs.Tab>` (reads context, calls setter on click) and `<Tabs.Panel>` (reads context to determine visibility).

  **`## Example`:** Minimal compound Tabs implementation:
  ```jsx
  const TabsContext = React.createContext(null);
  function useTabs() {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error('useTabs must be used within <Tabs>');
    return ctx;
  }
  function Tabs({ defaultValue, children }) {
    const [active, setActive] = React.useState(defaultValue);
    return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
  }
  Tabs.Tab = function Tab({ value, children }) {
    const { active, setActive } = useTabs();
    return <button onClick={() => setActive(value)} aria-selected={active === value}>{children}</button>;
  };
  Tabs.Panel = function Panel({ value, children }) {
    const { active } = useTabs();
    return active === value ? <div>{children}</div> : null;
  };
  ```

  **`## Related FEEs`:**
  - FEE-500 — Component Architecture & Design Patterns Overview
  - FEE-501 — Component Composition Patterns
  - FEE-511 — Provider Hierarchy & Context Composition
  - FEE-603 — Context & Prop Drilling

  **`## References`:**
  - Kent C. Dodds: Compound Components Pattern — https://kentcdodds.com/blog/compound-components-with-react-hooks
  - Radix UI: Compound component examples — https://www.radix-ui.com/primitives/docs/overview/introduction
  - React docs: Context — https://react.dev/reference/react/createContext

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 510
  title: 複合元件模式
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```
  **H1:** `# 複合元件模式`

  Related FEE titles:
  - FEE-500 — 元件架構與設計模式總覽
  - FEE-501 — 元件組合模式
  - FEE-511 — Provider 層級與 Context 組合
  - FEE-603 — Context 與 Prop Drilling

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Component Architecture and Design Patterns/510.md" "docs/zh-tw/Component Architecture and Design Patterns/510.md"
  git commit -m "feat(fee-510): compound component pattern — EN + zh-TW"
  ```

---

### Task 2: FEE-511 Provider Hierarchy & Context Composition

**Files:**
- Create: `docs/en/Component Architecture and Design Patterns/511.md`
- Create: `docs/zh-tw/Component Architecture and Design Patterns/511.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 511
  title: Provider Hierarchy & Context Composition
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```

  **H1:** `# Provider Hierarchy & Context Composition`

  **Opening (2–4 paragraphs covering):**
  - React Context solves prop drilling by making state available to any descendant without threading it through every intermediate component. In practice, applications use many contexts: theme, auth, locale, feature flags, router, and numerous domain-specific contexts. The question is not whether to use context but how to organize multiple contexts, how to prevent unnecessary re-renders from context value changes, and how to compose contexts in a maintainable way.
  - Provider nesting — stacking `<ThemeProvider>`, `<AuthProvider>`, `<I18nProvider>` at the application root — is the universal pattern. The challenge is that every context value change re-renders every consumer in the tree. When a theme context value is a large object that is re-created on every render, all consumers re-render on every parent render, not just when the theme actually changes.
  - The key insight for performant context usage is that context re-renders consumers when the context value changes by reference. Memoizing the value object (`useMemo`) or splitting a large context into focused contexts (one for the value, one for the dispatch function) controls re-render scope. Understanding this allows teams to use context without the performance problems that make many developers reach for external state libraries unnecessarily.

  **`## Principle`:**

  Engineers SHOULD split context into separate providers when the context value has parts that change at different frequencies. An auth context that includes both the `user` object (changes on login/logout) and the `login`/`logout` functions (stable references) causes all consumers to re-render on login/logout even if they only use the stable functions. Splitting into `AuthUserContext` and `AuthActionsContext` allows consumers to subscribe only to the part they use.

  Engineers MUST memoize context values that are object or array literals to prevent consumers from re-rendering on every render of the provider component. <code v-pre>&lt;Context.Provider value={{ user, setUser }}&gt;</code> creates a new object on every render of the component that contains this JSX. Every consumer re-renders whenever this provider renders, regardless of whether `user` or `setUser` changed. `useMemo(() => ({ user, setUser }), [user, setUser])` limits re-renders to when the actual values change.

  **`## Design Thinking` subsections:**
  - `### Context selector pattern` — The lack of built-in context selectors in React and the workarounds: `use-context-selector`, splitting context, or using Zustand/Jotai which have selectors built in. When splitting is sufficient and when a selector library is warranted.
  - `### Composing multiple providers` — The `combineProviders` / `ComposeProviders` pattern for flattening deeply nested provider trees at the app root. Trade-offs: readability vs. abstraction cost.
  - `### React 19 `use()` hook` — `use(Context)` can be called conditionally or inside loops (unlike `useContext`). How this changes consumption patterns. Not a replacement for `useContext` in most cases but enables new patterns in conditional rendering.
  - `### Provider placement strategy` — App-root providers (theme, auth, i18n) vs. subtree providers (compound components, feature-level context). Placing providers at the lowest possible scope reduces unnecessary subscription surface.

  **`## Best Practices`:**

  **MUST memoize object and array context values with `useMemo` to prevent spurious re-renders of all context consumers.** A context value that is a new object reference on every render causes every consumer to re-render on every provider render, even when the data has not changed. This is the single most common cause of context-induced performance issues. The rule is simple: if the value passed to `Context.Provider` is an object literal, wrap it in `useMemo`.

  **SHOULD split large contexts into smaller, focused contexts that change independently.** A monolithic `AppContext` that includes theme, user, cart, and UI state causes all consumers to re-render when any part changes. Splitting into `ThemeContext`, `UserContext`, `CartContext`, and `UIContext` allows each consumer to subscribe only to the slice it needs. The overhead of multiple context providers is negligible compared to the re-render savings.

  **SHOULD place context providers at the lowest component in the tree that contains all consumers, not automatically at the application root.** A `DialogContext` that manages a single dialog's open/close state belongs at the feature level, not the app root. Pushing providers down limits the re-render surface and makes the context's scope explicit from the component tree structure.

  **`## Visual`:** Mermaid diagram showing a provider tree: app root → ThemeProvider → AuthProvider → RouterProvider → feature component. Show which components re-render when AuthContext changes (only auth consumers) vs. when ThemeContext changes (only theme consumers), given proper splitting.

  **`## Example`:** Auth context split into value and actions:
  ```jsx
  const AuthUserCtx = React.createContext(null);
  const AuthActionsCtx = React.createContext(null);
  function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const actions = React.useMemo(() => ({
      login: async (creds) => { const u = await api.login(creds); setUser(u); },
      logout: () => { api.logout(); setUser(null); },
    }), []); // stable — never re-created
    return (
      <AuthUserCtx.Provider value={user}>
        <AuthActionsCtx.Provider value={actions}>{children}</AuthActionsCtx.Provider>
      </AuthUserCtx.Provider>
    );
  }
  ```

  **`## Related FEEs`:**
  - FEE-500 — Component Architecture & Design Patterns Overview
  - FEE-510 — Compound Component Pattern
  - FEE-512 — Component-Level Memoization
  - FEE-603 — Context & Prop Drilling

  **`## References`:**
  - React docs: Passing Data Deeply with Context — https://react.dev/learn/passing-data-deeply-with-context
  - React docs: Scaling Up with Reducer and Context — https://react.dev/learn/scaling-up-with-reducer-and-context
  - use-context-selector — https://github.com/dai-shi/use-context-selector

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 511
  title: Provider 層級與 Context 組合
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```
  **H1:** `# Provider 層級與 Context 組合`

  Related FEE titles:
  - FEE-500 — 元件架構與設計模式總覽
  - FEE-510 — 複合元件模式
  - FEE-512 — 元件層級的記憶化
  - FEE-603 — Context 與 Prop Drilling

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Component Architecture and Design Patterns/511.md" "docs/zh-tw/Component Architecture and Design Patterns/511.md"
  git commit -m "feat(fee-511): provider hierarchy & context composition — EN + zh-TW"
  ```

---

### Task 3: FEE-512 Component-Level Memoization

**Files:**
- Create: `docs/en/Component Architecture and Design Patterns/512.md`
- Create: `docs/zh-tw/Component Architecture and Design Patterns/512.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 512
  title: Component-Level Memoization
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```

  **H1:** `# Component-Level Memoization`

  **Opening (2–4 paragraphs covering):**
  - React's rendering model re-renders a component when its parent renders, when its own state changes, or when context it consumes changes. For most components, this is correct and fast. For components that are expensive to render — large lists, complex canvas operations, heavy computations — unnecessary re-renders accumulate into perceptible latency. Memoization APIs (`React.memo`, `useMemo`, `useCallback`) allow components and values to skip recalculation when their inputs have not changed.
  - The React team's guidance is to apply memoization after profiling, not preemptively. Memoization has a cost: the comparison of previous and current props/dependencies on every render. For cheap components, the comparison cost exceeds the render cost it avoids. Blanket application of `React.memo` to every component is not optimization — it is noise that makes code harder to read and may even make performance worse in aggregate.
  - The correct mental model for memoization is breaking the re-render chain: `React.memo` prevents a component from re-rendering when its parent re-renders and the props have not changed; `useMemo` prevents a value from being recomputed when the component re-renders and the dependencies have not changed; `useCallback` prevents a function from being re-created when the component re-renders and the dependencies have not changed. All three work by referential stability — they only help when the consumer cares about reference equality.

  **`## Principle`:**

  Engineers SHOULD apply `React.memo`, `useMemo`, and `useCallback` only after measuring a real performance problem with the React DevTools Profiler. Premature memoization obscures code intent, makes refactoring harder, and can create subtle bugs when dependency arrays are incorrectly specified. The cost of a re-render is almost always lower than the cognitive cost of reasoning about memoization correctness.

  Engineers MUST specify complete and accurate dependency arrays for `useMemo` and `useCallback`. An incomplete dependency array — omitting a value that the memoized function reads — produces stale closures: the function runs with values from a past render, producing incorrect output that does not update when the missing dependency changes. The `eslint-plugin-react-hooks` `exhaustive-deps` rule detects incomplete dependency arrays; it MUST be enabled.

  **`## Design Thinking` subsections:**
  - `### When React.memo actually helps` — Only when the parent re-renders frequently AND the child's props are stable AND the child render is expensive. The three conditions must all be true. In most component trees, at least one is false.
  - `### useMemo for expensive computations` — Filtering/sorting a large list, building a lookup map, running a layout calculation. The value must actually be expensive to compute; most array operations on lists under 1000 items are not.
  - `### useCallback and referential stability` — `useCallback` is for functions passed as props to `React.memo`-wrapped children or as dependencies to other hooks. Without `useCallback`, a new function reference on each parent render causes the memoized child to re-render anyway.
  - `### React Compiler (auto-memoization)` — React 19+ includes a compiler that automatically applies memoization. In projects using the React Compiler, manual `useMemo`/`useCallback` becomes less necessary. Understand the compiler's opt-in/out semantics.

  **`## Best Practices`:**

  **MUST enable the `react-hooks/exhaustive-deps` ESLint rule and treat all its warnings as errors.** An incomplete dependency array in `useMemo` or `useCallback` produces a stale closure that reads outdated values from a previous render. This is the most common source of subtle, hard-to-reproduce bugs introduced by memoization. The linting rule detects the problem statically before it reaches production.

  **SHOULD measure render performance with the React DevTools Profiler before applying `React.memo`, `useMemo`, or `useCallback`.** Memoization that is not grounded in a measured problem adds complexity without verified benefit. The Profiler shows which components re-render on each interaction and how long each render takes; this is the data that justifies a memoization decision.

  **MUST NOT use `useCallback` to memoize functions that are not passed to `React.memo`-wrapped components or listed as dependencies of other hooks.** A `useCallback` on a function used only in the current component's own event handlers provides no benefit; the component re-renders whether the function reference is stable or not. `useCallback` is a cost with no payoff in this scenario.

  **`## Visual`:** Mermaid diagram showing re-render propagation: parent re-renders → child without `React.memo` re-renders → grandchild re-renders. Show the same tree with `React.memo` on child: parent re-renders → memo comparison (props unchanged?) → child skips render → grandchild skips render.

  **`## Example`:** `React.memo` with `useCallback` ensuring stable prop reference:
  ```jsx
  const ExpensiveList = React.memo(function ExpensiveList({ items, onSelect }) {
    return <ul>{items.map(item => <li key={item.id} onClick={() => onSelect(item)}>{item.name}</li>)}</ul>;
  });
  function Parent({ items }) {
    const [selected, setSelected] = React.useState(null);
    const handleSelect = React.useCallback((item) => { setSelected(item); }, []);
    return <ExpensiveList items={items} onSelect={handleSelect} />;
  }
  ```

  **`## Common Mistakes`:**
  - Adding `React.memo` to every component "just in case"
  - Omitting dependencies from `useMemo`/`useCallback` to silence a lint warning, creating stale closures
  - Using `useCallback` on functions not passed to memoized children
  - Not measuring before memoizing

  **`## Related FEEs`:**
  - FEE-500 — Component Architecture & Design Patterns Overview
  - FEE-511 — Provider Hierarchy & Context Composition
  - FEE-601 — Local Component State
  - FEE-702 — Virtual DOM, Reconciliation & Diffing

  **`## References`:**
  - React docs: useMemo — https://react.dev/reference/react/useMemo
  - React docs: useCallback — https://react.dev/reference/react/useCallback
  - React docs: memo — https://react.dev/reference/react/memo
  - React DevTools Profiler — https://react.dev/learn/react-developer-tools

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 512
  title: 元件層級的記憶化
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```
  **H1:** `# 元件層級的記憶化`

  Related FEE titles:
  - FEE-500 — 元件架構與設計模式總覽
  - FEE-511 — Provider 層級與 Context 組合
  - FEE-601 — 本地元件狀態
  - FEE-702 — 虛擬 DOM、協調與差異比較

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Component Architecture and Design Patterns/512.md" "docs/zh-tw/Component Architecture and Design Patterns/512.md"
  git commit -m "feat(fee-512): component-level memoization — EN + zh-TW"
  ```

---

### Task 4: FEE-513 Testing Component Contracts

**Files:**
- Create: `docs/en/Component Architecture and Design Patterns/513.md`
- Create: `docs/zh-tw/Component Architecture and Design Patterns/513.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 513
  title: Testing Component Contracts
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```

  **H1:** `# Testing Component Contracts`

  **Opening (2–4 paragraphs covering):**
  - A component's contract is its public API: the props it accepts, the events it emits, the slots it renders, and the accessibility attributes it maintains. Tests that verify the contract give consumers confidence that the component behaves correctly without specifying how it achieves that behavior internally. Tests that verify the implementation — which internal function was called, what internal state was set — must be updated whenever the implementation changes, even when the observable behavior does not change.
  - The Testing Library family of tools (React Testing Library, Vue Testing Library, etc.) was designed around this distinction. Its guiding principle — "the more your tests resemble the way your software is used, the more confidence they can give you" — is a restatement of testing the contract, not the implementation. Querying by `role` and `label` rather than by CSS class or component name is how that principle is operationalized.
  - Component contracts become especially important in design systems and shared component libraries. A button component that changes its internal DOM structure for accessibility improvements should not require updates to every test that queried for the old structure. Tests written against the contract — the button is rendered with `role="button"`, pressing Enter triggers `onClick` — survive implementation refactors.

  **`## Principle`:**

  Engineers MUST write component tests that query and assert against the visible, accessible DOM using semantic queries (`getByRole`, `getByLabelText`, `getByText`) rather than implementation-detail queries (`getByTestId`, `container.querySelector`). Semantic queries mirror how users and assistive technologies perceive the component. Tests that rely on `data-testid` attributes or internal class names are brittle to refactors and provide no signal about whether the component is accessible.

  Engineers MUST NOT mock child components in component tests unless the child is from an external package and its behavior cannot be controlled in the test environment. Mocking child components breaks integration — the test no longer exercises the actual rendered output — and produces false confidence when the real interaction between parent and child is incorrect. Test the component as it renders in real use, including its children.

  **`## Design Thinking` subsections:**
  - `### Contract vs. implementation testing` — Side-by-side comparison: a test that asserts `component.state.isOpen === true` (implementation) vs. a test that asserts `getByRole('dialog')` is visible (contract). Which breaks on refactor, which provides confidence.
  - `### Query priority: semantic first` — `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue` > `getByAltText` > `getByTitle` > `getByTestId`. The hierarchy reflects increasing implementation-coupling.
  - `### User event vs. fireEvent` — `@testing-library/user-event` simulates realistic user interactions (keyboard events, focus, pointer events) rather than single synthetic events. Prefer `userEvent.click()` over `fireEvent.click()`.
  - `### Storybook play functions as contract tests` — `play: async ({ canvasElement }) => { await userEvent.click(canvas.getByRole('button')); await expect(canvas.getByRole('dialog')).toBeVisible(); }` — browser-running interaction tests co-located with stories.

  **`## Best Practices`:**

  **MUST use `getByRole` as the primary query in component tests.** Roles correspond to semantic HTML and ARIA roles that users and screen readers interact with. A test that queries `getByRole('button', { name: 'Submit' })` will fail if the rendered element lacks the correct role or accessible name — which is exactly the failure mode that matters. A test that queries `document.querySelector('.submit-btn')` will pass even if the button is not keyboard accessible.

  **MUST test interactive components by simulating user interactions, not by calling component methods or setting internal state directly.** If a dialog opens when a button is clicked, test it by clicking the button: `await userEvent.click(getByRole('button', { name: 'Open' }))`. Do not call `component.open()` or `setState({ isOpen: true })`. The user cannot call internal methods; the test should not be able to either.

  **SHOULD include keyboard interaction tests for all interactive components.** A dropdown that opens on click but not on Enter fails keyboard users. A test that presses Tab to focus the trigger and Enter to open covers this case. Keyboard interaction tests are the most effective way to catch accessibility contract violations before they reach production.

  **`## Visual`:** Mermaid diagram showing test layers for a component: unit test (renders correctly with props) → interaction test (user actions produce expected outputs) → accessibility test (roles, labels, focus management). Contrast with implementation tests that test internals.

  **`## Example`:** Testing a dialog component by contract:
  ```jsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { Dialog } from './Dialog';
  test('opens dialog on trigger click and closes on Escape', async () => {
    render(<Dialog trigger={<button>Open</button>} title="Confirm"><p>Content</p></Dialog>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Confirm' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  ```

  **`## Related FEEs`:**
  - FEE-500 — Component Architecture & Design Patterns Overview
  - FEE-1100 — Testing Strategies Overview
  - FEE-1102 — Component Testing with Testing Library
  - FEE-1001 — ARIA & Semantic HTML

  **`## References`:**
  - Testing Library: Guiding Principles — https://testing-library.com/docs/guiding-principles
  - Testing Library: Query priority — https://testing-library.com/docs/queries/about#priority
  - Kent C. Dodds: Testing Implementation Details — https://kentcdodds.com/blog/testing-implementation-details

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 513
  title: 測試元件契約
  state: draft
  category: Component Architecture and Design Patterns
  ---
  ```
  **H1:** `# 測試元件契約`

  Related FEE titles:
  - FEE-500 — 元件架構與設計模式總覽
  - FEE-1100 — 測試策略總覽
  - FEE-1102 — 使用 Testing Library 進行元件測試
  - FEE-1001 — ARIA 與語義化 HTML

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Component Architecture and Design Patterns/513.md" "docs/zh-tw/Component Architecture and Design Patterns/513.md"
  git commit -m "feat(fee-513): testing component contracts — EN + zh-TW"
  ```

---

### Task 5: FEE-608 Optimistic Updates

**Files:**
- Create: `docs/en/State Management/608.md`
- Create: `docs/zh-tw/State Management/608.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 608
  title: Optimistic Updates
  state: draft
  category: State Management
  ---
  ```

  **H1:** `# Optimistic Updates`

  **Opening (2–4 paragraphs covering):**
  - An optimistic update applies a mutation to the local state immediately, before the server confirms the change. The UI reflects the expected result of the mutation — the like count increments, the item is removed from the list, the comment appears — while the network request is in flight. If the server confirms the mutation, the optimistic state becomes canonical. If the request fails, the local state is rolled back to the pre-mutation value.
  - The tradeoff is explicit: optimistic updates make the UI feel faster and more responsive, especially on high-latency connections, but they introduce the possibility of transient inconsistency between local and server state. The rollback path — what happens when the server rejects the mutation — must be designed, communicated to users (a toast notification, an error message), and tested.
  - TanStack Query, SWR, and Apollo Client each provide first-class optimistic update APIs. The pattern in all of them is the same: (1) apply the optimistic state before the mutation, (2) execute the mutation, (3) on success — the server may return the canonical value, which replaces the optimistic state; on error — roll back the optimistic state and display an error.

  **`## Principle`:**

  Engineers SHOULD apply optimistic updates to mutations that are idempotent or easily reversible and whose failure rate is low. Liking a post, reordering a list, updating a setting, or archiving an item are canonical candidates: the mutation has a predictable outcome, rollback is a straightforward state restoration, and failures are rare. Mutations with unpredictable outcomes — payments, inventory reservations, file uploads — SHOULD NOT be optimistically updated because the rollback path is confusing and the failure rate is higher.

  Engineers MUST implement rollback logic for every optimistic update and display a visible error notification when rollback occurs. A silent rollback — where the UI snaps back to the previous state without explanation — appears as a bug to users. The rollback notification must explain what happened ("Failed to archive item — changes reverted") and offer recovery options where applicable.

  **`## Design Thinking` subsections:**
  - `### Optimistic vs. loading states` — Loading state: show spinner, disable inputs, wait for server. Optimistic state: apply change, continue interaction, handle rollback. When each is appropriate.
  - `### TanStack Query onMutate/onError/onSettled` — `onMutate`: snapshot current data, apply optimistic update. `onError`: roll back using snapshot. `onSettled`: always refetch to ensure consistency. The three-phase pattern.
  - `### Conflict resolution` — Two users editing the same resource, optimistic updates for both. The server's response after mutation contains the canonical state; always replace the optimistic state with the server response on success.
  - `### Unique IDs for new items` — Optimistically adding an item to a list requires a temporary ID before the server responds. Use `crypto.randomUUID()` or a nanoid for the optimistic item, replace with the server-assigned ID on success.

  **`## Best Practices`:**

  **MUST snapshot the current state before applying an optimistic update to enable rollback on failure.** In TanStack Query, this means using `queryClient.getQueryData()` in `onMutate` and storing the snapshot, then calling `queryClient.setQueryData()` with the snapshot in `onError`. Without the snapshot, rollback requires a refetch — which is slower and exposes the inconsistent state to the user for longer.

  **MUST display a user-visible error notification when an optimistic update is rolled back.** A state that snaps back without explanation appears as a bug. The error notification should be specific ("Unable to like this post — please try again") and should appear immediately when the rollback occurs.

  **SHOULD refetch the affected queries after any mutation resolves, regardless of success or failure.** Optimistic state is an estimate; the server's response is the canonical value. Even on success, the server may return a slightly different value than the optimistic assumption (a server-assigned timestamp, a computed field). Using `onSettled` to invalidate and refetch ensures the displayed state converges to the server's truth.

  **`## Visual`:** Mermaid sequence diagram: user action → optimistic state applied → mutation request sent → success path (server confirms, optionally replace with server value) vs. error path (rollback state, show error notification).

  **`## Example`:** TanStack Query optimistic update for a like button:
  ```js
  const mutation = useMutation({
    mutationFn: (postId) => api.likePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);
      queryClient.setQueryData(['post', postId], old => ({ ...old, likes: old.likes + 1 }));
      return { previous };
    },
    onError: (_err, postId, context) => {
      queryClient.setQueryData(['post', postId], context.previous);
      toast.error('Failed to like post');
    },
    onSettled: (_data, _err, postId) => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
  ```

  **`## Related FEEs`:**
  - FEE-600 — State Management Overview
  - FEE-604 — Server State & Data Synchronization
  - FEE-305 — Error Handling Patterns

  **`## References`:**
  - TanStack Query: Optimistic Updates — https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  - SWR: Optimistic Updates — https://swr.vercel.app/docs/mutation#optimistic-updates

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 608
  title: 樂觀更新
  state: draft
  category: State Management
  ---
  ```
  **H1:** `# 樂觀更新`

  Related FEE titles:
  - FEE-600 — 狀態管理總覽
  - FEE-604 — 伺服器狀態與資料同步
  - FEE-305 — 錯誤處理模式

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/State\ Management/608.md docs/zh-tw/State\ Management/608.md
  git commit -m "feat(fee-608): optimistic updates — EN + zh-TW"
  ```

---

### Task 6: FEE-609 Form State Management

**Files:**
- Create: `docs/en/State Management/609.md`
- Create: `docs/zh-tw/State Management/609.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 609
  title: Form State Management
  state: draft
  category: State Management
  ---
  ```

  **H1:** `# Form State Management`

  **Opening (2–4 paragraphs covering):**
  - Forms represent a distinct category of UI state. Unlike server data or application routing state, form state is inherently local, transient, and structured: a form has fields with values, each field has touched/untouched status, the form has valid/invalid status, and submission triggers an async side effect. Managing this state with generic `useState` is possible but verbose; specialized form libraries exist because the patterns required — field registration, validation, dirty tracking, submission state — recur identically across every form.
  - React Hook Form, Formik, and TanStack Form are the dominant libraries. React Hook Form uses uncontrolled inputs (ref-based) to avoid re-renders on every keystroke; Formik uses controlled inputs with a context provider; TanStack Form is framework-agnostic with a more explicit API. The performance difference between the approaches is measurable on large forms with many fields.
  - The decision to use a form library is not primarily about state complexity — `useState` for two fields is not burdensome — but about validation, submission handling, and error display. A form without a library requires manual orchestration of validation logic, async submission state, error message display, and field-level touched tracking. A library provides a consistent, tested API for all of this.

  **`## Principle`:**

  Engineers SHOULD use a form library for any form with three or more fields, validation requirements, or async submission. The threshold is not about the number of state variables but about the validation and submission lifecycle. A form with required fields, format validation, server-side errors, and loading states during submission has enough lifecycle complexity to benefit from a library's tested, consistent handling of each phase.

  Engineers MUST validate on both client and server and MUST NOT rely solely on client-side form validation for security-relevant input. Client-side validation provides immediate feedback to honest users; it does not prevent malicious submissions. API endpoints that accept form submissions must validate the same rules independently.

  **`## Design Thinking` subsections:**
  - `### Controlled vs. uncontrolled inputs in forms` — Controlled: React owns the value via state, re-renders on each keystroke. Uncontrolled: DOM owns the value via ref, no re-render on keystroke. React Hook Form's uncontrolled approach scales better to large forms.
  - `### Validation strategies` — `onChange`, `onBlur`, `onSubmit` — when each fires. Schema-based validation (`zod`, `yup`, `valibot`) vs. per-field rule objects. Integration with React Hook Form: `resolver` option.
  - `### Field state: touched, dirty, error` — Why tracking `touched` matters: an empty required field should not show an error before the user has interacted with it. `touched` (has the user visited this field) and `dirty` (has the user changed the value) are distinct states.
  - `### Server-side errors` — Populating form field errors from API responses. In React Hook Form: `setError('fieldName', { type: 'server', message: '...' })`. The form library should not be bypassed to display API error messages.

  **`## Best Practices`:**

  **SHOULD use `zod` or a comparable schema library as the validation resolver for form libraries.** Schema-based validation defines all validation rules in one place, produces consistent error messages, and can be reused for API-side validation. Defining validation rules as schema enables sharing the same schema between the React Hook Form resolver and the backend route handler, eliminating duplication.

  **MUST display field-level validation errors only after the user has interacted with the field (touched) or attempted to submit.** Showing "This field is required" on a fresh, untouched form confuses users who have not yet had a chance to fill it out. The correct pattern is to surface errors on blur (when the user leaves a field) or on submit (when the user submits and has not filled in required fields). Most form libraries implement this with `mode: 'onBlur'` or `mode: 'onTouched'`.

  **SHOULD disable the submit button while a form submission is in progress and re-enable it after the submission resolves.** Double-submission — sending the same form data twice — is a common source of duplicate records. Disabling the button during submission prevents this. The loading state also provides feedback that the submission is being processed.

  **`## Visual`:** Mermaid state machine showing form lifecycle: idle → dirty (user edits) → validating → valid/invalid → submitting → success/error. Show which transitions each form library event handler fires.

  **`## Example`:** React Hook Form with Zod resolver:
  ```jsx
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';
  const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
  function LoginForm({ onSubmit }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <span role="alert">{errors.email.message}</span>}
        <input type="password" {...register('password')} />
        {errors.password && <span role="alert">{errors.password.message}</span>}
        <button type="submit" disabled={isSubmitting}>Login</button>
      </form>
    );
  }
  ```

  **`## Related FEEs`:**
  - FEE-600 — State Management Overview
  - FEE-103 — Forms & Validation
  - FEE-601 — Local Component State
  - FEE-1708 — Runtime Validation & Schema Libraries

  **`## References`:**
  - React Hook Form — https://react-hook-form.com
  - TanStack Form — https://tanstack.com/form/latest
  - @hookform/resolvers (Zod) — https://github.com/react-hook-form/resolvers

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 609
  title: 表單狀態管理
  state: draft
  category: State Management
  ---
  ```
  **H1:** `# 表單狀態管理`

  Related FEE titles:
  - FEE-600 — 狀態管理總覽
  - FEE-103 — 表單與驗證
  - FEE-601 — 本地元件狀態
  - FEE-1708 — 執行時期驗證與結構描述函式庫

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/State\ Management/609.md docs/zh-tw/State\ Management/609.md
  git commit -m "feat(fee-609): form state management — EN + zh-TW"
  ```

---

### Task 7: FEE-610 Undo/Redo Patterns

**Files:**
- Create: `docs/en/State Management/610.md`
- Create: `docs/zh-tw/State Management/610.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 610
  title: Undo/Redo Patterns
  state: draft
  category: State Management
  ---
  ```

  **H1:** `# Undo/Redo Patterns`

  **Opening (2–4 paragraphs covering):**
  - Undo and redo are expected features in any application where users make a series of edits: text editors, drawing tools, form builders, data grids. The underlying mechanism is a history stack: each user action is recorded as a reversible operation, and undo/redo move a cursor through that stack. The challenge is deciding what to record — the full state at each point (snapshot model) or the delta between states (command model) — and how to limit history size.
  - The snapshot model stores a copy of the complete state before each action. Undo restores the previous snapshot; redo restores the next. Snapshots are simple to implement and easy to reason about, but memory usage scales with state size times history depth. For small state trees, this is negligible; for large documents or canvases, snapshot storage is prohibitive.
  - The command model stores a description of the action — `{ type: 'MOVE', id: '1', from: {x:0,y:0}, to: {x:10,y:0} }` — with both a `do` and `undo` implementation. Undo calls the `undo` function; redo calls the `do` function again. The command model is more complex to implement but uses constant memory per command regardless of state size.

  **`## Principle`:**

  Engineers SHOULD use the snapshot model for undo/redo when the application state is small (under a few kilobytes per snapshot) and immutable state management is already in use. Immutable state managed by Immer or a Redux-style reducer produces structural sharing: consecutive snapshots share unchanged subtrees, so memory usage is much lower than it appears. `immer`'s `produceWithPatches` function generates both the next state and the patches required to invert the change — the best of both models.

  Engineers MUST limit the undo history to a bounded depth — typically 50–200 steps — to prevent unbounded memory growth in long editing sessions. A history with no depth limit will consume memory proportional to session length. The typical user expectation for undo depth in productivity software is 20–100 steps; providing more than 200 steps has diminishing returns and growing memory cost.

  **`## Design Thinking` subsections:**
  - `### History stack data structure` — Past stack, future stack. Undo: pop from past, push to future, restore past.top. Redo: pop from future, push to past, restore future.top.
  - `### Immer produceWithPatches` — `produceWithPatches(state, recipe)` returns `[nextState, patches, inversePatches]`. Store the inverse patches; undo applies them. This gives the efficiency of the command model with the simplicity of Immer's mutable-style API.
  - `### What to make undoable` — Not every state change should be in the undo history. Navigation, cursor position, and UI-only state (panel open/closed) are typically not undoable. The undo history tracks document/data changes, not UI state.
  - `### Collaborative editing and conflict` — Undo in collaborative documents (e.g., Google Docs) must account for concurrent edits by other users. This is a much harder problem (OT or CRDT) that is out of scope for single-user undo — but worth noting to set expectations.

  **`## Best Practices`:**

  **MUST cap the undo history stack at a configurable maximum depth and evict the oldest entry when the cap is reached.** Without a cap, a document editor with thousands of edits accumulates thousands of snapshots or commands in memory. The cap should be configurable per application type: 20 steps may be sufficient for a settings form; 200 steps is appropriate for a document or canvas editor.

  **SHOULD use `immer`'s `produceWithPatches` to implement undo/redo when the application already uses Immer for state management.** `produceWithPatches` generates inverse patches automatically; storing inverse patches instead of full snapshots reduces memory usage to the size of the change, not the size of the full state. This is the efficient, low-code path to undo/redo for Immer-based state.

  **SHOULD merge consecutive rapid edits (e.g., individual keystrokes) into a single undo step using debouncing or explicit batch grouping.** Pressing Ctrl+Z while typing should undo the last word or sentence, not the last character. Batch grouping — collecting edits within a time window into one history entry — matches user expectation and keeps the history stack manageable.

  **`## Visual`:** Mermaid diagram of the undo/redo history stack: past = [state0, state1, state2(current)] / future = [state3, state4]. Arrow showing undo moving current to state1, state2 going to future. Arrow showing redo moving current back to state2.

  **`## Example`:** Snapshot-based undo/redo with bounded history using a reducer:
  ```js
  const MAX_HISTORY = 100;
  function withHistory(reducer) {
    return function historyReducer(state = { past: [], present: reducer(undefined, {}), future: [] }, action) {
      if (action.type === 'UNDO') {
        if (!state.past.length) return state;
        const [previous, ...past] = [...state.past].reverse();
        return { past: past.reverse(), present: previous, future: [state.present, ...state.future] };
      }
      if (action.type === 'REDO') {
        if (!state.future.length) return state;
        const [next, ...future] = state.future;
        return { past: [...state.past, state.present].slice(-MAX_HISTORY), present: next, future };
      }
      const present = reducer(state.present, action);
      if (present === state.present) return state;
      return { past: [...state.past, state.present].slice(-MAX_HISTORY), present, future: [] };
    };
  }
  ```

  **`## Related FEEs`:**
  - FEE-600 — State Management Overview
  - FEE-601 — Local Component State
  - FEE-605 — State Machines & Finite Automata

  **`## References`:**
  - Immer: produceWithPatches — https://immerjs.github.io/immer/patches
  - Redux docs: Implementing Undo History — https://redux.js.org/usage/implementing-undo-history
  - Zundo (undo/redo for Zustand) — https://github.com/charkour/zundo

- [ ] **Step 2: Verify EN format** — 300+ lines, Best Practices prose-only

- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:**
  ```
  ---
  id: 610
  title: 復原與重做模式
  state: draft
  category: State Management
  ---
  ```
  **H1:** `# 復原與重做模式`

  Related FEE titles:
  - FEE-600 — 狀態管理總覽
  - FEE-601 — 本地元件狀態
  - FEE-605 — 狀態機與有限自動機

- [ ] **Step 4: Verify zh-TW format** — all headers zh-TW, 300+ lines

- [ ] **Step 5: Commit**
  ```bash
  git add docs/en/State\ Management/610.md docs/zh-tw/State\ Management/610.md
  git commit -m "feat(fee-610): undo/redo patterns — EN + zh-TW"
  ```

---

### Task 8: Update list files

**Files:**
- Modify: `docs/en/list.md`
- Modify: `docs/zh-tw/list.md`

- [ ] **Step 1: Add entries to `docs/en/list.md`**

  After `- [509.Feature-Sliced Design & Folder-Level Architecture](509)`, add:
  ```
  - [510.Compound Component Pattern](510)
  - [511.Provider Hierarchy & Context Composition](511)
  - [512.Component-Level Memoization](512)
  - [513.Testing Component Contracts](513)
  ```

  After `- [607.State Management Libraries](607)`, add:
  ```
  - [608.Optimistic Updates](608)
  - [609.Form State Management](609)
  - [610.Undo/Redo Patterns](610)
  ```

- [ ] **Step 2: Add entries to `docs/zh-tw/list.md`**

  After `- [509.Feature-Sliced Design 與資料夾架構](509)`, add:
  ```
  - [510.複合元件模式](510)
  - [511.Provider 層級與 Context 組合](511)
  - [512.元件層級的記憶化](512)
  - [513.測試元件契約](513)
  ```

  After `- [607.狀態管理函式庫](607)`, add:
  ```
  - [608.樂觀更新](608)
  - [609.表單狀態管理](609)
  - [610.復原與重做模式](610)
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add docs/en/list.md docs/zh-tw/list.md
  git commit -m "chore(list): add FEE-510–513 and 608–610 to list files"
  ```
