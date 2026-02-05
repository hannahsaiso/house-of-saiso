-- Ensure RLS is enabled
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- TEAM_INVITES: ensure admins can INSERT (and manage)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_invites' AND policyname='Admins can insert team invites'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can insert team invites" ON public.team_invites';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_invites' AND policyname='Admins can select team invites'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can select team invites" ON public.team_invites';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_invites' AND policyname='Admins can update team invites'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can update team invites" ON public.team_invites';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_invites' AND policyname='Admins can delete team invites'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can delete team invites" ON public.team_invites';
  END IF;
END$$;

CREATE POLICY "Admins can insert team invites"
ON public.team_invites
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can select team invites"
ON public.team_invites
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update team invites"
ON public.team_invites
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete team invites"
ON public.team_invites
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- PROFILES: allow admins to manage user data (update any profile)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can update all profiles" ON public.profiles';
  END IF;
END$$;

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
