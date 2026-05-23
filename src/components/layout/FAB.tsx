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
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const onClick = async () => {
    const tryConstraints = async (
      constraints: MediaStreamConstraints,
    ): Promise<MediaStream | null> => {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        return null;
      }
    };

    // Tier 1: Best — back camera, 1080p, continuous focus
    let s = await tryConstraints({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 },
        advanced: [
          { focusMode: "continuous" },
          { focusMode: "auto" },
        ] as unknown as MediaTrackConstraintSet[],
      },
    });

    // Tier 2: Mid — back camera, 720p
    if (!s) {
      s = await tryConstraints({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    }

    // Tier 3: Anything — let the browser pick
    if (!s) {
      s = await tryConstraints({ video: true });
    }

    if (s) {
      const track = s.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as
        | { focusMode?: string[] }
        | undefined;
      if (caps?.focusMode?.includes("continuous")) {
        try {
          await track.applyConstraints({
            advanced: [
              { focusMode: "continuous" } as unknown as MediaTrackConstraintSet,
            ],
          });
        } catch {
          // ignore — device doesn't support
        }
      }
      setStream(s);
      setOpen(true);
    } else {
      toast.error("Camera access failed. Please grant camera permission.");
      setOpen(true); // manual entry fallback
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
