-- 1. Re-create OpenFoodFacts insert policy on products
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;
CREATE POLICY "openfoodfacts insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    source = 'openfoodfacts'
    AND is_approved = true
    AND submitted_by_user_id IS NULL
  );

-- 2. Dedupe inventory rows: sum quantities into oldest, delete rest
WITH ranked AS (
  SELECT id,
    SUM(quantity) OVER (
      PARTITION BY household_id,
                   COALESCE(product_id::text,'')||'|'||
                   COALESCE(user_product_id::text,'')
    ) AS total_qty,
    ROW_NUMBER() OVER (
      PARTITION BY household_id,
                   COALESCE(product_id::text,'')||'|'||
                   COALESCE(user_product_id::text,'')
      ORDER BY created_at ASC
    ) AS rn
  FROM public.inventory
)
UPDATE public.inventory i
SET quantity = r.total_qty
FROM ranked r
WHERE i.id = r.id AND r.rn = 1;

DELETE FROM public.inventory WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY household_id,
                   COALESCE(product_id::text,'')||'|'||
                   COALESCE(user_product_id::text,'')
      ORDER BY created_at ASC
    ) AS rn FROM public.inventory
  ) s WHERE rn > 1
);

-- 3. Dedupe unchecked shopping_list rows
DELETE FROM public.shopping_list WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY household_id,
                   COALESCE(product_id::text,'')||'|'||
                   COALESCE(user_product_id::text,'')
      ORDER BY created_at ASC
    ) AS rn
    FROM public.shopping_list
    WHERE is_checked = false AND custom_text IS NULL
  ) s WHERE rn > 1
);

-- 4. Partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS inventory_unique_product
  ON public.inventory (household_id, product_id)
  WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_unique_user_product
  ON public.inventory (household_id, user_product_id)
  WHERE user_product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS shopping_unique_product
  ON public.shopping_list (household_id, product_id)
  WHERE product_id IS NOT NULL AND is_checked = false;
CREATE UNIQUE INDEX IF NOT EXISTS shopping_unique_user_product
  ON public.shopping_list (household_id, user_product_id)
  WHERE user_product_id IS NOT NULL AND is_checked = false;

-- 5. Merge duplicate user_products sharing a barcode within a household
WITH duplicates AS (
  SELECT
    up.id,
    up.barcode,
    up.user_id,
    hm.household_id,
    ROW_NUMBER() OVER (
      PARTITION BY hm.household_id, up.barcode
      ORDER BY up.created_at ASC
    ) AS rn,
    FIRST_VALUE(up.id) OVER (
      PARTITION BY hm.household_id, up.barcode
      ORDER BY up.created_at ASC
    ) AS keeper_id
  FROM public.user_products up
  JOIN public.household_members hm ON hm.user_id = up.user_id
  WHERE up.barcode IS NOT NULL
),
to_merge AS (
  SELECT id, keeper_id FROM duplicates WHERE rn > 1
)
UPDATE public.inventory i
SET user_product_id = m.keeper_id
FROM to_merge m
WHERE i.user_product_id = m.id
  AND NOT EXISTS (
    SELECT 1 FROM public.inventory i2
    WHERE i2.household_id = i.household_id
      AND i2.user_product_id = m.keeper_id
      AND i2.id <> i.id
  );

DELETE FROM public.inventory i
WHERE EXISTS (
  SELECT 1 FROM (
    SELECT up.id, FIRST_VALUE(up.id) OVER (
      PARTITION BY hm.household_id, up.barcode
      ORDER BY up.created_at ASC
    ) AS keeper_id,
    ROW_NUMBER() OVER (
      PARTITION BY hm.household_id, up.barcode
      ORDER BY up.created_at ASC
    ) AS rn
    FROM public.user_products up
    JOIN public.household_members hm ON hm.user_id = up.user_id
    WHERE up.barcode IS NOT NULL
  ) m
  WHERE m.rn > 1 AND i.user_product_id = m.id
);

DELETE FROM public.user_products
WHERE id IN (
  SELECT id FROM (
    SELECT up.id,
      ROW_NUMBER() OVER (
        PARTITION BY hm.household_id, up.barcode
        ORDER BY up.created_at ASC
      ) AS rn
    FROM public.user_products up
    JOIN public.household_members hm ON hm.user_id = up.user_id
    WHERE up.barcode IS NOT NULL
  ) s WHERE rn > 1
);

-- 6. Verify
DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT household_id, product_id, user_product_id, COUNT(*)
    FROM public.inventory
    GROUP BY household_id, product_id, user_product_id
    HAVING COUNT(*) > 1
  ) s;
  IF dup_count > 0 THEN
    RAISE WARNING 'Inventory still has % duplicate groups after migration', dup_count;
  END IF;
END $$;