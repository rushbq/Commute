import { RefreshCw, Settings2 } from "lucide-react";
import { Button } from "./ui/button";

export function AppHeader({ title, onRefresh, isRefreshing, settingsHref }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Commute Checker</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" asChild>
          <a href={settingsHref}>
            <Settings2 className="h-4 w-4" />
            設定
          </a>
        </Button>
        <Button size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          更新
        </Button>
      </div>
    </header>
  );
}
