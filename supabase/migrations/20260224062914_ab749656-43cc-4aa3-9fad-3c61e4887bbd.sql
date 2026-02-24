
CREATE TABLE public.sent_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  thread_id text NOT NULL,
  to_address text NOT NULL,
  subject text,
  body text NOT NULL,
  gmail_message_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sent emails"
  ON public.sent_emails FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sent emails"
  ON public.sent_emails FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all sent emails"
  ON public.sent_emails FOR SELECT
  USING (is_admin(auth.uid()));
