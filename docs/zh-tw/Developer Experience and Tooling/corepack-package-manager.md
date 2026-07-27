---
id: 1614
title: "Corepack 與 packageManager 欄位：鎖定工具鏈版本"
state: draft
slug: corepack-package-manager
reviewed: hardened
reviewed_on: 2026-07-27
---

# [FEE-1614] Corepack 與 `packageManager` 欄位：鎖定工具鏈版本

:::info
Corepack 是一個零執行期相依的 Node.js 腳本，作為 Node 專案與 Yarn、npm、pnpm 之間的橋樑，無需全域安裝即可使用這些套件管理器。它搭配 `package.json` 中的 `packageManager` 欄位，將管理器二進位檔鎖定至精確版本（並可選擇加上 SHA-224 完整性雜湊），消除開發者機器與 CI 之間的版本漂移。Yarn 將該欄位定位為鎖定管理器本身，與相依鎖定檔並列。鎖定管理器二進位檔，並在 CI 中明確執行 `corepack enable`；在 Node v25 上需先從 npm 安裝 Corepack，因為 Corepack 不再隨 runtime 內建。
:::

## 背景

Corepack 出現之前，專案仰賴 `engines.npm` 提示、README「請使用 Yarn 1」備註，或在啟動時執行 `npm install -g yarn@x.y.z` 的腳本。這些方式都無法強制使用產生鎖定檔的管理器版本，因此團隊經常將 pnpm 8 寫出的 `pnpm-lock.yaml` 出貨，而 pnpm 9 卻拒絕讀取。Corepack 是一個 Node 腳本，「在開發期作為 Node.js 專案與其預期使用的套件管理器之間的橋樑」並「讓你無需安裝即可使用 Yarn、npm 與 pnpm」（nodejs/corepack README）。自 Node.js 14.19 / 16.9 起，所有官方 Node.js 版本皆內建 Corepack，但維持選擇性啟用：`corepack enable` 啟動 shim（yarnpkg.com/corepack）。Yarn 的文件將此框架說得明白：「就像專案相依必須鎖定，套件管理器本身也應該鎖定」（yarnpkg.com/corepack）。`packageManager` 欄位就是這把鎖。

某六人前端團隊的開發者本機跑 `pnpm 8.15` 並提交了 `pnpm-lock.yaml`。一位使用 `pnpm 9` 的隊友拉取 main 後撞到鎖定檔格式錯誤。CI 透過通用的 `npm install -g pnpm` 步驟安裝 pnpm，視 registry 鏡像快取狀況有時用 8、有時用 9，同一個 commit 出現不穩定的綠紅交替。在 `package.json` 加入 `"packageManager": "pnpm@9.15.4+sha224.<hex>"` 並將 CI 改用 `corepack enable` 之後，每台機器都解析到同一個 pnpm 二進位檔，完整性雜湊可拒絕被竄改的 tarball，鎖定檔格式不一致也消失了。

## 圖解

`packageManager` 欄位語法：

| 元件 | 必填 | 範例 | 備註 |
| --- | --- | --- | --- |
| `<name>` | 是 | `pnpm` | 為 `npm`、`pnpm`、`yarn` 之一。 |
| `@<semver>` | 是 | `@9.15.4` | 精確版本。範圍寫法不會被尊重。 |
| `+sha224.<hex>` | 選用 | `+sha224.abcd...` | tarball 的 SHA-224。強烈建議。 |

完整範例：`pnpm@9.15.4+sha224.535a55ada2cf01ddee0f9b8dfe5e0a8b7e1ec0c8d5a4f2e7b5b3d1a2`。

## 範例

以完整性雜湊鎖定 pnpm 的 `package.json` 片段：

```json
{
  "name": "checkout-service",
  "version": "1.4.0",
  "packageManager": "pnpm@9.15.4+sha224.535a55ada2cf01ddee0f9b8dfe5e0a8b7e1ec0c8d5a4f2e7b5b3d1a2",
  "scripts": {
    "build": "vite build",
    "test": "vitest run"
  }
}
```

