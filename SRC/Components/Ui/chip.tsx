import * as React from "react";
import { cn } from "@/Lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-150",
          "border-2 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          selected
            ? "bg-primary text-primary-foreground border-primary shadow-md"
            : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Chip.displayName = "Chip";

export { Chip };
