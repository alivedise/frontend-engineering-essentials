---
id: 1610
title: "Oxlint：以 Rust 為基底的 ESLint 接班人與遷移路徑"
state: draft
slug: oxlint
---

# [FEE-1610] Oxlint：以 Rust 為基底的 ESLint 接班人與遷移路徑

:::info
Oxlint 是以 Rust 實作、建構於 Oxc 編譯器堆疊之上的 JavaScript 與 TypeScript linter，於 2025 年 6 月 10 日發布 v1.0 穩定版，宣稱在等價設定下 lint 執行速度約為 ESLint 的 50–100 倍。它已支援 ESLint 核心與多個熱門 plugin 中超過 700 條規則，內建 `@oxlint/migrate` CLI 可將 ESLint flat config 一次轉換為 `.oxlintrc.json`，並於 2025 年 10 月推出預覽版的 JavaScript plugin runtime，讓團隊保留自製 ESLint plugin。生產環境證據包含 Airbnb 在 CI 中以 Oxlint 跨 126,000+ 檔案執行多檔分析僅需 7 秒，而對應 ESLint 規則則直接逾時。本文將 Oxlint 定位為 ESLint 與 Biome 之外的第三選項，並說明對於 lint 步驟主導 CI wall-clock 時間的團隊的遷移路徑。
:::

## 背景

