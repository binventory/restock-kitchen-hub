import { useEffect, useRef, useState } from "react";
import { X, Zap, Keyboard } from "lucide-react";
import * as ZXing from "@zxing/library";
const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = ZXing;
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  stream: MediaStream | null;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function ScannerModal({ stream, onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const decoded = useRef(false);
  const [manual, setManual] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    decoded.current = false;
    if (!stream) {
      setManual(true);
      return;
    }

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]);

    const reader = new BrowserMultiFormatReader();

    const attach = async () => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      reader.decodeFromStream(stream, videoRef.current!, (result) => {
        if (!result || decoded.current) return;
        decoded.current = true;
        navigator.vibrate?.(100);
        reader.reset();
        onScan(result.getText());
      });
    };

    void attach();
    return () => {
      reader.reset();
    };
  }, [stream, onScan]);

  const toggleTorch = async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities?.();
      if (caps && "torch" in caps) {
        await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
        setTorchOn(!torchOn);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      <button
        onClick={onClose}
        className="absolute top-4 start-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white"
      >
        <X />
      </button>
      <button
        onClick={toggleTorch}
        className="absolute top-4 end-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white"
      >
        <Zap />
      </button>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="h-40 w-64 border-2 border-green-500 rounded-lg" />
      </div>
      <div className="absolute bottom-10 left-0 right-0 p-4">
        {manual ? (
          <div className="flex gap-2 bg-white p-2 rounded-lg">
            <Input value={manualVal} onChange={(e) => setManualVal(e.target.value)} />
            <Button onClick={() => onScan(manualVal)}>Go</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setManual(true)} className="w-full">
            Enter Manually
          </Button>
        )}
      </div>
    </div>
  );
}
