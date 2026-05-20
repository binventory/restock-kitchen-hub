import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FAB() {
  const { t } = useTranslation();
  return (
    <button
      aria-label={t("nav.inventory")}
      onClick={() => alert("Barcode scanner coming soon")}
      className="fixed end-4 bottom-20 md:bottom-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition"
    >
      <Camera className="h-6 w-6" />
    </button>
  );
}
