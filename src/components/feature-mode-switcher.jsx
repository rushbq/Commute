import { cn } from "../lib/utils";

const MODE_LABELS = {
  route: "路線比較",
  traffic: "交通觀測"
};

export function FeatureModeSwitcher({ availableModes, activeMode, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {availableModes.map((mode) => {
        const isActive = mode === activeMode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {MODE_LABELS[mode] || mode}
          </button>
        );
      })}
    </div>
  );
}
