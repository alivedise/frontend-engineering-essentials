---
id: 912
title: Storybook Vitest Addon & Component Testing Stack
state: draft
slug: storybook-vitest-addon
category: Design Systems and UI Libraries
level: mid
---

# [FEE-912] Storybook Vitest Addon & Component Testing Stack

:::info
The Storybook Vitest addon turns every story into a Vitest component test that runs in a real Chromium browser via Playwright, replacing the older `@storybook/test-runner` workflow for Vite projects. It folds smoke render checks, `play()` interaction assertions, axe-core accessibility, and Vitest coverage into one runner that no longer needs a live Storybook server. Stories become the test corpus, and `vitest --project=storybook` is the one command CI invokes.
:::

## Context

Storybook component testing has gone through two generations. The first generation, `@storybook/test-runner`, wrapped Jest plus Playwright and required a built-and-served Storybook instance to drive a headless browser through each story URL. The second generation, the Vitest addon, takes a different route: it transforms stories into Vitest tests directly. The official documentation introduces it as a stack that "transforms your stories into component tests, which test the rendering and behavior of your components in a real browser environment" (Storybook docs, "Vitest addon"). For Vite-based projects, the Storybook team explicitly redirects users away from the older runner — the test-runner README states, "If you're using Storybook in a Vite-based project, you might want to use Storybook's Vitest integration instead" (`storybookjs/test-runner` README). Together those statements set the expectation for the rest of this article: on Vite, Vitest addon is now the recommended path, and test-runner stays as the fallback for Webpack-based setups.

## Visual

The two stacks differ on several axes that matter at CI-config time. The table below summarizes the contrast Storybook documents, including the smoke-and-play model where "a basic story is also a smoke test, which we call a render test" (Storybook docs, "Writing tests").

| Axis | `@storybook/test-runner` (legacy) | Storybook Vitest addon |
| --- | --- | --- |
| Needs Storybook running | Yes — built and served instance required | No — uses portable stories under Vite |
| Runtime environment | Headless browser against served Storybook | Vitest browser mode (real browser) |
| Underlying runner | Jest + Playwright | Vitest 3.x + Playwright provider |
| Coverage tooling | `@storybook/addon-coverage` (Istanbul) | Vitest providers (`@vitest/coverage-v8` default) |
| A11y integration | External invocation | Per-story `parameters.a11y.test` gating axe-core |
| Smoke + play model | Render check + play assertions | Render check + play assertions (same shape) |

## Example

A Vite + Storybook 9 project wires the addon into its Vitest config. The browser provider is Playwright Chromium, and a setup file applies Storybook annotations to every story imported as a test. The shape below mirrors the snippet shown in the Vitest addon docs, which lists `setupFiles: ['./.storybook/vitest.setup.ts']` and a browser block with `provider: playwright({})`, `headless: true`, and `instances: [{ browser: 'chromium' }]`.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser/providers/playwright'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
})
```

A `play()` function then drives an interaction test using `expect()` and `userEvent` from `storybook/test`. The interaction-testing docs note that "The expect utility here combines the methods available in Vitest's expect as well as those from @testing-library/jest-dom", so DOM matchers like `toBeInTheDocument()` work alongside numeric matchers.

```ts
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from './Button'

const meta: Meta<typeof Button> = { component: Button }
export default meta

