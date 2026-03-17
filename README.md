# Commute Traffic Checker

`Commute Traffic Checker` 是一個可直接部署到 GitHub Pages 的純靜態網站，使用 Google Maps JavaScript API 顯示即時路況，並比較兩條固定通勤路線的距離與預估行車時間。

## 功能

- 固定座標置中的 Google 地圖
- Live Traffic Layer
- 兩條預先定義路線比較
- 每 60 秒自動刷新路況與通勤時間
- Mobile-first 響應式版面
- Dark mode
- PWA / 可安裝 web app
- Service Worker 快取 app shell 與常用地圖相關靜態資源

## 專案結構

```text
/project-root
  index.html
  manifest.webmanifest
  service-worker.js
  /assets
    icon-192.png
    icon-512.png
    icon.svg
    maskable-icon.svg
  /src
    app.js
    config.js
    map.js
    routeService.js
    ui.js
  /style
    main.css
  /data
    routes.json
  README.md
```

## 1. 申請 Google Maps API Key

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 建立或選擇專案。
2. 啟用 Billing。
3. 啟用下列 API:
   - Maps JavaScript API
   - Directions API
4. 建立 API key。

## 2. 設定 API Key

打開 [`./src/config.js`](./src/config.js)，把 `YOUR_KEY` 換成你的 API key:

```js
GOOGLE_MAPS_API_KEY: "YOUR_KEY"
```

## 3. 建議的 API Key 限制

建議在 Google Cloud Console 為 API key 設定 `HTTP referrer restrictions`，例如：

- `https://<your-github-username>.github.io/*`
- `https://<your-custom-domain>/*`

注意：

- 如果你把 key 限制成只允許 GitHub Pages 網域，直接用 `file://` 開啟 `index.html` 時，Google Maps 可能因 referrer 不符而拒絕載入。
- 這是 Google Maps key 安全限制本身的 trade-off，不是此專案邏輯問題。
- 若要直接雙擊 `index.html` 測試地圖，可使用未加 referrer restriction 的測試 key，或先在本機用簡單 static server 測試。

## 4. 自訂路線

編輯 [`./data/routes.json`](./data/routes.json)：

```json
{
  "center": {
    "lat": 25.0478,
    "lng": 121.5319
  },
  "routes": [
    {
      "name": "Route A",
      "origin": "Taipei Main Station, Taipei",
      "destination": "National Taiwan University Hospital, Taipei",
      "waypoints": []
    }
  ]
}
```

說明：

- `center`: 地圖中心點
- `mapZoom`: 可選，預設為 `14`
- `origin` / `destination`: 可用地址字串或座標
- `waypoints`: 可用來強制路線經過特定道路
- `strokeColor`: 可選，自訂地圖 polyline 顏色

## 5. 直接開啟 index.html

此專案沒有 build step，也不需要 backend。

- GitHub Pages / 一般靜態主機：會讀取 `/data/routes.json`
- 直接雙擊開啟 `index.html`：瀏覽器通常會阻擋本機 `fetch()` 讀取 JSON，因此專案內建了同內容的 inline fallback，讓 UI 仍可運作

如果你有修改 `routes.json`，而且又想用 `file://` 方式直接預覽，請同步更新 [`./index.html`](./index.html) 內的 `#routes-data` JSON 區塊，或改用任何簡單 static server。

## 6. 部署到 GitHub Pages

1. Push 專案到 GitHub repository。
2. 到 GitHub repository 的 `Settings > Pages`。
3. `Source` 選 `Deploy from a branch`。
4. Branch 選 `main` 或你使用的 branch，資料夾選 `/ (root)`。
5. 儲存後等待 GitHub Pages 發佈完成。
6. 確認 Google Maps API key 的 referrer 限制包含你的 GitHub Pages 網址。

## 7. PWA / 安裝式 App

此專案已包含：

- `manifest.webmanifest`
- `service-worker.js`
- 安裝按鈕，瀏覽器支援且符合條件時才顯示
- app shell 快取
- Google Maps 相關靜態資源的 runtime caching

注意：

- Service Worker 只能在 `https://` 或 `localhost` 生效，不能在 `file://` 生效。
- Google Maps 的動態資料、即時路況與 Directions 回應仍以 Google 線上服務為主，離線時不保證可正常查詢最新路況。

## 8. 本機檢查

你可以直接打開 `index.html`，或用任何簡單靜態伺服器：

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

## 9. 風險與限制

- 每 60 秒呼叫一次 Directions，會消耗 Google Maps quota。
- `duration_in_traffic` 只在 `DRIVING` 模式、且 Google 有提供即時交通估算時才有值。
- Service Worker 對第三方地圖資產的快取效果，仍會受瀏覽器與 Google 回應標頭影響。
- `config.js` 內放 API key 只適合純前端靜態站做法，必須搭配 key restriction 降低外洩風險。
