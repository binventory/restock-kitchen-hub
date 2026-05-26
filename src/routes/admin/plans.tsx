import { createFileRoute } from "@tanstack/react-router";
import { AdminPlans } from "@/components/admin/admin-plans";

export const Route = createFileRoute("/admin/plans")({ component: AdminPlans });
