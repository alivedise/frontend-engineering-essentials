---
topic: TanStack Query — The Observer Pattern around QueryCache
id: 1803
slug: tanstack-query-observer-pattern
studied_at: "@tanstack/query v5.74.3 (2025-04-14)"
sources_reviewed: 7
claims: 14
---

# Findings: TanStack Query — The Observer Pattern around QueryCache

**Proposed topic-specific section:** `## The Observer Pattern around QueryCache`.

Tag note: the most recent stable release at or before 2025-04-15 is `v5.74.3` (2025-04-14). The TanStack/query monorepo ships a single repo-level `vX.Y.Z` tag bundling all sub-packages.

## Claims

### Claim 1
- **Text:** `Subscribable` is the base class supplying the listener registry; it is generic over the listener type, holds a `Set<TListener>`, and exposes `subscribe()` plus `hasListeners()`.
- **Target section:** Context
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/subscribable.ts
- **Pulled quote:**
```ts
export class Subscribable<TListener extends Function> {
  protected listeners = new Set<TListener>()

  subscribe(listener: TListener): () => void {
    this.listeners.add(listener)
    this.onSubscribe()
    return () => {
      this.listeners.delete(listener)
      this.onUnsubscribe()
    }
  }

  hasListeners(): boolean {
    return this.listeners.size > 0
  }
```

### Claim 2
- **Text:** Both `QueryCache` and `QueryObserver` extend `Subscribable<TListener>`; the cache uses `QueryCacheListener`, the observer uses `QueryObserverListener<TData, TError>`.
- **Target section:** Context
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryCache.ts
- **Pulled quote:** `export class QueryCache extends Subscribable<QueryCacheListener> {`
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- **Pulled quote:** `export class QueryObserver<...> extends Subscribable<QueryObserverListener<TData, TError>> {`

### Claim 3
- **Text:** `QueryCache` is the central registry and owns a `Map<string, Query>` keyed by stringified query hash; `add()` mutates the map and fires an `'added'` event.
- **Target section:** Visual
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryCache.ts
- **Pulled quote:**
```ts
export class QueryCache extends Subscribable<QueryCacheListener> {
  #queries: QueryStore

  constructor(public config: QueryCacheConfig = {}) {
    super()
    this.#queries = new Map<string, Query>()
  }

  add(query: Query<any, any, any, any>): void {
    if (!this.#queries.has(query.queryHash)) {
      this.#queries.set(query.queryHash, query)
      this.notify({ type: 'added', query })
    }
  }
```

### Claim 4
- **Text:** `QueryCache.notify(event)` fans out a single typed `QueryCacheNotifyEvent` to every cache subscriber inside a `notifyManager.batch(...)` — this is the channel DevTools and global observers listen to.
- **Target section:** The Observer Pattern around QueryCache
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryCache.ts
- **Pulled quote:**
```ts
notify(event: QueryCacheNotifyEvent): void {
  notifyManager.batch(() => {
    this.listeners.forEach((listener) => {
      listener(event)
    })
  })
}
```

### Claim 5
- **Text:** Each `Query` keeps its own `observers: Array<QueryObserver<...>>`. `addObserver` pushes onto that array, clears the GC timer, and emits an `'observerAdded'` cache event.
- **Target section:** Example
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/query.ts
- **Pulled quote:**
```ts
addObserver(observer: QueryObserver<any, any, any, any, any>): void {
  if (!this.observers.includes(observer)) {
    this.observers.push(observer)
    // Stop the query from being garbage collected
    this.clearGcTimeout()
    this.#cache.notify({ type: 'observerAdded', query: this, observer })
  }
}
```

### Claim 6
- **Text:** When a Query's state changes via `#dispatch`, the Query directly walks its observer list and calls `observer.onQueryUpdate()` on each, then notifies the cache with an `'updated'` event — the Query → Observer fan-out is plain array iteration inside a `notifyManager.batch`.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/query.ts
- **Pulled quote:**
```ts
this.state = reducer(this.state)

notifyManager.batch(() => {
  this.observers.forEach((observer) => {
    observer.onQueryUpdate()
  })

  this.#cache.notify({ query: this, type: 'updated', action })
})
```

