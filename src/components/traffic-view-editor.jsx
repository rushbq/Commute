import { ensureColor } from "../services/settings-validator";
import { Badge } from "./ui/badge";
import { ColorInput, Input } from "./ui/input";

function toNumber(value, fallback) {
  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function TrafficViewEditor({ view, viewIndex, moduleColor, onChange }) {
  const viewKey = viewIndex === 0 ? "A" : viewIndex === 1 ? "B" : `${viewIndex + 1}`;

  return (
    <div
      className="min-w-0 max-w-full overflow-hidden rounded-[22px] border bg-white p-4 dark:bg-slate-800"
      style={{ borderColor: `${moduleColor || "#94a3b8"}44` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: ensureColor(view.accentColor, viewIndex) }}
            />
            <p className="text-base font-semibold text-slate-950 dark:text-slate-50">觀測點 {viewKey}</p>
            <Badge variant="neutral">必填：緯度、經度</Badge>
          </div>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Input
            label="觀測點名稱"
            optional
            value={view.name}
            onChange={(value) => onChange((current) => ({ ...current, name: value }))}
          />
          <Input
            label="顯示標籤"
            optional
            value={view.label}
            onChange={(value) => onChange((current) => ({ ...current, label: value }))}
          />
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_88px]">
          <Input
            label="觀測點顏色"
            optional
            hint="預設為 #336dff 與 #7c3aed"
            value={ensureColor(view.accentColor, viewIndex)}
            onChange={(value) =>
              onChange((current) => ({ ...current, accentColor: value }))
            }
          />
          <ColorInput
            label="色票"
            value={ensureColor(view.accentColor, viewIndex)}
            onChange={(value) =>
              onChange((current) => ({ ...current, accentColor: value }))
            }
          />
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <Input
            label="中心緯度"
            required
            hint="例如 25.0726"
            value={String(view.center.lat)}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                center: { ...current.center, lat: toNumber(value, current.center.lat) }
              }))
            }
          />
          <Input
            label="中心經度"
            required
            hint="例如 121.5209"
            value={String(view.center.lng)}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                center: { ...current.center, lng: toNumber(value, current.center.lng) }
              }))
            }
          />
          <Input
            label="地圖縮放"
            optional
            hint="預設 14"
            type="number"
            min={1}
            max={22}
            step={1}
            value={String(view.zoom || 14)}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                zoom: toNumber(value, current.zoom || 14)
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}
