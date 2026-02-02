-- House of Saiso Portal Database Schema
-- Role-based access system with Admin, Staff, and Client roles

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'client');

-- 2. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. Create clients table (master client database)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'completed', 'archived')),
    due_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create project_members table (for client access to their projects)
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'collaborator')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

-- 7. Create tasks table (Kanban tasks)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    assigned_to UUID REFERENCES auth.users(id),
    internal_notes TEXT, -- Hidden from clients
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create studio_bookings table
CREATE TABLE public.studio_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    booking_type TEXT NOT NULL, -- e.g., 'Product Photography', 'Full Day Rental', 'Equipment Maintenance'
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    booked_by UUID REFERENCES auth.users(id),
    equipment_notes TEXT,
    notes TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT false, -- Admin/Staff can block dates
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_bookings_updated_at
    BEFORE UPDATE ON public.studio_bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Helper function to check if user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'staff')
    )
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'admin'
    )
$$;

-- Helper function to check if user is a member of a project
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.project_members
        WHERE user_id = _user_id
          AND project_id = _project_id
    )
$$;

-- 11. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_bookings ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admin/Staff can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 13. RLS Policies for user_roles (admin only management)
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admin can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 14. RLS Policies for clients (Admin/Staff only)
CREATE POLICY "Admin/Staff can view all clients"
    ON public.clients FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/Staff can manage clients"
    ON public.clients FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 15. RLS Policies for projects
CREATE POLICY "Admin/Staff can view all projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Clients can view their assigned projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (public.is_project_member(auth.uid(), id));

CREATE POLICY "Admin/Staff can manage projects"
    ON public.projects FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 16. RLS Policies for project_members
CREATE POLICY "Admin/Staff can view all project members"
    ON public.project_members FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/Staff can manage project members"
    ON public.project_members FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 17. RLS Policies for tasks
-- Note: internal_notes should be hidden from clients at the application level
CREATE POLICY "Admin/Staff can view all tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Clients can view tasks for their projects (excluding internal_notes)"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Admin/Staff can manage tasks"
    ON public.tasks FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 18. RLS Policies for studio_bookings
CREATE POLICY "Admin/Staff can view all bookings"
    ON public.studio_bookings FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Clients can view non-blocked bookings (availability)"
    ON public.studio_bookings FOR SELECT
    TO authenticated
    USING (is_blocked = false);

CREATE POLICY "Admin/Staff can manage bookings"
    ON public.studio_bookings FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 19. Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();