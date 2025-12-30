import { Logo } from "./Logo";

interface HeaderProps {
  subtitle?: string;
}

export function Header({ subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
      <div className="max-w-4xl mx-auto">
        <div className="scale-75 sm:scale-100 origin-left">
          <Logo variant="header" />
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{subtitle}</p>
        )}
      </div>
    </header>
  );
}

