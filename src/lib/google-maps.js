import { Loader } from "@googlemaps/js-api-loader";
import { APP_CONFIG } from "./config";
import { formatDistance, formatDuration } from "./formatters";

let mapsPromise;
let routeClassPromise;
let markerClassPromise;

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

    // 載入失敗時清除快取，允許下次重試
    mapsPromise.catch(() => {
      mapsPromise = null;
    });
  }

  return mapsPromise;
}

export async function loadRouteClass() {
  // 確保 Google Maps 核心已載入，避免 race condition
  await loadGoogleMaps();

  if (!routeClassPromise) {
    routeClassPromise = google.maps.importLibrary("routes").then((lib) => lib.Route);

    routeClassPromise.catch(() => {
      routeClassPromise = null;
    });
  }
  return routeClassPromise;
}

export async function loadMarkerClasses() {
  // 確保 Google Maps 核心已載入，避免 race condition
  await loadGoogleMaps();

  if (!markerClassPromise) {
    markerClassPromise = google.maps.importLibrary("marker");

    markerClassPromise.catch(() => {
      markerClassPromise = null;
    });
  }
  return markerClassPromise;
}

export function buildRoutesRequest(routeConfig) {
  const request = {
    origin: normalizeLocation(routeConfig.origin),
    destination: normalizeLocation(routeConfig.destination),
    travelMode: "DRIVING",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    fields: ["legs", "distanceMeters", "durationMillis", "staticDurationMillis", "path"],
    language: APP_CONFIG.googleMapsLanguage,
    region: APP_CONFIG.googleMapsRegion
  };

  if (routeConfig.waypoints?.length) {
    request.intermediates = routeConfig.waypoints
      .filter((wp) => wp && wp.location)
      .map((wp) => normalizeLocation(wp.location));
  }

  return request;
}

/**
 * Normalize a location value for Route.computeRoutes().
 * Accepts: address string, {lat, lng} object, or pass-through.
 */
function normalizeLocation(location) {
  if (typeof location === "string") {
    return location;
  }
  if (location && typeof location === "object" && typeof location.lat === "number") {
    return { lat: location.lat, lng: location.lng };
  }
  return location;
}

export function normalizeRouteFromResponse(routeConfig, route, index) {
  const firstLeg = route.legs?.[0];
  const lastLeg = route.legs?.[route.legs.length - 1];

  const totalDistanceMeters = route.distanceMeters || 0;
  const effectiveDurationMs = route.durationMillis || route.staticDurationMillis || 0;
  const effectiveDurationSeconds = Math.round(effectiveDurationMs / 1000);

  const path = route.path ? route.path.map((point) => extractLatLng(point)) : [];

  const startLoc = firstLeg?.startLocation?.latLng || firstLeg?.startLocation;
  const endLoc = lastLeg?.endLocation?.latLng || lastLeg?.endLocation;

  return {
    id: `${routeConfig.name}-${index}`,
    name: routeConfig.name,
    label: routeConfig.label || routeConfig.name,
    strokeColor: routeConfig.strokeColor || "#336dff",
    durationSeconds: effectiveDurationSeconds,
    distanceMeters: totalDistanceMeters,
    durationText: formatDuration(effectiveDurationSeconds),
    distanceText: formatDistance(totalDistanceMeters),
    durationMinutes: Math.max(1, Math.round(effectiveDurationSeconds / 60)),
    originPosition: startLoc ? extractLatLng(startLoc) : path[0] || null,
    destinationPosition: endLoc ? extractLatLng(endLoc) : path[path.length - 1] || null,
    path
  };
}

/**
 * 從各種 Google Maps 座標格式中統一提取 {lat, lng}。
 * 支援：LatLng 物件（方法）、{lat, lng} 純物件、{latitude, longitude} 格式。
 */
function extractLatLng(loc) {
  if (!loc) return null;
  const lat = typeof loc.lat === "function" ? loc.lat() : (loc.lat ?? loc.latitude);
  const lng = typeof loc.lng === "function" ? loc.lng() : (loc.lng ?? loc.longitude);
  return { lat, lng };
}
