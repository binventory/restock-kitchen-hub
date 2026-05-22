import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createHousehold, acceptInvite, friendlyHouseholdError } from "@/lib/services/household-service";
import { useHousehold } from "@/contexts/HouseholdProvider";

export function Onboarding() {
  const { t } = useTranslation();
  const { refresh } = useHousehold();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        if (!value.trim()) throw new Error("Required");
        await createHousehold(value.trim());
      } else {
        if (!value.trim()) throw new Error("Required");
        await acceptInvite(value.trim());
      }
      await refresh();
    } catch (e) {
      // The service layer already returns friendly text where it can;
      // fall back through the mapper for anything that bubbled up raw.
      console.error("[onboarding]", e);
      setError(friendlyHouseholdError(e, "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-[var(--bg-elevated)] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-center">{t("onboarding.title")}</h1>
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          <button
            onClick={() => setMode("create")}
            className={`rounded-md px-3 py-1.5 ${mode === "create" ? "bg-[var(--bg-elevated)] font-semibold" : ""}`}
          >
            {t("onboarding.createHousehold")}
          </button>
          <button
            onClick={() => setMode("join")}
            className={`rounded-md px-3 py-1.5 ${mode === "join" ? "bg-[var(--bg-elevated)] font-semibold" : ""}`}
          >
            {t("onboarding.joinHousehold")}
          </button>
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={mode === "create" ? t("onboarding.householdName") : t("onboarding.inviteToken")}
          className="mt-4 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
        />
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
        <button
          disabled={busy}
          onClick={submit}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "..." : mode === "create" ? t("onboarding.create") : t("onboarding.join")}
        </button>
      </div>
    </div>
  );
}
