-- Add hours_logged column to tasks for time tracking
ALTER TABLE public.tasks 
ADD COLUMN hours_logged numeric DEFAULT 0;

-- Add tags array column to inventory for resource tagging (Natural Light, Soundproof, etc.)
ALTER TABLE public.inventory 
ADD COLUMN tags text[] DEFAULT '{}';

-- Create a table for time log entries (detailed time tracking per task)
CREATE TABLE public.time_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  hours numeric NOT NULL CHECK (hours > 0),
  description text,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on time_logs
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage time logs
CREATE POLICY "Admin/Staff can manage time logs"
ON public.time_logs
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Project members can view time logs for their projects
CREATE POLICY "Project members can view time logs"
ON public.time_logs
FOR SELECT
USING (is_project_member(auth.uid(), project_id));

-- Create function to update task hours_logged when time_logs change
CREATE OR REPLACE FUNCTION public.update_task_hours_logged()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.tasks 
    SET hours_logged = COALESCE((
      SELECT SUM(hours) FROM public.time_logs WHERE task_id = OLD.task_id
    ), 0)
    WHERE id = OLD.task_id;
    RETURN OLD;
  ELSE
    UPDATE public.tasks 
    SET hours_logged = COALESCE((
      SELECT SUM(hours) FROM public.time_logs WHERE task_id = NEW.task_id
    ), 0)
    WHERE id = NEW.task_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-updating hours_logged
CREATE TRIGGER sync_task_hours_logged
AFTER INSERT OR UPDATE OR DELETE ON public.time_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_task_hours_logged();