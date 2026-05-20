import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useTranslation } from "react-i18next";
import { SettingsProfile, SettingsPlaceholder } from "@/components/settings/SettingsMisc";
import { SettingsPreferences } from "@/components/settings/SettingsPreferences";
import { SettingsHouseholds } from "@/components/settings/SettingsHouseholds";
import { SettingsPrivacy } from "@/components/settings/SettingsPrivacy";
import { SettingsAbout } from "@/components/settings/SettingsAbout";
import { SettingsScanners } from "@/components/settings/SettingsScanners";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Restock" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-4 space-y-4">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <SettingsProfile />
        <SettingsPreferences />
        <SettingsHouseholds />
        <SettingsPlaceholder title={t("settings.health")} />
        <SettingsPlaceholder title={t("settings.display")} />
        <SettingsScanners />
        <SettingsPlaceholder title={t("settings.submissions")} />
        <SettingsPlaceholder title={t("settings.ai")} />
        <SettingsPlaceholder title={t("settings.orders")} />
        <SettingsPlaceholder title={t("settings.subscription")} />
        <SettingsPrivacy />
        <SettingsAbout />
      </div>
    </AppShell>
  );
}
