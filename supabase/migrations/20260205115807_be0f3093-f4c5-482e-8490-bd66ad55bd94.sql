-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admin can manage invites" ON public.team_invites;
DROP POLICY IF EXISTS "Admin can manage team members" ON public.team_members;

-- Create permissive policies for team_invites (Admin only)
CREATE POLICY "Admins can insert team invites"
ON public.team_invites
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can select team invites"
ON public.team_invites
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update team invites"
ON public.team_invites
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete team invites"
ON public.team_invites
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Create permissive policies for team_members (Admin only)
CREATE POLICY "Admins can insert team members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can select team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update team members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));