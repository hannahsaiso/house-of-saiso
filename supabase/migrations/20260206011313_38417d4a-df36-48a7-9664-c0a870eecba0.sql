-- Fix "permission denied for table users" by removing auth.users references from RLS policies
-- (Policies that query auth.users can error in restricted environments.)

-- team_invites: replace "Users can accept their own invite"
DROP POLICY IF EXISTS "Users can accept their own invite" ON public.team_invites;
CREATE POLICY "Users can accept their own invite"
ON public.team_invites
FOR UPDATE
USING (
  email = COALESCE(auth.jwt() ->> 'email', '')
)
WITH CHECK (
  email = COALESCE(auth.jwt() ->> 'email', '')
);

-- team_members: replace "Users can activate their own membership"
DROP POLICY IF EXISTS "Users can activate their own membership" ON public.team_members;
CREATE POLICY "Users can activate their own membership"
ON public.team_members
FOR UPDATE
USING (
  email = COALESCE(auth.jwt() ->> 'email', '')
)
WITH CHECK (
  email = COALESCE(auth.jwt() ->> 'email', '')
);

-- user_roles: replace "Users can insert their own role via invite"
DROP POLICY IF EXISTS "Users can insert their own role via invite" ON public.user_roles;
CREATE POLICY "Users can insert their own role via invite"
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.team_invites
    WHERE team_invites.email = COALESCE(auth.jwt() ->> 'email', '')
      AND team_invites.invited_role = user_roles.role
      AND team_invites.accepted_at IS NULL
      AND team_invites.expires_at > now()
  )
);
