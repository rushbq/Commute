/**
 * Settings Manager Hook
 *
 * 負責設定的載入、儲存、模組選取。
 * 符合單一職責原則：僅管理設定狀態，不涉及路線查詢。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cloneSettings, mergeSettings, normalizeSettingsShape, resolveScheduledModuleId } from "../services/settings-normalizer";
import { loadRoutesConfig } from "../services/route-resolver";
import { loadGoogleMaps, loadRouteClass } from "../lib/google-maps";
import { createSettingsStorageAdapter } from "../lib/settings-storage";

export function useSettingsManager() {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [settings, setSettings] = useState(null);
  const [systemDefaultSettings, setSystemDefaultSettings] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [error, setError] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const routeClassRef = useRef(null);
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

  // Bootstrap: load routes config, Google Maps, stored settings
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const settingsStorage = settingsStorageRef.current;
        const [defaultSettings, maps, storedSettings] = await Promise.all([
          loadRoutesConfig(),
          loadGoogleMaps(),
          settingsStorage.loadSettings()
        ]);
        if (cancelled) return;

        const RouteClass = await loadRouteClass();
        if (cancelled) return;

        const normalizedDefaultSettings = normalizeSettingsShape(defaultSettings);
        const nextSettings = storedSettings
          ? normalizeSettingsShape(mergeSettings(normalizedDefaultSettings, storedSettings))
          : normalizedDefaultSettings;

        // 根據排程解析預設模組（忽略已儲存的模組 ID，每次開啟都依時段決定）
        const resolvedModuleId = resolveScheduledModuleId(nextSettings.modules);

        routeClassRef.current = RouteClass;
        setSystemDefaultSettings(normalizedDefaultSettings);
        setSettings(nextSettings);
        setActiveModuleId(resolvedModuleId);
        setGoogleMaps(maps);
      } catch (bootstrapError) {
        if (cancelled) return;
        setError(bootstrapError.message);
      } finally {
        if (!cancelled) {
          setIsBooting(false);
        }
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  async function selectModule(moduleId) {
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
      : resolveScheduledModuleId(normalized.modules);

    setSettings(normalized);
    await settingsStorageRef.current.saveSettings(normalized);

    if (nextActiveModuleId) {
      setActiveModuleId(nextActiveModuleId);
      await settingsStorageRef.current.saveActiveModuleId(nextActiveModuleId);
    }

    return {
      settings: normalized,
      activeModuleId: nextActiveModuleId,
      activeModule: normalized.modules.find((item) => item.id === nextActiveModuleId) || normalized.modules[0] || null
    };
  }

  async function resetSettingsToDefaults() {
    if (!systemDefaultSettings) {
      throw new Error("系統預設值尚未載入完成，請稍後再試。");
    }

    const normalizedDefaults = cloneSettings(systemDefaultSettings);
    const nextActiveModuleId = resolveScheduledModuleId(normalizedDefaults.modules);

    await settingsStorageRef.current.clearSettings();
    await settingsStorageRef.current.clearActiveModuleId();

    setError("");
    setSettings(normalizedDefaults);
    setActiveModuleId(nextActiveModuleId);

    return { activeModuleId: nextActiveModuleId };
  }

  return {
    googleMaps,
    settings,
    activeModule,
    activeModuleId,
    modules: settings?.modules || [],
    error,
    setError,
    isBooting,
    routeClassRef,
    selectModule,
    saveSettings,
    resetSettingsToDefaults
  };
}
