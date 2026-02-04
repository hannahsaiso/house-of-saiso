-- Create google_oauth_tokens table for storing user OAuth credentials
CREATE TABLE public.google_oauth_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamp with time zone,
    google_email text,
    scopes text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view their own tokens"
ON public.google_oauth_tokens
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens"
ON public.google_oauth_tokens
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
ON public.google_oauth_tokens
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
ON public.google_oauth_tokens
FOR DELETE
USING (user_id = auth.uid());

-- Admin can view all tokens for debugging
CREATE POLICY "Admin can view all tokens"
ON public.google_oauth_tokens
FOR SELECT
USING (is_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_google_oauth_tokens_updated_at
BEFORE UPDATE ON public.google_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();