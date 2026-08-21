---
id: 613
title: "TanStack Query v5"
state: draft
slug: tanstack-query-v5
---

# [FEE-613] TanStack Query v5

:::info
TanStack Query v5 treats server state as a first-class primitive separate from client state, with caching, deduplication, and background refetching built around a two-clock contract: `staleTime` for freshness and `gcTime` for garbage collection of inactive entries. v5 introduces the `queryOptions()` helper for sharing a `queryKey` + `queryFn` definition across `useQuery`, `prefetchQuery`, and others, plus Suspense-first hooks (`useSuspenseQuery`, `useSuspenseQueries`, `useSuspenseInfiniteQuery`) where loading and error states are delegated to React Suspense and error boundaries. The release also tightens API surface by removing positional-argument overloads, renaming `cacheTime` to `gcTime`, and renaming the `loading` status to `pending`.
:::

## Context

TanStack Query v5 is structured around the observation that server data has different lifecycle requirements from client UI state, so it ships its own primitives for fetching, caching, and revalidation. The v5 release adds `queryOptions()`, a helper that lets a single object hold `queryKey`, `queryFn`, and configuration so the same definition can be passed to `useQuery`, `prefetchQuery`, and other consumers; the docs describe it as "one of the best ways to share `queryKey` and `queryFn` between multiple places, yet keep them co-located to one another." v5 also introduces Suspense-first hooks `useSuspenseQuery`, `useSuspenseQueries`, and `useSuspenseInfiniteQuery`, where, per the suspense guide, "status states and error objects are not needed and are then replaced by usage of the React.Suspense component." These additions sit on top of breaking renames (`cacheTime` → `gcTime`, `loading` → `pending`) and the removal of positional-argument overloads, so most adopters arrive at v5 through the migration guide.

## Scenario

A React app fetches a list of todos with `useEffect` + `fetch`, stores the result in component state, and re-fires the request whenever a child remounts. The team needs cache deduplication across components, automatic background refetch when data goes stale, optimistic UI for the "add todo" mutation, and a way to share the same query definition between a route loader (prefetch on hover) and the page component. TanStack Query v5 covers each of these via `useQuery`, `useMutation` with `onMutate`/`onError`/`onSettled`, `queryClient.prefetchQuery`, and the new `queryOptions()` helper.

## Best Practices

- **MUST** treat `staleTime` and `gcTime` as independent clocks. `staleTime` governs stale-while-revalidate behavior and `gcTime` (default 5 minutes) controls how long an inactive query survives after its last observer unmounts before being garbage collected.
- **MUST** use the object signature for `useQuery`, `useInfiniteQuery`, and `useMutation`. v5 removed positional-argument overloads, with the migration guide stating "We now only support the object format."
- **SHOULD** scope cache invalidation with `queryClient.invalidateQueries({ queryKey })`, which matches by prefix; pass `exact: true` to restrict to a single fully-specified key. Per the invalidation guide, "If you want to **only** invalidate `todos` queries that don't have any more variables or subkeys, you can pass an `exact: true` option." Active observers refetch in the background once their queries are marked invalid.
- **SHOULD** set `staleTime` whenever you call `queryClient.prefetchQuery` from outside React (SSR boots, route loaders, hover-prefetch). The prefetching guide notes "Prefetch only fires when data is older than the staleTime, so in a case like this you definitely want to set one."
- **SHOULD** rely on the bundled devtools (`@tanstack/react-query-devtools`) during development. They are tree-shaken from production: "By default, React Query Devtools are only included in bundles when `process.env.NODE_ENV === 'development'`, so you don't need to worry about excluding them during a production build."
- **MAY** adopt `useSuspenseQuery` when a parent boundary is responsible for loading and error UI. With Suspense hooks, "errors and loading states are handled by Suspense- and ErrorBoundaries"; in exchange, `data` is guaranteed defined, the query cannot be conditionally enabled, and `placeholderData` is unavailable.

## Design Thinking

Server state and client state have different correctness requirements. Server state is shared, asynchronous, can become outdated without local action, and benefits from deduplication across components that ask the same question at the same time. v5 expresses that separation through dedicated primitives: caching keyed by `queryKey`, background refetch driven by `staleTime`, deduplication of in-flight requests, and a separate `gcTime` clock for memory cleanup. Suspense-first hooks make the trade-off explicit. Lifting loading and error handling to `<Suspense>` and error boundaries gives `useSuspenseQuery` callers a non-nullable `data`, but the cost is losing conditional `enabled` and `placeholderData`. The `queryOptions()` helper is calibrated similarly: it returns its input verbatim at runtime, so the value is type inference and reuse rather than additional behavior. The docs note "At runtime, it just returns whatever you pass into it."

## Deep Dive

The cache lifecycle has two clocks. `staleTime` governs whether cached data is considered fresh on next read; `gcTime` controls how long an entry survives without observers. The caching guide describes the second clock as "a garbage collection timeout is set using `gcTime` to delete and garbage collect the query (defaults to **5 minutes**)." Once the last observer unmounts, the entry stays for `gcTime` so a remount within the window can hydrate from cache before any refetch is decided.

