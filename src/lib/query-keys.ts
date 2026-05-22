// Centralized TanStack Query keys.
// Use these everywhere so writes can invalidate reads consistently.

export const qk = {
  inventory: (householdId: string) => ["inventory", householdId] as const,
  inventoryList: (
    householdId: string,
    params: { search: string; sort: string; filter: string; pageSize: number },
  ) => ["inventory", householdId, "list", params] as const,
  lowStock: (householdId: string) => ["inventory", householdId, "low-stock"] as const,

  shopping: (householdId: string) => ["shopping", householdId] as const,

  householdMembers: (householdId: string) => ["household-members", householdId] as const,
  households: () => ["households"] as const,
};
