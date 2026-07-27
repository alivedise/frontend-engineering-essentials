---
id: 1610
title: "Oxlint：以 Rust 為基底的 ESLint 接班人與遷移路徑"
state: draft
slug: oxlint
reviewed: hardened
reviewed_on: 2026-07-24
---

# [FEE-1610] Oxlint：以 Rust 為基底的 ESLint 接班人與遷移路徑

:::info
Oxlint 是以 Rust 實作、建構於 Oxc 編譯器堆疊之上的 JavaScript 與 TypeScript linter，於 2025 年 6 月 10 日發布 v1.0 穩定版，宣稱在等價設定下 lint 執行速度約為 ESLint 的 50–100 倍。截至 2026 年年中，它已支援 ESLint 核心與多個熱門 plugin 中超過 800 條規則，內建 `@oxlint/migrate` CLI 可將 ESLint flat config 一次轉換為 `.oxlintrc.json`，並持續沿著 1.7x 發行線推進：JavaScript plugin runtime 於 2026 年 3 月進入 alpha 階段，與 ESLint v9+ plugin API 幾近完整相容；而型別感知（type-aware）lint——團隊留在 ESLint 搭配 typescript-eslint 的經典理由——則在 2026 年 7 月 22 日正式穩定，由以 Go 撰寫的 tsgolint 引擎驅動。生產環境證據包含 Airbnb 在 CI 中以 Oxlint 跨 126,000+ 檔案執行多檔分析僅需 7 秒，而對應 ESLint 規則則直接逾時。本文將 Oxlint 定位為 ESLint 與 Biome 之外的第三選項，並說明其遷移路徑——包含型別感知與 JS plugin 這兩條逃生口——適用於 lint 步驟主導 CI wall-clock 時間的團隊。
:::

## 背景

