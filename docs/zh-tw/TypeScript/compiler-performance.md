---
id: 1716
title: TypeScript 編譯器效能
state: draft
slug: compiler-performance
category: TypeScript
level: senior
---

# [FEE-1716] TypeScript 編譯器效能

:::info
TypeScript 的編譯時間與編輯器反應速度，受少數 build-time 開關、幾項診斷工具，以及幾項撰寫習慣所左右。`skipLibCheck`、`incremental` 與專案參考可在建置端削減工作量。`--extendedDiagnostics` 與 `--generateTrace` 把慢速建置轉成可量測的工作負載。優先使用 interface 而非交集、為中間型別命名，並收斂 `types` 編譯器選項，能讓型別檢查器從一開始就省下可避免的工作。2025 年 3 月，Microsoft 宣佈以 Go 改寫編譯器，目標是把多數建置時間降低 10 倍；該版本以 TypeScript 7.0 發佈。
:::

## 背景

TypeScript 專案的編輯器反應速度受限於 `tsserver`，而 `tsserver` 本身受限於編譯器為正在編輯的檔案所需執行的型別檢查量。TypeScript Performance wiki 直接指出：「In-editor diagnostics are typically fetched a few seconds after typing stops. `ts-server`'s performance characteristics will always be related to the performance of type-checking.」慢速建置幾乎都伴隨慢速編輯器。

專案會沿三條軸線成長：更多原始檔、透過 `@types` 與相依套件帶入的更大 `.d.ts` 表面，以及含有深層交集、大型聯集與條件邏輯的更複雜型別。每條軸線都會與其他軸線相乘。在成熟 monorepo 的規模下，一次完整 `tsc` 執行可能需要數分鐘，`tsserver` 的 hover 延遲會在游標下明顯感受到。

專案參考的存在就是為了打斷這條成長曲線。Handbook 指出：「By separating into multiple projects, you can greatly improve the speed of typechecking and compiling, reduce memory usage when using an editor, and improve enforcement of the logical groupings of your program.」搭配 `incremental` 輸出與 `skipLibCheck`，三者共同構成現代 TypeScript 專案的基礎效能姿態。

向前看，編譯器正在以 Go 改寫。TypeScript 團隊在 2025 年 3 月宣佈：「the native implementation will drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage.」該移植以 TypeScript 7.0 發佈；目前的 JavaScript codebase 繼續作為 6.x 線維護，因此下方指引仍具承載力。

## 視覺對比

| 開關 | 作用 | 使用時機 | 安全備註 |
| --- | --- | --- | --- |
| `skipLibCheck` | 略過每個 `.d.ts` 檔的型別檢查。 | 應用程式建置的預設；前提是信任第三方宣告。 | 可能掩蓋 `.d.ts` 檔之間的錯誤設定與衝突；Performance wiki 建議「only for faster builds.」 |
| `incremental` | 寫入 `.tsbuildinfo` 檔，使後續執行只重新檢查最小的變更檔集合。 | 任何非瑣碎專案；啟用 `composite` 時預設開啟。 | Sidecar 檔需穩定位置；加入 `.gitignore`。 |
| 專案參考 + `composite: true` | 把 codebase 切成子專案圖，由 `tsc -b` 依相依順序建置。 | Monorepo 與任何具清楚內部邊界的 codebase。 | 被參考的專案需要 `declaration: true` 與明確的 `include` 清單。 |
| `--generateTrace <dir>` | 輸出 `trace.json` 與 `types.json`，供 Chrome `about://tracing` 或 DevTools Performance 使用。 | 建置莫名其妙變慢、需要看時間花在何處時。 | 輸出會隨專案規模成長；輸出到暫存目錄。 |
| `types: []`（或收斂清單） | 阻止編譯器納入每個可見的 `@types` 套件。 | 無需從每個已安裝 `@types/*` 取得環境全域的專案。 | 程式實際依賴的項目（例如 `@types/node`）必須明確列出。 |

## 範例

### 具效能意識的最小 `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    "types": []
  }
}
```

`skipLibCheck` 與 `incremental` 是成本最低的兩項收益。`types: []` 退出「all visible '@types' packages are included in your compilation」的預設行為，強制每個套件都要刻意加入。

### 專案參考佈局

根 `tsconfig.json`：

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" },
    { "path": "./packages/app" }
  ]
}
```

葉子 `packages/core/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

以下列指令建置整張圖：

```bash
tsc -b
```

`tsc --build` 會「find all referenced projects, detect if they are up-to-date, build out-of-date projects in the correct order.」每個葉子寫出自己的 `.tsbuildinfo`，未變動的葉子在下一次執行時會被完全略過。

### 擷取 trace

```bash
tsc --generateTrace trace
```

此指令產生：

```
trace
├── trace.json
└── types.json
```

在 Chrome 或 Edge 的 `about://tracing` 載入 `trace.json`（或拖進 DevTools Performance 分頁）。寬的長條代表耗時的階段或耗時的檔案。搭配 `@typescript/analyze-trace` 可取得熱點的排名列表。

## 最佳實踐

