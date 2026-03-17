import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        brand: "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300",
        neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
