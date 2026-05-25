-- 1. Protect user_products INSERT from status bypass
CREATE OR REPLACE FUNCTION public.tg_user_products_protect_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin(auth.uid()) THEN
      IF NEW.admin_note IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot set admin_note';
      END IF;
      IF NEW.submission_status NOT IN ('local_only', 'pending_approval') THEN
        RAISE EXCEPTION 'Invalid initial submission_status';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
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
END;
$function$;

DROP TRIGGER IF EXISTS tg_user_products_protect ON public.user_products;
CREATE TRIGGER tg_user_products_protect
BEFORE INSERT OR UPDATE ON public.user_products
FOR EACH ROW EXECUTE FUNCTION public.tg_user_products_protect_admin_fields();

-- 2. Remove client INSERT on ai_usage (server-only writes)
DROP POLICY IF EXISTS "insert own ai usage" ON public.ai_usage;
