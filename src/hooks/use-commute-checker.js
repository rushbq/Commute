import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { APP_CONFIG } from "../lib/config";
import { buildDirectionsRequest, loadGoogleMaps, normalizeRoute } from "../lib/google-maps";
import { createSettingsStorageAdapter } from "../lib/settings-storage";

export function useCommuteChecker() {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [settings, setSettings] = useState(null);
  const [systemDefaultSettings, setSystemDefaultSettings] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [routeResults, setRouteResults] = useState([]);
  const [trafficViewResults, setTrafficViewResults] = useState([]);
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
  const settingsStorageRef = useRef(createSettingsStorageAdapter());

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

  const activeMode = activeModule?.mode || null;
  const availableModes = useMemo(() => {
    const modes = new Set((settings?.modules || []).map((moduleItem) => moduleItem.mode || "route"));
    return Array.from(modes).sort((left, right) => {
      const order = { traffic: 0, route: 1 };
      return (order[left] ?? 99) - (order[right] ?? 99);
    });
  }, [settings]);
  const visibleModules = useMemo(() => {
    if (!activeMode) {
      return settings?.modules || [];
    }

    return (settings?.modules || []).filter((moduleItem) => moduleItem.mode === activeMode);
  }, [settings, activeMode]);

  const refreshRoutesEvent = useEffectEvent(async () => {
    if (!activeModule || !googleMaps || refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsRefreshing(true);
    setError("");
    setRouteResults([]);
    setTrafficViewResults([]);

    if (activeModule.mode === "traffic") {
      setStatus({
        tone: "neutral",
        message: `更新 ${activeModule.name} 觀測點中...`
      });

      try {
        setTrafficViewResults(buildTrafficViews(activeModule));
        setLastUpdated(new Date());
        setStatus({
          tone: "success",
          message: `${activeModule.name} 觀測點已更新`
        });
      } catch (trafficError) {
        setStatus({
          tone: "warning",
          message: `${activeModule.name} 觀測點更新失敗`
        });
        setError(trafficError.message);
      } finally {
        refreshInFlightRef.current = false;
        setIsRefreshing(false);
      }

      return;
    }

    if (!directionsServiceRef.current) {
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
      return;
    }

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
            routeConfig: {
              ...routeConfig,
              origin: activeModule.origin,
              destination: activeModule.destination
            },
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

        const settingsStorage = settingsStorageRef.current;
        const [defaultSettings, maps, storedSettings, storedModuleId] = await Promise.all([
          loadRoutesConfig(),
          loadGoogleMaps(),
          settingsStorage.loadSettings(),
          settingsStorage.loadActiveModuleId()
        ]);
        if (cancelled) {
          return;
        }

        const normalizedDefaultSettings = normalizeSettingsShape(defaultSettings);
        const nextSettings = storedSettings
          ? normalizeSettingsShape(mergeSettings(normalizedDefaultSettings, storedSettings))
          : normalizedDefaultSettings;
        const fallbackModuleId = nextSettings.defaultModuleId || nextSettings.modules[0]?.id || null;
        const storedModule = nextSettings.modules.find((item) => item.id === storedModuleId);
        const resolvedModuleId =
          storedModule && storedModule.mode === "traffic" ? storedModule.id : fallbackModuleId;

        directionsServiceRef.current = new maps.DirectionsService();
        setSystemDefaultSettings(normalizedDefaultSettings);
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
      if (activeModule?.mode !== "traffic") {
        return;
      }
    }

    void refreshRoutesEvent();
  }, [activeModule, googleMaps]);

  async function selectModule(moduleId) {
    setRouteResults([]);
    setTrafficViewResults([]);
    setActiveModuleId(moduleId);
    try {
      await settingsStorageRef.current.saveActiveModuleId(moduleId);
    } catch (storageError) {
      setError(storageError.message);
    }
  }

  async function saveSettings(nextSettings) {
    const normalized = normalizeSettingsShape(nextSettings);
    const nextActiveModuleId = normalized.modules.some((item) => item.id === activeModuleId)
      ? activeModuleId
      : normalized.defaultModuleId || normalized.modules[0]?.id || null;
    const nextActiveModule =
      normalized.modules.find((item) => item.id === nextActiveModuleId) || normalized.modules[0] || null;

    setSettings(normalized);
    await settingsStorageRef.current.saveSettings(normalized);

    setRouteResults([]);
    setTrafficViewResults([]);

    if (nextActiveModuleId) {
      setActiveModuleId(nextActiveModuleId);
      await settingsStorageRef.current.saveActiveModuleId(nextActiveModuleId);
    }

    if (nextActiveModule?.mode === "traffic") {
      setTrafficViewResults(buildTrafficViews(nextActiveModule));
      setLastUpdated(new Date());
      setStatus({
        tone: "success",
        message: `${nextActiveModule.name} 觀測點已更新`
      });
      return;
    }
  }

  async function resetSettingsToDefaults() {
    if (!systemDefaultSettings) {
      throw new Error("系統預設值尚未載入完成，請稍後再試。");
    }

    const normalizedDefaults = cloneSettings(systemDefaultSettings);
    const nextActiveModuleId =
      normalizedDefaults.defaultModuleId || normalizedDefaults.modules[0]?.id || null;

    await settingsStorageRef.current.clearSettings();
    await settingsStorageRef.current.clearActiveModuleId();

    setError("");
    setRouteResults([]);
    setTrafficViewResults([]);
    setLastUpdated(null);
    setStatus({
      tone: "neutral",
      message: "已恢復系統預設設定，正在重新整理資料..."
    });
    setSettings(normalizedDefaults);
    setActiveModuleId(nextActiveModuleId);
  }

  async function selectMode(mode) {
    const targetModule =
      (settings?.modules || []).find(
        (moduleItem) => moduleItem.mode === mode && moduleItem.id === activeModuleId
      ) ||
      (settings?.modules || []).find((moduleItem) => moduleItem.mode === mode);

    if (targetModule) {
      await selectModule(targetModule.id);
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
    activeMode,
    activeModuleId,
    modules: visibleModules,
    availableModes,
    routeResults,
    trafficViewResults,
    recommendedRoute,
    comparisonDeltaMinutes,
    status,
    error,
    isBooting,
    isRefreshing,
    lastUpdated,
    refreshRoutes: refreshRoutesEvent,
    selectModule,
    selectMode,
    saveSettings,
    resetSettingsToDefaults
  };
}

function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
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
          mode: moduleItem.mode === "traffic" ? "traffic" : "route",
          name: moduleItem.name || `模組 ${index + 1}`,
          origin:
            moduleItem.origin ||
            moduleItem.routes?.[0]?.origin ||
            "",
          destination:
            moduleItem.destination ||
            moduleItem.routes?.[0]?.destination ||
            "",
          mapZoom: Number(moduleItem.mapZoom) || 14,
          routes: normalizeRoutes(moduleItem.routes),
          views: normalizeViews(moduleItem.views)
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
    waypoints: Array.isArray(route.waypoints)
      ? route.waypoints
          .filter((waypoint) => waypoint && waypoint.location)
          .map((waypoint) => ({
            location: waypoint.location,
            stopover: waypoint.stopover === true
          }))
      : [],
    strokeColor: route.strokeColor || (index === 0 ? "#336dff" : "#7c3aed")
  }));
}

