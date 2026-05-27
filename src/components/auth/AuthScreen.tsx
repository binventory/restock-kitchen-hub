import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const isDevEnv =
  import.meta.env.DEV ||
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"));

export function AuthScreen() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: "google" | "apple") => {
    setBusy(provider);
    setError(null);
    try {
      const result = (await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin })) as {
        redirected?: boolean;
        error?: unknown;
      };
      if (result.redirected) return;
      if (result.error) {
        // Log full details to the developer console; show a generic
        // message to the user. Raw provider error text can include
        // request URLs, scopes or internal IDs.
        console.error("[oauth sign-in]", result.error);
        setError("Sign-in failed. Please try again.");
      }
    } catch (e) {
      console.error("[oauth sign-in]", e);
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg-page)] p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-[var(--bg-elevated)] p-8 shadow-sm text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
          R
        </div>
        <h1 className="text-2xl font-bold">{t("auth.welcome")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
        <div className="mt-6 space-y-2">
          <button
            disabled={busy !== null}
            onClick={() => signIn("google")}
            className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {busy === "google" ? "..." : t("auth.continueGoogle")}
          </button>
          <button
            disabled={busy !== null}
            onClick={() => signIn("apple")}
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-[var(--bg-page)] disabled:opacity-50"
          >
            {busy === "apple" ? "..." : t("auth.continueApple")}
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
