import { cn } from "../lib/utils";

export function ModuleSwitcher({ modules, activeModuleId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {modules.map((moduleItem) => {
        const isActive = moduleItem.id === activeModuleId;

        return (
          <button
            key={moduleItem.id}
            type="button"
            onClick={() => onSelect(moduleItem.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {moduleItem.name}
          </button>
        );
      })}
    </div>
  );
}
