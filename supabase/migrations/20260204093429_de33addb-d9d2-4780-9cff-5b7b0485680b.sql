-- ================================================================
-- Platform Finalization: DocuSign, Project Tabs, Notifications
-- ================================================================

-- 1. Signature Requests Table (DocuSign tracking)
CREATE TABLE public.signature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.studio_bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL, -- 'studio_rules', 'contract', 'nda', etc.
    docusign_envelope_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'signed', 'declined'
    signed_at TIMESTAMPTZ,
    signed_document_path TEXT, -- Storage path for signed document
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage signature requests"
ON public.signature_requests
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Clients can view their own requests"
ON public.signature_requests
FOR SELECT
USING (client_id IN (
    SELECT id FROM public.clients WHERE created_by = auth.uid()
) OR EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = signature_requests.project_id
    AND pm.user_id = auth.uid()
));

-- 2. Project Tabs (Canva embeds, Google Drive links)
CREATE TABLE public.project_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    resource_type TEXT NOT NULL, -- 'canva_embed', 'google_drive', 'figma', etc.
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage project resources"
ON public.project_resources
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Project members can view resources"
ON public.project_resources
FOR SELECT
USING (is_project_member(auth.uid(), project_id));

-- 3. Project Documents Gallery (for signed docs, uploaded assets)
CREATE TABLE public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL, -- 'signed_contract', 'asset', 'deliverable', 'reference'
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage project documents"
ON public.project_documents
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Project members can view and upload documents"
ON public.project_documents
FOR SELECT
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can upload documents"
ON public.project_documents
FOR INSERT
WITH CHECK (is_project_member(auth.uid(), project_id));

-- 4. Add archive status to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID;

-- 5. Storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project documents
CREATE POLICY "Admin/Staff can manage project documents storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'project-documents' AND is_admin_or_staff(auth.uid()))
WITH CHECK (bucket_id = 'project-documents' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Project members can upload to project documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Project members can view project documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
);

-- 6. Triggers for updated_at
CREATE TRIGGER update_signature_requests_updated_at
    BEFORE UPDATE ON public.signature_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_resources_updated_at
    BEFORE UPDATE ON public.project_resources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();