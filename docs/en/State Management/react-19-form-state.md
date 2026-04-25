---
id: 616
title: "React 19 Form State"
state: draft
slug: react-19-form-state
---

# [FEE-616] React 19 Form State

:::info
React 19 introduced a unified Actions model that wraps form submissions in Transitions and resets uncontrolled fields automatically on success. Three hooks compose around this model: `useActionState` owns the canonical reduced state, `useOptimistic` renders an intermediate value while the Action runs, and `useFormStatus` lets a child component read the parent `<form>` pending state. This article covers how those hooks cooperate, the constraints each one imposes, and how Server Functions extend the same surface to progressive-enhancement submissions.
:::

## Context

React 19 reached stable on December 5, 2024 and shipped a unified Actions model. Function values passed to the `action` or `formAction` props of `<form>`, `<input>`, and `<button>` are submitted as Actions: React wraps the call in a Transition and, on success, resets uncontrolled field elements in the form. The `useActionState` hook ships in this release; it carries the previous Canary name `useFormState`, which is now deprecated. The rename signals that the hook applies to any Action-dispatched state, not only form submissions.

Before React 19, a form that needed a pending indicator, a server response message, and an optimistic preview required hand-wired `useState` plus a `useTransition` plus `useEffect` reset logic. The Actions model collapses those concerns into three composable hooks tied to the form element's submission lifecycle.

## Scenario

Consider a comment form on an article page with three concurrent requirements: the submit button must disable while the server processes the request, the new comment must appear in the list immediately to feel responsive, and submission must work when the page is hydrating or JavaScript is unavailable. Pre-React-19 code wired three separate states: a `pending` flag toggled around `fetch`, a local optimistic array merged with server data and reverted on error, and a `useEffect` that reset inputs after success. Each had to reference the others to stay consistent across rapid resubmits.

React 19 distributes the same three responsibilities across three hooks bound by the form element itself. The form's `action` prop receives the Action; `useActionState` produces the canonical post-submit state; `useOptimistic` produces the transient render; `useFormStatus` reads the form's status from inside the submit button.

## Best Practices

- **MUST** call the `useOptimistic` setter inside an Action. Calling the setter outside a Transition triggers a React warning and the optimistic state only renders briefly before reverting.
- **MUST** place `useFormStatus` inside a child component of the `<form>`. The hook reads only from a parent form; calling it inside the same component that renders the form returns no status for that form.
- **SHOULD** let the parent component update the canonical `value` only on success when using `useOptimistic`. The auto-revert behavior depends on `value` staying unchanged on failure so the Transition end re-renders the original.
- **SHOULD** use `useActionState`, `<form>` actions, or Server Functions for form async flow rather than reaching for `useTransition` directly. The React docs direct readers to those abstractions because they handle request ordering automatically.
- **MAY** read `data`, `method`, and `action` from `useFormStatus` in addition to `pending`. The hook exposes the FormData being submitted, the HTTP method, and a reference to the action function on the parent form.

## Design Thinking

Server Functions, marked with the `"use server"` directive, are referenced from the server and called from Client Components. The framework creates a server-side reference and passes it across the boundary so a Client Component can invoke server logic without an explicit endpoint. When such a Server Function is the value of `<form action>`, the form submits through the server reference, which means submission works without JavaScript enabled or before the client bundle has loaded. The trade-off priced in here is bundle-and-network coupling against progressive enhancement: the form's submit path stays functional during hydration windows because the underlying mechanism is a real form POST that the framework intercepts after hydration. Choosing a client-only Action gives up that fallback in exchange for fewer moving parts at the server boundary.

## Deep Dive

`useOptimistic` does not perform an explicit revert. When the Action throws, React still ends the Transition and re-renders with whatever `value` currently holds. If the parent component only commits a new `value` on success, a thrown Action leaves `value` unchanged and the UI reads as the pre-submission state. The contract is therefore that "rollback on failure" is the default outcome; the developer's responsibility is to keep success-only commit discipline in the parent.

