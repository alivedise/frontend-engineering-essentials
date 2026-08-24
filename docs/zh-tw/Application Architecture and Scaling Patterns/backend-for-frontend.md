---
id: 1905
title: "Backend-for-Frontend（BFF）與 API 邊界"
state: draft
slug: backend-for-frontend
---

# [FEE-1905] Backend-for-Frontend（BFF）與 API 邊界

:::info
Backend-for-Frontend（BFF）是一種 API 邊界模式：每種用戶端（網頁、iOS、Android）各配一個小型伺服器端服務，由最清楚該用戶端需求的團隊擁有，負責聚合下游服務、把回應調整成畫面要的形狀。模式起點在 SoundCloud：官方應用與第三方開發者共用單一公開 API，每個新端點都要先確認它不偏向特定應用，協調成本拖慢所有用戶端團隊，於是他們為不同前端建不同後端，BFF 一詞由 web 技術主管 Nick Fisher 命名。到 2021 年，SoundCloud 運作數十個 BFF，合計每小時處理數億請求。「組裝與轉換邏輯放在哪、由誰擁有」這個問題，其他團隊給出不同答案：美團把 GraphQL 下沉到後端 BFF 之下，網易雲音樂讓大前端（網頁與原生用戶端開發的統稱）自助產出資料介面，閒魚讓用戶端工程師直接寫 FaaS（Functions as a Service，程式碼以單一函式為單位部署與運行的伺服器端模式）。Sam Newman 提供採用判準：只有單一 web UI 且聚合需求不顯著時，不需要 BFF。SoundCloud 同時記錄了失敗模式：功能整合邏輯在各 BFF 之間重複且實作分歧，用戶端開發者完全自治是幻覺。模式的代價（多一跳延遲、多一個服務的維運負擔、跨 BFF 重複、攻擊面擴大）與業界採用現況（meta-framework 與 GraphQL 對此模式的吸收與替代）各有專節。
:::

## Context

2013 年前後，SoundCloud 的官方應用與第三方開發者共用同一套公開 API。當時任職於 SoundCloud 的 Phil Calçado 事後回顧這筆成本：每新增一個端點，團隊都要花大量時間確認它沒有為特定應用過度特化、所有用戶端都能輕鬆使用。這條「對誰都要通用」的約束把 API 推向細粒度端點，而細粒度端點迫使用戶端對多個端點發出大量 HTTP 請求，連最簡單的畫面都要多次往返才能渲染。SoundCloud 的解法是為不同的前端建立不同的後端，讓打造用戶端的團隊擁有自己的 API，把跨團隊協調從開發路徑上拿掉。BFF 這個名字由當時的 web 技術主管 Nick Fisher 提出。

同樣的痛出現在規模更大的組織。美團的商品展示場景持續增加，API 數量呈爆炸趨勢，能支撐的業務量只隨投入人力線性成長，沒有槓桿；核心功能的內部邏輯充斥過程式的 if-else，系統複雜度居高不下。網易雲音樂的問題出在組裝層的歸屬：後端工程師除了寫微服務的業務邏輯，還要替前端頁面調度各領域的微服務、組裝與轉換資料；前端頁面改一個欄位，就要等平台後端與業務後端評估、排時程；而這些面向特定頁面的 API，因為 UI 多變，又難以複用。

把這些案例並排，模式要處理的問題就浮現了：為畫面組裝與轉換資料的那一層程式碼，放在哪裡、由誰擁有。留在通用 API 裡，會複製 SoundCloud 的協調成本與請求數量；留在後端團隊手上，會複製網易雲音樂的排時程等待。BFF 模式把這層邏輯獨立成服務，交給貼近畫面的團隊。至於交給哪個團隊、用什麼介面技術，四個具名系統給出四種變體。

## Visual

