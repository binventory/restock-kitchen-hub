import { createFileRoute } from "@tanstack/react-router";
import { AdminQueue } from "@/components/admin/admin-queue";

export const Route = createFileRoute("/admin/queue")({ component: AdminQueue });