`startTransition` carries one async limitation that bleeds into form actions. Inside an async Action, any state update that runs after an `await` must be re-wrapped in another `startTransition` to remain part of the Transition. The React documentation flags this as a known limitation that future versions will address. Code that calls `setOptimistic` after `await fetch(...)` without re-wrapping silently drops out of the Transition, which can show as the optimistic value flashing before the canonical update lands.

## Visual

```mermaid
sequenceDiagram
    participant U as User
    participant F as &lt;form action={fn}&gt;
    participant T as Transition
    participant O as useOptimistic
    participant A as useActionState
    participant S as Server

    U->>F: submit
    F->>T: wrap Action call (FormData)
    T->>O: setOptimistic(next)
    O-->>U: render optimistic value
    T->>S: invoke Action
    alt success
        S-->>A: new state
        A-->>U: render canonical state, reset uncontrolled fields
    else failure
        S-->>T: throw
        T-->>O: end Transition, value unchanged
        O-->>U: re-render value (rollback)
    end
```

## Example

The following composes `useActionState`, `useOptimistic`, and a child `SubmitButton` calling `useFormStatus`. The parent form passes a single Action; `useActionState` provides the previous-state-aware reducer signature where the wrapped action receives previous state as the first argument and the FormData as the second. On success, React resets uncontrolled inputs in the form automatically.

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

The `<form action>` function is invoked with a single FormData argument inside a Transition. `addOptimistic(draft)` runs inside that Action, satisfying the "setter inside Action" rule. After `dispatch(formData)` resolves with a new state, React commits `state.comments`, the optimistic overlay collapses back into the canonical list, and the input clears because it is uncontrolled. `SubmitButton` reads the parent form's status without prop drilling.

## Hook Cooperation Pattern

The three hooks divide responsibility along distinct axes:

- `useActionState(action, initialState)` owns the **canonical state**. It returns `[state, dispatchAction, isPending]`. The wrapped action receives previous state as its first argument and FormData as its second when used as a form action; the returned `state` matches `initialState` on first render and updates only after the Action settles. `isPending` reflects only dispatches from this hook.
- `useOptimistic(value, reducer?)` owns the **intermediate render**. It returns `[optimisticState, setOptimistic]`. The optimistic state renders only while an Action is in progress; when the Transition settles, React renders `value` again. The `value` it reads is typically the canonical state coming out of `useActionState`, so the optimistic overlay sits one level above the reduced state.
- `useFormStatus()` owns the **submit button's view of the form**. Called from a child of `<form>`, it returns `pending`, `data` (the FormData being submitted, or null), `method` (`'get'` or `'post'`), and `action` (the function passed to the parent form's `action` prop, or null). The form acts as an implicit context provider; design-system buttons read pending state without the parent threading props through.

The composition is layered: the form element hosts the Action; `useActionState` wraps that Action to compute canonical state and pendingness; `useOptimistic` reads the canonical `value` and produces a transient view for rendering; `useFormStatus` reads the parent form's pending/data/method/action from any descendant. None of the hooks share data directly. The form element is the shared substrate, and each hook attaches to a different facet of its lifecycle.

## Internal References

- [FEE-618 RSC State Boundary](/en/State%20Management/618) — form actions cross the server-client boundary; this article details the boundary semantics that Server Functions rely on.
- [FEE-613 TanStack Query](/en/State%20Management/613) — contrast for client-side mutation flows where the cache layer, rather than the form element, owns optimistic updates and rollback.

## References

- The React Team, "React v19," react.dev (2024). https://react.dev/blog/2024/12/05/react-19
- React Docs, "useActionState," react.dev. https://react.dev/reference/react/useActionState
- React Docs, "useOptimistic," react.dev. https://react.dev/reference/react/useOptimistic
- React DOM Docs, "useFormStatus," react.dev. https://react.dev/reference/react-dom/hooks/useFormStatus
- React DOM Docs, "<form>," react.dev. https://react.dev/reference/react-dom/components/form
- React Docs, "useTransition," react.dev. https://react.dev/reference/react/useTransition
