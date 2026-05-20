import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ScannerSetupWizard } from "@/components/scanners/scanner-setup-wizard";

export function SettingsScanners() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold mb-2">{t("settings.scanners")}</h2>
      <Button onClick={() => setOpen(true)} size="sm">Set up new scanner</Button>
      {open && <ScannerSetupWizard onClose={() => setOpen(false)} />}
    </section>
  );
}
