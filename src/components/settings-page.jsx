import { LoaderCircle, Moon, Plus, RotateCcw, Save, Sun, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../hooks/use-theme";
import { validateSettings, createDefaultViewGroups } from "../services/settings-validator";
import { ModuleEditor } from "./module-editor";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const THEME_OPTIONS = [
  { value: "light", label: "白天模式" },
  { value: "dark", label: "夜覽模式" },
  { value: "auto", label: "自動切換" }
];

export function SettingsPage({ settings, onSave, onResetToDefaults, onClearAllAndReload, homeHref }) {
  const { theme, setTheme } = useTheme();
  const [draft, setDraft] = useState(() => cloneSettings(settings));
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setDraft(cloneSettings(settings));
    setValidationErrors([]);
    setSaveError("");
    setIsSaving(false);
    setIsResetting(false);
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
          mode: "traffic",
          name: `觀測模組 ${nextIndex}`,
          schedule: "always",
          origin: "",
          waypoints: [],
          destination: "",
          viewGroups: createDefaultViewGroups(),
          views: []
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
      window.location.hash = "#/";
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsResetting(false);
    }
  }

  function handleClearAllAndReload() {
    const confirmed = window.confirm(
      "這會清除本機所有快取資料（設定、模組、主題），並重新載入頁面，完全恢復為初始狀態。\n\n如果 App 顯示異常或舊資料無法清除，請使用此功能。確定要繼續嗎？"
    );

    if (!confirmed) {
      return;
    }

    onClearAllAndReload();
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Settings</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            模組設定
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            每個觀測模組可獨立設定排程，App 開啟時會依白天 / 夜覽自動切換。
          </p>
        </div>

        <Button variant="secondary" size="sm" className="w-full sm:w-auto" asChild>
          <a href={homeHref}>返回首頁</a>
        </Button>
      </div>

      {/* 主題設定 */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              主題外觀
            </p>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <div className="flex gap-2">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      theme === option.value
                        ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                        : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Moon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              自動切換會依據時間判斷，晚上 6 點至凌晨 5 點自動切為夜覽模式。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 模組清單 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">交通觀測模組</p>
        </div>
        <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={addModule}>
          <Plus className="h-4 w-4" />
          新增模組
        </Button>
      </div>

      {validationErrors.length ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">還有欄位未完成</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-slate-300">
          儲存失敗：{saveError}
        </div>
      ) : null}

      <div className="space-y-5">
        {draft.modules.map((moduleItem, index) => (
          <ModuleEditor
            key={moduleItem.id}
            moduleItem={moduleItem}
            moduleIndex={index}
            onChange={(updater) => updateModule(moduleItem.id, updater)}
            onRemove={() => removeModule(moduleItem.id)}
            allowRemove={draft.modules.length > 1}
          />
        ))}

        {!draft.modules.length ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
            目前還沒有模組。可直接按上方的「新增模組」。
          </div>
        ) : null}
      </div>

      {/* 緊急重設區 */}
      <div className="rounded-[22px] border border-red-100 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">緊急清除快取</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          若 App 顯示異常、資料損毀，或升級後舊設定無法清除，請使用此功能。
          將清除所有本機資料並重新載入頁面。
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
          onClick={handleClearAllAndReload}
        >
          <Trash2 className="h-4 w-4" />
          清除所有快取資料並重新載入
        </Button>
      </div>

      {/* 底部操作列 */}
      <div className="sticky bottom-4 z-20">
        <Card className="border-brand-100 bg-white/95 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
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

function cloneSettings(settings) {
  return settings ? JSON.parse(JSON.stringify(settings)) : null;
}
