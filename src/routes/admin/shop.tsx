import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/shop")({
  component: () => (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-bold">Hardware Shop</h1>
      <p className="text-sm text-muted-foreground">
        Coming in Prompt 3e. For now manage via the backend → scanner_orders table.
      </p>
    </div>
  ),
});
