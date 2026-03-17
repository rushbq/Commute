import { Clock3, Navigation, Route } from "lucide-react";
import { Badge } from "./ui/badge";

export function RouteCard({ route }) {
  return (
    <article
      className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
      style={{
        backgroundImage: `linear-gradient(135deg, ${hexToRgba(route.strokeColor, route.isRecommended ? 0.16 : 0.08)}, rgba(255,255,255,0.5))`
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5 rounded-full"
        style={{ backgroundColor: route.strokeColor }}
      />

      <div className="ml-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{route.label}</p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {route.name}
          </h3>
        </div>
        {route.isRecommended ? <Badge variant="success">最快</Badge> : <Badge variant="neutral">候選</Badge>}
      </div>

      <div className="ml-2 mt-5 grid gap-3 sm:grid-cols-2">
        <MetricRow icon={Clock3} label="行車時間" value={route.durationText} />
        <MetricRow icon={Route} label="距離" value={route.distanceText} />
      </div>

      <div className="ml-2 mt-4 flex items-start gap-3 rounded-[20px] border border-white/80 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/80">
        <Navigation className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          途經策略：<span className="font-medium text-slate-900 dark:text-slate-200">{route.label}</span>
        </p>
      </div>
    </article>
  );
}

function MetricRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/80">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-50">{value}</p>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const safeHex = hex.replace("#", "");
  const bigint = Number.parseInt(safeHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
