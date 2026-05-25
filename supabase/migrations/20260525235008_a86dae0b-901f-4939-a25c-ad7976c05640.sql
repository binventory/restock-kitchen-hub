-- Add food_group column to user_products and indices on both tables.
ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS food_group text;

CREATE INDEX IF NOT EXISTS idx_user_products_food_group
  ON public.user_products(food_group)
  WHERE food_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_food_group
  ON public.products(food_group)
  WHERE food_group IS NOT NULL;

-- Additively seed product_groups.keywords with OFF food_group slugs
-- so the existing keyword matcher picks them up.
DO $$
BEGIN
  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'sugary snacks')
  WHERE lower(name) LIKE '%snack%' AND NOT ('sugary snacks' = ANY(keywords));

  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'milk and yogurt')
  WHERE (lower(name) LIKE '%dairy%' OR lower(name) LIKE '%milk%')
    AND NOT ('milk and yogurt' = ANY(keywords));

  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'fish and meat and eggs')
  WHERE (lower(name) LIKE '%meat%' OR lower(name) LIKE '%fish%')
    AND NOT ('fish and meat and eggs' = ANY(keywords));

  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'cereals and potatoes')
  WHERE (lower(name) LIKE '%cereal%' OR lower(name) LIKE '%pasta%'
         OR lower(name) LIKE '%bread%')
    AND NOT ('cereals and potatoes' = ANY(keywords));

  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'fruits and vegetables')
  WHERE (lower(name) LIKE '%fruit%' OR lower(name) LIKE '%vegetable%')
    AND NOT ('fruits and vegetables' = ANY(keywords));

  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'beverages')
  WHERE (lower(name) LIKE '%beverage%' OR lower(name) LIKE '%drink%')
    AND NOT ('beverages' = ANY(keywords));

  UPDATE public.product_groups
  SET keywords = array_append(keywords, 'fats and sauces')
  WHERE (lower(name) LIKE '%oil%' OR lower(name) LIKE '%sauce%')
    AND NOT ('fats and sauces' = ANY(keywords));
END $$;

-- Backfill existing inventory rows that have NULL section_id using
-- either product name or food_group keyword match.
DO $$
DECLARE
  inv RECORD;
  detected RECORD;
  product_name text;
  product_food_group text;
BEGIN
  FOR inv IN
    SELECT i.id, i.product_id, i.user_product_id
    FROM public.inventory i
    WHERE i.section_id IS NULL
  LOOP
    product_name := NULL;
    product_food_group := NULL;
    IF inv.product_id IS NOT NULL THEN
      SELECT name, food_group INTO product_name, product_food_group
      FROM public.products WHERE id = inv.product_id;
    ELSIF inv.user_product_id IS NOT NULL THEN
      SELECT name, food_group INTO product_name, product_food_group
      FROM public.user_products WHERE id = inv.user_product_id;
    END IF;

    IF product_name IS NULL AND product_food_group IS NULL THEN
      CONTINUE;
    END IF;

    FOR detected IN
      SELECT id AS group_id, section_id, keywords
      FROM public.product_groups
    LOOP
      IF EXISTS (
        SELECT 1 FROM unnest(detected.keywords) k
        WHERE (product_name IS NOT NULL
               AND position(lower(k) in lower(product_name)) > 0)
           OR (product_food_group IS NOT NULL
               AND position(lower(k) in lower(product_food_group)) > 0)
      ) THEN
        UPDATE public.inventory
        SET section_id = detected.section_id,
            product_group_id = detected.group_id
        WHERE id = inv.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;