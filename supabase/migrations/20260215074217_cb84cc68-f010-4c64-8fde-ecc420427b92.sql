-- Drop the existing policy that doesn't explicitly check authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate with explicit authentication check
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());