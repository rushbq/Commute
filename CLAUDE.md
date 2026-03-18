# Commute Checker — AI 技術規範文件

> 本文件是給所有 AI 助手遵循的技術規範。修改程式碼前請先閱讀本文件，並嚴格遵守以下規則。

## 專案概覽

通勤路況小工具（Commute Checker）是一個 React 19 PWA，用於：
- 透過 Google Maps 交通圖層觀測交流道路況（交通觀測模式）
- 支援模組化設定（多組觀測點，依排程自動切換）
- 排程系統：白天 / 夜覽時段自動顯示對應模組

> **路線比較功能**已從 UI 移除，但 Routes API 相關程式碼保留在 services 與 lib 層，供未來擴充使用。

語言：繁體中文（zh-TW），手機優先設計。

## 常用指令

```bash
npm run dev      # 開發伺服器 (127.0.0.1:5173)
npm run build    # 建置到 dist/
npm run preview  # 預覽建置結果 (127.0.0.1:4173)
npm run deploy   # 部署到 GitHub Pages (gh-pages branch)
```

## 技術棧 — 不可變更

| 項目 | 技術 | 備註 |
|------|------|------|
| 前端框架 | React 19 | 不使用 TypeScript |
| 建置工具 | Vite 7 | |
| CSS 框架 | Tailwind CSS 3 | `darkMode: "class"` |
| UI 元件 | shadcn/ui 風格（CVA + Radix Slot） | 位於 `src/components/ui/` |
| 地圖 | `@googlemaps/js-api-loader` | |
| 路線查詢 | `Route.computeRoutes()`（Routes JS API） | **禁止**使用已棄用的 DirectionsService |
| 地圖標記 | `AdvancedMarkerElement` + `PinElement` | 需要 Map ID |
| 設定儲存 | localStorage（adapter 抽象層） | |
| 路由 | Hash-based（`#/`、`#/settings`） | |
| 圖示 | `lucide-react` | |

## 架構與 SOLID 原則

本專案遵循 SOLID 設計原則，分為四層：

### 1. Services 層（純函式，無副作用）

```
src/services/
├── settings-normalizer.js   # 設定正規化、合併、深複製、排程解析
├── route-resolver.js        # 路線查詢、最快路線比較、交通觀測建構
└── settings-validator.js    # 設定驗證、預設值工廠、色碼保護、模組調色盤
```

**規則：**
- Services 是純函式，**禁止**依賴 React API 或瀏覽器 API（除了 `fetch`）
- 所有商業邏輯都放在 services 層
- 新增功能模式時，在此層擴充邏輯

### 2. Hooks 層（狀態管理，職責分離）

```
src/hooks/
├── use-settings-manager.js  # 設定載入/儲存、模組選取、排程解析
├── use-route-fetcher.js     # 路線查詢、API 冷卻、結果管理
├── use-commute-checker.js   # 組合層：協調上方兩個 hook
└── use-theme.js             # 主題 context provider
```

**規則：**
- `use-commute-checker.js` 是組合 hook，**禁止**在此加入商業邏輯
- 每個 hook 只負責一個職責（Single Responsibility）
- 新增獨立功能（如通知、定位）應建立新的 hook，再由 `use-commute-checker.js` 組合

### 3. Components 層（UI 呈現）

```
src/components/
├── app-header.jsx           # 頁首（標題、更新按鈕、設定按鈕）
├── module-switcher.jsx      # 模組切換（上班路況 / 下班路況等）
├── view-group-card.jsx      # 觀測群組地圖卡（首頁使用）
├── traffic-view-card.jsx    # 交通觀測地圖卡（保留，目前未使用）
├── settings-page.jsx        # 設定頁（主題切換、模組管理）
├── module-editor.jsx        # 模組編輯器（含排程設定）
├── view-group-editor.jsx    # 觀測群組編輯器（群組名、縮放、子觀測點）
├── sub-view-editor.jsx      # 子觀測點編輯器（名稱、座標、途經點）
├── coordinate-input.jsx     # 座標輸入元件（支援 Google Maps 連結解析）
├── traffic-view-editor.jsx  # 觀測點編輯器（保留，目前未使用）
├── feature-mode-switcher.jsx # 功能模式切換（保留，目前未使用）
├── route-card.jsx           # 路線資訊卡（保留，目前未使用）
├── route-map-card.jsx       # 路線地圖卡（保留，目前未使用）
├── route-editor.jsx         # 路線編輯器（保留，目前未使用）
└── ui/                      # 基礎 UI 元件
    ├── badge.jsx
    ├── button.jsx
    ├── card.jsx
    ├── input.jsx            # Input（支援 type/min/max/step）、ColorInput
    └── separator.jsx
```