Oxlint 由 Oxc 專案定位為高效能的 JavaScript 與 TypeScript linter，建構於 Oxc 編譯器堆疊之上（[oxc.rs/docs/guide/usage/linter](https://oxc.rs/docs/guide/usage/linter)）。第一個穩定版本於 2025 年 6 月 10 日發布，先前已於 2023 年底首次公開（[voidzero.dev 公告](https://voidzero.dev/posts/announcing-oxlint-1-stable)）。效能是主打訴求：官方穩定版發布部落格指出 Oxlint 執行速度「在相同設定下約為 ESLint 的 50~100 倍」（[oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable)），InfoQ 的報導則轉述 Oxc 團隊自家基準測試中對 Biome 約 2 倍優勢的說法（[InfoQ，2025 年 8 月](https://www.infoq.com/news/2025/08/oxlint-v1-released/)）。生產環境證據伴隨基準數據出現：Airbnb 在 CI 中以 Oxlint 跨 126,000+ 檔案執行多檔分析僅需 7 秒，對應 ESLint 規則則直接逾時（[Oxc 穩定版公告](https://oxc.rs/blog/2025-06-10-oxlint-stable)）。

Lint 的 wall-clock 時間會隨檔案數與規則成本增長。VoidZero 的基準測試量得 Oxlint 以 10 執行緒對 264,925 個真實檔案執行 101 條規則，耗時 22.5 秒（[voidzero.dev 公告](https://voidzero.dev/posts/announcing-oxlint-1-stable)），而同一份穩定版公告中記載的 Airbnb 126,000 個檔案案例，也在生產環境中呈現相同效果：原本會逾時的 lint 流程，如今在 CI 中 7 秒內即可完成。以這樣的 wall-clock 成本來看，同一套流程也足以塞進 pre-commit hook 的預算。自 2025 年 6 月那次發行以來，Oxlint 持續推出新版本；截至 2026 年年中，已進入 1.7x 發行線，JavaScript plugin runtime 處於 alpha 階段，型別感知 lint 也已正式穩定（詳見下方「設計思維」與「深入探討」）。

## 圖解

| 工具／模式 | 基準測試結果 | 來源 |
|---|---|---|
| Oxlint（多執行緒） | 615.3 ms | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| ESLint | 33.481 s | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| Oxlint 規模化（10 執行緒、101 條規則） | 264,925 個檔案上 22.5 秒（約 10,000 檔案／秒） | [voidzero.dev 公告](https://voidzero.dev/posts/announcing-oxlint-1-stable) |
| Oxlint 搭配 JS plugin 對比 ESLint，相同規則集（Node.js repo，202 條規則：104 條內建 Rust + 75 條 JS plugin + 23 條自製 JS，6,298 個檔案） | 21 秒 對比 1 分 43 秒（約 4.8 倍） | [Oxlint JS Plugins Alpha 文章](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha) |
| Oxlint + tsgolint（型別感知）對比 ESLint + typescript-eslint（VS Code、TypeORM 基準測試） | 快 12–18 倍 | [型別感知 lint 穩定版文章](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable) |

## 範例

將 Oxlint 安裝為 dev dependency，並接到 npm scripts。CLI 表面對齊 ESLint，包含 `--fix` 旗標（[linter 文件](https://oxc.rs/docs/guide/usage/linter)）：

```bash
pnpm add -D oxlint
```

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

設定檔放在 `.oxlintrc.json`。格式刻意對齊 ESLint v8 的形狀，並支援 JSONC 註解（[linter 設定文件](https://oxc.rs/docs/guide/usage/linter/config)）：

```jsonc
{
  // Categories enable rule sets with similar intent. By default Oxlint
  // enables rules in the correctness category.
  "categories": {
    "correctness": "error"
  },
  "rules": {
    // Override a single rule on top of the category default.
    "no-console": "warn"
  }
}
```

即使在沒有 `.oxlintrc.json` 的情況下首次執行，仍能產出有用輸出，因為 correctness 類別預設為開啟（[linter 設定文件](https://oxc.rs/docs/guide/usage/linter/config)）。

Oxlint 也接受具型別的 TypeScript 設定檔 `oxlint.config.ts`（或 `.mts`）作為 `.oxlintrc.json` 的替代方案；兩種格式無法在同一目錄中並存（[linter 設定文件](https://oxc.rs/docs/guide/usage/linter/config)）：

```ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: { correctness: 'error' },
});
```

## 最佳實踐

- **必須**從 Oxlint 預設的 `correctness` 類別起步。Oxlint 預設啟用 correctness 類別中的規則，並設計成在零設定下也能派上用場（[linter 設定文件](https://oxc.rs/docs/guide/usage/linter/config)）。疊加其他類別應屬刻意決策。
- **應該**透過 `@oxlint/migrate` 推動 ESLint flat-config 遷移，而非以人工逐條翻譯規則。官方遷移路徑就是一條 CLI 指令：`npx @oxlint/migrate <optional-eslint-flat-config-path>`（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。
- **應該**在假定功能對等之前，先比對既有規則集與 Oxlint 的支援清單。截至 2026 年年中，Oxlint 已支援 ESLint 核心與多個熱門 plugin 中超過 800 條規則（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)），且此數字會隨每次發行成長，應視為下限而非固定值。
- **應該**在 ESLint 設定仰賴 typescript-eslint 的型別感知規則時，啟用 `--type-aware`（由 `oxlint-tsgolint` 套件支援）。覆蓋率為 typescript-eslint 61 條型別感知規則中的 59 條（[型別感知使用文件](https://oxc.rs/docs/guide/usage/linter/type-aware.html)）。
- **可以**在某條必要規則尚未移植時，讓 Oxlint 與 ESLint 並行，並在 ESLint 設定中安裝 `eslint-plugin-oxlint` 以停用 Oxlint 已涵蓋的規則（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。
- **可以**在自製或未移植的 ESLint plugin 屬關鍵負載時，採用自 2026 年 3 月起進入 alpha 階段的 JavaScript plugin runtime。它直接對接 ESLint v9+ plugin API，因此多數既有 plugin 無需改寫即可運作（[JS Plugins Alpha 文章](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha)；[JS plugins 文件](https://oxc.rs/docs/guide/usage/linter/js-plugins)）。

## 設計思維

Oxc 團隊的論述是：Oxlint 的架構消除了限制 ESLint 效能的結構性瓶頸（[linter 文件](https://oxc.rs/docs/guide/usage/linter)）。lint pipeline 是在 Oxc 編譯器堆疊上重建，而非就地調校 ESLint。此設計付出的代價具體可見：以發行 Rust 二進位為代價，換來多執行緒平行化、共用 parser 與記憶體配置，進而產出 50–100 倍的數字。代價最先落在 plugin 邊界。ESLint 的 plugin 生態以 JS 原生為主，每個 plugin 都與 linter 同處一個 Node 行程執行——這是 Oxlint 原生的 Rust 規則集無法直接沿用的設計。

JavaScript plugin runtime 正是 Oxc 團隊對這道落差的回應。它自 2026 年 3 月起進入 alpha 階段，在原始 plugin 自身的測試套件上通過率達 99.6–100%（ESLint 核心測試 33,006 項全數通過，ESLint Stylistic 則為 99.99%），並支援 TypeScript plugin、自動修復與 IDE 整合；Oxc 團隊表示多數既有 ESLint plugin 如今無需改寫即可直接運作（[JS Plugins Alpha 文章](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha)；[JS plugins 文件](https://oxc.rs/docs/guide/usage/linter/js-plugins)）。框架專屬 plugin（例如 Vue 或 Svelte 支援）則仍待補齊。這個 runtime 較早、2025 年 10 月的預覽版曾發布一組基準數據，同一篇文章後續的編輯註記將其稱為「嚴重高估」，原因是 Oxlint 當時的一個錯誤導致許多檔案上的 JS plugin 被略過執行，使比較結果失效（[Oxlint JS plugins 預覽文章](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)）；上方 alpha 階段的數據已取代該版本。選擇 Oxlint 的團隊接受了尚存的框架 plugin 落差，換來 JS plugin runtime 與 Rust 核心共同提供的 wall-clock 預算。

## 深入探討

型別感知（type-aware）lint 是 typescript-eslint 用來執行需要完整 TypeScript type-checker 輸出的檢查類別，例如 `no-unsafe-assignment` 與 `no-floating-promises`，也是 ESLint 遷移到 Oxlint 過程中最後一塊重大缺口：預覽版於 2025 年 8 月推出，alpha 版（43 條規則）於 2025 年 12 月推出，直到 2026 年 7 月 22 日才正式穩定。Oxlint 的解法是 tsgolint v7——一個獨立的 Go 二進位程式，建構於 typescript-go（也就是 TypeScript v7 底層所使用的 Go 重寫版）之上，而非 Oxlint 其餘部分所使用的 Rust 核心。

這個切分是架構層級的。Oxlint 的 Rust 行程負責檔案走訪、設定處理，以及約 800 條非型別感知規則。tsgolint 則建立一次 TypeScript 程式（program），對其執行型別感知檢查，再將結果回報給 Oxlint 行程。啟用方式只需一個旗標：`oxlint --type-aware`，由 `oxlint-tsgolint@7` 套件支援。覆蓋率為 typescript-eslint 61 條型別感知規則中的 59 條，Oxc 團隊在 VS Code 與 TypeORM 上的基準測試顯示，這套組合對比 ESLint 搭配 typescript-eslint 執行相同規則集時快上 12–18 倍（[型別感知 lint 穩定版文章](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable)；[型別感知使用文件](https://oxc.rs/docs/guide/usage/linter/type-aware.html)；[tsgolint 儲存庫](https://github.com/oxc-project/tsgolint)）。

## 從 ESLint 遷移

遷移路徑取決於專案使用哪一種 ESLint 設定格式。

**Flat config（ESLint v9+，或 v8 搭配 `eslint.config.js`）。** 一次執行官方遷移工具（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）：

```bash
npx @oxlint/migrate <optional-eslint-flat-config-path>
```

該指令會根據 flat config 的規則與覆寫產出 `.oxlintrc.json`。

**舊版 `.eslintrc.*`。** 此類設定無法由 `@oxlint/migrate` 自動遷移（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。先轉換為 flat config（例如透過 `@eslint/migrate-config`），再對產出的 flat config 執行 `@oxlint/migrate`。

**覆蓋率比對。** 截至 2026 年年中，Oxlint 已支援 ESLint 核心與多個熱門 plugin 中超過 800 條規則（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。執行遷移工具後，將產出的 `.oxlintrc.json` 與原 ESLint 設定進行 diff，找出未順利攜帶過去的規則。

**型別感知規則。** 若 ESLint 設定仰賴 typescript-eslint 的型別感知規則，可在 flat-config 遷移完成後執行 `oxlint --type-aware`（需要 `oxlint-tsgolint` 套件）；它涵蓋 typescript-eslint 61 條型別感知規則中的 59 條（[型別感知使用文件](https://oxc.rs/docs/guide/usage/linter/type-aware.html)）。剩下的兩條規則，以及其他任何尚未移植的規則，則交由下方的並行退回方案處理。

**並行退回方案。** 當 Oxlint 仍缺少必要規則時，建議模式為讓 Oxlint 與 ESLint 並行，並在 ESLint 設定中安裝 `eslint-plugin-oxlint`，關閉所有 Oxlint 已涵蓋的規則（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)；[eslint-plugin-oxlint 儲存庫](https://github.com/oxc-project/eslint-plugin-oxlint)）。Oxlint 先執行以低成本檢查快速失敗，ESLint 則只執行尚未移植的剩餘規則，而非完整規則集。在 package scripts 中：

```json
{
  "scripts": {
    "lint": "oxlint && eslint ."
  }
}
```

## 延伸閱讀

- [FEE-1601 Linting & Static Analysis](/zh-tw/Developer%20Experience%20and%20Tooling/1601) — 奠定 ESLint 與 Biome 框架的基礎 lint 文章；Oxlint 以第三選項並列其旁。
- [FEE-1611 Biome v2](/zh-tw/Developer%20Experience%20and%20Tooling/biome-v2) — 同屬 Rust 工具鏈的平行文章；Oxlint 以 ESLint 設定相容性與 JS plugin runtime 區隔。
- [FEE-1602 Code Formatting & EditorConfig](/zh-tw/Developer%20Experience%20and%20Tooling/1602) — formatter 議題與本文聚焦的 linter 議題分屬兩條軌道。

## 參考資料

- Oxc project, "Linter," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter
- Oxc project, "Linter Configuration," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/config
- Oxc project, "Migrate from ESLint," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- Oxc project, "Announcing Oxlint 1.0 Stable," Oxc blog (2025). https://oxc.rs/blog/2025-06-10-oxlint-stable
- Oxc project, "Oxlint JavaScript Plugins," Oxc blog (2025; benchmark figures corrected 18 Oct 2025). https://oxc.rs/blog/2025-10-09-oxlint-js-plugins
- Oxc project, "Oxlint JS Plugins Alpha," Oxc blog (2026). https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha
- Oxc project, "JS Plugins," Oxc docs (2026). https://oxc.rs/docs/guide/usage/linter/js-plugins
- Oxc project, "Type-Aware Linting Stable," Oxc blog (2026). https://oxc.rs/blog/2026-07-22-type-aware-linting-stable
- Oxc project, "Type-Aware Linting," Oxc docs (2026). https://oxc.rs/docs/guide/usage/linter/type-aware.html
- Oxc project, "tsgolint," GitHub repository (2026). https://github.com/oxc-project/tsgolint
- Oxc project, "eslint-plugin-oxlint," GitHub repository (2026). https://github.com/oxc-project/eslint-plugin-oxlint
- VoidZero, "Announcing Oxlint 1 Stable," VoidZero blog (2025). https://voidzero.dev/posts/announcing-oxlint-1-stable
- InfoQ, "Oxlint v1 Released," InfoQ news (2025). https://www.infoq.com/news/2025/08/oxlint-v1-released/
- Oxc project, "oxlint-migrate," GitHub repository (2025). https://github.com/oxc-project/oxlint-migrate
