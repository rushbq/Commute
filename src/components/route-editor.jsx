import { ensureColor } from "../services/settings-validator";
import { Badge } from "./ui/badge";
import { ColorInput, Input } from "./ui/input";

export function RouteEditor({ route, routeIndex, onChange }) {
  const routeKey = routeIndex === 0 ? "A" : routeIndex === 1 ? "B" : `${routeIndex + 1}`;
  const safeColor = ensureColor(route.strokeColor, routeIndex);

  return (
    <div
      className="min-w-0 max-w-full overflow-hidden rounded-[22px] border bg-white p-4 dark:bg-slate-800"
      style={{ borderColor: `${safeColor}33` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: safeColor }}
            />
            <p className="text-base font-semibold text-slate-950 dark:text-slate-50">路線 {routeKey}</p>
            <Badge variant="neutral">選擇不同路徑策略</Badge>
          </div>
          <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-400">
            例如主線走中山南路，替代線走重慶南路。若無途經點，Google 可能算出相同路線。
          </p>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Input
            label="路線名稱"
            optional
            value={route.name}
            onChange={(value) => onChange((current) => ({ ...current, name: value }))}
          />
          <Input
            label="顯示標籤"
            optional
            value={route.label}
            onChange={(value) => onChange((current) => ({ ...current, label: value }))}
          />
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_88px]">
          <Input
            label="路線顏色"
            optional
            hint="可直接輸入 Hex 色碼，例如 #7c3aed"
            value={safeColor}
            onChange={(value) => onChange((current) => ({ ...current, strokeColor: value }))}
          />
          <ColorInput
            label="色票"
            value={safeColor}
            onChange={(value) => onChange((current) => ({ ...current, strokeColor: value }))}
          />
        </div>

        <Input
          label="途經點"
          optional
          hint="多個途經點請用 | 分隔，例如 中山南路, 台北市 | 信義路一段, 台北市"
          value={route.waypoints.map((waypoint) => waypoint.location).join(" | ")}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              waypoints: value
                .split("|")
                .map((item) => item.trim())
                .filter(Boolean)
                .map((item) => ({ location: item, stopover: false }))
            }))
          }
        />
      </div>
    </div>
  );
}
