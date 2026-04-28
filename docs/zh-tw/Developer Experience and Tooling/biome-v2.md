---
id: 1611
title: "Biome v2：型別感知的 lint + 格式化 + assists 工具鏈"
state: draft
slug: biome-v2
---

# [FEE-1611] Biome v2：型別感知的 lint + 格式化 + assists 工具鏈

:::info
Biome 是以 Rust 打造的工具鏈，將格式化器、linter 以及（v2 新增的）Assists 子系統整合在同一個二進位檔內，支援 JavaScript、TypeScript、JSX、JSON、CSS 與 GraphQL。其格式化器與 Prettier 的相容度達到 97%；linter 內建 450 條以上規則，來源涵蓋 ESLint 與 typescript-eslint。v2（代號「Biotype」）是首款不依賴 TypeScript 編譯器即可提供型別感知 lint 規則的 JS/TS linter，這項能力被收斂在 `types` linter domain 之後，啟用後才會按需啟動專案級檔案掃描器與自研推論引擎。本文涵蓋 v2 的功能面、如何安全地啟用 domain，以及由內建 `migrate` 指令驅動的 v1 → v2 升級路徑。
:::

## 背景

Biome 自我定位為「為網頁專案打造的高效能工具鏈」，目標是「提供開發者工具來維持這些專案的健康度」（biomejs/biome README）。單一二進位檔在同一個 Rust 行程中提供三個層面：格式化器、linter 與（v2 新增的）Assists。

在格式化層面，Biome 以對齊 Prettier 為目標：README 描述其為「適用於 JavaScript、TypeScript、JSX、JSON、CSS 與 GraphQL 的快速格式化器，與 Prettier 的相容度達 97%」。在 lint 層面，同一份 README 描述 linter「具備來自 ESLint、typescript-eslint 與其他來源的 450 條以上規則」。

v2（代號「Biotype」）在 Biome 部落格上正式發表，宣稱是「*首款*在不依賴 TypeScript 編譯器的前提下提供型別感知 lint 規則的 JavaScript 與 TypeScript linter」。這項能力搭配一個專案級檔案掃描器，文件描述其「掃描專案內的所有檔案並建立索引，類似 IDE 中 LSP 服務的作法」，將 Biome 從單檔檢查的範疇拉出，啟用跨檔案分析。

## 情境

考慮一個採用 2024 年代慣用組合的 TypeScript 倉庫：以 ESLint 搭配 `@typescript-eslint/parser`、將 `parserOptions.project` 指向 `tsconfig.json` 以啟用型別感知規則、以 Prettier 處理格式化、自訂 `eslint-plugin-import` 設定處理 `organize-imports`，並透過 pre-commit hook 依序執行上述工具。CI 的 lint 時間被 typescript-eslint 的型別檢查所主導；編輯器顯示的診斷訊息會因最後執行的工具不同而出現落差；新進貢獻者在第一個 commit 落地之前，必須學會三份設定檔（`.eslintrc`、`.prettierrc`、`tsconfig.json`）。

Biome v2 將上述介面收斂為一個二進位檔與一份設定檔（`biome.json`），並把型別感知檢查收在 `types` domain 之後，僅在啟用相關規則時才讓專案載入推論引擎與檔案掃描器。

## 最佳實踐

- **必須**透過啟用對應的 linter domain 來宣告框架專屬的規則群組，避免逐條啟用規則。Domain 文件指出「在 Next.js 專案內使用此 domain」、「在 lint 測試檔時使用此 domain」等用語（biomejs.dev/linter/domains/），依生態系啟用可讓有效規則集與執行環境保持一致。
- **必須**將 `types` domain 視為一個能力旗標。Biome domain 頁指出「啟用屬於此 domain 的規則時，Biome 會掃描整個專案，*並啟用推論引擎以解析與展平型別*」。啟用 `types` 會啟動掃描器與推論引擎；保持關閉則讓 Biome 維持單檔速度。
- **應該**在加入需要跨檔案分析的規則時啟用 `project` domain。Domain 頁將 `project` 描述為「執行專案層級分析的規則」，因此跨檔案工作屬於這裡，而非 `types`。
- **應該**在出現具體偏離理由之前，將格式化器維持在預設設定。Biome 格式化器宣稱「與 Prettier 相容度 97%」（biomejs/biome README）；偏離預設會降低該倉庫的相容度數字。
- **可以**透過 GritQL 外掛系統（biomejs.dev/linter/plugins/）加入自訂規則，當內建 450 條以上規則無法涵蓋內部模式時使用，並接受 v2 外掛只發出診斷訊息、無自動修復的事實。

