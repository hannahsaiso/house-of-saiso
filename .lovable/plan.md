

# House of Saiso Portal
### A Clean Editorial Agency OS

---

## Phase 1: Foundation (Starting Now)

### 🎨 Design System
- **Color Palette**: Off-white `#FDFCFB` background, Charcoal `#1A1A1A` text, Champagne `#D4AF37` accents
- **Typography**: Playfair Display for headings (elegant serif), Inter for UI elements (clean sans-serif)
- **Visual Language**: Wide letter spacing on navigation, generous whitespace, subtle fade-in animations

### 🧭 Navigation Sidebar
- Editorial-style with **ALL-CAPS** menu labels and wide tracking
- Collapsible mini-mode showing icons only
- Sections organized by:
  - **DASHBOARD** — Unified home view
  - **PROJECTS** — Client project workspaces
  - **STUDIO** — Booking calendar
  - **VAULT** — Admin-only section (hidden for Staff/Clients)

### 📊 Landing Dashboard
- Dual-stream layout showing:
  - Active project summary cards (agency side)
  - Upcoming studio bookings snapshot (creative side)
  - Quick-action buttons for common tasks
- Personalized greeting based on user role

---

## Phase 2: Database Architecture (Supabase)

### 🔐 Role-Based Access
Three distinct roles with Row Level Security:
- **Admin (You)**: Full access to everything
- **Staff (Frankie)**: Access to projects, studio, no Vault
- **Clients**: View their own projects and studio availability only

### 📋 Database Schema
**Core Tables:**
- `profiles` — User profiles linked to auth
- `user_roles` — Role assignments (admin/staff/client)
- `clients` — Master client database
- `projects` — Client project containers
- `tasks` — Kanban tasks with priority & deadlines
- `studio_bookings` — Detailed booking records (type, duration, equipment, notes)

---

## Future Phases (To Build Incrementally)

### Phase 3: Studio Calendar
- Interactive calendar with blocked dates
- Booking details: type, duration, equipment, notes
- Admin/Staff can block; Clients view availability

### Phase 4: Project Workspaces
- Kanban board with drag-drop tasks
- Document gallery for file sharing
- Real-time chat sidebar

### Phase 5: Admin Vault
- Financial tracking ledger
- HR document storage
- Client database master view

### Phase 6: Invitations System
- Admin sends invites via email
- New users set password on first login

---

## Starting Now

I'll build the **Design System**, **Editorial Navigation Sidebar**, **Landing Dashboard**, and create the complete **Supabase Schema** with RLS policies for your three-role system.