- **MUST** 為應用程式建置啟用 `skipLibCheck`：否則 `tsc` 會「type checks of all declaration files (*.d.ts files),」官方選項文件指出此權衡是「time during compilation at the expense of type safety.」
- **MUST** 啟用 `incremental`（或依賴 `composite` 下的隱含預設）：此旗標「allows TypeScript to save state from the last compilation to a `.tsbuildinfo` file」用於「figure out the smallest set of files that might to be re-checked/re-emitted.」
- **SHOULD** 把大型 codebase 切成專案參考：handbook 明確將「speed of typechecking and compiling」加上「reduce memory usage when using an editor」歸功於此佈局。
- **SHOULD** 在優化前執行 `tsc --extendedDiagnostics`：Performance wiki 建議以此「get a printout of where the compiler is spending its time」讓修改有所依據，避免臆測。
- **SHOULD** 對物件形狀優先使用 `interface` + `extends`，而非交集型別：「Interfaces create a single flat object type … Type relationships between interfaces are also cached, as opposed to intersection types as a whole.」
- **SHOULD** 當條件或計算型別被引用超過一次時，以 `type` 別名為中間型別命名：一旦結果具名，「more information can be cached by the compiler.」
- **MAY** 設定 `"types": []` 並只列出專案所需的環境套件：預設情況下「all *visible* '@types' packages are included in your compilation,」這會帶入許多專案從未接觸的宣告。
- **MAY** 對函式庫作者而言把 `skipLibCheck` 視為暫時措施：Performance wiki 提醒「these options can often hide misconfiguration and conflicts in `.d.ts` files.」

## 設計思維

有兩項撰寫習慣對編譯時間的影響超過任何旗標。

**Interface 優於交集。** 交集 `A & B` 是一個結構性請求：檢查器必須在每次使用時同時推理兩側。Wiki 觀察到「Interfaces create a single flat object type that detects property conflicts,」更重要的是「Type relationships between interfaces are also cached.」在一個流經數百個元件的共享 `Props` 型別規模下，交集形式每次引用都會重新推導相同資訊，interface 形式則命中快取。

**為中間型別命名。** 在每個呼叫點行內展開的條件型別，就是編譯器在每個呼叫點重新求值的條件型別。把它抽成具名別名可讓檢查器記住答案：「If the return type in this example was extracted out to a type alias, more information can be cached by the compiler.」具名別名的成本是一行程式碼；收益是每個下游使用點付出查找成本，省下重新計算成本。

兩者背後的共通課題：給編譯器一個穩定的識別以作為快取的鍵。

## 深入探討

### `incremental` 與 `.tsbuildinfo`

`incremental` 選項把建置狀態持久化為 `.tsbuildinfo` sidecar。Compiler-options 參考指出其預設為「`true` if `composite`; `false` otherwise,」因此專案參考圖中任何 composite 葉子，即使未明確設定也已是 incremental。該檔案記錄檔案雜湊與相依邊，讓第二次 `tsc` 呼叫能略過不需要重新檢查的檔案。

### `--generateTrace` 工作流程

`tsc --generateTrace <dir>` 輸出相容於 Chrome-tracing 的 `trace.json` 加上搭配的 `types.json`。Performance-Tracing wiki 寫出載入步驟：「Navigate to `about://tracing` and click `Load`.」視圖是依編譯階段與檔案展開的火焰圖。熱點檔案顯示為寬長條；熱點型別顯示為 `checkSourceFile` 框架內的深堆疊。

### `@typescript/analyze-trace`

火焰圖在知道要看什麼之後才有用。首輪分析可用 `@typescript/analyze-trace` 把 trace 後處理成文字。Performance wiki 推薦此工具：「To quickly list performance hot-spots, you can install and run @typescript/analyze-trace from npm.」它會點出主宰牆上時間的檔案、型別與實例化。

### 聯集的平方級去重

聯集 `A | B | C | ...` 並非免費。為了讓聯集保持正規化，「to eliminate redundant members from a union, the elements have to be compared pairwise, which is quadratic.」500 個字面型別的聯集會執行約 250,000 次成對比較。暴露巨型字串字面聯集的函式庫 API，或產生深分支聯集樹的 codegen 工具，經常在 analyze-trace 報告中名列最大熱點。

### Go 原生移植

TypeScript 團隊把 2025 年 3 月宣佈的原生改寫定位為「drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage.」已公佈的 VS Code 自編譯數字從 77.8 秒降到 7.5 秒。該移植以 TypeScript 7.0 發佈。Wiki 的撰寫建議針對的是型別系統，與宿主語言無關，`skipLibCheck`、`incremental` 與專案參考仍屬編譯器表面的一部分。

## 延伸閱讀

- [tsconfig 與 Strict Mode](/zh-tw/TypeScript/1706)
- [型別專用匯入與 `verbatimModuleSyntax`](/zh-tw/TypeScript/type-only-imports)
- [條件型別與 `infer`](/zh-tw/TypeScript/conditional-types-and-infer)

## 參考資料

- TypeScript Team, "Performance," TypeScript Wiki. https://github.com/microsoft/TypeScript/wiki/Performance
- TypeScript Team, "Performance Tracing," TypeScript Wiki. https://github.com/microsoft/TypeScript/wiki/Performance-Tracing
- TypeScript Team, "TSConfig Reference," typescriptlang.org. https://www.typescriptlang.org/tsconfig/
- TypeScript Team, "Compiler Options," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/compiler-options.html
- TypeScript Team, "Project References," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/project-references.html
- Daniel Rosenwasser, "A 10x Faster TypeScript," Microsoft DevBlogs (2025). https://devblogs.microsoft.com/typescript/typescript-native-port/
