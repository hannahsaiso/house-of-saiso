import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Receipt,
  Search,
  Loader2,
  Sparkles,
  ExternalLink,
  CalendarDays
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useProjects";
import { useAISearch, SourceReference } from "@/hooks/useAISearch";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "project" | "task" | "client" | "ledger";
  subtitle?: string;
  url: string;
}

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { isAdmin, isAdminOrStaff } = useUserRole();
  const { performAISearch, aiAnswer, sources, isSearching: isAISearching, clearAIAnswer } = useAISearch();

  // CMD+K handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Clear AI answer when dialog closes
  useEffect(() => {
    if (!open) {
      clearAIAnswer();
      setQuery("");
      setResults([]);
    }
  }, [open, clearAIAnswer]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const q = searchQuery.toLowerCase();

    try {
      // Search projects
      const matchingProjects = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.client?.name?.toLowerCase().includes(q)
      );
      matchingProjects.slice(0, 5).forEach((p) => {
        searchResults.push({
          id: p.id,
          title: p.title,
          type: "project",
          subtitle: p.client?.name || undefined,
          url: `/projects?id=${p.id}`,
        });
      });

      // Search tasks (admin/staff only)
      if (isAdminOrStaff) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, title, project:projects(title)")
          .ilike("title", `%${searchQuery}%`)
          .limit(5);

        tasks?.forEach((t: any) => {
          searchResults.push({
            id: t.id,
            title: t.title,
            type: "task",
            subtitle: t.project?.title || undefined,
            url: `/projects?task=${t.id}`,
          });
        });
      }

      // Search clients (admin/staff only)
      if (isAdminOrStaff) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name, company")
          .or(`name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
          .limit(5);

        clients?.forEach((c) => {
          searchResults.push({
            id: c.id,
            title: c.name,
            type: "client",
            subtitle: c.company || undefined,
            url: `/vault?tab=clients&id=${c.id}`,
          });
        });
      }

      // Search ledger entries (admin only)
      if (isAdmin) {
        const { data: entries } = await supabase
          .from("financial_entries")
          .select("id, service_type, amount, client:clients(name)")
          .ilike("service_type", `%${searchQuery}%`)
          .limit(5);

        entries?.forEach((e: any) => {
          searchResults.push({
            id: e.id,
            title: `${e.service_type} — $${e.amount}`,
            type: "ledger",
            subtitle: e.client?.name || undefined,
            url: `/vault?tab=financials&id=${e.id}`,
          });
        });
      }

      setResults(searchResults);

      // Trigger AI search for questions
      if (searchQuery.length > 5) {
        performAISearch(searchQuery);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [projects, isAdmin, isAdminOrStaff, performAISearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.url);
  };

  const handleSourceClick = (source: SourceReference) => {
    setOpen(false);
    setQuery("");
    navigate(source.url);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "project":
        return FolderKanban;
      case "task":
        return CheckSquare;
      case "client":
        return Users;
      case "ledger":
        return Receipt;
    }
  };

  const getSourceIcon = (type: SourceReference["type"]) => {
    switch (type) {
      case "project":
        return FolderKanban;
      case "task":
        return CheckSquare;
      case "client":
        return Users;
      case "booking":
        return CalendarDays;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "project":
        return "Projects";
      case "task":
        return "Tasks";
      case "client":
        return "Clients";
      case "ledger":
        return "Ledger";
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search or ask a question..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[450px]">
        {/* AI Answer Section */}
        {(isAISearching || aiAnswer) && (
          <div className="border-b border-border/50 px-4 py-4 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {isAISearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-1">
                  AI Answer
                </p>
                {isAISearching ? (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Thinking...
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-foreground leading-relaxed">
                      {aiAnswer}
                    </p>
                    {/* Source Links */}
                    {sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Sources:
                        </span>
                        {sources.map((source) => {
                          const Icon = getSourceIcon(source.type);
                          return (
                            <button
                              key={`${source.type}-${source.id}`}
                              onClick={() => handleSourceClick(source)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                            >
                              <Icon className="h-3 w-3" />
                              <span className="max-w-[120px] truncate">{source.title}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {isSearching && !aiAnswer ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 && query && !aiAnswer ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={getTypeLabel(type as SearchResult["type"])}>
              {items.map((result) => {
                const Icon = getIcon(result.type);
                return (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-heading text-sm">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))
        )}

        {!query && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p>Search or ask a question...</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try: "Who worked on the last project?" or "List overdue tasks"
            </p>
            <p className="mt-2 font-mono text-xs">⌘K to open • ESC to close</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
