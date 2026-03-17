# 通勤路況小工具

這個專案已重構為 `React 19 + Vite 7 + Tailwind CSS 3 + shadcn/ui 風格元件` 的純前端靜態網站，適合部署到 GitHub Pages。
功能核心：

- 顯示 Google Maps 即時交通圖層
- 比較兩條固定通勤路線（含即時路況時間）
- 交通觀測模式：快速查看交流道路況地圖
- 手動刷新通勤時間（含 60 秒 API 冷卻保護）
- 夜覽 / 白天主題切換（手動或自動判斷）
- PWA / 可安裝 web app
- 手機優先的繁體中文 SaaS 介面
- 路線設定頁與常用通勤模組切換

## 技術規格

| 項目 | 技術 |
|------|------|
| 前端框架 | React 19 |
| 建置工具 | Vite 7 |
| CSS 框架 | Tailwind CSS 3（`darkMode: "class"`） |
| UI 元件 | shadcn/ui 風格（CVA + Radix Slot） |
| 地圖載入 | `@googlemaps/js-api-loader` |
| 路線查詢 | `google.maps.routes.Route.computeRoutes()`（Routes JS API） |
| 地圖標記 | `google.maps.marker.AdvancedMarkerElement` + `PinElement` |
| 地圖樣式 | 透過 Google Cloud Console Map ID 控制（支援 Cloud-based map styling） |
| 設定儲存 | `localStorage`（storage adapter 抽象層） |
| 路由 | Hash-based（`#/settings`） |
| PWA | Service Worker + manifest.webmanifest |

### Google Maps API 使用

本專案使用以下 Google Maps Platform API：

- **Maps JavaScript API** — 地圖顯示、交通圖層
- **Routes API**（`Route.computeRoutes`）— 路線查詢，取代已棄用的 `DirectionsService`
- **Map ID** — 必須在 Google Cloud Console 建立，用於啟用 `AdvancedMarkerElement`

> **注意**：不再使用 `Directions API (Legacy)`，已全面遷移至 Routes API。

### 主題系統

- 三種模式：白天（`light`）、夜覽（`dark`）、自動（`auto`）
- 自動模式根據當前時間判斷：PM 6:00 ~ AM 5:00 為夜覽模式
- 透過 Tailwind `dark:` variant 實作，`<html>` 加上 `dark` class
- 主題偏好存於 `localStorage`（key: `commute-checker-theme`）
- 地圖樣式由 Cloud Console Map ID 管理

### API 保護機制

- 路線模式下 60 秒內不重複呼叫 Google Routes API
- 交通觀測模式不受此限制（僅使用本地地圖圖層，不產生 API 計費）

## 環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API Key | （必填） |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Cloud Console Map ID | `DEMO_MAP_ID` |
| `VITE_APP_TITLE` | 應用程式標題 | `通勤小工具` |
| `VITE_APP_SUBTITLE` | 應用程式副標題 | `Commute Checker` |

## 專案結構

```text
/project-root
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  .env.example
  /public
    manifest.webmanifest
    service-worker.js
    /data
      routes.json          # 路線與觀測點設定
    /icons
      icon.svg
      icon-192.png
      icon-512.png
  /src
    App.jsx                # 主頁面，hash 路由
    main.jsx               # 進入點
    index.css              # Tailwind 基礎樣式 + 深色背景
    /components
      app-header.jsx       # 標題列（含更新時間、設定 / 更新按鈕）
      feature-mode-switcher.jsx  # 功能模式切換（交通觀測 / 路線比較）
      module-switcher.jsx  # 模組切換（上班 / 下班等）
      route-card.jsx       # 路線資訊卡（時間、距離）
      route-map-card.jsx   # 路線地圖卡（AdvancedMarkerElement）
      settings-page.jsx    # 設定頁（含主題切換）
      traffic-view-card.jsx # 交通觀測地圖卡
      /ui                  # 基礎 UI 元件（Button, Card, Badge）
    /hooks
      use-commute-checker.js  # 核心狀態管理 hook
      use-theme.js            # 主題 context provider
    /lib
      config.js            # 應用程式設定（env 變數整合）
      formatters.js        # 時間 / 距離格式化
      google-maps.js       # Google Maps API 封裝（Routes API + Marker）
      settings-storage/    # 設定儲存 adapter
```

## 安裝與執行

```bash
npm install
npm run dev
```

## 設定 Google Maps API

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 建立專案
2. 啟用 Billing
3. 啟用以下 API：
   - `Maps JavaScript API`
   - `Routes API`
