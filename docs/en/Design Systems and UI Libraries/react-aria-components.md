---
id: 913
title: React Aria Components — Adobe's Contexts & Slots Composition Model
state: draft
slug: react-aria-components
category: Design Systems and UI Libraries
level: senior
---

# [FEE-913] React Aria Components — Adobe's Contexts & Slots Composition Model

:::info
React Aria Components (RAC) is Adobe's unstyled component layer that sits on top of the React Aria hooks, exposing every accessible behavior as JSX while keeping the lower-level hooks reachable for edge cases. Its composition model centers on a paired React context per component plus a `slot` string prop for distinguishing named children under the same context. RAC reached 1.0 GA on 20 December 2023, and its slot system is distinct from Radix `<Slot>`/`asChild`, addressing a different problem.
:::

## Context

Adobe shipped React Spectrum, React Aria, and React Stately together in July 2020 as a three-library trio. The introduction post explains the split directly: "React Spectrum includes three libraries: React Spectrum — A React implementation of Spectrum, Adobe's design system. React Aria — A library of React Hooks that provides accessible UI primitives for your design system. React Stately — A library of React Hooks that provides cross-platform state management and core logic for your design system." The factoring is layered by concern: state lives in React Stately, ARIA behavior and keyboard wiring live in React Aria, and rendered Spectrum visuals live in the top library. Adobe's own description is that "React Spectrum splits each component into three parts: state, behavior, and the rendered component." Consumers pick the layer that matches how much of their own design system they want to keep.

The hook layer is powerful, but Adobe's own RFC acknowledged a real adoption ceiling: "we have also received feedback that it has a very steep learning curve, and that the APIs are complex and hard to put together." Stitching `useButton`, `useFocusRing`, `usePress`, `useHover`, and several state hooks together for a single accessible component became a recurring tax for teams that just wanted a styled button with the right ARIA semantics.

React Aria Components is the answer. The RFC describes it as "a library of unstyled components implementing ARIA patterns. It is implemented as a thin layer on top of our existing React Aria hooks." The two layers are designed to interoperate: "The components and hooks also work together, allowing them to be mixed and matched depending on the level of customization required." A team can adopt the components for 90% of UI and drop down to the hooks for the cases that need bespoke DOM. RAC reached 1.0 GA on 20 December 2023, with Adobe announcing on the release page: "After a year of work, we are happy to announce the GA release of React Aria Components."

## Visual

| Axis | React Aria (hook layer) | React Aria Components (RAC) |
| --- | --- | --- |
| Framework | React hooks; consumer renders all DOM | React components; DOM rendered by the library |
| Styling | Consumer styles every element from scratch | `className` / `style` / `data-*` selectors on rendered DOM |
| Complexity | Higher; multiple hooks composed per pattern | Lower; one component per ARIA pattern |
| Customisability | Maximum; any DOM, any markup | High; render-function children plus context-based prop injection |

## Example

The example below shows a `<Button>` placed inside a custom `ButtonContext` provider. The button reads `slot="confirm"` from its props, and the provider injects extra props for that slot only. The render-function child reads RAC's render-state object so styling responds to interaction state.

```tsx
import { Button, ButtonContext } from 'react-aria-components';

function ConfirmDialog() {
  return (
    <ButtonContext.Provider
      value={{
        slots: {
          confirm: { className: 'btn btn-primary', autoFocus: true },
          cancel: { className: 'btn btn-ghost' },
        },
      }}
    >
      <Button slot="cancel">Cancel</Button>
      <Button slot="confirm">
        {({ isPressed, isPending }) =>
          isPending ? 'Saving...' : isPressed ? 'Saving!' : 'Save'
        }
      </Button>
    </ButtonContext.Provider>
  );
}
```

The render-function child pattern is documented on the styling page: "The className and style props also accept functions which receive states for styling." Render states surfaced here include `isPressed`, `isSelected`, `isFocused`, and `isPending`.

## Best Practices

- **SHOULD** prefer `data-*` attribute selectors over render-function children when the styling rule is purely visual. The styling docs state: "React Aria exposes UI states such as pressed, hovered, and selected using data attributes." Plain CSS or Tailwind selectors target these directly without forcing the consumer into the function-child syntax.
- **MAY** opt a component out of an ambient context with `slot={null}` when the component happens to live under a provider but should ignore it. The `<Button>` reference says: "An explicit null value indicates that the local props completely override all props received from a parent." Use this when wrapping RAC primitives inside other RAC primitives that share a context type.
- **SHOULD** treat RAC as unstyled by default and choose one styling approach per surface. The styling docs state plainly: "React Aria does not include any styles by default... A Tailwind CSS plugin is also available." The official Tailwind plugin maps RAC's `data-*` attributes to shorter modifier names; vanilla CSS, CSS Modules, and CSS-in-JS all work because the contract is just attributes on real DOM.

## Deep Dive

Two helper hooks expose the machinery that powers the slot system. `useContextProps` is the merge primitive: per the customization docs, "The useContextProps hook merges the local props with the ones provided via context by a parent component." Every RAC component calls this internally so user-supplied props win over context-supplied props except where merging is defined (e.g., refs, event handlers, class names). Custom components that want to participate in the same composition contract call `useContextProps(localProps, ref, SomeContext)` and receive a merged `[props, ref]` tuple back.

