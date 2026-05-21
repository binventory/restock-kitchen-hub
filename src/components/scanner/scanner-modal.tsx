import { useEffect, useRef, useState } from "react";
import { X, Zap, Keyboard } from "lucide-react";
import pkg from "@zxing/library";
const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = pkg;
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  stream: MediaStream | null;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function ScannerModal({ stream, onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    // If no stream was provided, go straight to manual mode
    if (!stream) {
      setLoading(false);
      setManual(true);
      return;
    }

    // Stream already obtained in FAB click handler
    // Just attach it to the video element and start decoding
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, 100);
    readerRef.current = reader;

    const attach = async () => {
      try {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setLoading(false);

        reader.decodeFromStream(stream, videoRef.current!, (result, _err) => {
          if (result) {
            navigator.vibrate?.(100);
            setFlash(true);
            reader.reset();
            setTimeout(() => onScan(result.getText()), 200);
          }
        });
      } catch {
        setLoading(false);
        setManual(true);
      }
    };

    void attach();

    return () => {
      reader.reset();
      // Do NOT stop the stream here — FAB owns it and stops it on close
    };
  }, [stream, onScan]);

  const toggleTorch = async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {
      // torch not supported on this device
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      {flash && <div className="absolute inset-0 bg-green-500/40 animate-pulse pointer-events-none" />}
      <button
        onClick={onClose}
        className="absolute top-4 start-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white"
      >
        <X className="h-5 w-5" />
      </button>
      {stream && (
        <button
          onClick={() => void toggleTorch()}
          className="absolute top-4 end-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white"
        >
          <Zap className={`h-5 w-5 ${torchOn ? "text-yellow-300" : ""}`} />
        </button>
      )}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="relative h-60 w-72 rounded-lg border-2 border-green-400">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 animate-pulse" />
        </div>
      </div>
      <p className="absolute top-1/2 left-0 right-0 -mt-44 text-center text-white text-sm opacity-75">
        Point camera at barcode
      </p>
      {loading && <p className="absolute bottom-32 left-0 right-0 text-center text-white text-sm">Opening camera...</p>}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        {manual ? (
          <div className="flex gap-2 bg-black/70 p-3 rounded-xl">
            <Input
              autoFocus
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualVal && onScan(manualVal)}
              placeholder="Enter barcode"
              className="bg-white"
            />
            <Button onClick={() => manualVal && onScan(manualVal)}>Go</Button>
          </div>
        ) : (
          <button
            onClick={() => setManual(true)}
            className="mx-auto flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full text-sm"
          >
            <Keyboard className="h-4 w-4" /> Enter manually
          </button>
        )}
      </div>
    </div>
  );
}
