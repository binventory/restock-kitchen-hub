import { useEffect, useRef, useState, useCallback } from "react";
import { X, Zap, Keyboard } from "lucide-react";
import * as ZXing from "@zxing/library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = ZXing;

interface Props {
  stream: MediaStream | null;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function ScannerModal({ stream, onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const decoded = useRef(false);
  const readerRef = useRef<InstanceType<typeof BrowserMultiFormatReader> | null>(null);
  const [manual, setManual] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(1);
  const [zoomStep, setZoomStep] = useState(0.1);
  const [showHint, setShowHint] = useState(false);

  // Beep on successful scan (no audio file needed)
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

  // Detect camera capabilities once the stream is ready
  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities?.() as
      | {
          torch?: boolean;
          zoom?: { min: number; max: number; step: number };
        }
      | undefined;
    if (caps?.torch !== undefined) setTorchSupported(true);
    if (caps?.zoom) {
      setZoomMin(caps.zoom.min);
      setZoomMax(caps.zoom.max);
      setZoomStep(caps.zoom.step || 0.1);
      setZoom(caps.zoom.min);
    }
  }, [stream]);

  // Start decoding when stream attaches
  useEffect(() => {
    decoded.current = false;
    if (!stream) {
      setManual(true);
      return;
    }

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, 200);
    readerRef.current = reader;

    const attach = async () => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // ignore play() rejection on tab switch
        }
      }
      reader.decodeFromStream(stream, videoRef.current!, (result) => {
        if (!result || decoded.current) return;
        decoded.current = true;
        beep();
        navigator.vibrate?.(100);
        reader.reset();
        onScan(result.getText());
      });
    };

    void attach();

    const hintTimer = setTimeout(() => {
      if (!decoded.current) setShowHint(true);
    }, 3000);

    return () => {
      clearTimeout(hintTimer);
      reader.reset();
      readerRef.current = null;
    };
  }, [stream, onScan, beep]);

  const toggleTorch = async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [
          { torch: !torchOn } as unknown as MediaTrackConstraintSet,
        ],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error(e);
    }
  };

  const applyZoom = async (val: number) => {
    setZoom(val);
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ zoom: val } as unknown as MediaTrackConstraintSet],
      });
    } catch {
      // zoom not supported
    }
  };

  const onTapFocus = async (e: React.MouseEvent) => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities?.() as
      | { pointsOfInterest?: boolean }
      | undefined;
    if (!caps?.pointsOfInterest) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    try {
      await track.applyConstraints({
        advanced: [
          {
            pointsOfInterest: [{ x, y }],
            focusMode: "single-shot",
          } as unknown as MediaTrackConstraintSet,
        ],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onClick={onTapFocus}
        className="h-full w-full"
        style={{ objectFit: "cover" }}
      />

      {/* Top controls */}
      <button
        onClick={onClose}
        className="absolute top-4 start-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white z-10"
      >
        <X />
      </button>
      {torchSupported && (
        <button
          onClick={toggleTorch}
          className="absolute top-4 end-4 h-10 w-10 grid place-items-center rounded-full bg-black/50 text-white z-10"
        >
          <Zap className={torchOn ? "text-yellow-400" : ""} />
        </button>
      )}

      {/* Scan frame with corner brackets */}
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

      {/* Hint after 3 seconds */}
      {showHint && (
        <div className="absolute top-20 left-0 right-0 grid place-items-center pointer-events-none">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full">
            Hold steady · 10-15 cm away · good light
          </div>
        </div>
      )}

      {/* Zoom slider when supported */}
      {zoomMax > zoomMin && (
        <div className="absolute bottom-32 left-0 right-0 px-6 flex items-center gap-3 text-white">
          <span className="text-xs">1×</span>
          <input
            type="range"
            min={zoomMin}
            max={zoomMax}
            step={zoomStep}
            value={zoom}
            onChange={(e) => void applyZoom(Number(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <span className="text-xs w-10 text-right">{zoom.toFixed(1)}×</span>
        </div>
      )}

      {/* Bottom controls */}
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
