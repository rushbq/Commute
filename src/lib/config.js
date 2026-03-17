export const APP_CONFIG = {
  appTitle: import.meta.env.VITE_APP_TITLE || "通勤小工具",
  appSubtitle: import.meta.env.VITE_APP_SUBTITLE || "Commute Checker",
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  routesUrl: `${import.meta.env.BASE_URL}data/routes.json`,
  refreshIntervalMs: 60000,
  defaultMapZoom: 14,
  googleMapsLanguage: "zh-TW",
  googleMapsRegion: "TW"
};
