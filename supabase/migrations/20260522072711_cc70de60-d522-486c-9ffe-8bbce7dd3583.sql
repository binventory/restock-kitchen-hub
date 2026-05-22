
-- 1. Revoke sensitive columns on offers from regular authenticated users.
REVOKE SELECT (sponsor_paid_eur, sponsor_name, sponsor_paid_eur) ON public.offers FROM authenticated;
REVOKE SELECT (sponsor_paid_eur, sponsor_name) ON public.offers FROM anon;

-- 2. Replace permissive scanner_orders UPDATE policy with strict status-only cancellation.
DROP POLICY IF EXISTS "users can cancel own orders" ON public.scanner_orders;

CREATE OR REPLACE FUNCTION public.tg_scanner_orders_cancel_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Admins bypass this guard.
  IF public.is_admin(auth.uid()) THEN RETURN NEW; END IF;
  -- Only the owner may update, and only to cancel.
  IF NEW.user_id <> auth.uid() OR OLD.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF NEW.status <> 'cancelled'::order_status THEN
    RAISE EXCEPTION 'Only cancellation is permitted';
  END IF;
  -- Disallow modification of any other field.
  IF NEW.unit_price IS DISTINCT FROM OLD.unit_price
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.scanner_color IS DISTINCT FROM OLD.scanner_color
     OR NEW.full_name IS DISTINCT FROM OLD.full_name
     OR NEW.address1 IS DISTINCT FROM OLD.address1
     OR NEW.address2 IS DISTINCT FROM OLD.address2
     OR NEW.city IS DISTINCT FROM OLD.city
     OR NEW.postal_code IS DISTINCT FROM OLD.postal_code
     OR NEW.country IS DISTINCT FROM OLD.country
     OR NEW.phone IS DISTINCT FROM OLD.phone
     OR NEW.tracking_number IS DISTINCT FROM OLD.tracking_number
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.household_id IS DISTINCT FROM OLD.household_id THEN
    RAISE EXCEPTION 'Only the status field may be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_scanner_orders_cancel_only ON public.scanner_orders;
CREATE TRIGGER tg_scanner_orders_cancel_only
BEFORE UPDATE ON public.scanner_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_scanner_orders_cancel_only();

CREATE POLICY "users can cancel own orders"
ON public.scanner_orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status IN ('pending'::order_status, 'paid'::order_status))
WITH CHECK (user_id = auth.uid() AND status = 'cancelled'::order_status);

-- 3. Server-validate scanner order price on INSERT from app_settings.
CREATE OR REPLACE FUNCTION public.tg_scanner_orders_validate_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _canonical numeric;
  _qty integer;
BEGIN
  IF public.is_admin(auth.uid()) THEN RETURN NEW; END IF;
  SELECT NULLIF(value, '')::numeric INTO _canonical
  FROM public.app_settings WHERE key = 'scanner_unit_price' LIMIT 1;
  IF _canonical IS NULL THEN
    _canonical := 49.00; -- safe default
  END IF;
  _qty := GREATEST(COALESCE(NEW.quantity, 1), 1);
  NEW.quantity := _qty;
  NEW.unit_price := _canonical;
  NEW.total := _canonical * _qty;
  NEW.currency := COALESCE(NEW.currency, 'EUR');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_scanner_orders_validate_price ON public.scanner_orders;
CREATE TRIGGER tg_scanner_orders_validate_price
BEFORE INSERT ON public.scanner_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_scanner_orders_validate_price();

-- 4. Add caller guards to admin enumeration RPCs.
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS admin_role
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RETURN NULL; END IF;
  IF _user_id <> _caller AND NOT public.is_admin(_caller) THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.admin_team WHERE user_id = _user_id LIMIT 1);
END; $$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RETURN false; END IF;
  IF _user_id <> _caller AND NOT public.is_admin(_caller) THEN
    RETURN false;
  END IF;
  RETURN COALESCE(
    (SELECT (permissions->>_permission)::boolean FROM public.admin_team WHERE user_id = _user_id),
    false
  ) OR public.is_admin(_user_id);
END; $$;
