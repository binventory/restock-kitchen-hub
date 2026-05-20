import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { Star } from "lucide-react";
import { setDefaultHousehold } from "@/lib/services/household-service";

export function SettingsHouseholds() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { households, refresh } = useHousehold();

  const makeDefault = async (id: string) => {
    if (!user) return;
    await setDefaultHousehold(user.id, id);
    await refresh();
  };

  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{t("settings.households")}</h2>
      <ul className="mt-3 divide-y">
        {households.map((h) => (
          <li key={h.id} className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm">
              {h.is_default && <Star className="h-4 w-4 fill-primary text-primary" />}
              {h.name}
            </span>
            {!h.is_default && (
              <button onClick={() => makeDefault(h.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                {t("household.setDefault")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
