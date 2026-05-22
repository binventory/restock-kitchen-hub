-- Add role column to household_members
ALTER TABLE public.household_members
  ADD COLUMN IF NOT EXISTS role_v2 text NOT NULL DEFAULT 'member';

-- The table already has a 'role' text column with default 'member'. Add a CHECK constraint
-- enforcing only 'admin' or 'member'. Backfill any non-conforming values to 'member' first,
-- and promote household creators to 'admin'.
UPDATE public.household_members hm
   SET role = 'admin'
  FROM public.households h
 WHERE hm.household_id = h.id
   AND hm.user_id = h.created_by
   AND hm.role <> 'admin';

UPDATE public.household_members
   SET role = 'member'
 WHERE role NOT IN ('admin', 'member');

-- Drop the helper column we added defensively
ALTER TABLE public.household_members DROP COLUMN IF EXISTS role_v2;

-- Enforce constraint
ALTER TABLE public.household_members
  DROP CONSTRAINT IF EXISTS household_members_role_check;
ALTER TABLE public.household_members
  ADD CONSTRAINT household_members_role_check CHECK (role IN ('admin', 'member'));

-- Helper: is the user an admin of the given household?
CREATE OR REPLACE FUNCTION public.is_household_admin(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = _user_id
      AND household_id = _household_id
      AND role = 'admin'
  ) OR public.is_household_owner(_user_id, _household_id);
$$;

-- Allow admins to update member roles and remove members
DROP POLICY IF EXISTS "admins update members" ON public.household_members;
CREATE POLICY "admins update members"
ON public.household_members
FOR UPDATE
TO authenticated
USING (public.is_household_admin(auth.uid(), household_id))
WITH CHECK (public.is_household_admin(auth.uid(), household_id));

DROP POLICY IF EXISTS "admins delete members" ON public.household_members;
CREATE POLICY "admins delete members"
ON public.household_members
FOR DELETE
TO authenticated
USING (public.is_household_admin(auth.uid(), household_id) OR user_id = auth.uid());
