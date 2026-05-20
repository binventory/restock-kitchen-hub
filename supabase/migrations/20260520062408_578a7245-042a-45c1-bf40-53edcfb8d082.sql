
-- ===== ENUMS =====
CREATE TYPE product_source AS ENUM ('openfoodfacts', 'user', 'admin_approved');
CREATE TYPE nutriscore_grade AS ENUM ('A','B','C','D','E');
CREATE TYPE ecoscore_grade AS ENUM ('A','B','C','D','E');
CREATE TYPE inventory_unit AS ENUM ('pieces','liters','grams','kg','ml','cartons','bottles');
CREATE TYPE user_product_status AS ENUM ('local_only','pending_approval','approved','declined');
CREATE TYPE order_status AS ENUM ('pending','paid','processing','shipped','delivered','cancelled');
CREATE TYPE subscription_status AS ENUM ('active','past_due','cancelled','trialing');
CREATE TYPE theme_mode AS ENUM ('light','dark','system');
CREATE TYPE language_code AS ENUM ('en','ar','de');
CREATE TYPE admin_role AS ENUM ('super_admin','moderator','support');

-- ===== UPDATED_AT TRIGGER FN =====
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== TABLES =====
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);
CREATE INDEX idx_hm_user ON public.household_members(user_id);
CREATE INDEX idx_hm_household ON public.household_members(household_id);

CREATE TABLE public.household_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  accepted boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scanners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme theme_mode NOT NULL DEFAULT 'system',
  language language_code NOT NULL DEFAULT 'en',
  show_halal_check boolean NOT NULL DEFAULT true,
  show_health_warnings boolean NOT NULL DEFAULT true,
  show_nutriscore boolean NOT NULL DEFAULT true,
  show_calories boolean NOT NULL DEFAULT true,
  show_allergens boolean NOT NULL DEFAULT true,
  show_ingredients boolean NOT NULL DEFAULT false,
  show_nova_group boolean NOT NULL DEFAULT true,
  show_ecoscore boolean NOT NULL DEFAULT false,
  show_available_stores boolean NOT NULL DEFAULT true,
  show_nutrition_table boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  push_subscription_json text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_health_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_diabetic boolean NOT NULL DEFAULT false,
  has_heart_condition boolean NOT NULL DEFAULT false,
  is_celiac boolean NOT NULL DEFAULT false,
  is_lactose_intolerant boolean NOT NULL DEFAULT false,
  allergens_to_avoid text[] NOT NULL DEFAULT '{}',
  halal_only boolean NOT NULL DEFAULT false,
  vegetarian boolean NOT NULL DEFAULT false,
  vegan boolean NOT NULL DEFAULT false,
  diet_mode text,
  calorie_goal_per_day integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE,
  name text NOT NULL,
  brand text, generic_name text, category text,
  categories_tags text[] DEFAULT '{}',
  food_group text, product_type text, image_url text,
  quantity_value numeric, quantity_unit text,
  nutriscore nutriscore_grade, ecoscore ecoscore_grade, nova_group integer,
  calories_100g numeric, fat_100g numeric, saturated_fat_100g numeric,
  carbohydrates_100g numeric, sugars_100g numeric, proteins_100g numeric,
  salt_100g numeric, fiber_100g numeric,
  serving_size_g numeric, calories_serving numeric,
  allergens text[] DEFAULT '{}', traces_allergens text[] DEFAULT '{}',
  labels text[] DEFAULT '{}',
  is_vegan boolean, is_vegetarian boolean, is_gluten_free boolean,
  has_palm_oil boolean, halal_certified boolean,
  ingredients_text text, ingredients_analysis text[] DEFAULT '{}',
  nutrient_levels jsonb, available_stores text[] DEFAULT '{}',
  source product_source NOT NULL DEFAULT 'openfoodfacts',
  is_approved boolean NOT NULL DEFAULT false,
  submitted_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_barcode ON public.products(barcode);

