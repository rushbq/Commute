(function initApp(global) {
  "use strict";

  var config = global.CommuteCheckerConfig;
  var ui = global.CommuteCheckerUI.createUI(document);
  var mapController = null;
  var routeService = null;
  var deferredInstallPrompt = null;
  var routeConfig = null;
  var refreshIntervalId = null;
  var countdownIntervalId = null;
  var nextRefreshAt = 0;

  document.addEventListener("DOMContentLoaded", bootstrap);

  async function bootstrap() {
    var initialTheme = resolveInitialTheme();
    applyTheme(initialTheme, false);
    ui.bindThemeToggle(toggleTheme);
    ui.bindInstall(handleInstall);
    ui.setInstallVisible(false);
    setupInstallPrompt();
    registerServiceWorker();

    try {
      routeConfig = await loadRouteConfig();
      renderLoadingCards(routeConfig.routes);
      validateApiKey(config.GOOGLE_MAPS_API_KEY);

      ui.setStatus("Loading Google Maps and live traffic...", "neutral");
      await loadGoogleMapsApi(config.GOOGLE_MAPS_API_KEY);

      mapController = global.CommuteCheckerMap.createMapController({
        maps: global.google.maps,
        element: document.getElementById("map"),
        center: routeConfig.center,
        zoom: routeConfig.mapZoom || config.DEFAULT_MAP_ZOOM,
        theme: initialTheme
      });

      routeService = global.CommuteCheckerRouteService.createRouteService(global.google.maps);
      await refreshRoutes();
      startAutoRefresh();
    } catch (error) {
      ui.setStatus("Unable to start the traffic checker.", "error");
      ui.setError(error.message);
      console.error(error);
    }
  }

  async function refreshRoutes() {
    if (!routeService || !routeConfig) {
      return;
    }

    try {
      ui.setError("");
      ui.setStatus("Refreshing route durations and traffic...", "neutral");

      var routes = await routeService.getRoutes(routeConfig.routes);
      var fastestRoute = pickFastestRoute(routes);
      var decoratedRoutes = routes.map(function markFastest(route) {
        return Object.assign({}, route, {
          isFastest: fastestRoute && route.name === fastestRoute.name
        });
      });

      ui.renderRoutes(decoratedRoutes);
      ui.setRecommendedRoute(fastestRoute ? fastestRoute.name : "-");
      ui.setStatus(
        fastestRoute ? "Recommended Route: " + fastestRoute.name : "Route data loaded.",
        fastestRoute ? "success" : "neutral"
      );
      ui.setLastUpdated(new Date());

      if (mapController) {
        mapController.renderRoutes(decoratedRoutes);
      }

      nextRefreshAt = Date.now() + config.REFRESH_INTERVAL_MS;
      updateRefreshCountdown();
    } catch (error) {
      ui.setStatus("Failed to refresh live route data.", "error");
      ui.setError(error.message);
      console.error(error);
    }
  }

  function startAutoRefresh() {
    stopTimers();

    refreshIntervalId = global.setInterval(function onRefreshTick() {
      refreshRoutes();
    }, config.REFRESH_INTERVAL_MS);

    countdownIntervalId = global.setInterval(updateRefreshCountdown, 1000);
  }

  function stopTimers() {
    if (refreshIntervalId) {
      global.clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }

    if (countdownIntervalId) {
      global.clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
  }

  function updateRefreshCountdown() {
    if (!nextRefreshAt) {
      ui.setRefreshCountdown("60s");
      return;
    }

    var remainingSeconds = Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000));
    ui.setRefreshCountdown(remainingSeconds + "s");
  }

  function renderLoadingCards(routes) {
    var placeholders = routes.map(function toPlaceholder(route, index) {
      return {
        name: route.name || "Route " + (index + 1),
        durationText: "--",
        distanceText: "--",
        strokeColor: route.strokeColor
      };
    });

    ui.renderRoutes(placeholders);
    ui.setRecommendedRoute("-");
  }

  function pickFastestRoute(routes) {
    if (!routes.length) {
      return null;
    }

    return routes.reduce(function compareFastest(fastest, current) {
      return current.durationSeconds < fastest.durationSeconds ? current : fastest;
    });
  }

  async function loadRouteConfig() {
    try {
      var response = await fetch(config.ROUTES_CONFIG_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load " + config.ROUTES_CONFIG_URL + ".");
      }

      return await response.json();
    } catch (error) {
      var fallbackElement = document.getElementById(config.INLINE_ROUTES_ELEMENT_ID);
      if (!fallbackElement) {
        throw error;
      }

      return JSON.parse(fallbackElement.textContent);
    }
  }

  function validateApiKey(apiKey) {
    if (!apiKey || apiKey === "YOUR_KEY") {
      throw new Error("Add your Google Maps API key in /src/config.js before running the app.");
    }
  }

  function loadGoogleMapsApi(apiKey) {
    if (global.google && global.google.maps) {
      return Promise.resolve(global.google.maps);
    }

    return new Promise(function loadPromise(resolve, reject) {
      var callbackName = "__commuteCheckerInitMaps";
      var script = document.createElement("script");
      var params = new URLSearchParams({
        key: apiKey,
        v: "weekly",
        loading: "async",
        callback: callbackName
      });

      global[callbackName] = function onMapsLoaded() {
        delete global[callbackName];
        resolve(global.google.maps);
      };

      script.src = config.GOOGLE_MAPS_API_URL + "?" + params.toString();
      script.async = true;
      script.defer = true;
      script.onerror = function handleScriptError() {
        delete global[callbackName];
        reject(new Error("Google Maps JavaScript API failed to load."));
      };

      document.head.appendChild(script);
    });
  }

  function resolveInitialTheme() {
    var savedTheme = global.localStorage.getItem(config.THEME_STORAGE_KEY);
    if (savedTheme === config.DARK_THEME || savedTheme === config.LIGHT_THEME) {
      return savedTheme;
    }

    return global.matchMedia("(prefers-color-scheme: dark)").matches
      ? config.DARK_THEME
      : config.LIGHT_THEME;
  }

  function toggleTheme() {
    var currentTheme = document.documentElement.dataset.theme || config.LIGHT_THEME;
    var nextTheme = currentTheme === config.DARK_THEME ? config.LIGHT_THEME : config.DARK_THEME;
    applyTheme(nextTheme, true);
  }

  function applyTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute("content", theme === config.DARK_THEME ? "#0f172a" : "#0f766e");

    ui.setThemeLabel(theme);

    if (persist) {
      global.localStorage.setItem(config.THEME_STORAGE_KEY, theme);
    }

    if (mapController) {
      mapController.setTheme(theme);
    }
  }

  function setupInstallPrompt() {
    global.addEventListener("beforeinstallprompt", function onBeforeInstallPrompt(event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      ui.setInstallVisible(true);
    });

    global.addEventListener("appinstalled", function onAppInstalled() {
      deferredInstallPrompt = null;
      ui.setInstallVisible(false);
    });
  }

  async function handleInstall() {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    ui.setInstallVisible(false);
  }

  function registerServiceWorker() {
    var isSecureLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    var canRegister =
      "serviceWorker" in navigator &&
      location.protocol !== "file:" &&
      (global.isSecureContext || isSecureLocalhost);

    if (!canRegister) {
      return;
    }

    navigator.serviceWorker.register("./service-worker.js").catch(function onSwError(error) {
      console.error("Service worker registration failed.", error);
    });
  }
})(window);
