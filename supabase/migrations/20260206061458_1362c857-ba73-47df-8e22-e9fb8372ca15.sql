-- 1) Ensure no RLS policy references auth.users for invite acceptance/activation flows

-- team_invites
DROP POLICY IF EXISTS "Users can accept their own invite" ON public.team_invites;
CREATE POLICY "Users can accept their own invite"
ON public.team_invites
FOR UPDATE
TO authenticated
USING (
  email = COALESCE((auth.jwt() ->> 'email'), '')
)
WITH CHECK (
  email = COALESCE((auth.jwt() ->> 'email'), '')
);

-- team_members
DROP POLICY IF EXISTS "Users can activate their own membership" ON public.team_members;
CREATE POLICY "Users can activate their own membership"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  email = COALESCE((auth.jwt() ->> 'email'), '')
)
WITH CHECK (
  email = COALESCE((auth.jwt() ->> 'email'), '')
);

-- user_roles
DROP POLICY IF EXISTS "Users can insert their own role via invite" ON public.user_roles;
CREATE POLICY "Users can insert their own role via invite"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.team_invites
    WHERE team_invites.email = COALESCE((auth.jwt() ->> 'email'), '')
      AND team_invites.invited_role = public.user_roles.role
      AND team_invites.accepted_at IS NULL
      AND team_invites.expires_at > now()
  )
);
