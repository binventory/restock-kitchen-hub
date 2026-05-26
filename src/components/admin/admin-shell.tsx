import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Settings, Package, CreditCard,
  Users, Megaphone, Gift, Bell, ShoppingCart, ScrollText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Role = "super_admin" | "moderator" | null;

const ALL_LINKS = [
  { to: "/admin",          label: "Overview",   icon: LayoutDashboard, role: "any" },
  { to: "/admin/queue",    label: "Submissions",icon: Package,         role: "any" },
  { to: "/admin/users",    label: "Users",      icon: Users,           role: "super_admin" },
  { to: "/admin/plans",    label: "Plans",      icon: CreditCard,      role: "super_admin" },
  { to: "/admin/settings", label: "Settings",   icon: Settings,        role: "super_admin" },
  { to: "/admin/ads",      label: "Ads",        icon: Megaphone,       role: "any" },
  { to: "/admin/offers",   label: "Offers",     icon: Gift,            role: "any" },
  { to: "/admin/popups",   label: "Popups",     icon: Bell,            role: "any" },
  { to: "/admin/shop",     label: "Hardware",   icon: ShoppingCart,    role: "super_admin" },
  { to: "/admin/audit",    label: "Audit Log",  icon: ScrollText,      role: "super_admin" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const m = data.user?.app_metadata as Record<string, unknown> | undefined;
      if (m?.is_admin === true) setRole("super_admin");
      else if (m?.role === "moderator") setRole("moderator");
      else router.navigate({ to: "/" });
    })();
  }, [router]);

  if (!role) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const links = ALL_LINKS.filter((l) => l.role === "any" || l.role === role);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 shrink-0 border-r bg-[var(--bg-elevated,theme(colors.muted.DEFAULT))] p-4">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin</p>
          <p className="mt-1 text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</p>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
              activeOptions={{ exact: to === "/admin" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
