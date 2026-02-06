-- Fix: Allow anonymous users to read invite data by token
-- The current policy is RESTRICTIVE which blocks anonymous access

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can validate invite tokens" ON public.team_invites;

-- Create a PERMISSIVE policy that allows anonymous (unauthenticated) users to SELECT
-- This enables the /join page to validate tokens before the user creates an account
CREATE POLICY "Anyone can validate invite tokens"
ON public.team_invites
FOR SELECT
TO anon, authenticated
USING (
  accepted_at IS NULL 
  AND expires_at > now()
);