| 系統 | 變體 | 組裝層由誰擁有 | 介面技術 | 公開的結果與代價 |
|---|---|---|---|---|
| SoundCloud | 每種體驗一個 BFF | 各用戶端團隊 | 細粒度 HTTP 端點，回應形狀依端分化 | 2021 年運作數十個 BFF，合計每小時數億請求；功能整合邏輯跨 BFF 重複、實作分歧 |
| 美團 | 後端 BFF，GraphQL 下沉為執行引擎 | 後端工程師 | metadata 驅動，開發者不直接接觸 GraphQL 概念 | 展示邏輯複用超過 50%，研發效率提升 1 倍以上 |
| 網易雲音樂 | 大前端自助組裝 | 大前端（網頁與原生用戶端開發的統稱）工程師 | GraphQL 加低程式碼（low-code）平台 | 約半年內大前端自主產出 160 多個資料介面；原生用戶端工程師有學習成本 |
| 閒魚 | 用戶端工程師寫 FaaS | 用戶端工程師 | Dart 統一 Android、iOS、FaaS 三端 | 宣稱在 Flutter 雙端一體之上再提升 30% 整體研發效率 |

四個變體回答同一個問題：組裝層的所有權要往用戶端方向推多遠。SoundCloud 推到用戶端團隊，美團停在後端，網易雲音樂用平台讓大前端自助，閒魚直接讓用戶端工程師寫伺服器端函式。表中沒有「維持單一通用 API、不建 BFF」這一列，該選項的適用條件在 Decision Map。

## Example

SoundCloud 在 2021 年的回顧記錄了各端回應形狀的實際分化：行動用戶端偏好大回應、內嵌大量實體，以減少請求次數；web 前端偏好細粒度回應，之後按畫面需要動態補抓。下面兩段程式碼是為了說明機制而虛構的，但兩個端點的形狀差異直接對應 SoundCloud 記錄的偏好：同一個曲目頁，mobile BFF 一次回傳曲目、使用者與留言，web BFF 只回傳曲目本體，外加後續抓取用的 URL。

```js
// mobile-bff/routes/track-page.js
// One request; user and comments embedded, per the mobile preference
// for large responses with embedded entities.
app.get('/track-page/:id', async (req, res) => {
  const track = await tracks.get(req.params.id);
  const [user, comments] = await Promise.all([
    users.get(track.userId),
    comments.listFor(track.id, { limit: 20 }),
  ]);
  res.json({ track, user, comments });
});

// web-bff/routes/track-page.js
// Finer-grained response; the web client augments dynamically
// with follow-up calls only for the panels it renders.
app.get('/track-page/:id', async (req, res) => {
  const track = await tracks.get(req.params.id);
  res.json({
    track: { id: track.id, title: track.title, streamUrl: track.streamUrl },
    userId: track.userId,
    commentsUrl: `/tracks/${track.id}/comments`,
  });
});
```

兩個端點回傳的酬載如下：

```json
// GET mobile-bff/track-page/91 -> one round trip, everything embedded
{ "track": { "id": 91, "title": "…", "streamUrl": "…", "userId": 7 },
  "user": { "id": 7, "name": "…", "avatarUrl": "…" },
  "comments": [ { "id": 501, "body": "…" }, { "id": 502, "body": "…" } ] }

// GET web-bff/track-page/91 -> minimal payload plus URLs for augmentation
{ "track": { "id": 91, "title": "…", "streamUrl": "…" },
  "userId": 7,
  "commentsUrl": "/tracks/91/comments" }
```

兩個路由分屬兩個 BFF，各由對應的用戶端團隊擁有。行動團隊想在回應裡多嵌一個實體，改自己的 BFF 就完成，不需要與 web 團隊或平台團隊協調。這就是 Calçado 描述的模式核心：讓打造用戶端的團隊擁有自己的 API。

## Best Practices

