import { LoaderCircle, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FeatureModeSwitcher } from "./feature-mode-switcher";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export function SettingsPage({ settings, onSave, onResetToDefaults, homeHref }) {
  const [draft, setDraft] = useState(() => cloneSettings(settings));
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedMode, setSelectedMode] = useState("traffic");

  useEffect(() => {
    setDraft(cloneSettings(settings));
    setValidationErrors([]);
    setSaveError("");
    setIsSaving(false);
    setIsResetting(false);
    setSelectedMode(resolveInitialMode(settings));
  }, [settings]);

  if (!draft) {
    return null;
  }

  function updateModule(moduleId, updater) {
    setValidationErrors([]);
    setSaveError("");
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((moduleItem) =>
        moduleItem.id === moduleId ? updater(moduleItem) : moduleItem
      )
    }));
  }

  function addModule() {
    const nextIndex = draft.modules.filter((moduleItem) => moduleItem.mode === selectedMode).length + 1;
    const moduleId = `module-${Date.now()}`;
    setDraft((current) => ({
      ...current,
      modules: [
        ...current.modules,
        {
          id: moduleId,
          mode: selectedMode,
          name: `常用模組 ${nextIndex}`,
          origin: "",
          destination: "",
          mapZoom: 14,
          routes: createDefaultRoutes(),
          views: createDefaultTrafficViews()
        }
      ]
    }));
  }

  function removeModule(moduleId) {
    setDraft((current) => {
      const modules = current.modules.filter((moduleItem) => moduleItem.id !== moduleId);
      return {
        ...current,
        defaultModuleId:
          current.defaultModuleId === moduleId ? modules[0]?.id || null : current.defaultModuleId,
        modules
      };
    });
  }

  async function saveDraft() {
    const errors = validateSettings(draft);
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }

    setSaveError("");
    setIsSaving(true);

    try {
      await onSave(draft);
      window.location.hash = "#/";
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function resetToSystemDefaults() {
    const confirmed = window.confirm(
      "這會捨棄目前尚未儲存的修改，並直接恢復為系統預設值。確定要繼續嗎？"
    );

    if (!confirmed) {
      return;
    }

    setValidationErrors([]);
    setSaveError("");
    setIsResetting(true);

    try {
      await onResetToDefaults();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsResetting(false);
    }
  }

  const availableModes = Array.from(
    new Set((draft.modules || []).map((moduleItem) => moduleItem.mode || "route"))
  ).sort((left, right) => {
    const order = { traffic: 0, route: 1 };
    return (order[left] ?? 99) - (order[right] ?? 99);
  });

  const visibleModules = draft.modules.filter(
    (moduleItem) => (moduleItem.mode || "route") === selectedMode
  );

  return (
    <div className="space-y-4 pb-24 sm:pb-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Settings</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">
            模組設定
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            先切換功能模式，再編輯該模式底下的模組。這樣 route 與 traffic 不會混在一起。
          </p>
        </div>

        <Button variant="secondary" size="sm" className="w-full sm:w-auto" asChild>
          <a href={homeHref}>返回首頁</a>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              功能模式
            </p>
            <FeatureModeSwitcher
              availableModes={availableModes}
              activeMode={selectedMode}
              onSelect={setSelectedMode}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {selectedMode === "traffic" ? "交流道觀測模組" : "路線比較模組"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedMode === "traffic"
                  ? "主要使用交通觀測模式。必填欄位是觀測點的緯度與經度。"
                  : "必填欄位只有模組名稱、起點、終點。"}
              </p>
            </div>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={addModule}>
              <Plus className="h-4 w-4" />
              新增模組
            </Button>
          </div>

          {validationErrors.length ? (
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-900">還有欄位未完成</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {saveError ? (
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
              儲存失敗：{saveError}
            </div>
          ) : null}

          <div className="space-y-4">
            {visibleModules.map((moduleItem, index) => (
              <ModuleEditor
                key={moduleItem.id}
                moduleItem={moduleItem}
                isDefault={draft.defaultModuleId === moduleItem.id}
                onSetDefault={() =>
                  setDraft((current) => ({ ...current, defaultModuleId: moduleItem.id }))
                }
                onChange={(updater) => updateModule(moduleItem.id, updater)}
                onRemove={() => removeModule(moduleItem.id)}
                allowRemove={draft.modules.length > 1}
                title={`${selectedMode === "traffic" ? "觀測模組" : "路線模組"} ${index + 1}`}
              />
            ))}

            {!visibleModules.length ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                目前這個功能模式還沒有模組。可直接按上方的「新增模組」。
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-20">
        <Card className="border-brand-100 bg-white/95 shadow-panel backdrop-blur">
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-10 gap-2 sm:flex sm:justify-end">
              <Button
                variant="secondary"
                size="sm"
                className="col-span-2 min-w-0 px-0 sm:w-auto sm:px-4"
                onClick={resetToSystemDefaults}
                disabled={isSaving || isResetting}
                aria-label="重設為系統預設值"
                title="重設為系統預設值"
              >
                {isResetting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">重設為系統預設值</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="col-span-2 min-w-0 px-0 sm:w-auto sm:px-4"
                aria-label="取消"
                title="取消"
                asChild
              >
                <a href={homeHref}>
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">取消</span>
                </a>
              </Button>
              <Button
                size="sm"
                className="col-span-6 min-w-0 px-0 sm:w-auto sm:px-4"
                onClick={saveDraft}
                disabled={isSaving || isResetting}
                aria-label="儲存設定"
                title="儲存設定"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">儲存設定</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ModuleEditor({
  moduleItem,
  isDefault,
  onSetDefault,
  onChange,
  onRemove,
  allowRemove,
  title
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 break-words text-lg font-semibold text-slate-950">{moduleItem.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onSetDefault}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isDefault
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {isDefault ? "首頁預設" : "設為預設"}
          </button>
          {allowRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <Input
          label="模組名稱"
          required
          value={moduleItem.name}
          onChange={(value) => onChange((current) => ({ ...current, name: value }))}
        />

        <Input
          label="地圖縮放"
          optional
          hint="每張地圖的預設 zoom，預設 14"
          value={String(moduleItem.mapZoom)}
          onChange={(value) =>
            onChange((current) => ({ ...current, mapZoom: toNumber(value, current.mapZoom) }))
          }
        />

        {moduleItem.mode === "traffic" ? (
          <>
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">交通觀測點設定</p>
              <p className="mt-1 text-sm text-slate-600">
                請設定兩個你要觀察的交流道或路段中心點。首頁會顯示兩張獨立交通地圖。
              </p>
            </div>

            {ensureViews(moduleItem.views).map((view, viewIndex) => (
              <TrafficViewEditor
                key={`${moduleItem.id}-view-${viewIndex}`}
                view={view}
                viewIndex={viewIndex}
                onChange={(updater) =>
                  onChange((current) => ({
                    ...current,
                    views: ensureViews(current.views).map((item, index) =>
                      index === viewIndex ? updater(item) : item
                    )
                  }))
                }
              />
            ))}
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="共用起點"
                required
                value={moduleItem.origin || ""}
                onChange={(value) => onChange((current) => ({ ...current, origin: value }))}
              />
              <Input
                label="共用終點"
                required
                value={moduleItem.destination || ""}
                onChange={(value) =>
                  onChange((current) => ({ ...current, destination: value }))
                }
              />
            </div>

            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">路線設定</p>
              <p className="mt-1 text-sm text-slate-600">
                起點與終點已在上方共用設定。下面只需要定義兩條路各自的名稱、顏色與途經點。
              </p>
            </div>

            {ensureRoutes(moduleItem.routes).map((route, routeIndex) => (
              <RouteEditor
                key={`${moduleItem.id}-${routeIndex}`}
                route={route}
                routeIndex={routeIndex}
                onChange={(updater) =>
                  onChange((current) => ({
                    ...current,
                    routes: ensureRoutes(current.routes).map((item, index) =>
                      index === routeIndex ? updater(item) : item
                    )
                  }))
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function RouteEditor({ route, routeIndex, onChange }) {
  const routeKey = routeIndex === 0 ? "A" : routeIndex === 1 ? "B" : `${routeIndex + 1}`;
  const safeColor = ensureColor(route.strokeColor, routeIndex);

  return (
    <div
      className="min-w-0 max-w-full overflow-hidden rounded-[22px] border bg-white p-4"
      style={{ borderColor: `${safeColor}33` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: safeColor }}
            />
            <p className="text-base font-semibold text-slate-950">路線 {routeKey}</p>
            <Badge variant="neutral">選擇不同路徑策略</Badge>
          </div>
          <p className="mt-2 break-words text-sm text-slate-600">
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

function Input({ label, value, onChange, hint, required = false, optional = false }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="flex min-h-[28px] flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {required ? <Badge variant="brand">必填</Badge> : null}
        {!required && optional ? <Badge variant="neutral">選填</Badge> : null}
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="flex min-h-[28px] items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        <Badge variant="neutral">選填</Badge>
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-1"
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TrafficViewEditor({ view, viewIndex, onChange }) {
  const viewKey = viewIndex === 0 ? "A" : viewIndex === 1 ? "B" : `${viewIndex + 1}`;

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-slate-950">觀測點 {viewKey}</p>
            <Badge variant="neutral">必填：緯度、經度</Badge>
          </div>
          <p className="mt-2 break-words text-sm text-slate-600">
            請填你要觀察的交流道或路段中心點。這兩個觀測點會各自顯示成一張交通地圖。
          </p>
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
            value={ensureTrafficColor(view.accentColor, viewIndex)}
            onChange={(value) =>
              onChange((current) => ({ ...current, accentColor: value }))
            }
          />
          <ColorInput
            label="色票"
            value={ensureTrafficColor(view.accentColor, viewIndex)}
            onChange={(value) =>
              onChange((current) => ({ ...current, accentColor: value }))
            }
          />
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
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
        </div>
      </div>
    </div>
  );
}

function cloneSettings(settings) {
  return settings ? JSON.parse(JSON.stringify(settings)) : null;
}

function toNumber(value, fallback) {
  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createDefaultRoutes() {
  return [
    {
      name: "路線 A",
      label: "主要路線",
      waypoints: [],
      strokeColor: "#336dff"
    },
    {
      name: "路線 B",
      label: "替代路線",
      waypoints: [],
      strokeColor: "#7c3aed"
    }
  ];
}

function createDefaultTrafficViews() {
  return [
    {
      name: "三鶯交流道",
      label: "主要觀測",
      accentColor: "#336dff",
      center: { lat: 24.9345, lng: 121.4187 },
      zoom: 13
    },
    {
      name: "樹林交流道",
      label: "替代觀測",
      accentColor: "#7c3aed",
      center: { lat: 24.9894, lng: 121.4225 },
      zoom: 13
    }
  ];
}

function ensureRoutes(routes) {
  return Array.isArray(routes) && routes.length ? routes : createDefaultRoutes();
}

function ensureViews(views) {
  return Array.isArray(views) && views.length ? views : createDefaultTrafficViews();
}

function validateSettings(settings) {
  const errors = [];

  settings.modules.forEach((moduleItem, moduleIndex) => {
    const moduleName = moduleItem.name?.trim() || `模組 ${moduleIndex + 1}`;

    if (!moduleItem.name?.trim()) {
      errors.push(`模組 ${moduleIndex + 1}：模組名稱為必填`);
    }

    if ((moduleItem.mode || "route") === "traffic") {
      ensureViews(moduleItem.views).forEach((view, viewIndex) => {
        if (!Number.isFinite(Number(view.center?.lat))) {
          errors.push(`${moduleName} / 觀測點 ${viewIndex + 1}：中心緯度為必填`);
        }

        if (!Number.isFinite(Number(view.center?.lng))) {
          errors.push(`${moduleName} / 觀測點 ${viewIndex + 1}：中心經度為必填`);
        }
      });
    } else {
      if (!moduleItem.origin?.trim()) {
        errors.push(`${moduleName}：共用起點為必填`);
      }

      if (!moduleItem.destination?.trim()) {
        errors.push(`${moduleName}：共用終點為必填`);
      }
    }
  });

  return errors;
}

function ensureColor(value, routeIndex) {
  if (/^#[0-9a-fA-F]{6}$/.test(value || "")) {
    return value;
  }

  return routeIndex === 0 ? "#336dff" : "#7c3aed";
}

function ensureTrafficColor(value, viewIndex) {
  if (/^#[0-9a-fA-F]{6}$/.test(value || "")) {
    return value;
  }

  return viewIndex === 0 ? "#336dff" : "#7c3aed";
}

function resolveInitialMode(settings) {
  const modes = (settings?.modules || []).map((moduleItem) => moduleItem.mode || "route");
  return modes.includes("traffic") ? "traffic" : modes[0] || "route";
}
