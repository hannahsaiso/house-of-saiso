import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AISearchResult {
  answer: string | null;
  isQuestion: boolean;
}

export function useAISearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAISearch = async (query: string): Promise<AISearchResult> => {
    if (!query || query.trim().length < 3) {
      setAiAnswer(null);
      return { answer: null, isQuestion: false };
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-search", {
        body: { query },
      });

      if (fnError) {
        console.error("AI search error:", fnError);
        setError(fnError.message);
        return { answer: null, isQuestion: false };
      }

      if (data?.error) {
        setError(data.error);
        return { answer: null, isQuestion: false };
      }

      setAiAnswer(data?.answer || null);
      return {
        answer: data?.answer || null,
        isQuestion: data?.isQuestion || false,
      };
    } catch (err) {
      console.error("AI search failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return { answer: null, isQuestion: false };
    } finally {
      setIsSearching(false);
    }
  };

  const clearAIAnswer = () => {
    setAiAnswer(null);
    setError(null);
  };

  return {
    performAISearch,
    clearAIAnswer,
    isSearching,
    aiAnswer,
    error,
  };
}