4. 建立 API key 並設定限制
5. 建立 Map ID（地圖管理 > 建立地圖 ID），用於啟用 AdvancedMarkerElement
6. 複製 `.env.example` 為 `.env`
7. 設定：

```bash
VITE_GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_Key
VITE_GOOGLE_MAPS_MAP_ID=你的_Map_ID
```

## `.env.example`

專案已附上 `.env.example`，內容如下：

```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
VITE_GOOGLE_MAPS_MAP_ID=YOUR_GOOGLE_MAPS_MAP_ID
VITE_APP_TITLE=通勤小工具
VITE_APP_SUBTITLE=Commute Checker
```

## 設定資料儲存

目前使用 `localStorage`，但讀寫已抽成 adapter：

- [src/lib/settings-storage/index.js](./src/lib/settings-storage/index.js)
- [src/lib/settings-storage/local-storage-adapter.js](./src/lib/settings-storage/local-storage-adapter.js)

目前行為：

- 設定資料存在瀏覽器本機

未來若改 Firebase：

- 只需要在 `src/lib/settings-storage/` 新增新的 adapter
- `useCommuteChecker` 與 UI 不需要重寫
- 建議把資料存成 `users/{uid}/commute-checker/settings`

## 路線設定

請編輯 [`public/data/routes.json`](./public/data/routes.json)。支援兩種模組模式：

### 路線比較模式（`mode: "route"`）

```json
{
  "id": "commute-work",
  "mode": "route",
  "name": "上班",
  "origin": "台北車站",
  "destination": "國立臺灣大學醫學院附設醫院",
  "mapZoom": 14,
  "routes": [
    {
      "name": "路線 A",
      "label": "中山南路線",
      "waypoints": [
        { "location": "中山南路, 台北市", "stopover": false }
      ],
      "strokeColor": "#336dff"
    }
  ]
}
```

### 交通觀測模式（`mode: "traffic"`）

```json
{
  "id": "traffic-northbound",
  "mode": "traffic",
  "name": "下班路況",
  "mapZoom": 14,
  "views": [
    {
      "name": "樹林交流道",
      "label": "下樹林",
      "accentColor": "#7c3aed",
      "center": { "lat": 24.9518, "lng": 121.3944 }
    }
  ]
}
```

## 建置

```bash
npm run build
```

建置完成後，輸出在 `dist/`，可以直接部署到 GitHub Pages 或其他靜態主機。

## 直接部署到 GitHub Pages

若 repo 已設定 Pages source 指向 `gh-pages` branch，可直接執行：

```bash
npm run deploy
```

這會自動：

1. 執行 `npm run build`
2. 把 `dist/` 發佈到 `gh-pages` branch

## 部署到 GitHub Pages

### 做法一：手動部署 `dist/`

1. `npm run build`
2. 把 `dist/` 內容部署到 GitHub Pages 對應 branch

### 做法二：GitHub Actions

可使用標準 Vite / Pages workflow，把 `dist/` 發佈到 Pages。

## PWA 說明

專案保留：

- `manifest.webmanifest`
- `service-worker.js`
- app shell caching
- Google Maps 靜態資產 runtime caching

注意：

- PWA 與 Service Worker 僅在 `https://` 或 `localhost` 生效
- 地圖資料與路線查詢仍依賴 Google 線上服務，離線時不保證可用
- 開發模式下會自動解除舊的 service worker 並清掉 cache，避免 CSS / JS 看到舊版本

## 版面設計方向

- 繁體中文
- 白天 / 夜覽雙主題（自動或手動切換）
- Stripe 式 SaaS 卡片與漸層
- 手機優先（icon-only 按鈕、響應式格線）
- 首屏先看到「建議走哪條路」
- 首頁可快速切換功能模式與通勤模組
- 設定頁可管理常用模組、路線、觀測點與主題

## 驗證建議

完成 `.env` 後，至少檢查：

1. 首頁標題是否為繁體中文，副標題與更新時間正確顯示
2. 路線比較模式：推薦卡是否正確顯示建議路線（最快標記）
3. 路線 A / B 是否顯示距離與時間
4. Google Maps 是否顯示 Traffic Layer
5. 首頁切換功能模式（交通觀測 / 路線比較）是否正確
6. 首頁切換模組（上班 / 下班）是否會更新結果
7. 每條路線是否都有自己的獨立地圖與 AdvancedMarker 標記
8. 設定頁儲存後是否回到首頁並套用新設定
9. 主題切換（白天 / 夜覽 / 自動）是否正常
10. 60 秒內重複按更新是否顯示冷卻提示
