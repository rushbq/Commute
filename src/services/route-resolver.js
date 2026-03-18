/**
 * Route Resolver Service
 *
 * 負責路線查詢、最快路線比較、交通觀測視圖建構。
 * 純函式，不依賴任何 React API。
 */

import { APP_CONFIG } from "../lib/config";
import { buildRoutesRequest, normalizeRouteFromResponse } from "../lib/google-maps";

export async function loadRoutesConfig() {
  const response = await fetch(APP_CONFIG.routesUrl, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("無法讀取路線設定檔 public/data/routes.json。");
  }

  return response.json();
}

export async function requestRoute({ RouteClass, routeConfig, index }) {
  const request = buildRoutesRequest(routeConfig);
  const { routes } = await RouteClass.computeRoutes(request);

  if (!routes || !routes.length) {
    throw new Error(`${routeConfig.name} 路線查詢失敗：無結果`);
  }

  return normalizeRouteFromResponse(routeConfig, routes[0], index);
}

export function pickFastestRoute(routes) {
  return routes.reduce((fastest, current) => {
    if (!fastest) {
      return current;
    }

    return current.durationSeconds < fastest.durationSeconds ? current : fastest;
  }, null);
}

/**
 * 從模組建構交通觀測視圖。
 * zoom 取自每個觀測點自身的設定。
 */
export function buildTrafficViews(moduleItem) {
  return (moduleItem?.views || []).map((view, index) => ({
    id: `${moduleItem.id}-view-${index + 1}`,
    name: view.name || `觀測點 ${index + 1}`,
    label: view.label || `交通觀測 ${index + 1}`,
    accentColor: view.accentColor || (index === 0 ? "#336dff" : "#7c3aed"),
    center: view.center,
    zoom: view.zoom || 14
  }));
}

/**
 * 從模組建構交通觀測群組視圖。
 * 使用 viewGroups 結構，每個群組共用 zoom，包含 1~3 個子觀測點。
 * 每個群組包含 navigationUrl（依據群組內 isWaypoint 的觀測點建構）。
 */
export function buildTrafficViewGroups(moduleItem) {
  return (moduleItem?.viewGroups || []).map((group, groupIndex) => ({
    id: `${moduleItem.id}-group-${groupIndex}`,
    name: group.name || `群組 ${groupIndex + 1}`,
    zoom: group.zoom || 14,
    navigationUrl: buildNavigationUrl(moduleItem, group),
    views: (group.views || []).map((view, viewIndex) => ({
      id: `${moduleItem.id}-group-${groupIndex}-view-${viewIndex}`,
      name: view.name || `觀測點 ${viewIndex + 1}`,
      center: view.center,
      isWaypoint: view.isWaypoint === true
    }))
  }));
}

/**
 * 建構 Google Maps 導航 URL。
 * 使用模組的起點/終點，加上群組內標記為途經點的觀測點座標。
 *
 * @param {object} moduleItem - 模組資料（含 origin、destination）
 * @param {object} [viewGroup] - 觀測群組（含 views，用於取得途經點）
 * @returns {string | null} 導航 URL 或 null（無起點/終點時）
 */
export function buildNavigationUrl(moduleItem, viewGroup) {
  if (!moduleItem?.origin?.trim() || !moduleItem?.destination?.trim()) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    origin: moduleItem.origin.trim(),
    destination: moduleItem.destination.trim(),
    travelmode: "driving",
    dir_action: "navigate"
  });

  // 從群組的觀測點中取得標記為途經點的座標
  const waypointCoords = (viewGroup?.views || [])
    .filter((v) => v.isWaypoint && Number.isFinite(Number(v.center?.lat)) && Number.isFinite(Number(v.center?.lng)))
    .map((v) => `${v.center.lat},${v.center.lng}`);

  if (waypointCoords.length > 0) {
    params.set("waypoints", waypointCoords.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function computeRouteComparison(routeResults) {
  const recommendedRoute =
    routeResults.find((route) => route.isRecommended) || routeResults[0] || null;
  const slowerRoute =
    routeResults.find((route) => route.id !== recommendedRoute?.id) || null;
  const comparisonDeltaMinutes =
    recommendedRoute && slowerRoute
      ? Math.max(0, Math.round((slowerRoute.durationSeconds - recommendedRoute.durationSeconds) / 60))
      : 0;

  return { recommendedRoute, slowerRoute, comparisonDeltaMinutes };
}
