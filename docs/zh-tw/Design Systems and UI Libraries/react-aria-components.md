---
id: 913
title: React Aria Components — Adobe 的 Contexts 與 Slots 組合模型
state: draft
slug: react-aria-components
category: Design Systems and UI Libraries
level: senior
---

# [FEE-913] React Aria Components — Adobe 的 Contexts 與 Slots 組合模型

:::info
React Aria Components（RAC）是 Adobe 在 React Aria hooks 之上提供的無樣式元件層，將每個無障礙行為以 JSX 形式公開，同時保留底層 hooks 供邊界情境使用。其組合模型以每個元件搭配的 React context 為核心，再加上 `slot` 字串 prop 用以區分同一 context 下的具名子元素。RAC 於 2023 年 12 月 20 日達成 1.0 GA，其 slot 系統與 Radix 的 `<Slot>` / `asChild` 不同，解決的是不同問題。
:::

## 背景

Adobe 於 2020 年 7 月一併推出 React Spectrum、React Aria 與 React Stately 三個函式庫。發表文章直接說明了這個分層：「React Spectrum 包含三個函式庫：React Spectrum — Adobe 設計系統 Spectrum 的 React 實作；React Aria — 一組為設計系統提供無障礙 UI primitive 的 React Hooks；React Stately — 一組為設計系統提供跨平台狀態管理與核心邏輯的 React Hooks。」這個切分依照關注點分層：狀態放在 React Stately、ARIA 行為與鍵盤連動放在 React Aria、最上層的 Spectrum 視覺呈現放在頂層函式庫。Adobe 自己的描述是：「React Spectrum 將每個元件拆成三個部分：state、behavior 與 rendered component。」使用者可依照自己想保留多少設計系統，挑選對應的層級。

hook 層級雖然強大，但 Adobe 自己的 RFC 也承認存在實際的採用門檻：「我們也收到回饋指出學習曲線非常陡峭，API 複雜且難以拼裝。」對於只想要一顆有正確 ARIA 語意且帶樣式按鈕的團隊而言，把 `useButton`、`useFocusRing`、`usePress`、`useHover` 以及多個 state hooks 串在一起，成為反覆出現的成本。

React Aria Components 就是回應。RFC 將其描述為：「一組實作 ARIA 模式的無樣式元件函式庫，以薄薄一層的方式建立在我們既有的 React Aria hooks 之上。」兩個層級被設計為可互通：「元件與 hooks 也能協同運作，依所需的客製化程度搭配混用。」團隊可在 90% 的 UI 採用元件層，並在需要量身打造 DOM 的情境下回退到 hooks。RAC 於 2023 年 12 月 20 日達成 1.0 GA，Adobe 在發行頁面公告：「經過一年的開發，我們很高興宣布 React Aria Components 的 GA 釋出。」

## 視覺對比

| 面向 | React Aria（hook 層） | React Aria Components（RAC） |
| --- | --- | --- |
| 形式 | React hooks；由使用者渲染所有 DOM | React 元件；DOM 由函式庫渲染 |
| 樣式 | 使用者從零開始為每個元素加樣式 | 在已渲染 DOM 上以 `className` / `style` / `data-*` 選取器套用樣式 |
| 複雜度 | 較高；單一模式需組合多個 hooks | 較低；每個 ARIA 模式對應一個元件 |
| 客製彈性 | 最大；任意 DOM、任意標記 | 高；render 函式 children 加上 context 注入的 props |

## 範例

下方範例展示一個 `<Button>` 放在自訂 `ButtonContext` provider 之內。按鈕從 props 讀取 `slot="confirm"`，provider 僅針對該 slot 注入額外 props。render 函式 child 讀取 RAC 的 render-state 物件，使樣式能依互動狀態反應。

```tsx
import { Button, ButtonContext } from 'react-aria-components';

function ConfirmDialog() {
  return (
    <ButtonContext.Provider
      value={{
        slots: {
          confirm: { className: 'btn btn-primary', autoFocus: true },
          cancel: { className: 'btn btn-ghost' },
        },
      }}
    >
      <Button slot="cancel">Cancel</Button>
      <Button slot="confirm">
        {({ isPressed, isPending }) =>
          isPending ? 'Saving...' : isPressed ? 'Saving!' : 'Save'
        }
      </Button>
    </ButtonContext.Provider>
  );
}
```

