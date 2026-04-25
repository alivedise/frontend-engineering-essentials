---
id: 917
title: "Tailwind CSS v4 `@theme` 指令 — CSS 優先的設計權杖"
state: draft
slug: tailwind-v4-theme-directive
category: Design Systems and UI Libraries
level: mid
---

# [FEE-917] Tailwind CSS v4 `@theme` 指令 — CSS 優先的設計權杖

:::info
Tailwind CSS v4 透過 `@theme` 指令將專案設定從 `tailwind.config.js` 遷移到樣式表本身。在 `@theme` 內宣告的變數會同時產生 utility class 與 `:root` CSS 自訂屬性，將兩層設計權杖管線收斂為一層。此指令取代 JS 設定物件作為定義品牌色彩、字型、間距與斷點的標準位置，讓 Tailwind 對齊 shadcn/ui 等元件函式庫所採用的 CSS 變數優先權杖模型。
:::

## 背景

早期 Tailwind 版本將設計權杖放在 JavaScript 設定物件中，由建置步驟編譯為 utility class。Tailwind v4 反轉此流程；根據 v4.0 發行說明，「Tailwind CSS v4.0 最大的改變之一，就是將專案設定從 JavaScript 轉移到 CSS」。權杖現在存於 CSS 內部，透過新的 at-rule 宣告。

`@theme` 指令是該工作流程的入口。官方主題文件將其描述為「使用 `@theme` 指令定義的特殊 CSS 變數，會影響專案中存在哪些 utility class」。一行宣告如 `--color-mint-500: oklch(0.72 0.15 165);` 會同時驅動兩種輸出：產生 `bg-mint-500`（以及對應的 `text-`、`border-`、`ring-`）utility，再加上一個 `:root { --color-mint-500: ... }` 自訂屬性，供任何非 Tailwind 程式碼讀取。

此雙重用途模型對建立於 Tailwind 之上的元件生態系同樣重要。例如 shadcn/ui 的 v4 世代提供「對新 `@theme` 指令與 `@theme inline` 選項的完整支援」，其 OKLCH 權杖預設值流經與手寫設計系統相同的介面。

## 視覺對比

`@theme` 內每個保留命名空間控制不同的產生 utility 家族。Tailwind 主題參考列出標準對應：

| 命名空間          | Utility 家族                                  | 範例宣告                                | 產生的 utility       |
| ---------------- | --------------------------------------------- | --------------------------------------- | -------------------- |
| `--color-*`      | 色彩 utility（`bg-`、`text-`、`border-`）      | `--color-mint-500: oklch(0.72 0.15 165);` | `bg-mint-500`        |
| `--font-*`       | 字型家族 utility                               | `--font-poppins: "Poppins", sans-serif;` | `font-poppins`       |
| `--text-*`       | 字型大小 utility 與配對中繼資料                 | `--text-display: 4rem;`                  | `text-display`       |
| `--spacing-*`    | 間距與尺寸（margin、padding、width）           | `--spacing: 0.25rem;`                    | `p-1`、`mt-3`、`w-8` |
| `--radius-*`     | 邊框圓角 utility                               | `--radius-card: 0.75rem;`                | `rounded-card`       |
| `--breakpoint-*` | 響應式斷點變體                                 | `--breakpoint-3xl: 1920px;`              | `3xl:flex`           |

shadcn/ui v4 透過此同一介面宣告所有品牌權杖，顯示命名空間契約足以支撐完整元件函式庫。

## 範例

