---
id: 1800
title: "Codebase Studies 概覽"
state: draft
overview: true
slug: codebase-studies-overview
---

# [FEE-1800] Codebase Studies 概覽

:::info
Codebase Studies 是 FEE 專門研究指名開源專案的分類：從真實程式碼中提煉**具名模式**，將每項主張錨定在原始碼上，並以可辨識的方式為每個模式命名，讓讀者日後再次遇到時能立刻認出。此分類落在 1800-1899，與 FEE-500s（Component Architecture & Design Patterns）互補，後者以抽象方式描述同類模式。本概覽同時是此分類撰寫慣例的權威參考。
:::

## 背景

其他每個 FEE 分類都按技術主題組織：HTML、CSS、JavaScript、State Management 等。每篇文章描述某項技術或模式如何運作，並使用合成範例以求清楚。

Codebase Studies 是首個按**案例研究組織**的分類。分析的單位是真實、具名的程式碼庫。每篇文章從單一具名專案中挑選一個具名模式，走過該專案的實際原始碼，並以可辨識的方式為該模式命名，讓讀者能在他處認出。

知識模型來自 *Architecture of Open Source Applications* 系列叢書與 *500 Lines or Less*：對單一精心設計的軟體進行短而聚焦的導覽，書寫方式讓日後閱讀其他程式碼庫的工程師能識別出相同的形態。FEE 特有的轉折是每篇文章最終仍提供可移轉的把手，讓讀者帶走一個具名模式，了解此專案如何實作它，並知道日後此模式在他處浮現時要尋找什麼線索。

## 圖解

| | FEE-500s（Component Architecture） | Codebase Studies（1800-1899） |
|---|---|---|
| 文章形態 | 抽象模式，配合合成範例 | 模式在某具名程式碼庫中的實踐，以原始碼為主要錨點 |
| 讀者收穫 | 在自己工作中套用該模式 | 在真實程式碼中看見該模式時能認出 |
| 範例來源 | 手寫片段 | 在固定 commit 上自專案逐字引用 |
| 交互連結 | 「此模式的實際運用：[Codebase Study]」 | 「抽象模式背景：[FEE-500s]」 |

同一個模式可同時在兩個分類擁有文章，並彼此交互連結。

## 範例

以下是一篇 Codebase Studies 文章的形態，這是 FEE-1810 範例段落的單段摘錄，呈現以 commit 固定的原始碼引用：

