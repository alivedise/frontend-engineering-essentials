---
id: 915
title: "動效與動畫權杖 — Duration、Easing、Reduced-Motion"
state: draft
slug: motion-tokens
category: Design Systems and UI Libraries
level: mid
---

# [FEE-915] 動效與動畫權杖 — Duration、Easing、Reduced-Motion

:::info
動效權杖將 duration、easing 以及 transition 所作用的屬性提升為設計系統一級原語，與顏色、間距、字體並列。本文盤點 Material 3 與 Carbon 如何規劃動效目錄、W3C Design Tokens Community Group（DTCG）草案如何形式化 `duration`、`cubicBezier` 與複合 `transition` 型別，以及如何在權杖管線中接上 `prefers-reduced-motion`，讓無障礙能力自然落地。Reduced-motion 策略屬於權杖層，單一覆寫即可傳遞到每個元件。
:::

## 背景

顏色、間距、字體是設計權杖世界的經典三項。動效則是多數團隊仍以非正式方式處理的類別，即使每個互動表面都附帶 transition（[Design Tokens Substack, "Motion tokens: naming your movement"](https://designtokens.substack.com/p/motion-tokens-naming-your-movement)）。把動效排除在目錄之外的代價是重複：每位開發者各自挑選代表「快」的個人預設值；某個元件選 120 ms，下一個選 150 ms，再下一個 200 ms，整個系統就失去節奏。共享的動效詞彙把這些猜測收斂成具備一致語意的命名值。

每個動畫由三項原語組成：持續多久（duration）、如何加速與減速（easing，又稱 timing function），以及作用於哪個屬性（property，例如 `opacity`、`transform`）。DTCG 草案格式（修訂版 2025.10）將前兩者形式化為權杖型別：`duration` 是包含數值 `value` 與 `ms` 或 `s` 為單位 `unit` 的物件；`cubicBezier` 是四元數陣列 `[P1x, P1y, P2x, P2y]`，其中 x 座標被夾在 `[0, 1]` 區間（[DTCG Format Module draft](https://www.designtokens.org/tr/drafts/format/)）。

## 視覺對比

| 系統 | 層級 | 權杖／變體 | 數值 |
| --- | --- | --- | --- |
| Material 3 | short1–4 | duration | 50, 100, 150, 200 ms |
| Material 3 | medium1–4 | duration | 250, 300, 350, 400 ms |
| Material 3 | long1–4 | duration | 450, 500, 550, 600 ms |
| Material 3 | extra-long1–4 | duration | 700, 800, 900, 1000 ms |
| Carbon | productive | standard easing | `cubic-bezier(0.2, 0, 0.38, 0.9)` |
| Carbon | expressive | standard easing | `cubic-bezier(0.4, 0.14, 0.3, 1)` |

Material 3 在四個層級中鋪設十六階 duration scale（[Material Components Android, Motion documentation](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)）。Carbon 沿不同軸切分目錄：productive 動效服務於高效、聚焦的微互動，expressive 動效則保留給偶發的重要時刻，這類時刻會因較重的曲線而獲益（[IBM Design Language, Motion basics](https://design-language-website.netlify.app/design/language/motion-ui/basics/)）。

## 範例

DTCG 形狀的複合 `transition` 權杖會引用 duration 與 easing 原語，CSS 層在 `:root` 將其投影為自訂屬性。`prefers-reduced-motion` media query 隨後將全站的 duration 歸零。

```json
{
  "motion": {
    "duration": {
      "fast":     { "$type": "duration",    "$value": { "value": 150, "unit": "ms" } },
      "moderate": { "$type": "duration",    "$value": { "value": 300, "unit": "ms" } }
    },
    "easing": {
      "productive-standard": {
        "$type": "cubicBezier",
        "$value": [0.2, 0, 0.38, 0.9]
      }
    },
    "transition": {
      "hover": {
        "$type": "transition",
        "$value": {
          "duration":       "{motion.duration.fast}",
          "delay":          { "value": 0, "unit": "ms" },
          "timingFunction": "{motion.easing.productive-standard}"
        }
      }
    }
  }
}
```

```css
:root {
  --motion-duration-fast: 150ms;
  --motion-duration-moderate: 300ms;
  --motion-easing-productive-standard: cubic-bezier(0.2, 0, 0.38, 0.9);
}

.button {
  transition:
    background-color var(--motion-duration-fast)
                     var(--motion-easing-productive-standard);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-moderate: 0ms;
  }
}
```

`@media (prefers-reduced-motion: reduce)` 區塊是抑制全站動效的標準位置（[MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)）。

## 最佳實踐

- **SHOULD** 依照變動的尺寸或距離調整 duration，避免將單一 duration token 視為通用：滑動 400 px 的 sheet 不應與在原位淡入的 chip 在相同時間內完成（[IBM Design Language, Motion basics](https://design-language-website.netlify.app/design/language/motion-ui/basics/)）。
- **SHOULD** 在表格與清單中以每列 20 ms 錯開（stagger）進場，並把整段序列控制在 500 ms 之內，讓多個元素同時抵達時的認知負荷維持在低點（[Carbon v10, Choreography](https://v10.carbondesignsystem.com/guidelines/motion/choreography/)）。
- **MUST** 以意圖命名動效權杖（`duration.fast`、`easing.productive-standard`），而非以原始數字命名，如此一來數值可以變動而不必重新命名所有引用。
- **MAY** 在權杖管線需面向 CSS 以外平台（iOS、Android）時，以第三個權杖欄位攜帶受影響屬性，這些平台的 transition 需要明確的屬性綁定。

## 設計思維

DTCG 的 `transition` 型別是刻意設計的組合。`transition` 權杖的 `$type` 為 `transition`，並打包 `duration`、`delay` 與 `timingFunction`，每一項都可以是字面值或指向另一個權杖的別名（[DTCG Format Module draft](https://www.designtokens.org/tr/drafts/format/)）。這種分層形狀同時換到兩項性質：原語得以在多個 transition 間重用，單一 `transition` 權杖則在呼叫端捕捉整段動效的意圖。把權杖翻譯成 CSS、Swift 或 Compose 的工具，便能在不同平台輸出對應的表面形式，而毋須重新推導「hover」代表什麼。

## 深入探討

`duration` 權杖序列化為 `{ "value": <number>, "unit": "ms" | "s" }`，讓建置步驟仍能進行數值運算（transform 可以倍增 value 而保持 unit 不變）。`cubicBezier` 權杖是四元數陣列 `[P1x, P1y, P2x, P2y]`，x 座標被約束在 `[0, 1]`，使曲線維持為合法的 timing function（[DTCG Format Module draft](https://www.designtokens.org/tr/drafts/format/)）。Material 3 以相同的 cubic-bezier 形狀公開其命名 easing — `Standard Decelerate` 為 `cubic-bezier(0, 0, 0, 1)`、`Emphasized Accelerate` 為 `cubic-bezier(0.3, 0, 0.8, 0.15)` — 這讓 M3 目錄與 DTCG 權杖檔之間的往返轉換得以機械化處理（[Material Components Android, Motion documentation](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)）。

## Reduced-Motion 權杖策略

`prefers-reduced-motion: reduce` 是使用者發出的訊號，表示動畫應被移除、削減或替換 — 例如把 slide 換成 fade — 以照顧前庭（vestibular）失調以及其他動效敏感狀況（[MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)）。WCAG 2.3.3（AAA，「Animation from Interactions」）要求互動觸發的動效必須能被停用，除非該動畫對於所傳達的功能或資訊是必要的；遵循 `prefers-reduced-motion` 被列為一項充分技術（[W3C, Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)）。權杖化系統有三種可行策略可達成該門檻。

**策略 1：在權杖層歸零。** 在 `@media (prefers-reduced-motion: reduce)` 內，將每個 duration 自訂屬性覆寫為 `0ms`。元件保留既有的 `transition` 宣告不變；duration 收斂為零，transition 立即完成。這是最簡單的模式，也是 MDN 範例所展示的做法（[MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)）。

**策略 2：純量乘數。** 定義 `--motion-duration-scalar` 自訂屬性（預設為 `1`），用於倍增每個輸出的 duration。在 reduced motion 下，把純量設為 `0`，所有從權杖推導 duration 的元件便自動遵循偏好設定 — 不需逐元件覆寫（[Norton Design System, Motion foundations](https://wwnorton.github.io/design-system/docs/foundations/motion/)）。該純量也可用於非無障礙的調校，例如以半速跑完所有 transition 的 debug 模式。

**策略 3：必要子集。** WCAG 為對功能或資訊必要的動畫保留例外（[W3C, Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)）。權杖系統的對應做法，是把一小部分權杖 — 例如 loading spinner 的 duration、progress bar 的 timing — 標記為必要，並在 reduced-motion 覆寫中跳過它們。其餘目錄仍然歸零，但 spinner 持續轉動。策略 1 或 2 承擔主要負擔；必要子集則是針對性的補充。

預設模式是在 `:root` 為每個權杖宣告一個 CSS 自訂屬性，並用 `@media (prefers-reduced-motion: reduce)` 在全站重寫 duration（[MDN, `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)）。

## 延伸閱讀

- [FEE-910 DTCG Token Format Spec](/zh-tw/Design%20Systems%20and%20UI%20Libraries/dtcg-token-format-spec)
- [FEE-901 Design Tokens](/zh-tw/Design%20Systems%20and%20UI%20Libraries/901)
- [FEE-905 Theming & Dark Mode](/zh-tw/Design%20Systems%20and%20UI%20Libraries/905)

## 參考資料

- Material Components Android, "Motion." https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md
- Google, "Material Design 1 — Duration & easing." https://m1.material.io/motion/duration-easing.html
- IBM Design Language, "Motion / Basics." https://design-language-website.netlify.app/design/language/motion-ui/basics/
- Carbon Design System v10, "Motion / Choreography." https://v10.carbondesignsystem.com/guidelines/motion/choreography/
- W3C Design Tokens Community Group, "Design Tokens Format Module (Editor's Draft)." https://www.designtokens.org/tr/drafts/format/
- Design Tokens Substack, "Motion tokens: naming your movement." https://designtokens.substack.com/p/motion-tokens-naming-your-movement
- W. W. Norton Design System, "Foundations / Motion." https://wwnorton.github.io/design-system/docs/foundations/motion/
- W3C, "Understanding Success Criterion 2.3.3 — Animation from Interactions." https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- MDN Web Docs, "@media / prefers-reduced-motion." https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Design Systems, "5 steps for including motion design in your system." https://www.designsystems.com/5-steps-for-including-motion-design-in-your-system/
