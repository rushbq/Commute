(function initRouteServiceModule(global) {
  "use strict";

  var DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f97316", "#f43f5e"];

  function createRouteService(maps) {
    var directionsService = new maps.DirectionsService();

    function getRoutes(routeConfigs) {
      return Promise.all(
        routeConfigs.map(function requestSingleRoute(routeConfig, index) {
          return getRoute(routeConfig, index);
        })
      );
    }

    function getRoute(routeConfig, index) {
      return new Promise(function routePromise(resolve, reject) {
        directionsService.route(buildRequest(routeConfig, maps), function handleResult(result, status) {
          if (status !== "OK" && status !== maps.DirectionsStatus.OK) {
            reject(new Error("Directions request failed for " + routeConfig.name + " (" + status + ")."));
            return;
          }

          resolve(normalizeRoute(routeConfig, index, result.routes[0]));
        });
      });
    }

    return {
      getRoutes: getRoutes
    };
  }

  function buildRequest(routeConfig, maps) {
    var travelModeName = routeConfig.travelMode || "DRIVING";
    var travelMode = maps.TravelMode[travelModeName] || maps.TravelMode.DRIVING;
    var request = {
      origin: normalizeLocation(routeConfig.origin),
      destination: normalizeLocation(routeConfig.destination),
      travelMode: travelMode,
      waypoints: normalizeWaypoints(routeConfig.waypoints),
      provideRouteAlternatives: false
    };

    if (travelMode === maps.TravelMode.DRIVING) {
      request.drivingOptions = {
        departureTime: new Date(),
        trafficModel: "bestguess"
      };
    }

    return request;
  }

  function normalizeLocation(location) {
    if (location && typeof location === "object" && typeof location.lat === "number" && typeof location.lng === "number") {
      return {
        lat: location.lat,
        lng: location.lng
      };
    }

    return location;
  }

  function normalizeWaypoints(waypoints) {
    if (!Array.isArray(waypoints)) {
      return [];
    }

    return waypoints.map(function mapWaypoint(waypoint) {
      if (typeof waypoint === "string") {
        return {
          location: waypoint,
          stopover: false
        };
      }

      return {
        location: normalizeLocation(waypoint.location),
        stopover: waypoint.stopover === true
      };
    });
  }

  function normalizeRoute(routeConfig, index, route) {
    var totals = route.legs.reduce(
      function aggregate(accumulator, leg) {
        accumulator.distanceMeters += leg.distance ? leg.distance.value : 0;
        accumulator.durationSeconds += leg.duration ? leg.duration.value : 0;
        accumulator.durationInTrafficSeconds += leg.duration_in_traffic ? leg.duration_in_traffic.value : 0;
        return accumulator;
      },
      {
        distanceMeters: 0,
        durationSeconds: 0,
        durationInTrafficSeconds: 0
      }
    );

    var effectiveDurationSeconds = totals.durationInTrafficSeconds || totals.durationSeconds;

    return {
      name: routeConfig.name || "Route " + (index + 1),
      durationMinutes: Math.max(1, Math.round(effectiveDurationSeconds / 60)),
      distanceKm: roundTo(totals.distanceMeters / 1000, 1),
      durationText: formatDuration(effectiveDurationSeconds),
      distanceText: roundTo(totals.distanceMeters / 1000, 1).toFixed(1) + " km",
      durationSeconds: effectiveDurationSeconds,
      distanceMeters: totals.distanceMeters,
      strokeColor: routeConfig.strokeColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      path: (route.overview_path || []).map(function toLatLng(point) {
        return {
          lat: point.lat(),
          lng: point.lng()
        };
      })
    };
  }

  function formatDuration(seconds) {
    var totalMinutes = Math.max(1, Math.round(seconds / 60));
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;

    if (!hours) {
      return totalMinutes + " min";
    }

    if (!minutes) {
      return hours + " hr";
    }

    return hours + " hr " + minutes + " min";
  }

  function roundTo(value, digits) {
    var factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  global.CommuteCheckerRouteService = {
    createRouteService: createRouteService
  };
})(window);