要產生該欄位，pnpm 將 `corepack use` 列為標準入口：「你可使用以下指令鎖定專案使用的 pnpm 版本：`corepack use pnpm@latest-10`。這會在本地 `package.json` 加入 `packageManager` 欄位，指示 Corepack 在該專案永遠使用特定版本」（pnpm.io/installation）。該指令「擷取符合所提供描述符的最新版本，將其指派至專案的 package.json，並自動執行安裝」（nodejs/corepack README）。

使用鎖定管理器的最小 GitHub Actions workflow：

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

在 Node 25 及更新版本上，`corepack enable` 那一行改為：

```yaml
      - run: npm install -g corepack@latest && corepack enable
```

## 最佳實踐

- **必須**在 Node v25 及更新版本的 CI 中明確執行 `corepack enable`。Node v25 不再隨附 Corepack 二進位檔；「目前依賴 Node.js 內建 `corepack` 執行檔的使用者可改用 userland 提供的 corepack 模組」（Node.js v22 API 文件）。在呼叫 `corepack enable` 之前，先從 npm 安裝 Corepack。
- **必須**為任何要部署到多台機器的專案加入帶 SHA-224 完整性雜湊的 `packageManager` 欄位。雜湊格式記載於 nodejs/corepack README：「雜湊為選用，但作為安全做法強烈建議加上。」
- **應該**將 `corepack enable` 設為每個觸及 Node 的 CI 工作的第一步。該指令「在其旁邊為每個指定的套件管理器建立 shim」（nodejs/corepack README），讓 `pnpm`、`yarn` 與 `npm` 都解析到鎖定的版本。
- **應該**以 `corepack up` 處理日常 minor 與 patch 的版本提升。該指令「擷取目前主版本線上最新可用版本」（nodejs/corepack README），所以可追蹤 Yarn 4.x 或 pnpm 10.x 而不會意外跨越 major 邊界。
- **可以**在離線或受限的 CI 中以 `corepack pack` 預先填入快取。其輸出是「適用於 `corepack install -g` 的 tarball」（nodejs/corepack README）。
- **可以**在受規範環境中設定 `COREPACK_ENABLE_NETWORK=0`。設定該變數後 Corepack 不會存取網路，「此時你必須自行透過 `corepack install -g --cache-only` 預先填入專案所需的套件管理器版本」（nodejs/corepack README）。

## 設計思維

Corepack 近期歷史中影響最大的設計選擇，是反轉自動鎖定的預設行為。在 v0.32.x 之前，於沒有 `packageManager` 欄位的專案中執行任何套件管理器命令，Corepack 都會替你寫入該欄位。PR #709（2025 年 6 月）翻轉了預設值：「在專案中變更檔案會帶來負面影響，引發困惑（『為什麼這個檔案在變？』）、挫折感（『我每次跑命令都得 revert 檔案！』），有時甚至破壞流程（pristine 檢查）」（nodejs/corepack PR #709）。一篇獨立評論記錄了隨之而來的摩擦：有開發者發現 CLI 建議的升級指令並未同步更新 `packageManager` 欄位，導致同一則「有可用更新」的提示天天重複出現（Ero, 2024,〈The curious case of the packageManager field in package.json〉）。PR #709 所帶來的權衡很明確。自動寫入優化首次執行的便利性，代價是日常開發中突如其來的檔案變更。明確鎖定（目前的預設）優化可預測性，讓 `git status` 維持乾淨，代價則是新人入門時多一步 `corepack use pnpm@latest-10`。偏好舊行為的團隊可透過 `COREPACK_ENABLE_AUTO_PIN=1` 切回，該變數「指示 Corepack 在偵測到本地套件未列出 `packageManager` 欄位時更新該欄位」（nodejs/corepack README）。

