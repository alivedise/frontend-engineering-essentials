---
topic: TanStack Query v5 — queryOptions, Suspense, Infinite Queries
id: 613
slug: tanstack-query-v5
sources_reviewed: 10
claims: 15
---

# Findings: TanStack Query v5

**Proposed topic-specific section:** `## Migration from v4`.

## Claims

### Claim 1
- **Text:** v5 ships `queryOptions()` helper letting one object hold `queryKey` + `queryFn` + config so the same definition can be passed to `useQuery`, `prefetchQuery`, others.
- **Target section:** Context
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/query-options
- **Pulled quote:** "one of the best ways to share `queryKey` and `queryFn` between multiple places, yet keep them co-located to one another."

### Claim 2
- **Text:** `queryOptions()` returns its input verbatim at runtime; value is type inference and reuse.
- **Target section:** Deep Dive
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/query-options
- **Pulled quote:** "At runtime, it just returns whatever you pass into it"

### Claim 3
- **Text:** v5 introduces Suspense-first hooks `useSuspenseQuery`, `useSuspenseQueries`, `useSuspenseInfiniteQuery` — loading/error handled by Suspense + error boundaries instead of `status` flags.
- **Target section:** Context
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/suspense
- **Pulled quote:** "status states and error objects are not needed and are then replaced by usage of the React.Suspense component."

### Claim 4
- **Text:** Suspense hooks: `data` guaranteed defined, can't conditionally enable, `placeholderData` unavailable.
- **Target section:** Best Practices
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/suspense
- **Pulled quote:** "errors and loading states are handled by Suspense- and ErrorBoundaries" "you therefore can't conditionally enable / disable the Query."

### Claim 5
- **Text:** v5 renames `cacheTime` → `gcTime` to communicate the timer governs garbage collection of inactive cache entries, not freshness.
- **Target section:** Migration from v4
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
- **Pulled quote:** "Almost everyone gets `cacheTime` wrong. It sounds like 'the amount of time that data is cached for', but that is not correct... `gc` is referring to 'garbage collect' time."

### Claim 6
- **Text:** v5 removes `keepPreviousData` option and `isPreviousData` flag in favor of `placeholderData: keepPreviousData` (identity function).
- **Target section:** Migration from v4
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
- **Pulled quote:** "We have removed the `keepPreviousData` option and `isPreviousData` flag as they were doing mostly the same thing as `placeholderData` and `isPlaceholderData` flag."

### Claim 7
- **Text:** `loading` status renamed to `pending` (derived `isPending`); new `isLoading` is `isPending && isFetching`, narrowing it to initial fetch.
- **Target section:** Migration from v4
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
- **Pulled quote:** "The `loading` status has been renamed to `pending`, and similarly the derived `isLoading` flag has been renamed to `isPending`... a new derived `isLoading` flag has been added to the queries that is implemented as `isPending && isFetching`."

### Claim 8
- **Text:** `useInfiniteQuery` now requires explicit `initialPageParam`; `getNextPageParam`/`getPreviousPageParam` decide further pages.
- **Target section:** Migration from v4
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
- **Pulled quote:** "Instead, you now have to pass an explicit `initialPageParam` to the infinite query options. This will be used as the `pageParam` for the first page."

### Claim 9
- **Text:** Infinite-query results expose `data.pages` and `data.pageParams` arrays + `fetchNextPage`/`fetchPreviousPage`. `hasNextPage` is true when `getNextPageParam` returns anything other than null/undefined.
- **Target section:** Example
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/infinite-queries
- **Pulled quote:** "A `hasNextPage` boolean is now available and is `true` if `getNextPageParam` returns a value other than `null` or `undefined`."

### Claim 10
- **Text:** `queryClient.invalidateQueries({ queryKey })` matches by prefix; `exact: true` restricts to single fully-specified key. Active observers refetch in background.
- **Target section:** Best Practices
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
- **Pulled quote:** "If you want to **only** invalidate `todos` queries that don't have any more variables or subkeys, you can pass an `exact: true` option."

### Claim 11
- **Text:** `queryClient.prefetchQuery` populates the cache from outside React (SSR boots, route loaders, hover-prefetch); only triggers when cached data is older than `staleTime`.
- **Target section:** Best Practices
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/prefetching
- **Pulled quote:** "Prefetch only fires when data is older than the staleTime, so in a case like this you definitely want to set one."

### Claim 12
- **Text:** Optimistic updates use `onMutate` to snapshot+write cache, `onError` to roll back, `onSettled` to invalidate affected queries.
- **Target section:** Example
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
- **Pulled quote:** "To do this, `useMutation`'s `onMutate` handler option allows you to return a value that will later be passed to both `onError` and `onSettled` handlers as the last argument."

### Claim 13
- **Text:** Devtools ship as separate `@tanstack/react-query-devtools` package; tree-shake out of production when `NODE_ENV !== 'development'`.
- **Target section:** Best Practices
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/devtools
- **Pulled quote:** "By default, React Query Devtools are only included in bundles when `process.env.NODE_ENV === 'development'`, so you don't need to worry about excluding them during a production build."

### Claim 14
- **Text:** Two-clock freshness contract: `staleTime` decides stale-while-revalidate; `gcTime` (default 5 min) controls survival after last observer unmounts.
- **Target section:** Visual
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/caching
- **Pulled quote:** "a garbage collection timeout is set using `gcTime` to delete and garbage collect the query (defaults to **5 minutes**)."

### Claim 15
- **Text:** v5 accepts only object-form signatures for `useQuery`, `useInfiniteQuery`, `useMutation`; positional-argument overloads removed.
- **Target section:** Migration from v4
- **Source URL:** https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
- **Pulled quote:** "We now only support the object format"

## Reference URLs

- https://tanstack.com/query/v5/docs/framework/react/guides/query-options
- https://tanstack.com/query/v5/docs/framework/react/guides/suspense
- https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
- https://tanstack.com/query/v5/docs/framework/react/guides/infinite-queries
- https://tanstack.com/query/v5/docs/framework/react/reference/useQuery
- https://tanstack.com/query/v5/docs/framework/react/guides/prefetching
- https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
- https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
- https://tanstack.com/query/v5/docs/framework/react/devtools
- https://tanstack.com/query/v5/docs/framework/react/guides/caching

## Research notes

- All sources are TanStack Query v5 docs (tier-3); no fallbacks needed.
- Migration from v4 is the load-bearing custom section — most readers landing here are migrating.
