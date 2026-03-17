import { RefreshCw, Settings2 } from "lucide-react";
import { formatTimeCompact } from "../lib/formatters";
import { Button } from "./ui/button";

export function AppHeader({ title, subtitle, onRefresh, isRefreshing, lastUpdated, settingsHref }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">{subtitle}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {title}
          {lastUpdated instanceof Date ? (
            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
              {formatTimeCompact(lastUpdated)}
            </span>
          ) : null}
        </h1>
      </div>

      <div className="grid grid-cols-[2fr_4fr] items-center gap-2 sm:flex">
        <Button variant="secondary" size="sm" className="px-2.5 sm:px-4" asChild>
          <a href={settingsHref}>
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">設定</span>
          </a>
        </Button>
        <Button size="sm" className="px-3 sm:px-4" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">更新</span>
        </Button>
      </div>
    </header>
  );
}
