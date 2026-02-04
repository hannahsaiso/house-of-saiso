import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileImage, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploading?: boolean;
}

interface FileDropzoneProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onUpload: (file: File) => Promise<UploadedFile | null>;
  accept?: string;
  maxFiles?: number;
}

export function FileDropzone({
  files,
  onFilesChange,
  onUpload,
  accept = "image/*,.pdf",
  maxFiles = 10,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      await processFiles(droppedFiles);
    },
    [files, onFilesChange, onUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        await processFiles(selectedFiles);
      }
    },
    [files, onFilesChange, onUpload]
  );

  const processFiles = async (newFiles: File[]) => {
    const remainingSlots = maxFiles - files.length;
    const filesToProcess = newFiles.slice(0, remainingSlots);

    let currentFiles = [...files];

    for (const file of filesToProcess) {
      const tempId = crypto.randomUUID();
      const tempFile: UploadedFile = {
        id: tempId,
        name: file.name,
        type: file.type,
        uploading: true,
      };

      currentFiles = [...currentFiles, tempFile];
      onFilesChange(currentFiles);

      const uploadedFile = await onUpload(file);
      if (uploadedFile) {
        currentFiles = currentFiles.map((f) =>
          f.id === tempId ? uploadedFile : f
        );
      } else {
        currentFiles = currentFiles.filter((f) => f.id !== tempId);
      }
      onFilesChange(currentFiles);
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FileImage;
    return FileText;
  };

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ scale: isDragging ? 1.02 : 1 }}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Drop your files here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Images & PDFs up to 10MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Uploaded files gallery */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg border bg-muted/50 flex flex-col items-center justify-center p-4 overflow-hidden">
                    {file.uploading ? (
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    ) : file.type.startsWith("image/") && file.url ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <FileIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.name}
                  </p>
                  {!file.uploading && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {files.length === 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-dashed border-border/50 bg-muted/20 flex items-center justify-center"
            >
              <FileImage className="w-6 h-6 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
