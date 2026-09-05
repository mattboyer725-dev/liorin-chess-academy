import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide uppercase transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-fg",
        outline:
          "border border-border-strong bg-transparent text-fg hover:border-primary hover:text-primary",
        ghost: "text-muted hover:text-primary hover:bg-raised",
        danger: "bg-danger text-bg hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4 text-xs",
        lg: "h-12 px-5 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
