ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS ai_creative_brief text,
  ADD COLUMN IF NOT EXISTS assigned_coordinator text,
  ADD COLUMN IF NOT EXISTS automated_folder_link text;