-- Extend clients table with onboarding fields
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS project_goals TEXT,
ADD COLUMN IF NOT EXISTS services_needed TEXT[],
ADD COLUMN IF NOT EXISTS brand_assets_folder TEXT,
ADD COLUMN IF NOT EXISTS onboarded_by UUID,
ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP WITH TIME ZONE;

-- Create onboarding_drafts table for autosave
CREATE TABLE public.onboarding_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    step INTEGER NOT NULL DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on onboarding_drafts
ALTER TABLE public.onboarding_drafts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own drafts
CREATE POLICY "Users can view their own drafts"
ON public.onboarding_drafts
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own drafts"
ON public.onboarding_drafts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own drafts"
ON public.onboarding_drafts
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own drafts"
ON public.onboarding_drafts
FOR DELETE
USING (user_id = auth.uid());

-- Admin/Staff can view all drafts
CREATE POLICY "Admin/Staff can view all drafts"
ON public.onboarding_drafts
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_drafts_updated_at
BEFORE UPDATE ON public.onboarding_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin/Staff can create notifications for anyone
CREATE POLICY "Admin/Staff can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Admin/Staff can view all notifications
CREATE POLICY "Admin/Staff can view all notifications"
ON public.notifications
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Create client-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-assets', 'client-assets', false);

-- Storage policies for client-assets
CREATE POLICY "Admin/Staff can view all client assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'client-assets' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/Staff can upload client assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'client-assets' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/Staff can update client assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'client-assets' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/Staff can delete client assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'client-assets' AND is_admin_or_staff(auth.uid()));

-- Clients can view their own folder (path starts with their client id)
CREATE POLICY "Users can view own client assets"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'client-assets' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
        SELECT c.id::text FROM public.clients c
        JOIN public.project_members pm ON pm.project_id IN (
            SELECT p.id FROM public.projects p WHERE p.client_id = c.id
        )
        WHERE pm.user_id = auth.uid()
    )
);