`queryOptions()` is a type helper. Its runtime contract is identity: it returns its input unchanged. The value is colocating `queryKey` + `queryFn` + config into one expression and passing the same expression to `useQuery`, `prefetchQuery`, and `queryClient.getQueryData` with consistent inference.

Status semantics in v5 split previously conflated states. `pending` (the renamed `loading`) means "no data yet"; `isFetching` means "a request is in flight, possibly a background refetch over existing data"; the new derived `isLoading` is `isPending && isFetching`, which narrows it to the initial fetch. The migration guide spells this out: "a new derived `isLoading` flag has been added to the queries that is implemented as `isPending && isFetching`."

## Visual

| Aspect | `staleTime` | `gcTime` |
| --- | --- | --- |
| What it measures | How long fetched data is considered fresh | How long an inactive (no observers) cache entry survives |
| Default | `0` (immediately stale) | 5 minutes |
| Triggers | Refetch on next mount / focus / reconnect when expired | Cache eviction after timer fires |
| Affects | Network behavior (stale-while-revalidate) | Memory (garbage collection) |
| Source | Caching guide | Caching guide: "a garbage collection timeout is set using `gcTime` to delete and garbage collect the query (defaults to **5 minutes**)." |

## Example

A todos page reads with `useQuery` and writes with `useMutation`, applying an optimistic update via `queryClient.setQueryData`. The mutation handlers follow the pattern from the optimistic-updates guide: "`useMutation`'s `onMutate` handler option allows you to return a value that will later be passed to both `onError` and `onSettled` handlers as the last argument."

```ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query'

const todosQuery = queryOptions({
  queryKey: ['todos'],
  queryFn: async (): Promise<Todo[]> => {
    const res = await fetch('/api/todos')
    return res.json()
  },
  staleTime: 30_000,
})

function TodosPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery(todosQuery)

  const addTodo = useMutation({
    mutationFn: (text: string) =>
      fetch('/api/todos', { method: 'POST', body: JSON.stringify({ text }) }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: todosQuery.queryKey })
      const previous = queryClient.getQueryData<Todo[]>(todosQuery.queryKey)
      queryClient.setQueryData<Todo[]>(todosQuery.queryKey, (old = []) => [
        ...old,
        { id: 'optimistic', text, done: false },
      ])
      return { previous }
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(todosQuery.queryKey, ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosQuery.queryKey })
    },
  })

  if (isPending) return <p>Loading...</p>
  if (isError) return <p>Failed.</p>
  return (
    <ul>
      {data.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
      <li>
        <button onClick={() => addTodo.mutate('write tests')}>Add</button>
      </li>
    </ul>
  )
}
```

For pagination beyond a single page, `useInfiniteQuery` exposes `data.pages`, `data.pageParams`, and `fetchNextPage`/`fetchPreviousPage`. Per the infinite-queries guide, "A `hasNextPage` boolean is now available and is `true` if `getNextPageParam` returns a value other than `null` or `undefined`." v5 also requires an explicit `initialPageParam` on the infinite query options.

## Migration from v4

| Change | v4 | v5 | Source |
| --- | --- | --- | --- |
| Cache eviction option name | `cacheTime` | `gcTime` | Migration guide: "Almost everyone gets `cacheTime` wrong... `gc` is referring to 'garbage collect' time." |
| Initial loading status | `loading` / `isLoading` | `pending` / `isPending`; new `isLoading = isPending && isFetching` | Migration guide |
| Pagination placeholder | `keepPreviousData` option + `isPreviousData` flag | `placeholderData: keepPreviousData` (identity helper) + `isPlaceholderData` | Migration guide: "We have removed the `keepPreviousData` option and `isPreviousData` flag as they were doing mostly the same thing as `placeholderData` and `isPlaceholderData` flag." |
| Infinite queries | Implicit first page param | Required explicit `initialPageParam`; `getNextPageParam` / `getPreviousPageParam` decide further pages | Migration guide: "you now have to pass an explicit `initialPageParam` to the infinite query options. This will be used as the `pageParam` for the first page." |
| Hook signatures | Positional and object overloads | Object form only for `useQuery`, `useInfiniteQuery`, `useMutation` | Migration guide: "We now only support the object format" |

## Internal References

- [FEE-617 Offline-First IndexedDB](/en/State%20Management/617) — pair with TanStack Query when the cache must survive reloads or offline navigation.
- [FEE-616 React 19 Form State](/en/State%20Management/616) — coordinate `useMutation` with React 19 form actions for write paths.

## References

- TanStack, "Query Options," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/query-options
- TanStack, "Suspense," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/suspense
- TanStack, "Migrating to TanStack Query v5," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5
- TanStack, "Infinite Queries," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- TanStack, "Prefetching & Router Integration," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
- TanStack, "Query Invalidation," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- TanStack, "Optimistic Updates," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- TanStack, "Devtools," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/devtools
- TanStack, "Caching," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/guides/caching
- TanStack, "useQuery Reference," TanStack Query v5 docs (2024). https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
