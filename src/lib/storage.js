const SETTINGS_STORAGE_KEY = "commute-checker-settings-v2";
const ACTIVE_MODULE_STORAGE_KEY = "commute-checker-active-module";

export function loadStoredSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read stored settings.", error);
    return null;
  }
}

export function saveStoredSettings(value) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
}

export function loadStoredActiveModuleId() {
  return window.localStorage.getItem(ACTIVE_MODULE_STORAGE_KEY);
}

export function saveStoredActiveModuleId(moduleId) {
  window.localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, moduleId);
}
