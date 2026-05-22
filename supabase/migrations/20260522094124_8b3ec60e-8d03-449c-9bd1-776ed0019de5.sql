
-- 1. Profiles table (id == auth.users.id) with email
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Helper: can the caller see this profile? (shares a household, or self)
CREATE OR REPLACE FUNCTION public.can_see_profile(_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _target = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.household_members hm_me
      JOIN public.household_members hm_t
        ON hm_t.household_id = hm_me.household_id
      WHERE hm_me.user_id = auth.uid()
        AND hm_t.user_id = _target
    );
$$;

DROP POLICY IF EXISTS "read visible profiles" ON public.profiles;
CREATE POLICY "read visible profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_see_profile(id));

-- 3. Backfill from auth.users
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 4. Trigger to keep profiles in sync on signup/email change
CREATE OR REPLACE FUNCTION public.tg_sync_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_profile_on_user_insert ON auth.users;
CREATE TRIGGER sync_profile_on_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_profile_from_auth();

DROP TRIGGER IF EXISTS sync_profile_on_user_update ON auth.users;
CREATE TRIGGER sync_profile_on_user_update
AFTER UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_profile_from_auth();

-- 5. Admin INSERT policy on household_members (alongside existing owner policy)
DROP POLICY IF EXISTS "admins insert members" ON public.household_members;
CREATE POLICY "admins insert members" ON public.household_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_household_admin(auth.uid(), household_id));
