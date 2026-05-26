import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Setting {
  key: string;
  value: string | null;
  description: string | null;
  category: string | null;
}

const SECRET_HINTS = [
  "api_key", "secret", "private_key", "webhook_secret", "token",
];

export function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value, description, category")
      .order("category")
      .order("key");
    if (error) toast.error(error.message);
    setSettings((data ?? []) as Setting[]);
    setEdits({});
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(edits)) {
      const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
      if (error) {
        toast.error(`Failed: ${key}`);
      } else {
        await supabase.rpc("log_admin_action", {
          _action: "update_setting",
          _entity_type: "app_settings",
          _entity_id: key,
          _details: {},
        });
      }
    }
    toast.success("Settings saved");
    setSaving(false);
    void load();
  };

  const groups: Record<string, Setting[]> = {};
  for (const s of settings) {
    const c = s.category ?? "general";
    (groups[c] ??= []).push(s);
  }

  const editCount = Object.keys(edits).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={() => void save()} disabled={saving || editCount === 0}>
          <Save className="h-4 w-4" />
          Save {editCount > 0 && `(${editCount})`}
        </Button>
      </div>

      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {category}
          </h2>
          {items.map((s) => {
            const isSecret = SECRET_HINTS.some((k) => s.key.toLowerCase().includes(k));
            const showThis = !!showSecret[s.key];
            const current = edits[s.key] ?? s.value ?? "";
            return (
              <div key={s.key} className="space-y-1">
                <label className="text-sm font-medium">{s.key}</label>
                <div className="flex gap-2">
                  <Input
                    type={isSecret && !showThis ? "password" : "text"}
                    value={current}
                    onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                    placeholder={s.value ? "" : "—"}
                  />
                  {isSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret({ ...showSecret, [s.key]: !showThis })}
                    >
                      {showThis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