CREATE TABLE public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text,
  name text NOT NULL,
  brand text, generic_name text, category text,
  image_url text,
  quantity_value numeric, quantity_unit text,
  nutriscore nutriscore_grade, ecoscore ecoscore_grade, nova_group integer,
  calories_100g numeric, fat_100g numeric, sugars_100g numeric,
  proteins_100g numeric, salt_100g numeric,
  allergens text[] DEFAULT '{}',
  is_vegan boolean, is_vegetarian boolean, is_gluten_free boolean,
  halal_certified boolean,
  ingredients_text text,
  user_id uuid NOT NULL,
  user_photo_url text,
  submission_status user_product_status NOT NULL DEFAULT 'local_only',
  admin_note text,
  supermarket text, price numeric, currency text,
  expiry_date date, status_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rejected_forever_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  name text,
  rejected_by_admin_id uuid,
  rejection_reason text,
  rejected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  name text NOT NULL, emoji text,
  keywords text[] NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  user_product_id uuid REFERENCES public.user_products(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 0,
  limit_threshold numeric NOT NULL DEFAULT 1,
  unit inventory_unit NOT NULL DEFAULT 'pieces',
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  product_group_id uuid REFERENCES public.product_groups(id) ON DELETE SET NULL,
  expiry_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_one_product CHECK (
    (product_id IS NOT NULL AND user_product_id IS NULL) OR
    (product_id IS NULL AND user_product_id IS NOT NULL)
  )
);
CREATE INDEX idx_inv_household ON public.inventory(household_id);

CREATE TABLE public.shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  user_product_id uuid REFERENCES public.user_products(id) ON DELETE SET NULL,
  custom_text text, custom_image_url text, item_note text,
  needed_quantity integer NOT NULL DEFAULT 1,
  bought_quantity integer NOT NULL DEFAULT 0,
  is_checked boolean NOT NULL DEFAULT false,
  added_automatically boolean NOT NULL DEFAULT false,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sl_household ON public.shopping_list(household_id);

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  max_scanners integer NOT NULL DEFAULT 1,
  max_households integer NOT NULL DEFAULT 1,
  max_household_members integer NOT NULL DEFAULT 3,
  ai_assistant_enabled boolean NOT NULL DEFAULT false,
  ai_requests_per_month integer NOT NULL DEFAULT 0,
  delivery_integration_enabled boolean NOT NULL DEFAULT false,
  halal_filter_enabled boolean NOT NULL DEFAULT true,
  health_profile_enabled boolean NOT NULL DEFAULT false,
  diet_mode_enabled boolean NOT NULL DEFAULT false,
  expiry_alerts_enabled boolean NOT NULL DEFAULT false,
  price_comparison_enabled boolean NOT NULL DEFAULT false,
  ads_shown boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  billing_period text,
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_price_id text,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_user ON public.subscriptions(user_id);

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'percent',
  percent_off integer, amount_off numeric, free_days integer,
  plan_id uuid REFERENCES public.plans(id),
  max_uses integer, uses_count integer NOT NULL DEFAULT 0,
  stripe_coupon_id text,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  show_as_popup boolean NOT NULL DEFAULT false,
  popup_title text, popup_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code text NOT NULL,
  coupon_id uuid REFERENCES public.coupons(id),
  referrer_reward_coupon_id uuid REFERENCES public.coupons(id),
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scanner_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  scanner_color text,
  status order_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text, stripe_session_id text,
  full_name text, address1 text, address2 text, city text,
  postal_code text, country text, phone text,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scanner_config_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number integer NOT NULL,
  step_name text NOT NULL,
  qr_payload text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  household_id uuid,
  request_type text,
  tokens_input integer, tokens_output integer, tokens_total integer,
  cost_usd numeric, model text, provider text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bonus_requests integer NOT NULL DEFAULT 0,
  granted_by_admin_id uuid,
  valid_month text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  user_product_id uuid REFERENCES public.user_products(id) ON DELETE SET NULL,
  supermarket text, price numeric, currency text,
  location_city text, location_country text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_group_id uuid REFERENCES public.product_groups(id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  offer_type text, discount_value numeric, coupon_code text,
  supermarket text,
  target_plans text[] DEFAULT '{}',
  sponsor_name text, sponsor_paid_eur numeric,
  starts_at timestamptz, ends_at timestamptz,
  max_views integer, max_clicks integer,
  views_count integer NOT NULL DEFAULT 0,
  clicks_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.offer_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid, viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.offer_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid, clicked_at timestamptz NOT NULL DEFAULT now(),
  revealed_coupon boolean NOT NULL DEFAULT false
);

CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, image_url text,
  cta_text text, cta_url text,
  advertiser_name text, ad_type text,
  target_product_groups text[] DEFAULT '{}',
  target_sections text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid, household_id uuid,
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid, clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.popup_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, message text,
  type text, coupon_id uuid REFERENCES public.coupons(id),
  referral_link_enabled boolean NOT NULL DEFAULT false,
  target_plan text, is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.popup_seen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  popup_id uuid NOT NULL REFERENCES public.popup_notifications(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  url text, display_name text, icon_name text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  category text,
  is_secret boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  role admin_role NOT NULL DEFAULT 'support',
  granted_by uuid,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text, target_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  file_url text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.scanner_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner_token_hash text NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  anonymous_id text,
  essential boolean NOT NULL DEFAULT true,
  analytics boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
