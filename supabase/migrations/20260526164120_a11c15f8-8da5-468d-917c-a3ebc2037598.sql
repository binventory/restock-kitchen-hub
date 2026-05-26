
-- A1) Audit logging helper
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _entity_type text,
  _entity_id text,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not an admin';
  END IF;
  INSERT INTO public.admin_audit_log
    (admin_user_id, action, target_type, target_id, details)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _details);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text,text,text,jsonb) TO authenticated;

-- A2) Approve / decline / reject-forever
CREATE OR REPLACE FUNCTION public.approve_user_product(_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  _up record;
  _global_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not an admin';
  END IF;
  SELECT * INTO _up FROM public.user_products WHERE id = _id;
  IF _up.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;

  INSERT INTO public.products
    (barcode, name, brand, image_url, food_group, category,
     source, is_approved, submitted_by_user_id)
  VALUES
    (_up.barcode, _up.name, _up.brand, _up.image_url,
     _up.food_group, _up.category,
     'user'::product_source, true, _up.user_id)
  ON CONFLICT (barcode) DO UPDATE
    SET is_approved = true
  RETURNING id INTO _global_id;

  UPDATE public.user_products
    SET submission_status = 'approved'
    WHERE id = _id;

  PERFORM public.log_admin_action(
    'approve_product', 'user_product', _id::text,
    jsonb_build_object('barcode', _up.barcode, 'name', _up.name));

  RETURN _global_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_user_product(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_user_product(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not an admin';
  END IF;
  UPDATE public.user_products
    SET submission_status = 'local_only'
    WHERE id = _id;
  PERFORM public.log_admin_action(
    'decline_product', 'user_product', _id::text, '{}'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.decline_user_product(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_forever_product(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE _up record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not an admin';
  END IF;
  SELECT * INTO _up FROM public.user_products WHERE id = _id;
  IF _up.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;

  INSERT INTO public.rejected_forever_products (barcode, name, rejection_reason, rejected_by_admin_id)
  VALUES (_up.barcode, _up.name, 'admin_blacklisted', auth.uid())
  ON CONFLICT (barcode) DO NOTHING;

  UPDATE public.user_products
    SET submission_status = 'rejected'
    WHERE id = _id;

  PERFORM public.log_admin_action(
    'reject_forever', 'user_product', _id::text,
    jsonb_build_object('barcode', _up.barcode));
END;
$$;
GRANT EXECUTE ON FUNCTION public.reject_forever_product(uuid) TO authenticated;

-- A3) Override user plan (super_admin only)
CREATE OR REPLACE FUNCTION public.override_user_plan(
  _user_id uuid, _plan_slug text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE _plan_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super_admin can override plans';
  END IF;
  SELECT id INTO _plan_id FROM public.plans WHERE slug = _plan_slug;
  IF _plan_id IS NULL THEN RAISE EXCEPTION 'Plan not found'; END IF;

  -- Deactivate existing active subs
  UPDATE public.subscriptions SET status = 'cancelled'
    WHERE user_id = _user_id AND status = 'active';

  INSERT INTO public.subscriptions (user_id, plan_id, status)
  VALUES (_user_id, _plan_id, 'active');

  PERFORM public.log_admin_action(
    'override_plan', 'user', _user_id::text,
    jsonb_build_object('new_plan', _plan_slug));
END;
$$;
GRANT EXECUTE ON FUNCTION public.override_user_plan(uuid,text) TO authenticated;

-- A4) Admin policies
DROP POLICY IF EXISTS "admins manage app_settings" ON public.app_settings;
CREATE POLICY "admins manage app_settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage plans" ON public.plans;
CREATE POLICY "admins manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage ads" ON public.ads;
CREATE POLICY "admins manage ads" ON public.ads
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage offers" ON public.offers;
CREATE POLICY "admins manage offers" ON public.offers
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage popups" ON public.popup_notifications;
CREATE POLICY "admins manage popups" ON public.popup_notifications
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins read user_products" ON public.user_products;
CREATE POLICY "admins read user_products" ON public.user_products
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());