- **一種體驗一個 BFF。**Newman 的原則是 one experience, one BFF：iOS 與 Android 的體驗非常相近時，兩端共用一個 BFF 就足夠；兩者分歧大時，分開的 BFF 比較合理。判準是體驗的相近程度，按平台數量硬拆會多建服務。
- **跨 BFF 的重複先容忍，第三次再抽取。**每個介面各配一個 BFF，BFF 之間會累積大量重複，這是 Newman 點名的隱憂。他的處置規則：同一邏輯要實作第三次時，才抽成共享程式庫或新的下游服務。SoundCloud 的運作記錄顯示重複邏輯放著不管的樣子：整合邏輯重複多次、實作彼此分歧。
- **介面技術的概念成本，用平台吸收，別轉嫁給業務開發者。**美團起初讓開發者直接使用 GraphQL，發現它的概念對沒接觸過的工程師有學習與理解成本，而這些概念和業務領域沒有關係；後來把 GraphQL 下沉到 BFF 之下，改以 metadata（描述展示邏輯的結構化設定）驅動。新研發模式落地後，展示邏輯複用超過 50%，效率提升 1 倍以上。
- **讓組裝層的變更不必等別的團隊排時程。**網易雲音樂把資料組裝工作交給大前端自助完成，與後端在組裝層解耦；上線約半年，大前端自主產出 160 多個資料介面。他們同時承認代價：對原生用戶端工程師，GraphQL 是一門全新的語言，學習成本要算進導入計畫。
- **先評估組織付不付得起選定的變體。**美團否決前端 BFF（由前端工程師寫 Node 層）的理由是它需要大量前端人力和完善的前端基礎設施，實施成本高昂，因此選了後端 BFF。閒魚能讓用戶端工程師直接寫 FaaS 層，前提是 Flutter 已把 Android 與 iOS 統一成 Dart，三端同語言之後，用戶端工程師才寫得動伺服器端函式。

## 邊界：BFF 還是 API Gateway？

Newman 的模式文本以 general-purpose API backend（通用 API 後端）作為 BFF 的對照物，並記錄這一層的病灶：它承接多重責任，工作量大到需要成立專職團隊來維護；前端團隊要改動，得跨團隊對接；這一層最終成為不聚焦任何業務領域的 middleware。

區分 BFF 與這一層的判別測試有兩條。範圍：一個 BFF 只服務一種用戶體驗，與該體驗緊耦合。所有權：BFF 通常由打造該 UI 的同一團隊維護。通用網關兩條都不滿足：它服務所有端，由獨立於各端的團隊擁有；無論做了多少聚合，它仍是 Newman 對照的通用 API 後端。附帶說明：Newman 的頁面全文未出現 API gateway 一詞，通用 API 後端是他的對照案例，上述兩條測試是把這套判別套用到你手上網關的方法。

## 代價

前面各節展開的是效益，這一節集中列出模式的四項成本，每項都有具名出處。

- **多一個網路跳點的延遲。**微軟 Azure 架構中心把延遲列進此模式的考量清單：用戶端請求由直連服務改為多經一個 BFF，多出的網路跳點可能增加延遲。Newman 補充環境背景：BFF 常用於微服務環境，這種環境本來就因為網路呼叫數量多而對延遲敏感。
- **多一個服務的完整生命週期。**同一份微軟文件寫明：每多維護與部署一個服務，維運負擔就增加，因為每個服務都有自己的生命週期、部署與維護需求、安全需求。Newman 給出自己的重新考慮條件：部署額外服務的成本高時，他會重新評估要不要採用此模式。
- **跨 BFF 重複。**SoundCloud 的實錄（見 Failure Modes）在微軟文件中被一般化成模式本身的屬性：程式碼重複是此模式的可能結果，要拿它和更貼合各端的體驗做權衡。Marmelab 的 Zaninotto 同樣把跨 BFF 的邏輯重複列為風險。
- **攻擊面與組織成本。**Zaninotto 指出每多一個 BFF，系統整體的攻擊面（暴露給攻擊者的入口總和）就再擴大一圈；他並點名額外負擔不划算的情境：單一前端的應用、以 CRUD（建立、讀取、更新、刪除）為主的應用、小團隊。組織成本在美團的選型紀錄裡最具體：前端 BFF 需要大量前端人力與完善的前端基礎設施，等於前端團隊要自己維運一層伺服器，美團因此否決這個變體、改選後端 BFF。

## Decision Map

