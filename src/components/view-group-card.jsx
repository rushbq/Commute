import { MapPinned, Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { APP_CONFIG } from "../lib/config";
import { loadMarkerClasses } from "../lib/google-maps";
import { getSubViewColor } from "../services/settings-validator";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

/**
 * 首頁觀測群組卡片。
 * 顯示群組名、導航鈕、地圖（含交通圖層）、子觀測點快速切換列。
 *
 * @param {{
 *   googleMaps: object,
 *   viewGroup: { id: string, name: string, zoom: number, views: Array },
 * }} props
 */
export function ViewGroupCard({ googleMaps, viewGroup }) {
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const trafficLayerRef = useRef(null);

  const views = viewGroup.views || [];
  const activeView = views[activeViewIndex] || views[0];
  const showSwitcher = views.length > 1;

  // 初始化地圖（只執行一次）
  useEffect(() => {
    if (!googleMaps || !mapElementRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new googleMaps.Map(mapElementRef.current, {
      center: activeView?.center,
      zoom: viewGroup.zoom || 14,
      mapId: APP_CONFIG.googleMapsMapId,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false
    });

    trafficLayerRef.current = new googleMaps.TrafficLayer();
    trafficLayerRef.current.setMap(mapRef.current);

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
  }, [googleMaps]);

  // 更新 marker 與視角（切換子觀測點時）
  useEffect(() => {
    if (!googleMaps || !mapRef.current || !activeView) {
      return;
    }

    let isMounted = true;

    // 清除舊 marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    const color = getSubViewColor(activeViewIndex);

    loadMarkerClasses().then(({ AdvancedMarkerElement }) => {
      if (!isMounted || !mapRef.current) return;

      const dot = document.createElement("div");
      dot.style.width = "16px";
      dot.style.height = "16px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = color;
      dot.style.border = "2px solid #ffffff";
      dot.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";

      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: activeView.center,
        title: activeView.name,
        content: dot
      });
    });

    mapRef.current.setCenter(activeView.center);
    mapRef.current.setZoom(viewGroup.zoom || 14);

    return () => {
      isMounted = false;
    };
  }, [googleMaps, activeViewIndex, viewGroup]);

  return (
    <Card className="border-transparent">
      <CardContent className="space-y-4 p-4">
        {/* 群組標題 + 導航鈕 */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {viewGroup.name}
          </h3>
          {viewGroup.navigationUrl ? (
            <Button variant="secondary" size="sm" asChild>
              <a href={viewGroup.navigationUrl} target="_blank" rel="noreferrer">
                <Navigation className="h-4 w-4" />
                導航
              </a>
            </Button>
          ) : null}
        </div>

        {/* 地圖區 */}
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
          <div ref={mapElementRef} className="h-[400px] w-full" />

          {/* 左上觀測點名稱 */}
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
              style={{ backgroundColor: getSubViewColor(activeViewIndex) }}
            >
              {activeView?.name}
            </span>
          </div>

          {/* 載入中遮罩 */}
          {!googleMaps ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-100/80 p-6 text-center dark:bg-slate-900/80">
              <div className="max-w-xs rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
                <MapPinned className="mx-auto h-8 w-8 text-brand-500" />
                <p className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">地圖載入中</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* 子觀測點快速切換列 */}
        {showSwitcher ? (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${views.length}, 1fr)` }}
          >
            {views.map((view, index) => {
              const isActive = index === activeViewIndex;
              const color = getSubViewColor(index);

              return (
                <button
                  key={view.id || index}
                  type="button"
                  onClick={() => setActiveViewIndex(index)}
                  className={`flex items-center justify-center rounded-2xl border-2 px-2 py-3 text-xs font-semibold transition-colors ${
                    isActive
                      ? "text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                  style={
                    isActive
                      ? { borderColor: color, backgroundColor: color }
                      : undefined
                  }
                >
                  {view.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
