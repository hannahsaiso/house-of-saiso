-- Add shared_notes to tasks table (internal_notes already exists for internal use)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS shared_notes text;

-- Update the RLS policy for tasks to allow clients to view tasks but filter internal_notes
-- The existing policy already handles this - clients can view tasks but code filters internal_notes