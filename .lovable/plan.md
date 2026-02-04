
# Frankie's View: Onboarding Submissions Dashboard
### A Staff-Focused Summary for Quick Task Setup

---

## Overview

This plan creates a dedicated section on the dashboard for Frankie (and all Staff users) to see recently onboarded clients with their key information, enabling immediate internal task list creation. The view respects role-based access - showing only what Staff should see (no financials, no HR data).

---

## Design Approach

### Location Strategy
Rather than creating a completely separate page, I'll add an "Onboarding Queue" section to the main Dashboard that appears for Admin and Staff users only. This keeps Frankie in the familiar dashboard flow while surfacing the critical onboarding data he needs.

### Visual Design
Following the established "Clean Editorial" aesthetic:
- Card-based layout matching existing `ProjectCard` and `StudioBookingCard` patterns
- Elegant serif headings with the Playfair Display font
- Staggered fade-in animations using Framer Motion
- Champagne accent for actionable elements

---

## User Interface

### Onboarding Queue Section
```text
+----------------------------------------------------------+
|  ONBOARDING QUEUE                           View All >   |
|                                                          |
|  +----------------------------------------------------+  |
|  |  [Company Logo Placeholder]                        |  |
|  |  Lumina Beauty                    2 hours ago      |  |
|  |  Contact: Sarah Chen                               |  |
|  |  ----------------------------------------          |  |
|  |  Services: Content Creation, Studio Rental         |  |
|  |  Vision: "Looking to refresh our brand..."         |  |
|  |  ----------------------------------------          |  |
|  |  [View Full Profile]  [Start Task Setup]           |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  |  Terra Wellness                   Yesterday        |  |
|  |  Contact: Michael Torres                           |  |
|  |  Services: SEO & Analytics, Social Media           |  |
|  |  Vision: "We want to expand our digital..."        |  |
|  |  [View Full Profile]  [Start Task Setup]           |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### Client Profile Drawer/Modal
When "View Full Profile" is clicked, a slide-out sheet displays:
- All basic info (company, contact, socials)
- Project vision text
- Services needed (visual tags)
- Brand assets gallery (thumbnails from storage)
- Notes field
- "Create Tasks" action button

---

## New Components

### Files to Create

```text
src/components/dashboard/
  ├── OnboardingQueue.tsx          - Section wrapper with query
  ├── OnboardingSubmissionCard.tsx - Individual submission card
  └── ClientProfileSheet.tsx       - Detailed client view drawer
```

### Component Details

**OnboardingQueue.tsx**
- Fetches recent clients (onboarded_at DESC, limit 5)
- Shows loading skeleton during fetch
- Empty state when no recent submissions
- "View All" links to full list (future enhancement)
- Only renders for Admin/Staff roles

**OnboardingSubmissionCard.tsx**
- Displays: Company name, contact name, services (as tags), truncated vision
- Relative timestamp ("2 hours ago", "Yesterday")
- Two action buttons: View Profile, Start Task Setup
- Staggered animation on mount

**ClientProfileSheet.tsx**
- Uses Radix Sheet component (slide from right)
- Complete client information display
- Brand assets as thumbnail gallery
- "Create First Task" button that navigates to project workspace

---

## Hooks & Data Fetching

### New Hook: useRecentOnboardings.ts
```typescript
// Fetches clients with onboarded_at in descending order
// Includes related project data
// Only accessible by Admin/Staff (RLS enforced)
```

### New Hook: useUserRole.ts
```typescript
// Fetches current user's role from user_roles table
// Caches with React Query
// Returns: { role: 'admin' | 'staff' | 'client', loading: boolean }
```

---

## Dashboard Integration

### Modified Files

**src/pages/Index.tsx**
- Import useUserRole hook
- Conditionally render OnboardingQueue for admin/staff
- Position above the existing dual-stream layout
- Adjust layout grid when queue is present

**src/components/dashboard/QuickActions.tsx**
- Add "View Onboarding Queue" quick action for staff (optional)

---

## Role-Based Visibility

| Element | Admin | Staff (Frankie) | Client |
|---------|-------|-----------------|--------|
| Onboarding Queue | Yes | Yes | No |
| Client Profile | Yes | Yes | No |
| Start Task Setup | Yes | Yes | No |
| Internal Task Notes | Yes | Yes | No |
| Financials | Yes | No | No |
| HR Tabs | Yes | No | No |

The Onboarding Queue and Client Profile are available to both Admin and Staff. Per the custom knowledge, Frankie should never see Financials or HR (which will be in the Vault), and Clients should never see Internal Task Notes (already enforced via RLS on tasks table).

---

## Data Structure

### Query for OnboardingQueue
```sql
SELECT 
  c.id,
  c.company,
  c.name as contact_name,
  c.email,
  c.services_needed,
  c.project_goals,
  c.brand_assets_folder,
  c.onboarded_at,
  p.id as project_id,
  p.title as project_title
FROM clients c
LEFT JOIN projects p ON p.client_id = c.id
WHERE c.onboarded_at IS NOT NULL
ORDER BY c.onboarded_at DESC
LIMIT 5
```

This query is protected by existing RLS policies on the `clients` table that only allow Admin/Staff to view.

---

## Technical Details

### React Query Integration
- `useQuery` for fetching onboarding submissions
- Stale time of 30 seconds for fresh data
- Refetch on window focus

### Animation Sequence
1. Section header fades in first
2. Cards stagger in with 100ms delay each
3. Sheet slides from right with 300ms transition

### Responsive Behavior
- Full-width cards on mobile
- Sheet becomes full-screen modal on mobile
- Touch-friendly tap targets

---

## Implementation Sequence

1. **Create useUserRole hook** - Foundation for role-based rendering
2. **Create useRecentOnboardings hook** - Data fetching with React Query
3. **Build OnboardingSubmissionCard** - Individual card component
4. **Build ClientProfileSheet** - Detailed view drawer
5. **Build OnboardingQueue** - Section wrapper with empty state
6. **Integrate into Index.tsx** - Conditional rendering for Admin/Staff
7. **Add animations** - Framer Motion polish

---

## Empty & Loading States

### Loading State
Skeleton cards matching the OnboardingSubmissionCard layout

### Empty State
```text
+----------------------------------------------------+
|                                                    |
|     [Clipboard Icon]                               |
|                                                    |
|     No recent onboardings                          |
|     New client submissions will appear here.       |
|                                                    |
+----------------------------------------------------+
```

---

## Future Enhancements (Not in Scope)

- Full onboarding list page with filtering
- Direct task creation from the profile sheet
- Real-time updates when new clients onboard
- Email notification integration