## 設計思維

v2 的核心取捨是自研推論引擎對上透過 typescript-eslint 重用 `tsc`。Biome 部落格指出，該引擎「在約 75% 的情境下能偵測到 typescript-eslint 所能偵測的浮動 promise，效能開銷只是其零頭」。這段話標明了取捨的兩端：以量化的召回缺口（`noFloatingPromises` 案例約 75%）換取執行時成本。團隊若需要那 25% 的差距，可保留 typescript-eslint 處理那些規則；團隊若優先考慮 CI 的牆鐘時間，則接受該缺口並讓 Biome 推論引擎處理大宗案例。

Domain 在設定層級編碼了相同的取捨。將 `types` 保持關閉時，Biome 處於單檔模式（無掃描器、無推論引擎）。打開 `types` 時，先支付索引成本，換取目前引擎所支援的型別感知規則。

## 深入探討

**推論引擎。** Biome v2 部落格將推論引擎錨定在一個具體的量化主張上：typescript-eslint 在 `noFloatingPromises` 上發現問題的 75%，「效能開銷只是其零頭」。這是 v2 公告中唯一被引用的召回率數字；其他屬於 `types` domain 的規則繼承同一引擎，但沒有各自被引用的百分比。

**GritQL 外掛。** v2 內附文件位於 biomejs.dev/linter/plugins/ 的外掛系統：「這些外掛讓你比對特定程式碼模式，並為其註冊自訂的診斷訊息」。外掛以 `.grit` 檔案撰寫（GritQL 模式語法），透過 `biome.json` 註冊。v2 外掛只發出診斷訊息；自動修復支援不在 v2 範圍內。

**路線圖脈絡。** 2025 年路線圖文章（biomejs.dev/blog/roadmap-2025/）承諾「推出真正可用版本的 `noFloatingPromises`，並期望進一步涉足型別推論」，並要為 Biome 2.0 加入「真正的多檔支援，這代表 lint 規則將能查詢來自其他檔案的資訊」。這兩項目都標出 v2 目前所交付能力的邊界：推論引擎是頭期款，更廣的型別感知留待後續版本。

## 圖解

Linter domain 與各自解鎖的能力（biomejs.dev/linter/domains/）：

| Domain    | 啟用後讓專案具備                                                                |
|-----------|---------------------------------------------------------------------------------|
| `react`   | React 慣用規則（hooks、JSX、元件模式）                                          |
| `next`    | Next.js 專屬規則（「在 Next.js 專案內使用此 domain」）                          |
| `vue`     | Vue 專屬規則                                                                    |
| `solid`   | Solid 專屬規則                                                                  |
| `qwik`    | Qwik 專屬規則                                                                   |
| `test`    | 測試檔規則（「在 lint 測試檔時使用此 domain」）                                 |
| `project` | 跨檔案的專案層級分析（「執行專案層級分析的規則」）                              |
| `types`   | 觸發點：啟動檔案掃描器與推論引擎以支援型別感知規則                              |

`types` 列是觸發列：啟用 `types` domain 中的任一規則就會讓 Biome「掃描整個專案」並啟用「推論引擎以解析與展平型別」。

## 範例

一份適用於 React + TypeScript 應用程式的 `biome.json`，包含型別感知 lint、框架規則，以及處理 import 整理的 Assists：

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "linter": {
    "enabled": true,
    "domains": {
      "react": "recommended",
      "types": "all",
      "project": "recommended"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": {
          "level": "on"
        }
      }
    }
  },
  "formatter": {
    "enabled": true
  }
}
```

對於採用 per-package override 的 monorepo，巢狀 `biome.json` 透過 `"extends": "//"` 微語法繼承根設定檔。big-projects 指南指出「巢狀設定檔『必須將 `root` 欄位設為 `false`』」，並可使用微語法 `"extends": "//"` 來「繼承**根設定檔**，無論巢狀設定檔位於何處」（biomejs.dev/guides/big-projects/）：

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "root": false,
  "extends": "//",
  "linter": {
    "domains": {
      "test": "recommended"
    }
  }
}
```

