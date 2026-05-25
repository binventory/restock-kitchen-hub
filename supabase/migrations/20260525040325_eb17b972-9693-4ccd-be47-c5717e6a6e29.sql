-- 1. Drop client-side approved-product insert policy
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;

-- 2. Offers: hide sponsor financial columns from non-admin clients
REVOKE SELECT (sponsor_paid_eur, sponsor_name) ON public.offers FROM authenticated, anon;

-- 3. Popup notifications: hide internal coupon_id
REVOKE SELECT (coupon_id) ON public.popup_notifications FROM authenticated, anon;

-- 4. Scanners: hide token column from regular SELECT (owners use get_scanner_token RPC)
REVOKE SELECT (token) ON public.scanners FROM authenticated, anon;

-- 5. user_prices: enforce household membership on INSERT
DROP POLICY IF EXISTS "own prices write" ON public.user_prices;
CREATE POLICY "own prices write" ON public.user_prices
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (household_id IS NULL OR public.is_household_member(auth.uid(), household_id))
  );