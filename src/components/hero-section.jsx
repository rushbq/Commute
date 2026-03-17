import { ArrowUpRight, RefreshCw, ShieldCheck, TimerReset, TrafficCone } from "lucide-react";
import { formatCountdown, formatDateTime } from "../lib/formatters";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function HeroSection({
  recommendedRoute,
  status,
  countdownSeconds,
  lastUpdated,
  onRefresh,
  isRefreshing,
  canInstall,
  onInstall
}) {
  return (
    <Card className="overflow-hidden border-brand-100 bg-hero-grid p-5 sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">手機優先</Badge>
            <Badge variant="neutral">每 60 秒刷新</Badge>
            <Badge variant={status.tone === "success" ? "success" : "neutral"}>Google Maps 即時交通</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canInstall ? (
              <Button variant="secondary" size="sm" onClick={onInstall}>
                <ArrowUpRight className="h-4 w-4" />
                加入主畫面
              </Button>
            ) : null}
            <Button size="sm" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              立即更新
            </Button>
          </div>
        </div>

        <div className="max-w-3xl space-y-3">
          <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-brand-600">
            Commute SaaS Dashboard
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            通勤路況檢查器
          </h1>
          <p className="max-w-2xl text-balance text-sm leading-7 text-slate-600 sm:text-base">
            用最短的閱讀成本，直接比較兩條固定通勤路線。你只要打開首頁，就能看到當下建議路線、預估時間與即時交通圖層。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={TrafficCone}
            label="目前建議"
            value={recommendedRoute?.name || "載入中"}
            hint={recommendedRoute?.label || "比對兩條固定通勤路線"}
          />
          <MetricTile
            icon={TimerReset}
            label="下次更新"
            value={formatCountdown(countdownSeconds)}
            hint="自動同步最新交通估算"
          />
          <MetricTile
            icon={ShieldCheck}
            label="系統狀態"
            value={status.message}
            hint="前端靜態站，建議搭配 Referrer restriction"
          />
          <MetricTile
            icon={RefreshCw}
            label="最近更新"
            value={formatDateTime(lastUpdated)}
            hint="資料來自 Google Maps Directions"
          />
        </div>
      </div>
    </Card>
  );
}

function MetricTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-brand-50 p-2 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}
