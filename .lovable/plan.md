

# Operational Modules: Studio Calendar, Financial Vault & HR Management
### Complete Business Operations Infrastructure

---

## Overview

This plan implements three critical operational modules for House of Saiso:

1. **Studio & Gallery Calendar** - Full booking system with conflict detection and public sharing
2. **Financial Vault** - Admin-only ledger with analytics and Stripe invoicing
3. **HR & Staff Management** - Team profiles with contract storage and performance logging

The design maintains the "Clean Editorial" aesthetic for standard pages while introducing a distinctive "Financial Dark Mode" for the Vault.

---

## Module 1: Studio & Gallery Calendar

### Interface Design
A full-page minimalist calendar with thin gridlines and elegant Playfair Display headers. The calendar displays:
- Monthly view with event indicators
- Side panel for event details and creation
- Event type color coding (subtle, muted tones)

```text
+----------------------------------------------------------+
|  CREATIVE SPACE                      [+ New Event] [Share]|
|  Studio Calendar                                         |
|----------------------------------------------------------|
|            January 2026                                  |
|  Sun   Mon   Tue   Wed   Thu   Fri   Sat                |
|  -------------------------------------------------      |
|        |     |  1  |  2  |  3  |  4  |  5  |            |
|        |     |     |[  ] |     |     |     |            |
|  -------------------------------------------------      |
|   6   |  7  |  8  |  9  | 10  | 11  | 12  |            |
|       |[  ] |     |     |[  ] |     |     |            |
+----------------------------------------------------------+
```

### Event Model Enhancement
Extend `studio_bookings` table with additional fields:

```sql
ALTER TABLE studio_bookings ADD COLUMN event_name TEXT;
ALTER TABLE studio_bookings ADD COLUMN status TEXT DEFAULT 'pending';
-- status: 'pending', 'confirmed', 'blocked'
```

### Conflict Detection Logic
Before creating/updating an event, check for overlapping bookings:

```sql
-- Check for conflicts
SELECT id FROM studio_bookings
WHERE date = $new_date
  AND id != $current_id
  AND (
    (start_time <= $new_start AND end_time > $new_start)
    OR (start_time < $new_end AND end_time >= $new_end)
    OR (start_time >= $new_start AND end_time <= $new_end)
  );
```

### Public Calendar View
- Create a `public_calendar_tokens` table for shareable links
- Generate unique token for read-only access
- Public view strips client names, shows only availability

### Components to Create

```text
src/components/studio/
  |-- StudioCalendar.tsx         - Main calendar grid component
  |-- StudioEventDialog.tsx      - Create/edit event modal
  |-- StudioEventCard.tsx        - Event display in calendar cell
  |-- StudioSidebar.tsx          - Event list and quick actions
  |-- PublicCalendarView.tsx     - Read-only shareable view
```

### Hooks

```text
src/hooks/
  |-- useStudioBookings.ts       - CRUD operations for bookings
  |-- useBookingConflicts.ts     - Conflict detection logic
  |-- usePublicCalendarToken.ts  - Generate/manage share tokens
```

---

## Module 2: Financial Vault (Admin Only)

### Access Control
**Critical Security Implementation:**

1. Route protection at `/vault` level
2. Role check using `useUserRole` hook
3. Automatic redirect for Staff (Frankie) and Clients to home dashboard
4. RLS policies on all financial tables

```typescript
// In Vault.tsx
const { isAdmin, isLoading } = useUserRole();

useEffect(() => {
  if (!isLoading && !isAdmin) {
    navigate('/');
    toast.error("Access restricted to administrators");
  }
}, [isAdmin, isLoading]);
```

### Financial Dark Mode Theme
Add new CSS variables for the Vault-specific dark theme:

```css
.vault-theme {
  --vault-background: 0 0% 12%;      /* Charcoal */
  --vault-foreground: 45 30% 90%;    /* Off-white/cream */
  --vault-accent: 43 65% 52%;        /* Gold/Champagne */
  --vault-muted: 0 0% 20%;
  --vault-border: 0 0% 18%;
  --vault-card: 0 0% 14%;
}
```

### Database: Financial Ledger
Create new `financial_entries` table:

```sql
CREATE TABLE financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  service_type TEXT NOT NULL, -- 'agency' or 'studio'
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'sent', -- 'sent', 'paid', 'overdue'
  stripe_invoice_id TEXT,
  stripe_payment_link TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin only
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access" ON financial_entries
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
```

### The Ledger UI
Sleek table with muted gold headers:

