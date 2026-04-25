---
topic: Storybook Vitest Addon & Component Testing Stack
id: 912
slug: storybook-vitest-addon
sources_reviewed: 10
claims: 16
---

# Findings: Storybook Vitest Addon & Component Testing Stack

**Proposed topic-specific section:** `## Migration from test-runner`.

## Claims

### Claim 1
- **Text:** Vitest addon transforms stories into Vitest component tests in real browser; replaces `@storybook/test-runner` for Vite projects.
- **Target section:** Context
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- **Pulled quote:** "Storybook's Vitest addon allows you to test your components directly inside Storybook. On its own, it transforms your stories into component tests, which test the rendering and behavior of your components in a real browser environment."

### Claim 2
- **Text:** Storybook recommends migrating from test-runner to Vitest addon when using Vite.
- **Target section:** Context
- **Source URL:** https://github.com/storybookjs/test-runner
- **Pulled quote:** "If you're using Storybook in a Vite-based project, you might want to use Storybook's Vitest integration instead."

### Claim 3
- **Text:** Requires Vitest ≥ 3.0 and a Vite-based Storybook framework.
- **Target section:** Best Practices
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- **Pulled quote:** "Vitest ≥ 3.0" / "Storybook framework that uses Vite"

### Claim 4
- **Text:** Recommended runtime is Vitest browser mode driven by Playwright Chromium, not jsdom/happy-dom.
- **Target section:** Best Practices
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- **Pulled quote:** "Browser mode ensures your components are tested in a real browser environment, which is more accurate than simulations like JSDom or HappyDom."

### Claim 5
- **Text:** Stories run two ways: smoke render-test and full play-function with assertions.
- **Target section:** Deep Dive
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- **Pulled quote:** "Stories are tested in two ways: a smoke test to ensure it renders and, if a play function is defined, that function is run and any assertions made within it are validated."

### Claim 6
- **Text:** Vitest addon does NOT require a running Storybook instance because it uses portable stories under Vite.
- **Target section:** Design Thinking
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- **Pulled quote:** "The test runner requires a running Storybook instance to test your stories... The Vitest plugin...transforms your stories into tests using Vite and portable stories, so it does not need to run Storybook to test your stories."

### Claim 7
- **Text:** A11y per-story gated by `parameters.a11y.test`: `'off'`, `'todo'` (warning), `'error'` (failing).
- **Target section:** Best Practices
- **Source URL:** https://storybook.js.org/docs/writing-tests/accessibility-testing
- **Pulled quote:** "Determines test behavior when run with the Vitest addon." (`'off'`, `'todo'`, `'error'`).

### Claim 8
- **Text:** A11y addon built on Deque axe-core; integrates with Vitest addon.
- **Target section:** Migration from test-runner
- **Source URL:** https://storybook.js.org/docs/writing-tests/accessibility-testing
- **Pulled quote:** "It is built on top of Deque's axe-core library, which automatically catches up to 57% of WCAG issues."

### Claim 9
- **Text:** Interaction tests use `play()` with `expect()` and `userEvent` from `storybook/test` (combines Vitest expect + Testing Library matchers).
- **Target section:** Example
- **Source URL:** https://storybook.js.org/docs/writing-tests/interaction-testing
- **Pulled quote:** "The expect utility here combines the methods available in Vitest's expect as well as those from @testing-library/jest-dom"

### Claim 10
- **Text:** Vitest config: `storybookTest()` plugin, browser mode w/ Playwright provider, setupFiles `./.storybook/vitest.setup.ts`.
- **Target section:** Example
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- **Pulled quote:** "setupFiles: ['./.storybook/vitest.setup.ts']" with `browser: { enabled: true, provider: playwright({}), headless: true, instances: [{ browser: 'chromium' }] }`.

### Claim 11
- **Text:** Coverage uses Vitest providers; `@vitest/coverage-v8` default. Auto-installed by addon postinstall.
- **Target section:** Migration from test-runner
- **Source URL:** https://storybook.js.org/docs/writing-tests/test-coverage
- **Pulled quote:** "You can choose which provider, v8 (default) or Istanbul, to use for coverage calculation."

### Claim 12
- **Text:** Coverage is calculated against existing stories, not the full codebase. Barometer, not completeness target.
- **Target section:** Deep Dive
- **Source URL:** https://storybook.js.org/docs/writing-tests/test-coverage
- **Pulled quote:** "Coverage is calculated using the stories you've written, not the entire codebase."

### Claim 13
- **Text:** Migration removes `@storybook/test-runner` + `@storybook/addon-coverage`; script becomes `vitest --project=storybook`. CI no longer needs to build/serve Storybook.
- **Target section:** Migration from test-runner
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/migration-guide
- **Pulled quote:** "There is no need to build and run Storybook to run tests, which makes the setup faster and more portable."

### Claim 14
- **Text:** Story syntax does NOT change between test-runner and Vitest addon.
- **Target section:** Migration from test-runner
- **Source URL:** https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/migration-guide
- **Pulled quote:** "You **do not** have to change how you write your stories between the test-runner and the Vitest addon."

### Claim 15
- **Text:** Storybook 9: only Vitest browser mode supported. Node/forks pool fails because plugin imports `@vitest/browser/context`.
- **Target section:** Best Practices
- **Source URL:** https://github.com/storybookjs/storybook/issues/32444
- **Pulled quote:** "@vitest/browser/context can be imported only inside the Browser Mode. Your test is running in forks pool."

### Claim 16
- **Text:** Smoke-and-play model: a basic story without play function still functions as a render test.
- **Target section:** Visual
- **Source URL:** https://storybook.js.org/docs/writing-tests
- **Pulled quote:** "A basic story is also a smoke test, which we call a render test."

## Reference URLs

- https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/migration-guide
- https://storybook.js.org/docs/writing-tests/accessibility-testing
- https://storybook.js.org/docs/writing-tests/interaction-testing
- https://storybook.js.org/docs/writing-tests/test-coverage
- https://storybook.js.org/docs/writing-tests
- https://storybook.js.org/blog/component-test-with-storybook-and-vitest/
- https://storybook.js.org/blog/storybook-test-sneak-peek/
- https://github.com/storybookjs/test-runner
- https://github.com/storybookjs/storybook/issues/32444

## Research notes

- Use `storybook/test` (no `@`) as the import path; older docs reference `@storybook/test`.
- Storybook 9 renamed `@storybook/experimental-addon-test` → `@storybook/addon-vitest`.
- "Only browser mode supported" is informally documented; phrase as "browser mode is the only supported mode in Storybook 9".
