import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function SettingsPage({ settings, onSave, homeHref }) {
  const [draft, setDraft] = useState(() => cloneSettings(settings));

  useEffect(() => {
    setDraft(cloneSettings(settings));
  }, [settings]);

  if (!draft) {
    return null;
  }

  function updateModule(moduleId, updater) {
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

  function saveDraft() {
    onSave(draft);
    window.location.hash = "#/";
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
                預設為上班、下班。首頁可快速切換這些模組。
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={addModule}>
              <Plus className="h-4 w-4" />
              新增模組
            </Button>
          </div>

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
          value={moduleItem.name}
          onChange={(value) => onChange((current) => ({ ...current, name: value }))}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="中心緯度"
            value={String(moduleItem.center.lat)}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                center: { ...current.center, lat: toNumber(value, current.center.lat) }
              }))
            }
          />
          <Input
            label="中心經度"
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
  return (
    <div className="rounded-[20px] border border-white bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{route.name || `路線 ${routeIndex + 1}`}</p>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="路線名稱"
            value={route.name}
            onChange={(value) => onChange((current) => ({ ...current, name: value }))}
          />
          <Input
            label="顯示標籤"
            value={route.label}
            onChange={(value) => onChange((current) => ({ ...current, label: value }))}
          />
        </div>

        <Input
          label="起點"
          value={route.origin}
          onChange={(value) => onChange((current) => ({ ...current, origin: value }))}
        />
        <Input
          label="終點"
          value={route.destination}
          onChange={(value) => onChange((current) => ({ ...current, destination: value }))}
        />
        <Input
          label="途經點"
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

function Input({ label, value, onChange, hint }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
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
