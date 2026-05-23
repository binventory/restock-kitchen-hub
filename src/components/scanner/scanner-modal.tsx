import { useEffect, useRef, useState, useCallback } from "react";
import { X, Zap, Keyboard } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const READER_ID = "restock-html5-qrcode-reader";

type TorchFeature = {
  isSupported: () => boolean;
  apply: (on: boolean) => Promise<void>;
};

export function ScannerModal({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decoded = useRef(false);
  const [manual, setManual] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 120);
    } catch {
      // audio blocked
    }
  }, []);

  useEffect(() => {
    decoded.current = false;
    const html5Qr = new Html5Qrcode(READER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
      ],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });

    scannerRef.current = html5Qr;

    const onSuccess = (text: string) => {
      if (decoded.current) return;
      decoded.current = true;
      beep();
      navigator.vibrate?.(100);
      void html5Qr.stop().finally(() => onScan(text));
    };

    const onError = () => {};

    const qrboxFn = (vpW: number, vpH: number) => {
      const minEdge = Math.min(vpW, vpH);
      const width = Math.floor(minEdge * 0.8);
      const height = Math.floor(width * 0.5);
      return { width, height };
    };

    html5Qr
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: qrboxFn,
          aspectRatio: window.innerWidth / window.innerHeight,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [
              { focusMode: "continuous" },
              { focusMode: "auto" },
            ] as unknown as MediaTrackConstraintSet[],
          },
        },
        onSuccess,
        onError,
      )
      .then(() => {
        const cap = (
          html5Qr.getRunningTrackCameraCapabilities?.() as
            | { torchFeature?: () => TorchFeature }
            | undefined
        )?.torchFeature?.();
        if (cap?.isSupported?.()) setTorchSupported(true);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Could not open camera";
        setError(msg);
        setManual(true);
      });

    const hintTimer = setTimeout(() => {
      if (!decoded.current) setShowHint(true);
    }, 3000);

    return () => {
      clearTimeout(hintTimer);
      const s = scannerRef.current;
      if (s) {
        try {
          if (s.getState() === 2) {
            void s.stop().catch(() => {});
          }
        } catch {
          // already stopped
        }
      }
      scannerRef.current = null;
    };
  }, [onScan, beep]);

  const toggleTorch = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      const cap = (
        s.getRunningTrackCameraCapabilities?.() as
          | { torchFeature?: () => TorchFeature }
          | undefined
      )?.torchFeature?.();
      if (cap?.isSupported?.()) {
        await cap.apply(!torchOn);
        setTorchOn(!torchOn);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div id={READER_ID} className="h-full w-full" />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 start-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white z-10"
      >
        <X />
      </button>

      {torchSupported && (
        <button
          onClick={() => void toggleTorch()}
          aria-label="Torch"
          className={`absolute top-4 end-4 h-10 w-10 grid place-items-center rounded-full text-white z-10 ${
            torchOn ? "bg-yellow-500" : "bg-black/50"
          }`}
        >
          <Zap />
        </button>
      )}

      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="relative h-40 w-64">
          <div className="absolute top-0 left-0 h-6 w-6 border-t-4 border-l-4 border-green-500 rounded-tl" />
          <div className="absolute top-0 right-0 h-6 w-6 border-t-4 border-r-4 border-green-500 rounded-tr" />
          <div className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-green-500 rounded-bl" />
          <div className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-green-500 rounded-br" />
          <div
            className="absolute left-2 right-2 h-0.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
            style={{ top: "50%", animation: "scanline 2s ease-in-out infinite" }}
          />
        </div>
      </div>

      {showHint && !error && (
        <div className="absolute top-20 left-0 right-0 grid place-items-center pointer-events-none">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full">
            Hold steady · 10-15 cm away · good light
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-20 left-0 right-0 grid place-items-center pointer-events-none px-4">
          <div className="bg-red-600/90 text-white text-sm px-4 py-2 rounded-full">
            {error}
          </div>
        </div>
      )}

      <div className="absolute bottom-10 left-0 right-0 p-4">
        {manual ? (
          <div className="flex gap-2 bg-white p-2 rounded-lg">
            <Input
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              placeholder="Enter barcode"
              onKeyDown={(e) =>
                e.key === "Enter" && manualVal && onScan(manualVal)
              }
            />
            <Button onClick={() => manualVal && onScan(manualVal)}>Go</Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setManual(true)}
            className="w-full bg-black/50 text-white border-white/30"
          >
            <Keyboard className="mr-2 h-4 w-4" /> Enter Manually
          </Button>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-3rem); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(3rem); opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-3rem); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
