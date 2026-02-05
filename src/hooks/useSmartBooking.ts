 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface SmartBookingResult {
   hasConflict: boolean;
   conflicts: Array<{
     id: string;
     event_name: string;
     start_time: string;
     end_time: string;
   }>;
   unavailableResources: string[];
   suggestion: string | null;
   availableAlternatives: Array<{
     id: string;
     item_name: string;
     category: string;
   }>;
 }
 
 export function useSmartBooking() {
   const [isChecking, setIsChecking] = useState(false);
   const [result, setResult] = useState<SmartBookingResult | null>(null);
 
   const checkAvailability = async (params: {
     date: string;
     start_time: string;
     end_time: string;
     booking_type: string;
     required_resources?: string[];
   }) => {
     setIsChecking(true);
     setResult(null);
 
     try {
       const { data, error } = await supabase.functions.invoke("smart-booking-assistant", {
         body: params,
       });
 
       if (error) throw error;
       setResult(data);
       return data;
     } catch (error) {
       console.error("Smart booking check failed:", error);
       return null;
     } finally {
       setIsChecking(false);
     }
   };
 
   const clearResult = () => setResult(null);
 
   return {
     checkAvailability,
     isChecking,
     result,
     clearResult,
   };
 }