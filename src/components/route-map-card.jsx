import { useEffect, useRef } from "react";
import { MapPinned } from "lucide-react";
import { APP_CONFIG } from "../lib/config";
import { loadMarkerClasses } from "../lib/google-maps";
import { RouteCard } from "./route-card";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export function RouteMapCard({ googleMaps, route, zoom }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!googleMaps || !mapElementRef.current || mapRef.current) {
      return;
    }

    const initialCenter = route?.originPosition || route?.path?.[0] || { lat: 25.0478, lng: 121.5319 };
    mapRef.current = new googleMaps.Map(mapElementRef.current, {
      center: initialCenter,
      zoom: zoom || 14,
      mapId: APP_CONFIG.googleMapsMapId,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false
    });

    const trafficLayer = new googleMaps.TrafficLayer();
    trafficLayer.setMap(mapRef.current);
  }, [googleMaps, route, zoom]);

  useEffect(() => {
    if (!googleMaps || !mapRef.current || !route) {
      return;
    }

    clearArtifacts();

    if (route.path?.length) {
      polylineRef.current = new googleMaps.Polyline({
        map: mapRef.current,
        path: route.path,
        strokeColor: route.strokeColor,
        strokeOpacity: route.isRecommended ? 0.98 : 0.82,
        strokeWeight: route.isRecommended ? 7 : 5
      });

      const originPosition = route.originPosition || route.path[0];
      const destinationPosition = route.destinationPosition || route.path[route.path.length - 1];

      loadMarkerClasses().then(({ AdvancedMarkerElement, PinElement }) => {
        if (!mapRef.current) return;

        const originPin = new PinElement({
          glyphText: "起",
          glyphColor: "#ffffff",
          background: "#ef4444",
          borderColor: "#dc2626"
        });

        const originMarker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: originPosition,
          title: "起點",
          content: originPin
        });
        markersRef.current.push(originMarker);

        const destPin = new PinElement({
          glyphText: "訖",
          glyphColor: "#ffffff",
          background: "#3b82f6",
          borderColor: "#2563eb"
        });

        const destMarker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: destinationPosition,
          title: "終點",
          content: destPin
        });
        markersRef.current.push(destMarker);
      });

      mapRef.current.setCenter(originPosition);
      mapRef.current.setZoom(zoom || 14);
    }
  }, [googleMaps, route, zoom]);

  function clearArtifacts() {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <RouteCard route={route} />

        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
          <div ref={mapElementRef} className="h-[400px] w-full" />

          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant="brand">{route.name}</Badge>
          </div>

          {!googleMaps ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-100/80 p-6 text-center dark:bg-slate-900/80">
              <div className="max-w-xs rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
                <MapPinned className="mx-auto h-8 w-8 text-brand-500" />
                <p className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">地圖載入中</p>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
