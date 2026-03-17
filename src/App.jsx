import { useEffect, useState } from "react";
import { AppHeader } from "./components/app-header";
import { LiveMapCard } from "./components/live-map-card";
import { ModuleSwitcher } from "./components/module-switcher";
import { RecommendationPanel } from "./components/recommendation-panel";
import { RouteComparisonPanel } from "./components/route-comparison-panel";
import { SettingsPage } from "./components/settings-page";
import { Badge } from "./components/ui/badge";
import { Card, CardContent } from "./components/ui/card";
import { useCommuteChecker } from "./hooks/use-commute-checker";

export default function App() {
  const {
    googleMaps,
    settings,
    modules,
    activeModule,
    activeModuleId,
    routeResults,
    recommendedRoute,
    comparisonDeltaMinutes,
    status,
    error,
    isBooting,
    isRefreshing,
    lastUpdated,
    refreshRoutes,
    selectModule,
    saveSettings
  } = useCommuteChecker();
  const [page, setPage] = useState(resolvePageFromHash());

  useEffect(() => {
    function handleHashChange() {
      setPage(resolvePageFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        {page === "settings" ? (
          <SettingsPage settings={settings} onSave={saveSettings} homeHref="#/" />
        ) : (
          <>
            <AppHeader
              title="通勤路況檢查器"
              onRefresh={refreshRoutes}
              isRefreshing={isRefreshing}
              settingsHref="#/settings"
            />

            <Card>
              <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">快速切換通勤模組</p>
                    <p className="mt-1 text-sm text-slate-600">預設提供上班與下班，可在設定頁調整。</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isBooting ? "warning" : "neutral"}>
                      {isBooting ? "初始化中" : "手動更新"}
                    </Badge>
                    <Badge variant={error ? "warning" : "success"}>
                      {error ? "需要注意" : "運作正常"}
                    </Badge>
                  </div>
                </div>

                <ModuleSwitcher
                  modules={modules}
                  activeModuleId={activeModuleId}
                  onSelect={selectModule}
                />
              </CardContent>
            </Card>

            <main className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className="space-y-4">
                <RecommendationPanel
                  activeModule={activeModule}
                  recommendedRoute={recommendedRoute}
                  comparisonDeltaMinutes={comparisonDeltaMinutes}
                  status={status}
                  error={error}
                  lastUpdated={lastUpdated}
                />
                <RouteComparisonPanel routes={routeResults} />
              </div>

              <LiveMapCard
                googleMaps={googleMaps}
                center={activeModule?.center || { lat: 25.0478, lng: 121.5319 }}
                zoom={activeModule?.mapZoom || 14}
                routes={routeResults}
              />
            </main>
          </>
        )}
      </div>
    </div>
  );
}

function resolvePageFromHash() {
  return window.location.hash === "#/settings" ? "settings" : "home";
}
