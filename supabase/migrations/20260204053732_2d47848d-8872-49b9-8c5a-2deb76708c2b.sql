-- Phase 1: Studio Enhancements
-- Add missing columns to studio_bookings
ALTER TABLE studio_bookings ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE studio_bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Public calendar tokens for shareable links
CREATE TABLE public_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Staff can manage tokens" ON public_calendar_tokens
  FOR ALL USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

-- Phase 2: Financial Ledger (Admin Only)
CREATE TABLE financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('agency', 'studio')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'sent' CHECK (payment_status IN ('sent', 'paid', 'overdue')),
  stripe_invoice_id TEXT,
  stripe_payment_link TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access" ON financial_entries
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_financial_entries_updated_at
  BEFORE UPDATE ON financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Phase 3: HR & Staff Management (Admin Only)
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  hire_date DATE,
  contract_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access" ON staff_profiles
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE DEFAULT CURRENT_DATE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access" ON performance_logs
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- HR Documents Storage Bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hr-documents bucket
CREATE POLICY "Admin can upload HR documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hr-documents' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admin can view HR documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hr-documents' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admin can delete HR documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hr-documents' 
  AND is_admin(auth.uid())
);