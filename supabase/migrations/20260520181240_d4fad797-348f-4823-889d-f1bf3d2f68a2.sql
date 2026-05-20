
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plans_slug_key') THEN
    ALTER TABLE public.plans ADD CONSTRAINT plans_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sections_name_key') THEN
    ALTER TABLE public.sections ADD CONSTRAINT sections_name_key UNIQUE (name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_settings_key_key') THEN
    ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_key_key UNIQUE (key);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='social_links_platform_key') THEN
    ALTER TABLE public.social_links ADD CONSTRAINT social_links_platform_key UNIQUE (platform);
  END IF;
END $$;

-- Dedupe cookie_consents per user_id (keep most recent)
DELETE FROM public.cookie_consents a
USING public.cookie_consents b
WHERE a.user_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.accepted_at < b.accepted_at;

CREATE UNIQUE INDEX IF NOT EXISTS cookie_consents_user_id_uidx
  ON public.cookie_consents (user_id)
  WHERE user_id IS NOT NULL;

INSERT INTO public.plans (slug, name, price_monthly, price_yearly, max_scanners, max_households, max_household_members, ai_assistant_enabled, ai_requests_per_month, halal_filter_enabled, health_profile_enabled, diet_mode_enabled, expiry_alerts_enabled, price_comparison_enabled, ads_shown, display_order)
VALUES
  ('free','Free',0,0,1,2,3,false,0,true,false,false,false,false,true,1),
  ('starter','Starter',2.99,25,2,3,5,true,50,true,false,false,false,true,false,2),
  ('pro','Pro',3.99,33,5,5,10,true,200,true,true,true,true,true,false,3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.sections (name, emoji, sort_order) VALUES
  ('Food','🥩',1),('Drinks','🥤',2),('Dairy','🥛',3),('Vegetables','🥦',4),
  ('Fruits','🍎',5),('Bakery','🥖',6),('Frozen','🧊',7),('Snacks','🍫',8),
  ('Condiments','🫙',9),('Personal Care','🧴',10),('Cleaning','🧹',11),
  ('Pet Food','🐾',12),('Health','💊',13),('Other','📦',14)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.app_settings (key, value, is_secret) VALUES
  ('app_name','Restock',false),
  ('app_tagline','Your kitchen, smarter.',false),
  ('maintenance_mode','false',false),
  ('maintenance_mode_message','We will be back shortly.',false),
  ('support_mode','email',false),
  ('support_email','',false),
  ('support_form_url','',false),
  ('ai_provider','groq',false),
  ('ai_provider_url','https://api.groq.com/openai/v1/chat/completions',false),
  ('ai_model','llama-4-scout-17b-16e-instruct',false),
  ('openfoodfacts_api_url','https://world.openfoodfacts.net/api/v2/product',false),
  ('scanner_unit_price','29.99',false),
  ('scanner_currency','EUR',false),
  ('scanner_stock_status','in_stock',false),
  ('scanner_delivery_estimate','5-7 business days',false),
  ('scanner_colors','["Black","White","Green"]',false),
  ('free_trial_days','14',false),
  ('referral_reward_days','30',false),
  ('marktguru_affiliate_url','https://www.marktguru.de',false),
  ('resend_api_key','',true),
  ('ai_provider_api_key','',true),
  ('stripe_secret_key','',true),
  ('stripe_publishable_key','',true),
  ('stripe_webhook_secret','',true),
  ('vapid_public_key','',true),
  ('vapid_private_key','',true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.social_links (platform, display_name, url, is_active, sort_order) VALUES
  ('instagram','Instagram',NULL,false,1),
  ('twitter','X / Twitter',NULL,false,2),
  ('facebook','Facebook',NULL,false,3),
  ('youtube','YouTube',NULL,false,4),
  ('tiktok','TikTok',NULL,false,5),
  ('whatsapp','WhatsApp',NULL,false,6)
ON CONFLICT (platform) DO NOTHING;
