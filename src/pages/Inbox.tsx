import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  RefreshCw, 
  User, 
  ArrowLeft, 
  Reply, 
  Loader2,
  ExternalLink,
  Pin
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useGmailInbox, useGmailThread, ParsedEmail } from "@/hooks/useGmailInbox";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { ConnectWorkspacePrompt } from "@/components/drive/ConnectWorkspacePrompt";
import { PinToProjectDialog } from "@/components/mail/PinToProjectDialog";
import { EmailListSkeleton, EmailDetailSkeleton } from "@/components/ui/skeleton-loaders";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
 
 function formatEmailDate(date: Date): string {
   if (isToday(date)) {
     return format(date, "h:mm a");
   }
   if (isYesterday(date)) {
     return "Yesterday";
   }
   return format(date, "MMM d");
 }
 
 interface EmailWithClient extends ParsedEmail {
   matchedClient: { id: string; name: string; email: string } | null;
 }
 
export default function Inbox() {
  const { emails, isLoading, refetch, isConnected, isTokenExpired } = useGmailInbox();
  const { connection } = useGoogleOAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { data: threadMessages, isLoading: isLoadingThread } = useGmailThread(selectedThreadId);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [emailToPin, setEmailToPin] = useState<{
    threadId: string;
    subject: string;
    from: string;
    body: string;
    date: Date;
  } | null>(null);

  const selectedEmail = emails.find((e) => e.threadId === selectedThreadId);

  const handlePinEmail = (email: ParsedEmail) => {
    setEmailToPin({
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      body: email.snippet,
      date: email.date,
    });
    setPinDialogOpen(true);
  };
 
   // Handle not connected state
   if (!isConnected || isTokenExpired) {
     return (
       <DashboardLayout>
          <ConnectWorkspacePrompt feature="mail" />
       </DashboardLayout>
     );
   }
 
   return (
     <DashboardLayout>
       <div className="mx-auto max-w-6xl">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-8"
         >
           <div className="flex items-center justify-between">
             <div>
                <p className="mb-2 font-heading text-xs font-medium uppercase tracking-widest text-muted-foreground">
                 Communications
               </p>
               <h1 className="font-heading text-3xl font-semibold tracking-tight">
                 Inbox
               </h1>
               <p className="mt-1 text-sm text-muted-foreground">
                 {connection?.google_email}
               </p>
             </div>
             <Button
               variant="outline"
               size="sm"
               onClick={() => refetch()}
               disabled={isLoading}
             >
               <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
               Refresh
             </Button>
           </div>
         </motion.div>
 
         <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)]">
           {/* Email List */}
           <div className={cn(
             "col-span-12 lg:col-span-5 overflow-hidden rounded-lg border border-border/50 bg-card",
             selectedThreadId && "hidden lg:block"
           )}>
             <div className="border-b border-border/50 px-6 py-4">
               <h2 className="font-heading text-sm font-medium uppercase tracking-editorial text-muted-foreground">
                 Recent Threads
               </h2>
             </div>
 
            <ScrollArea className="h-[calc(100%-60px)]">
              {isLoading ? (
                <EmailListSkeleton />
              ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Mail className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No emails found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {(emails as EmailWithClient[]).map((email) => (
                    <motion.div
                      key={email.threadId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "w-full text-left px-6 py-5 transition-colors hover:bg-muted/30 group",
                        selectedThreadId === email.threadId && "bg-muted/50",
                        email.isUnread && "bg-primary/5"
                      )}
                    >
                      <button
                        onClick={() => setSelectedThreadId(email.threadId)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {email.isUnread && (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                              <span className={cn(
                                "font-heading text-sm truncate",
                                email.isUnread ? "font-semibold" : "font-medium"
                              )}>
                                {email.from}
                              </span>
                              {email.matchedClient && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[9px] h-4 px-1.5 border-primary/30 bg-primary/10 text-primary shrink-0"
                                >
                                  Client
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              "font-heading text-sm truncate mb-1",
                              email.isUnread ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {email.subject}
                            </p>
                            <p className="text-xs text-muted-foreground/70 truncate">
                              {email.snippet}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                            {formatEmailDate(email.date)}
                          </span>
                        </div>
                      </button>
                      {/* Pin to Project Button */}
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinEmail(email);
                          }}
                        >
                          <Pin className="mr-1 h-3 w-3" />
                          Pin to Project
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
           </div>
 
           {/* Email Detail */}
           <div className={cn(
             "col-span-12 lg:col-span-7 overflow-hidden rounded-lg border border-border/50 bg-card",
             !selectedThreadId && "hidden lg:flex lg:items-center lg:justify-center"
           )}>
             {!selectedThreadId ? (
               <div className="text-center px-6 py-12">
                 <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                 <p className="text-sm text-muted-foreground">
                   Select an email to read
                 </p>
               </div>
             ) : (
               <>
                 {/* Thread Header */}
                 <div className="border-b border-border/50 px-6 py-4">
                   <div className="flex items-center justify-between">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setSelectedThreadId(null)}
                       className="lg:hidden"
                     >
                       <ArrowLeft className="mr-2 h-4 w-4" />
                       Back
                     </Button>
                     <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" asChild>
                         <a
                           href={`https://mail.google.com/mail/u/0/#inbox/${selectedThreadId}`}
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           <ExternalLink className="mr-2 h-3 w-3" />
                           Open in Gmail
                         </a>
                       </Button>
                     </div>
                   </div>
                 </div>
 
                <ScrollArea className="h-[calc(100%-65px)]">
                  {isLoadingThread ? (
                    <EmailDetailSkeleton />
                  ) : (
                    <div className="p-6 space-y-8">
                      {/* Subject */}
                      <h2 className="font-heading text-xl font-medium leading-tight">
                        {selectedEmail?.subject}
                      </h2>

                      {/* Messages in Thread */}
                      {threadMessages?.map((message, index) => (
                        <div key={message.id} className="space-y-4">
                          {index > 0 && <Separator />}
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-4 mb-1">
                                <span className="font-heading font-medium text-sm">
                                  {message.from}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                                  {format(message.date, "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-4">
                                to {message.to}
                              </p>
                              <div 
                                className="prose prose-sm max-w-none text-foreground/90 leading-relaxed"
                                style={{ 
                                  fontFamily: "var(--font-body)",
                                  fontSize: "14px",
                                  lineHeight: "1.8"
                                }}
                                dangerouslySetInnerHTML={{ 
                                  __html: message.body || message.snippet 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Reply CTA */}
                      <Card className="border-dashed">
                        <CardContent className="flex items-center justify-center py-6">
                          <Button variant="outline" asChild>
                            <a
                              href={`https://mail.google.com/mail/u/0/#inbox/${selectedThreadId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Reply className="mr-2 h-4 w-4" />
                              Reply in Gmail
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pin to Project Dialog */}
      <PinToProjectDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        emailData={emailToPin}
      />
    </DashboardLayout>
  );
}