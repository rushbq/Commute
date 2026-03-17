(function initUiModule(global) {
  "use strict";

  function createUI(doc) {
    var root = doc || document;
    var elements = {
      routeGrid: root.getElementById("route-grid"),
      recommendedRoute: root.getElementById("recommended-route"),
      statusText: root.getElementById("status-text"),
      lastUpdated: root.getElementById("last-updated"),
      errorText: root.getElementById("error-text"),
      refreshCountdown: root.getElementById("refresh-countdown"),
      themeToggle: root.getElementById("theme-toggle"),
      installButton: root.getElementById("install-button")
    };

    function renderRoutes(routes) {
      elements.routeGrid.innerHTML = "";

      routes.forEach(function renderRouteCard(route) {
        elements.routeGrid.appendChild(buildRouteCard(root, route));
      });
    }

    function setRecommendedRoute(routeName) {
      elements.recommendedRoute.textContent = routeName || "-";
    }

    function setStatus(message, tone) {
      elements.statusText.textContent = message;
      elements.statusText.dataset.tone = tone || "neutral";
    }

    function setError(message) {
      if (!message) {
        elements.errorText.hidden = true;
        elements.errorText.textContent = "";
        return;
      }

      elements.errorText.hidden = false;
      elements.errorText.textContent = message;
    }

    function setLastUpdated(date) {
      elements.lastUpdated.textContent = "Last updated: " + formatDate(date);
    }

    function setRefreshCountdown(text) {
      elements.refreshCountdown.textContent = text;
    }

    function setThemeLabel(theme) {
      if (theme === "dark") {
        elements.themeToggle.textContent = "Light mode";
        elements.themeToggle.setAttribute("aria-pressed", "true");
        return;
      }

      elements.themeToggle.textContent = "Dark mode";
      elements.themeToggle.setAttribute("aria-pressed", "false");
    }

    function bindThemeToggle(handler) {
      elements.themeToggle.addEventListener("click", handler);
    }

    function setInstallVisible(isVisible) {
      elements.installButton.hidden = !isVisible;
    }

    function bindInstall(handler) {
      elements.installButton.addEventListener("click", handler);
    }

    return {
      renderRoutes: renderRoutes,
      setRecommendedRoute: setRecommendedRoute,
      setStatus: setStatus,
      setError: setError,
      setLastUpdated: setLastUpdated,
      setRefreshCountdown: setRefreshCountdown,
      setThemeLabel: setThemeLabel,
      bindThemeToggle: bindThemeToggle,
      setInstallVisible: setInstallVisible,
      bindInstall: bindInstall
    };
  }

  function buildRouteCard(doc, route) {
    var card = doc.createElement("article");
    card.className = "route-card" + (route.isFastest ? " is-fastest" : "");
    card.style.setProperty("--route-accent", route.strokeColor || "#3b82f6");

    var header = doc.createElement("div");
    header.className = "route-card-header";

    var title = doc.createElement("h3");
    title.className = "route-name";
    title.textContent = route.name;

    header.appendChild(title);

    if (route.isFastest) {
      var badge = doc.createElement("span");
      badge.className = "route-badge";
      badge.textContent = "Fastest";
      header.appendChild(badge);
    }

    card.appendChild(header);
    card.appendChild(buildMetric(doc, "Travel time", route.durationText || "--"));
    card.appendChild(buildMetric(doc, "Distance", route.distanceText || "--"));

    return card;
  }

  function buildMetric(doc, label, value) {
    var wrapper = doc.createElement("div");
    wrapper.className = "route-metric";

    var metricLabel = doc.createElement("span");
    metricLabel.className = "route-metric-label";
    metricLabel.textContent = label;

    var metricValue = doc.createElement("strong");
    metricValue.className = "route-metric-value";
    metricValue.textContent = value;

    wrapper.appendChild(metricLabel);
    wrapper.appendChild(metricValue);
    return wrapper;
  }

  function formatDate(date) {
    if (!(date instanceof Date)) {
      return "-";
    }

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  global.CommuteCheckerUI = {
    createUI: createUI
  };
})(window);