function normalizeViews(views) {
  return (Array.isArray(views) ? views : []).map((view, index) => ({
    name: view.name || `觀測點 ${index + 1}`,
    label: view.label || `交通觀測 ${index + 1}`,
    accentColor: view.accentColor || (index === 0 ? "#336dff" : "#7c3aed"),
    center: {
      lat: Number(view.center?.lat) || 25.0478,
      lng: Number(view.center?.lng) || 121.5319
    },
    zoom: Number(view.zoom) || 13
  }));
}

function buildTrafficViews(moduleItem) {
  return (moduleItem?.views || []).map((view, index) => ({
    id: `${moduleItem.id}-view-${index + 1}`,
    name: view.name || `觀測點 ${index + 1}`,
    label: view.label || `交通觀測 ${index + 1}`,
    accentColor: view.accentColor || (index === 0 ? "#336dff" : "#7c3aed"),
    center: view.center,
    zoom: moduleItem.mapZoom || view.zoom || 13
  }));
}

function mergeSettings(defaultSettings, storedSettings) {
  const defaultModules = Array.isArray(defaultSettings?.modules) ? defaultSettings.modules : [];
  const storedModules = Array.isArray(storedSettings?.modules) ? storedSettings.modules : [];
  const storedById = new Map(storedModules.map((moduleItem) => [moduleItem.id, moduleItem]));
  const mergedModules = defaultModules.map((moduleItem) => storedById.get(moduleItem.id) || moduleItem);
  const storedHasTrafficMode = storedModules.some((moduleItem) => moduleItem.mode === "traffic");

  storedModules.forEach((moduleItem) => {
    if (!defaultModules.some((defaultModule) => defaultModule.id === moduleItem.id)) {
      mergedModules.push(moduleItem);
    }
  });

  return {
    ...defaultSettings,
    ...storedSettings,
    defaultModuleId: storedHasTrafficMode
      ? storedSettings.defaultModuleId || defaultSettings.defaultModuleId
      : defaultSettings.defaultModuleId,
    modules: mergedModules
  };
}
