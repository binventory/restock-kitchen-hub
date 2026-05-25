import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { ScannerSetupWizard } from "@/components/scanners/scanner-setup-wizard";
import { ScannerList } from "@/components/scanners/scanner-list";

export function SettingsScanners() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const onWizardClose = () => {
    setOpen(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <section className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("settings.scanners")}</h2>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Set up new scanner
        </Button>
      </div>

      <ScannerList reloadKey={reloadKey} />

      {open && <ScannerSetupWizard onClose={onWizardClose} />}
    </section>
  );
}
