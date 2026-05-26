import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChefHat, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";

export function CookScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [diet, setDiet] = useState("any");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<{
    text: string;
    used: number;
    quota: number;
  } | null>(null);

  const submit = async () => {
    if (!session?.access_token) {
      toast.error("Please sign in");
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error("Tell me what you want to cook");
      return;
    }
    setLoading(true);
    setRecipe(null);
    try {
      const supaUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
      const res = await fetch(`${supaUrl}/functions/v1/ai-cook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          diet: diet === "any" ? undefined : diet,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI failed");
        return;
      }
      setRecipe({ text: data.recipe, used: data.used, quota: data.quota });
    } catch {
      toast.error("Could not reach AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">AI Cook</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tell me what you'd like to cook. I'll suggest recipes using what's in
          your stock.
        </p>
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Something warm and easy for tonight..."
            rows={3}
            maxLength={500}
          />
          <Select value={diet} onValueChange={setDiet}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any diet</SelectItem>
              <SelectItem value="halal">Halal</SelectItem>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="gluten_free">Gluten-free</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => void submit()}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Cook with what I have
              </>
            )}
          </Button>
        </div>
        {recipe && (
          <div className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Recipe suggestions</span>
              <span>
                {recipe.used}/{recipe.quota} this month
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {recipe.text}
            </pre>
          </div>
        )}
      </div>
    </AppShell>
  );
}
