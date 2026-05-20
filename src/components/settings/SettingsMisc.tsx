import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";

export function SettingsProfile() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{t("settings.profile")}</h2>
      <p className="mt-2 text-sm">{user?.email}</p>
      <button onClick={() => void signOut()} className="mt-3 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
        {t("common.signOut")}
      </button>
    </section>
  );
}

export function SettingsPlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Coming soon.</p>
    </section>
  );
}
