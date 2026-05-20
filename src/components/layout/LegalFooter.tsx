import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function LegalFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-[var(--bg-card)] py-4 px-4 text-xs text-muted-foreground">
      <div className="mx-auto max-w-5xl flex flex-wrap gap-x-4 gap-y-1 justify-center">
        <Link to="/privacy" className="hover:underline">{t("legal.privacy")}</Link>
        <Link to="/terms" className="hover:underline">{t("legal.terms")}</Link>
        <Link to="/impressum" className="hover:underline">{t("legal.impressum")}</Link>
        <Link to="/cookies" className="hover:underline">{t("legal.cookiesPolicy")}</Link>
        <Link to="/openfoodfacts-attribution" className="hover:underline">{t("legal.off")}</Link>
      </div>
    </footer>
  );
}
