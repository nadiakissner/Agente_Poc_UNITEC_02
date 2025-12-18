import { Logo } from "./Logo";

interface HeaderProps {
  subtitle?: string;
}

export function Header({ subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <Logo variant="header" />
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
