import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  path?: string;
}

export function useFileUpload(clientFolder: string) {
  const { toast } = useToast();

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      try {
        // Generate unique file path
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${clientFolder}/${fileName}`;

        // Upload to storage
        const { data, error } = await supabase.storage
          .from("client-assets")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("client-assets")
          .getPublicUrl(data.path);

        return {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          url: urlData.publicUrl,
          path: data.path,
        };
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
        return null;
      }
    },
    [clientFolder, toast]
  );

  const deleteFile = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        const { error } = await supabase.storage
          .from("client-assets")
          .remove([path]);

        if (error) throw error;
        return true;
      } catch (error: any) {
        console.error("Delete error:", error);
        toast({
          title: "Delete failed",
          description: error.message || "Failed to delete file",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  return { uploadFile, deleteFile };
}
