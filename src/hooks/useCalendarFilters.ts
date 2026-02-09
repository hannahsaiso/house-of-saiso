import { useState, useEffect } from "react";

export interface CalendarFilterState {
  studio: boolean;
  tasks: boolean;
  google: boolean;
  projects: boolean;
}

const STORAGE_KEY = "horizon-calendar-filters";

const DEFAULT_FILTERS: CalendarFilterState = {
  studio: true,
  tasks: true,
  google: true,
  projects: true,
};

export function useCalendarFilters() {
  const [filters, setFilters] = useState<CalendarFilterState>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_FILTERS, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.error("Failed to parse calendar filters from localStorage:", e);
      }
    }
    return DEFAULT_FILTERS;
  });

  // Persist to localStorage whenever filters change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.error("Failed to save calendar filters to localStorage:", e);
    }
  }, [filters]);

  return {
    filters,
    setFilters,
  };
}
