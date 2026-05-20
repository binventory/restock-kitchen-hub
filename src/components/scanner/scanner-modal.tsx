import { useEffect, useRef, useState } from "react";
import { X, Flashlight, Keyboard } from "lucide-react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, type Result } from "@zxing/library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function ScannerModal({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, 100);
    readerRef.current = reader;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });
        streamRef.current = stream;
        localStorage.setItem("restock_camera_permission", "granted");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setLoading(false);
        const cb = (result: Result | null) => {
          if (result) {
            navigator.vibrate?.(100);
            setFlash(true);
            reader.reset();
            setTimeout(() => onScan(result.getText()), 200);
          }
        };
        await reader.decodeFromVideoDevice(null, videoRef.current!, cb);
      } catch {
        localStorage.setItem("restock_camera_permission", "denied");
        setLoading(false);
        setManual(true);
      }
    };
    const t = setTimeout(() => void start(), 100);

    return () => {
      clearTimeout(t);
      reader.reset();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [onScan]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {
      // not supported
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      {flash && <div className="absolute inset-0 bg-green-500/40 animate-pulse" />}
      <button onClick={onClose} className="absolute top-4 start-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white">
        <X className="h-5 w-5" />
      </button>
      <button onClick={() => void toggleTorch()} className="absolute top-4 end-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white">
        <Flashlight className="h-5 w-5" />
      </button>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="relative h-60 w-72 rounded-lg border-2 border-green-400">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 animate-pulse" />
        </div>
      </div>
      <p className="absolute top-1/2 left-0 right-0 -mt-44 text-center text-white text-sm">Point camera at barcode</p>
      {loading && <p className="absolute bottom-32 left-0 right-0 text-center text-white">Opening camera...</p>}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        {manual ? (
          <div className="flex gap-2 bg-black/70 p-3 rounded-xl">
            <Input
              autoFocus
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
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
