-- Fix project-documents storage bucket policies to properly check project membership
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Project members can upload to project documents" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view project documents" ON storage.objects;

-- Create properly secured upload policy
-- Files should be stored as {project_id}/{filename} for this to work
CREATE POLICY "Project members can upload to project documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
    AND (
        -- Allow admin/staff to upload to any project
        public.is_admin_or_staff(auth.uid())
        OR
        -- Allow project members to upload to their projects only
        -- Path format: {project_id}/{filename}
        (storage.foldername(name))[1]::uuid IN (
            SELECT pm.project_id 
            FROM public.project_members pm 
            WHERE pm.user_id = auth.uid()
        )
    )
);

-- Create properly secured view policy
CREATE POLICY "Project members can view project documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
    AND (
        -- Allow admin/staff to view all
        public.is_admin_or_staff(auth.uid())
        OR
        -- Allow project members to view their project documents only
        (storage.foldername(name))[1]::uuid IN (
            SELECT pm.project_id 
            FROM public.project_members pm 
            WHERE pm.user_id = auth.uid()
        )
    )
);

-- Also add delete and update policies for completeness
CREATE POLICY "Admin/Staff can delete project documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-documents' 
    AND public.is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin/Staff can update project documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-documents' 
    AND public.is_admin_or_staff(auth.uid())
)
WITH CHECK (
    bucket_id = 'project-documents' 
    AND public.is_admin_or_staff(auth.uid())
);