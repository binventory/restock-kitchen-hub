import { createFileRoute } from "@tanstack/react-router";
import { CookScreen } from "@/components/cook/cook-screen";

export const Route = createFileRoute("/cook")({
  head: () => ({ meta: [{ title: "AI Cook — Restock" }] }),
  component: CookScreen,
});
