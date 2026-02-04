import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface OnboardingSubmission {
  id: string;
  company: string | null;
  contactName: string;
  email: string | null;
  phone: string | null;
  instagramHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  servicesNeeded: string[] | null;
  projectGoals: string | null;
  brandAssetsFolder: string | null;
  onboardedAt: string;
  notes: string | null;
  projectId: string | null;
  projectTitle: string | null;
}

function transformClient(
  client: Tables<"clients">,
  project?: { id: string; title: string } | null
): OnboardingSubmission {
  return {
    id: client.id,
    company: client.company,
    contactName: client.name,
    email: client.email,
    phone: client.phone,
    instagramHandle: client.instagram_handle,
    linkedinUrl: client.linkedin_url,
    websiteUrl: client.website_url,
    servicesNeeded: client.services_needed,
    projectGoals: client.project_goals,
    brandAssetsFolder: client.brand_assets_folder,
    onboardedAt: client.onboarded_at!,
    notes: client.notes,
    projectId: project?.id ?? null,
    projectTitle: project?.title ?? null,
  };
}

export function useRecentOnboardings(limit: number = 5) {
  return useQuery({
    queryKey: ["recent-onboardings", limit],
    queryFn: async () => {
      // Fetch clients with onboarded_at set
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .not("onboarded_at", "is", null)
        .order("onboarded_at", { ascending: false })
        .limit(limit);

      if (clientsError) throw clientsError;
      if (!clients || clients.length === 0) return [];

      // Fetch related projects
      const clientIds = clients.map((c) => c.id);
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, client_id")
        .in("client_id", clientIds);

      // Map projects by client_id
      const projectsByClient = new Map(
        projects?.map((p) => [p.client_id, { id: p.id, title: p.title }]) ?? []
      );

      return clients.map((client) =>
        transformClient(client, projectsByClient.get(client.id))
      );
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
