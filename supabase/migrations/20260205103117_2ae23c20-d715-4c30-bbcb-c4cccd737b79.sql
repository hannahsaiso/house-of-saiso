-- Create inventory_logs table for tracking gear health history
CREATE TABLE public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL, -- 'used', 'repaired', 'cleaned', 'flagged_maintenance', 'cleared_maintenance'
  description TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.studio_bookings(id) ON DELETE SET NULL,
  performed_by UUID, -- staff user_id
  performed_by_name TEXT, -- denormalized for display
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage inventory logs
CREATE POLICY "Admin/Staff can manage inventory logs"
ON public.inventory_logs
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_inventory_logs_inventory_id ON public.inventory_logs(inventory_id);
CREATE INDEX idx_inventory_logs_log_date ON public.inventory_logs(log_date DESC);