Oxlint 由 Oxc 專案定位為高效能的 JavaScript 與 TypeScript linter，建構於 Oxc 編譯器堆疊之上（[oxc.rs/docs/guide/usage/linter](https://oxc.rs/docs/guide/usage/linter)）。第一個穩定版本於 2025 年 6 月 10 日發布，先前已於 2023 年底首次公開（[voidzero.dev 公告](https://voidzero.dev/posts/announcing-oxlint-1-stable)）。效能是主打訴求：官方穩定版發布部落格指出 Oxlint 執行速度「在相同設定下約為 ESLint 的 50~100 倍」（[oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable)），InfoQ 的獨立報導將此差距歸因於「以 Rust 為基底的架構與共用 Oxc parser」，並引用對 Biome 約 2 倍的優勢（[InfoQ，2025 年 8 月](https://www.infoq.com/news/2025/08/oxlint-v1-released/)）。生產環境證據伴隨基準數據出現：Airbnb 在 CI 中以 Oxlint 跨 126,000+ 檔案執行多檔分析僅需 7 秒，對應 ESLint 規則則直接逾時（[Oxc 穩定版公告](https://oxc.rs/blog/2025-06-10-oxlint-stable)）。對資深前端工程師而言，這項變化改寫了大型程式庫上靜態分析的成本算式。

## 情境

某前端平台團隊維護一個 TypeScript monorepo，跨 packages、apps 與生成程式碼總計約 25 萬個檔案。ESLint 是 CI 中最慢的步驟，在 pre-merge 檢查中針對受影響檔案集需 33 秒，全 repo lint 一次則耗時數分鐘。原本用於本機提早攔截問題的 pre-commit hook 已在 `.husky/` 中停用，因為貢獻者抱怨它打斷互動式開發中的熱重載回饋迴圈。lint 失敗如今只能在 CI 才被攔截，團隊也曾考慮是否要捨棄一層規則以換回速度。Oxlint 在此情境登場，承諾以單秒級的 wall-clock 延遲提供同類正確性規則，且其設定格式與 CLI 表面對齊 ESLint v8，把遷移的認知負擔壓到最小。

## 最佳實踐

- **必須**從 Oxlint 預設的 `correctness` 類別起步。Oxlint 預設啟用 correctness 類別中的規則，並設計成在零設定下也能派上用場（[linter 設定文件](https://oxc.rs/docs/guide/usage/linter/config)）。疊加其他類別應屬刻意決策。
- **應該**透過 `@oxlint/migrate` 推動 ESLint flat-config 遷移，而非以人工逐條翻譯規則。官方遷移路徑就是一條 CLI 指令：`npx @oxlint/migrate <optional-eslint-flat-config-path>`（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。
- **應該**在假定功能對等之前，先比對既有規則集與 Oxlint 的支援清單。Oxlint 已支援 ESLint 核心與多個熱門 plugin 中超過 700 條規則（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)），但覆蓋率尚未涵蓋全部。
- **可以**在某條必要規則尚未移植時，讓 Oxlint 與 ESLint 並行。建議模式為先跑 Oxlint 以低成本檢查快速失敗，再在必要時退回 ESLint（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。
- **可以**在自製或未移植 ESLint plugin 屬關鍵負載時，採用預覽版 JavaScript plugin runtime。預覽版讓團隊在 Oxlint 內保留這些 plugin，同時維持速度優勢（[Oxlint JS plugins 文章，2025 年 10 月](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)）。

## 設計思維

Oxc 團隊的論述是：Oxlint 的架構消除了限制 ESLint 效能的結構性瓶頸（[linter 文件](https://oxc.rs/docs/guide/usage/linter)）。lint pipeline 是在 Oxc 編譯器堆疊上重建，而非就地調校 ESLint。此設計付出的代價具體可見：以發行 Rust 二進位、固定 plugin 介面為代價，換來跨行程平行化、共用 parser 與記憶體配置，進而產出 50–100 倍的數字。代價落在 plugin 邊界。ESLint 的 plugin 生態以 JS 原生為主，仰賴每個 plugin 與 linter 同處一個 Node 行程執行。Oxlint 的 JavaScript plugin runtime 預覽（[2025 年 10 月文章](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)）正是針對該代價的明確回應，讓 JS plugin 與 Rust 核心並行運作，同時保住速度區間。選擇 Oxlint 的團隊接受了二進位發行的表面積，換來足以讓 pre-commit hook 重新可行的 wall-clock 預算。

## 深入探討

2025 年 10 月的 JavaScript plugin runtime 預覽，讓自製或未移植的 ESLint plugin 留在 Oxlint 內，同時保住速度優勢。Oxc 團隊在該文公布的數據顯示「Oxlint 搭配自製 JS plugin 為 236 ms ……ESLint 多執行緒為 3,710 ms ……即使對上 ESLint 全新的多執行緒 runner，Oxlint 仍快 15 倍」（[Oxlint JS plugins 文章](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins)）。對資深工程師而言，含義在於：先前那個「保留 ESLint，否則失去 plugin 相容性」的二元選擇已不再成立；JS plugin runtime 為長尾的內部 lint 規則提供了 Oxlint 的逃生口，且即便對上 ESLint 自家多執行緒 runner，仍量得 15 倍的差距。預覽狀態對風險容忍取捨有影響，但架構方向已經確立。

## 圖解

| 工具／模式 | 同一 repo 上的 wall-clock | 來源 |
|---|---|---|
| Oxlint（多執行緒） | 615.3 ms | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| ESLint | 33.481 s | [oxc.rs/blog/2025-06-10-oxlint-stable](https://oxc.rs/blog/2025-06-10-oxlint-stable) |
| Oxlint 規模化（10 執行緒、101 條規則） | 264,925 個檔案上 22.5 秒（約 10,000 檔案／秒） | [voidzero.dev 公告](https://voidzero.dev/posts/announcing-oxlint-1-stable) |
| Oxlint 搭配自製 JS plugin（預覽） | 236 ms | [Oxlint JS plugins 文章](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins) |
| ESLint 多執行緒（與 JS plugin 列為同 repo） | 3,710 ms | [Oxlint JS plugins 文章](https://oxc.rs/blog/2025-10-09-oxlint-js-plugins) |

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

## 從 ESLint 遷移

遷移路徑取決於專案使用哪一種 ESLint 設定格式。

**Flat config（ESLint v9+，或 v8 搭配 `eslint.config.js`）。** 一次執行官方遷移工具（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）：

```bash
npx @oxlint/migrate <optional-eslint-flat-config-path>
```

該指令會根據 flat config 的規則與覆寫產出 `.oxlintrc.json`。

**舊版 `.eslintrc.*`。** 此類設定無法由 `@oxlint/migrate` 自動遷移（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。先轉換為 flat config（例如透過 `@eslint/migrate-config`），再對產出的 flat config 執行 `@oxlint/migrate`。

**覆蓋率比對。** Oxlint 已支援 ESLint 核心與多個熱門 plugin 中超過 700 條規則（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。執行遷移工具後，將產出的 `.oxlintrc.json` 與原 ESLint 設定進行 diff，找出未順利攜帶過去的規則。

**並行退回方案。** 當 Oxlint 缺少必要規則時，建議模式為讓 Oxlint 與 ESLint 並行。由於 Oxlint 比 ESLint 快上許多，先跑 Oxlint 以提早捕捉錯誤，再在必要時退回 ESLint（[migrate-from-eslint 文件](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)）。在 package scripts 中：

```json
{
  "scripts": {
    "lint": "oxlint && eslint ."
  }
}
```

## 內部參考

- [FEE-1601 Linting & Static Analysis](/zh-tw/Developer%20Experience%20and%20Tooling/1601) — 奠定 ESLint 與 Biome 框架的基礎 lint 文章；Oxlint 以第三選項並列其旁。
- [FEE-1611 Biome v2](/zh-tw/Developer%20Experience%20and%20Tooling/biome-v2) — 同屬 Rust 工具鏈的平行文章；Oxlint 以 ESLint 設定相容性與 JS plugin runtime 區隔。
- [FEE-1602 Code Formatting & EditorConfig](/zh-tw/Developer%20Experience%20and%20Tooling/1602) — formatter 議題與本文聚焦的 linter 議題分屬兩條軌道。

## 參考資料

- Oxc project, "Linter," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter
- Oxc project, "Linter Configuration," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/config
- Oxc project, "Migrate from ESLint," Oxc docs (2025). https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- Oxc project, "Announcing Oxlint 1.0 Stable," Oxc blog (2025). https://oxc.rs/blog/2025-06-10-oxlint-stable
- Oxc project, "Oxlint JavaScript Plugins," Oxc blog (2025). https://oxc.rs/blog/2025-10-09-oxlint-js-plugins
- VoidZero, "Announcing Oxlint 1 Stable," VoidZero blog (2025). https://voidzero.dev/posts/announcing-oxlint-1-stable
- InfoQ, "Oxlint v1 Released," InfoQ news (2025). https://www.infoq.com/news/2025/08/oxlint-v1-released/
- Oxc project, "oxlint-migrate," GitHub repository (2025). https://github.com/oxc-project/oxlint-migrate
