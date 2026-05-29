
-- ===== HELPER FUNCTIONS =====
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = _user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS admin_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.admin_team WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT (permissions->>_permission)::boolean FROM public.admin_team WHERE user_id = _user_id),
    false
  ) OR public.is_admin(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_household_member(_user_id uuid, _household_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = _user_id AND household_id = _household_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_household_owner(_user_id uuid, _household_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.households
    WHERE id = _household_id AND created_by = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.create_household(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hid uuid; _uid uuid := auth.uid(); _has_default boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.households (name, created_by) VALUES (_name, _uid) RETURNING id INTO _hid;
  SELECT EXISTS(SELECT 1 FROM public.household_members WHERE user_id = _uid AND is_default) INTO _has_default;
  INSERT INTO public.household_members (household_id, user_id, role, is_default)
  VALUES (_hid, _uid, 'owner', NOT _has_default);
  RETURN _hid;
END; $$;

CREATE OR REPLACE FUNCTION public.accept_invite(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hid uuid; _uid uuid := auth.uid(); _has_default boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT household_id INTO _hid FROM public.household_invites
  WHERE token = _token AND NOT accepted LIMIT 1;
  IF _hid IS NULL THEN RAISE EXCEPTION 'Invalid or used invite'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.household_members WHERE user_id = _uid AND is_default) INTO _has_default;
  INSERT INTO public.household_members (household_id, user_id, role, is_default)
  VALUES (_hid, _uid, 'member', NOT _has_default)
  ON CONFLICT (household_id, user_id) DO NOTHING;
  UPDATE public.household_invites SET accepted = true WHERE token = _token;
  RETURN _hid;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_own_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.scanner_orders SET status='cancelled', updated_at=now()
  WHERE id=_order_id AND user_id=auth.uid() AND status IN ('pending','paid');
END; $$;

CREATE OR REPLACE FUNCTION public.request_data_export(_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() != _user_id THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.data_export_requests (user_id, status) VALUES (_user_id, 'pending') RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  -- Delete households where user is sole owner
  DELETE FROM public.households WHERE created_by=_uid AND id IN (
    SELECT household_id FROM public.household_members
    GROUP BY household_id HAVING COUNT(*)=1
  );
  DELETE FROM auth.users WHERE id=_uid;
END; $$;

-- ===== HANDLE NEW USER =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _free_id uuid;
BEGIN
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_health_profile (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  SELECT id INTO _free_id FROM public.plans WHERE slug='free' LIMIT 1;
  IF _free_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status) VALUES (NEW.id, _free_id, 'active');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== UPDATED_AT TRIGGERS =====
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tg_set_updated_at ON public.%I', r.table_name);
    EXECUTE format('CREATE TRIGGER tg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', r.table_name);
  END LOOP;
END $$;

-- ===== USER PRODUCTS PROTECT TRIGGER =====
CREATE OR REPLACE FUNCTION public.tg_user_products_protect_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    IF NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
      RAISE EXCEPTION 'Cannot modify admin_note';
    END IF;
    IF NEW.submission_status IS DISTINCT FROM OLD.submission_status THEN
      IF NOT (OLD.submission_status='local_only' AND NEW.submission_status='pending_approval') THEN
        RAISE EXCEPTION 'Invalid status transition';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER tg_user_products_protect BEFORE UPDATE ON public.user_products
FOR EACH ROW EXECUTE FUNCTION public.tg_user_products_protect_admin_fields();

-- ===== ENABLE RLS ON ALL TABLES =====
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename); END LOOP;
END $$;

-- ===== RLS POLICIES =====
-- households
CREATE POLICY "members read households" ON public.households FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), id));
CREATE POLICY "auth create households" ON public.households FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "owner update households" ON public.households FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "owner delete households" ON public.households FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- household_members
CREATE POLICY "read own memberships" ON public.household_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_household_member(auth.uid(), household_id));
CREATE POLICY "insert own membership" ON public.household_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_household_owner(auth.uid(), household_id));
CREATE POLICY "update own membership" ON public.household_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_household_owner(auth.uid(), household_id));
CREATE POLICY "delete own membership" ON public.household_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_household_owner(auth.uid(), household_id));

-- household_invites
CREATE POLICY "owner manage invites" ON public.household_invites FOR ALL TO authenticated
  USING (public.is_household_owner(auth.uid(), household_id))
  WITH CHECK (public.is_household_owner(auth.uid(), household_id) AND created_by = auth.uid());