### Claim 7
- **Text:** `QueryObserver.onSubscribe()` is the lifecycle hook fired by `Subscribable.subscribe()`. It only does work when the *first* listener arrives (`this.listeners.size === 1`): it calls `currentQuery.addObserver(this)` and either fetches or just calls `updateResult`.
- **Target section:** The Observer Pattern around QueryCache
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- **Pulled quote:**
```ts
protected onSubscribe(): void {
  if (this.listeners.size === 1) {
    this.#currentQuery.addObserver(this)

    if (shouldFetchOnMount(this.#currentQuery, this.options)) {
      this.#executeFetch()
    } else {
      this.updateResult()
    }

    this.#updateTimers()
  }
}
```

### Claim 8
- **Text:** Symmetrically, `onUnsubscribe()` tears the Observer down and calls `currentQuery.removeObserver(this)` from inside `destroy()`. With no observers left, the Query schedules itself for GC.
- **Target section:** The Observer Pattern around QueryCache
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- **Pulled quote:**
```ts
protected onUnsubscribe(): void {
  if (!this.hasListeners()) {
    this.destroy()
  }
}

destroy(): void {
  this.listeners = new Set()
  this.#clearStaleTimeout()
  this.#clearRefetchInterval()
  this.#currentQuery.removeObserver(this)
}
```

### Claim 9
- **Text:** `useBaseQuery` constructs the Observer once per component instance via `React.useState(() => new Observer(...))`, subscribes through `React.useSyncExternalStore`, and re-applies options on every render with `observer.setOptions(defaultedOptions)`.
- **Target section:** Example
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/react-query/src/useBaseQuery.ts
- **Pulled quote:**
```ts
const [observer] = React.useState(
  () =>
    new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
      client,
      defaultedOptions,
    ),
)

React.useSyncExternalStore(
  React.useCallback(
    (onStoreChange) => {
      const unsubscribe = shouldSubscribe
        ? observer.subscribe(notifyManager.batchCalls(onStoreChange))
        : noop
      observer.updateResult()
      return unsubscribe
    },
    [observer, shouldSubscribe],
  ),

React.useEffect(() => {
  observer.setOptions(defaultedOptions)
}, [defaultedOptions, observer])
```

### Claim 10
- **Text:** `QueryClient.getQueryData(queryKey)` reads the cache without creating an Observer; the in-source JSDoc explicitly contrasts this with `useQuery`, which "creates a `QueryObserver` that subscribes to changes."
- **Target section:** The Observer Pattern around QueryCache
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryClient.ts
- **Pulled quote:**
```ts
/**
 * Imperative (non-reactive) way to retrieve data for a QueryKey.
 * Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
 *
 * Hint: Do not use this function inside a component, because it won't receive updates.
 * Use `useQuery` to create a `QueryObserver` that subscribes to changes.
 */
getQueryData<...>(queryKey: TTaggedQueryKey): TInferredQueryFnData | undefined {
  const options = this.defaultQueryOptions({ queryKey })
  return this.#queryCache.get(options.queryHash)?.state.data as ...
}
```

### Claim 11
- **Text:** `updateResult()` early-returns when `shallowEqualObjects(nextResult, prevResult)` is true, so re-running the observer's pipeline does not emit a notification when the produced result is shallow-equal to the previous one.
- **Target section:** The Observer Pattern around QueryCache
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- **Pulled quote:**
```ts
updateResult(): void {
  const prevResult = this.#currentResult as ...
  const nextResult = this.createResult(this.#currentQuery, this.options)
  this.#currentResultState = this.#currentQuery.state
  this.#currentResultOptions = this.options
  ...
  // Only notify and update result if something has changed
  if (shallowEqualObjects(nextResult, prevResult)) {
    return
  }
  this.#currentResult = nextResult
```

### Claim 12
- **Text:** Even when the result object differs, the Observer narrows notifications further by tracking which result properties the consumer touched (`#trackedProps` plus `notifyOnChangeProps`); it only notifies listeners when a *changed* key is in the included set.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- **Pulled quote:**
```ts
const shouldNotifyListeners = (): boolean => {
  if (!prevResult) return true
  const { notifyOnChangeProps } = this.options
  ...
  if (notifyOnChangePropsValue === 'all' || (!notifyOnChangePropsValue && !this.#trackedProps.size)) {
    return true
  }
  const includedProps = new Set(notifyOnChangePropsValue ?? this.#trackedProps)
  ...
  return Object.keys(this.#currentResult).some((key) => {
    const typedKey = key as keyof QueryObserverResult
    const changed = this.#currentResult[typedKey] !== prevResult[typedKey]
    return changed && includedProps.has(typedKey)
  })
}
this.#notify({ listeners: shouldNotifyListeners() })
```

