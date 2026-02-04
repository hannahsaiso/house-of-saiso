import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StaffProfile {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  hire_date: string | null;
  contract_file_path: string | null;
  avatar_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffProfileData {
  full_name: string;
  email?: string;
  phone?: string;
  role?: string;
  hire_date?: string;
  user_id?: string;
}

export function useStaffProfiles() {
  const queryClient = useQueryClient();

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as StaffProfile[];
    },
  });

  const createProfile = useMutation({
    mutationFn: async (data: CreateStaffProfileData) => {
      const { data: result, error } = await supabase
        .from("staff_profiles")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      toast.success("Staff profile created");
    },
    onError: (error) => {
      toast.error("Failed to create profile: " + error.message);
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateStaffProfileData> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("staff_profiles")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const uploadContract = useMutation({
    mutationFn: async ({ staffId, file }: { staffId: string; file: File }) => {
      const filePath = `${staffId}/contracts/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("hr-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("staff_profiles")
        .update({ contract_file_path: filePath })
        .eq("id", staffId);

      if (updateError) throw updateError;

      return filePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      toast.success("Contract uploaded");
    },
    onError: (error) => {
      toast.error("Failed to upload contract: " + error.message);
    },
  });

  const getContractUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("hr-documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    return data?.signedUrl;
  };

  return {
    profiles: profiles || [],
    isLoading,
    error,
    createProfile,
    updateProfile,
    uploadContract,
    getContractUrl,
  };
}
