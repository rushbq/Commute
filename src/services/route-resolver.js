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
