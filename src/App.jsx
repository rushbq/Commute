import { useEffect, useState } from "react";
import { AppHeader } from "./components/app-header";
import { FeatureModeSwitcher } from "./components/feature-mode-switcher";
import { ModuleSwitcher } from "./components/module-switcher";
import { RouteMapCard } from "./components/route-map-card";
import { SettingsPage } from "./components/settings-page";
import { TrafficViewCard } from "./components/traffic-view-card";
import { Badge } from "./components/ui/badge";
import { Card, CardContent } from "./components/ui/card";
import { useCommuteChecker } from "./hooks/use-commute-checker";
import { formatDateTime } from "./lib/formatters";

export default function App() {
  const {
    googleMaps,
    settings,
    activeModule,
    activeMode,
    modules,
    availableModes,
    activeModuleId,
    routeResults,
    trafficViewResults,
    error,
    isBooting,
    isRefreshing,
    lastUpdated,
    refreshRoutes,
    selectModule,
    selectMode,
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
                    <p className="text-sm font-semibold text-slate-900">功能模式與通勤模組</p>
                    <p className="mt-1 text-sm text-slate-600">
                      預設提供上班與下班，可在設定頁調整。最近更新：{formatDateTime(lastUpdated)}
                    </p>
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

                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    功能模式
                  </p>
                  <FeatureModeSwitcher
                    availableModes={availableModes}
                    activeMode={activeMode}
                    onSelect={selectMode}
                  />
                </div>

                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    模組切換
                  </p>
                <ModuleSwitcher
                  modules={modules}
                  activeModuleId={activeModuleId}
                  onSelect={selectModule}
                />
                </div>
              </CardContent>
            </Card>

            <main className="grid gap-4">
              <section className="grid gap-4 lg:grid-cols-2">
                {activeMode === "traffic" ? (
                  trafficViewResults.length ? (
                    trafficViewResults.map((view) => (
                      <TrafficViewCard key={view.id} googleMaps={googleMaps} view={view} />
                    ))
                  ) : (
                    <Card className="lg:col-span-2">
                      <CardContent className="p-6 text-sm text-slate-500">
                        正在載入這個觀測模組的兩張交通地圖。
                      </CardContent>
                    </Card>
                  )
                ) : routeResults.length ? (
                  routeResults.map((route) => (
                    <RouteMapCard
                      key={route.id}
                      googleMaps={googleMaps}
                      route={route}
                      zoom={activeModule?.mapZoom || 14}
                    />
                  ))
                ) : (
                  <Card className="lg:col-span-2">
                    <CardContent className="p-6 text-sm text-slate-500">
                      正在載入這個通勤模組的兩條路線與地圖。
                    </CardContent>
                  </Card>
                )}
              </section>
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
