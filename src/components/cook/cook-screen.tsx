import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChefHat, Sparkles, Loader2, ChevronDown } from "lucide-react";
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

  const runRequest = async (text: string) => {
    if (!session?.access_token) {
      toast.error("Please sign in");
      return;
    }
    if (text.trim().length < 3) {
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
          prompt: text.trim(),
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
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-primary" />
          <h1 className="text-4xl sm:text-5xl tracking-tight leading-none">
            <span className="font-semibold">{t("cook.title")}</span>{" "}
            <span className="font-display italic text-primary">
              {t("cook.titleAccent", { defaultValue: "" })}
            </span>
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tap one button. I'll suggest recipes using what's in your stock.
        </p>

        <div className="space-y-3">
          {/* PRIMARY: one-tap cook */}
          <Button
            onClick={() => void runRequest("Suggest 3 recipes using my stock")}
            disabled={loading}
            size="lg"
            className="w-full h-14 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Cook with what I have
              </>
            )}
          </Button>

          {/* Diet filter */}
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
              <SelectItem value="low_fat">Low fat</SelectItem>
              <SelectItem value="low_sugar">Low sugar</SelectItem>
              <SelectItem value="keto">Keto</SelectItem>
            </SelectContent>
          </Select>

          <details className="rounded-xl border bg-card">
            <summary className="cursor-pointer select-none p-3 text-sm font-medium flex items-center justify-between">
              Or give me specific instructions
              <ChevronDown className="h-4 w-4" />
            </summary>
            <div className="p-3 pt-0 space-y-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I want Asian food / Egyptian / something quick..."
                rows={3}
                maxLength={500}
              />
              <Button
                variant="outline"
                onClick={() => void runRequest(prompt)}
                disabled={loading || prompt.trim().length < 3}
                className="w-full"
              >
                Get custom suggestion
              </Button>
            </div>
          </details>
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