render 函式 child 模式記錄於樣式頁：「className 與 style props 也接受函式，函式會接收用於樣式判斷的狀態。」此處公開的 render 狀態包含 `isPressed`、`isSelected`、`isFocused` 與 `isPending`。

## 最佳實踐

- **SHOULD** 當樣式規則純粹屬於視覺層面時，優先使用 `data-*` 屬性選取器而非 render 函式 children。樣式文件指出：「React Aria 透過 data 屬性公開 pressed、hovered、selected 等 UI 狀態。」純 CSS 或 Tailwind 選取器可直接命中這些屬性，無需強迫使用者改用函式 child 語法。
- **MAY** 當元件恰好處於某個 provider 之下卻應忽略它時，可使用 `slot={null}` 退出 ambient context。`<Button>` 參考文件指出：「明確的 null 值代表本地 props 完全覆蓋從父層接收到的所有 props。」當你將 RAC primitive 包進另一個共用相同 context 型別的 RAC primitive 時，可使用此寫法。
- **SHOULD** 將 RAC 預設視為無樣式，並為每個介面選擇單一樣式方案。樣式文件直白指出：「React Aria 預設不包含任何樣式……另外也提供了 Tailwind CSS plugin。」官方 Tailwind plugin 將 RAC 的 `data-*` 屬性對應到較短的 modifier 名稱；純 CSS、CSS Modules 與 CSS-in-JS 都可運作，因為合約只是真實 DOM 上的屬性。

## 深入探討

兩個輔助 hooks 公開了驅動 slot 系統的機制。`useContextProps` 是合併 primitive：依客製化文件，「useContextProps hook 將本地 props 與父元件透過 context 提供的 props 進行合併。」每個 RAC 元件在內部都會呼叫此 hook，使使用者提供的 props 在多數情境覆蓋 context 提供的 props，唯有定義了合併行為之處例外（例如 refs、事件處理器、class names）。希望加入相同組合合約的自訂元件可呼叫 `useContextProps(localProps, ref, SomeContext)`，並取回合併後的 `[props, ref]` tuple。

`useSlottedContext` 則是讀取 primitive，當元件需要在合併之前檢視原始 context 值時使用。它會回傳目前 `slot` key 對應的值，或在未設定 slot 時回傳未具名的值。需要根據父層是否提供 context 來分支的自訂包裝元件，會使用此 hook 而非直接使用 `useContext`，因為 RAC 的合約是 `{ slots: { [slotName]: props } }` 而非扁平的 props 物件。

集合元件（`Select`、`ListBox`、`Menu`、`ComboBox`、`Tree`、`GridList`、`Table`、`TagGroup`）對其 item 型別採泛型設計。`Select` 參考文件展示其簽章 `export interface SelectProps<T extends object, M extends 'single' | 'multiple'>`，此型別會傳遞至 `items` 與 `children` render 函式參數。型別安全的動態集合渲染採用 `<Select items={users}>{user => <Item key={user.id}>{user.name}</Item>}</Select>` 形式，其中 `user` 會被推論為 `items` 的元素型別而非 `unknown`。

## 組合模式範例

**模式 1 — 每個元件配對的 context。** 每個 RAC 元件都匯出一個 context：客製化文件指出「每個 React Aria Component 都匯出對應的 context，可用以建構與內建元件類似的組合式 API。」`ButtonContext`、`ListBoxContext`、`LabelContext`、`InputContext` 等皆可匯入，每個都接受 `{ slots, ...defaultProps }` 形狀的值。使用者以 `<ButtonContext.Provider value={...}>` 包裹樹的某段，便可為每個巢狀的 `<Button>` 注入預設值，而無需 prop drilling。