`useSlottedContext` is the read primitive when a component needs to inspect the raw context value before merging. It returns the value associated with the current `slot` key, or the unscoped value when no slot is set. Custom wrappers that need to branch on whether a parent provided context at all use this hook rather than `useContext` directly, because the RAC contract is `{ slots: { [slotName]: props } }` rather than a flat props object.

The collection components (`Select`, `ListBox`, `Menu`, `ComboBox`, `Tree`, `GridList`, `Table`, `TagGroup`) are generic over their item type. The `Select` reference shows the signature `export interface SelectProps<T extends object, M extends 'single' | 'multiple'>`, which propagates to the `items` and `children` render-function arguments. Type-safe dynamic-collection rendering follows the `<Select items={users}>{user => <Item key={user.id}>{user.name}</Item>}</Select>` shape, where `user` is inferred as the element type of `items` rather than `unknown`.

## Composition Pattern Examples

**Pattern 1 — paired context per component.** Every RAC component exports a context: the customization docs say "Each React Aria Component exports a corresponding context that you can use to build your own compositional APIs similar to the built-in components." `ButtonContext`, `ListBoxContext`, `LabelContext`, `InputContext`, and so on are all importable, and each accepts `{ slots, ...defaultProps }` shaped values. A consumer who wraps a section of the tree with `<ButtonContext.Provider value={...}>` injects defaults into every nested `<Button>` without prop-drilling.

**Pattern 2 — `slot` string prop addresses one named child.** The customization docs define slots as "named children within a component that have separate behaviors and styles." A `<NumberField>` containing increment and decrement buttons sets `slot="increment"` and `slot="decrement"` on its two `<Button>` children; both share `ButtonContext`, but each picks up different injected props from the slot map. This is how RAC distinguishes "the button that submits" from "the button that cancels" without exporting two different button types.

**Pattern 3 — `<Provider>` utility composes multiple contexts.** Nesting many providers manually gets noisy. The customization docs document the helper: `<Provider values={[[ButtonContext, {/* ... */}], [InputContext, {/* ... */}]]}>{/* ... */}</Provider>`. A custom field component that wants to set defaults for both labels and inputs sets both keys in one `<Provider>` rather than nesting providers four levels deep.

**Pattern 4 — type-safe collections with render-function children.** Collection components carry their item type through generics: `SelectProps<T extends object, M extends 'single' | 'multiple'>`. Passing `items={users}` lets TypeScript infer the render-function argument as `User`, so `<Select items={users}>{user => <Item id={user.id}>{user.name}</Item>}</Select>` type-checks without a manual generic annotation.

**Pattern 5 — render-function `children` / `className` / `style`.** The styling docs confirm: "The className and style props also accept functions which receive states for styling." When CSS-only `data-*` selectors cannot express the rule (e.g., conditional content, not just conditional styles), the function-child form receives `isPressed`, `isSelected`, `isFocused`, `isPending`, and friends.

**Disambiguation note vs. Radix.** Adobe does NOT export a `<Slot>` component. In RAC, "slot" is a string prop on every component and an object key in the `{ slots: { [name]: props } }` value passed through Context. There is no `<Slot>` element to render. Radix's `<Slot>` and `asChild` solve a different problem: they merge props onto a user-supplied child element so a single child becomes the rendered DOM node. RAC's slot system addresses many named instances under one shared context. The two patterns are not interchangeable, and a team migrating between the libraries needs to translate intent rather than rename tokens.

## Design Thinking

Adobe's long-term plan, stated in the RFC, is that "Many of the simpler components in React Spectrum could be updated to build on top of React Aria Components rather than the hooks." The upper styled library (React Spectrum) becomes a thin theming layer over RAC, while the hooks remain available for components that genuinely need bespoke DOM. Three-layer architecture collapses toward two layers in the common case, with the hook escape hatch reserved for the hard 5%.

## Related Topics

- [Zag.js and Ark UI](/en/Design%20Systems%20and%20UI%20Libraries/zag-and-ark-ui)
- [Headless Component Libraries](/en/Design%20Systems%20and%20UI%20Libraries/902)

## References

- Adobe, "Introducing React Spectrum," React Spectrum blog (2020). https://react-aria.adobe.com/blog/introducing-react-spectrum
- Adobe, "RFC: React Aria Components," react-spectrum GitHub (2023). https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- Adobe, "December 20, 2023 Release," React Spectrum releases (2023). https://react-spectrum.adobe.com/releases/2023-12-20.html
- Adobe, "Advanced Customization," React Aria docs. https://react-aria.adobe.com/customization
- Adobe, "Styling," React Aria docs. https://react-aria.adobe.com/styling
- Adobe, "Select," React Aria docs. https://react-aria.adobe.com/Select
- Adobe, "Button," React Aria docs. https://react-aria.adobe.com/Button
- Adobe, "React Aria," React Aria docs home. https://react-aria.adobe.com/
- Adobe, "react-spectrum," GitHub repository. https://github.com/adobe/react-spectrum
