const BASE: Record<string, number> = {
  milk: 2, water: 3, coffee: 0.5, tea: 0.5,
  eggs: 3, bread: 1, yogurt: 2, butter: 0.25,
  cheese: 1, pasta: 0.5, rice: 0.5, oil: 0.25,
  shampoo: 0.1, soap: 0.1, "toilet paper": 1,
};

export function suggestLimit(
  householdSize: number,
  productGroupKeywords: string[],
  productName: string,
): number {
  const haystack = (productName + " " + productGroupKeywords.join(" ")).toLowerCase();
  let base = 1;
  for (const [key, val] of Object.entries(BASE)) {
    if (haystack.includes(key)) {
      base = val;
      break;
    }
  }
  const weekly = base * Math.max(1, householdSize);
  return Math.max(1, Math.ceil(weekly / 2));
}
