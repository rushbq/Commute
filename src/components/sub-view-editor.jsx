import { MapPin, Navigation, Trash2 } from "lucide-react";
import { CoordinateInput } from "./coordinate-input";
import { getSubViewColor } from "../services/settings-validator";

/**
 * 子觀測點編輯器。
 * 編輯單一觀測點的名稱、座標、是否為導航途經點。
 *
 * @param {{
 *   view: { name: string, center: { lat: number, lng: number }, isWaypoint: boolean },
 *   viewIndex: number,
 *   onChange: (updater: (view) => view) => void,
 *   onRemove: () => void,
 *   allowRemove: boolean
 * }} props
 */
export function SubViewEditor({ view, viewIndex, onChange, onRemove, allowRemove }) {
  const color = getSubViewColor(viewIndex);
  const isPrimary = viewIndex === 0;

  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl border p-2 sm:p-3 space-y-3"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}06` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
            <span
              className="absolute inset-0 rotate-45 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
            <span className="relative z-10 text-[9px] font-bold text-white">
              {viewIndex + 1}
            </span>
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {isPrimary ? "主要觀測點" : `觀測點 ${viewIndex + 1}`}
          </span>
        </div>
        {allowRemove ? (
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* 觀測點名稱 */}
      <label className="grid gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3" />
          觀測點名稱
        </span>
        <input
          className="h-9 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={view.name || ""}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder={`觀測點 ${viewIndex + 1}`}
        />
      </label>

      {/* 座標輸入 */}
      <CoordinateInput
        center={view.center}
        onChange={(center) => onChange((prev) => ({ ...prev, center }))}
      />

      {/* 途經點設定 */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={view.isWaypoint === true}
          onClick={() => onChange((prev) => ({ ...prev, isWaypoint: !prev.isWaypoint }))}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            view.isWaypoint
              ? "bg-brand-500"
              : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              view.isWaypoint ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Navigation className="h-3 w-3" />
          設為導航途經點
        </span>
      </label>
    </div>
  );
}
