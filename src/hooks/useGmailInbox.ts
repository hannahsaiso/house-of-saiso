 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useGoogleOAuth } from "./useGoogleOAuth";
 
 export interface GmailThread {
   id: string;
   snippet: string;
   historyId: string;
   messages: GmailMessage[];
 }
 
 export interface GmailMessage {
   id: string;
   threadId: string;
   labelIds: string[];
   snippet: string;
   payload: {
     headers: { name: string; value: string }[];
     body?: { data?: string; size?: number };
     parts?: { mimeType: string; body?: { data?: string } }[];
   };
   internalDate: string;
 }
 
 export interface ParsedEmail {
   id: string;
   threadId: string;
   subject: string;
   from: string;
   fromEmail: string;
   to: string;
   date: Date;
   snippet: string;
   body: string;
   isUnread: boolean;
   labels: string[];
 }
 
 function decodeBase64Url(data: string): string {
   try {
     const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
     return decodeURIComponent(
       atob(base64)
         .split("")
         .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
         .join("")
     );
   } catch {
     return "";
   }
 }
 
 function parseMessage(message: GmailMessage): ParsedEmail {
   const headers = message.payload.headers;
   const getHeader = (name: string) =>
     headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
 
   const from = getHeader("From");
   const fromMatch = from.match(/<(.+?)>/) || [null, from];
   const fromEmail = fromMatch[1] || from;
   const fromName = from.replace(/<.+?>/, "").trim() || fromEmail;
 
   // Extract body
   let body = "";
   if (message.payload.body?.data) {
     body = decodeBase64Url(message.payload.body.data);
   } else if (message.payload.parts) {
     const textPart = message.payload.parts.find(
       (p) => p.mimeType === "text/plain" || p.mimeType === "text/html"
     );
     if (textPart?.body?.data) {
       body = decodeBase64Url(textPart.body.data);
     }
   }
 
   return {
     id: message.id,
     threadId: message.threadId,
     subject: getHeader("Subject") || "(No Subject)",
     from: fromName,
     fromEmail,
     to: getHeader("To"),
     date: new Date(parseInt(message.internalDate)),
     snippet: message.snippet,
     body,
     isUnread: message.labelIds?.includes("UNREAD") || false,
     labels: message.labelIds || [],
   };
 }
 
 export function useGmailInbox(maxResults = 20) {
   const { connection, isConnected, isTokenExpired } = useGoogleOAuth();
   const queryClient = useQueryClient();
 
   const { data: emails, isLoading, error, refetch } = useQuery({
     queryKey: ["gmail-inbox", connection?.id],
     queryFn: async () => {
       if (!connection?.access_token) {
         throw new Error("Not connected to Google");
       }
 
       // Fetch thread list
       const listResponse = await fetch(
         `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&labelIds=INBOX`,
         {
           headers: {
             Authorization: `Bearer ${connection.access_token}`,
           },
         }
       );
 
       if (!listResponse.ok) {
         if (listResponse.status === 401) {
           throw new Error("TOKEN_EXPIRED");
         }
         throw new Error("Failed to fetch emails");
       }
 
       const listData = await listResponse.json();
       const threads = listData.threads || [];
 
       // Fetch full thread details in parallel
       const fullThreads = await Promise.all(
         threads.slice(0, maxResults).map(async (thread: { id: string }) => {
           const threadResponse = await fetch(
             `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=full`,
             {
               headers: {
                 Authorization: `Bearer ${connection.access_token}`,
               },
             }
           );
 
           if (!threadResponse.ok) return null;
           return threadResponse.json();
         })
       );
 
       // Parse threads - take the first message of each thread for inbox view
       const parsedEmails: ParsedEmail[] = fullThreads
         .filter((t): t is GmailThread => t !== null && t.messages?.length > 0)
         .map((thread) => {
           const latestMessage = thread.messages[thread.messages.length - 1];
           const parsed = parseMessage(latestMessage);
           return {
             ...parsed,
             // Check if any message in thread is unread
             isUnread: thread.messages.some((m) => m.labelIds?.includes("UNREAD")),
           };
         });
 
       return parsedEmails;
     },
     enabled: isConnected && !isTokenExpired && !!connection?.access_token,
     staleTime: 60 * 1000, // 1 minute
     refetchInterval: 5 * 60 * 1000, // 5 minutes
   });
 
   const { data: clients } = useQuery({
     queryKey: ["clients-for-matching"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("clients")
         .select("id, name, email");
       if (error) throw error;
       return data;
     },
   });
 
   // Match emails with clients
   const emailsWithClientInfo = emails?.map((email) => {
     const matchedClient = clients?.find(
       (c) => c.email && email.fromEmail.toLowerCase().includes(c.email.toLowerCase())
     );
     return {
       ...email,
       matchedClient: matchedClient || null,
     };
   });
 
   return {
     emails: emailsWithClientInfo || [],
     isLoading,
     error,
     refetch,
     isConnected,
     isTokenExpired,
   };
 }
 
 export function useGmailThread(threadId: string | null) {
   const { connection } = useGoogleOAuth();
 
   return useQuery({
     queryKey: ["gmail-thread", threadId],
     queryFn: async () => {
       if (!connection?.access_token || !threadId) return null;
 
       const response = await fetch(
         `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
         {
           headers: {
             Authorization: `Bearer ${connection.access_token}`,
           },
         }
       );
 
       if (!response.ok) {
         throw new Error("Failed to fetch thread");
       }
 
       const thread: GmailThread = await response.json();
       return thread.messages.map(parseMessage);
     },
     enabled: !!connection?.access_token && !!threadId,
   });
 }