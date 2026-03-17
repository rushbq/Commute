import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { APP_CONFIG } from "../lib/config";
import { buildDirectionsRequest, loadGoogleMaps, normalizeRoute } from "../lib/google-maps";
import {
  loadStoredActiveModuleId,
  loadStoredSettings,
  saveStoredActiveModuleId,
  saveStoredSettings
} from "../lib/storage";

export function useCommuteChecker() {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [routeResults, setRouteResults] = useState([]);
  const [status, setStatus] = useState({
    tone: "neutral",
    message: "準備載入通勤模組..."
  });
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const directionsServiceRef = useRef(null);
  const refreshInFlightRef = useRef(false);

  const activeModule = useMemo(() => {
    if (!settings?.modules?.length) {
      return null;
    }

    return (
      settings.modules.find((moduleItem) => moduleItem.id === activeModuleId) ||
      settings.modules[0] ||
      null
    );
  }, [settings, activeModuleId]);

  const refreshRoutesEvent = useEffectEvent(async () => {
    if (!activeModule || !googleMaps || !directionsServiceRef.current || refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsRefreshing(true);
    setError("");
    setStatus({
      tone: "neutral",
      message: `更新 ${activeModule.name} 路線中...`
    });

    try {
      const results = await Promise.all(
        activeModule.routes.map((routeConfig, index) =>
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
          ? `${activeModule.name} 建議走 ${recommendedRoute.name}`
          : `${activeModule.name} 路線已更新`
      });
    } catch (refreshError) {
      setStatus({
        tone: "warning",
        message: `${activeModule.name} 路線更新失敗`
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
          message: "載入設定與 Google Maps 中..."
        });

        const [defaultSettings, maps] = await Promise.all([loadRoutesConfig(), loadGoogleMaps()]);
        if (cancelled) {
          return;
        }

        const storedSettings = loadStoredSettings();
        const nextSettings = normalizeSettingsShape(storedSettings || defaultSettings);
        const storedModuleId = loadStoredActiveModuleId();
        const fallbackModuleId = nextSettings.defaultModuleId || nextSettings.modules[0]?.id || null;
        const resolvedModuleId = nextSettings.modules.some((item) => item.id === storedModuleId)
          ? storedModuleId
          : fallbackModuleId;

        directionsServiceRef.current = new maps.DirectionsService();
        setSettings(nextSettings);
        setActiveModuleId(resolvedModuleId);
        setGoogleMaps(maps);
        setStatus({
          tone: "neutral",
          message: "已載入設定，正在取得通勤結果..."
        });
      } catch (bootstrapError) {
        if (cancelled) {
          return;
        }

        setStatus({
          tone: "warning",
          message: "初始化失敗，請檢查 API key 與設定"
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
    if (!activeModule || !googleMaps || !directionsServiceRef.current) {
      return;
    }

    refreshRoutesEvent();
  }, [activeModule, googleMaps]);

  function selectModule(moduleId) {
    setRouteResults([]);
    setActiveModuleId(moduleId);
    saveStoredActiveModuleId(moduleId);
  }

  function saveSettings(nextSettings) {
    const normalized = normalizeSettingsShape(nextSettings);
    setSettings(normalized);
    saveStoredSettings(normalized);

    const nextActiveModuleId = normalized.modules.some((item) => item.id === activeModuleId)
      ? activeModuleId
      : normalized.defaultModuleId || normalized.modules[0]?.id || null;

    setRouteResults([]);

    if (nextActiveModuleId) {
      setActiveModuleId(nextActiveModuleId);
      saveStoredActiveModuleId(nextActiveModuleId);
    }
  }

  const recommendedRoute =
    routeResults.find((route) => route.isRecommended) || routeResults[0] || null;
  const slowerRoute =
    routeResults.find((route) => route.id !== recommendedRoute?.id) || null;
  const comparisonDeltaMinutes =
    recommendedRoute && slowerRoute
      ? Math.max(0, Math.round((slowerRoute.durationSeconds - recommendedRoute.durationSeconds) / 60))
      : 0;

  return {
    googleMaps,
    settings,
    activeModule,
    activeModuleId,
    modules: settings?.modules || [],
    routeResults,
    recommendedRoute,
    comparisonDeltaMinutes,
    status,
    error,
    isBooting,
    isRefreshing,
    lastUpdated,
    refreshRoutes: refreshRoutesEvent,
    selectModule,
    saveSettings
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

function normalizeSettingsShape(settings) {
  const modules = Array.isArray(settings?.modules)
    ? settings.modules
        .filter((moduleItem) => moduleItem && moduleItem.id)
        .map((moduleItem, index) => ({
          id: moduleItem.id || `module-${index + 1}`,
          name: moduleItem.name || `模組 ${index + 1}`,
          center: {
            lat: Number(moduleItem.center?.lat) || 25.0478,
            lng: Number(moduleItem.center?.lng) || 121.5319
          },
          mapZoom: Number(moduleItem.mapZoom) || 14,
          routes: normalizeRoutes(moduleItem.routes)
        }))
    : [];

  return {
    defaultModuleId:
      settings?.defaultModuleId && modules.some((item) => item.id === settings.defaultModuleId)
        ? settings.defaultModuleId
        : modules[0]?.id || null,
    modules
  };
}

function normalizeRoutes(routes) {
  return (Array.isArray(routes) ? routes : []).map((route, index) => ({
    name: route.name || `路線 ${String.fromCharCode(65 + index)}`,
    label: route.label || "主要路線",
    origin: route.origin || "",
    destination: route.destination || "",
    waypoints: Array.isArray(route.waypoints)
      ? route.waypoints
          .filter((waypoint) => waypoint && waypoint.location)
          .map((waypoint) => ({
            location: waypoint.location,
            stopover: waypoint.stopover === true
          }))
      : [],
    strokeColor: route.strokeColor || (index === 0 ? "#336dff" : "#0f766e")
  }));
}
