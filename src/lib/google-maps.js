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
  }

  return mapsPromise;
}

export async function loadRouteClass() {
  if (!routeClassPromise) {
    routeClassPromise = google.maps.importLibrary("routes").then((lib) => lib.Route);
  }
  return routeClassPromise;
}

export async function loadMarkerClasses() {
  if (!markerClassPromise) {
    markerClassPromise = google.maps.importLibrary("marker");
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

  const path = route.path
    ? route.path.map((point) => ({
        lat: typeof point.lat === "function" ? point.lat() : point.lat,
        lng: typeof point.lng === "function" ? point.lng() : point.lng
      }))
    : [];

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
    originPosition: startLoc
      ? {
          lat: typeof startLoc.lat === "function" ? startLoc.lat() : (startLoc.latitude ?? startLoc.lat),
          lng: typeof startLoc.lng === "function" ? startLoc.lng() : (startLoc.longitude ?? startLoc.lng)
        }
      : path[0] || null,
    destinationPosition: endLoc
      ? {
          lat: typeof endLoc.lat === "function" ? endLoc.lat() : (endLoc.latitude ?? endLoc.lat),
          lng: typeof endLoc.lng === "function" ? endLoc.lng() : (endLoc.longitude ?? endLoc.lng)
        }
      : path[path.length - 1] || null,
    path
  };
}
