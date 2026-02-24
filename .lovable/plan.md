

## Add New Columns to Projects Table

Three new columns will be added to the `projects` table to support AI briefs, coordinator assignment, and Drive folder links.

### Database Migration

A single migration will add these nullable text columns:

| Column | Type | Purpose |
|---|---|---|
| `ai_creative_brief` | text, nullable | Stores LLM-generated analysis from onboarding |
| `assigned_coordinator` | text, nullable | Assigns project to a coordinator (e.g. "Frankie") for filtering |
| `automated_folder_link` | text, nullable | Stores the Google Drive URL from automation |

### Technical Details

**Migration SQL:**
```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS ai_creative_brief text,
  ADD COLUMN IF NOT EXISTS assigned_coordinator text,
  ADD COLUMN IF NOT EXISTS automated_folder_link text;
```

**Code Updates:**
- Update `src/hooks/useProjects.ts` -- add the three new fields to the `Project` TypeScript interface so they are available throughout the app.

No RLS changes needed since the existing project policies already cover these columns. No UI changes required at this stage -- the columns will be ready for use by future features.

