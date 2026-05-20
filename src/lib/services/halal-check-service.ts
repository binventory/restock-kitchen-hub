import type { ResolvedProduct, HalalStatus, IngredientCheck } from "@/lib/types/product";

const HARAM = ["pork", "pig", "swine", "bacon", "ham", "lard", "carmine", "e120", "e441", "e542"];
const ALCOHOL = ["wine", "beer", "alcohol", "ethanol", "spirits", "liqueur", "rum", "whiskey", "vodka"];
const UNCLEAR = ["flavouring", "flavoring", "aroma", "arôme", "natural flavour", "e471", "e472", "emulsifier"];

function findMatches(text: string, words: string[]): string[] {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(w));
}

export function getHalalStatus(product: ResolvedProduct): HalalStatus {
  const ingredients: IngredientCheck[] = [];
  const text = (product.ingredients_text ?? "") + " " + product.allergens.join(" ");

  if (product.halal_certified === true) {
    return {
      status: "certified",
      summary: "Halal certified ✅",
      ingredients: [],
    };
  }

  // Gelatin: check unless fish gelatin
  const lower = text.toLowerCase();
  const hasGelatin = lower.includes("gelatin") || lower.includes("gelatine");
  const isFishGelatin = lower.includes("fish gelatin") || lower.includes("fish gelatine");

  const haramFound = findMatches(text, HARAM);
  if (hasGelatin && !isFishGelatin) haramFound.push("gelatin");

  if (haramFound.length > 0) {
    haramFound.forEach((h) =>
      ingredients.push({ name: h, status: "haram", reason: "Haram ingredient" }),
    );
    return { status: "haram", summary: "Contains haram 🚫", ingredients };
  }

  const alcoholFound = findMatches(text, ALCOHOL);
  if (alcoholFound.length > 0) {
    alcoholFound.forEach((h) =>
      ingredients.push({ name: h, status: "haram", reason: "Alcohol" }),
    );
    return { status: "haram", summary: "Contains alcohol 🚫", ingredients };
  }

  const unclearFound = findMatches(text, UNCLEAR);
  if (unclearFound.length > 0) {
    unclearFound.forEach((h) =>
      ingredients.push({ name: h, status: "unclear", reason: "Source unclear" }),
    );
    return {
      status: "unclear",
      summary: "Status unclear — flavourings present ❓",
      ingredients,
    };
  }

  return {
    status: "halal",
    summary: "No haram ingredients found ✅",
    ingredients: [{ name: "ingredients", status: "ok", reason: "No obvious haram detected" }],
  };
}