```text
+----------------------------------------------------------+
|  VAULT                                     [+ New Entry] |
|  Financial Ledger                                        |
|----------------------------------------------------------|
|  Date     | Client        | Service | Amount  | Status   |
|----------------------------------------------------------|
|  Jan 15   | Lumina Beauty | Agency  | $4,500  | [Paid]   |
|  Jan 12   | Terra Wellness| Studio  | $800    | [Sent]   |
|  Jan 08   | Artisan Co.   | Agency  | $2,200  | [Overdue]|
|----------------------------------------------------------|
|                          [Invoice] button per row        |
+----------------------------------------------------------+
```

### Visual Analytics
Simple, sophisticated line chart showing monthly revenue:
- Use Recharts (already installed)
- Muted gold/champagne line on charcoal background
- Minimal axis labels, clean grid lines
- Toggle between Agency vs Studio revenue

### Stripe Integration
**Requires Stripe to be enabled first.** The "Issue Invoice" button will:
1. Create a Stripe Payment Link via edge function
2. Store the link in `financial_entries.stripe_payment_link`
3. Allow copy-to-clipboard or direct email

### Components to Create

```text
src/components/vault/
  |-- VaultLayout.tsx            - Dark theme wrapper
  |-- FinancialLedger.tsx        - Main table component
  |-- FinancialEntryDialog.tsx   - Add/edit entry modal
  |-- RevenueChart.tsx           - Monthly trends visualization
  |-- InvoiceButton.tsx          - Stripe payment link generator
```

---

## Module 3: HR & Staff Management

### Location
Implemented as a "Team" tab within the Vault, accessible only to Admin.

### Database: Staff Profiles & Performance

```sql
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- 'Staff', 'Contractor', etc.
  hire_date DATE,
  contract_file_path TEXT, -- Storage bucket path
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin only
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON staff_profiles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admin only" ON performance_logs FOR ALL USING (is_admin(auth.uid()));
```

### Storage: HR Documents
Create secure `hr-documents` storage bucket:
- Private bucket (not public)
- Only Admin can upload/view
- Path structure: `hr-documents/{staff_id}/contracts/`

### Team Tab UI

```text
+----------------------------------------------------------+
|  [Financials]  [Team]  [Client Database]                 |
|----------------------------------------------------------|
|  TEAM MEMBER: Frankie                                    |
|----------------------------------------------------------|
|  Contact: frankie@houseofsaiso.com | +1 555-0123         |
|  Role: Staff (Creative Director)                         |
|  Hired: Jan 2024                                         |
|----------------------------------------------------------|
|  CONTRACT                                                |
|  [employment_agreement.pdf]  [Upload New]                |
|----------------------------------------------------------|
|  PERFORMANCE LOG                      [+ Add Note]       |
|  --------------------------------------------------------|
|  Jan 15, 2026                                            |
|  "Excellent work on the Lumina campaign shoot..."        |
|  --------------------------------------------------------|
|  Dec 20, 2025                                            |
|  "Needs improvement on timeline management..."           |
+----------------------------------------------------------+
```

### Components to Create

```text
src/components/vault/
  |-- TeamTab.tsx                - Staff management section
  |-- StaffProfileCard.tsx       - Individual staff display
  |-- ContractUploader.tsx       - Secure PDF upload
  |-- PerformanceLog.tsx         - Notes timeline
  |-- AddPerformanceNote.tsx     - Note entry dialog
```

---

## Design Nuance: Financial Dark Mode

### Implementation Approach
Rather than toggling the entire app's theme, apply a scoped dark theme to Vault components:

```typescript
// VaultLayout.tsx
<div className="vault-theme bg-vault text-vault-foreground min-h-screen">
  {children}
</div>
```

### Color Palette for Vault

| Element | Color | HSL Value |
|---------|-------|-----------|
| Background | Charcoal | 0 0% 12% |
| Card | Darker Charcoal | 0 0% 14% |
| Text | Off-white/Cream | 45 30% 90% |
| Accent | Gold/Champagne | 43 65% 52% |
| Muted Text | Gray | 0 0% 50% |
| Borders | Dark Gray | 0 0% 18% |
| Success (Paid) | Muted Green | 145 40% 45% |
| Warning (Sent) | Muted Amber | 40 60% 50% |
| Danger (Overdue) | Muted Red | 0 50% 50% |

---

## New Files Summary

### Pages
- `src/pages/Studio.tsx` (update existing)
- `src/pages/Vault.tsx` (update existing)
- `src/pages/PublicCalendar.tsx` (new - for shareable link)

