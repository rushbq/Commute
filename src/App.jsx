import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { AppHeader } from "./components/app-header";
import { ModuleSwitcher } from "./components/module-switcher";
import { SettingsPage } from "./components/settings-page";
import { TrafficViewCard } from "./components/traffic-view-card";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { APP_CONFIG } from "./lib/config";
import { useCommuteChecker } from "./hooks/use-commute-checker";
import { ThemeContext, useThemeProvider } from "./hooks/use-theme";
import { useSwUpdate } from "./hooks/use-sw-update";

export default function App() {
  const themeValue = useThemeProvider();
  const {
    googleMaps,
    settings,
    activeModule,
    modules,
    activeModuleId,
    trafficViewResults,
    isRefreshing,
    lastUpdated,
    refreshRoutes,
    selectModule,
    saveSettings,
    resetSettingsToDefaults,
    clearAllAndReload
  } = useCommuteChecker();
  const { updateAvailable, applyUpdate } = useSwUpdate();
  const [page, setPage] = useState(resolvePageFromHash());

  useEffect(() => {
    function handleHashChange() {
      setPage(resolvePageFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen">
        {/* 有新版本時顯示頂部更新橫幅 */}
        {updateAvailable ? (
          <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-brand-500 px-4 py-2.5 text-white shadow-md">
            <p className="text-sm font-semibold">🆕 有新版本可用</p>
            <Button
              size="sm"
              className="shrink-0 border-white/30 bg-white/20 text-white hover:bg-white/30"
              onClick={applyUpdate}
            >
              <RefreshCw className="h-4 w-4" />
              立即更新
            </Button>
          </div>
        ) : null}

        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          {page === "settings" ? (
            <SettingsPage
              settings={settings}
              onSave={saveSettings}
              onResetToDefaults={resetSettingsToDefaults}
              onClearAllAndReload={clearAllAndReload}
              homeHref="#/"
            />
          ) : (
            <>
              <AppHeader
                title={APP_CONFIG.appTitle}
                subtitle={APP_CONFIG.appSubtitle}
                onRefresh={refreshRoutes}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
                settingsHref="#/settings"
              />

              {modules.length > 1 ? (
                <Card>
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
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
              ) : null}

              <main className="grid gap-4">
                <section className="grid gap-4 lg:grid-cols-2">
                  {trafficViewResults.length ? (
                    trafficViewResults.map((view) => (
                      <TrafficViewCard key={view.id} googleMaps={googleMaps} view={view} />
                    ))
                  ) : (
                    <Card className="lg:col-span-2">
                      <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">
                        正在載入觀測模組的交通地圖⋯
                      </CardContent>
                    </Card>
                  )}
                </section>
              </main>
            </>
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

function resolvePageFromHash() {
  return window.location.hash === "#/settings" ? "settings" : "home";
}
