import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

// Simplified type for draft data that's JSON-compatible
type DraftData = Record<string, Json>;

interface DraftState {
  id: string | null;
  step: number;
  data: DraftData;
  loading: boolean;
  saving: boolean;
  lastSaved: Date | null;
}

export function useOnboardingDraft() {
  const { toast } = useToast();
  const [state, setState] = useState<DraftState>({
    id: null,
    step: 1,
    data: {},
    loading: true,
    saving: false,
    lastSaved: null,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const { data: draft, error } = await supabase
          .from("onboarding_drafts")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (draft) {
          setState({
            id: draft.id,
            step: draft.step,
            data: (draft.data as DraftData) || {},
            loading: false,
            saving: false,
            lastSaved: new Date(draft.updated_at),
          });
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadDraft();
  }, []);

  // Save draft function
  const saveDraft = useCallback(
    async (step: number, data: DraftData) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setState((prev) => ({ ...prev, saving: true }));

        // Serialize data to ensure JSON compatibility
        const jsonData = JSON.parse(JSON.stringify(data)) as Json;

        if (state.id) {
          // Update existing draft
          const { error } = await supabase
            .from("onboarding_drafts")
            .update({ step, data: jsonData, updated_at: new Date().toISOString() })
            .eq("id", state.id);

          if (error) throw error;
        } else {
          // Create new draft
          const { data: newDraft, error } = await supabase
            .from("onboarding_drafts")
            .insert([{ user_id: user.id, step, data: jsonData }])
            .select()
            .single();

          if (error) throw error;

          setState((prev) => ({ ...prev, id: newDraft.id }));
        }

        setState((prev) => ({
          ...prev,
          step,
          data,
          saving: false,
          lastSaved: new Date(),
        }));
      } catch (error) {
        console.error("Error saving draft:", error);
        setState((prev) => ({ ...prev, saving: false }));
        toast({
          title: "Failed to save progress",
          description: "Your changes may not be saved.",
          variant: "destructive",
        });
      }
    },
    [state.id, toast]
  );

  // Debounced save
  const debouncedSave = useCallback(
    (step: number, data: DraftData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveDraft(step, data);
      }, 2000);
    },
    [saveDraft]
  );

  // Delete draft after completion
  const deleteDraft = useCallback(async () => {
    if (!state.id) return;

    try {
      await supabase.from("onboarding_drafts").delete().eq("id", state.id);
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  }, [state.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draftId: state.id,
    initialStep: state.step,
    initialData: state.data,
    loading: state.loading,
    saving: state.saving,
    lastSaved: state.lastSaved,
    saveDraft: debouncedSave,
    saveImmediately: saveDraft,
    deleteDraft,
  };
}
