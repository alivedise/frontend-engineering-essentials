---
topic: React 19 Form State
id: 616
slug: react-19-form-state
sources_reviewed: 6
claims: 16
---

# Findings: React 19 Form State

**Proposed topic-specific section:** `## Hook Cooperation Pattern`.

## Claims

### Claim 1
- **Text:** React 19 shipped a unified Actions model: `<form>`, `<input>`, `<button>` accept a function for `action`/`formAction` props, automatically wrapping submission in a Transition and resetting uncontrolled fields on success.
- **Target section:** Context
- **Source URL:** https://react.dev/blog/2024/12/05/react-19
- **Pulled quote:** "We've added support for passing functions as the `action` and `formAction` props of `<form>`, `<input>`, and `<button>` elements to automatically submit forms with Actions... When a `<form>` Action succeeds, React will automatically reset the form for uncontrolled components."

### Claim 2
- **Text:** React 19 reached stable on December 5, 2024.
- **Target section:** Context
- **Source URL:** https://react.dev/blog/2024/12/05/react-19
- **Pulled quote:** "December 05, 2024 by The React Team... React v19 is now available on npm!"

### Claim 3
- **Text:** `useActionState` was previously named `useFormState` in Canary; rename signals it's not form-only.
- **Target section:** Context
- **Source URL:** https://react.dev/blog/2024/12/05/react-19
- **Pulled quote:** "`React.useActionState` was previously called `ReactDOM.useFormState` in the Canary releases, but we've renamed it and deprecated `useFormState`."

### Claim 4
- **Text:** `useOptimistic(value, reducer?)` returns `[optimisticState, setOptimistic]`; renders optimistic value while Action is pending; auto-reverts to `value` once Transition settles.
- **Target section:** Hook Cooperation Pattern
- **Source URL:** https://react.dev/reference/react/useOptimistic
- **Pulled quote:** "`const [optimisticState, setOptimistic] = useOptimistic(value, reducer?);`... Optimistic state only renders while an Action is in progress, otherwise `value` is rendered."

### Claim 5
- **Text:** When Action throws, React still ends Transition; if parent only commits new value on success, failure leaves `value` unchanged and UI rolls back.
- **Target section:** Deep Dive
- **Source URL:** https://react.dev/reference/react/useOptimistic
- **Pulled quote:** "If the Action throws an error, the Transition still ends, and React renders with whatever `value` currently is. Since the parent typically only updates `value` on success, a failure means `value` hasn't changed."

### Claim 6
- **Text:** `useOptimistic` setter MUST be called inside an Action; calling outside a Transition triggers warning and optimistic state only flashes briefly.
- **Target section:** Best Practices
- **Source URL:** https://react.dev/reference/react/useOptimistic
- **Pulled quote:** "The `set` function must be called inside an Action. If you call the setter outside an Action, React will show a warning and the optimistic state will briefly render."

### Claim 7
- **Text:** `useActionState(action, initialState)` returns `[state, dispatchAction, isPending]`; wrapped action receives previous state as first argument and FormData as second when used as form action.
- **Target section:** Hook Cooperation Pattern
- **Source URL:** https://react.dev/reference/react/useActionState
- **Pulled quote:** "When you use `useActionState`, the `reducerAction` receives an extra argument as its first argument: the previous or initial state. The submitted form data is therefore its second argument instead of its first."

### Claim 8
- **Text:** `useActionState` returns: current reduced state (initially `initialState`), dispatch function callable inside Actions, and boolean `isPending` for in-flight dispatches from this hook.
- **Target section:** Hook Cooperation Pattern
- **Source URL:** https://react.dev/reference/react/useActionState
- **Pulled quote:** "The current state. During the first render, it will match the `initialState` you passed... The `isPending` flag that tells you if any dispatched Actions for this Hook are pending."

### Claim 9
- **Text:** `useFormStatus()` MUST be called inside a child of a `<form>`; calling it inside the same component that renders the form returns no status for that form.
- **Target section:** Best Practices
- **Source URL:** https://react.dev/reference/react-dom/hooks/useFormStatus
- **Pulled quote:** "`useFormStatus` will only return status information for a parent `<form>`. It will not return status information for any `<form>` rendered in that same component or children components."

