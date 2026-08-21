---
id: 613
title: "TanStack Query v5"
state: draft
slug: tanstack-query-v5
---

# [FEE-613] TanStack Query v5

:::info
TanStack Query v5 將伺服器狀態視為與用戶端狀態分離的一級基本元素，以雙時鐘契約為核心建構快取、去重與背景重新獲取機制：`staleTime` 控管新鮮度，`gcTime` 控管閒置條目的垃圾回收。v5 引入 `queryOptions()` 輔助函式，讓 `queryKey` + `queryFn` 的定義能在 `useQuery`、`prefetchQuery` 等之間共用，並提供 Suspense 優先的 hooks（`useSuspenseQuery`、`useSuspenseQueries`、`useSuspenseInfiniteQuery`），將載入與錯誤狀態委派給 React Suspense 與 error boundary。本次發布也精簡了 API 表面：移除位置參數重載、將 `cacheTime` 改名為 `gcTime`、將 `loading` 狀態改名為 `pending`。
:::

## 背景

TanStack Query v5 的設計建立在以下觀察上：伺服器資料的生命週期需求與用戶端 UI 狀態相異，因此它提供獨立的基本元素來處理獲取、快取與重新驗證。v5 新增 `queryOptions()` 輔助函式，讓單一物件能持有 `queryKey`、`queryFn` 與設定，使同一份定義能傳遞給 `useQuery`、`prefetchQuery` 與其他消費者；官方文件描述它為「在多處之間共享 `queryKey` 與 `queryFn`、同時保持彼此並列的最佳方式之一」。v5 也引入 Suspense 優先的 hooks `useSuspenseQuery`、`useSuspenseQueries` 與 `useSuspenseInfiniteQuery`，根據 Suspense 指南，「狀態值與錯誤物件已不再需要，並由 React.Suspense 元件的使用所取代」。這些新增功能建立在破壞性改名（`cacheTime` → `gcTime`、`loading` → `pending`）與位置參數重載的移除之上，因此多數採用者會透過遷移指南進入 v5。

## 情境

某個 React 應用程式以 `useEffect` + `fetch` 取得待辦清單、將結果存入元件狀態，並在每次子元件重新掛載時重新發出請求。團隊需要跨元件的快取去重、資料過期時自動背景重新獲取、「新增待辦」變更操作的樂觀 UI，以及一種方法讓路由載入器（hover 預先獲取）與頁面元件共用同一份查詢定義。TanStack Query v5 透過 `useQuery`、附帶 `onMutate`/`onError`/`onSettled` 的 `useMutation`、`queryClient.prefetchQuery` 與新的 `queryOptions()` 輔助函式涵蓋以上每一項。

## 最佳實踐

- **必須**將 `staleTime` 與 `gcTime` 視為獨立時鐘。`staleTime` 主導 stale-while-revalidate 行為，`gcTime`（預設 5 分鐘）控管查詢在最後一個觀察者卸載後、被垃圾回收前能存活多久。
- **必須**對 `useQuery`、`useInfiniteQuery` 與 `useMutation` 使用物件簽名形式。v5 移除了位置參數重載，遷移指南指出「我們現在只支援物件格式」。
- **應該**使用 `queryClient.invalidateQueries({ queryKey })` 來限定快取失效範圍，該方法以前綴比對；傳入 `exact: true` 則限定為單一完整指定的鍵。根據失效指南，「若你想**只**讓沒有更多變數或子鍵的 `todos` 查詢失效，可傳入 `exact: true` 選項」。一旦查詢被標記失效，活躍的觀察者會在背景重新獲取。
- **應該**在 React 之外呼叫 `queryClient.prefetchQuery` 時（SSR 啟動、路由載入器、hover 預先獲取）設定 `staleTime`。預先獲取指南指出「Prefetch 只在資料超過 staleTime 時才觸發，因此在這類情境中你絕對會想要設定一個值」。
- **應該**在開發期間使用內建的 devtools（`@tanstack/react-query-devtools`）。它們會在生產環境中被 tree-shake 移除：「預設情況下，React Query Devtools 只會在 `process.env.NODE_ENV === 'development'` 時被包進 bundle，因此你不需要擔心在生產建置中排除它們」。
- **可以**在父層 boundary 負責載入與錯誤 UI 時採用 `useSuspenseQuery`。使用 Suspense hooks 時，「錯誤與載入狀態由 Suspense 與 ErrorBoundary 處理」；作為交換，`data` 保證有定義、查詢無法以條件方式啟用，且 `placeholderData` 不可用。

## 設計思維

伺服器狀態與用戶端狀態具有不同的正確性要求。伺服器狀態是共享的、非同步的，可能在沒有本地動作的情況下變得過時，並且能從跨元件同時詢問相同問題的去重中獲益。v5 透過專屬的基本元素表達這項分離：以 `queryKey` 為鍵的快取、由 `staleTime` 驅動的背景重新獲取、進行中請求的去重，以及用於記憶體清理的獨立 `gcTime` 時鐘。Suspense 優先的 hooks 讓取捨變得明確。將載入與錯誤處理上提至 `<Suspense>` 與 error boundary，讓 `useSuspenseQuery` 的呼叫端取得不可為 null 的 `data`，但代價是失去條件式 `enabled` 與 `placeholderData`。`queryOptions()` 輔助函式採取類似的權衡校準：它在執行期將輸入原樣回傳，因此其價值在於型別推論與重用；文件指出「在執行期，它只是把你傳入的內容原樣回傳」。

