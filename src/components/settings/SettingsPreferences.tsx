import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme, type ThemeMode } from "@/contexts/ThemeProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { SUPPORTED_LANGS } from "@/i18n";
import { getPreferences, updatePreferences } from "@/lib/services/user-service";

export function SettingsPreferences() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    if (!user) return;
    getPreferences(user.id).then((p) => {
      if (!p) return;
      setNotif(p.notifications_enabled);
      if (p.language && i18n.language !== p.language) void i18n.changeLanguage(p.language);
      if (p.theme && p.theme !== theme) setTheme(p.theme as ThemeMode);
    });
  }, [user, i18n, setTheme, theme]);

  const onTheme = (t: ThemeMode) => {
    setTheme(t);
    if (user) void updatePreferences(user.id, { theme: t });
  };
  const onLang = (lang: string) => {
    void i18n.changeLanguage(lang);
    if (user) void updatePreferences(user.id, { language: lang as "en" | "ar" | "de" });
  };
  const onNotif = (v: boolean) => {
    setNotif(v);
    if (user) void updatePreferences(user.id, { notifications_enabled: v });
  };

  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{t("settings.preferences")}</h2>

      <p className="mt-4 text-sm font-medium">{t("settings.theme")}</p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">
        {(["light", "dark", "system"] as ThemeMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onTheme(m)}
            className={`rounded-md px-3 py-1.5 ${theme === m ? "bg-[var(--bg-elevated)] font-semibold" : ""}`}
          >
            {t(`settings.theme${m[0].toUpperCase() + m.slice(1)}`)}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm font-medium">{t("settings.language")}</p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">
        {SUPPORTED_LANGS.map((l) => (
          <button
            key={l}
            onClick={() => onLang(l)}
            className={`rounded-md px-3 py-1.5 ${i18n.language?.startsWith(l) ? "bg-[var(--bg-elevated)] font-semibold" : ""}`}
          >
            {l === "en" ? "English" : l === "de" ? "Deutsch" : "العربية"}
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-center justify-between text-sm">
        {t("settings.notifications")}
        <input type="checkbox" checked={notif} onChange={(e) => onNotif(e.target.checked)} />
      </label>
    </section>
  );
}