### Components

```text
src/components/studio/
  |-- StudioCalendar.tsx
  |-- StudioEventDialog.tsx
  |-- StudioEventCard.tsx
  |-- StudioSidebar.tsx
  |-- CalendarGrid.tsx
  |-- CalendarCell.tsx

src/components/vault/
  |-- VaultLayout.tsx
  |-- VaultTabs.tsx
  |-- FinancialLedger.tsx
  |-- FinancialEntryDialog.tsx
  |-- RevenueChart.tsx
  |-- InvoiceButton.tsx
  |-- TeamTab.tsx
  |-- StaffProfileCard.tsx
  |-- ContractUploader.tsx
  |-- PerformanceLog.tsx
  |-- AddPerformanceNote.tsx
```

### Hooks

```text
src/hooks/
  |-- useStudioBookings.ts
  |-- useBookingConflicts.ts
  |-- usePublicCalendarToken.ts
  |-- useFinancialEntries.ts
  |-- useStaffProfiles.ts
  |-- usePerformanceLogs.ts
```

---

## Database Migrations

### Migration 1: Studio Enhancements

```sql
-- Add missing columns to studio_bookings
ALTER TABLE studio_bookings ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE studio_bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Public calendar tokens
CREATE TABLE public_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public_calendar_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Staff can manage tokens" ON public_calendar_tokens
  FOR ALL USING (is_admin_or_staff(auth.uid()));
```

### Migration 2: Financial Ledger

```sql
CREATE TABLE financial_entries (...);
-- As defined above with RLS
```

### Migration 3: HR & Staff

```sql
CREATE TABLE staff_profiles (...);
CREATE TABLE performance_logs (...);
-- As defined above with RLS

-- Storage bucket via SQL
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr-documents', 'hr-documents', false);
```

---

## Routing Updates

```typescript
// App.tsx additions
import PublicCalendar from "./pages/PublicCalendar";

// Add route
<Route path="/calendar/:token" element={<PublicCalendar />} />
```

---

## Role-Based Access Summary

| Feature | Admin | Staff (Frankie) | Client |
|---------|-------|-----------------|--------|
| Studio Calendar (View) | Yes | Yes | No |
| Studio Calendar (Edit) | Yes | Yes | No |
| Public Calendar Link | Yes | Yes | No |
| Vault Access | Yes | **No** (Redirect) | **No** (Redirect) |
| Financials Tab | Yes | No | No |
| HR/Team Tab | Yes | No | No |
| Client Database Tab | Yes | No | No |

**Per custom knowledge**: Frankie (Staff) should never see Financials or HR tabs. This is enforced both by:
1. Navigation filtering in AppSidebar (Vault hidden for non-admin)
2. Programmatic redirect if Staff tries to access `/vault` directly

---

## Implementation Sequence

### Phase 1: Database & Infrastructure
1. Run database migrations (studio enhancements, financial ledger, HR tables)
2. Create storage bucket for HR documents
3. Add Vault theme CSS variables

### Phase 2: Studio Calendar
4. Build CalendarGrid and CalendarCell components
5. Implement StudioEventDialog with conflict checking
6. Create useStudioBookings hook with CRUD operations
7. Build public calendar view and token generation

### Phase 3: Financial Vault
8. Create VaultLayout with dark theme
9. Build FinancialLedger table component
10. Implement RevenueChart with Recharts
11. Add Stripe integration for invoicing (requires Stripe enablement)

### Phase 4: HR Management
12. Build TeamTab within Vault
13. Create StaffProfileCard with contract uploader
14. Implement PerformanceLog timeline

### Phase 5: Polish & Security
15. Add role-based redirects to Vault page
16. Update AppSidebar to use real role checking
17. Test all access control scenarios

---

## Stripe Integration Note

The "Issue Invoice" feature requires Stripe to be enabled for this project. When you're ready to implement invoicing:

1. I'll enable Stripe integration
2. Create an edge function for generating Stripe Payment Links
3. Store and display the payment links in the ledger

This can be added after the core Financial Vault is built.

---

## Edge Cases Handled

- **Double-booking prevention**: Server-side validation before insert/update
- **Staff accessing Vault URL**: Graceful redirect with toast message
- **Expired calendar share tokens**: Show "Link expired" message
- **Empty states**: All tables/lists have elegant empty state designs
- **Mobile responsiveness**: Calendar adapts to smaller screens with day-by-day view

