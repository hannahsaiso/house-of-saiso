 import { useState } from "react";
 import { motion } from "framer-motion";
 import { 
   HardDrive, 
   Search, 
   Folder, 
   FileText, 
   Image, 
   Film, 
   Music, 
   FileSpreadsheet,
   Presentation,
   ExternalLink,
   RefreshCw,
   Loader2
 } from "lucide-react";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { useGoogleDrive, useGoogleDriveSearch, DriveFile } from "@/hooks/useGoogleDrive";
 import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
 import { ConnectWorkspacePrompt } from "@/components/drive/ConnectWorkspacePrompt";
 import { formatDistanceToNow } from "date-fns";
 import { cn } from "@/lib/utils";
 
 const getFileIcon = (mimeType: string) => {
   if (mimeType.includes("folder")) return Folder;
   if (mimeType.includes("image")) return Image;
   if (mimeType.includes("video")) return Film;
   if (mimeType.includes("audio")) return Music;
   if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
   if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
   return FileText;
 };
 
 const getFileColor = (mimeType: string) => {
   if (mimeType.includes("folder")) return "text-amber-500";
   if (mimeType.includes("image")) return "text-pink-500";
   if (mimeType.includes("video")) return "text-purple-500";
   if (mimeType.includes("audio")) return "text-green-500";
   if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "text-emerald-500";
   if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "text-orange-500";
   if (mimeType.includes("document") || mimeType.includes("word")) return "text-blue-500";
   return "text-muted-foreground";
 };
 
 function FileCard({ file }: { file: DriveFile }) {
   const Icon = getFileIcon(file.mimeType);
   const colorClass = getFileColor(file.mimeType);
 
   return (
     <motion.a
       href={file.webViewLink}
       target="_blank"
       rel="noopener noreferrer"
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="group block"
     >
       <Card className="transition-all duration-200 hover:border-primary/30 hover:shadow-md">
         <CardContent className="p-4">
           <div className="flex items-start gap-3">
             <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50", colorClass)}>
               <Icon className="h-5 w-5" />
             </div>
             <div className="min-w-0 flex-1">
               <p className="font-heading text-sm font-medium truncate group-hover:text-primary">
                 {file.name}
               </p>
               <p className="font-mono text-xs text-muted-foreground mt-1">
                 {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true })}
               </p>
             </div>
             <ExternalLink className="h-4 w-4 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
           </div>
         </CardContent>
       </Card>
     </motion.a>
   );
 }
 
 export default function Drive() {
   const [searchQuery, setSearchQuery] = useState("");
   const { isConnected, isTokenExpired, isLoading: oauthLoading } = useGoogleOAuth();
   const { files, isLoading, refetch } = useGoogleDrive();
   const { files: searchResults, isLoading: searchLoading } = useGoogleDriveSearch(searchQuery);
 
   const displayFiles = searchQuery ? searchResults : files;
   const isDataLoading = searchQuery ? searchLoading : isLoading;
 
   // Show connect prompt if not connected
   if (!oauthLoading && (!isConnected || isTokenExpired)) {
     return (
       <DashboardLayout>
         <ConnectWorkspacePrompt feature="drive" />
       </DashboardLayout>
     );
   }
 
   return (
     <DashboardLayout>
       <div className="mx-auto max-w-6xl space-y-8">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
         >
           <div className="flex items-center justify-between">
             <div>
               <p className="mb-2 font-heading text-xs font-medium uppercase tracking-widest text-muted-foreground">
                 Google Workspace
               </p>
               <h1 className="font-heading text-3xl font-semibold tracking-tight">
                 Drive
               </h1>
               <p className="mt-2 text-muted-foreground">
                 Access your Google Drive files and folders.
               </p>
             </div>
             <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
               <RefreshCw className="h-4 w-4" />
               Refresh
             </Button>
           </div>
         </motion.div>
 
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Search files..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 font-heading"
           />
         </div>
 
         {/* Files Grid */}
         {isDataLoading ? (
           <div className="flex items-center justify-center py-16">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
         ) : displayFiles.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 text-center">
             <HardDrive className="mb-4 h-12 w-12 text-muted-foreground/50" />
             <h3 className="font-heading text-lg font-medium">
               {searchQuery ? "No files found" : "No files yet"}
             </h3>
             <p className="mt-2 text-sm text-muted-foreground">
               {searchQuery 
                 ? "Try a different search term" 
                 : "Files from your Google Drive will appear here"}
             </p>
           </div>
         ) : (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {displayFiles.map((file) => (
               <FileCard key={file.id} file={file} />
             ))}
           </div>
         )}
       </div>
     </DashboardLayout>
   );
 }