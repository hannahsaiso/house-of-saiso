import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SourceReference {
  type: "project" | "task" | "client" | "booking";
  id: string;
  title: string;
  url: string;
}

interface AISearchResult {
  answer: string | null;
  isQuestion: boolean;
  sources: SourceReference[];
}

export function useAISearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceReference[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performAISearch = useCallback(async (query: string): Promise<AISearchResult> => {
    if (!query || query.trim().length < 3) {
      setAiAnswer(null);
      setSources([]);
      return { answer: null, isQuestion: false, sources: [] };
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
        return { answer: null, isQuestion: false, sources: [] };
      }

      if (data?.error) {
        setError(data.error);
        return { answer: null, isQuestion: false, sources: [] };
      }

      setAiAnswer(data?.answer || null);
      setSources(data?.sources || []);
      return {
        answer: data?.answer || null,
        isQuestion: data?.isQuestion || false,
        sources: data?.sources || [],
      };
    } catch (err) {
      console.error("AI search failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return { answer: null, isQuestion: false, sources: [] };
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearAIAnswer = useCallback(() => {
    setAiAnswer(null);
    setSources([]);
    setError(null);
  }, []);

  return {
    performAISearch,
    clearAIAnswer,
    isSearching,
    aiAnswer,
    sources,
    error,
  };
}
