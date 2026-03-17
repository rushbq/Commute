import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export function SettingsPage({ settings, onSave, homeHref }) {
  const [draft, setDraft] = useState(() => cloneSettings(settings));
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setDraft(cloneSettings(settings));
    setValidationErrors([]);
    setSaveError("");
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
    const nextIndex = draft.modules.length + 1;
    const moduleId = `module-${Date.now()}`;
    setDraft((current) => ({
      ...current,
      modules: [
        ...current.modules,
        {
          id: moduleId,
          name: `常用模組 ${nextIndex}`,
          center: { lat: 25.0478, lng: 121.5319 },
          mapZoom: 14,
          routes: createDefaultRoutes()
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

    try {
      await onSave(draft);
      window.location.hash = "#/";
    } catch (error) {
      setSaveError(error.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Settings</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">
            路線設定
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <a href={homeHref}>返回首頁</a>
          </Button>
          <Button size="sm" onClick={saveDraft}>
            <Save className="h-4 w-4" />
            儲存
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">常用通勤模組</p>
              <p className="mt-1 text-sm text-slate-600">
                預設為上班、下班。首頁可快速切換這些模組。必填欄位只有模組名稱、起點、終點。
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={addModule}>
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
            {draft.modules.map((moduleItem, index) => (
              <ModuleEditor
                key={moduleItem.id}
                moduleItem={moduleItem}
                isDefault={draft.defaultModuleId === moduleItem.id}
                onSetDefault={() => setDraft((current) => ({ ...current, defaultModuleId: moduleItem.id }))}
                onChange={(updater) => updateModule(moduleItem.id, updater)}
                onRemove={() => removeModule(moduleItem.id)}
                allowRemove={draft.modules.length > 1}
                title={`模組 ${index + 1}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
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
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{moduleItem.name}</p>
        </div>
        <div className="flex items-center gap-2">
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

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="備援中心緯度"
            optional
            hint="地圖尚未取得路線前的備援中心點"
            value={String(moduleItem.center.lat)}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                center: { ...current.center, lat: toNumber(value, current.center.lat) }
              }))
            }
          />
          <Input
            label="備援中心經度"
            optional
            value={String(moduleItem.center.lng)}
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
            value={String(moduleItem.mapZoom)}
            onChange={(value) =>
              onChange((current) => ({ ...current, mapZoom: toNumber(value, current.mapZoom) }))
            }
          />
        </div>

        {moduleItem.routes.map((route, routeIndex) => (
          <RouteEditor
            key={`${moduleItem.id}-${routeIndex}`}
            route={route}
            routeIndex={routeIndex}
            onChange={(updater) =>
              onChange((current) => ({
                ...current,
                routes: current.routes.map((item, index) =>
                  index === routeIndex ? updater(item) : item
                )
              }))
            }
          />
        ))}
      </div>
    </div>
  );
}

function RouteEditor({ route, routeIndex, onChange }) {
  const routeKey = routeIndex === 0 ? "A" : routeIndex === 1 ? "B" : `${routeIndex + 1}`;

  return (
    <div
      className="rounded-[22px] border bg-white p-4"
      style={{ borderColor: `${route.strokeColor}33` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: route.strokeColor }}
            />
            <p className="text-base font-semibold text-slate-950">路線 {routeKey}</p>
            <Badge variant="neutral">必填：起點、終點</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            這一塊只設定這條路線本身。若兩條路的起終點相同，只要改路徑策略與途經點即可。
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
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

        <Input
          label="起點"
          required
          value={route.origin}
          onChange={(value) => onChange((current) => ({ ...current, origin: value }))}
        />
        <Input
          label="終點"
          required
          value={route.destination}
          onChange={(value) => onChange((current) => ({ ...current, destination: value }))}
        />
        <Input
          label="途經點"
          optional
          hint="多個途經點請用 | 分隔"
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
    <label className="grid gap-2">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {required ? <Badge variant="brand">必填</Badge> : null}
        {!required && optional ? <Badge variant="neutral">選填</Badge> : null}
      </span>
      <input
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function cloneSettings(settings) {
  return settings ? JSON.parse(JSON.stringify(settings)) : null;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createDefaultRoutes() {
  return [
    {
      name: "路線 A",
      label: "主要路線",
      origin: "",
      destination: "",
      waypoints: [],
      strokeColor: "#336dff"
    },
    {
      name: "路線 B",
      label: "替代路線",
      origin: "",
      destination: "",
      waypoints: [],
      strokeColor: "#0f766e"
    }
  ];
}

function validateSettings(settings) {
  const errors = [];

  settings.modules.forEach((moduleItem, moduleIndex) => {
    const moduleName = moduleItem.name?.trim() || `模組 ${moduleIndex + 1}`;

    if (!moduleItem.name?.trim()) {
      errors.push(`模組 ${moduleIndex + 1}：模組名稱為必填`);
    }

    moduleItem.routes.forEach((route, routeIndex) => {
      const routeName = route.name?.trim() || `路線 ${routeIndex === 0 ? "A" : routeIndex === 1 ? "B" : routeIndex + 1}`;

      if (!route.origin?.trim()) {
        errors.push(`${moduleName} / ${routeName}：起點為必填`);
      }

      if (!route.destination?.trim()) {
        errors.push(`${moduleName} / ${routeName}：終點為必填`);
      }
    });
  });

  return errors;
}
