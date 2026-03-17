import { ArrowRight, Gauge, Route, TimerReset } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export function RecommendationPanel({ recommendedRoute, comparisonDeltaMinutes, error }) {
  return (
    <Card className="border-brand-100">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">建議摘要</Badge>
          {recommendedRoute ? <Badge variant="success">目前最快</Badge> : null}
        </div>
        <CardTitle>先看答案，再看細節</CardTitle>
        <CardDescription>
          這一塊只回答一件事：現在應該走哪一條。若兩條路差異很小，也能一眼看出來。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[24px] border border-brand-100 bg-brand-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Recommended Route</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                {recommendedRoute?.name || "載入中"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {recommendedRoute?.label || "等待 Google Maps 路線結果"}
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryMetric icon={TimerReset} label="預估時間" value={recommendedRoute?.durationText || "--"} />
          <SummaryMetric icon={Route} label="路線距離" value={recommendedRoute?.distanceText || "--"} />
        </div>

        <Separator />

        <div className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-2xl bg-white p-2 text-slate-700 shadow-sm">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {comparisonDeltaMinutes > 0
                ? `比另一條路快 ${comparisonDeltaMinutes} 分鐘`
                : "兩條路線目前差異不大"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {error
                ? `目前有警告：${error}`
                : "建議值會每分鐘更新一次，並同步反映即時交通估算。"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
