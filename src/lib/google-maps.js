import { Loader } from "@googlemaps/js-api-loader";
import { APP_CONFIG } from "./config";
import { formatDistance, formatDuration } from "./formatters";

let mapsPromise;

export async function loadGoogleMaps() {
  if (!APP_CONFIG.googleMapsApiKey) {
    throw new Error(
      "尚未設定 Google Maps API key。請在 .env 或部署環境中設定 VITE_GOOGLE_MAPS_API_KEY。"
    );
  }

  if (!mapsPromise) {
    const loader = new Loader({
      apiKey: APP_CONFIG.googleMapsApiKey,
      version: "weekly",
      language: APP_CONFIG.googleMapsLanguage,
      region: APP_CONFIG.googleMapsRegion
    });

    mapsPromise = loader.load().then(() => window.google.maps);
  }

  return mapsPromise;
}

export function buildDirectionsRequest(routeConfig, maps) {
  const travelMode = maps.TravelMode[routeConfig.travelMode || "DRIVING"] || maps.TravelMode.DRIVING;

  const request = {
    origin: normalizeLocation(routeConfig.origin),
    destination: normalizeLocation(routeConfig.destination),
    travelMode,
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

export function normalizeRoute(routeConfig, route, index) {
  const totals = route.legs.reduce(
    (accumulator, leg) => {
      accumulator.distanceMeters += leg.distance?.value ?? 0;
      accumulator.durationSeconds += leg.duration?.value ?? 0;
      accumulator.durationInTrafficSeconds += leg.duration_in_traffic?.value ?? 0;
      return accumulator;
    },
    {
      distanceMeters: 0,
      durationSeconds: 0,
      durationInTrafficSeconds: 0
    }
  );

  const effectiveDurationSeconds = totals.durationInTrafficSeconds || totals.durationSeconds;

  return {
    id: `${routeConfig.name}-${index}`,
    name: routeConfig.name,
    label: routeConfig.label || routeConfig.name,
    strokeColor: routeConfig.strokeColor || "#336dff",
    durationSeconds: effectiveDurationSeconds,
    distanceMeters: totals.distanceMeters,
    durationText: formatDuration(effectiveDurationSeconds),
    distanceText: formatDistance(totals.distanceMeters),
    durationMinutes: Math.max(1, Math.round(effectiveDurationSeconds / 60)),
    path: (route.overview_path || []).map((point) => ({
      lat: point.lat(),
      lng: point.lng()
    }))
  };
}

function normalizeLocation(location) {
  if (location && typeof location === "object" && typeof location.lat === "number") {
    return {
      lat: location.lat,
      lng: location.lng
    };
  }

  return location;
}

function normalizeWaypoints(waypoints = []) {
  return waypoints.map((waypoint) => {
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
