 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useGoogleOAuth } from "./useGoogleOAuth";
 
 export interface DriveFile {
   id: string;
   name: string;
   mimeType: string;
   webViewLink?: string;
   iconLink?: string;
   thumbnailLink?: string;
   modifiedTime: string;
   size?: string;
   parents?: string[];
   owners?: { displayName: string; photoLink?: string }[];
 }
 
 export function useGoogleDrive(folderId?: string) {
   const { connection, isConnected, isTokenExpired } = useGoogleOAuth();
 
   const { data: files, isLoading, error, refetch } = useQuery({
     queryKey: ["google-drive-files", folderId, connection?.access_token],
     queryFn: async () => {
       if (!connection?.access_token) return [];
 
       // Build query - either root files or files in specific folder
       let query = "trashed = false";
       if (folderId) {
         query += ` and '${folderId}' in parents`;
       }
 
       const params = new URLSearchParams({
         q: query,
         fields: "files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,size,parents,owners)",
         orderBy: "modifiedTime desc",
         pageSize: "50",
       });
 
       const response = await fetch(
         `https://www.googleapis.com/drive/v3/files?${params}`,
         {
           headers: {
             Authorization: `Bearer ${connection.access_token}`,
           },
         }
       );
 
       if (!response.ok) {
         if (response.status === 401) {
           throw new Error("Token expired - please reconnect Google Workspace");
         }
         throw new Error("Failed to fetch Drive files");
       }
 
       const data = await response.json();
       return data.files as DriveFile[];
     },
     enabled: isConnected && !isTokenExpired,
     staleTime: 1000 * 60 * 2, // 2 minutes
   });
 
   return {
     files: files || [],
     isLoading,
     error,
     refetch,
     isConnected,
     isTokenExpired,
   };
 }
 
 export function useGoogleDriveSearch(searchQuery: string) {
   const { connection, isConnected, isTokenExpired } = useGoogleOAuth();
 
   const { data: files, isLoading, error } = useQuery({
     queryKey: ["google-drive-search", searchQuery, connection?.access_token],
     queryFn: async () => {
       if (!connection?.access_token || !searchQuery) return [];
 
       const query = `name contains '${searchQuery}' and trashed = false`;
       const params = new URLSearchParams({
         q: query,
         fields: "files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,size)",
         orderBy: "modifiedTime desc",
         pageSize: "20",
       });
 
       const response = await fetch(
         `https://www.googleapis.com/drive/v3/files?${params}`,
         {
           headers: {
             Authorization: `Bearer ${connection.access_token}`,
           },
         }
       );
 
       if (!response.ok) {
         throw new Error("Failed to search Drive");
       }
 
       const data = await response.json();
       return data.files as DriveFile[];
     },
     enabled: isConnected && !isTokenExpired && searchQuery.length > 0,
     staleTime: 1000 * 30,
   });
 
   return {
     files: files || [],
     isLoading,
     error,
     isConnected,
   };
 }