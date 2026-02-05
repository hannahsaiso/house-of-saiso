-- Create client intake tokens for public access
CREATE TABLE public.client_intake_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  uploaded_files_count INTEGER DEFAULT 0,
  visual_anchors JSONB DEFAULT '[]'::jsonb,
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.client_intake_tokens ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage tokens
CREATE POLICY "Admin/Staff can manage intake tokens" 
ON public.client_intake_tokens 
FOR ALL 
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Public can select with valid token (for validation in edge function)
CREATE POLICY "Public can validate active tokens" 
ON public.client_intake_tokens 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add onboarding status to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS intake_folder_id TEXT;

-- Create index for fast token lookups
CREATE INDEX idx_client_intake_tokens_token ON public.client_intake_tokens(token);
CREATE INDEX idx_client_intake_tokens_project ON public.client_intake_tokens(project_id);