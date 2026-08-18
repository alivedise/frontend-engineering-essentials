---
id: 1900
title: "應用架構與擴展模式總覽"
state: draft
overview: true
slug: application-architecture-overview
---

# [FEE-1900] 應用架構與擴展模式總覽

:::info
本分類涵蓋元件樹**之上**、形塑整個前端應用的決策：原始碼怎麼組織、哪些 import 合法（Feature-Sliced Design）、領域邏輯如何與框架隔離（Clean 與六角架構、Domain-Driven Design）、API 邊界劃在哪裡（Backend-for-Frontend），以及應用如何跨團隊與部署切分（微前端、Server-Driven UI）。分類位於 1900-1999。它的兄弟分類[元件架構與設計模式](/zh-tw/Component Architecture and Design Patterns/500)（500s）回答的是另一個問題：單一元件與其 API 該怎麼設計。這裡的分析單位是模組、依賴方向與團隊邊界；那裡的分析單位是元件。
:::

## 背景

每個前端 codebase 都要回答兩類架構問題。第一類活在元件樹裡面：這個元件該怎麼暴露 API、擁有狀態、與子元件組合？500s 分類負責那些。第二類就是本分類存在的理由，而且只有在規模化之後才開始痛：程式碼住在哪裡、誰可以 import 誰、領域邏輯相對於框架放在哪、後端的責任在哪裡結束、十個團隊怎麼在不互相踩踏的前提下交付同一個產品。這些問題都有帶名字的答案（FSD、六角架構、bounded context、BFF、微前端、Server-Driven UI）、在各公司間重複出現的取捨，以及可以強制執行的工具。本分類的每篇文章各取一個具名答案，展示其機制，並指出它的額外成本從哪一點開始不再划算，因為這裡的每個模式都是擴展模式：太早採用，每一個都是純粹的成本。

## 視覺對比

| | 元件架構（500s） | 應用架構（1900s） |
|---|---|---|
| 回答的問題 | 這個元件與它的 API 怎麼設計？ | 整個應用怎麼組織、劃界、交付？ |
| 分析單位 | 元件、props、狀態所有權 | 模組、layer、依賴方向、團隊/部署邊界 |
| 預防的典型失敗 | prop drilling、抽象洩漏、難用的 API | 交叉 import 糾纏、框架鎖定、團隊耦合、綁死的發布列車 |
| 強制機制 | 型別、code review、元件測試 | 架構 linter、模組邊界、契約、所有權規則 |

分類地圖，依建議閱讀順序：

| id | 文章 | 涵蓋的決策 |
|---|---|---|
| 1902 | [Feature-Sliced Design 與資料夾架構](/zh-tw/Application Architecture and Scaling Patterns/feature-sliced-design) | 程式碼住哪裡；哪些 import 合法 |
| 1903 | [前端的 Clean 與六角架構](/zh-tw/Application Architecture and Scaling Patterns/clean-hexagonal-frontend) | 讓領域邏輯獨立於框架與 I/O |
| 1904 | [前端的 Domain-Driven Design](/zh-tw/Application Architecture and Scaling Patterns/frontend-ddd) | 沿業務領域切分應用；bounded context |
| 1905 | [Backend-for-Frontend 與 API 邊界](/zh-tw/Application Architecture and Scaling Patterns/backend-for-frontend) | 伺服器欠每個用戶端什麼；token 放哪裡 |
| 1906 | [Server-Driven UI](/zh-tw/Application Architecture and Scaling Patterns/server-driven-ui) | 讓伺服器決定用戶端渲染什麼 |
| 1901 | [微前端架構](/zh-tw/Application Architecture and Scaling Patterns/micro-frontend-architecture) | 把一個產品切成獨立部署的多個應用 |

FSD、Clean/六角、DDD 構成第一條弧線（組織單一 codebase：從資料夾到依賴到領域）；BFF、SDUI、微前端構成第二條（把責任分散到服務、伺服器與團隊）。

## 設計思維

本分類反覆出現的取捨是**現在的結構對上現在的速度**。這裡的每個模式都增加間接性：更多資料夾、更多介面、更多服務、更多契約。回報的形狀也永遠相同：變更保持局部、團隊保持解耦、*下一個*功能的成本維持平坦而不是隨 codebase 成長。因此各篇文章共享一種紀律：每篇都指出自己的採用門檻（低於哪個團隊規模、領域複雜度或組織形態時，這個模式就是額外負擔），以及它的強制機制，因為只活在 wiki 圖表裡的架構會隨著每個 sprint 風化。當兩個分類互相指涉時，方向是一致的：1900s 的文章決定元件住在*哪裡*、可以碰什麼；500s 的文章決定它落腳之後怎麼把它做好。

## 延伸閱讀

- [Component Architecture & Design Patterns Overview](/zh-tw/Component Architecture and Design Patterns/500)
- [Monorepos & Workspaces](/zh-tw/Build Tooling and Module Systems/805)
- [State Management Overview](/zh-tw/State Management/600)
- [Codebase Studies Overview](/zh-tw/Codebase Studies/codebase-studies-overview)

## 參考資料

- Martin Fowler, "Software Architecture Guide," martinfowler.com (maintained). https://martinfowler.com/architecture/
- Feature-Sliced Design team, "Welcome," feature-sliced.design (maintained). https://feature-sliced.design/
- Sam Newman, "Pattern: Backends For Frontends," samnewman.io (2015). https://samnewman.io/patterns/architectural/bff/
