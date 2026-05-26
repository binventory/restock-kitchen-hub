DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;
CREATE POLICY "openfoodfacts insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    source = 'openfoodfacts'
    AND is_approved = true
    AND submitted_by_user_id IS NULL
  );