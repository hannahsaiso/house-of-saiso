 import { useQuery } from "@tanstack/react-query";
 import { format } from "date-fns";
 import { motion } from "framer-motion";
 import {
   Calendar,
   FileSignature,
   Receipt,
   Building2,
   Clock,
   CheckCircle2,
   XCircle,
   ArrowRight,
   Loader2,
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Separator } from "@/components/ui/separator";
 import { cn } from "@/lib/utils";
 import { useMutation, useQueryClient } from "@tanstack/react-query";
 import { toast } from "sonner";
 
 interface StudioRenterProfileProps {
   clientId: string;
   clientName: string;
   clientEmail?: string;
   clientCompany?: string;
 }
 
 export function StudioRenterProfile({ 
   clientId, 
   clientName,
   clientEmail,
   clientCompany,
 }: StudioRenterProfileProps) {
   const queryClient = useQueryClient();
 
   // Fetch booking history
   const { data: bookings } = useQuery({
     queryKey: ["client-bookings", clientId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("studio_bookings")
         .select("*")
         .eq("client_id", clientId)
         .order("date", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch signature requests
   const { data: signatures } = useQuery({
     queryKey: ["client-signatures", clientId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("signature_requests")
         .select("*")
         .eq("client_id", clientId)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch invoices
   const { data: invoices } = useQuery({
     queryKey: ["client-invoices", clientId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("financial_entries")
         .select("*")
         .eq("client_id", clientId)
         .eq("service_type", "studio")
         .order("date", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   // Convert to Agency Lead mutation
   const convertToLead = useMutation({
     mutationFn: async () => {
       const { data: user } = await supabase.auth.getUser();
       
       // Create a new project with Lead status
       const { data: project, error: projectError } = await supabase
         .from("projects")
         .insert({
           title: `${clientName} - Agency Lead`,
           description: `Converted from Studio Renter. Contact: ${clientEmail || "N/A"}`,
           status: "lead",
           client_id: clientId,
           created_by: user.user?.id,
         })
         .select()
         .single();
       
       if (projectError) throw projectError;
       
       // Update client type to include agency_client
       const { error: clientError } = await supabase
         .from("clients")
         .update({
           client_type: ["studio_renter", "agency_client"],
         })
         .eq("id", clientId);
       
       if (clientError) throw clientError;
       
       return project;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["clients"] });
       queryClient.invalidateQueries({ queryKey: ["projects"] });
       toast.success("Client converted to Agency Lead");
     },
     onError: (error) => {
       toast.error("Failed to convert: " + error.message);
     },
   });
 
   return (
     <div className="space-y-6">
       <div className="flex items-center gap-3">
         <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
           <Building2 className="h-6 w-6 text-blue-500" />
         </div>
         <div>
           <h2 className="font-heading text-xl font-semibold">{clientName}</h2>
           <Badge
             variant="outline"
             className="border-blue-500/30 bg-blue-500/10 text-blue-700"
           >
             Studio Renter
           </Badge>
         </div>
         
         {/* Convert to Agency Lead Button */}
         <Button
           variant="outline"
           size="sm"
           className="ml-auto gap-2 text-xs"
           onClick={() => convertToLead.mutate()}
           disabled={convertToLead.isPending}
         >
           {convertToLead.isPending ? (
             <Loader2 className="h-3 w-3 animate-spin" />
           ) : (
             <ArrowRight className="h-3 w-3" />
           )}
           Convert to Agency Lead
         </Button>
       </div>
 
       <Tabs defaultValue="bookings" className="w-full">
         <TabsList className="w-full justify-start">
           <TabsTrigger value="bookings" className="gap-2">
             <Calendar className="h-4 w-4" />
             Booking History
           </TabsTrigger>
           <TabsTrigger value="rules" className="gap-2">
             <FileSignature className="h-4 w-4" />
             Signed Rules
           </TabsTrigger>
           <TabsTrigger value="invoices" className="gap-2">
             <Receipt className="h-4 w-4" />
             Invoices
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="bookings" className="mt-4">
           <div className="space-y-3">
             {bookings?.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-8">
                 No booking history
               </p>
             ) : (
               bookings?.map((booking) => (
                 <motion.div
                   key={booking.id}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex items-center justify-between rounded-lg border p-4"
                 >
                   <div>
                     <p className="font-medium">
                       {booking.event_name || booking.booking_type}
                     </p>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Calendar className="h-3.5 w-3.5" />
                       {format(new Date(booking.date), "MMM d, yyyy")}
                       <span>•</span>
                       <Clock className="h-3.5 w-3.5" />
                       {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                     </div>
                   </div>
                   <Badge
                     variant={booking.status === "confirmed" ? "default" : "secondary"}
                   >
                     {booking.status}
                   </Badge>
                 </motion.div>
               ))
             )}
           </div>
         </TabsContent>
 
         <TabsContent value="rules" className="mt-4">
           <div className="space-y-3">
             {signatures?.filter((s) => s.document_type === "studio_rules").length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-8">
                 No signed documents
               </p>
             ) : (
               signatures
                 ?.filter((s) => s.document_type === "studio_rules")
                 .map((sig) => (
                   <div
                     key={sig.id}
                     className="flex items-center justify-between rounded-lg border p-4"
                   >
                     <div className="flex items-center gap-3">
                       <FileSignature className="h-5 w-5 text-muted-foreground" />
                       <div>
                         <p className="font-medium">Studio Rules Agreement</p>
                         <p className="text-sm text-muted-foreground">
                           {format(new Date(sig.created_at), "MMM d, yyyy")}
                         </p>
                       </div>
                     </div>
                     {sig.status === "completed" ? (
                       <div className="flex items-center gap-1 text-green-600">
                         <CheckCircle2 className="h-4 w-4" />
                         <span className="text-sm">Signed</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-1 text-amber-600">
                         <XCircle className="h-4 w-4" />
                         <span className="text-sm">{sig.status}</span>
                       </div>
                     )}
                   </div>
                 ))
             )}
           </div>
         </TabsContent>
 
         <TabsContent value="invoices" className="mt-4">
           <div className="space-y-3">
             {invoices?.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-8">
                 No invoices
               </p>
             ) : (
               invoices?.map((invoice) => (
                 <div
                   key={invoice.id}
                   className="flex items-center justify-between rounded-lg border p-4"
                 >
                   <div className="flex items-center gap-3">
                     <Receipt className="h-5 w-5 text-muted-foreground" />
                     <div>
                       <p className="font-medium font-mono-ledger">
                         ${Number(invoice.amount).toLocaleString()}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {invoice.description || "Studio Rental"}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <Badge
                       variant={invoice.payment_status === "paid" ? "default" : "secondary"}
                       className={cn(
                         invoice.payment_status === "paid" && "bg-green-500"
                       )}
                     >
                       {invoice.payment_status}
                     </Badge>
                     <p className="text-xs text-muted-foreground mt-1">
                       {format(new Date(invoice.date), "MMM d, yyyy")}
                     </p>
                   </div>
                 </div>
               ))
             )}
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 }