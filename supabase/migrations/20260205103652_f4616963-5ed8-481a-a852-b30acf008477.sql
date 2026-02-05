-- Create project_changelog table for email pins
CREATE TABLE public.project_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'email',
  title TEXT NOT NULL,
  content TEXT,
  source_email_thread_id TEXT,
  source_email_from TEXT,
  source_email_date TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_changelog ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage changelog entries
CREATE POLICY "Admin/Staff can manage changelog"
ON public.project_changelog
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Project members can view changelog
CREATE POLICY "Project members can view changelog"
ON public.project_changelog
FOR SELECT
USING (is_project_member(auth.uid(), project_id));