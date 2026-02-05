-- Create project_intake_canvas table for storing intake form data
CREATE TABLE public.project_intake_canvas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_goals TEXT,
  brand_pillars TEXT[],
  tone_of_voice TEXT,
  competitors TEXT,
  target_audience TEXT,
  inspiration_gallery JSONB DEFAULT '[]'::jsonb,
  kickoff_template_enabled BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id)
);

-- Create project_knowledge_vault table for AI-generated project charter
CREATE TABLE public.project_knowledge_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  canvas_id UUID REFERENCES public.project_intake_canvas(id) ON DELETE CASCADE,
  project_charter TEXT NOT NULL,
  tone_tags TEXT[],
  pillar_tags TEXT[],
  is_locked BOOLEAN DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_intake_canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_knowledge_vault ENABLE ROW LEVEL SECURITY;

-- RLS policies for intake canvas
CREATE POLICY "Admin/Staff can manage intake canvas"
  ON public.project_intake_canvas FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Project members can view intake canvas"
  ON public.project_intake_canvas FOR SELECT
  USING (is_project_member(auth.uid(), project_id));

-- RLS policies for knowledge vault
CREATE POLICY "Admin/Staff can manage knowledge vault"
  ON public.project_knowledge_vault FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Project members can view knowledge vault"
  ON public.project_knowledge_vault FOR SELECT
  USING (is_project_member(auth.uid(), project_id));

-- Trigger for updated_at
CREATE TRIGGER update_intake_canvas_updated_at
  BEFORE UPDATE ON public.project_intake_canvas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_vault_updated_at
  BEFORE UPDATE ON public.project_knowledge_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();