### Claim 10
- **Text:** `useFormStatus` returns: `pending` (boolean), `data` (FormData being submitted, or null), `method` (`'get'` or `'post'`), `action` (function passed to parent form's `action` prop, or null).
- **Target section:** Hook Cooperation Pattern
- **Source URL:** https://react.dev/reference/react-dom/hooks/useFormStatus
- **Pulled quote:** "`pending`: A boolean. If `true`, this means the parent `<form>` is pending submission... `data`: An object implementing the FormData interface that contains the data the parent `<form>` is submitting... `method`: A string value of either `'get'` or `'post'`... `action`: A reference to the function passed to the `action` prop on the parent `<form>`."

### Claim 11
- **Text:** `useFormStatus` lets a design-system Submit button read parent form pending state without prop drilling — form acts as implicit context provider.
- **Target section:** Hook Cooperation Pattern
- **Source URL:** https://react.dev/blog/2024/12/05/react-19
- **Pulled quote:** "`useFormStatus` reads the status of the parent `<form>` as if the form was a Context provider."

### Claim 12
- **Text:** Function passed to `<form action>` invoked inside a Transition with single FormData argument; on success, all uncontrolled field elements reset automatically.
- **Target section:** Example
- **Source URL:** https://react.dev/reference/react-dom/components/form
- **Pulled quote:** "The function passed to `action` may be async and will be called with a single argument containing the form data of the submitted form... After the `action` function succeeds, all uncontrolled field elements in the form are reset."

### Claim 13
- **Text:** Server Functions passed to `<form action>` enable progressive-enhancement submission that works without JavaScript or before client bundle has loaded.
- **Target section:** Design Thinking
- **Source URL:** https://react.dev/reference/react-dom/components/form
- **Pulled quote:** "Passing a Server Function to `<form action>` allow users to submit forms without JavaScript enabled or before the code has loaded."

### Claim 14
- **Text:** `useTransition` remains the lower-level primitive for non-form async; for forms React docs redirect readers to `useActionState`, form actions, and Server Functions because those handle request ordering automatically.
- **Target section:** Related Topics
- **Source URL:** https://react.dev/reference/react/useTransition
- **Pulled quote:** "For common use cases, React provides built-in abstractions such as: - `useActionState` - `<form>` actions - Server Functions. These solutions handle request ordering for you."

### Claim 15
- **Text:** Inside `startTransition` async action, any state update after `await` MUST be re-wrapped in another `startTransition` to remain part of Transition — known limitation.
- **Target section:** Deep Dive
- **Source URL:** https://react.dev/reference/react/useTransition
- **Pulled quote:** "You must wrap any state updates after any async requests in another `startTransition` to mark them as Transitions. This is a known limitation that we will fix in the future."

### Claim 16
- **Text:** Server Actions, marked with `"use server"`, are referenced from server and called from Client Components.
- **Target section:** Design Thinking
- **Source URL:** https://react.dev/blog/2024/12/05/react-19
- **Pulled quote:** "Server Actions allow Client Components to call async functions executed on the server. When a Server Action is defined with the `\"use server\"` directive, your framework will automatically create a reference to the server function, and pass that reference to the Client Component."

## Reference URLs

- https://react.dev/blog/2024/12/05/react-19
- https://react.dev/reference/react/useOptimistic
- https://react.dev/reference/react/useActionState
- https://react.dev/reference/react-dom/hooks/useFormStatus
- https://react.dev/reference/react-dom/components/form
- https://react.dev/reference/react/useTransition

## Research notes

- React 19 RC was April 25, 2024; **stable** shipped December 5, 2024. Article should state stable date.
- `useFormStatus` only sees a *parent* form (most common foot-gun).
- `useOptimistic` rollback isn't explicit revert — relies on parent only committing canonical `value` on success.
- Hook Cooperation Pattern is the load-bearing custom section — individual reference pages don't show all three composing together.
