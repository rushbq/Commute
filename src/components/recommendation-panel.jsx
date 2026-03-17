import { Clock3, Route, TriangleAlert } from "lucide-react";
import { formatDateTime } from "../lib/formatters";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export function RecommendationPanel({
  activeModule,
  recommendedRoute,
  comparisonDeltaMinutes,
  status,
  error,
  lastUpdated
}) {
  return (
    <Card className="overflow-hidden border-brand-100 bg-hero-grid">
      <CardContent className="p-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand">{activeModule?.name || "通勤模組"}</Badge>
              <Badge variant={status.tone === "success" ? "success" : "neutral"}>
                {status.tone === "success" ? "已更新" : "處理中"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">最近更新：{formatDateTime(lastUpdated)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">建議路線</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
              {recommendedRoute?.name || "載入中"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {recommendedRoute?.label || "正在讀取 Google Maps 路線資料"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={Clock3} label="行車時間" value={recommendedRoute?.durationText || "--"} />
            <Metric icon={Route} label="距離" value={recommendedRoute?.distanceText || "--"} />
          </div>

          <div className="rounded-[22px] border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {comparisonDeltaMinutes > 0
                ? `比另一條快 ${comparisonDeltaMinutes} 分鐘`
                : "兩條路線目前差異不大"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{status.message}</p>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
              <p className="text-sm leading-6 text-slate-700">{error}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/80 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
