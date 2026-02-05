import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Receipt,
  Search,
  Loader2
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

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
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [projects, isAdmin, isAdminOrStaff]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.url);
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
        placeholder="Search projects, tasks, clients..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isSearching ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 && query ? (
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
            <p>Start typing to search...</p>
            <p className="mt-1 font-mono text-xs">⌘K to open • ESC to close</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
