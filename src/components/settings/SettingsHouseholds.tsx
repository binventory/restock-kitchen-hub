import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  setDefaultHousehold,
  leaveHousehold,
  acceptInvite,
  friendlyHouseholdError,
} from "@/lib/services/household-service";
import { HouseholdMembers } from "./HouseholdMembers";

export function SettingsHouseholds() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { households, refresh } = useHousehold();

  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [membersFor, setMembersFor] = useState<{ id: string; name: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const [leaveFor, setLeaveFor] = useState<{ id: string; name: string } | null>(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  const makeDefault = async (id: string) => {
    if (!user) return;
    await setDefaultHousehold(user.id, id);
    await refresh();
  };

  const submitInvite = async () => {
    if (!user || !inviteFor || !inviteEmail) return;
    setInviteBusy(true);
    setInviteError(null);
    const { data, error } = await supabase
      .from("household_invites")
      .insert({ household_id: inviteFor, invited_email: inviteEmail, created_by: user.id })
      .select("token")
      .single();
    setInviteBusy(false);
    if (error) {
      // Never surface raw DB errors — they can leak constraint/table
      // names and internal paths. Log to console for developers and
      // show a generic message to the user.
      console.error("[invite create]", error);
      setInviteError("Could not send invite. Please check the email and try again.");
      return;
    }
    setInviteToken(data?.token ?? null);
  };

  const closeInvite = () => {
    setInviteFor(null);
    setInviteEmail("");
    setInviteToken(null);
    setInviteError(null);
  };

  const confirmLeave = async () => {
    if (!user || !leaveFor) return;
    await leaveHousehold(user.id, leaveFor.id);
    setLeaveFor(null);
    await refresh();
  };

  const submitJoin = async () => {
    if (!joinToken) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      await acceptInvite(joinToken.trim());
      setJoinOpen(false);
      setJoinToken("");
      await refresh();
    } catch (e) {
      console.error("[join household]", e);
      setJoinError(friendlyHouseholdError(e, "Invalid or used invite token."));
    } finally {
      setJoinBusy(false);
    }
  };

  const canLeave = households.length >= 2;

  return (
    <section className="rounded-xl border bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">{t("settings.households")}</h2>
      <ul className="mt-3 divide-y">
        {households.map((h) => (
          <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="flex items-center gap-2 text-sm">
              {h.is_default && <Star className="h-4 w-4 fill-primary text-primary" />}
              {h.name}
            </span>
            <div className="flex items-center gap-2">
              {!h.is_default && (
                <button
                  onClick={() => makeDefault(h.id)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                >
                  {t("household.setDefault")}
                </button>
              )}
              <button onClick={() => setInviteFor(h.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                Invite member
              </button>
              <button
                onClick={() => setMembersFor({ id: h.id, name: h.name })}
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              >
                Members
              </button>
              {canLeave && !h.is_default && (
                <button
                  onClick={() => setLeaveFor({ id: h.id, name: h.name })}
                  className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-muted"
                >
                  Leave
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          onClick={() => setJoinOpen(true)}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Join a household
        </button>
      </div>

      {inviteFor && (
        <Modal title="Invite member" onClose={closeInvite}>
          {inviteToken ? (
            <div className="space-y-3">
              <p className="text-sm text-green-600">Invite sent</p>
              <p className="text-xs text-muted-foreground">Share this token with the invitee:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteToken}
                  className="flex-1 rounded-md border bg-muted px-2 py-1.5 text-xs font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(inviteToken)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={closeInvite}
                className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full rounded-md border bg-[var(--bg-page)] px-3 py-2 text-sm"
              />
              {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
              <div className="flex gap-2">
                <button onClick={closeInvite} className="flex-1 rounded-lg border px-3 py-2 text-sm">
                  Cancel
                </button>
                <button
                  disabled={!inviteEmail || inviteBusy}
                  onClick={submitInvite}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {inviteBusy ? "..." : "Send invite"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {leaveFor && (
        <Modal title={`Leave ${leaveFor.name}?`} onClose={() => setLeaveFor(null)}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">You will lose access to this household.</p>
            <div className="flex gap-2">
              <button onClick={() => setLeaveFor(null)} className="flex-1 rounded-lg border px-3 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground"
              >
                Leave
              </button>
            </div>
          </div>
        </Modal>
      )}

      {joinOpen && (
        <Modal
          title="Join a household"
          onClose={() => {
            setJoinOpen(false);
            setJoinError(null);
          }}
        >
          <div className="space-y-3">
            <input
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value)}
              placeholder="Paste invite token"
              className="w-full rounded-md border bg-[var(--bg-page)] px-3 py-2 text-sm font-mono"
            />
            {joinError && <p className="text-xs text-destructive">{joinError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setJoinOpen(false);
                  setJoinError(null);
                }}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!joinToken || joinBusy}
                onClick={submitJoin}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {joinBusy ? "..." : "Join"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {membersFor && (
        <Modal title={`Members — ${membersFor.name}`} onClose={() => setMembersFor(null)}>
          <HouseholdMembers householdId={membersFor.id} onClose={() => setMembersFor(null)} />
        </Modal>
      )}
    </section>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border bg-[var(--bg-elevated)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