| 你的情況 | 建議 | 代價與限制 |
|---|---|---|
| 只有單一 web UI，聚合需求不顯著 | 不建 BFF。Newman 的判準：這種情況只有在聚合需求顯著時，BFF 才有意義 | 組裝邏輯留在現有伺服器端；省下一個要部署維運的服務 |
| 下游微服務數量多，每個畫面都要聚合多次呼叫 | 建 BFF。Newman 的判斷：下游服務少時 BFF 有用，服務多時 BFF 從有用變成必要 | 多一個要部署、維護、監控的服務 |
| 多種用戶端，回應形狀明顯分化 | 每種體驗一個 BFF（SoundCloud 的做法）；體驗相近的端共用一個（Newman） | 功能整合邏輯會跨 BFF 重複，需要第三次抽取的紀律 |
| 想把組裝層交給前端，但前端人力吃緊、缺前端基礎設施 | 後端 BFF（美團的選擇，它否決前端 BFF 正是因為實施成本高昂） | 組裝層仍由後端擁有，前端改欄位仍要協調；美團另建 metadata 平台壓低這項成本 |
| 前端人力充足，願意投資自助平台 | 大前端自助 GraphQL（網易雲音樂的做法） | 平台要投入建設與維護；原生用戶端工程師要學 GraphQL |
| 已用 Flutter 統一雙端，基礎設施支援 FaaS | 用戶端工程師直接寫 FaaS 層（閒魚的做法） | 只在三端同為 Dart 的前提下成立；30% 效率提升是閒魚單方宣稱的數字 |
| 已用 Next.js、Remix 等自帶伺服器端路由的 meta-framework | 用框架內建的路由層當 BFF 宿主，不另立服務；兩家官方文件都以 BFF 定位這層能力 | Next.js 明言其後端能力是 API 層、無法完整替代後端；Remix 定位自己既可作為 fullstack 應用，也可純當既有後端前面的 BFF |
| 已用 GraphQL 且前端擁有專屬 resolver | 重新評估獨立 BFF：微軟的模式文件明言此時 BFF 服務可能不再增加價值 | Netflix 用 GraphQL federation 維持單一 API 門面，代價是圖大到沒有任何一個人理解全貌 |

## Failure Modes

- **功能整合邏輯跨 BFF 重複且分歧。**SoundCloud 在回顧的「The Bad」一節記錄：跨功能的整合邏輯最後落在各 BFF 內部，重複多次，而且實作彼此分歧、不一致。對策是 Newman 的抽取規則：容忍前兩次重複，第三次實作時抽成共享程式庫或下沉為新的下游服務。抽取太早會重建 BFF 要消除的跨團隊協調，太晚則放任實作分歧。
- **把 BFF 當成完全自治的承諾。**同一篇回顧的「The Ugly」一節下了結論：BFF 位於用戶端與後端兩個世界的交會處，「用戶端開發者完全自治」是幻覺。BFF 減少協調，無法消除協調；以「從此不必和後端打交道」為前提規劃團隊分工，會在整合階段付出代價。
- **低估介面技術的學習成本。**兩個 GraphQL 案例都付過這筆錢：美團發現 GraphQL 的概念學習成本與業務無關，最後把 GraphQL 藏到 metadata 層之下；網易雲音樂明說 GraphQL 對原生用戶端工程師是全新語言。挑選 BFF 的介面技術時，先確認學習成本由誰承擔、能否由平台吸收。

## 業界採用現況

先交代證據狀態：截至 2026 年 8 月，公開資料中查不到 BFF 採用率的量化調查，也查不到具名團隊公開撰寫的 BFF 退役或合併覆盤。因此本節對採用廣度只能做定性判斷，依據是三類間接證據。

