---
topic: Zag.js and Ark UI — Framework-Agnostic State Machines
id: 914
slug: zag-and-ark-ui
sources_reviewed: 11
claims: 18
---

# Findings: Framework-Agnostic State Machines — Zag.js and Ark UI

**Proposed topic-specific section:** `## State Machine Connect API`.

## Claims

### Claim 1
- **Text:** Zag.js: framework-agnostic toolkit modelling complex/accessible UI as finite state machines.
- **Target section:** Context
- **Source URL:** https://zagjs.com/overview/introduction
- **Pulled quote:** "Zag is a framework agnostic toolkit for implementing complex, interactive, and accessible UI components in your design system and web applications."

### Claim 2
- **Text:** Inspired by XState (state machine implementation reference).
- **Target section:** Context
- **Source URL:** https://zagjs.com/overview/introduction
- **Pulled quote:** "XState for inspiring the base implementation of the state machine."

### Claim 3
- **Text:** Component logic written once, reused via thin adapters across React, Vue, Solid, Svelte.
- **Target section:** Context
- **Source URL:** https://zagjs.com/overview/introduction
- **Pulled quote:** "We provide adapters for JS frameworks so you can use it in React, Solid, or Vue 3."

### Claim 4
- **Text:** Zag machine = finite states + transitions + reactive `context` for internal state.
- **Target section:** State Machine Connect API
- **Source URL:** https://zagjs.com/overview/whats-a-machine
- **Pulled quote:** "A state machine is a way to model stateful, reactive behavior using: A finite number of states [and] A finite number of transitions between those states."

### Claim 5
- **Text:** `connect` function bridges machine to DOM, exposing prop getters (`getButtonProps()`).
- **Target section:** State Machine Connect API
- **Source URL:** https://zagjs.com/overview/whats-a-machine
- **Pulled quote:** "Prop Getters: Methods like getButtonProps() return normalized attributes for elements, encapsulating the machine's state and event handlers for framework-agnostic consumption."

### Claim 6
- **Text:** Canonical pattern: `useMachine(machine, config)` → `connect(service, normalizeProps)` → spread getters onto JSX/template.
- **Target section:** Example
- **Source URL:** https://zagjs.com/overview/installation
- **Pulled quote:** "const service = useMachine(tooltip.machine, { id: \"1\" }) const api = tooltip.connect(service, normalizeProps)"

### Claim 7
- **Text:** `normalizeProps`: per-framework shim reconciling event-name/style differences (`onKeyDown` vs `onKeydown`).
- **Target section:** State Machine Connect API
- **Source URL:** https://zagjs.com/overview/installation
- **Pulled quote:** "This utility 'converts the props of the component into the format that is compatible' with each framework."

### Claim 8
- **Text:** Headless: Zag ships no styling.
- **Target section:** Best Practices
- **Source URL:** https://zagjs.com/overview/introduction
- **Pulled quote:** "Headless ✨: The machine APIs are completely unstyled."

### Claim 9
- **Text:** WAI-ARIA, keyboard handling, focus management, ARIA attrs baked into machines.
- **Target section:** Best Practices
- **Source URL:** https://zagjs.com/overview/introduction
- **Pulled quote:** "Focus on accessibility ♿️: Zag is built with accessibility in mind."

### Claim 10
- **Text:** Ark UI: 45+ headless components on Zag, identical APIs across React/Solid/Vue/Svelte.
- **Target section:** Context
- **Source URL:** https://ark-ui.com/
- **Pulled quote:** "A headless library with 45+ accessible components."

### Claim 11
- **Text:** Ark UI inherits Zag's predictable behavior; WCAG-compliant out of the box.
- **Target section:** Best Practices
- **Source URL:** https://github.com/chakra-ui/ark
- **Pulled quote:** "Built on top of Zag.js state machines, Ark UI delivers robust, framework-agnostic component logic."

### Claim 12
- **Text:** Radix Primitives + React Aria Components are React-only; Ark UI spans React/Vue/Solid/Svelte.
- **Target section:** Best Practices
- **Source URL:** https://blog.logrocket.com/headless-ui-alternatives-radix-primitives-react-aria-ark-ui/
- **Pulled quote:** "Framework Support — Radix Primitives & React Aria: React only. Ark UI: React, Vue, Solid"

### Claim 13
- **Text:** Mental models: Radix (component anatomy + composition), React Aria (hooks + state + contexts), Ark UI (state machines + parts).
- **Target section:** Best Practices
- **Source URL:** https://blog.logrocket.com/headless-ui-alternatives-radix-primitives-react-aria-ark-ui/
- **Pulled quote:** "Radix Primitives: Component anatomy and composition. React Aria: Hooks with explicit state. Ark UI: State machines and parts."

### Claim 14
- **Text:** React Aria Components route behavior through React contexts (event handlers, ARIA props passed to children) — tied to React's runtime.
- **Target section:** Best Practices
- **Source URL:** https://react-spectrum.adobe.com/react-aria/advanced.html
- **Pulled quote:** "React Aria Components automatically provide behavior to their children by passing event handlers and other attributes via context."

### Claim 15
- **Text:** Maintained by Chakra Systems Inc., MIT-licensed, framework-agnostic despite Chakra UI heritage.
- **Target section:** Context
- **Source URL:** https://github.com/chakra-ui/zag/blob/main/LICENSE
- **Pulled quote:** "The Zag.js project is licensed under the MIT License, with copyright held by Chakra UI as of 2021."

### Claim 16
- **Text:** Segun Adebayo's motivation: every interactive Chakra component as a state machine reusable across React/Vue/Angular/Svelte/Solid.
- **Target section:** Design Thinking
- **Source URL:** https://www.adebayosegun.com/blog/the-future-of-chakra-ui
- **Pulled quote:** "Every interactive component in Chakra UI will be modeled as a state machine ... any solution we build has to be framework agnostic."

### Claim 17
- **Text:** Mermaid pipeline: machine → service via useMachine → api via connect+normalizeProps → DOM via prop getters.
- **Target section:** Visual
- **Source URL:** https://zagjs.com/overview/installation
- **Pulled quote:** "All frameworks follow this basic structure: 1. Import the machine and framework adapter 2. Initialize with useMachine ... 3. Connect the machine using connect() with normalizeProps 4. Access API methods like getTriggerProps() and getContentProps()."

### Claim 18
- **Text:** Cross-link to broader headless-UI patterns and component-system articles.
- **Target section:** Related Topics
- **Source URL:** https://ark-ui.com/docs/overview/about
- **Pulled quote:** "Most popular UI component libraries are designed to work with a specific JavaScript framework."

## Reference URLs

- https://zagjs.com/overview/introduction
- https://zagjs.com/
- https://zagjs.com/overview/whats-a-machine
- https://zagjs.com/overview/installation
- https://github.com/chakra-ui/zag
- https://github.com/chakra-ui/zag/blob/main/LICENSE
- https://ark-ui.com/
- https://github.com/chakra-ui/ark
- https://www.adebayosegun.com/blog/the-future-of-chakra-ui
- https://blog.logrocket.com/headless-ui-alternatives-radix-primitives-react-aria-ark-ui/
- https://react-spectrum.adobe.com/react-aria/advanced.html

## Research notes

- "Inspired by XState" — Zag does not depend on XState at runtime; reimplemented core. Avoid "XState-derived".
- Maintainer corporate name: Chakra Systems Inc. (GitHub org: chakra-ui).
- Component counts: Ark UI 45+ live; LogRocket (2024) cites 34 — treat as historical.
- "State Machine Connect API" maps to two tier-3 doc pages (`whats-a-machine`, `installation`) — load-bearing.
