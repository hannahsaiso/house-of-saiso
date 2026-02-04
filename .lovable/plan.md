

# Client Onboarding Module
### A Premium Multi-Step Wizard Experience

---

## Overview

This plan implements a sophisticated 4-step onboarding wizard at `/onboarding` that feels like a concierge experience. The design follows the established "Clean Editorial" aesthetic with progressive disclosure, elegant animations, and autosave functionality.

---

## User Interface Design

### Layout Philosophy
- **Progressive Disclosure**: One focused question cluster per step
- **Centered Stage**: Content presented in a narrow column (max-w-2xl) with generous whitespace
- **Editorial Typography**: Large Playfair Display serif for questions, Inter for inputs
- **Step Indicator**: Minimal horizontal progress bar with step labels

### Visual Flow
```text
+----------------------------------------------------------+
|                                                          |
|                    Step 1 of 4                           |
|           [=====-----------------------]                 |
|                                                          |
|                                                          |
|           "Tell us about your company..."                |
|                                                          |
|           +----------------------------------+            |
|           |  Company Name                    |            |
|           +----------------------------------+            |
|                                                          |
|           +----------------------------------+            |
|           |  Key Contact                     |            |
|           +----------------------------------+            |
|                                                          |
|                                                          |
|                   [Continue]                             |
|                                                          |
|               Saving progress...                         |
+----------------------------------------------------------+
```

---

## The 4-Step Flow

### Step 1: The Basics
**Heading**: "Tell us about your company..."
- Company name (required)
- Key contact name (required)
- Contact email (required)
- Contact phone (optional)
- Social handles: Instagram, LinkedIn, Website (optional)

### Step 2: Project Deep-Dive
**Heading**: "What's your vision?"
- Project goals (large textarea with placeholder guidance)
- Services needed (multi-select toggle cards):
  - Content Creation
  - Social Media Management
  - SEO & Analytics
  - Studio Rental
  - Brand Strategy
  - Video Production

### Step 3: Brand Assets
**Heading**: "Share your brand world..."
- Drag & drop zone with gallery-style empty state
- File types: Images (logos, mood boards), PDFs (brand guidelines)
- Files upload to storage bucket: `client-assets/{client_id}/`
- Display uploaded files as elegant thumbnails

### Step 4: Legal & Logistics
**Heading**: "Almost there..."
- Contract review section (placeholder text area showing contract summary)
- "Sign via DocuSign" button (polished placeholder with coming soon tooltip)
- Terms acceptance checkbox
- Final notes field

---

## Backend Changes

### Database Additions

**New table: `onboarding_drafts`**
Stores work-in-progress onboarding data:
```
- id (UUID, primary key)
- user_id (UUID, references auth.users)
- step (INTEGER, current step 1-4)
- data (JSONB, form data for all steps)
- created_at, updated_at
```

**Extended `clients` table columns**:
- `instagram_handle` (TEXT)
- `linkedin_url` (TEXT)
- `website_url` (TEXT)
- `project_goals` (TEXT)
- `services_needed` (TEXT[]) - array of selected services
- `brand_assets_folder` (TEXT) - storage path reference
- `onboarded_by` (UUID) - which user completed onboarding
- `onboarded_at` (TIMESTAMP)

**New table: `notifications`**
For alerting Admin/Staff of completed onboarding:
```
- id (UUID)
- user_id (UUID, recipient)
- type (TEXT, e.g., 'client_onboarded')
- title, message (TEXT)
- data (JSONB, metadata like client_id)
- read (BOOLEAN)
- created_at
```

### Storage Bucket
- Create `client-assets` bucket
- RLS: Admin/Staff can read all, clients can read their own folder

### RLS Policies
- `onboarding_drafts`: Users can manage their own drafts
- `notifications`: Users can read their own notifications, Admin/Staff can create

---

## New Files to Create

### Pages
- `src/pages/Onboarding.tsx` - Main wizard container with step state

### Components
```text
src/components/onboarding/
  ├── OnboardingLayout.tsx      - Clean centered layout without sidebar
  ├── OnboardingProgress.tsx    - Step indicator bar
  ├── StepBasics.tsx            - Step 1 form
  ├── StepProjectVision.tsx     - Step 2 with multi-select
  ├── StepBrandAssets.tsx       - Step 3 with drag-drop
  ├── StepLegal.tsx             - Step 4 with DocuSign placeholder
  ├── ServiceCard.tsx           - Toggle card for service selection
  └── FileDropzone.tsx          - Drag & drop component with preview
```

### Hooks
- `src/hooks/useOnboardingDraft.ts` - Auto-save/load draft from database
- `src/hooks/useFileUpload.ts` - Handle file uploads to storage

---

## Technical Details

### Autosave Logic
- Debounced save (2 seconds after last change)
- Visual indicator: "Saving..." / "Saved" with checkmark
- On page load: Check for existing draft and restore

### Animations (Framer Motion)
- Step transitions: Fade + subtle slide
- Form fields: Staggered fade-in on step entry
- Upload zone: Scale on drag-over
- Progress bar: Smooth width transition

### Form Validation (Zod + React Hook Form)
- Step-by-step validation before proceeding
- Inline error messages with editorial styling
- Required fields marked with subtle asterisk

### Completion Flow
1. User clicks "Complete Onboarding" on Step 4
2. Create `clients` record with all collected data
3. Create initial `projects` record linked to client
4. Add user as `project_member` with collaborator role
5. Create `notifications` for Admin + Staff users
6. Redirect to new project workspace (or dashboard)

---

## Files Modified

### Routing
- `src/App.tsx` - Add `/onboarding` route

### Navigation (Optional Enhancement)
- Add "Onboard Client" to QuickActions for Admin/Staff

---

## Implementation Sequence

1. **Database Migration**: Create new tables, extend clients, create storage bucket
2. **OnboardingLayout + Progress**: Centered layout, step indicator
3. **Step 1 (Basics)**: Form with validation, autosave hook
4. **Step 2 (Vision)**: Multi-select service cards
5. **Step 3 (Assets)**: File upload component with storage integration
6. **Step 4 (Legal)**: DocuSign placeholder, completion logic
7. **Notifications**: Alert Admin/Staff on completion
8. **Polish**: Animations, empty states, responsive design

---

## Role-Based Behavior

- **Admin/Staff**: Can access onboarding to create clients on behalf of prospects
- **Clients (Invited)**: Will use onboarding as their first experience after accepting invite

The wizard works for both self-onboarding and Admin-initiated client creation.

