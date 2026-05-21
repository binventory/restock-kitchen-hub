import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Restock" }] }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>This is a placeholder privacy policy. Restock collects only data needed to operate your stock and account.</p>
      <p>Replace this content with your full privacy policy before launch.</p>
    </LegalPage>
  ),
});
