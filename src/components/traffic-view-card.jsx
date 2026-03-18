import { MapPinned, Navigation } from "lucide-react";
import { useEffect, useRef } from "react";
import { APP_CONFIG } from "../lib/config";
import { loadMarkerClasses } from "../lib/google-maps";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export function TrafficViewCard({ googleMaps, view }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const accentColor = view.accentColor || "#336dff";
  const navigationHref = buildGoogleMapsNavigationHref(view);

  // 初始化地圖
  useEffect(() => {
    if (!googleMaps || !mapElementRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new googleMaps.Map(mapElementRef.current, {
      center: view.center,
      zoom: view.zoom || 14,
      mapId: APP_CONFIG.googleMapsMapId,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false
    });

    trafficLayerRef.current = new googleMaps.TrafficLayer();
    trafficLayerRef.current.setMap(mapRef.current);

    // 元件卸載時清除地圖資源
    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
        trafficLayerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, [googleMaps, view]);

  // 更新 marker 與視角
  useEffect(() => {
    if (!googleMaps || !mapRef.current || !view) {
      return;
    }

    let isMounted = true;

    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    loadMarkerClasses().then(({ AdvancedMarkerElement }) => {
      // 非同步完成時若元件已卸載，不執行 DOM 操作
      if (!isMounted || !mapRef.current) return;

      const dot = document.createElement("div");
      dot.style.width = "16px";
      dot.style.height = "16px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = accentColor;
      dot.style.border = "2px solid #ffffff";
      dot.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";

      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: view.center,
        title: view.name,
        content: dot
      });
    });

    mapRef.current.setCenter(view.center);
    mapRef.current.setZoom(view.zoom || 14);

    return () => {
      isMounted = false;
    };
  }, [googleMaps, view]);

  return (
    <Card className="border-transparent">
      <CardContent className="space-y-4 p-4">
        <div
          className="rounded-[24px] border bg-slate-50/70 p-4 dark:bg-slate-800/70"
          style={{ borderColor: `${accentColor}33` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {view.label}
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                {view.name}
              </h3>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <a href={navigationHref} target="_blank" rel="noreferrer">
                <Navigation className="h-4 w-4" />
                導航
              </a>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
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

function buildGoogleMapsNavigationHref(view) {
  const lat = Number(view?.center?.lat);
  const lng = Number(view?.center?.lng);
  const destination = `${lat},${lng}`;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving&dir_action=navigate`;
}
