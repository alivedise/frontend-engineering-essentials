---
id: 616
title: "React 19 表單狀態"
state: draft
slug: react-19-form-state
---

# [FEE-616] React 19 表單狀態

:::info
React 19 引入統一的 Actions 模型，會將表單送出包進 Transition，並在成功時自動重置非受控欄位。三個 Hook 圍繞此模型協作：`useActionState` 持有正規化的 reduced 狀態，`useOptimistic` 在 Action 執行期間渲染中間值，`useFormStatus` 讓子元件讀取上層 `<form>` 的 pending 狀態。本文說明這些 Hook 如何協作、各自施加哪些限制，以及 Server Functions 如何將同一表面延伸到漸進增強的送出流程。
:::

## 背景

React 19 在 2024 年 12 月 5 日進入 stable，並提供統一的 Actions 模型。傳給 `<form>`、`<input>`、`<button>` 的 `action` 或 `formAction` prop 的函式值會以 Action 形式送出：React 將呼叫包進 Transition，並在成功時重置表單中的非受控欄位元素。`useActionState` Hook 在此版本提供；它沿用先前 Canary 版的名稱 `useFormState`，該名稱現已棄用。改名意在表明此 Hook 適用於任何由 Action 派發的狀態，不僅限於表單送出。

在 React 19 之前，需要 pending 指示、伺服器回應訊息與樂觀預覽的表單，必須手動串接 `useState` 加上 `useTransition` 加上 `useEffect` 重置邏輯。Actions 模型把這些責任收斂到三個可組合的 Hook，並繫結於表單元素的送出生命週期。

## 情境

考慮一個文章頁的留言表單，同時有三項需求：送出按鈕在伺服器處理請求時必須停用、新留言必須立即出現在列表以維持回應感、送出在頁面 hydrating 中或無 JavaScript 時也必須能運作。React 19 之前的程式碼會串接三個獨立狀態：在 `fetch` 前後切換的 `pending` 旗標、與伺服器資料合併並在錯誤時還原的本地樂觀陣列，以及成功後重置輸入的 `useEffect`。每一個都必須引用其他幾個，才能在快速重複送出時保持一致。

React 19 把同樣三項責任分給三個由表單元素本身連繫的 Hook。表單的 `action` prop 接收 Action；`useActionState` 產生送出後的正規狀態；`useOptimistic` 產生暫時的渲染；`useFormStatus` 從送出按鈕內部讀取表單的狀態。

## 最佳實踐

- **必須**在 Action 內部呼叫 `useOptimistic` 的 setter。在 Transition 之外呼叫 setter 會觸發 React 警告，且樂觀狀態僅短暫渲染後即還原。
- **必須**將 `useFormStatus` 放在 `<form>` 的子元件中。此 Hook 僅讀取上層表單；在渲染表單的同一元件中呼叫它，會回傳該表單沒有狀態。
- **應該**在使用 `useOptimistic` 時，由父元件僅在成功時更新正規 `value`。自動還原的行為依賴 `value` 在失敗時保持不變，使 Transition 結束後重新渲染原始值。
- **應該**使用 `useActionState`、`<form>` actions 或 Server Functions 處理表單非同步流程，而非直接動用 `useTransition`。React 文件指引讀者採用這些抽象，因為它們會自動處理請求順序。
- **可以**從 `useFormStatus` 讀取 `data`、`method` 與 `action`，除了 `pending` 之外。此 Hook 暴露正在送出的 FormData、HTTP method，以及上層表單的 action 函式參考。

## 設計思維

以 `"use server"` 指令標記的 Server Functions，在伺服器端被引用，並從 Client Components 呼叫。框架建立一個伺服器端參考並跨越邊界傳遞，使 Client Component 可在沒有明確 endpoint 的情況下呼叫伺服器邏輯。當這類 Server Function 作為 `<form action>` 的值時，表單透過該伺服器參考送出，意即即使在 JavaScript 未啟用、或 client bundle 尚未載入時，送出仍能運作。此處權衡的是 bundle 與網路耦合對上漸進增強：表單的送出路徑在 hydration 視窗期間仍可運作，因為底層機制是真實的表單 POST，框架在 hydration 完成後才攔截。選擇純 client 的 Action 則放棄該後備路徑，換取伺服器邊界較少的活動部件。

## 深入探討

`useOptimistic` 不執行明確的還原。當 Action 拋出錯誤時，React 仍會結束 Transition，並以 `value` 當下的內容重新渲染。若父元件僅在成功時提交新的 `value`，被拋出的 Action 會讓 `value` 保持不變，UI 讀起來就是送出前的狀態。因此契約是：「失敗時回滾」是預設結果；開發者的責任是在父元件維持「僅成功時提交」的紀律。

`startTransition` 帶有一項非同步限制，會延伸到 form actions。在非同步 Action 內部，任何在 `await` 之後執行的狀態更新，必須再用一次 `startTransition` 包起來，才能繼續屬於該 Transition。React 文件將其標示為已知限制，未來版本會處理。在 `await fetch(...)` 之後呼叫 `setOptimistic` 而未重新包裹的程式碼會悄悄脫離 Transition，可能呈現為樂觀值在正規更新落地前閃現的現象。

## 圖解

