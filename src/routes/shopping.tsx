import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/shopping")({
  head: () => ({ meta: [{ title: "Shopping — Restock" }] }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-bold">{t("shopping.title")}</h1>
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("shopping.empty")}
        </div>
      </div>
    </AppShell>
  );
}
