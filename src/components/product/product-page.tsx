import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ResolvedProduct, UserHealthProfile } from "@/lib/types/product";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { getHealthProfile } from "@/lib/services/health-profile-service";
import { ProductHeader } from "./product-header";
import { ProductNutriscoreCard } from "./product-nutriscore-card";
import { ProductNutritionTable } from "./product-nutrition-table";
import { ProductAllergensSection } from "./product-allergens-section";
import { ProductHalalSection } from "./product-halal-section";
import { ProductHealthWarnings } from "./product-health-warnings";
import { ProductInventoryControls } from "./product-inventory-controls";
import { ProductShoppingSection } from "./product-shopping-section";

interface Props {
  product: ResolvedProduct;
  onClose: () => void;
}

export function ProductPage({ product, onClose }: Props) {
  const { user } = useAuth();
  const { current } = useHousehold();
  const [profile, setProfile] = useState<UserHealthProfile | null>(null);

  useEffect(() => {
    if (user) void getHealthProfile(user.id).then(setProfile);
  }, [user]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-4 space-y-4">
          <ProductHeader product={product} />
          <ProductNutriscoreCard product={product} />
          <ProductNutritionTable product={product} />
          <ProductAllergensSection product={product} />
          <ProductHalalSection product={product} />
          {profile && <ProductHealthWarnings product={product} profile={profile} />}
          {current && <ProductInventoryControls product={product} householdId={current.id} />}
          {current && user && (
            <ProductShoppingSection product={product} householdId={current.id} userId={user.id} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
