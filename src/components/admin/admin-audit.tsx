import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuditRow {
  id: string;
  created_at: string;
  admin_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
}

export function AdminAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("id, created_at, admin_user_id, action, target_type, target_id")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as AuditRow[]);
    })();
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <p className="text-sm text-muted-foreground">Last 100 actions</p>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Admin</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 font-mono text-xs">{r.admin_user_id.slice(0, 8)}</td>
                <td className="p-3">{r.action}</td>
                <td className="p-3 text-muted-foreground">
                  {r.target_type} {r.target_id?.slice(0, 12)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">No actions logged.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
