-- A1) offers_public view
DROP VIEW IF EXISTS public.offers_public CASCADE;
CREATE VIEW public.offers_public
WITH (security_invoker = true) AS
SELECT
  id, title, description, image_url, product_id, product_group_id,
  section_id, offer_type, discount_value, supermarket, target_plans,
  starts_at, ends_at, max_views, max_clicks, views_count, clicks_count
FROM public.offers
WHERE is_active = true
  AND (ends_at IS NULL OR ends_at > now())
  AND (starts_at IS NULL OR starts_at <= now());

GRANT SELECT ON public.offers_public TO authenticated, anon;

-- A2) Drop broad offers policies
DROP POLICY IF EXISTS "read active offers" ON public.offers;
DROP POLICY IF EXISTS "admins read all offers" ON public.offers;

CREATE POLICY "admins read all offers" ON public.offers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- A3) popup_notifications_public view
DROP POLICY IF EXISTS "read active popups" ON public.popup_notifications;

DROP VIEW IF EXISTS public.popup_notifications_public CASCADE;
CREATE VIEW public.popup_notifications_public
WITH (security_invoker = true) AS
SELECT
  id, title, message, type, coupon_id, referral_link_enabled,
  target_plan, starts_at, ends_at, is_active
FROM public.popup_notifications
WHERE is_active = true
  AND (ends_at IS NULL OR ends_at > now())
  AND (starts_at IS NULL OR starts_at <= now());

GRANT SELECT ON public.popup_notifications_public TO authenticated;

CREATE POLICY "admins read all popups" ON public.popup_notifications
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- A4) SECURITY DEFINER ingest function, replaces OFF insert policy
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;

CREATE OR REPLACE FUNCTION public.ingest_off_product(_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _barcode text;
  _id uuid;
  _existing uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _barcode := _payload->>'barcode';
  IF _barcode IS NULL OR length(_barcode) < 4 THEN
    RAISE EXCEPTION 'Invalid barcode';
  END IF;

  SELECT id INTO _existing
  FROM public.products
  WHERE barcode = _barcode AND is_approved = true
  LIMIT 1;
  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  INSERT INTO public.products (
    barcode, name, brand, generic_name, category, food_group,
    image_url, quantity_value, quantity_unit, calories_100g,
    fat_100g, saturated_fat_100g, carbohydrates_100g, sugars_100g,
    proteins_100g, salt_100g, fiber_100g, serving_size_g,
    calories_serving, nutriscore, ecoscore, nova_group,
    nutrient_levels, allergens, traces_allergens, labels,
    is_vegan, is_vegetarian, is_gluten_free, has_palm_oil,
    halal_certified, ingredients_text, ingredients_analysis,
    available_stores, source, is_approved, submitted_by_user_id
  )
  VALUES (
    _barcode,
    _payload->>'name',
    _payload->>'brand',
    _payload->>'generic_name',
    _payload->>'category',
    _payload->>'food_group',
    _payload->>'image_url',
    (_payload->>'quantity_value')::numeric,
    _payload->>'quantity_unit',
    (_payload->>'calories_100g')::numeric,
    (_payload->>'fat_100g')::numeric,
    (_payload->>'saturated_fat_100g')::numeric,
    (_payload->>'carbohydrates_100g')::numeric,
    (_payload->>'sugars_100g')::numeric,
    (_payload->>'proteins_100g')::numeric,
    (_payload->>'salt_100g')::numeric,
    (_payload->>'fiber_100g')::numeric,
    (_payload->>'serving_size_g')::numeric,
    (_payload->>'calories_serving')::numeric,
    (_payload->>'nutriscore')::nutri_grade,
    (_payload->>'ecoscore')::nutri_grade,
    (_payload->>'nova_group')::integer,
    (_payload->'nutrient_levels')::jsonb,
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'allergens', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'traces_allergens', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'labels', '[]'::jsonb))),
    (_payload->>'is_vegan')::boolean,
    (_payload->>'is_vegetarian')::boolean,
    (_payload->>'is_gluten_free')::boolean,
    (_payload->>'has_palm_oil')::boolean,
    (_payload->>'halal_certified')::boolean,
    _payload->>'ingredients_text',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'ingredients_analysis', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'available_stores', '[]'::jsonb))),
    'openfoodfacts',
    true,
    NULL
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ingest_off_product(jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ingest_off_product(jsonb)
  TO authenticated;