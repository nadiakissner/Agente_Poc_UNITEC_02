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
          "w-full text-left flex items-center justify-start rounded-lg px-4 py-2.5 text-sm transition-all duration-150",
          "border border-border/60 hover:border-primary/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          selected
            ? "bg-primary/10 text-primary border-primary/60 font-medium"
            : "bg-background hover:bg-accent/50 text-foreground",
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
