import { cn } from "@/Lib/utils";
import { useState } from "react";

// Logo de UNITEC - archivo en public/assets/
// Vite sirve assets públicos desde /assets/ en producción
const logoUnitec = '/assets/UNITEC_logo.svg';

interface LogoProps {
  variant?: "splash" | "header";
  className?: string;
}

export function Logo({ variant = "header", className }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    splash: "w-40 h-auto",
    header: "h-8 w-auto",
  };

  // Si la imagen falla, mostrar un SVG fallback
  if (imageError) {
    return (
      <div className={cn("flex items-center gap-2 font-bold text-primary", className)}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-sm flex items-center justify-center text-white text-sm">
          U
        </div>
        <span className={variant === "header" ? "text-sm" : "text-lg"}>UNITEC</span>
      </div>
    );
  }

  return (
    <img
      src={logoUnitec}
      alt="UNITEC - Universidad Tecnológica de México"
      className={cn("object-contain", sizeClasses[variant], className)}
      style={{ maxHeight: variant === "header" ? "32px" : "160px" }}
      onError={() => setImageError(true)}
    />
  );
}
