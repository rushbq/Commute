# 通勤路況檢查器

這個專案已重構為 `React + Vite + Tailwind CSS + shadcn/ui 風格元件` 的純前端靜態網站，適合部署到 GitHub Pages。  
功能核心仍是：

- 顯示 Google Maps 即時交通圖層
- 比較兩條固定通勤路線
- 手動刷新通勤時間
- PWA / 可安裝 web app
- 手機優先的繁體中文 SaaS 介面
- 路線設定頁與常用通勤模組切換

## 技術重點

- `React`：元件化 UI、狀態管理、可維護性提升
- `Vite`：靜態建置，適合 GitHub Pages
- `Tailwind CSS`：快速建立 Stripe 風格版面
- `shadcn/ui 風格元件`：卡片、按鈕、徽章等基礎設計系統
- `@googlemaps/js-api-loader`：動態載入 Google Maps JavaScript API

## 重要限制

你提到希望「使用 React 增加安全性，避免 API key 被看見」，這裡要明確說明：

- `React 無法隱藏純前端網站的 Google Maps API key`
- 只要 API 呼叫在瀏覽器端發生，使用者就一定看得到 key 或相關請求
- 這個版本已改成透過 `.env` 注入 `VITE_GOOGLE_MAPS_API_KEY`，避免把 key 寫死在 repo
- 真正要隱藏 key，必須改成後端代理、serverless function，或放棄 GitHub Pages 純靜態部署

因此，對目前這種 GitHub Pages 靜態站，建議做法是：

1. 使用獨立的前端用 Google Maps key
2. 在 Google Cloud Console 啟用 `HTTP referrer restrictions`
3. 僅允許你的 GitHub Pages 網址與測試網域

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
      routes.json
    /icons
      icon.svg
      icon-192.png
      icon-512.png
  /src
    App.jsx
    main.jsx
    index.css
    /components
    /hooks
    /lib
```

## 安裝與執行

```bash
npm install
npm run dev
```

## 設定 Google Maps API key

1. 到 Google Cloud Console 建立專案
2. 啟用 Billing
3. 啟用：
   - `Maps JavaScript API`
   - `Directions API`
4. 建立 API key
5. 複製 `.env.example` 為 `.env`
6. 設定：

```bash
VITE_GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_Key
```

## `.env.example`

專案已附上 `.env.example`，內容如下：

```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

## 路線設定

請編輯 [`public/data/routes.json`](./public/data/routes.json)：

```json
{
  "center": {
    "lat": 25.0478,
    "lng": 121.5319
  },
  "mapZoom": 14,
  "routes": [
    {
      "name": "路線 A",
      "label": "中山南路線",
      "origin": "台北車站",
      "destination": "國立臺灣大學醫學院附設醫院",
      "waypoints": [
        {
          "location": "中山南路, 台北市",
          "stopover": false
        }
      ]
    }
  ]
}
```

## 建置

```bash
npm run build
```

建置完成後，輸出在 `dist/`，可以直接部署到 GitHub Pages 或其他靜態主機。

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
- 地圖資料與 Directions 仍依賴 Google 線上服務，離線時不保證可用

## 版面設計方向

這次介面是：

- 繁體中文
- 單一亮色主題
- Stripe 式 SaaS 卡片與漸層
- 手機優先
- 首屏先看到「建議走哪條路」
- 首頁可快速切換 `上班 / 下班`
- 設定頁可管理常用模組與每個模組的兩條路線

## 驗證建議

完成 `.env` 後，至少檢查：

1. 首頁 Hero 是否為繁體中文
2. 推薦卡是否能正確顯示建議路線
3. 路線 A / B 是否顯示距離與時間
4. Google Maps 是否顯示 Traffic Layer
5. 首頁切換 `上班 / 下班` 是否會更新結果
6. 設定頁儲存後是否回到首頁並套用新設定
