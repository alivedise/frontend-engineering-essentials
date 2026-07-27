---
id: 910
title: W3C DTCG Format Module — 完整 Token 規格參考
state: draft
slug: dtcg-token-format-spec
category: Design Systems and UI Libraries
level: mid
reviewed: hardened
reviewed_on: 2026-07-27
---

# [FEE-910] W3C DTCG Format Module — 完整 Token 規格參考

:::info
W3C Design Tokens Community Group（DTCG）Format Module 定義了一套以 JSON 為基礎的設計 token 交換格式。它於 2025 年 10 月 28 日推出第一個穩定版本 2025.10。本文涵蓋檔案結構、七種基本型別、六種複合型別、別名解析與工具生態。當你要在設計工具與程式碼流程之間採用 `.tokens.json` 時，可以將本文當作參考。
:::

## 背景

Design Tokens Community Group 由 Kaelig Deloumeau-Prigent 於 [2019 年 7 月 31 日提案成立](https://www.w3.org/community/blog/2019/07/31/proposed-group-design-tokens-community-group/)，章程目標為「提供標準，讓產品與設計工具能在規模化情境下共享設計系統的樣式片段」。在 2025 年底之前，各家實作各自追蹤不同的 editor's drafts，對保留 key、別名語法與複合型別結構存在細微歧見。

這個情況在 2025 年 10 月 28 日改變，DTCG [宣布第一個穩定版本 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)，並聲明該規格「解鎖了設計工具與程式碼之間的互通性」。此版本由 20 個以上的組織共同開發（Adobe、Google、Microsoft、Meta、Figma、Sketch、Salesforce、Shopify 等），參考實作包含 Style Dictionary、Tokens Studio、Terrazzo，以及 Penpot、Framer、Knapsack、Supernova、zeroheight。後續修訂仍以 [Format Module editor's drafts](https://www.designtokens.org/tr/drafts/format/) 作為實作者追蹤的權威來源。

## 視覺對比

| 概念 | 必要 key | 可選保留 key | 備註 |
| --- | --- | --- | --- |
| Token | `$value` | `$type`、`$description`、`$extensions`、`$deprecated` | 任何帶有 `$value` 的 JSON 物件即為 token |
| Group | （無） | `$type`、`$description`、`$extensions` | 任何不含 `$value` 的 JSON 物件；以普通 JSON key 巢狀組合 |
| Alias | `$value: "{group.token}"` | — | 以點分隔的路徑指向另一個 token |
| File | — | — | `.tokens` 或 `.tokens.json`；媒體型別 `application/design-tokens+json` |

## 範例

一個最小的 `.tokens.json` 檔案，包含一個 group、一個原生型別、一個別名與一個複合 shadow：

```json
{
  "color": {
    "$type": "color",
    "brand": { "$value": "#0055ff" },
    "primary": { "$value": "{color.brand}" }
  },
  "elevation": {
    "card": {
      "$type": "shadow",
      "$value": {
        "color": "{color.brand}",
        "offsetX": "0px",
        "offsetY": "2px",
        "blur": "8px",
        "spread": "0px"
      }
    }
  }
}
```

`color.primary` 透過 `color.brand` 解析為 `#0055ff`。`elevation.card` 的 shadow 在自己的 `color` 成員內嵌入別名，而規格允許複合型別內以欄位為單位使用別名。依 DTCG glossary 約定，這個檔案會帶有 `.tokens.json` 副檔名，並以 `application/design-tokens+json` 媒體型別提供；不支援的環境則回退為 `application/json`。

## 最佳實踐

- **MUST** 以 `$value` 屬性標記每一個 token；任何不含 `$value` 的物件皆為 group，對應規格條文「An object with a $value property is a token」。
- **MUST** 在型別無法從別名鏈推導時，於 token 本身或祖先 group 上宣告 `$type`。Group 層級的 `$type` 可由後代繼承。
- **MUST** 將放入 `$extensions` 的內容加上命名空間；規格將 `$extensions` 定義為「tools MAY add proprietary, user-, team- or vendor-specific data」的位置，命名空間可避免跨工具衝突。
- **SHOULD** 使用 `.tokens.json`（或 `.tokens`）作為副檔名，並以 `application/design-tokens+json` 作為媒體型別，符合 DTCG glossary 公布的慣例。
- **SHOULD** 對跨 token 的關聯優先採用別名引用（`{group.token}`），避免複製字面值；別名能在主題切換與重構過程中保留語意。
- **MAY** 以 `$deprecated: true`（或字串理由）標記已棄用的 token。消費端可據此發出警告或過濾，且不會破壞既有引用。

## 設計思維

DTCG 在設計上做了兩個值得理解的取捨，導入前先掌握它們有助於評估。

加上錢字符前綴的保留 key（`$value`、`$type`、`$description`、`$extensions`、`$deprecated`）以 JSON 書寫舒適度換取 metadata 與作者命名 token 路徑之間的清楚分離。這個前綴讓 group 內可以放置一個名為 `value` 的 token，而不會與規格的 `$value` 衝突。代價是每個消費端都得攜帶一段小型解析器，每位作者也要在 metadata 欄位多打一個字元。

`$type` 可由 group 繼承。權衡點在於簡潔度對上區域可讀性：在色彩 group 上宣告一次 `$type: "color"` 後就不需重複，代價則是讀者瀏覽深層 token 時，必須往上追溯樹狀結構才能得知型別。規格以確定性的解析流程化解這個歧義（參見「深入探討」），讓工具行為保持可預期。

## 深入探討

**型別解析。** 當 `$type` 缺省時，規格規範一個確定性的查找順序：「If the $type property is not set on a token, then the token's type MUST be determined as follows: If the token's value is a reference... Otherwise, if any of the token's parent groups have a $type property.」解析器先追蹤別名，再往父 group 上溯。若兩條路徑都得不到 `$type`，該 token 即為無效。

**別名鏈。** 別名採用 `{group.token}` 點語法。規格允許鏈式別名：「Aliases MAY reference other aliases. In this case, tools MUST follow each reference until they find a token with an explicit value.」每條鏈最終 MUST 指向一個實際值，且禁止循環引用。實作上常見的做法是在解析時追蹤已造訪路徑以偵測循環。

**複合型別內的成員別名。** 在複合型別中，每個成員欄位本身 MAY 為別名。這正是讓 shadow 的 `color` 成員指向品牌色，同時其他成員維持內嵌字面值的機制。

**屬性層級參照。** `{group.token}` 語法一律解析為另一個 token 的完整 `$value`。2025.10 規格新增第二種機制，用來指向單一子值：一個依 RFC 6901 使用 JSON Pointer 表示法的 `$ref` 屬性。規格要求「Tools MUST support JSON Pointer references as defined by [RFC 6901], using the `$ref` property.」像 `#/colors/blue/$value/components/0` 這樣的指標會解析為色彩值中的單一元件，這是 `{group.token}` 無法表達的，因為它永遠只會回傳完整的 `$value`。

## DTCG 複合型別對照

Format Module 定義七種基本型別與六種複合型別。複合型別會引用基本型別；部分複合型別也會引用其他複合型別（例如 `border.style` 為 `strokeStyle`）。

| Type | Category | `$value` shape | 備註 |
| --- | --- | --- | --- |
| `color` | Basic | Hex 字串或結構化物件 | 表示 UI 中的色彩 |
| `dimension` | Basic | 數值 + 單位（如 `"16px"`、`"1rem"`） | 表示距離量值 |
| `duration` | Basic | 毫秒（數字或 `"100ms"`） | 時間長度，供轉場使用 |
| `fontFamily` | Basic | 字串或字串陣列 | 單一字型族或回退堆疊 |
| `fontWeight` | Basic | 1-1000 數字或具名關鍵字 | 例如 `400`、`"bold"` |
| `number` | Basic | 數字 | 無單位純量 |
| `cubicBezier` | Basic | `[x1, y1, x2, y2]` | 供 `transition.timingFunction` 使用 |
| `shadow` | Composite | `{color, offsetX, offsetY, blur, spread}` 或陣列 | 單一陰影或堆疊陣列；每個成員 MAY 使用別名 |
| `border` | Composite | `{color, width, style}` | `style` 為 `strokeStyle` |
| `strokeStyle` | Composite | 關鍵字字串或虛線樣式物件 | 定義於 Format Module 第 9.3 節；供 `border.style` 使用 |
| `transition` | Composite | `{duration, delay, timingFunction}` | `timingFunction` 為 `cubicBezier` |
| `typography` | Composite | `{fontFamily, fontSize, fontWeight, letterSpacing, lineHeight}` | 聚合五個基本型別 |
| `gradient` | Composite | 色彩節點的陣列 | 完整成員結構參見 Format Module draft |

規格條文直接支援這些型別：「Represents a shadow style. The $type property MUST be set to the string shadow」、「Represents a border style. The $type property MUST be set to the string border」、「Represents a animated transition between two states」，以及 typography 型別「An object with the following properties: ... fontFamily ... fontSize ... fontWeight ... letterSpacing ... lineHeight.」

## 工具互通

截至 2025.10，三個參考實作覆蓋多數正式環境的處理流程：

- **Style Dictionary 4+。** 依 [DTCG 整合頁面](https://styledictionary.com/info/dtcg/)，「As of version 4, Style Dictionary has first-class support for the DTCG format.」這裡指的是 2025.10 之前的 editor's-draft 格式。完整的 2025.10 支援仍在第 5 版中開發中。Style Dictionary 仍是從 `.tokens.json` 轉換為各平台輸出（CSS variables、iOS、Android、Tailwind config）最常見的轉換管線。
- **Tokens Studio for Figma。** [token format 文件](https://docs.tokens.studio/manage-settings/token-format)指出「The DTCG format prefixes the properties of a design token in the JSON file with the dollar sign ($).」Tokens Studio 預設採用 DTCG，並提供將整份 token JSON 在舊版與 DTCG 結構之間一鍵轉換的功能。
- **[Terrazzo](https://terrazzo.app/docs/reference/about/)。** 一套開源、採用 MIT 授權的設計 token CLI 與建置管線，前身名為 Cobalt（亦稱 Cobalt UI）。Terrazzo 在 2025.10 公告中與 Style Dictionary、Tokens Studio 並列為參考實作。

Figma 第一方的 Variables REST API 匯出在 typography、shadow 與 gradient 來回傳輸上仍有缺口。若需要從 Figma 取得完整的複合型別保真度，建議改走 Tokens Studio，或對 Variables 匯出結果進行後處理。

## 延伸閱讀

- [Design Tokens (FEE-901)](/zh-tw/Design%20Systems%20and%20UI%20Libraries/901)

## 參考資料

- Design Tokens Community Group, "Design Tokens Format Module (Editor's Drafts)," W3C CG (2025). https://www.designtokens.org/tr/drafts/format/
- Design Tokens Community Group, "Design Tokens Specification Reaches First Stable Version," W3C CG blog (2025). https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- Kaelig Deloumeau-Prigent, "Proposed Group: Design Tokens Community Group," W3C Community blog (2019). https://www.w3.org/community/blog/2019/07/31/proposed-group-design-tokens-community-group/
- Design Tokens Community Group, "Glossary," designtokens.org (2025). https://www.designtokens.org/glossary/
- Style Dictionary, "DTCG Format Support," styledictionary.com (2025). https://styledictionary.com/info/dtcg/
- Tokens Studio, "Token Format," docs.tokens.studio (2025). https://docs.tokens.studio/manage-settings/token-format
- Terrazzo, "About Terrazzo," terrazzo.app (2025). https://terrazzo.app/docs/reference/about/
- Design Tokens Community Group, "community-group repository," GitHub (2025). https://github.com/design-tokens/community-group
