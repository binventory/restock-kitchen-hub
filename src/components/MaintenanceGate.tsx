import { useEffect, useState } from "react";
import { useAppSetting } from "@/hooks/useAppSetting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const enabled = useAppSetting("maintenance_mode", "false");
  const message = useAppSetting("maintenance_mode_message", "We'll be back shortly.");
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return setIsAdmin(false);
    void supabase.rpc("is_admin", { _user_id: user.id }).then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  if (enabled === "true" && !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Down for maintenance</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
