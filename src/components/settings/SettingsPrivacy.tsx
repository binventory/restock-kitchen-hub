import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { requestDataExport, deleteOwnAccount } from "@/lib/services/user-service";

export function SettingsPrivacy() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onExport = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await requestDataExport(user.id);
      setMsg("Export requested. We'll email you when ready.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (confirm !== "DELETE") return;
    setBusy(true);
    try {
      await deleteOwnAccount();
      await signOut();
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{t("settings.privacy")}</h2>
      <button
        disabled={busy}
        onClick={onExport}
        className="mt-3 w-full rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        {t("settings.exportData")}
      </button>
      <div className="mt-4 rounded-lg border border-[var(--danger)]/40 p-3">
        <p className="text-sm font-medium text-[var(--danger)]">{t("settings.deleteAccount")}</p>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("settings.deleteConfirm")}
          className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
        />
        <button
          disabled={busy || confirm !== "DELETE"}
          onClick={onDelete}
          className="mt-2 w-full rounded-lg bg-[var(--danger)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t("settings.deleteAccount")}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
    </section>
  );
}
