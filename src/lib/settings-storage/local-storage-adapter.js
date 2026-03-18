// v3：2025 架構 — traffic-only 模組 + schedule 欄位 + 觀測點獨立 zoom
// 升版後舊裝置的 v2 資料會自動被忽略，以 routes.json 重新初始化
const SETTINGS_STORAGE_KEY = "commute-checker-settings-v3";
const ACTIVE_MODULE_STORAGE_KEY = "commute-checker-active-module-v3";

export function createLocalStorageSettingsAdapter() {
  return {
    provider: "local",
    async loadSettings() {
      try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.error("Failed to read stored settings.", error);
        return null;
      }
    },
    async saveSettings(value) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
    },
    async clearSettings() {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    },
    async loadActiveModuleId() {
      return window.localStorage.getItem(ACTIVE_MODULE_STORAGE_KEY);
    },
    async saveActiveModuleId(moduleId) {
      window.localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, moduleId);
    },
    async clearActiveModuleId() {
      window.localStorage.removeItem(ACTIVE_MODULE_STORAGE_KEY);
    }
  };
}