## 深入探討

快取生命週期有兩個時鐘。`staleTime` 主導下次讀取時是否將快取資料視為新鮮；`gcTime` 控管條目在沒有觀察者的情況下能存活多久。快取指南將第二個時鐘描述為「以 `gcTime` 設定垃圾回收逾時，用以刪除並垃圾回收該查詢（預設為 **5 分鐘**）」。當最後一個觀察者卸載後，條目會保留 `gcTime` 期間，使該時間窗內的重新掛載能在任何重新獲取被決定前先從快取補水。

`queryOptions()` 是一個型別輔助函式。它的執行期契約是 identity：原樣回傳輸入。其價值在於將 `queryKey` + `queryFn` + 設定並列於同一個運算式中，並以一致的型別推論將同一個運算式傳給 `useQuery`、`prefetchQuery` 與 `queryClient.getQueryData`。

v5 的狀態語意拆分了先前混在一起的狀態。`pending`（改名自 `loading`）意味「尚未有資料」；`isFetching` 意味「有請求正在進行中，可能是針對既有資料的背景重新獲取」；新的派生 `isLoading` 為 `isPending && isFetching`，將其縮限至初始獲取。遷移指南明確說明：「為查詢新增了一個派生的 `isLoading` 旗標，其實作為 `isPending && isFetching`」。

## 圖解

| 面向 | `staleTime` | `gcTime` |
| --- | --- | --- |
| 衡量內容 | 已獲取的資料被視為新鮮的時間長度 | 閒置（無觀察者）快取條目的存活時間長度 |
| 預設值 | `0`（立即過期） | 5 分鐘 |
| 觸發條件 | 過期後在下次掛載／focus／reconnect 時重新獲取 | 計時器觸發後快取被驅逐 |
| 影響 | 網路行為（stale-while-revalidate） | 記憶體（垃圾回收） |
| 出處 | 快取指南 | 快取指南：「以 `gcTime` 設定垃圾回收逾時，用以刪除並垃圾回收該查詢（預設為 **5 分鐘**）」 |

## 範例

某個 todos 頁面以 `useQuery` 讀取、以 `useMutation` 寫入，並透過 `queryClient.setQueryData` 套用樂觀更新。變更處理函式遵循樂觀更新指南的模式：「`useMutation` 的 `onMutate` 處理選項允許你回傳一個值，該值稍後會作為最後一個引數傳給 `onError` 與 `onSettled` 兩個處理函式」。

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

當分頁需求超出單一頁面時，`useInfiniteQuery` 暴露 `data.pages`、`data.pageParams` 與 `fetchNextPage`/`fetchPreviousPage`。根據 infinite-queries 指南，「現在提供 `hasNextPage` 布林值，當 `getNextPageParam` 回傳非 `null` 或 `undefined` 的值時為 `true`」。v5 也要求在 infinite query 選項上明確指定 `initialPageParam`。

## 從 v4 升級到 v5

| 變更項目 | v4 | v5 | 出處 |
| --- | --- | --- | --- |
| 快取驅逐選項名稱 | `cacheTime` | `gcTime` | 遷移指南：「幾乎所有人都把 `cacheTime` 理解錯了……`gc` 指的是 'garbage collect' time」 |
| 初始載入狀態 | `loading` / `isLoading` | `pending` / `isPending`；新派生 `isLoading = isPending && isFetching` | 遷移指南 |
| 分頁佔位資料 | `keepPreviousData` 選項 + `isPreviousData` 旗標 | `placeholderData: keepPreviousData`（identity 輔助函式）+ `isPlaceholderData` | 遷移指南：「我們已移除 `keepPreviousData` 選項與 `isPreviousData` 旗標，因為它們所做的事情與 `placeholderData` 及 `isPlaceholderData` 旗標大致相同」 |
| 無限查詢 | 隱含的第一頁參數 | 必須明確提供 `initialPageParam`；`getNextPageParam` / `getPreviousPageParam` 決定後續頁面 | 遷移指南：「你現在必須在 infinite query 選項上傳入明確的 `initialPageParam`。它會作為第一頁的 `pageParam` 使用」 |
| Hook 簽名 | 位置參數與物件兩種重載 | `useQuery`、`useInfiniteQuery`、`useMutation` 僅支援物件形式 | 遷移指南：「我們現在只支援物件格式」 |

## 內部參考

- [FEE-617 Offline-First IndexedDB](/zh-tw/State%20Management/617) — 在快取必須撐過重新載入或離線導覽時與 TanStack Query 搭配。
- [FEE-616 React 19 Form State](/zh-tw/State%20Management/616) — 在寫入路徑上協調 `useMutation` 與 React 19 的表單動作。

## 參考資料

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