-- scanners
CREATE POLICY "members read scanners" ON public.scanners FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), household_id));
CREATE POLICY "members manage scanners" ON public.scanners FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- user_preferences
CREATE POLICY "own prefs" ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_health_profile
CREATE POLICY "own health" ON public.user_health_profile FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- products
CREATE POLICY "approved products readable" ON public.products FOR SELECT TO authenticated
  USING (is_approved = true OR submitted_by_user_id = auth.uid());
CREATE POLICY "openfoodfacts insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (source='openfoodfacts' AND is_approved=true AND submitted_by_user_id IS NULL);
CREATE POLICY "user submit product" ON public.products FOR INSERT TO authenticated
  WITH CHECK (source='user' AND is_approved=false AND submitted_by_user_id = auth.uid());

-- user_products
CREATE POLICY "own user_products read" ON public.user_products FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "own user_products insert" ON public.user_products FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own user_products update" ON public.user_products FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "own user_products delete" ON public.user_products FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- rejected_forever_products
CREATE POLICY "auth read rejected" ON public.rejected_forever_products FOR SELECT TO authenticated USING (true);

-- sections / product_groups
CREATE POLICY "auth read sections" ON public.sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read groups" ON public.product_groups FOR SELECT TO authenticated USING (true);

-- inventory
CREATE POLICY "members read inv" ON public.inventory FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), household_id));
CREATE POLICY "members write inv" ON public.inventory FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- shopping_list
CREATE POLICY "members read sl" ON public.shopping_list FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), household_id));
CREATE POLICY "members write sl" ON public.shopping_list FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- plans (read by all authenticated)
CREATE POLICY "read active plans" ON public.plans FOR SELECT TO authenticated USING (is_active = true);

-- subscriptions (read own)
CREATE POLICY "read own subs" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- coupons (read active)
CREATE POLICY "read active coupons" ON public.coupons FOR SELECT TO authenticated USING (active = true);

-- referrals
CREATE POLICY "own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

-- scanner_orders
CREATE POLICY "own orders read" ON public.scanner_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own orders insert" ON public.scanner_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- scanner_config_steps
CREATE POLICY "auth read steps" ON public.scanner_config_steps FOR SELECT TO authenticated USING (is_active);

-- ai_usage
CREATE POLICY "own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own ai overrides" ON public.ai_usage_overrides FOR SELECT TO authenticated USING (user_id = auth.uid());

-- user_prices
CREATE POLICY "members read prices" ON public.user_prices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND public.is_household_member(auth.uid(), household_id)));
CREATE POLICY "own prices write" ON public.user_prices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- offers / ads (read active)
-- "read active offers" policy is defined in a later migration
-- with column-level grants that hide sensitive columns.
CREATE POLICY "insert offer view" ON public.offer_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "insert offer click" ON public.offer_clicks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read active ads" ON public.ads FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "insert ad impression" ON public.ad_impressions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "insert ad click" ON public.ad_clicks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- popups
CREATE POLICY "read active popups" ON public.popup_notifications FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "own popup seen" ON public.popup_seen FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- social links
CREATE POLICY "read social" ON public.social_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon read social" ON public.social_links FOR SELECT TO anon USING (is_active);

-- app_settings: readable by all auth; secrets blanked client-side via view (here just allow read of non-secret)
CREATE POLICY "read non-secret settings" ON public.app_settings FOR SELECT TO authenticated USING (NOT is_secret);
CREATE POLICY "anon read non-secret settings" ON public.app_settings FOR SELECT TO anon USING (NOT is_secret);
CREATE POLICY "admin read all settings" ON public.app_settings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- admin_team / audit: admin read
CREATE POLICY "admin read team" ON public.admin_team FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- data export
CREATE POLICY "own exports" ON public.data_export_requests FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- cookie consents
CREATE POLICY "own consents" ON public.cookie_consents FOR ALL TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "anon write consent" ON public.cookie_consents FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- scanner_rate_limits - service role only (no policy needed; RLS blocks)

-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images','product-images', true),
  ('shopping-photos','shopping-photos', false),
  ('scanner-images','scanner-images', true),
  ('data-exports','data-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read product images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');
CREATE POLICY "auth write own product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "auth own shopping photos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id='shopping-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id='shopping-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
-- scanner-images read is restricted to authenticated household
-- owners via policies in a later migration. No public read.
CREATE POLICY "auth read own exports" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='data-exports' AND (storage.foldername(name))[1] = auth.uid()::text);
