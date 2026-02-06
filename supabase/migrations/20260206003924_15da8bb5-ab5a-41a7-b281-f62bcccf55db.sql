-- Allow public to read team_invites by token for the join page
-- This allows unauthenticated users to validate their invite token

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_invites' AND policyname='Public can validate invite tokens'
  ) THEN
    EXECUTE 'DROP POLICY "Public can validate invite tokens" ON public.team_invites';
  END IF;
END$$;

CREATE POLICY "Public can validate invite tokens"
ON public.team_invites
FOR SELECT
TO anon, authenticated
USING (
  accepted_at IS NULL 
  AND expires_at > now()
);

-- Allow new users to update their invite as accepted after signup
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_invites' AND policyname='Users can accept their own invite'
  ) THEN
    EXECUTE 'DROP POLICY "Users can accept their own invite" ON public.team_invites';
  END IF;
END$$;

CREATE POLICY "Users can accept their own invite"
ON public.team_invites
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow new users to insert their own role during signup
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can insert their own role via invite'
  ) THEN
    EXECUTE 'DROP POLICY "Users can insert their own role via invite" ON public.user_roles';
  END IF;
END$$;

CREATE POLICY "Users can insert their own role via invite"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.team_invites
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND invited_role = role
    AND accepted_at IS NULL
    AND expires_at > now()
  )
);

-- Allow new users to update their team_members record
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='team_members' AND policyname='Users can activate their own membership'
  ) THEN
    EXECUTE 'DROP POLICY "Users can activate their own membership" ON public.team_members';
  END IF;
END$$;

CREATE POLICY "Users can activate their own membership"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);