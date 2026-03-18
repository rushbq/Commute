/**
 * Route Fetcher Hook
 *
 * 負責路線查詢、API 冷卻保護、結果管理。
 * 符合單一職責原則：僅管理路線查詢與結果狀態。
 */

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { APP_CONFIG } from "../lib/config";
import { buildTrafficViews, buildTrafficViewGroups, pickFastestRoute, requestRoute, computeRouteComparison } from "../services/route-resolver";

export function useRouteFetcher({ activeModule, googleMaps, routeClassRef }) {
  const [routeResults, setRouteResults] = useState([]);
  const [trafficViewResults, setTrafficViewResults] = useState([]);
  const [trafficViewGroupResults, setTrafficViewGroupResults] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const refreshInFlightRef = useRef(false);
  const lastApiFetchTimeRef = useRef(0);

  const refreshRoutesEvent = useEffectEvent(async () => {
    if (!activeModule || !googleMaps || refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsRefreshing(true);
    setFetchError("");

    if (activeModule.mode === "traffic") {
      try {
        setTrafficViewResults(buildTrafficViews(activeModule));
        setTrafficViewGroupResults(buildTrafficViewGroups(activeModule));
        setLastUpdated(new Date());
      } catch (trafficError) {
        setFetchError(trafficError.message);
      } finally {
        refreshInFlightRef.current = false;
        setIsRefreshing(false);
      }

      return;
    }

    if (!routeClassRef.current) {
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastApiFetchTimeRef.current;
    const cooldownMs = APP_CONFIG.refreshIntervalMs || 60_000;

    if (elapsed < cooldownMs && lastApiFetchTimeRef.current > 0) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
      setFetchError(`API 冷卻中，${remaining} 秒後可再更新`);
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
      return;
    }

    try {
      const RouteClass = routeClassRef.current;
      const results = await Promise.all(
        activeModule.routes.map((routeConfig, index) =>
          requestRoute({
            RouteClass,
            routeConfig: {
              ...routeConfig,
              origin: activeModule.origin,
              destination: activeModule.destination
            },
            index
          })
        )
      );

      lastApiFetchTimeRef.current = Date.now();
      const recommendedRoute = pickFastestRoute(results);
      setRouteResults(
        results.map((route) => ({
          ...route,
          isRecommended: route.id === recommendedRoute?.id
        }))
      );
      setLastUpdated(new Date());
    } catch (refreshError) {
      setFetchError(classifyRouteError(refreshError));
    } finally {
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
    }
  });

  // Auto-fetch when activeModule or googleMaps changes
  useEffect(() => {
    if (!activeModule || !googleMaps || !routeClassRef.current) {
      if (activeModule?.mode !== "traffic") {
        return;
      }
    }

    void refreshRoutesEvent();
  }, [activeModule, googleMaps]);

  function clearResults() {
    setRouteResults([]);
    setTrafficViewResults([]);
    setTrafficViewGroupResults([]);
  }

  const comparison = computeRouteComparison(routeResults);

  return {
    routeResults,
    trafficViewResults,
    trafficViewGroupResults,
    isRefreshing,
    lastUpdated,
    fetchError,
    refreshRoutes: refreshRoutesEvent,
    clearResults,
    recommendedRoute: comparison.recommendedRoute,
    comparisonDeltaMinutes: comparison.comparisonDeltaMinutes
  };
}

/**
 * 將路線查詢錯誤分類為使用者可理解的訊息。
 */
function classifyRouteError(error) {
  const msg = error?.message || String(error);
  const status = error?.status || error?.code;

  // API 配額超過限制
  if (status === "RESOURCE_EXHAUSTED" || status === 429 || /quota|rate.?limit/i.test(msg)) {
    return "API 配額已用完，請稍後再試或檢查 Google Cloud Console 配額設定。";
  }

  // API 金鑰問題
  if (status === "PERMISSION_DENIED" || status === 403 || /api.?key|permission|denied/i.test(msg)) {
    return "API 金鑰無效或權限不足，請檢查 Google Maps API 設定。";
  }

  // 無效請求（地址解析失敗等）
  if (status === "INVALID_ARGUMENT" || status === 400 || /invalid|not.?found/i.test(msg)) {
    return "路線查詢參數有誤，請檢查起點、終點或途經點設定。";
  }

  // 網路錯誤
  if (/network|fetch|timeout|abort|offline/i.test(msg) || error instanceof TypeError) {
    return "網路連線失敗，請確認網路狀態後再試。";
  }

  return `路線查詢失敗：${msg}`;
}
