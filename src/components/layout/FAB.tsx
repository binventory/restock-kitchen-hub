import { useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScannerModal } from "@/components/scanner/scanner-modal";
import { ProductPage } from "@/components/product/product-page";
import { AddProductForm } from "@/components/product/add-product-form";
import { lookupBarcode } from "@/lib/services/product-lookup-service";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import type { ResolvedProduct } from "@/lib/types/product";

export function FAB() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { current } = useHousehold();
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<ResolvedProduct | null>(null);
  const [addBarcode, setAddBarcode] = useState<string | null>(null);

  const handleScan = useCallback(
    async (barcode: string) => {
      if (!user || !current) return;
      setOpen(false);
      const p = await lookupBarcode(barcode, user.id, current.id);
      if (p) setResolved(p);
      else setAddBarcode(barcode);
    },
    [user, current],
  );

  return (
    <>
      <button
        aria-label={t("nav.inventory")}
        onClick={() => setOpen(true)}
        className="fixed end-4 bottom-20 md:bottom-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition"
      >
        <Camera className="h-6 w-6" />
      </button>
      {open && (
        <ScannerModal onScan={handleScan} onClose={() => setOpen(false)} />
      )}
      {resolved && (
        <ProductPage product={resolved} onClose={() => setResolved(null)} />
      )}
      {addBarcode && (
        <AddProductForm
          barcode={addBarcode}
          onClose={() => setAddBarcode(null)}
          onSaved={(p) => {
            setAddBarcode(null);
            setResolved(p);
          }}
        />
      )}
    </>
  );
}
