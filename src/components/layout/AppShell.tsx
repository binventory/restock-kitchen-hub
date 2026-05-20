import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Onboarding } from "@/components/auth/Onboarding";
import { BottomNav, DesktopSidebar } from "./Nav";
import { HouseholdSwitcher } from "./HouseholdSwitcher";
import { FAB } from "./FAB";
import { LegalFooter } from "./LegalFooter";
import { CookieBanner } from "@/components/CookieBanner";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { applyDirection } from "@/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { households, loading: hLoading } = useHousehold();
  const { i18n, t } = useTranslation();

  useEffect(() => { applyDirection(i18n.language); }, [i18n.language]);

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">{t("common.loading")}</div>;
  if (!user) return <AuthScreen />;

  return (
    <MaintenanceGate>
      {!hLoading && households.length === 0 ? (
        <Onboarding />
      ) : (
        <div className="min-h-screen flex flex-col md:flex-row">
          <DesktopSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-[var(--bg-elevated)] px-4 py-2.5">
              <p className="text-lg font-bold text-primary md:hidden">Restock</p>
              <div className="md:ms-auto"><HouseholdSwitcher /></div>
            </header>
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <LegalFooter />
          </div>
          <BottomNav />
          <FAB />
        </div>
      )}
      <CookieBanner />
    </MaintenanceGate>
  );
}
