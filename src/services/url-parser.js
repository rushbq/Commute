/**
 * URL Parser Service
 *
 * 解析 Google Maps 連結，擷取經緯度座標。
 * 純函式，不依賴任何 React API 或瀏覽器 API。
 */

/**
 * 從 Google Maps URL 解析出經緯度座標。
 *
 * 支援格式：
 *   - https://www.google.com/maps/@24.95,121.39,15z
 *   - https://www.google.com/maps/place/.../@24.95,121.39,15z/...
 *   - https://www.google.com/maps?q=24.95,121.39
 *   - https://www.google.com/maps/search/24.95,121.39
 *   - https://www.google.com/maps/dir/.../@24.95,121.39,15z/...
 *
 * 不支援短網址（maps.app.goo.gl），需使用者展開後再貼上。
 *
 * @param {string} url - Google Maps 連結
 * @returns {{ lat: number, lng: number } | null} 座標或 null
 */
export function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  // 嘗試各種解析策略，依優先順序
  return (
    parseAtCoordinates(trimmed) ||
    parseQueryParam(trimmed) ||
    parseSearchPath(trimmed) ||
    parseRawCoordinates(trimmed)
  );
}

/**
 * 判斷是否為無法解析的短網址。
 * @param {string} url
 * @returns {boolean}
 */
export function isShortUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(url.trim());
}

// --- 內部解析策略 ---

/**
 * 解析 /@lat,lng 格式（最常見）
 * 例：/maps/@24.9518,121.3944,15z
 * 例：/maps/place/地名/@24.9518,121.3944,15z/data=...
 */
function parseAtCoordinates(url) {
  const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);

  if (!match) {
    return null;
  }

  return validateAndReturn(match[1], match[2]);
}

/**
 * 解析 ?q=lat,lng 或 &q=lat,lng 格式
 * 例：/maps?q=24.9518,121.3944
 */
function parseQueryParam(url) {
  const match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);

  if (!match) {
    return null;
  }

  return validateAndReturn(match[1], match[2]);
}

/**
 * 解析 /search/lat,lng 格式
 * 例：/maps/search/24.9518,121.3944
 */
function parseSearchPath(url) {
  const match = url.match(/\/search\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);

  if (!match) {
    return null;
  }

  return validateAndReturn(match[1], match[2]);
}

/**
 * 最後手段：嘗試直接解析 "lat,lng" 純文字
 * 例：24.9518,121.3944
 * 例：24.9518, 121.3944
 */
function parseRawCoordinates(text) {
  const match = text.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);

  if (!match) {
    return null;
  }

  return validateAndReturn(match[1], match[2]);
}

/**
 * 驗證並回傳座標物件。
 * 緯度範圍 -90~90，經度範圍 -180~180。
 */
function validateAndReturn(latStr, lngStr) {
  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}
