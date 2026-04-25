---
topic: React Aria Components — Adobe's Contexts & Slots Composition Model
id: 913
slug: react-aria-components
sources_reviewed: 9
claims: 16
---

# Findings: React Aria Components — Adobe's Contexts & Slots Composition Model

**Proposed topic-specific section:** `## Composition Pattern Examples`.

## Claims

### Claim 1
- **Text:** React Spectrum trio (since July 2020): React Spectrum (styled), React Aria (behavior + a11y hooks), React Stately (state).
- **Target section:** Context
- **Source URL:** https://react-aria.adobe.com/blog/introducing-react-spectrum
- **Pulled quote:** "React Spectrum includes three libraries: React Spectrum — A React implementation of Spectrum, Adobe's design system. React Aria — A library of React Hooks that provides accessible UI primitives for your design system. React Stately — A library of React Hooks that provides cross-platform state management and core logic for your design system."

### Claim 2
- **Text:** Original layered architecture: state, behavior, rendered component. Consumers pick the layer.
- **Target section:** Context
- **Source URL:** https://react-aria.adobe.com/blog/introducing-react-spectrum
- **Pulled quote:** "React Spectrum splits each component into three parts: state, behavior, and the rendered component."

### Claim 3
- **Text:** React Aria Components is the upper React-specific layer above the hooks. Implements ARIA patterns as unstyled JSX.
- **Target section:** Context
- **Source URL:** https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- **Pulled quote:** "React Aria Components is a library of unstyled components implementing ARIA patterns. It is implemented as a thin layer on top of our existing React Aria hooks."

### Claim 4
- **Text:** Motivation: hook API has steep learning curve; required stitching multiple hooks for any single pattern.
- **Target section:** Context
- **Source URL:** https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- **Pulled quote:** "we have also received feedback that it has a very steep learning curve, and that the APIs are complex and hard to put together."

### Claim 5
- **Text:** Components and hooks designed to interoperate; teams can drop down to hooks for edge cases.
- **Target section:** Context
- **Source URL:** https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- **Pulled quote:** "The components and hooks also work together, allowing them to be mixed and matched depending on the level of customization required."

### Claim 6
- **Text:** React Aria Components 1.0 GA: 20 December 2023.
- **Target section:** Context
- **Source URL:** https://react-spectrum.adobe.com/releases/2023-12-20.html
- **Pulled quote:** "After a year of work, we are happy to announce the GA release of React Aria Components 🎉"

### Claim 7
- **Text:** Every component exports a paired React context (e.g., `ButtonContext`, `ListBoxContext`, `LabelContext`, `InputContext`).
- **Target section:** Composition Pattern Examples
- **Source URL:** https://react-aria.adobe.com/customization
- **Pulled quote:** "Each React Aria Component exports a corresponding context that you can use to build your own compositional APIs similar to the built-in components."

### Claim 8
- **Text:** `slot` prop addresses one named child among many sharing a context (e.g., `increment` vs `decrement` button under `ButtonContext`).
- **Target section:** Composition Pattern Examples
- **Source URL:** https://react-aria.adobe.com/customization
- **Pulled quote:** "Slots are named children within a component that have separate behaviors and styles."

### Claim 9
- **Text:** `<Provider>` utility composes multiple context providers in one element.
- **Target section:** Composition Pattern Examples
- **Source URL:** https://react-aria.adobe.com/customization
- **Pulled quote:** "<Provider values={[[ButtonContext, {/* ... */}], [InputContext, {/* ... */}]]}>{/* ... */}</Provider>"

### Claim 10
- **Text:** Helper hooks: `useContextProps` (merge with local) and `useSlottedContext` (read raw slotted value).
- **Target section:** Deep Dive
- **Source URL:** https://react-aria.adobe.com/customization
- **Pulled quote:** "The useContextProps hook merges the local props with the ones provided via context by a parent component."

### Claim 11
- **Text:** `children`/`className`/`style` accept functions receiving render-state objects (`isPressed`, `isSelected`, `isFocused`, `isPending`).
- **Target section:** Example
- **Source URL:** https://react-aria.adobe.com/styling
- **Pulled quote:** "The className and style props also accept functions which receive states for styling."

### Claim 12
- **Text:** Render states also exposed as `data-*` attributes on rendered DOM. Plain CSS or Tailwind selectors work without render functions.
- **Target section:** Best Practices
- **Source URL:** https://react-aria.adobe.com/styling
- **Pulled quote:** "React Aria exposes UI states such as pressed, hovered, and selected using data attributes."

### Claim 13
- **Text:** Collection components are generic over item type (`Select<T extends object>`); type-safe dynamic-collection rendering with `items` + render-function child.
- **Target section:** Composition Pattern Examples
- **Source URL:** https://react-aria.adobe.com/Select
- **Pulled quote:** "export interface SelectProps<T extends object, M extends 'single' | 'multiple'>"

### Claim 14
- **Text:** `slot={null}` opts out of ambient context, using only local props.
- **Target section:** Best Practices
- **Source URL:** https://react-aria.adobe.com/Button
- **Pulled quote:** "An explicit null value indicates that the local props completely override all props received from a parent."

### Claim 15
- **Text:** Long-term: Adobe migrating simpler React Spectrum components to build on React Aria Components.
- **Target section:** Design Thinking
- **Source URL:** https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- **Pulled quote:** "Many of the simpler components in React Spectrum could be updated to build on top of React Aria Components rather than the hooks."

### Claim 16
- **Text:** Unstyled by default; `className`/`style` accept vanilla CSS, Tailwind, CSS-in-JS. Official Tailwind plugin exposes data-state attrs as shorter modifiers.
- **Target section:** Best Practices
- **Source URL:** https://react-aria.adobe.com/styling
- **Pulled quote:** "React Aria does not include any styles by default... A Tailwind CSS plugin is also available."

## Reference URLs

- https://react-aria.adobe.com/blog/introducing-react-spectrum
- https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- https://react-spectrum.adobe.com/releases/2023-12-20.html
- https://react-aria.adobe.com/customization
- https://react-aria.adobe.com/styling
- https://react-aria.adobe.com/Select
- https://react-aria.adobe.com/Button
- https://react-aria.adobe.com/
- https://github.com/adobe/react-spectrum

## Research notes

- Adobe does NOT export a `<Slot>` component (unlike Radix). "Slot" is a string prop on every component + object-keyed value through Context. No `<Slot>` element to render.
- Disambiguate Radix `<Slot>`/`asChild` (merges props onto user-supplied child) vs Adobe slot system (addresses named instances under shared context).
- Prefer render-function children + `composeRenderProps` over the older `render` prop pattern in Examples.
- 1.0 GA was 2023-12-20, not 2024.