第二項調校是是否提交完整性雜湊。鎖定 `pnpm@9.15.4` 不帶雜湊則信任 npm registry；鎖定 `pnpm@9.15.4+sha224.<hex>` 加上 tarball 層級的驗證，代價是團隊更新版本時必須同步更新雜湊。Yarn 與 Corepack 文件都建議生產用途的 repo 加上雜湊。

## 深入探討

有四項內部機制值得關注。

第一，**Node v25 的移除**。Node.js TSC 投票決定自 v25 起不再隨執行期出貨 Corepack；v22 API 文件說明遷移路徑：「自 Node.js v25 起 Corepack 不再隨之發行。目前依賴 Node.js 內建 `corepack` 執行檔的使用者可改用 userland 提供的 corepack 模組」（nodejs.org v22 corepack API 文件）。假設 `node` 安裝後 `$PATH` 上即有 `corepack` 的 CI 腳本，將在 Node 25 上失效；先安裝該 npm 套件即可。

第二，**Known Good Releases 的後備機制**。當專案沒有 `packageManager` 欄位時，Corepack 不會拒絕執行。它「預設使用一組 Known Good Releases」並「當 Corepack 在同一 major 線上下載新版本時，預設會自動更新該 Known Good Release」（nodejs/corepack README）。這讓未動過的腳本仍可運作，但代表未鎖定專案的全新 checkout 可能解析到與其他機器不同的 Yarn 或 pnpm minor 版本。鎖定該欄位即可使其具有確定性。