**規則：**
- 元件只負責 UI 呈現，**禁止**在元件中寫商業邏輯
- 共用表單控制項放在 `ui/` 目錄
- 設定頁相關的子元件（editor 系列）放在 `components/` 根目錄
- 標記「保留，目前未使用」的元件是為了未來路線比較功能重新上線，**禁止**刪除

### 4. Lib 層（基礎設施）

```
src/lib/
├── config.js                # 應用程式設定（環境變數整合）
├── formatters.js            # 時間/距離格式化
├── google-maps.js           # Google Maps API 封裝（載入、請求建構、回應正規化）
├── utils.js                 # 通用工具（cn）
└── settings-storage/        # 設定儲存 adapter
    ├── index.js             # Adapter 工廠
    └── local-storage-adapter.js  # localStorage 實作
```

**規則：**
- `google-maps.js` 封裝所有 Google Maps API 互動，其他地方**禁止**直接呼叫 `google.maps.*`
- 設定儲存使用 adapter pattern，未來切換後端只需新增 adapter

## 排程系統

每個模組都有 `schedule` 欄位，決定何時做為首頁預設：

| 值 | 說明 | 時段 |
|-----|------|------|
| `"light"` | 白天預設 | 05:00 ~ 18:00 |
| `"dark"` | 夜覽預設 | 18:00 ~ 05:00 |
| `"always"` | 全時段 | 任何時段皆可做為預設 |

**解析優先順序：**
1. 精確匹配當前時段的模組（light / dark）
2. 設為 `always` 的模組
3. 第一個模組（fallback）

排程邏輯位於 `src/services/settings-normalizer.js` 的 `resolveScheduledModuleId()`。
時段判斷與主題系統共用相同邏輯（`isNightHours()`）。

## 擴充指南

### 重新啟用路線比較模式

保留的元件與 API 程式碼：
- `src/components/route-card.jsx`、`route-map-card.jsx`、`route-editor.jsx`
- `src/components/feature-mode-switcher.jsx`
- `src/services/route-resolver.js`（requestRoute、pickFastestRoute）
- `src/lib/google-maps.js`（buildRoutesRequest、normalizeRouteFromResponse）

步驟：
1. 在 `App.jsx` 重新引入 `FeatureModeSwitcher` 與路線相關元件
2. 在 `use-commute-checker.js` 重新暴露 routeResults 相關狀態
3. 在設定頁加回路線模組的編輯 UI

### 新增儲存後端（如 Firebase）

1. 在 `src/lib/settings-storage/` 建立新的 adapter 檔案
2. 實作與 `local-storage-adapter.js` 相同的介面
3. 在 `src/lib/settings-storage/index.js` 切換工廠回傳

### Storage Adapter 介面

```javascript
{
  provider: string,
  loadSettings(): Promise<object | null>,
  saveSettings(value: object): Promise<void>,
  clearSettings(): Promise<void>,
  loadActiveModuleId(): Promise<string | null>,
  saveActiveModuleId(moduleId: string): Promise<void>,
  clearActiveModuleId(): Promise<void>
}
```

## 設定資料結構

### routes.json（`public/data/routes.json`）

```javascript
{
  defaultModuleId: string,          // 向下相容用，排程系統優先
  modules: [
    {
      id: string,                   // 唯一識別碼
      mode: "traffic",              // 目前僅支援 traffic
      name: string,                 // 顯示名稱
      schedule: "light" | "dark" | "always",  // 排程時段
      origin: string,              // 導航起點（地址或座標）
      destination: string,         // 導航終點（地址或座標）
      viewGroups: [                // 觀測群組
        {
          name: string,            // 群組名稱
          zoom: number,            // 共用地圖縮放等級
          views: [                 // 子觀測點（上限 3 個）
            {
              name: string,
              center: { lat: number, lng: number },
              isWaypoint: boolean  // 是否為導航途經點
            }
          ]
        }
      ]
    }
  ]
}
```

## 嚴格禁止事項

1. **禁止**引入 TypeScript — 本專案使用純 JavaScript
2. **禁止**使用 `google.maps.DirectionsService` — 已全面遷移至 Routes API
3. **禁止**在元件中直接呼叫 `google.maps.*` — 必須透過 `src/lib/google-maps.js`
4. **禁止**在 services 層引入 React 相關模組
5. **禁止**在 `use-commute-checker.js` 加入商業邏輯 — 它只負責組合
6. **禁止**移除 API 60 秒冷卻保護機制
7. **禁止**修改 `public/data/routes.json` 的資料結構（可新增欄位，不可移除或改名）
8. **禁止**使用 CSS-in-JS 或 styled-components — 一律使用 Tailwind CSS
9. **禁止**引入狀態管理套件（Redux、Zustand 等）— 使用 React hooks
10. **禁止**修改 hash-based 路由機制，除非要全面改用 React Router
11. **禁止**刪除標記為「保留」的路線比較相關元件與 API 程式碼
12. **禁止**將排程解析邏輯放到元件層 — 必須在 services 層

