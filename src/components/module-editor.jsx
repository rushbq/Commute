import { Plus, Trash2 } from "lucide-react";
import { SCHEDULE_OPTIONS, getModulePaletteColor } from "../services/settings-validator";
import { ViewGroupEditor } from "./view-group-editor";
import { PlaceInput } from "./coordinate-input";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function ModuleEditor({
  moduleItem,
  onChange,
  onRemove,
  allowRemove,
  moduleIndex
}) {
  const palette = getModulePaletteColor(moduleIndex);
  const viewGroups = moduleItem.viewGroups || [];

  function updateViewGroup(groupIndex, updater) {
    onChange((current) => ({
      ...current,
      viewGroups: (current.viewGroups || []).map((g, i) =>
        i === groupIndex ? updater(g) : g
      )
    }));
  }

  function removeViewGroup(groupIndex) {
    onChange((current) => ({
      ...current,
      viewGroups: (current.viewGroups || []).filter((_, i) => i !== groupIndex)
    }));
  }

  function addViewGroup() {
    onChange((current) => ({
      ...current,
      viewGroups: [
        ...(current.viewGroups || []),
        {
          name: "",
          zoom: 14,
          views: [{ name: "", center: { lat: "", lng: "" }, isWaypoint: false }]
        }
      ]
    }));
  }

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
      <div className="grid gap-4 p-3 sm:p-4">
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
          <div className="flex flex-wrap gap-2">
            {SCHEDULE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({ ...current, schedule: option.value }))
                }
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  (moduleItem.schedule || "always") === option.value
                    ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* 導航路線設定 */}
        <div className="grid gap-3">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            導航路線
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            設定起點與終點後，首頁每個群組卡片的導航鈕會自動帶入路線。將觀測點設為「途經點」即可加入導航路線。
          </p>

          <PlaceInput
            label="起點"
            value={moduleItem.origin || ""}
            onChange={(value) => onChange((current) => ({ ...current, origin: value }))}
            optional
          />

          <PlaceInput
            label="終點"
            value={moduleItem.destination || ""}
            onChange={(value) => onChange((current) => ({ ...current, destination: value }))}
            optional
          />
        </div>

        <Separator />

        {/* 觀測群組設定 */}
        <div className="grid gap-3">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            觀測群組
          </span>

          {viewGroups.map((group, groupIndex) => (
            <ViewGroupEditor
              key={`${moduleItem.id}-group-${groupIndex}`}
              viewGroup={group}
              viewGroupIndex={groupIndex}
              moduleColor={palette}
              onChange={(updater) => updateViewGroup(groupIndex, updater)}
              onRemove={() => removeViewGroup(groupIndex)}
              allowRemove={viewGroups.length > 1}
            />
          ))}

          <Button variant="secondary" size="sm" onClick={addViewGroup} type="button" className="w-full">
            <Plus className="h-4 w-4" />
            新增觀測群組
          </Button>
        </div>
      </div>
    </div>
  );
}
