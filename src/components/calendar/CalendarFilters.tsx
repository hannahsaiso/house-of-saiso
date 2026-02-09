import { Circle, Calendar, CheckSquare, Building2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

export interface CalendarFilterState {
  studio: boolean;
  tasks: boolean;
  google: boolean;
  projects: boolean;
}

interface CalendarFiltersProps {
  filters: CalendarFilterState;
  onFiltersChange: (filters: CalendarFilterState) => void;
  hasGoogleConnection: boolean;
}

export function CalendarFilters({
  filters,
  onFiltersChange,
  hasGoogleConnection,
}: CalendarFiltersProps) {
  const toggleFilter = (key: keyof CalendarFilterState) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  // Convert filter state to array for ToggleGroup
  const activeFilters = Object.entries(filters)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const handleValueChange = (values: string[]) => {
    onFiltersChange({
      studio: values.includes("studio"),
      tasks: values.includes("tasks"),
      google: values.includes("google"),
      projects: values.includes("projects"),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Show:
      </span>
      
      <ToggleGroup
        type="multiple"
        value={activeFilters}
        onValueChange={handleValueChange}
        className="gap-1"
      >
        <ToggleGroupItem
          value="studio"
          aria-label="Toggle studio bookings"
          className="gap-1.5 px-3 data-[state=on]:bg-foreground/10"
        >
          <Circle className="h-2.5 w-2.5 fill-foreground text-foreground" />
          <span className="text-xs">Studio</span>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="tasks"
          aria-label="Toggle tasks"
          className="gap-1.5 px-3 data-[state=on]:bg-primary/10"
        >
          <CheckSquare className="h-3 w-3 text-primary" />
          <span className="text-xs">Tasks</span>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="projects"
          aria-label="Toggle project milestones"
          className="gap-1.5 px-3 data-[state=on]:bg-[hsl(45_60%_60%)]/10"
        >
          <Circle className="h-2.5 w-2.5 fill-[hsl(45_60%_60%)] text-[hsl(45_60%_60%)]" />
          <span className="text-xs">Projects</span>
        </ToggleGroupItem>

        {hasGoogleConnection && (
          <ToggleGroupItem
            value="google"
            aria-label="Toggle Google Calendar"
            className="gap-1.5 px-3 data-[state=on]:bg-muted-foreground/10"
          >
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">Google</span>
            <Badge variant="outline" className="ml-0.5 text-[8px] px-1 py-0">
              Sync
            </Badge>
          </ToggleGroupItem>
        )}
      </ToggleGroup>
    </div>
  );
}
