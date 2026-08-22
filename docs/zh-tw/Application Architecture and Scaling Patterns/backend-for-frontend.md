---
id: 1905
title: "Backend-for-Frontend（BFF）與 API 邊界"
state: draft
slug: backend-for-frontend
---

# [FEE-1905] Backend-for-Frontend（BFF）與 API 邊界

:::info
Backend-for-Frontend（BFF）是一種 API 邊界模式：每種用戶端（網頁、iOS、Android）各配一個小型伺服器端服務，由最清楚該用戶端需求的團隊擁有，負責聚合下游服務、把回應調整成畫面要的形狀。模式起點在 SoundCloud：官方應用與第三方開發者共用單一公開 API，每個新端點都要先確認它不偏向特定應用，協調成本拖慢所有用戶端團隊，於是他們為不同前端建不同後端，BFF 一詞由 web 技術主管 Nick Fisher 命名。到 2021 年，SoundCloud 運作數十個 BFF，合計每小時處理數億請求。「組裝與轉換邏輯放在哪、由誰擁有」這個問題，其他團隊給出不同答案：美團把 GraphQL 下沉到後端 BFF 之下，網易雲音樂讓大前端自助產出資料介面，閒魚讓用戶端工程師直接寫 FaaS。Sam Newman 提供採用判準：只有單一 web UI 且聚合需求不顯著時，不需要 BFF。SoundCloud 同時記錄了失敗模式：功能整合邏輯在各 BFF 之間重複且實作分歧，用戶端開發者完全自治是幻覺。
:::

## Context

2013 年前後，SoundCloud 的官方應用與第三方開發者共用同一套公開 API。Phil Calçado 回顧當時的成本：每新增一個端點，團隊都要花大量時間確認它沒有為特定應用過度特化、所有用戶端都能輕鬆使用。這條「對誰都要通用」的約束把 API 推向細粒度端點，而細粒度端點迫使用戶端對多個端點發出大量 HTTP 請求，連最簡單的畫面都要多次往返才能渲染。SoundCloud 的解法是為不同的前端建立不同的後端，讓打造用戶端的團隊擁有自己的 API，把跨團隊協調從開發路徑上拿掉。BFF 這個名字由當時的 web 技術主管 Nick Fisher 提出。

同樣的痛出現在規模更大的組織。美團的商品展示場景持續增加，API 數量呈爆炸趨勢，業務支撐效率和投入人力呈線性關係；核心功能的內部邏輯充斥過程式的 if-else，系統複雜度居高不下。網易雲音樂的問題出在組裝層的歸屬：後端工程師除了寫微服務的業務邏輯，還要替前端頁面調度各領域的微服務、組裝與轉換資料；前端頁面改一個欄位，就要等平台後端與業務後端評估、排時程；而這些面向特定頁面的 API，因為 UI 多變，又難以複用。

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

區分 BFF 與這一層的判別測試有兩條。範圍：一個 BFF 只服務一種用戶體驗，與該體驗緊耦合。所有權：BFF 通常由打造該 UI 的同一團隊維護。通用網關兩條都不滿足：它服務所有端，由獨立於各端的團隊擁有；無論做了多少聚合，它仍是 Newman 對照的通用 API 後端。附帶說明：Newman 的頁面全文未出現 API gateway 一詞，通用 API 後端是他的對照案例，上述兩條測試是把它套用到你手上網關的方法。

## Decision Map

| 你的情況 | 建議 | 代價與限制 |
|---|---|---|
| 只有單一 web UI，聚合需求不顯著 | 不建 BFF。Newman 的判準：這種情況只有在聚合需求顯著時，BFF 才有意義 | 組裝邏輯留在現有伺服器端；省下一個要部署維運的服務 |
| 下游微服務數量多，每個畫面都要聚合多次呼叫 | 建 BFF。Newman 的判斷：下游服務少時 BFF 有用，服務多時 BFF 從有用變成必要 | 多一個要部署、監控、輪值的服務 |
| 多種用戶端，回應形狀明顯分化 | 每種體驗一個 BFF（SoundCloud 的做法）；體驗相近的端共用一個（Newman） | 功能整合邏輯會跨 BFF 重複，需要第三次抽取的紀律 |
| 想把組裝層交給前端，但前端人力吃緊、缺前端基礎設施 | 後端 BFF（美團的選擇，它否決前端 BFF 正是因為實施成本高昂） | 組裝層仍由後端擁有，前端改欄位仍要協調；美團另建 metadata 平台壓低這項成本 |
| 前端人力充足，願意投資自助平台 | 大前端自助 GraphQL（網易雲音樂的做法） | 平台要投入建設與維護；原生用戶端工程師要學 GraphQL |
| 已用 Flutter 統一雙端，基礎設施支援 FaaS | 用戶端工程師直接寫 FaaS 層（閒魚的做法） | 只在三端同為 Dart 的前提下成立；30% 效率提升是閒魚單方宣稱的數字 |

## Failure Modes

- **功能整合邏輯跨 BFF 重複且分歧。**SoundCloud 在回顧的「The Bad」一節記錄：跨功能的整合邏輯最後落在各 BFF 內部，重複多次，而且實作彼此分歧、不一致。對策是 Newman 的抽取規則：容忍前兩次重複，第三次實作時抽成共享程式庫或下沉為新的下游服務。抽取太早會重建 BFF 要消除的跨團隊協調，太晚則放任實作分歧。
- **把 BFF 當成完全自治的承諾。**同一篇回顧的「The Ugly」一節下了結論：BFF 位於用戶端與後端兩個世界的交會處，「用戶端開發者完全自治」是幻覺。BFF 減少協調，無法消除協調；以「從此不必和後端打交道」為前提規劃團隊分工，會在整合階段付出代價。
- **低估介面技術的學習成本。**兩個 GraphQL 案例都付過這筆錢：美團發現 GraphQL 的概念學習成本與業務無關，最後把 GraphQL 藏到 metadata 層之下；網易雲音樂明說 GraphQL 對原生用戶端工程師是全新語言。挑選 BFF 的介面技術時，先確認學習成本由誰承擔、能否由平台吸收。

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
