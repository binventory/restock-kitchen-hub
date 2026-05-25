import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

type Step = "name" | "reset" | "mode" | "ttl" | "config" | "test";

const SSID_HISTORY_KEY = "restock_scanner_ssid_history";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const DEFAULT_SCAN_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/scan`
  : "";

function getSsidHistory(): string[] {
  try {
    const raw = localStorage.getItem(SSID_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function saveSsidToHistory(ssid: string) {
  if (!ssid.trim()) return;
  const existing = getSsidHistory();
  const next = [ssid, ...existing.filter((s) => s !== ssid)].slice(0, 10);
  try {
    localStorage.setItem(SSID_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function ScannerSetupWizard({ onClose }: Props) {
  useTranslation();
  const { user } = useAuth();
  const { current } = useHousehold();

  const [step, setStep] = useState<Step>("name");

  // Step 1
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  // Step 3
  const [mode, setMode] = useState<"sense" | "manual">("sense");

  // Step 5
  const [ssidHistory] = useState(getSsidHistory());
  const [ssidSelect, setSsidSelect] = useState(
    ssidHistory.length > 0 ? ssidHistory[0] : "__custom__",
  );
  const [ssidCustom, setSsidCustom] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SCAN_URL);

  // Created scanner state (only populated when we reach step 5)
  const [, setScannerId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [credentialsBusy, setCredentialsBusy] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const ssid = ssidSelect === "__custom__" ? ssidCustom.trim() : ssidSelect;

  const goToStep1Next = () => {
    if (!name.trim()) {
      toast.error("Please give your scanner a name");
      return;
    }
    setStep("reset");
  };

  // Lazy create + fetch token. Runs once when we hit the config step.
  const generateCredentials = async () => {
    if (token || credentialsBusy) return;
    if (!user || !current) {
      setCredentialsError("Not signed in to a household");
      return;
    }
    setCredentialsBusy(true);
    setCredentialsError(null);

    const { data: inserted, error: insertErr } = await supabase
      .from("scanners")
      .insert({
        household_id: current.id,
        name: name.trim(),
        location: location.trim() || null,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      setCredentialsError(insertErr?.message ?? "Could not create scanner");
      setCredentialsBusy(false);
      return;
    }

    const { data: tokenData, error: tokenErr } = await supabase.rpc(
      "get_scanner_token",
      { _scanner_id: inserted.id },
    );

    if (tokenErr || !tokenData) {
      await supabase.from("scanners").delete().eq("id", inserted.id);
      const raw = tokenErr?.message ?? "Could not retrieve scanner token";
      setCredentialsError(
        raw.includes("Only household owners")
          ? "Only the household owner can set up a scanner."
          : raw.includes("function") && raw.includes("does not exist")
            ? "Database not ready yet. Please run the latest migration in Supabase."
            : raw,
      );
      setCredentialsBusy(false);
      return;
    }

    setScannerId(inserted.id);
    setToken(tokenData as string);
    setCredentialsBusy(false);
  };

  useEffect(() => {
    if (step === "config" && !token && !credentialsBusy) {
      void generateCredentials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finishConfig = () => {
    if (!ssid || !password || !serverUrl || !token) {
      toast.error("Please fill in all fields");
      return;
    }
    saveSsidToHistory(ssid);
    setStep("test");
  };

  const testScanner = async () => {
    if (!token) return;
    try {
      const res = await fetch(serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanner_token: token, barcode: "TEST-PING" }),
      });
      if (res.ok || res.status === 404) {
        toast.success("✅ Scanner endpoint reachable");
      } else {
        toast.error(`Endpoint returned ${res.status}`);
      }
    } catch {
      toast.error("Could not reach the server URL");
    }
  };

  const configPayload =
    ssid && password && serverUrl && token
      ? `CONFIG:${ssid},${password},${serverUrl},${token}`
      : "";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold">Set up scanner</h2>

        {step === "name" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Step 1 of 5 — Name your scanner.
            </p>
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kitchen bin"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Location (optional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Under the sink"
              />
            </div>
            <Button className="w-full" onClick={goToStep1Next}>
              Continue
            </Button>
          </div>
        )}

        {step === "reset" && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Step 2 of 5 — Reset the scanner.
            </p>
            <p className="text-sm">
              Hold the scanner camera up to this QR code. The scanner will beep
              when it resets.
            </p>
            <div className="bg-white p-4 rounded-lg inline-block mx-auto">
              <QRCodeSVG value="S_CMD_FFFF" size={200} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">S_CMD_FFFF</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("name")}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("mode")}>
                <Check className="h-4 w-4 mr-1" /> Done — next
              </Button>
            </div>
          </div>
        )}

        {step === "mode" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Step 3 of 5 — Pick scan mode.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("sense")}
                className={`p-3 rounded-lg border text-sm text-left ${
                  mode === "sense"
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
              >
                <p className="font-semibold">Sense Mode</p>
                <p className="text-xs text-muted-foreground">
                  Auto-scans when something is in front of it
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`p-3 rounded-lg border text-sm text-left ${
                  mode === "manual"
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
              >
                <p className="font-semibold">Manual Mode</p>
                <p className="text-xs text-muted-foreground">
                  Scans only when button is pressed
                </p>
              </button>
            </div>

            {mode === "sense" && (
              <div className="text-center space-y-2">
                <p className="text-sm">Show this QR code to enable Sense Mode.</p>
                <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                  <QRCodeSVG value="S_CMD_020F" size={180} />
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  S_CMD_020F
                </p>
              </div>
            )}
            {mode === "manual" && (
              <p className="text-sm text-muted-foreground text-center">
                Manual mode is the default — no QR needed. Skip to the next step.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("reset")}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("ttl")}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "ttl" && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Step 4 of 5 — Set communication timing (TTL).
            </p>
            <p className="text-sm">Show this QR code to the scanner.</p>
            <div className="bg-white p-4 rounded-lg inline-block mx-auto">
              <QRCodeSVG value="S_CMD_01H3" size={200} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">S_CMD_01H3</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("mode")}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("config")}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "config" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Step 5 of 5 — WiFi & server config.
            </p>

            {credentialsBusy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating scanner credentials...
              </div>
            )}

            {credentialsError && !credentialsBusy && (
              <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{credentialsError}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void generateCredentials()}
                >
                  Retry
                </Button>
              </div>
            )}

            {token && (
              <>
                <div className="space-y-1">
                  <Label>WiFi network</Label>
                  {ssidHistory.length > 0 && (
                    <Select value={ssidSelect} onValueChange={setSsidSelect}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ssidHistory.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">
                          ➕ Enter new network
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {(ssidSelect === "__custom__" || ssidHistory.length === 0) && (
                    <Input
                      value={ssidCustom}
                      onChange={(e) => setSsidCustom(e.target.value)}
                      placeholder="WiFi network name (SSID)"
                      className="mt-2"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Browsers can't list nearby networks. Type the name you see
                    on your phone's WiFi settings.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>WiFi password</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Server URL</Label>
                  <Input
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://.../functions/v1/scan"
                  />
                  <p className="text-xs text-muted-foreground">
                    Endpoint the scanner will POST barcodes to.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Scanner ID</Label>
                  <Input
                    value={token ?? ""}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated. Keep this secret — it authenticates this
                    device.
                  </p>
                </div>

                {configPayload && (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                      <QRCodeSVG value={configPayload} size={220} />
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground break-all">
                      {configPayload.length > 60
                        ? configPayload.slice(0, 60) + "..."
                        : configPayload}
                    </p>
                    <p className="text-xs text-orange-600">
                      🔒 This QR contains your WiFi password and scanner
                      credentials. Don't share it.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("ttl")}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={finishConfig}
                disabled={!token}
              >
                Show QR — next
              </Button>
            </div>
          </div>
        )}

        {step === "test" && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold">All steps done.</p>
            <p className="text-sm text-muted-foreground">
              Your scanner should now reboot and connect to WiFi. Test the
              connection below.
            </p>
            <Button className="w-full" onClick={() => void testScanner()}>
              <Check className="h-4 w-4 mr-1" />
              Test Scanner
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