> Three.js 中所有可渲染物件的基底類別 `Object3D` 本身並未公開生命週期方法；釋放工作委派給擁有 GPU 資源的子類別。`BufferGeometry.dispose()` 的實作如下：
>
> *來源：* [src/core/BufferGeometry.js:866-871](https://github.com/mrdoob/three.js/blob/r172/src/core/BufferGeometry.js#L866-L871)
>
> ```js
> dispose() {
>   this.dispatchEvent({ type: 'dispose' });
> }
> ```
>
> 主體只有一行：派發一個 `'dispose'` 事件。實際的 GPU 拆除動作發生在 `WebGLRenderer` 安裝的監聽器中⋯⋯

連結使用 tag（`r172`），而非 `main`。包含行號範圍。程式碼為逐字引用。周圍的文字為該模式命名，並透過程式碼追蹤其運作。

## 最佳實踐

- **必須**在此分類的每篇文章 frontmatter 中包含 `studied_at` 欄位。格式：`studied_at: "<project> <version> (<YYYY-MM-DD>)"`。範例：`studied_at: "three.js r172 (2025-04-15)"`。此欄位記錄文章撰寫時所對應的快照；少了它，文章會隨上游演進而靜默腐化。
- **必須**使用以 commit 固定的原始碼 URL。格式：`https://github.com/<org>/<repo>/blob/<sha-or-tag>/<path>#L<line>` 或 `#L<start>-L<end>`。永遠不要連到 `main`、`master` 或 `HEAD`。固定的 URL 是文章描述該段確切程式碼的契約。
- **必須**從原始碼逐字引用程式碼樣本。以 `// ...` 略過無關行可以接受。為了易讀而改寫則不行，因為那會把「專案實際做的事」變成「文章作者認為專案做的事」，正好抹去此分類的價值。
- **必須**在主題專屬 `##` 標題中以 2-4 個字詞為模式命名，並在文章內文首次出現時以粗體標示，讓讀者帶走一個能在其他程式碼庫中再次辨認的把手。
- **應該**在主題專屬段落結尾以「**在其他程式碼中如何辨識：**」項目作收，列出具體訊號（檔名、函式命名慣例、註解語彙），讓讀者在陌生程式碼中認出相同模式。
- **應該**當模式在 FEE-500s 有抽象對應時，交互連結過去。連結文字格式為：「抽象模式背景：[FEE-50X 標題]」。FEE-500s 文章可以反向呼應：「此模式的實際運用：[Codebase Study 標題]」。
- **必須不要**在範例段落使用合成或偽程式碼範例。若無法引用真實原始碼，該模式就不屬於此分類，而屬於 FEE-500s。

## 設計思維

此分類的核心校準是：**程式碼庫是見證者**，而非主題本身。讀完 FEE-1810 的人應帶走對 *dispose 生命週期模式* 的認識（可套用或可辨識的具名模式），Three.js 則是展示該模式的具體見證。文章的職責是教授該模式，並以 Three.js 的原始碼作為佐證材料。

此校準在規格設計階段所提出的兩種失敗模式之間劃出清楚界線：

1. **過度泛化。** 若文章對只在 Three.js 才有意義的模式硬套上「處處可用」的主張，該主張就是捏造。較好的做法是限定辨識範圍：「長時間運行、擁有非 GC 資源的應用程式中你會看到這種模式」是誠實的；「每個程式碼庫都該採用」則否。
2. **註解過的連結列表。** 若文章只是「這裡是 Three.js 的導覽，沒有可移轉的收穫」，那它是經過策劃的閱讀材料，而非 FEE 文章。`## <Pattern Name>` 的要求加上「在其他程式碼中如何辨識」收尾，確保每篇文章都交付一個辨識把手。

## 撰寫慣例

這是分類專屬規則的權威來源。1800-1899 之後的文章除遵守 `CLAUDE.md` 的 FEE 標準慣例外，亦須遵守以下規則。

1. **`studied_at` frontmatter（必填）。** 格式：`studied_at: "<project> <version> (<YYYY-MM-DD>)"`。版本可以是發行 tag（`r172`、`v0.20.0`、`5.62.10`），或在沒有對應 tag 時改用 commit 短 SHA。日期是文章針對該版本撰寫的日期，而非該版本的發行日期。
2. **以 commit 固定的原始碼 URL。** 使用 `https://github.com/<org>/<repo>/blob/<sha-or-tag>/<path>#L<line>`。`<sha-or-tag>` 必須與 `studied_at` 的版本一致。
3. **逐字程式碼引用。** 自原始碼引用的程式碼區塊在區塊上方標示檔案路徑與行號範圍（例如 *來源：src/core/Object3D.js:120-145*）。以 `// ...` 略過無關行可以接受；改寫則不行。
4. **主題專屬標題中的模式名稱。** 2-4 個字詞、易記、採 title case。文章內文首次出現時以粗體標示。範例：「The Dispose Lifecycle Contract」、「The Goroutine + Channel Fanout Model」、「The Observer Pattern around QueryCache」。
5. **「在其他程式碼中如何辨識：」**是主題專屬段落的收尾項目。它列出具體辨識訊號：檔名（「找 `*.dispose.js`」）、函式命名慣例（「`dispose()` 回傳 `void`，從不回 `Promise<void>`」）、註解語彙（「`// caller is responsible for cleanup`」），或結構形態（「渲染器上的 `WeakMap<Resource, Listener>` 欄位」）。
6. **交互連結至 FEE-500s** 當模式在該分類有抽象對應時。
7. **不捏造原則。** 對專案運作的每項主張都連到所研究 commit 的特定檔案/行號。若某個泛化沒有原始碼支持，就不放進文章。

## 內部參考

- [FEE-500 Component Architecture & Design Patterns Overview](../Component%20Architecture%20and%20Design%20Patterns/500.md) — 與此分類互補的抽象模式分類。Codebase Studies 文章在其模式有抽象對應時交互連結到此處。

## 參考資料

- [Architecture of Open Source Applications (AOSA)](https://aosabook.org/en/) — 此分類所借鑑的編輯模型。AOSA 第 1-3 卷加上 *500 Lines or Less* 與 *The Performance of Open Source Applications* 是「對精心設計的軟體進行短而聚焦的導覽」此一形式的先例。
- [GitHub permalink documentation](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files) — 以 commit 固定 URL 的權威參考。在 GitHub 檔案檢視畫面按下「y」鍵會將 URL 改寫為 permalink。
