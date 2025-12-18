import { cn } from "@/Lib/utils";
// runtime URL for the logo (keeps dev/build from failing if asset is missing)
const logoUdla = '/assets/logo-udla.webp';

interface LogoProps {
  variant?: "splash" | "header";
  className?: string;
}

export function Logo({ variant = "header", className }: LogoProps) {
  const sizeClasses = {
    splash: "w-40 h-auto",
    header: "h-8 w-auto",
  };

  return (
    <img
      src={logoUdla}
      alt="UDLA - Universidad de Las Américas"
      className={cn(sizeClasses[variant], className)}
    />
  );
}