以下樣式表展示 v4 專案典型的入口檔形態。品牌色彩產生 `bg-brand-50` 至 `bg-brand-900` utility，字型宣告建立 `font-poppins` class，而間距尺度變數讓所有 `p-*`、`m-*`、`w-*` 與 `h-*` utility 啟用，無需逐一列舉個別階層。

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-brand-50:  oklch(0.97 0.02 165);
  --color-brand-500: oklch(0.72 0.15 165);
  --color-brand-900: oklch(0.32 0.10 165);

  --font-poppins: "Poppins", ui-sans-serif, system-ui, sans-serif;

  --spacing: 0.25rem;
}
```

依主題文件所述，「若另一個主題變數如 `--font-poppins` 已被定義，與其搭配的 `font-poppins` utility class 將變得可用」。同樣的命名規則適用於 `--color-brand-500`（產生 `bg-brand-500`、`text-brand-500`、`border-brand-500`、`ring-brand-500`）。

間距那一行所做的事情比表面看起來更多。v4.0 發行說明描述新模型：「即使是 `px-*`、`mt-*`、`w-*`、`h-*` 等間距 utility，現在也是從單一間距尺度變數動態推導而來。」設定 `--spacing: 0.25rem` 表示 `p-1` 解析為 `0.25rem`、`p-3` 為 `0.75rem`、`p-13` 為 `3.25rem`，依此類推，無需明確列出允許的階層表。

## 最佳實踐

- **MUST** 將 `@theme` 變數視為 utility 與原生 CSS 共同消費權杖的單一真相來源。主題文件指出：「Tailwind 也會為主題變數產生一般的 CSS 變數，讓你能在任意值或行內樣式中參照設計權杖。」第三方元件讀取 `var(--color-brand-500)` 會自動與 utility class 保持同步。
- **MUST** 在採用 v4 前驗證部署目標支援 Safari 16.4、Chrome 111 與 Firefox 128 或更新版本。升級指南指出：「Tailwind CSS v4.0 為現代瀏覽器設計，目標為 Safari 16.4、Chrome 111 與 Firefox 128。」此相依性源自產生輸出中對 `@property` 與 `color-mix()` 的使用。
- **SHOULD** 當專案僅出貨品牌色彩時，在 `@theme` 內以 `--color-*: initial;` 清除預設調色盤。主題文件規範此機制：「若要完全覆寫預設主題中的整個命名空間，將整個命名空間設為 `initial`。」這會從輸出樣式表中移除內建的灰、紅、藍色階。
- **MAY** 當設計系統完全擁有那些尺度時，將相同模式套用至 `--font-*`、`--spacing-*` 或 `--breakpoint-*` 命名空間。僅在團隊承諾定義替代值時才重置某個命名空間。

## 設計思維

預設調色盤從 `rgb()` 切換到 `oklch()` 是 v4 中最顯眼的美學變動。發行說明記錄此決策：「我們已將整個預設色彩調色盤從 `rgb` 升級為 `oklch`。」OKLCH 是感知均勻色彩空間，相同的明度數值階差會在不同色相間產生大致相當的感知對比變化。代價是瀏覽器支援度：OKLCH 解析與 `color-mix()` 為 v4 瀏覽器基線背後的把關功能。需支援較舊瀏覽器的專案必須鎖定 v3 或手動出貨 `rgb()` 後備層；v4 預設假設現代基線可被接受。

## 深入探討

v4 建置管線重寫使 CSS 優先模型在規模上變得可行。v4 alpha 公告指出：「單一相依——新引擎唯一相依的就是 Lightning CSS。」v3 採用的 PostCSS 管線已被取代；Lightning CSS 加上 Rust 加速核心處理解析、轉換與最小化。

v4.0 發行說明的效能數字量化此影響：「完整重建快超過 3.5 倍，增量重建快超過 8 倍……這些建置快超過 100 倍，並在微秒等級完成。」100 倍的數字適用於沒有 CSS 原始碼變更的增量重建，這是開發伺服器中僅編輯模板時的常見情境。次毫秒的重建讓 CSS 優先設定變得可行：每次 `@theme` 編輯都能以足夠快的速度刷新，在瀏覽器中感覺接近同步。

## 從 v3 JS 設定遷移

v3 專案帶有兩個 v4 模型重新定位的產物：JavaScript 設定檔，以及任何從中讀取的程式碼。

**設定檔自動探測。** v3 會自動探測 `tailwind.config.js`；v4 則否。升級指南指出：「JavaScript 設定檔仍因向後相容而支援，但在 v4 中不再被自動探測。」採取漸進遷移的團隊可在入口 CSS 中以明確指標保留 JS 設定的存活：

```css
@import "tailwindcss";
@config "../../tailwind.config.js";
```

長期路徑是將 `theme.extend` 條目依上方表格中的對應命名空間，翻譯為 `@theme` 變數。

**`resolveConfig` 移除。** v3 暴露 `resolveConfig` 輔助函式以便在執行階段內省合併後的設定，通常由需要渲染與設計權杖一致 UI 的 JS 程式碼使用。v4 移除此輔助函式。升級指南指出：「我們已在 v4 中移除此項，希望大家能直接使用我們產生的 CSS 變數，這樣簡單許多，並會大幅減少你的 bundle 尺寸。」呼叫 `resolveConfig().theme.colors.brand[500]` 的程式碼現在應改為讀取 `getComputedStyle(document.documentElement).getPropertyValue('--color-brand-500')`，或在樣式表中使用 `var(--color-brand-500)`。

**命名空間對應。** `theme.extend.colors` 變為 `--color-*`、`fontFamily` 變為 `--font-*`、`spacing` 變為個別 `--spacing-N` 條目或單一 `--spacing` 尺度變數、`borderRadius` 變為 `--radius-*`、而 `screens` 變為 `--breakpoint-*`。註冊新 utility 的自訂外掛沒有直接對應，必須使用產生的自訂屬性改寫為純 CSS 規則。

## 延伸閱讀

- [DTCG 權杖格式規範](/zh-tw/Design%20Systems%20and%20UI%20Libraries/dtcg-token-format-spec) — 定義可攜帶 JSON 權杖檔案的 W3C 草案；當權杖源自 CSS 之外時搭配 `@theme` 使用。
- [Style Dictionary 4 管線](/zh-tw/Design%20Systems%20and%20UI%20Libraries/style-dictionary-4-pipeline) — 跨平台權杖編譯器；可在 iOS 與 Android 目標旁同時輸出 `@theme` 區塊，達成單一真相來源。
- [設計權杖](/zh-tw/Design%20Systems%20and%20UI%20Libraries/901) — 設計權杖概念的基礎 FEE 文章，`@theme` 為 Tailwind 使用者落實此概念。

## 參考資料

- Tailwind Labs, "Tailwind CSS v4.0," Tailwind CSS Blog (2025). https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind Labs, "Theme variables," Tailwind CSS Documentation (2025). https://tailwindcss.com/docs/theme
- Tailwind Labs, "Upgrade guide," Tailwind CSS Documentation (2025). https://tailwindcss.com/docs/upgrade-guide
- Tailwind Labs, "Functions and directives," Tailwind CSS Documentation (2025). https://tailwindcss.com/docs/functions-and-directives
- Tailwind Labs, "Open sourcing our progress on Tailwind CSS v4.0," Tailwind CSS Blog (2024). https://tailwindcss.com/blog/tailwindcss-v4-alpha
- shadcn, "Tailwind v4," shadcn/ui Documentation (2025). https://ui.shadcn.com/docs/tailwind-v4
- Tokens Studio, "sd-tailwindv4: Style Dictionary transforms for Tailwind v4," GitHub (2025). https://github.com/tokens-studio/sd-tailwindv4
