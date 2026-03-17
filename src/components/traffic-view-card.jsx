import { MapPinned } from "lucide-react";
import { useEffect, useRef } from "react";
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

export function TrafficViewCard({ googleMaps, view }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accentColor = view.accentColor || "#336dff";

  useEffect(() => {
    if (!googleMaps || !mapElementRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new googleMaps.Map(mapElementRef.current, {
      center: view.center,
      zoom: view.zoom || 13,
      styles: MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false
    });

    const trafficLayer = new googleMaps.TrafficLayer();
    trafficLayer.setMap(mapRef.current);
  }, [googleMaps, view]);

  useEffect(() => {
    if (!googleMaps || !mapRef.current || !view) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    markerRef.current = new googleMaps.Marker({
      map: mapRef.current,
      position: view.center,
      title: view.name,
      icon: {
        path: googleMaps.SymbolPath.CIRCLE,
        fillColor: accentColor,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 8
      }
    });

    mapRef.current.setCenter(view.center);
    mapRef.current.setZoom(view.zoom || 13);
  }, [googleMaps, view]);

  return (
    <Card className="border-transparent">
      <CardContent className="space-y-4 p-4">
        <div
          className="rounded-[24px] border bg-slate-50/70 p-4"
          style={{ borderColor: `${accentColor}33` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {view.label}
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">
                {view.name}
              </h3>
            </div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
              style={{ backgroundColor: accentColor }}
            >
              交通觀測
            </span>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/80 bg-white/80 p-3 text-sm text-slate-600">
            中心點：{view.center.lat.toFixed(4)}, {view.center.lng.toFixed(4)}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
          <div ref={mapElementRef} className="h-[400px] w-full" />

          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
              style={{ backgroundColor: accentColor }}
            >
              {view.name}
            </span>
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