- **技術雷達的追蹤止於 2016 年。**ThoughtWorks 技術雷達對 BFF 的正式評級只有 2015 年 11 月與 2016 年 4 月兩期的 Trial，之後未再收錄。頁面的存檔聲明說近幾期出現過的條目很可能仍然適用，所以停止收錄不能直接讀成模式失效；紀錄能確定的是，此後十年雷達沒有再把它列為要追蹤的技術。
- **需求被 meta-framework 吸收。**meta-framework（在 React 等 UI 函式庫之上提供路由與伺服器端能力的框架）已把 BFF 收編為內建能力。Next.js 官方指南直接以 Backend for Frontend 為題，把 Route Handlers（在前端專案內定義 HTTP 端點的機制）與 proxy 列為實作手段，同時自我設限：這些能力是 API 層，無法完整替代後端。Remix 官方指南把框架伺服器定位為 BFF 宿主，職責限定為服務前端 web app、連接它需要的資料庫與既有後端 API，並明言成熟應用不必把 Ruby、Elixir、PHP 後端遷移到伺服器端 JavaScript，直接把 Remix app 當 BFF 用。在這兩個框架上，團隊寫了 BFF 層，卻不會多出一個叫 BFF 的獨立服務，模式的使用量因此不會以服務數量的形式浮現在外界視野裡。
- **GraphQL 是文件明載的替代路徑。**微軟 Azure 架構中心寫明：GraphQL 的查詢機制讓用戶端自行指定所需資料，可消除獨立 BFF 層的需求；已採用 GraphQL 且前端擁有專屬 resolver（負責取回特定欄位資料的函式）的組織，BFF 服務可能不再增加價值。Netflix 是這條路徑的具名案例：其 API 聚合層曾膨脹成工程師口中「新的單體」，團隊用 GraphQL federation（把多個子圖組合成單一查詢入口的機制）拆解這層的實作，同時對所有用戶端保留單一統一 API 的門面。兩位 Netflix API 工程師的 QCon 講稿全文沒有出現 BFF 一詞：面對同一個「用戶端與眾多微服務之間需要一層」的問題，Netflix 讓每個用戶端都打同一個聯邦化的圖，沒有為每種體驗各建一個服務。
- **不採用的具名理由。**Marmelab 的 Zaninotto 列出模式不划算的情境：單一前端的應用、以 CRUD 為主的應用、小團隊；後端 API 已支援選欄位與內嵌關聯資料時，BFF 的效益有限。微軟的適用性判準同向：各介面對後端發出相同或相似請求時、只有單一介面與後端互動時，此模式可能不適用。這些條件從反面重述了 Decision Map 第一列：單一介面、聚合需求不顯著的產品，本來就在模式作者劃定的適用界線之外。

三類證據合起來的定性結論：BFF 作為獨立部署的服務，公開具名實踐集中在多端、下游微服務眾多的大型組織，即本文的 SoundCloud、美團、網易雲音樂、閒魚這種形態；在其他形態的產品裡，這個需求或者不成立（單一介面），或者被 meta-framework 的伺服器端路由與 GraphQL 吸收成內建能力。採用率沒有量化數據可引，「業界普遍採用」與「業界已拋棄」兩種說法都缺乏依據。

## Related Topics

- [前端的 Domain-Driven Design](/zh-tw/frontend-ddd)
- [Server-Driven UI](/zh-tw/server-driven-ui)

## References

- Phil Calçado, "The Back-end for Front-end Pattern (BFF)," philcalcado.com (2015). https://philcalcado.com/2015/09/18/the_back_end_for_front_end_pattern_bff.html
- SoundCloud, "Service Architecture at SoundCloud — Part 1: Backends for Frontends," SoundCloud Backstage Blog (2021). https://developers.soundcloud.com/blog/service-architecture-1/
- 美團技術團隊, "GraphQL及元數據驅動架構在後端BFF中的實踐," 美團技術博客 (2021). https://tech.meituan.com/2021/05/06/BFF-GraphQL.html
- 網易雲音樂技術團隊, "基於 GraphQL 的雲音樂 BFF 建設實踐," SegmentFault (2023). https://segmentfault.com/a/1190000043184277
- 閒魚技術, "閒魚架構如何一招提效30%？Flutter+Serverless 研發實踐公開," 阿里雲開發者社區 (2020). https://developer.aliyun.com/article/740787
- 閒魚技術, "高效研發——閒魚在數據聚合上的探索與實踐," CSDN (2018). https://blog.csdn.net/weixin_38912070/article/details/93857103
- Sam Newman, "Backends For Frontends," samnewman.io. https://samnewman.io/patterns/architectural/bff/
- Microsoft Azure Architecture Center, "Backends for Frontends Pattern" (2025). https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends
- François Zaninotto, "Do you need a Backend For Frontend?," Marmelab blog (2025). https://marmelab.com/blog/2025/10/01/do-you-need-a-backend-for-frontend.html
- ThoughtWorks Technology Radar, "BFF - Backend for Frontends." https://www.thoughtworks.com/radar/techniques/bff-backend-for-frontends
- Next.js Docs, "How to use Next.js as a backend for your frontend." https://nextjs.org/docs/app/guides/backend-for-frontend
- Remix Docs, "Backend For Your Frontend." https://remix.run/docs/en/main/guides/bff
- Jennifer Shin and Stephen Spalding, "How Netflix Scales its API with GraphQL Federation," QCon Plus talk, InfoQ (2020). https://www.infoq.com/presentations/netflix-api-graphql-federation/
