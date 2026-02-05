-- Create inventory/gear tracking table
CREATE TABLE public.inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage inventory
CREATE POLICY "Admin/Staff can manage inventory"
ON public.inventory FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Clients can view available inventory
CREATE POLICY "Clients can view inventory"
ON public.inventory FOR SELECT
USING (true);

-- Create inventory reservations table to track gear bookings
CREATE TABLE public.inventory_reservations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.studio_bookings(id) ON DELETE CASCADE,
    reserved_from DATE NOT NULL,
    reserved_until DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(inventory_id, booking_id)
);

-- Enable RLS
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage reservations
CREATE POLICY "Admin/Staff can manage inventory reservations"
ON public.inventory_reservations FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();