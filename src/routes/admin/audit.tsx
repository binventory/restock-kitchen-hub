import { createFileRoute } from "@tanstack/react-router";
import { AdminAudit } from "@/components/admin/admin-audit";

export const Route = createFileRoute("/admin/audit")({ component: AdminAudit });
