import { Layers, Plus, Trash2, ZoomIn } from "lucide-react";
import { MAX_SUB_VIEWS } from "../services/settings-validator";
import { SubViewEditor } from "./sub-view-editor";
import { Button } from "./ui/button";

/**
 * 觀測群組編輯器。
 * 編輯群組名、共用縮放等級、子觀測點（1-3 個）。
 *
 * @param {{
 *   viewGroup: { name: string, zoom: number, views: Array },
 *   viewGroupIndex: number,
 *   moduleColor: { border: string, bg: string },
 *   onChange: (updater: (group) => group) => void,
 *   onRemove: () => void,
 *   allowRemove: boolean
 * }} props
 */
export function ViewGroupEditor({ viewGroup, viewGroupIndex, moduleColor, onChange, onRemove, allowRemove }) {
  const views = viewGroup.views || [];
  const canAddView = views.length < MAX_SUB_VIEWS;

  function updateView(viewIndex, updater) {
    onChange((prev) => ({
      ...prev,
      views: prev.views.map((v, i) => (i === viewIndex ? updater(v) : v))
    }));
  }

  function removeView(viewIndex) {
    onChange((prev) => ({
      ...prev,
      views: prev.views.filter((_, i) => i !== viewIndex)
    }));
  }

  function addView() {
    onChange((prev) => ({
      ...prev,
      views: [
        ...prev.views,
        {
          name: "",
          center: { lat: "", lng: "" },
          isWaypoint: false
        }
      ]
    }));
  }

  return (
    <div
      className="rounded-[20px] border-2 p-4 space-y-4"
      style={{ borderColor: `${moduleColor.border}40`, backgroundColor: moduleColor.bg }}
    >
      {/* 群組標題列 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            群組 {viewGroupIndex + 1}
          </span>
        </div>
        {allowRemove ? (
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* 群組名稱 */}
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">群組名稱</span>
        <input
          className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={viewGroup.name || ""}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder={`觀測群組 ${viewGroupIndex + 1}`}
        />
      </label>

      {/* 共用地圖縮放 */}
      <label className="grid gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          <ZoomIn className="h-3.5 w-3.5" />
          地圖縮放等級
        </span>
        <input
          className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          type="number"
          min="1"
          max="22"
          step="1"
          value={viewGroup.zoom ?? 14}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, zoom: toNumber(event.target.value, 14) }))
          }
        />
      </label>

      {/* 子觀測點列表 */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          觀測點（{views.length}/{MAX_SUB_VIEWS}）
        </span>

        {views.map((view, viewIndex) => (
          <SubViewEditor
            key={viewIndex}
            view={view}
            viewIndex={viewIndex}
            onChange={(updater) => updateView(viewIndex, updater)}
            onRemove={() => removeView(viewIndex)}
            allowRemove={views.length > 1}
          />
        ))}

        {canAddView ? (
          <Button variant="secondary" size="sm" onClick={addView} type="button" className="w-full">
            <Plus className="h-4 w-4" />
            新增觀測點
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
