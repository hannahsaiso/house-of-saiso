import { ReactNode } from "react";

interface VaultLayoutProps {
  children: ReactNode;
}

export function VaultLayout({ children }: VaultLayoutProps) {
  return (
    <div className="vault-theme min-h-screen bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]">
      {children}
    </div>
  );
}
