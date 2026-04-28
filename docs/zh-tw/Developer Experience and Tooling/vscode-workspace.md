---
id: 1617
title: "共用的 VS Code 工作區設定與 extensions.json 推薦清單"
state: draft
slug: vscode-workspace
---

# [FEE-1617] 共用的 VS Code 工作區設定與 `extensions.json` 推薦清單

:::info
Visual Studio Code 將設定切分為使用者範圍（每位開發者個人設定檔）與工作區範圍（每個專案隨版本控制提交的 `.vscode/` 資料夾）。工作區範圍涵蓋四個標準檔案 `settings.json`、`extensions.json`、`launch.json`、`tasks.json`，以及供多根目錄使用的選用 `*.code-workspace`。把 `.vscode/` 視為提交到版控的契約，可消除「在我這台編輯器上沒問題」這類失敗：每次 clone 都會獲得相同的格式化工具、相同的推薦擴充、相同的除錯入口、相同的任務圖。本文說明這份契約、其背後的優先順序規則，以及每個檔案應該與不該放入哪些內容。
:::

## 背景

VS Code 把設定區分為兩個儲存位置。使用者設定「全域套用到任何開啟的 VS Code 實例」；工作區設定「儲存於工作區內，只在開啟該工作區時生效」（[VS Code, "User and Workspace Settings"](https://code.visualstudio.com/docs/configure/settings)）。工作區檔案儲存於磁碟上的固定路徑：「VS Code 將工作區設定儲存在專案根目錄的 `.vscode` 資料夾中」（同一資料來源）。這樣的拆分讓專案儲存庫具備自我描述能力：團隊成員 clone 專案後即可繼承工作區設定，不必從其他開發者的個人設定檔複製任何內容。

擴充套件遵循相同模式。Marketplace 文件指出：「一組好的擴充套件能讓特定工作區或程式語言的開發更有生產力，你通常會想把這份清單分享給團隊或同事」，並說明 `Extensions: Configure Recommended Extensions (Workspace Folder)` 指令「會在工作區的 `.vscode` 資料夾中建立 `extensions.json` 檔案，你可在其中加入擴充套件識別碼（`{publisherName}.{extensionName}`）清單」（[VS Code, "Extension Marketplace"](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)）。當工作區首次被開啟時，VS Code 會提示使用者安裝這些推薦項目。

`.vscode/` 資料夾因此成為一份提交到版控的契約：它將專案的編輯器期待與原始碼一同編碼，因此會經過程式碼審查並保留分支歷史。資料夾中其餘的檔案（`launch.json` 提供除錯入口，`tasks.json` 編排建置與測試流程）也將同一份契約延伸至除錯與任務自動化。

## 情境

一位新工程師加入團隊並在 VS Code 開啟儲存庫。在尚未察覺專案以 Biome 為標準工具之前，他安裝了五個彼此重疊的擴充：ESLint、Prettier、兩款 import 排序器，以及一款 JSON 驗證器，每一款都在儲存時與 Biome 的格式化器互相衝突。兩天後，另一位工程師推送的 commit 讓所有人的 ESLint 壞掉：他在使用者範圍的 `eslint.options` 默默覆寫了工作區設定，導致他的本地建置通過、CI 卻失敗。

這兩種失敗模式有著相同根因：團隊沒有一份提交到版控的編輯器契約。兩種狀況的修法也相同。新增 `.vscode/extensions.json`，將 `recommendations` 設為 `["biomejs.biome"]`、`unwantedRecommendations` 設為 `["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]`，讓第一位開發者被引導至 Biome，並避開有衝突的工具。新增 `.vscode/settings.json`，於工作區範圍鎖定格式化器與語言覆寫設定，這樣第二位開發者機器上任何使用者範圍的偏移都會在開啟工作區的當下被覆寫。這份提交到版控的 `.vscode/` 契約，把上述狀況從反覆發生的事故轉為一次性設定。

## 最佳實踐

- **必須**將 `.vscode/settings.json`、`.vscode/extensions.json`、`.vscode/launch.json` 及 `.vscode/tasks.json` 提交到版本控制，當它們編碼了團隊共同的期待時：每個檔案都位於「專案根目錄的 `.vscode` 資料夾」，正是為了能隨儲存庫流動（[VS Code, "User and Workspace Settings"](https://code.visualstudio.com/docs/configure/settings)）。
- **必須不**嘗試提交應用程式範圍的設定（更新、遙測、安全性）：「與更新及安全性相關的應用程式範圍設定無法被工作區設定覆寫……為了強化安全性，這類設定僅能於使用者設定中定義，不可在工作區範圍設定」（同一資料來源）。將這些設定放入 `.vscode/settings.json`，最好的情況也只是被默默忽略。
- **必須不**依賴 Settings Sync 來協調團隊設定。Settings Sync 涵蓋的是「設定、鍵盤快速鍵、使用者程式碼片段、使用者任務、UI 狀態、擴充套件、設定檔」，全部屬於使用者範圍（[VS Code, "Settings Sync"](https://code.visualstudio.com/docs/configure/settings-sync)）。工作區檔案（`.vscode/*`、`*.code-workspace`）透過 VCS 提交，永遠不會被同步。
- **應該**為每個儲存庫精選 `recommendations`，讓首次開啟者看到聚焦的提示：VS Code「會在工作區首次被開啟時，提示使用者安裝推薦的擴充套件」（[VS Code, "Extension Marketplace"](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)）。一份 30 項的清單會訓練開發者忽略提示；一份 3 至 7 項的清單則會讓他們真的安裝。
- **應該**為與專案所選工具相衝突的擴充填入 `unwantedRecommendations`，藉此抑制 VS Code 在該工作區自身的 marketplace 建議（[microsoft/vscode `extensionsFileTemplate.ts`](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/common/extensionsFileTemplate.ts)）。
- **應該**記住優先序串接為 User → Remote → Workspace → Workspace Folder → Language-specific，「後段範圍會覆寫前段範圍」（[VS Code, "User and Workspace Settings"](https://code.visualstudio.com/docs/configure/settings)）。對專案相關的鍵，工作區設定刻意勝過開發者的使用者範圍。
- **可以**在多儲存庫或 monorepo 情境中使用 `*.code-workspace` 檔案，當需要把多個資料夾以單一邏輯工作區開啟時（[VS Code, "Multi-root Workspaces"](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces)）。

## 設計思維

組織本文其餘所有內容的單一校準軸，是使用者範圍與工作區範圍之間的界線。工作區檔案隨 VCS 流通並送達每一份 clone；使用者檔案隨 Settings Sync 流通並送達單一開發者的每一台機器。兩種傳輸通道從未交疊，假裝它們會交疊正是團隊不一致的成因。

該界線強制三項具體的取捨：

1. *涵蓋面 vs. 自主性。* 在工作區範圍鎖定格式化器可確保團隊一致，但會讓某項設定脫離每位開發者使用者範圍的掌控。共用鍵在僵局時由工作區獲勝；這就是設計重點。
2. *嚴格性 vs. 可攜性。* 應用程式範圍與安全性範圍的設定根本無法在工作區範圍指定，因此任何「為團隊鎖定遙測」的願望都必須在 VS Code 之外執行（組織政策、MDM）。這條界線是刻意的：工作區檔案屬於儲存庫內容，不可被允許削弱主機端的安全性。
3. *推薦廣度 vs. 訊號強度。* `recommendations` 是柔性提示，並非強制要求；過度堆疊會稀釋訊號，並訓練開發者忽略安裝對話框。一份精短、精選過的清單，能完成一份冗長清單反而抹滅的工作。

Settings Sync 的範圍劃分提供有用的反例。它刻意只同步使用者範圍：工作區與機器可覆寫的設定皆在通道之外，因為跨機器同步儲存庫內容會覆寫儲存庫本身的宣告。這道分界正是契約所在。

## 深入探討

**物件合併 vs. 原始型別覆寫。** 當同一個鍵在多個範圍中被指定時，「原始型別與陣列型別的值會被覆寫，意指優先序較高範圍中的設定會取代另一範圍中的值。然而物件型別的值會被合併」（[VS Code, "User and Workspace Settings"](https://code.visualstudio.com/docs/configure/settings)）。實務上這代表使用者範圍的 `editor.tokenColorCustomizations` 物件會與工作區範圍的物件逐鍵 *合併*，而使用者範圍的 `eslint.validate` 陣列則會被工作區陣列整體 *取代*。把兩者搞混就會產生默默的偏移。

**複合啟動設定。** 單一個 `Run` 動作可啟動多個除錯工作階段：「你可以在 `launch.json` 檔案的 `compounds` 屬性中定義複合啟動設定」（[VS Code, "Debugging Configuration"](https://code.visualstudio.com/docs/debugtest/debugging-configuration)）。常見用法是把 Node 伺服器加上前端開發伺服器附掛為單一邏輯工作階段。

**任務組合。** 任務「以 `dependsOn` 屬性將較簡單的任務組合成複合任務」。兩種語意值得注意：「若你在 `dependsOn` 屬性列出多個任務，預設會以平行方式執行」以及「若指定 `\"dependsOrder\": \"sequence\"`，則任務相依會依 `dependsOn` 中列出的順序執行」（[VS Code, "Tasks"](https://code.visualstudio.com/docs/debugtest/tasks)）。預設為平行；序列組合需主動啟用。誤以為預設是序列的建置流程，當平行分支首次競爭共用輸出時就會產生不確定的失敗。

**多根目錄優先序。** 在 `*.code-workspace` 內部，「全域工作區設定會覆寫使用者設定，資料夾設定可以覆寫工作區或使用者設定」，但「多根目錄工作區只套用資源（檔案、資料夾）類設定。影響整個編輯器的設定（例如 UI 排版）會被忽略」於資料夾範圍（[VS Code, "Multi-root Workspaces"](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces)）。資料夾層級的覆寫鎖定檔案資源類設定；視窗層級的 UI 設定則停留在工作區根層級。

## 圖解

設定優先序階梯，並把 Settings Sync 傳輸通道以平行箭頭呈現，僅觸及使用者範圍。

```mermaid
flowchart LR
  subgraph Sync["Settings Sync（僅使用者範圍）"]
    direction LR
    UA[機器 A：使用者] <--> UB[機器 B：使用者]
  end

  U[使用者] --> R[遠端]
  R --> W[工作區<br/>.vscode/settings.json]
  W --> F[工作區資料夾<br/>僅多根目錄]
  F --> L["語言特定<br/>[language].editor.*"]

  Sync -.僅觸及使用者.-> U

  classDef vcs fill:#e6f0ff,stroke:#2b6cb0,color:#1a365d;
  classDef sync fill:#fef3c7,stroke:#b45309,color:#7c2d12;
  class W,F vcs;
  class UA,UB sync;
```

階梯的閱讀方式：由左至右的鏈結中，每一階都會覆寫前一階。工作區範圍（提交至 VCS）覆寫使用者範圍（透過 Settings Sync 同步），這正是 `.vscode/` 資料夾的全部目的。語言特定區塊會覆寫其非語言特定的對應項，即便該非語言範圍本身已較窄也是如此。

## 範例

一份最小但貼近實務的 `.vscode/`，適用採用 Biome 的 Node + TypeScript 專案。

`.vscode/extensions.json`：

```json
{
  "recommendations": [
    "biomejs.biome",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer"
  ],
  "unwantedRecommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

`recommendations` 陣列使用 `${publisher}.${extension}` 識別碼，與 marketplace 文件所述完全一致（[VS Code, "Extension Marketplace"](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)）。`unwantedRecommendations` 在此工作區抑制 VS Code 對 ESLint 與 Prettier 的自身建議，依據的是 [microsoft/vscode `extensionsFileTemplate.ts`](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/common/extensionsFileTemplate.ts) 中的 schema。

`.vscode/settings.json`：

```json
{
  "editor.tabSize": 2,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

語言特定區塊會針對 `.ts` 與 `.json` 檔案覆寫非語言特定的預設值，即便使用者範圍的設定原本會勝出。

`.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug server",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["--import", "tsx"],
      "console": "integratedTerminal"
    }
  ]
}
```

必填的 `type`、`request`、`name` 鍵搭配 `version: "0.2.0"`，遵循文件記載的 schema（[VS Code, "Debugging Configuration"](https://code.visualstudio.com/docs/debugtest/debugging-configuration)）。

`.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "pnpm",
      "args": ["build"]
    },
    {
      "label": "test",
      "type": "shell",
      "command": "pnpm",
      "args": ["test"]
    },
    {
      "label": "ci",
      "dependsOn": ["build", "test"],
      "dependsOrder": "sequence"
    }
  ]
}
```

`ci` 任務會先執行 `build` 再執行 `test`，因為 `dependsOrder` 設為 `"sequence"`；若未設定，兩者會平行執行（[VS Code, "Tasks"](https://code.visualstudio.com/docs/debugtest/tasks)）。

## .vscode/ 檔案參考

逐檔說明用途、schema 來源，以及把錯誤內容放入各檔案會造成的失敗模式。

| 檔案 | 用途 | Schema 來源 | 不該放入此處的內容 |
| --- | --- | --- | --- |
| `.vscode/settings.json` | 工作區範圍的編輯器與語言設定，於工作區開啟時套用。 | [VS Code, "User and Workspace Settings"](https://code.visualstudio.com/docs/configure/settings) | 應用程式範圍設定（更新、遙測、安全性）：它們無法在工作區範圍被覆寫，會被忽略。機器範圍設定：歸屬使用者範圍。個人偏好（字型家族、色彩主題）：保留於使用者範圍，避免覆寫團隊成員。 |
| `.vscode/extensions.json` | 每個工作區的擴充套件推薦清單，以及該工作區欲抑制的 VS Code 建議擴充清單。 | [VS Code, "Extension Marketplace"](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)；`unwantedRecommendations` 來自 [microsoft/vscode `extensionsFileTemplate.ts`](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/common/extensionsFileTemplate.ts) | 個別開發者偏好的所有編輯器擴充大雜燴：當提示過於雜亂時就會被忽略。專案實際並未使用之工具的廠商特定擴充。 |
| `.vscode/launch.json` | `version: "0.2.0"` 下的除錯設定，每筆需含必填的 `type`、`request`、`name`，以及選用的 `compounds`。 | [VS Code, "Debugging Configuration"](https://code.visualstudio.com/docs/debugtest/debugging-configuration) | 來自個別開發者機器的絕對路徑：請改用 `${workspaceFolder}` 等變數。秘密（權杖、密碼）：`launch.json` 會被提交至版控。 |
| `.vscode/tasks.json` | 工作區範圍的任務圖：以 `dependsOn` 組合 shell 或 process 任務，搭配選用的 `dependsOrder`。 | [VS Code, "Tasks"](https://code.visualstudio.com/docs/debugtest/tasks) | 個人 shell 別名或臨時指令：歸屬使用者任務。假設 `dependsOn` 為序列的任務：預設為平行；當順序攸關時，請設定 `"dependsOrder": "sequence"`。 |
| `*.code-workspace` | 多根目錄工作區描述檔：以 `folders`、`settings`、`extensions` 鍵描述以單一工作區開啟的多個資料夾。 | [VS Code, "Multi-root Workspaces"](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces) | 在資料夾範圍指定 UI 排版設定：會被忽略；資料夾層級僅套用資源類設定。檔案若隨儲存庫一同發佈，避免使用絕對資料夾路徑：請偏好相對路徑以維持工作區的可攜性。 |

## 內部參考

- [Editor & IDE Integration (LSP)](/zh-tw/Developer%20Experience%20and%20Tooling/1606)：涵蓋更廣的 LSP 與擴充套件介面；本文聚焦於覆蓋其上的 *已提交* `.vscode/` 儲存庫契約。
- [Code Formatting & EditorConfig](/zh-tw/Developer%20Experience%20and%20Tooling/1602)：`.vscode/settings.json` 與 `.editorconfig` 在格式化器行為上有所重疊；EditorConfig 檔案是跨編輯器的共同底線，而 `.vscode/settings.json` 在其上加入 VS Code 特有的覆寫。

## 參考資料

- Microsoft, "User and Workspace Settings," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/configure/settings
- Microsoft, "Extension Marketplace," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/configure/extensions/extension-marketplace
- Microsoft, "Debugging Configuration," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/debugtest/debugging-configuration
- Microsoft, "Tasks in Visual Studio Code," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/debugtest/tasks
- Microsoft, "Workspaces in Visual Studio Code," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/editing/workspaces/workspaces
- Microsoft, "Multi-root Workspaces," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces
- Microsoft, "Settings Sync," VS Code Documentation (n.d.). https://code.visualstudio.com/docs/configure/settings-sync
- Microsoft, "extensionsFileTemplate.ts," microsoft/vscode (GitHub source). https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/extensions/common/extensionsFileTemplate.ts
