import { Badge } from "./badge";

export function Input({ label, value, onChange, hint, required = false, optional = false }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="flex min-h-[28px] flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required ? <Badge variant="brand">必填</Badge> : null}
        {!required && optional ? <Badge variant="neutral">選填</Badge> : null}
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function ColorInput({ label, value, onChange }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="flex min-h-[28px] items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        <Badge variant="neutral">選填</Badge>
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