第三，**完整性驗證**。Corepack v0.27.0 加入了從 npm registry 下載時的簽章驗證（release notes：「verify integrity signature when downloading from npm registry (#432)」）。受規範環境中無法觸及公鑰端點的營運者，可透過 `COREPACK_INTEGRITY_KEYS=0` 停用該檢查。請注意這與 `packageManager` 欄位上的 `+sha224.<hex>` 完整性雜湊是分開的；前者驗證 tarball，後者驗證 npm 發布簽章。

第四，**npm CLI 並未實作 `packageManager`**。npm 文件僅將 `packageManager` 列為 `devEngines` 欄位的子鍵，所列支援鍵為「`cpu`、`os`、`libc`、`runtime` 與 `packageManager`」（npm CLI v10 package.json 文件）。`devEngines.packageManager` 屬於資訊性質，由 npm 在安裝期以警告或錯誤方式強制執行；它不會觸發管理器切換。頂層 `packageManager` 欄位源自 Corepack，並仍是跨管理器的通用機制，不過 pnpm 10+ 現在也會原生讀取該欄位（詳見下方「packageManager 欄位語意」一節）。

## packageManager 欄位語意

該欄位位於 `package.json` 頂層，遵循 `<name>@<semver>+sha224.<hex>` 格式。nodejs/corepack README 說明合約：「此處 `yarn` 是套件管理器名稱，指定為版本 `3.2.3`，並附上該版本的 SHA-224 雜湊以供驗證。`packageManager@x.y.z` 為必填。雜湊為選用，但作為安全做法強烈建議加上。」四項常令讀者意外的語意如下。

**自動鎖定自 Corepack v0.33.0 起預設關閉**（2025 年 6 月，PR #709）。較早的 Corepack 版本會在你首次執行管理器命令時替你寫入該欄位。預設值翻轉，是因為工作階段中途的檔案變更令使用者困惑，並破壞 pristine-checkout 的斷言。想要舊行為的團隊設定 `COREPACK_ENABLE_AUTO_PIN=1`，該變數「指示 Corepack 在偵測到本地套件未列出 `packageManager` 欄位時更新該欄位」（nodejs/corepack README）。否則請以 `corepack use <pkg>@<version>` 或手動方式撰寫該欄位。

**完整性雜湊使用 SHA-224，並非 SHA-256。** 這會抓到從 `npm view` 複製 SHA-256 hex 的讀者。格式固定為 `+sha224.<hex>`。驗證在下載時進行；雜湊不符會中止安裝。自 v0.27.0 起，Corepack 也會在欄位層級雜湊之上額外驗證 npm registry 完整性簽章；`COREPACK_INTEGRITY_KEYS=0` 停用 registry 簽章檢查，但不會停用 `+sha224` 欄位檢查。

**npm CLI 不尊重頂層 `packageManager` 欄位。** npm 文件僅將 `packageManager` 列為 `devEngines` 的子鍵，與 `cpu`、`os`、`libc`、`runtime` 並列（npm CLI v10 package.json 文件）。`devEngines.packageManager` 屬於 npm 端的強制機制，當執行中的管理器與其不符時可發出警告或錯誤，但它並非 Corepack 的輸入，也不會觸發 Corepack 切換二進位檔。同時想要兩種行為的 repo 為 Corepack 設定頂層欄位、為 npm 端檢查設定 `devEngines.packageManager`；兩者並無衝突，但屬於不同欄位。

**Corepack 並非唯一會讀取該欄位的工具。** 自 pnpm 10.0.0 起，`manage-package-manager-versions` 設定「預設為啟用。pnpm 現在預設會依據 `package.json` 中的 `packageManager` 欄位自行管理版本」（pnpm/pnpm v10.0.0 release notes）。鎖定為 `pnpm@9.15.4` 的專案會透過 pnpm 自身的更新機制自行安裝該精確版本，不需要 Corepack 介入即可讓鎖定生效；不過 Corepack 額外會驗證 `+sha224` tarball 雜湊，而這是 pnpm 自我更新機制所沒有要求的。Yarn 則走相反路線：`yarn set version` 會寫入頂層欄位，並預設交由 Corepack 處理，較舊的 `yarnPath` 機制則保留在 `.yarnrc.yml` 中，僅作為 Corepack 無法表示之版本的備援方案（yarnpkg.com/cli/set/version）。

## 延伸閱讀

- [FEE-804 套件管理：npm、pnpm 與 Yarn](/zh-tw/Developer Experience and Tooling/804) — Corepack 所鎖定的三種管理器之比較。
- [FEE-1613 mise：多語言執行期管理器](/zh-tw/Developer Experience and Tooling/1613) — mise 鎖定執行期（Node、Python、Ruby）；`packageManager` 鎖定管理器二進位檔。兩者可組合：mise 選 Node 22，Corepack 選 pnpm 9。
- [FEE-1616 Renovate：自動化相依更新](/zh-tw/Developer Experience and Tooling/1616) — Renovate 偵測 `packageManager` 欄位，並在產生鎖定檔更新前以 Corepack 安裝對應的 Yarn 或 pnpm。

## 參考資料

- nodejs/corepack maintainers, "Corepack README," GitHub (2025). https://github.com/nodejs/corepack
- nodejs/corepack maintainers, "Corepack Releases," GitHub (2025). https://github.com/nodejs/corepack/releases
- arcanis, "fix: do not auto-pin the `packageManager` field by default (PR #709)," GitHub (2025). https://github.com/nodejs/corepack/pull/709
- Node.js project, "Corepack — Node.js v22.x API," nodejs.org (2025). https://nodejs.org/docs/latest-v22.x/api/corepack.html
- pnpm project, "Installation," pnpm.io (2025). https://pnpm.io/installation
- pnpm project, "pnpm 10.0.0," GitHub Releases (2025). https://github.com/pnpm/pnpm/releases/tag/v10.0.0
- Yarn project, "Corepack," yarnpkg.com (2025). https://yarnpkg.com/corepack
- Yarn project, "yarn set version," yarnpkg.com (2025). https://yarnpkg.com/cli/set/version
- npm CLI project, "package.json — devEngines," docs.npmjs.com (2024). https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- Zsolt Ero, "The curious case of the packageManager field in package.json," Hyperknot Blog (2024). https://blog.hyperknot.com/p/corepacks-packagemanager-field
