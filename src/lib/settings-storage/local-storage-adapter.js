const SETTINGS_STORAGE_KEY = "commute-checker-settings-v2";
const ACTIVE_MODULE_STORAGE_KEY = "commute-checker-active-module";

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
