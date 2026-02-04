import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Download, Trash2, File, Image, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

interface ProjectDocument {
  id: string;
  project_id: string;
  client_id: string | null;
  document_type: string;
  title: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface DocumentsTabProps {
  projectId: string;
  clientId?: string | null;
}

const typeIcons: Record<string, React.ElementType> = {
  image: Image,
  pdf: FileText,
  archive: FileArchive,
  default: File,
};

const documentTypeLabels: Record<string, string> = {
  signed_contract: "Signed Contract",
  asset: "Asset",
  deliverable: "Deliverable",
  reference: "Reference",
};

export function DocumentsTab({ projectId, clientId }: DocumentsTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { isAdminOrStaff, isLoading: roleLoading } = useUserRole();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const filePath = `${projectId}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: insertError } = await supabase
        .from("project_documents")
        .insert({
          project_id: projectId,
          client_id: clientId,
          document_type: "asset",
          title: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
        });

      if (insertError) throw insertError;

      // Create notification for staff
      if (!isAdminOrStaff) {
        const { data: staffUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "staff");

        if (staffUsers) {
          const notifications = staffUsers.map((staff) => ({
            user_id: staff.user_id,
            type: "asset_uploaded",
            title: "New Asset Uploaded",
            message: `Client uploaded: ${file.name}`,
            data: { projectId, fileName: file.name },
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Document uploaded successfully");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error("Failed to upload document");
      console.error(error);
      setIsUploading(false);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: ProjectDocument) => {
      // Delete from storage
      await supabase.storage
        .from("project-documents")
        .remove([doc.file_path]);

      // Delete record
      const { error } = await supabase
        .from("project_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Document deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete document");
      console.error(error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocument.mutate(file);
    }
  };

  const handleDownload = async (doc: ProjectDocument) => {
    const { data } = await supabase.storage
      .from("project-documents")
      .createSignedUrl(doc.file_path, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return typeIcons.default;
    if (mimeType.startsWith("image/")) return typeIcons.image;
    if (mimeType === "application/pdf") return typeIcons.pdf;
    if (mimeType.includes("zip") || mimeType.includes("archive")) return typeIcons.archive;
    return typeIcons.default;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading || roleLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Document Gallery</h3>
          <p className="text-sm text-muted-foreground">
            Signed contracts, deliverables, and shared assets
          </p>
        </div>
        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button size="sm" className="gap-2 cursor-pointer" asChild>
            <span>
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload"}
            </span>
          </Button>
        </label>
      </div>

      {/* Documents Grid */}
      {!documents || documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium">No documents yet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload files or signed documents will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, index) => {
            const Icon = getFileIcon(doc.mime_type);

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group transition-all hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{doc.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {documentTypeLabels[doc.document_type] || doc.document_type}
                          </Badge>
                          {doc.file_size && (
                            <span>{formatFileSize(doc.file_size)}</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                      {isAdminOrStaff && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => deleteDocument.mutate(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
