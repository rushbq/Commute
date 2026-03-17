import { Card, CardContent } from "./ui/card";
import { RouteCard } from "./route-card";

export function RouteComparisonPanel({ routes }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">路線比較</p>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-slate-950">Route A / B</h3>
        </div>

        {routes.length ? (
          <div className="grid gap-3">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            正在載入這個通勤模組的兩條路線結果。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
