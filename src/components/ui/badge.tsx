import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border-strong bg-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