export const Clicks: StoryObj<typeof Button> = {
  args: { label: 'Save' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Save' })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}
```

When `vitest --project=storybook` runs, the addon executes a smoke render for every story and the `play()` body for stories that define one.

## Best Practices

- **MUST** run on Vitest 3.0 or later with a Vite-based Storybook framework, since the addon documentation lists "Vitest ≥ 3.0" and a "Storybook framework that uses Vite" as prerequisites.
- **MUST** use Vitest browser mode rather than `node` or `forks` pools. The plugin imports `@vitest/browser/context`, and running it under forks fails with the error reported in `storybookjs/storybook#32444`: "@vitest/browser/context can be imported only inside the Browser Mode. Your test is running in forks pool." Storybook 9 only supports browser mode for this reason.
- **SHOULD** drive the browser with the Playwright provider and Chromium, because the Vitest addon docs state that "Browser mode ensures your components are tested in a real browser environment, which is more accurate than simulations like JSDom or HappyDom."
- **SHOULD** gate accessibility severity per story through `parameters.a11y.test`. The accessibility-testing docs define three values that "determine test behavior when run with the Vitest addon": `'off'` skips checks, `'todo'` reports a warning, and `'error'` fails the test.

## Design Thinking

The decision that distinguishes the Vitest addon from the test-runner is whether the test driver needs a live Storybook server. The Vitest addon docs articulate the trade explicitly: "The test runner requires a running Storybook instance to test your stories... The Vitest plugin... transforms your stories into tests using Vite and portable stories, so it does not need to run Storybook to test your stories." Removing the running server cuts CI startup cost and the surface area for environment drift, at the cost of binding the test stack to Vite. Webpack-based Storybook projects therefore stay on test-runner; Vite-based ones get a faster, more portable pipeline.

## Deep Dive

Two internal details matter for calibrating expectations. First, the addon executes each story along two pathways: a smoke render and, when present, the play function. The Vitest addon docs describe this as "Stories are tested in two ways: a smoke test to ensure it renders and, if a play function is defined, that function is run and any assertions made within it are validated." Stories without `play()` still contribute render coverage. Second, coverage numbers are scoped to the story corpus. The test-coverage docs caution that "Coverage is calculated using the stories you've written, not the entire codebase," so the figure functions as a barometer of how widely stories exercise the component surface, not as an absolute completeness metric for the application.

## Migration from test-runner

The migration guide highlights one fact upfront: "You **do not** have to change how you write your stories between the test-runner and the Vitest addon." Story shape, args, and `play()` bodies stay identical, so the diff lives entirely in tooling and CI.

A typical migration removes `@storybook/test-runner` and `@storybook/addon-coverage` from `package.json`, replaces the `test-storybook` script with `vitest --project=storybook`, and drops the CI step that builds and serves Storybook before tests. The migration guide frames this CI shift directly: "There is no need to build and run Storybook to run tests, which makes the setup faster and more portable."

Coverage carries over with a provider switch. The test-coverage docs note that the addon lets teams "choose which provider, v8 (default) or Istanbul, to use for coverage calculation"; `@vitest/coverage-v8` is auto-installed by the addon's postinstall step. Accessibility carries over by enabling the Storybook a11y addon, which the accessibility-testing docs describe as "built on top of Deque's axe-core library, which automatically catches up to 57% of WCAG issues" and which integrates with the Vitest addon through the `parameters.a11y.test` gates introduced above.

## Related Topics

- [FEE-904 Storybook & Component Documentation](/en/Design%20Systems%20and%20UI%20Libraries/904)

## References

- Storybook, "Vitest addon," Storybook docs (2025). https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- Storybook, "Vitest addon migration guide," Storybook docs (2025). https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/migration-guide
- Storybook, "Accessibility testing," Storybook docs (2025). https://storybook.js.org/docs/writing-tests/accessibility-testing
- Storybook, "Interaction testing," Storybook docs (2025). https://storybook.js.org/docs/writing-tests/interaction-testing
- Storybook, "Test coverage," Storybook docs (2025). https://storybook.js.org/docs/writing-tests/test-coverage
- Storybook, "Writing tests," Storybook docs (2025). https://storybook.js.org/docs/writing-tests
- Storybook, "Component test with Storybook and Vitest," Storybook blog (2024). https://storybook.js.org/blog/component-test-with-storybook-and-vitest/
- Storybook, "Storybook Test sneak peek," Storybook blog (2024). https://storybook.js.org/blog/storybook-test-sneak-peek/
- Storybook, "test-runner README," GitHub `storybookjs/test-runner` (2025). https://github.com/storybookjs/test-runner
- Storybook, "Issue #32444: forks pool error," GitHub `storybookjs/storybook` (2025). https://github.com/storybookjs/storybook/issues/32444
