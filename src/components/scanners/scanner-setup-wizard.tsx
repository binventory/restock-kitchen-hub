import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "@/contexts/HouseholdProvider";
import QRCode from "qrcode";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

interface Step {
  id: string;
  step_number: number;
  step_name: string;
  description: string | null;
  qr_payload: string;
}

// Builds the firmware config payload from user-supplied WiFi credentials.
// All values are passed through JSON.stringify, which escapes every
// special character (commas, quotes, newlines, backslashes), so a
// malicious SSID like  evil,evilpass,https://attacker/scan,realtoken
// cannot shift the endpoint / token fields. Firmware must JSON.parse()
// the body that follows the "CONFIG:" prefix.
function buildConfigPayload(input: { ssid: string; pwd: string; endpoint: string; token: string }): string {
  const safeBody = JSON.stringify({
    ssid: input.ssid,
    pwd: input.pwd,
    endpoint: input.endpoint,
    token: input.token,
  });
  return "CONFIG:" + safeBody;
}

export function ScannerSetupWizard({ onClose }: Props) {
  const { current } = useHousehold();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [configSteps, setConfigSteps] = useState<Step[]>([]);
  const [configIdx, setConfigIdx] = useState(0);
  const [ssid, setSsid] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [finalQr, setFinalQr] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from("scanner_config_steps")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setConfigSteps(data ?? []));
  }, []);

  useEffect(() => {
    const s = configSteps[configIdx];
    if (step === 2 && s) void QRCode.toDataURL(s.qr_payload).then(setQrUrl);
  }, [step, configIdx, configSteps]);

  const createScanner = async () => {
    if (!current) return;
    const { data, error } = await supabase
      .from("scanners")
      .insert({ household_id: current.id, name, location })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[scanner create]", error);
      return toast.error("Could not create scanner. Please try again.");
    }
    const { data: tok, error: tErr } = await supabase.rpc("get_scanner_token", {
      _scanner_id: data.id as string,
    });
    if (tErr || !tok) {
      console.error("[scanner token]", tErr);
      return toast.error("Could not generate scanner token. Please try again.");
    }
    setToken(tok as string);
    setStep(2);
  };

  const buildFinal = async () => {
    if (!token) {
      toast.error("Scanner token missing. Restart the wizard.");
      return;
    }
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "scanner_endpoint_url")
      .maybeSingle();
    const endpoint = data?.value ?? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan`;
    const payload = buildConfigPayload({ ssid, pwd, endpoint, token });
    try {
      const qr = await QRCode.toDataURL(payload, { width: 320 });
      setFinalQr(qr);
      setStep(4);
    } catch (e) {
      console.error("[scanner qr]", e);
      toast.error("Could not generate QR code. Please try again.");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <h2 className="text-lg font-bold">Set up scanner — Step {step}/5</h2>
        {step === 1 && (
          <div className="space-y-2">
            <Input
              placeholder="Scanner name (e.g. Kitchen bin)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Button onClick={() => void createScanner()} disabled={!name}>
              Next
            </Button>
          </div>
        )}
        {step === 2 &&
          (configSteps.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p>No configuration steps set up yet. Ask your administrator to configure scanner steps.</p>
              <Button onClick={() => setStep(3)}>Skip</Button>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold">{configSteps[configIdx]?.step_name}</p>
              <p className="text-xs text-muted-foreground">{configSteps[configIdx]?.description}</p>
              {qrUrl && <img src={qrUrl} alt="QR" className="mx-auto" />}
              <Button
                onClick={() => {
                  if (configIdx < configSteps.length - 1) setConfigIdx(configIdx + 1);
                  else setStep(3);
                }}
              >
                Next step →
              </Button>
            </div>
          ))}
        {step === 3 && (
          <div className="space-y-2">
            <Input placeholder="WiFi SSID" value={ssid} onChange={(e) => setSsid(e.target.value)} />
            <div className="flex gap-2">
              <Input
                type={showPwd ? "text" : "password"}
                placeholder="WiFi password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
              <Button variant="outline" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Stored only in the QR code, not on our servers.</p>
            <Button onClick={() => void buildFinal()} disabled={!ssid}>
              Next
            </Button>
          </div>
        )}
        {step === 4 && finalQr && (
          <div className="space-y-2 text-center">
            <p className="text-sm">Scan this with your Restock scanner hardware</p>
            <img src={finalQr} alt="Config QR" className="mx-auto" />
            <p className="text-xs text-orange-600">Keep this QR code private 🔒</p>
            <Button onClick={() => setStep(5)}>Next</Button>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-2 text-center">
            <p className="text-sm">Setup complete!</p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
