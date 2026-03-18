/**
 * Settings Normalizer Service
 *
 * 負責設定資料的正規化、合併、深複製、排程解析。
 * 純函式，不依賴任何 React 或瀏覽器 API。
 */

const VALID_SCHEDULES = ["light", "dark", "always"];

/**
 * 檢查已儲存的設定是否與目前架構相容。
 * 不相容時 bootstrap 會忽略舊資料，直接從 routes.json 重新初始化。
 *
 * 判斷條件：必須至少有一個 traffic 模式模組，且有 schedule 欄位。
 */
export function isSettingsCompatible(storedSettings) {
  const modules = storedSettings?.modules;
  if (!Array.isArray(modules) || !modules.length) return false;

  const hasTrafficModule = modules.some((m) => m.mode === "traffic");
  const hasScheduleField = modules.some((m) => m.schedule != null);

  return hasTrafficModule && hasScheduleField;
}

export function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}

export function normalizeSettingsShape(settings) {
  const modules = Array.isArray(settings?.modules)
    ? settings.modules
        .filter((moduleItem) => moduleItem && moduleItem.id)
        .map((moduleItem, index) => ({
          id: moduleItem.id || `module-${index + 1}`,
          mode: moduleItem.mode === "traffic" ? "traffic" : "route",
          name: moduleItem.name || `模組 ${index + 1}`,
          schedule: VALID_SCHEDULES.includes(moduleItem.schedule) ? moduleItem.schedule : "always",
          origin:
            moduleItem.origin ||
            moduleItem.routes?.[0]?.origin ||
            "",
          destination:
            moduleItem.destination ||
            moduleItem.routes?.[0]?.destination ||
            "",
          waypoints: Array.isArray(moduleItem.waypoints)
            ? moduleItem.waypoints.filter((wp) => typeof wp === "string" && wp.trim())
            : [],  // 保留向下相容，途經點已改由觀測點的 isWaypoint 控制
          routes: normalizeRoutes(moduleItem.routes),
          views: normalizeViews(moduleItem.views),
          viewGroups: normalizeViewGroups(
            Array.isArray(moduleItem.viewGroups) && moduleItem.viewGroups.length > 0
              ? moduleItem.viewGroups
              : migrateViewsToViewGroups(moduleItem.views)
          )
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

export function mergeSettings(defaultSettings, storedSettings) {
  const defaultModules = Array.isArray(defaultSettings?.modules) ? defaultSettings.modules : [];
  const storedModules = Array.isArray(storedSettings?.modules) ? storedSettings.modules : [];
  const storedById = new Map(storedModules.map((moduleItem) => [moduleItem.id, moduleItem]));
  const mergedModules = defaultModules.map((moduleItem) => storedById.get(moduleItem.id) || moduleItem);

  storedModules.forEach((moduleItem) => {
    if (!defaultModules.some((defaultModule) => defaultModule.id === moduleItem.id)) {
      mergedModules.push(moduleItem);
    }
  });

  return {
    ...defaultSettings,
    ...storedSettings,
    modules: mergedModules
  };
}

/**
 * 根據目前時段（白天 / 夜覽）解析應該預設顯示的模組。
 * 排程優先順序：精確匹配 > always > 第一個模組。
 */
export function resolveScheduledModuleId(modules) {
  if (!modules?.length) return null;

  const currentPeriod = isNightHours() ? "dark" : "light";

  const periodMatch = modules.find((m) => m.schedule === currentPeriod);
  if (periodMatch) return periodMatch.id;

  const alwaysMatch = modules.find((m) => m.schedule === "always");
  if (alwaysMatch) return alwaysMatch.id;

  return modules[0].id;
}

/**
 * 判斷目前是否為夜間時段（18:00 ~ 05:00）。
 * 與主題系統使用相同的時間判斷邏輯。
 */
export function isNightHours() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 5;
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
    zoom: Number(view.zoom) || 14
  }));
}

/**
 * 將舊版扁平 views 陣列遷移為 viewGroups 結構。
 * 每個舊 view 轉為一個單子觀測點群組。
 */
function migrateViewsToViewGroups(views) {
  if (!Array.isArray(views) || views.length === 0) {
    return [];
  }

  return views.map((view, index) => ({
    name: view.name || `觀測群組 ${index + 1}`,
    zoom: Number(view.zoom) || 14,
    views: [
      {
        name: view.name || `觀測點 ${index + 1}`,
        center: {
          lat: Number(view.center?.lat) || 25.0478,
          lng: Number(view.center?.lng) || 121.5319
        }
      }
    ]
  }));
}

/**
 * 正規化 viewGroups 結構。
 * 確保每個群組有 name、zoom，且子觀測點 1~3 個。
 * 每個子觀測點含 isWaypoint 欄位控制是否為導航途經點。
 */
function normalizeViewGroups(viewGroups) {
  if (!Array.isArray(viewGroups) || viewGroups.length === 0) {
    return [];
  }

  return viewGroups.map((group, groupIndex) => {
    const rawViews = Array.isArray(group.views) ? group.views : [];
    const clampedViews = rawViews.slice(0, 3);

    const normalizedViews =
      clampedViews.length > 0
        ? clampedViews.map((view) => ({
            name: view.name || "",
            center: {
              lat: view.center?.lat ?? "",
              lng: view.center?.lng ?? ""
            },
            isWaypoint: view.isWaypoint === true
          }))
        : [
            {
              name: "",
              center: { lat: "", lng: "" },
              isWaypoint: false
            }
          ];

    return {
      name: group.name || "",
      zoom: Number(group.zoom) || 14,
      views: normalizedViews
    };
  });
}
