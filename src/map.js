(function initMapModule(global) {
  "use strict";

  var DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f97316", "#f43f5e"];
  var LIGHT_MAP_STYLES = [];
  var DARK_MAP_STYLES = [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111827" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0b3b2e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0b1220" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#cbd5f5" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b3558" }] }
  ];

  function createMapController(options) {
    var maps = options.maps;
    var element = options.element;
    var initialCenter = options.center;
    var initialZoom = options.zoom || 14;
    var theme = options.theme || "light";
    var polylines = [];
    var markers = [];

    var map = new maps.Map(element, {
      center: initialCenter,
      zoom: initialZoom,
      styles: resolveMapStyles(theme),
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
      gestureHandling: "greedy",
      clickableIcons: false
    });

    var trafficLayer = new maps.TrafficLayer();
    trafficLayer.setMap(map);

    function clearRoutes() {
      polylines.forEach(function clearPolyline(polyline) {
        polyline.setMap(null);
      });
      polylines = [];

      markers.forEach(function clearMarker(marker) {
        marker.setMap(null);
      });
      markers = [];
    }

    function renderRoutes(routes) {
      clearRoutes();

      routes.forEach(function drawRoute(route, index) {
        if (!route.path || !route.path.length) {
          return;
        }

        var polyline = new maps.Polyline({
          map: map,
          path: route.path,
          strokeColor: route.strokeColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          strokeOpacity: route.isFastest ? 0.95 : 0.72,
          strokeWeight: route.isFastest ? 7 : 5,
          zIndex: route.isFastest ? 10 : 5
        });

        polylines.push(polyline);
      });

      addRouteMarkers(routes);
      map.setCenter(initialCenter);
      map.setZoom(initialZoom);
    }

    function addRouteMarkers(routes) {
      var firstRoute = routes.find(function hasPath(route) {
        return route.path && route.path.length;
      });

      if (!firstRoute) {
        return;
      }

      markers.push(
        new maps.Marker({
          map: map,
          position: firstRoute.path[0],
          label: "S",
          title: "Origin"
        })
      );

      markers.push(
        new maps.Marker({
          map: map,
          position: firstRoute.path[firstRoute.path.length - 1],
          label: "D",
          title: "Destination"
        })
      );
    }

    function setTheme(nextTheme) {
      map.setOptions({
        styles: resolveMapStyles(nextTheme)
      });
    }

    return {
      map: map,
      renderRoutes: renderRoutes,
      clearRoutes: clearRoutes,
      setTheme: setTheme
    };
  }

  function resolveMapStyles(theme) {
    return theme === "dark" ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
  }

  global.CommuteCheckerMap = {
    createMapController: createMapController
  };
})(window);
