import { ArrowUpDown, RefreshCw } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { RouteCard } from "./route-card";

export function RouteComparisonPanel({ routes, isRefreshing }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">路線比較</Badge>
              <Badge variant={isRefreshing ? "brand" : "neutral"}>
                {isRefreshing ? "同步中" : "已同步"}
              </Badge>
            </div>
            <CardTitle>兩條固定通勤路線</CardTitle>
            <CardDescription>
              用相同起點與終點做比較，差異主要來自指定經過道路與當下交通狀況。
            </CardDescription>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowUpDown className="h-4 w-4" />}
              持續監控
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
