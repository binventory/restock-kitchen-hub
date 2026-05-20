import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingCart, ChefHat, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const items = [
  { to: "/inventory", icon: Home, key: "inventory" as const },
  { to: "/shopping", icon: ShoppingCart, key: "shopping" as const },
  { to: "/cook", icon: ChefHat, key: "cook" as const },
  { to: "/settings", icon: Settings, key: "settings" as const },
];

export function BottomNav() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-[var(--bg-elevated)]">
      <ul className="grid grid-cols-4">
        {items.map(({ to, icon: Icon, key }) => {
          const active = path.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t(`nav.${key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopSidebar() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-[var(--bg-elevated)] p-4 gap-1">
      <div className="px-2 py-3 mb-2">
        <p className="text-lg font-bold text-primary">Restock</p>
        <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
      </div>
      {items.map(({ to, icon: Icon, key }) => {
        const active = path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(`nav.${key}`)}
          </Link>
        );
      })}
    </aside>
  );
}
