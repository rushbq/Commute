/**
 * Commute Checker Composition Hook
 *
 * 組合 useSettingsManager 與 useRouteFetcher，
 * 提供統一的 API 介面給 App 元件使用。
 *
 * 符合單一職責原則：僅負責組合與協調子 hook。
 */

import { useRouteFetcher } from "./use-route-fetcher";
import { useSettingsManager } from "./use-settings-manager";

export function useCommuteChecker() {
  const settingsManager = useSettingsManager();
  const routeFetcher = useRouteFetcher({
    activeModule: settingsManager.activeModule,
    googleMaps: settingsManager.googleMaps,
    routeClassRef: settingsManager.routeClassRef
  });

  // Combine errors from both hooks
  const error = settingsManager.error || routeFetcher.fetchError;

  async function selectModule(moduleId) {
    routeFetcher.clearResults();
    await settingsManager.selectModule(moduleId);
  }

  async function saveSettings(nextSettings) {
    routeFetcher.clearResults();
    await settingsManager.saveSettings(nextSettings);
  }

  async function resetSettingsToDefaults() {
    settingsManager.setError("");
    routeFetcher.clearResults();
    await settingsManager.resetSettingsToDefaults();
  }

  return {
    googleMaps: settingsManager.googleMaps,
    settings: settingsManager.settings,
    activeModule: settingsManager.activeModule,
    activeModuleId: settingsManager.activeModuleId,
    modules: settingsManager.modules,
    trafficViewResults: routeFetcher.trafficViewResults,
    error,
    isBooting: settingsManager.isBooting,
    isRefreshing: routeFetcher.isRefreshing,
    lastUpdated: routeFetcher.lastUpdated,
    refreshRoutes: routeFetcher.refreshRoutes,
    selectModule,
    saveSettings,
    resetSettingsToDefaults,
    clearAllAndReload: settingsManager.clearAllAndReload
  };
}