**模式 2 — `slot` 字串 prop 對應單一具名子元素。** 客製化文件將 slots 定義為「元件內部具有獨立行為與樣式的具名子元素」。一個包含遞增與遞減按鈕的 `<NumberField>`，在兩個 `<Button>` children 上分別設定 `slot="increment"` 與 `slot="decrement"`；兩者共用 `ButtonContext`，但各自從 slot map 取得不同的注入 props。RAC 即以此方式區分「送出按鈕」與「取消按鈕」，無需匯出兩種不同的按鈕型別。

**模式 3 — `<Provider>` 工具元件組合多個 contexts。** 手動巢狀大量 providers 會顯得雜亂。客製化文件記錄了該輔助元件：`<Provider values={[[ButtonContext, {/* ... */}], [InputContext, {/* ... */}]]}>{/* ... */}</Provider>`。當自訂欄位元件想同時為 labels 與 inputs 設定預設值時，可在單一 `<Provider>` 內設定兩個 keys，而不必巢狀四層 providers。

**模式 4 — 型別安全集合搭配 render 函式 children。** 集合元件透過泛型攜帶其 item 型別：`SelectProps<T extends object, M extends 'single' | 'multiple'>`。傳入 `items={users}` 後，TypeScript 會將 render 函式參數推論為 `User`，因此 `<Select items={users}>{user => <Item id={user.id}>{user.name}</Item>}</Select>` 不需手動標註泛型即可通過型別檢查。

**模式 5 — render 函式形式的 `children` / `className` / `style`。** 樣式文件確認：「className 與 style props 也接受函式，函式會接收用於樣式判斷的狀態。」當僅靠 CSS 的 `data-*` 選取器無法表達規則時（例如條件式內容而非僅條件式樣式），函式 child 形式可接收 `isPressed`、`isSelected`、`isFocused`、`isPending` 等狀態。

**與 Radix 的釐清。** Adobe 並未匯出 `<Slot>` 元件。在 RAC 中，「slot」是每個元件上的字串 prop，以及透過 Context 傳遞的 `{ slots: { [name]: props } }` 值中的物件 key。沒有可渲染的 `<Slot>` 元素。Radix 的 `<Slot>` 與 `asChild` 解決的是另一個問題：將 props 合併到使用者提供的單一子元素上，使該子元素成為被渲染的 DOM 節點。RAC 的 slot 系統處理的是同一共用 context 之下多個具名實例。兩種模式無法互換，在兩個函式庫之間遷移的團隊需要轉譯意圖，而非僅僅改名 token。

## 設計思維

Adobe 在 RFC 中陳述的長期計畫是：「React Spectrum 中許多較簡單的元件可改為建構於 React Aria Components 之上，而非建構於 hooks 之上。」上層帶樣式的函式庫（React Spectrum）將成為 RAC 之上的薄主題層，而 hooks 仍保留給真正需要量身 DOM 的元件使用。在常見情境下，三層架構會收斂為兩層，hook 逃生口則保留給最棘手的 5%。

## 延伸閱讀

- [Zag.js and Ark UI](/zh-tw/Design%20Systems%20and%20UI%20Libraries/zag-and-ark-ui)
- [Headless Component Libraries](/zh-tw/Design%20Systems%20and%20UI%20Libraries/902)

## 參考資料

- Adobe, "Introducing React Spectrum," React Spectrum blog (2020). https://react-aria.adobe.com/blog/introducing-react-spectrum
- Adobe, "RFC: React Aria Components," react-spectrum GitHub (2023). https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md
- Adobe, "December 20, 2023 Release," React Spectrum releases (2023). https://react-spectrum.adobe.com/releases/2023-12-20.html
- Adobe, "Advanced Customization," React Aria docs. https://react-aria.adobe.com/customization
- Adobe, "Styling," React Aria docs. https://react-aria.adobe.com/styling
- Adobe, "Select," React Aria docs. https://react-aria.adobe.com/Select
- Adobe, "Button," React Aria docs. https://react-aria.adobe.com/Button
- Adobe, "React Aria," React Aria docs home. https://react-aria.adobe.com/
- Adobe, "react-spectrum," GitHub repository. https://github.com/adobe/react-spectrum
