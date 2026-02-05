-- Add client_type to clients table for distinguishing Studio Renter vs Agency Client
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_type text[] DEFAULT ARRAY['agency_client']::text[];

-- Add comment explaining the column
COMMENT ON COLUMN public.clients.client_type IS 'Array of client types: studio_renter, agency_client, or both';

-- Create studio_operations_tasks table for auto-generated tasks from studio bookings
CREATE TABLE public.studio_operations_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid NOT NULL REFERENCES public.studio_bookings(id) ON DELETE CASCADE,
    task_type text NOT NULL, -- 'entry_instructions', 'equipment_check', 'space_reset'
    task_name text NOT NULL,
    assigned_to uuid,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (booking_id, task_type)
);

-- Enable RLS on studio_operations_tasks
ALTER TABLE public.studio_operations_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for studio_operations_tasks
CREATE POLICY "Admin/Staff can manage studio operations tasks" 
ON public.studio_operations_tasks 
FOR ALL 
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Add index for faster lookup
CREATE INDEX idx_studio_operations_booking ON public.studio_operations_tasks(booking_id);
CREATE INDEX idx_studio_operations_status ON public.studio_operations_tasks(status);

-- Add fixed_cost column to financial_entries for space cost tracking
ALTER TABLE public.financial_entries
ADD COLUMN IF NOT EXISTS fixed_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS operational_hours numeric DEFAULT 0;

-- Add comment explaining new columns
COMMENT ON COLUMN public.financial_entries.fixed_cost IS 'Fixed cost of service (e.g., space rental overhead)';
COMMENT ON COLUMN public.financial_entries.operational_hours IS 'Hours for operational tasks (e.g., space reset, not creative labor)';