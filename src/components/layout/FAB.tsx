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
import { toast } from "sonner";

export function FAB() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { current } = useHousehold();
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
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

  const handleClose = () => {
    setOpen(false);
    // Stop the stream when modal closes
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  // CRITICAL: getUserMedia must be called directly in the
  // click handler to stay within the iOS Safari user gesture
  // context. Do NOT put it in useEffect or behind setTimeout.
  const onClick = async () => {
    try {
      // Request camera immediately in click handler
      // iOS Safari requires this to be in the user gesture stack
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
        },
      });
      setStream(s);
      setOpen(true);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("Camera access denied. Please enable camera in your browser settings.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        toast.error("No camera found on this device.");
      } else if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        // Fallback: no rear camera or constraints unsupported — try with ideal
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
            },
          });
          setStream(s);
          setOpen(true);
        } catch {
          setStream(null);
          setOpen(true);
        }
      } else {
        // Any other error: open modal in manual entry mode instead
        // Do NOT permanently block camera — it might work next time
        setStream(null);
        setOpen(true);
      }
    }
  };

  return (
    <>
      <button
        aria-label={t("nav.inventory")}
        onClick={() => void onClick()}
        className="fixed end-4 bottom-20 md:bottom-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition"
      >
        <Camera className="h-6 w-6" />
      </button>
      {open && <ScannerModal stream={stream} onScan={handleScan} onClose={handleClose} />}
      {resolved && <ProductPage product={resolved} onClose={() => setResolved(null)} />}
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
