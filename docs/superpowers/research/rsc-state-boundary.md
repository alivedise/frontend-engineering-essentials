---
topic: React Server Components — The State Boundary
id: 618
slug: rsc-state-boundary
sources_reviewed: 9
claims: 18
---

# Findings: React Server Components — The State Boundary

**Proposed topic-specific section:** `## Lifting State Above an RSC`.

## Claims

### Claim 1
- **Text:** Server Components run ahead of time in a separate environment from the client app or SSR server; output excluded from JavaScript bundle.
- **Target section:** Context
- **Source URL:** https://react.dev/reference/rsc/server-components
- **Pulled quote:** "Server Components are a new type of Component that renders ahead of time, before bundling, in an environment separate from your client app or SSR server."

### Claim 2
- **Text:** Server Components can run once at build time on CI server, or per-request from a web server.
- **Target section:** Context
- **Source URL:** https://react.dev/reference/rsc/server-components
- **Pulled quote:** "Server Components can run once at build time on your CI server, or they can be run for each request using a web server."

### Claim 3
- **Text:** Async Server Components let you `await` directly inside render to fetch data, read filesystem, or talk to a database without an intermediate API layer.
- **Target section:** Context
- **Source URL:** https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023
- **Pulled quote:** "Server Components can run during the build, letting you read from the filesystem or fetch static content. They can also run on the server, letting you access your data layer without having to build an API."

### Claim 4
- **Text:** Server Components have no client lifecycle — interactive hooks (`useState`, `useEffect`) are unavailable inside them.
- **Target section:** Context
- **Source URL:** https://react.dev/reference/rsc/server-components
- **Pulled quote:** "Server Components are not sent to the browser, so they cannot use interactive APIs like `useState`."

### Claim 5
- **Text:** `'use client'` introduces server-client boundary in module dependency tree, creating a subtree of client modules.
- **Target section:** Best Practices
- **Source URL:** https://react.dev/reference/rsc/use-client
- **Pulled quote:** "`'use client'` introduces a server-client boundary in the module dependency tree, effectively creating a subtree of Client modules."

### Claim 6
- **Text:** Once module marked `'use client'`, every module it imports (including transitive deps) is evaluated on the client, regardless of whether they carry the directive themselves.
- **Target section:** Best Practices
- **Source URL:** https://react.dev/reference/rsc/use-client
- **Pulled quote:** "When a file marked with `'use client'` is imported from a Server Component, compatible bundlers will treat the module import as a boundary between server-run and client-run code. As dependencies of `RichTextEditor`, `formatDate` and `Button` will also be evaluated on the client regardless of whether their modules contain a `'use client'` directive."

### Claim 7
- **Text:** Props crossing from Server Component to Client Component MUST be serializable: primitives, plain objects, arrays, Map, Set, TypedArray, Date, Promises, JSX elements, Server Functions.
- **Target section:** Lifting State Above an RSC
- **Source URL:** https://react.dev/reference/rsc/use-client
- **Pulled quote:** "Serializable props include: Primitives [string, number, bigint, boolean, undefined, null, symbol], Iterables containing serializable values [String, Array, Map, Set, TypedArray and ArrayBuffer], [Date], Plain [objects], Functions that are [Server Functions], Client or Server Component elements (JSX), [Promises]."

### Claim 8
- **Text:** Plain functions, class instances, unregistered symbols cannot cross the boundary as props. Only Server Functions can be passed as a callable across the wire.
- **Target section:** Lifting State Above an RSC
- **Source URL:** https://react.dev/reference/rsc/use-client
- **Pulled quote:** "Notably, these are not supported: [Functions] that are not exported from client-marked modules or marked with [`'use server'`], [Classes], Objects that are instances of any class (other than the built-ins mentioned), Symbols not registered globally."

### Claim 9
- **Text:** `'use server'` marks an async function as a Server Function callable from client code over the network.
- **Target section:** Best Practices
- **Source URL:** https://react.dev/reference/rsc/use-server
- **Pulled quote:** "Add `'use server'` at the top of an async function body to mark the function as callable by the client. We call these functions Server Functions."

### Claim 10
- **Text:** Calling Server Function from client triggers network request that serializes arguments to server and serializes return value back.
- **Target section:** Best Practices
- **Source URL:** https://react.dev/reference/rsc/use-server
- **Pulled quote:** "When calling a Server Function on the client, it will make a network request to the server that includes a serialized copy of any arguments passed. If the Server Function returns a value, that value will be serialized and returned to the client."