## 主題系統

- 三種模式：`light`、`dark`、`auto`
- Auto 模式：PM 6:00 ~ AM 5:00 為 dark
- 透過 `<html>` 元素的 `dark` class 切換
- localStorage key: `commute-checker-theme`
- 地圖底圖由 Google Cloud Console Map ID 管理
- 地圖色彩模式透過 `colorScheme: "DARK" | "LIGHT"` 與主題同步，切換時以 `map.setOptions()` 即時更新

## 環境變數

| 變數 | 用途 | 預設值 |
|------|------|--------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API Key | （必填） |
| `VITE_GOOGLE_MAPS_MAP_ID` | Cloud Console Map ID | `DEMO_MAP_ID` |
| `VITE_APP_TITLE` | 應用程式標題 | `通勤小工具` |
| `VITE_APP_SUBTITLE` | 副標題 | `Commute Tool` |

## 手機優先設計原則

本專案以手機為主要使用情境（375px），設定頁包含多層巢狀容器，設計 UI 時必須注意以下原則。

### 巢狀容器 padding 累積問題

設定頁結構為：App 容器 → 模組編輯器 → 觀測群組編輯器 → 子觀測點編輯器。
每層都有 `border` + `padding`，累積後會大幅壓縮實際內容可用寬度。

**375px 手機的寬度預算（單側）：**

| 層級 | padding | border | 小計 |
|------|---------|--------|------|
| App 容器 (`px-4`) | 16px | — | 16px |
| 模組編輯器 (`p-3`) | 12px | 2px | 14px |
| 群組編輯器 (`p-2.5`) | 10px | 2px | 12px |
| 子觀測點 (`p-2`) | 8px | 1px | 9px |
| **合計（單側）** | | | **51px** |
| **雙側合計** | | | **102px** |

實際內容可用寬度 ≈ 375 − 102 = **273px**。

**設計規則：**

1. **巢狀容器使用響應式 padding**：內層容器在手機上使用較小的 padding（如 `p-2 sm:p-3`），桌面版才放大
2. **所有巢狀容器必須加上 `min-w-0`**：防止 grid/flex 子元素因內容撐開而溢出
3. **深層容器加上 `overflow-hidden`**：作為最後防線，避免內容超出邊界
4. **按鈕群組使用 `flex-wrap`**：多個並排按鈕（如排程選擇、主題切換）在窄螢幕時自動換行，**禁止**使用 `shrink-0`
5. **新增巢狀層級前先計算寬度預算**：確保最內層仍有足夠的內容空間（建議 ≥ 250px）

## 品牌色彩

- 主色：`#336dff`（brand-500）
- 路線 A 預設色：`#336dff`
- 路線 B 預設色：`#7c3aed`
- 圓角風格：`rounded-[24px]`（卡片）、`rounded-full`（按鈕、badge）
- 字型：Noto Sans TC（內文）、Space Grotesk（display）

### 模組調色盤（設定頁視覺區分）

設定頁使用 `MODULE_PALETTE` 為每個模組指定不同色系邊框與背景，
避免多個模組外觀相同而看錯。調色盤位於 `src/services/settings-validator.js`。

| 順序 | 色碼 |
|------|------|
| 1 | `#336dff`（藍） |
| 2 | `#7c3aed`（紫） |
| 3 | `#d97706`（橘） |
| 4 | `#059669`（綠） |
| 5 | `#dc2626`（紅） |
| 6 | `#0891b2`（青） |

## Google Maps API 注意事項

- 使用 `Route.computeRoutes()` 查詢路線（Routes JS API）— 目前僅保留程式碼，UI 未使用
- 必須使用 `AdvancedMarkerElement`（需 Map ID）
- TrafficLayer 在所有地圖上預設啟用
- 路線模式下 60 秒 API 冷卻保護（程式碼保留）
- 交通觀測模式不觸發 API 計費

## 檔案命名慣例

- 元件：`kebab-case.jsx`（如 `traffic-view-card.jsx`）
- Hooks：`use-kebab-case.js`（如 `use-theme.js`）
- Services：`kebab-case.js`（如 `settings-normalizer.js`）
- UI 基礎元件：`src/components/ui/kebab-case.jsx`
