import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import {
  getHouseholdMembers,
  updateMemberRole,
  removeMember,
  type HouseholdMemberRow,
} from "@/lib/services/household-service";
import { toast } from "sonner";

interface Props {
  householdId: string;
  onClose: () => void;
}

export function HouseholdMembers({ householdId, onClose }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<HouseholdMemberRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await getHouseholdMembers(householdId);
    setMembers(rows);
  }, [householdId]);

  useEffect(() => {
    void load();
  }, [load]);

  const me = members.find((m) => m.user_id === user?.id);
  const isAdmin = me?.role === "admin";

  const toggleRole = async (m: HouseholdMemberRow) => {
    if (!user) return;
    setBusy(m.user_id);
    try {
      const next = m.role === "admin" ? "member" : "admin";
      await updateMemberRole(householdId, m.user_id, user.id, next);
      await load();
      toast.success(`Role updated to ${next}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (m: HouseholdMemberRow) => {
    if (!user) return;
    if (!confirm("Remove this member from the household?")) return;
    setBusy(m.user_id);
    try {
      await removeMember(householdId, m.user_id, user.id);
      await load();
      toast.success("Member removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-md border">
        {members.map((m) => {
          const isMe = m.user_id === user?.id;
          return (
            <li key={m.user_id} className="flex items-center justify-between gap-2 p-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">{m.user_id.slice(0, 8)}…{isMe && " (you)"}</p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    m.role === "admin"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.role}
                </span>
              </div>
              {isAdmin && !isMe && (
                <div className="flex gap-1">
                  <button
                    disabled={busy === m.user_id}
                    onClick={() => void toggleRole(m)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                  >
                    {m.role === "admin" ? "Demote" : "Make admin"}
                  </button>
                  <button
                    disabled={busy === m.user_id}
                    onClick={() => void remove(m)}
                    className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-muted disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button onClick={onClose} className="w-full rounded-lg border px-3 py-2 text-sm">
        Close
      </button>
    </div>
  );
}
