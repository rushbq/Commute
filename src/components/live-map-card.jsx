import { useEffect, useRef } from "react";
import { MapPinned } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f8fafc" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dbeafe" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] }
];

export function LiveMapCard({ googleMaps, center, zoom, routes }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!googleMaps || !mapElementRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new googleMaps.Map(mapElementRef.current, {
      center,
      zoom,
      styles: MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false
    });

    const trafficLayer = new googleMaps.TrafficLayer();
    trafficLayer.setMap(mapRef.current);
  }, [googleMaps, center, zoom]);

  useEffect(() => {
    if (!googleMaps || !mapRef.current) {
      return;
    }

    clearMapArtifacts();

    routes.forEach((route) => {
      if (!route.path?.length) {
        return;
      }

      const polyline = new googleMaps.Polyline({
        map: mapRef.current,
        path: route.path,
        strokeColor: route.strokeColor,
        strokeOpacity: route.isRecommended ? 0.98 : 0.72,
        strokeWeight: route.isRecommended ? 7 : 5,
        zIndex: route.isRecommended ? 10 : 5
      });

      polylinesRef.current.push(polyline);
    });

    const firstRoute = routes.find((route) => route.path?.length);
    if (firstRoute) {
      markersRef.current.push(
        new googleMaps.Marker({
          map: mapRef.current,
          position: firstRoute.path[0],
          label: "起",
          title: "起點"
        })
      );

      markersRef.current.push(
        new googleMaps.Marker({
          map: mapRef.current,
          position: firstRoute.path[firstRoute.path.length - 1],
          label: "訖",
          title: "終點"
        })
      );
    }

    mapRef.current.setCenter(center);
    mapRef.current.setZoom(zoom);
  }, [googleMaps, routes, center, zoom]);

  function clearMapArtifacts() {
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
          <div ref={mapElementRef} className="h-[50svh] min-h-[360px] w-full lg:h-[640px]" />

          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant="brand">即時交通</Badge>
            <Badge variant="neutral">雙路線</Badge>
          </div>

          {!googleMaps ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-100/80 p-6 text-center">
              <div className="max-w-xs rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-sm">
                <MapPinned className="mx-auto h-8 w-8 text-brand-500" />
                <p className="mt-4 text-base font-semibold text-slate-950">地圖載入中</p>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
