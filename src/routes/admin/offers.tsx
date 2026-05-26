import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/offers")({
  component: () => (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-bold">Offers</h1>
      <p className="text-sm text-muted-foreground">
        Coming in Prompt 3e. For now manage via the backend → offers table.
      </p>
    </div>
  ),
});