```mermaid
sequenceDiagram
    participant U as 使用者
    participant F as &lt;form action={fn}&gt;
    participant T as Transition
    participant O as useOptimistic
    participant A as useActionState
    participant S as 伺服器

    U->>F: 送出
    F->>T: 包裹 Action 呼叫 (FormData)
    T->>O: setOptimistic(next)
    O-->>U: 渲染樂觀值
    T->>S: 呼叫 Action
    alt 成功
        S-->>A: 新狀態
        A-->>U: 渲染正規狀態，重置非受控欄位
    else 失敗
        S-->>T: 拋出
        T-->>O: 結束 Transition，value 不變
        O-->>U: 重新渲染 value（回滾）
    end
```

## 範例

下例組合 `useActionState`、`useOptimistic`，以及一個呼叫 `useFormStatus` 的子元件 `SubmitButton`。父表單傳入單一 Action；`useActionState` 提供「前一狀態感知」的 reducer 簽名，被包裹的 action 收到前一狀態作為第一個引數、FormData 作為第二個引數。成功時，React 自動重置表單中的非受控輸入。

```tsx
import { useActionState, useOptimistic } from "react";
import { useFormStatus } from "react-dom";

type Comment = { id: string; body: string };
type State = { comments: Comment[]; error?: string };

async function postComment(prev: State, formData: FormData): Promise<State> {
  const body = String(formData.get("body") ?? "");
  const res = await fetch("/api/comments", { method: "POST", body });
  if (!res.ok) return { comments: prev.comments, error: "Submit failed" };
  const created: Comment = await res.json();
  return { comments: [...prev.comments, created] };
}

export function CommentForm({ initial }: { initial: Comment[] }) {
  const [state, dispatch, isPending] = useActionState(postComment, {
    comments: initial,
  });

  const [optimistic, addOptimistic] = useOptimistic(
    state.comments,
    (current, next: Comment) => [...current, next],
  );

  return (
    <form
      action={(formData) => {
        const draft: Comment = {
          id: crypto.randomUUID(),
          body: String(formData.get("body") ?? ""),
        };
        addOptimistic(draft);
        return dispatch(formData);
      }}
    >
      <ul>
        {optimistic.map((c) => (
          <li key={c.id}>{c.body}</li>
        ))}
      </ul>
      <input name="body" required />
      <SubmitButton />
      {state.error ? <p role="alert">{state.error}</p> : null}
      {isPending ? <p>Saving...</p> : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Posting..." : "Post"}
    </button>
  );
}
```

`<form action>` 函式在 Transition 內以單一 FormData 引數被呼叫。`addOptimistic(draft)` 在該 Action 內執行，滿足「setter 必須在 Action 內」的規則。當 `dispatch(formData)` 以新狀態解析後，React 提交 `state.comments`，樂觀疊加層回收為正規列表，輸入欄位因為是非受控而清空。`SubmitButton` 讀取上層表單狀態，無需 prop 透傳。

## Hook 協作模式

三個 Hook 沿不同軸線分擔責任：

- `useActionState(action, initialState)` 持有**正規狀態**。它回傳 `[state, dispatchAction, isPending]`。當作為 form action 使用時，被包裹的 action 收到前一狀態作為第一個引數、FormData 作為第二個引數；回傳的 `state` 在首次渲染時等於 `initialState`，僅在 Action 落定後更新。`isPending` 僅反映此 Hook 派發的呼叫。
- `useOptimistic(value, reducer?)` 持有**中間渲染**。它回傳 `[optimisticState, setOptimistic]`。樂觀狀態僅在 Action 進行期間渲染；當 Transition 落定後，React 再次渲染 `value`。它讀取的 `value` 通常是 `useActionState` 輸出的正規狀態，因此樂觀疊加層位於 reduced 狀態之上一層。
- `useFormStatus()` 持有**送出按鈕對表單的視角**。從 `<form>` 的子元件呼叫，它回傳 `pending`、`data`（正在送出的 FormData，否則為 null）、`method`（`'get'` 或 `'post'`），以及 `action`（傳給上層表單 `action` prop 的函式，否則為 null）。表單作為隱式的 context provider；設計系統按鈕讀取 pending 狀態，無需父層串連 props。

組合是分層的：表單元素承載 Action；`useActionState` 包裹該 Action 以計算正規狀態與 pending 性；`useOptimistic` 讀取正規 `value` 並產生用於渲染的暫時視圖；`useFormStatus` 從任何後代讀取上層表單的 pending/data/method/action。這些 Hook 之間不直接共享資料；表單元素是共享基底，每個 Hook 附著於其生命週期的不同切面。

## 內部參考

- [FEE-618 RSC 狀態邊界](/zh-tw/State%20Management/618) — form actions 跨越伺服器與 client 邊界；該文詳述 Server Functions 所依賴的邊界語意。
- [FEE-613 TanStack Query](/zh-tw/State%20Management/613) — 對照 client 端 mutation 流程，由快取層而非表單元素持有樂觀更新與回滾。

## 參考資料

- The React Team, "React v19," react.dev (2024). https://react.dev/blog/2024/12/05/react-19
- React Docs, "useActionState," react.dev. https://react.dev/reference/react/useActionState
- React Docs, "useOptimistic," react.dev. https://react.dev/reference/react/useOptimistic
- React DOM Docs, "useFormStatus," react.dev. https://react.dev/reference/react-dom/hooks/useFormStatus
- React DOM Docs, "<form>," react.dev. https://react.dev/reference/react-dom/components/form
- React Docs, "useTransition," react.dev. https://react.dev/reference/react/useTransition
