import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "restock.cookieConsent";

export function CookieBanner() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);

  const persist = async (a: boolean, m: boolean) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: a, marketing: m, at: Date.now() }));
    try {
      await supabase.from("cookie_consents").insert({
        user_id: user?.id ?? null,
        anonymous_id: user ? null : crypto.randomUUID(),
        essential: true,
        analytics: a,
        marketing: m,
      });
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 md:inset-x-auto md:end-4 md:bottom-4 md:max-w-md z-50 rounded-xl border bg-[var(--bg-elevated)] p-4 shadow-xl">
      <p className="font-semibold">{t("cookies.title")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("cookies.body")}</p>
      {custom && (
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center justify-between">{t("cookies.essential")}<input type="checkbox" checked disabled /></label>
          <label className="flex items-center justify-between">{t("cookies.analytics")}<input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /></label>
          <label className="flex items-center justify-between">{t("cookies.marketing")}<input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /></label>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => persist(true, true)} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          {t("cookies.acceptAll")}
        </button>
        <button onClick={() => persist(false, false)} className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold">
          {t("cookies.rejectAll")}
        </button>
        {!custom ? (
          <button onClick={() => setCustom(true)} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground">
            {t("cookies.customize")}
          </button>
        ) : (
          <button onClick={() => persist(analytics, marketing)} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary">
            OK
          </button>
        )}
      </div>
    </div>
  );
}
