import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSetting } from "@/hooks/useAppSetting";
import { useTranslation } from "react-i18next";

interface Social { platform: string; url: string | null; display_name: string | null; is_active: boolean; }

export function SettingsAbout() {
  const { t } = useTranslation();
  const supportMode = useAppSetting("support_mode", "email");
  const supportEmail = useAppSetting("support_email", "");
  const supportForm = useAppSetting("support_form_url", "");
  const [socials, setSocials] = useState<Social[]>([]);

  useEffect(() => {
    supabase.from("social_links").select("platform,url,display_name,is_active").eq("is_active", true).then(({ data }) => {
      setSocials((data ?? []) as Social[]);
    });
  }, []);

  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{t("settings.about")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("settings.version")}: 0.1.0</p>

      {socials.length > 0 && (
        <>
          <p className="mt-4 text-sm font-medium">{t("settings.social")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.platform}>
                <a href={s.url ?? "#"} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                  {s.display_name ?? s.platform}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-sm font-medium">{t("settings.support")}</p>
      <div className="mt-1 text-sm text-muted-foreground space-y-1">
        {(supportMode === "email" || supportMode === "both") && supportEmail && (
          <a className="block underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
        )}
        {(supportMode === "form" || supportMode === "both") && supportForm && (
          <a className="block underline" href={supportForm} target="_blank" rel="noreferrer">{supportForm}</a>
        )}
        {!supportEmail && !supportForm && <p>Configure support in admin settings.</p>}
      </div>
    </section>
  );
}
