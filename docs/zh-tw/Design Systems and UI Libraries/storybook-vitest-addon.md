---
id: 912
title: Storybook Vitest Addon 與元件測試堆疊
state: draft
slug: storybook-vitest-addon
category: Design Systems and UI Libraries
level: mid
---

# [FEE-912] Storybook Vitest Addon 與元件測試堆疊

:::info
Storybook Vitest addon 會把每一個 story 轉換成 Vitest 元件測試，透過 Playwright 在真實 Chromium 瀏覽器中執行，並在 Vite 專案中取代較舊的 `@storybook/test-runner` 工作流程。它把煙霧測試的渲染檢查、`play()` 互動斷言、axe-core 無障礙與 Vitest 覆蓋率收攏到單一測試執行器，並且不再需要常駐的 Storybook 伺服器。Stories 成為測試語料，CI 呼叫 `vitest --project=storybook` 一道命令即可。
:::

## 背景

Storybook 元件測試已經歷兩個世代。第一代 `@storybook/test-runner` 包裝 Jest 與 Playwright，需要一個已建置並服務中的 Storybook 實例，才能驅動 headless 瀏覽器走訪每個 story 的 URL。第二代 Vitest addon 採取另一條路徑：直接把 stories 轉換成 Vitest 測試。官方文件介紹這套堆疊「將你的 stories 轉換為元件測試，在真實瀏覽器環境中測試元件的渲染與行為」（Storybook 文件，"Vitest addon"）。對 Vite 專案而言，Storybook 團隊明確引導使用者離開舊版 runner——test-runner 的 README 寫著：「If you're using Storybook in a Vite-based project, you might want to use Storybook's Vitest integration instead」（`storybookjs/test-runner` README）。這兩段陳述為本文後續定下基調：在 Vite 上，Vitest addon 是現在建議的路徑，test-runner 則作為 Webpack 設定的回退方案。

## 視覺對比

兩種堆疊在數個對 CI 設定有意義的面向上各有差別。下表整理 Storybook 文件記載的對照，包含「a basic story is also a smoke test, which we call a render test」所描述的煙霧加 play 模型（Storybook 文件，"Writing tests"）。

| 面向 | `@storybook/test-runner`（legacy） | Storybook Vitest addon |
| --- | --- | --- |
| 是否需要 Storybook 執行中 | 是——必須有已建置並服務的實例 | 否——在 Vite 下使用可攜式 stories |
| 執行環境 | 對著服務中的 Storybook 開 headless 瀏覽器 | Vitest browser mode（真實瀏覽器） |
| 底層執行器 | Jest + Playwright | Vitest 3.x + Playwright provider |
| 覆蓋率工具 | `@storybook/addon-coverage`（Istanbul） | Vitest providers（預設 `@vitest/coverage-v8`） |
| a11y 整合方式 | 外部呼叫 | 每個 story 透過 `parameters.a11y.test` 控管 axe-core |
| 煙霧 + play 模型 | 渲染檢查 + play 斷言 | 渲染檢查 + play 斷言（同樣形狀） |

## 範例

一個 Vite + Storybook 9 專案會把 addon 接到 Vitest 設定上。瀏覽器 provider 是 Playwright Chromium，並有一個 setup 檔把 Storybook annotations 套到所有以測試身分匯入的 stories。下方結構對應 Vitest addon 文件的片段，文件列出 `setupFiles: ['./.storybook/vitest.setup.ts']` 以及一個含有 `provider: playwright({})`、`headless: true` 與 `instances: [{ browser: 'chromium' }]` 的 browser 區塊。

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

接著由 `play()` 函式驅動互動測試，使用來自 `storybook/test` 的 `expect()` 與 `userEvent`。互動測試文件指出「The expect utility here combines the methods available in Vitest's expect as well as those from @testing-library/jest-dom」，因此 `toBeInTheDocument()` 之類的 DOM matcher 可以與數值 matcher 並存。

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

