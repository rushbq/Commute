export const APP_CONFIG = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  routesUrl: `${import.meta.env.BASE_URL}data/routes.json`,
  refreshIntervalMs: 60000,
  defaultMapZoom: 14,
  googleMapsLanguage: "zh-TW",
  googleMapsRegion: "TW"
};
