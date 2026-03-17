(function initConfig(global) {
  "use strict";

  var config = {
    GOOGLE_MAPS_API_KEY: "YOUR_KEY",
    GOOGLE_MAPS_API_URL: "https://maps.googleapis.com/maps/api/js",
    ROUTES_CONFIG_URL: "./data/routes.json",
    INLINE_ROUTES_ELEMENT_ID: "routes-data",
    REFRESH_INTERVAL_MS: 60000,
    DEFAULT_MAP_ZOOM: 14,
    APP_NAME: "Commute Traffic Checker",
    LIGHT_THEME: "light",
    DARK_THEME: "dark",
    THEME_STORAGE_KEY: "commute-checker-theme"
  };

  global.CommuteCheckerConfig = Object.freeze(config);
})(window);
