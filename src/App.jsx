import { AlertTriangle, MapPinned } from "lucide-react";
import { HeroSection } from "./components/hero-section";
import { LiveMapCard } from "./components/live-map-card";
import { RecommendationPanel } from "./components/recommendation-panel";
import { RouteComparisonPanel } from "./components/route-comparison-panel";
import { Badge } from "./components/ui/badge";
import { Card, CardContent } from "./components/ui/card";
import { useCommuteChecker } from "./hooks/use-commute-checker";
import { useInstallPrompt } from "./hooks/use-install-prompt";

export default function App() {
  const {
    googleMaps,
    routesConfig,
    routeResults,
    recommendedRoute,
    comparisonDeltaMinutes,
    status,
    error,
    isBooting,
    isRefreshing,
    lastUpdated,
    countdownSeconds,
    refreshRoutes
  } = useCommuteChecker();
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <HeroSection
          recommendedRoute={recommendedRoute}
          status={status}
          countdownSeconds={countdownSeconds}
          lastUpdated={lastUpdated}
          onRefresh={refreshRoutes}
          isRefreshing={isRefreshing}
          canInstall={canInstall}
          onInstall={promptInstall}
        />

        <main className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <RecommendationPanel
              recommendedRoute={recommendedRoute}
              comparisonDeltaMinutes={comparisonDeltaMinutes}
              error={error}
            />

            <RouteComparisonPanel routes={routeResults} isRefreshing={isRefreshing} />

            <SecurityNotice />
          </div>

          <LiveMapCard
            googleMaps={googleMaps}
            center={routesConfig?.center || { lat: 25.0478, lng: 121.5319 }}
            zoom={routesConfig?.mapZoom || 14}
            routes={routeResults}
            statusMessage={status.message}
          />
        </main>

        <footer className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 text-sm text-slate-500 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-brand-500" />
            <span>以手機優先設計，並可部署為 GitHub Pages 靜態站。</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isBooting ? "warning" : "neutral"}>
              {isBooting ? "初始化中" : "系統已就緒"}
            </Badge>
            <Badge variant={error ? "warning" : "success"}>{error ? "需要注意" : "運作正常"}</Badge>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SecurityNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardContent className="flex items-start gap-3 p-5 sm:p-6">
        <div className="rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">關於 API key 安全性</p>
          <p className="text-sm leading-6 text-slate-600">
            React、Tailwind 或 shadcn/ui 只能改善結構與維護性，無法讓純前端靜態站的 Google
            Maps API key 真正隱藏。這個版本改為使用環境變數 `VITE_GOOGLE_MAPS_API_KEY`
            管理，不把 key 寫死在程式碼中；若要真正隱藏，仍需後端代理或 serverless。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
