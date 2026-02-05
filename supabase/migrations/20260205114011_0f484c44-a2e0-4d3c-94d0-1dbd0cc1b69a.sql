-- Create a table to track invited/team members (including pending invites)
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_role public.app_role NOT NULL DEFAULT 'staff',
  invite_id uuid NULL REFERENCES public.team_invites(id) ON DELETE SET NULL,
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_members_email_unique UNIQUE (email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Admins can manage all team member records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'team_members' AND policyname = 'Admin can manage team members'
  ) THEN
    CREATE POLICY "Admin can manage team members"
    ON public.team_members
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END
$$;

-- Keep updated_at current
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_team_members_updated_at'
  ) THEN
    CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);