### Claim 11
- **Text:** Server Function return values follow same serialization rules as props passed across a client boundary; React elements, plain functions, and arbitrary class instances cannot be returned.
- **Target section:** Lifting State Above an RSC
- **Source URL:** https://react.dev/reference/rsc/use-server
- **Pulled quote:** "Supported serializable return values are the same as serializable props for a boundary Client Component."

### Claim 12
- **Text:** Server Component can pass another Server Component as `children` (or any prop) into a Client Component, letting server-rendered UI nest inside client-managed UI.
- **Target section:** Lifting State Above an RSC
- **Source URL:** https://nextjs.org/docs/app/getting-started/server-and-client-components
- **Pulled quote:** "You can pass Server Components as a prop to a Client Component. This allows you to visually nest server-rendered UI within Client components."

### Claim 13
- **Text:** When tree mixes server data and client interactivity: lift stateful logic into its own client component so the surrounding tree can drop `'use client'` and stay on the server.
- **Target section:** Lifting State Above an RSC
- **Source URL:** https://www.joshwcomeau.com/react/server-components/
- **Pulled quote:** "To fix this, let's pluck the color-management stuff into its own component, moved to its own file...We can remove the `'use client'` directive from `Homepage` because it no longer uses state, or any other client-side React features."

### Claim 14
- **Text:** Marking a component `'use client'` does NOT opt it out of server-side rendering. Client components are still SSR'd into HTML on initial response and only become interactive after hydration.
- **Target section:** Best Practices
- **Source URL:** https://www.joshwcomeau.com/react/server-components/
- **Pulled quote:** "We still rely on Server Side Rendering to generate the initial HTML. React Server Components builds on top of that, allowing us to omit certain components from the client-side JavaScript bundle."

### Claim 15
- **Text:** RSC is a React-level specification that frameworks and bundlers (Next.js App Router, Waku, Vite plugins) implement.
- **Target section:** Context
- **Source URL:** https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023
- **Pulled quote:** "React Server Components is meant as a spec for components that work across compatible React frameworks."

### Claim 16
- **Text:** In Next.js, RSC output ships as binary RSC Payload containing rendered server output, references to client component bundles, and props passed across the boundary.
- **Target section:** Visual
- **Source URL:** https://nextjs.org/docs/app/getting-started/server-and-client-components
- **Pulled quote:** "The RSC Payload is a compact binary representation of the rendered React Server Components tree... [it contains] The rendered result of Server Components, Placeholders for where Client Components should be rendered and references to their JavaScript files, Any props passed from a Server Component to a Client Component."

### Claim 17
- **Text:** Common interleaving pattern: client `<Modal>` accepting `children`, with Server Component like `<Cart>` rendered into that slot from a parent server page.
- **Target section:** Example
- **Source URL:** https://nextjs.org/docs/app/getting-started/server-and-client-components
- **Pulled quote:** "A common pattern is to use `children` to create a slot in a `<ClientComponent>`. For example, a `<Cart>` component that fetches data on the server, inside a `<Modal>` component that uses client state to toggle visibility."

### Claim 18
- **Text:** Push the `'use client'` boundary as deep as possible — mark only small interactive leaves rather than large layouts — to keep JavaScript bundle minimal.
- **Target section:** Best Practices
- **Source URL:** https://nextjs.org/docs/app/getting-started/server-and-client-components
- **Pulled quote:** "To reduce the size of your client JavaScript bundles, add `'use client'` to specific interactive components instead of marking large parts of your UI as Client Components."

## Reference URLs

- https://react.dev/reference/rsc/server-components
- https://react.dev/reference/rsc/use-client
- https://react.dev/reference/rsc/use-server
- https://react.dev/reference/rsc/server-functions
- https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://www.joshwcomeau.com/react/server-components/
- https://nextjs.org/learn/react-foundations/server-and-client-components

## Research notes

- "use client" misconception (does not disable SSR) — high-signal Best Practice.
- Lifting State Above an RSC anchors via Comeau walkthrough + Next.js children-slot pattern.
- Keep Example minimal: server `<Page>` fetches and passes `likes` to client `<LikeButton>` plus server function called from that client button.