當 `vitest --project=storybook` 執行時，addon 會為每個 story 跑一次煙霧渲染，並對有定義 `play()` 的 story 執行該函式內容。

## 最佳實踐

- **MUST** 在 Vitest 3.0 或之後版本，搭配 Vite-based 的 Storybook framework 執行；addon 文件將「Vitest ≥ 3.0」與「Storybook framework that uses Vite」列為前置條件。
- **MUST** 使用 Vitest browser mode，不要使用 `node` 或 `forks` pool。Plugin 會匯入 `@vitest/browser/context`，在 forks 下執行會出現 `storybookjs/storybook#32444` 回報的錯誤：「@vitest/browser/context can be imported only inside the Browser Mode. Your test is running in forks pool.」Storybook 9 也基於這個原因只支援 browser mode。
- **SHOULD** 以 Playwright provider 搭配 Chromium 驅動瀏覽器；Vitest addon 文件指出「Browser mode ensures your components are tested in a real browser environment, which is more accurate than simulations like JSDom or HappyDom.」
- **SHOULD** 透過 `parameters.a11y.test` 為每個 story 設定無障礙嚴重度。無障礙測試文件定義三個值「determine test behavior when run with the Vitest addon」：`'off'` 跳過檢查、`'todo'` 回報警告、`'error'` 讓測試失敗。

## 設計思維

Vitest addon 與 test-runner 之間的關鍵分界，在於測試驅動端是否需要常駐的 Storybook 伺服器。Vitest addon 文件把這個取捨講得很直接：「The test runner requires a running Storybook instance to test your stories... The Vitest plugin... transforms your stories into tests using Vite and portable stories, so it does not need to run Storybook to test your stories.」拿掉執行中的伺服器可降低 CI 啟動成本與環境飄移面，代價是把測試堆疊綁在 Vite。因此 Webpack-based 的 Storybook 專案仍留在 test-runner，而 Vite-based 專案則獲得更快、可攜式更高的流水線。

## 深入探討

兩個內部細節對校準預期很重要。第一，addon 沿著兩條路徑執行每個 story：煙霧渲染與（若有定義）play 函式。Vitest addon 文件描述為「Stories are tested in two ways: a smoke test to ensure it renders and, if a play function is defined, that function is run and any assertions made within it are validated.」沒有 `play()` 的 story 仍能貢獻渲染覆蓋率。第二，覆蓋率數字以 story 語料為範圍。Test coverage 文件提醒「Coverage is calculated using the stories you've written, not the entire codebase.」因此這個數字反映的是 stories 對元件表面行使的廣度，並非整個應用程式的絕對完整度指標。

## 從 test-runner 遷移

Migration guide 一開始就點出一項事實：「You **do not** have to change how you write your stories between the test-runner and the Vitest addon.」Story 形狀、args 與 `play()` 內容維持不變，差異全部落在工具與 CI 設定上。

典型的遷移會從 `package.json` 移除 `@storybook/test-runner` 與 `@storybook/addon-coverage`，把 `test-storybook` 腳本換成 `vitest --project=storybook`，並拿掉先建置並服務 Storybook 的 CI 步驟。Migration guide 直接點明這個 CI 變化：「There is no need to build and run Storybook to run tests, which makes the setup faster and more portable.」

覆蓋率透過切換 provider 沿用。Test coverage 文件指出 addon 讓團隊「choose which provider, v8 (default) or Istanbul, to use for coverage calculation」；`@vitest/coverage-v8` 由 addon 的 postinstall 步驟自動安裝。無障礙則透過啟用 Storybook a11y addon 沿用，無障礙測試文件描述它「built on top of Deque's axe-core library, which automatically catches up to 57% of WCAG issues」，並透過上文提到的 `parameters.a11y.test` 閘門與 Vitest addon 整合。

## 延伸閱讀

- [FEE-904 Storybook & Component Documentation](/zh-tw/Design%20Systems%20and%20UI%20Libraries/904)

## 參考資料

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