### Claim 13
- **Text:** Inside `#notify`, the Observer first calls each subscribed listener with the current result (this is what triggers React's `useSyncExternalStore` rerender), and then forwards a separate `'observerResultsUpdated'` event up to the QueryCache — two notification channels, one shared notify pass.
- **Target section:** The Observer Pattern around QueryCache
- **Source URL:** https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- **Pulled quote:**
```ts
#notify(notifyOptions: { listeners: boolean }): void {
  notifyManager.batch(() => {
    // First, trigger the listeners
    if (notifyOptions.listeners) {
      this.listeners.forEach((listener) => {
        listener(this.#currentResult)
      })
    }

    // Then the cache listeners
    this.#client.getQueryCache().notify({
      query: this.#currentQuery,
      type: 'observerResultsUpdated',
    })
  })
}
```

### Claim 14
- **Text:** TanStack Query maintainer Dominik Dorfmeister (TkDodo) summarises the Observer's role: "An `Observer` is created when you call `useQuery`, and it is always subscribed to exactly one query." The Observer also tracks which result properties a component reads so unrelated changes do not notify it.
- **Target section:** Best Practices
- **Source URL:** https://tkdodo.eu/blog/inside-react-query
- **Pulled quote:** "An `Observer` is created when you call `useQuery`, and it is always subscribed to exactly one query." / "The `Observer` knows which properties of the `Query` a component is using, so it doesn't have to notify it of unrelated changes."

## Reference URLs

- https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/subscribable.ts
- https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryCache.ts
- https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryObserver.ts
- https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/query.ts
- https://github.com/TanStack/query/blob/v5.74.3/packages/query-core/src/queryClient.ts
- https://github.com/TanStack/query/blob/v5.74.3/packages/react-query/src/useBaseQuery.ts
- https://tkdodo.eu/blog/inside-react-query

## Research notes

- The transferable shape: a global cache registry (Map keyed by stable identifier) + per-subscription observer (binds options + listeners to one cache entry) + a `Subscribable` base providing pub-sub primitives. Recurs in: SWR, RTK Query, Apollo Client (`InMemoryCache` + `ObservableQuery`), Vue's reactivity, custom data-layer hooks.
- "What to look for elsewhere" candidates: a `Subscribable<TListener>` base with `Set<TListener>`; a registry class with `Map<string, Entry>` keyed by stable hash; per-call observer/subscription objects binding options + listeners to one entry; a "read without subscribing" path (`getQueryData`-equivalent); selective notification (shallow-equal short-circuit + property tracking); lifecycle gating in `onSubscribe` so first-subscriber bootstraps and last-unsubscriber tears down.
- Useful asymmetry to highlight: `QueryClient.getQueryData()` is `Map.get(...).state.data` with no Observer, no subscription, no GC pressure relief, no updates. `useQuery()` always creates an Observer, always subscribes. Two deliberately different verbs.
- Two notification channels, one batch: inside `QueryObserver.#notify` the order is fixed — component listeners first (so React rerenders), then `cache.notify({ type: 'observerResultsUpdated' })` for cross-cutting subscribers like DevTools. Both inside one `notifyManager.batch(...)`.
- IMPORTANT: `Query` extends `Removable`, NOT `Subscribable`. The fan-out from Query to its observers is a plain `this.observers.forEach(o => o.onQueryUpdate())`, not a Subscribable listener loop. Only `QueryCache` and `QueryObserver` are Subscribables. Article must not claim Query "is a Subscribable".

## Author cautions

- Studied tag is `v5.74.3` (not `v5.62.0`). All line numbers and quotes verified against this tag.
- TkDodo's "Inside React Query" post is dated; quote only the shape-of-architecture sentences, not API-shape sentences (e.g. `notifyOnChangeProps: 'tracked'` was removed since the post was written).
- Render code blocks with elision marks (`...`) where source content is long; preserve the load-bearing lines verbatim.

## Rejected sources

- Random Medium articles, scribd mirrors, third-party commentary blogs — not maintainer-authored or source-grounded.
- TanStack docs site — high-level / prescriptive, doesn't expose Observer/QueryCache internals at quote granularity.
- `notifyManager.ts` — transactional batching layer; orthogonal to the Observer pattern shape, mention briefly without a dedicated claim.
