import { Trash2 } from "lucide-react";
import { ensureTrafficViews, SCHEDULE_OPTIONS, getModulePaletteColor } from "../services/settings-validator";
import { TrafficViewEditor } from "./traffic-view-editor";
import { Input } from "./ui/input";

export function ModuleEditor({
  moduleItem,
  onChange,
  onRemove,
  allowRemove,
  moduleIndex
}) {
  const palette = getModulePaletteColor(moduleIndex);

  return (
    <div
      className="min-w-0 overflow-hidden rounded-[24px] border-2 bg-white dark:bg-slate-900"
      style={{ borderColor: palette.border }}
    >
      {/* 色彩標頭 */}
      <div
        className="flex flex-col gap-3 px-4 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between"
        style={{ backgroundColor: palette.bg }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: palette.border }}
          >
            {moduleIndex + 1}
          </span>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: palette.text }}
            >
              觀測模組 {moduleIndex + 1}
            </p>
            <p className="mt-0.5 break-words text-lg font-semibold text-slate-950 dark:text-slate-50">
              {moduleItem.name || "未命名模組"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {allowRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* 模組設定區 */}
      <div className="grid gap-3 p-4">
        <Input
          label="模組名稱"
          required
          value={moduleItem.name}
          onChange={(value) => onChange((current) => ({ ...current, name: value }))}
        />

        {/* 排程設定 */}
        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            首頁排程
          </span>
          <div className="flex gap-2">
            {SCHEDULE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({ ...current, schedule: option.value }))
                }
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  (moduleItem.schedule || "always") === option.value
                    ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            白天 = 05:00–18:00；夜覽 = 18:00–05:00；全時段 = 任何時段皆可做為預設。
          </p>
        </div>

        {/* 觀測點設定 */}
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">交通觀測點設定</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            每個觀測點可獨立設定中心座標與地圖縮放等級。
          </p>
        </div>

        {ensureTrafficViews(moduleItem.views).map((view, viewIndex) => (
          <TrafficViewEditor
            key={`${moduleItem.id}-view-${viewIndex}`}
            view={view}
            viewIndex={viewIndex}
            moduleColor={palette.border}
            onChange={(updater) =>
              onChange((current) => ({
                ...current,
                views: ensureTrafficViews(current.views).map((item, index) =>
                  index === viewIndex ? updater(item) : item
                )
              }))
            }
          />
        ))}
      </div>
    </div>
  );
}
