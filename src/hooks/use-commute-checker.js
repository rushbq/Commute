import { useEffect, useEffectEvent, useRef, useState } from "react";
import { APP_CONFIG } from "../lib/config";
import { buildDirectionsRequest, loadGoogleMaps, normalizeRoute } from "../lib/google-maps";

export function useCommuteChecker() {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [routesConfig, setRoutesConfig] = useState(null);
  const [routeResults, setRouteResults] = useState([]);
  const [status, setStatus] = useState({
    tone: "neutral",
    message: "準備載入地圖與路線設定..."
  });
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(
    Math.ceil(APP_CONFIG.refreshIntervalMs / 1000)
  );
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const directionsServiceRef = useRef(null);
  const nextRefreshAtRef = useRef(null);
  const refreshInFlightRef = useRef(false);

  const refreshRoutesEvent = useEffectEvent(async (reason = "manual") => {
    if (!routesConfig || !googleMaps || !directionsServiceRef.current || refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsRefreshing(true);
    setError("");

    if (reason !== "initial") {
      setStatus({
        tone: "neutral",
        message: "更新即時交通與通勤時間中..."
      });
    }

    try {
      const results = await Promise.all(
        routesConfig.routes.map((routeConfig, index) =>
          requestRoute({
            directionsService: directionsServiceRef.current,
            maps: googleMaps,
            routeConfig,
            index
          })
        )
      );

      const recommendedRoute = pickFastestRoute(results);
      setRouteResults(
        results.map((route) => ({
          ...route,
          isRecommended: route.id === recommendedRoute?.id
        }))
      );
      setLastUpdated(new Date());
      setStatus({
        tone: "success",
        message: recommendedRoute
          ? `目前建議走 ${recommendedRoute.name}`
          : "路線資料已更新"
      });
      nextRefreshAtRef.current = Date.now() + APP_CONFIG.refreshIntervalMs;
      setCountdownSeconds(Math.ceil(APP_CONFIG.refreshIntervalMs / 1000));
    } catch (refreshError) {
      setStatus({
        tone: "warning",
        message: "更新失敗，暫時保留上一筆資料"
      });
      setError(refreshError.message);
    } finally {
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setStatus({
          tone: "neutral",
          message: "載入路線設定與 Google Maps 中..."
        });

        const [config, maps] = await Promise.all([loadRoutesConfig(), loadGoogleMaps()]);

        if (cancelled) {
          return;
        }

        directionsServiceRef.current = new maps.DirectionsService();
        setRoutesConfig(config);
        setGoogleMaps(maps);
        setStatus({
          tone: "neutral",
          message: "Google Maps 已連線，正在取得第一筆路線資料..."
        });
      } catch (bootstrapError) {
        if (cancelled) {
          return;
        }

        setStatus({
          tone: "warning",
          message: "初始化失敗，請檢查 API key 與網路設定"
        });
        setError(bootstrapError.message);
      } finally {
        if (!cancelled) {
          setIsBooting(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!routesConfig || !googleMaps || !directionsServiceRef.current) {
      return;
    }

    refreshRoutesEvent("initial");

    const refreshTimer = window.setInterval(() => {
      refreshRoutesEvent("auto");
    }, APP_CONFIG.refreshIntervalMs);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [googleMaps, routesConfig]);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      if (!nextRefreshAtRef.current) {
        setCountdownSeconds(Math.ceil(APP_CONFIG.refreshIntervalMs / 1000));
        return;
      }

      setCountdownSeconds(
        Math.max(0, Math.ceil((nextRefreshAtRef.current - Date.now()) / 1000))
      );
    }, 1000);

    return () => {
      window.clearInterval(countdownTimer);
    };
  }, []);

  const recommendedRoute = routeResults.find((route) => route.isRecommended) || routeResults[0] || null;
  const slowerRoute = routeResults.find((route) => route.id !== recommendedRoute?.id) || null;
  const comparisonDeltaMinutes =
    recommendedRoute && slowerRoute
      ? Math.max(0, Math.round((slowerRoute.durationSeconds - recommendedRoute.durationSeconds) / 60))
      : 0;

  return {
    googleMaps,
    routesConfig,
    routeResults,
    recommendedRoute,
    comparisonDeltaMinutes,
    status,
    error,
    isBooting,
    isRefreshing,
    lastUpdated,
    countdownSeconds,
    refreshRoutes: () => refreshRoutesEvent("manual")
  };
}

async function loadRoutesConfig() {
  const response = await fetch(APP_CONFIG.routesUrl, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("無法讀取路線設定檔 public/data/routes.json。");
  }

  return response.json();
}

function requestRoute({ directionsService, maps, routeConfig, index }) {
  return new Promise((resolve, reject) => {
    directionsService.route(buildDirectionsRequest(routeConfig, maps), (result, status) => {
      if (status !== "OK" && status !== maps.DirectionsStatus.OK) {
        reject(new Error(`${routeConfig.name} 路線查詢失敗：${status}`));
        return;
      }

      resolve(normalizeRoute(routeConfig, result.routes[0], index));
    });
  });
}

function pickFastestRoute(routes) {
  return routes.reduce((fastest, current) => {
    if (!fastest) {
      return current;
    }

    return current.durationSeconds < fastest.durationSeconds ? current : fastest;
  }, null);
}