要同時取代 ESLint 與 Prettier 的團隊，應從既有工具引導產生設定，而非手動撰寫 `biome.json`。位於 biomejs.dev/guides/migrate-eslint-prettier/ 的遷移指南記錄了專屬子指令 `biome migrate eslint --write` 與 `biome migrate prettier --write`，能將原始設定翻譯為 Biome 等價設定。

## v1 → v2 升級路徑

Biome v1 → v2 指南（biomejs.dev/guides/upgrade-to-biome-v2/）逐一說明四項機械式變更；每一項都對應到具體的設定檔改寫。

**1. 執行 `biome migrate`。** 升級指南指示使用者「執行 `migrate` 指令來更新設定檔」。該指令會原地將 `biome.json` 改寫為 v2 schema，包含 schema URL 升版以及下方涵蓋的所有欄位改名。

**2. `ignore` 與 `include` 合併為 `includes`。** 同一份指南指出：「`ignore` 與 `include` 選項已被移除，並由 `includes` 取代，glob 行為已校正，不再自動補上 `**/`」。兩個後果：
- 過去寫成 `"include": ["src/**/*.ts"]` 加上 `"ignore": ["**/*.test.ts"]` 的設定，現在合併為單一 `"includes": ["src/**/*.ts", "!**/*.test.ts"]` 欄位。
- v1 會默默為裸 glob 補上 `**/`；v2 不再如此。過去在整棵樹任何位置都能匹配的 glob 模式（`"*.config.js"`）現在只匹配根目錄；若想保留原行為，須明確寫成 `**/*.config.js`。

**3. ESLint 與 Prettier 設定檔透過專屬子指令移植。** 來自慣用 ESLint + Prettier 組合的團隊執行 `biome migrate eslint --write` 與 `biome migrate prettier --write`（biomejs.dev/guides/migrate-eslint-prettier/），一步將既有設定翻譯為 Biome 等價設定。

**4. Import Organizer 移入 Assists。** v2 部落格記錄「Import Organizer 成為一個『assist』，這是更廣義的歸納，提供『與 lint 規則中的 _fixes_ 類似但無診斷訊息的 actions』」。升級者的兩項後續工作：
- 原本獨立的 `organizeImports` 頂層欄位已不存在；改於 `assist.actions.source.organizeImports.level` 設定該動作（見「範例」）。
- v2 organizer 經過重寫，會合併同模組 import 並支援自訂排序順序，因此即使在預設設定下，升級後的輸出 diff 可能與 v1 organizer 的結果並不逐位元組相同。

## 內部參考

- [FEE-1601 Linting & Static Analysis](/zh-tw/Developer%20Experience%20and%20Tooling/1601) — Biome v2 屬於型別感知 lint 範疇，與 ESLint + typescript-eslint 並列；FEE-1611 是 Biome v2 的權威深度文。
- [FEE-1602 Code Formatting & EditorConfig](/zh-tw/Developer%20Experience%20and%20Tooling/1602) — Biome 格式化器以 97% Prettier 相容度為目標，是團隊原地替換 Prettier 的橋樑。
- [FEE-1610 Oxlint](/zh-tw/Developer%20Experience%20and%20Tooling/1610) — 兄弟 Rust linter，定位不同：Oxlint 是直接替換的快速 ESLint 取代品；Biome v2 則是「單一工具鏈、型別感知」。

## 參考資料

- biomejs, "biomejs/biome — README," GitHub (2025). https://github.com/biomejs/biome
- biomejs, "Biome v2," Biome blog (2025). https://biomejs.dev/blog/biome-v2/
- biomejs, "Roadmap 2025," Biome blog (2025). https://biomejs.dev/blog/roadmap-2025/
- biomejs, "Upgrade to Biome v2," Biome guides (2025). https://biomejs.dev/guides/upgrade-to-biome-v2/
- biomejs, "Migrate from ESLint and Prettier," Biome guides (2025). https://biomejs.dev/guides/migrate-eslint-prettier/
- biomejs, "Big projects," Biome guides (2025). https://biomejs.dev/guides/big-projects/
- biomejs, "Linter domains," Biome documentation (2025). https://biomejs.dev/linter/domains/
- biomejs, "Linter plugins," Biome documentation (2025). https://biomejs.dev/linter/plugins/
- biomejs, "Assist," Biome documentation (2025). https://biomejs.dev/assist/
