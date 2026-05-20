import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { addShoppingItem } from "@/lib/services/shopping-service";
import { toast } from "sonner";

interface Props { householdId: string; userId: string; onSaved: () => void; }

export function CustomItemModal({ householdId, userId, onSaved }: Props) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("shopping-photos").upload(path, file);
    if (error) return toast.error("Upload failed");
    const { data } = supabase.storage.from("shopping-photos").createSignedUrl(path, 60 * 60 * 24 * 30);
    const signed = await data;
    setPhotoUrl(signed.data?.signedUrl ?? null);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await addShoppingItem({
      household_id: householdId,
      added_by: userId,
      custom_text: name.trim(),
      item_note: note.trim() || undefined,
      custom_image_url: photoUrl ?? undefined,
      needed_quantity: qty,
    });
    toast.success("Added to shopping list");
    onSaved();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Let your household know exactly what you need 🛒</p>
      <Input placeholder="e.g. Shampoo, Tomatoes..." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <Input placeholder="e.g. From DM · Get the blue one" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2 items-center">
        <label className="text-xs flex-1">
          Photo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
            className="block w-full text-xs"
          />
        </label>
        <label className="text-xs">
          Qty
          <Input type="number" min="1" value={qty} onChange={(e) => setQty(+e.target.value)} className="w-16" />
        </label>
      </div>
      {photoUrl && <img src={photoUrl} alt="" className="h-20 w-20 rounded object-cover" />}
      <Button onClick={() => void save()} disabled={!name.trim() || saving} className="w-full">
        Add to Shopping List
      </Button>
    </div>
  );
}
