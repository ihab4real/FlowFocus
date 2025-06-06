import { create } from "zustand";
import { globalSearch } from "@/services/searchService";
import debounce from "lodash.debounce";

export const useSearchStore = create((set, get) => {
  // Create a debounced search function
  const debouncedSearchFn = debounce(async (searchQuery, selectedCategory) => {
    if (!searchQuery.trim()) {
      set({ results: null, isOpen: false, isSearching: false });
      return;
    }

    try {
      const results = await globalSearch(searchQuery, {
        type: selectedCategory !== "all" ? selectedCategory : "all",
      });

      set({
        results,
        isSearching: false,
        isOpen: true,
      });
    } catch (error) {
      console.error("Search failed:", error);
      set({
        isSearching: false,
        error: "Failed to perform search. Please try again.",
      });
    }
  }, 300);

  return {
    // State
    query: "",
    results: null,
    isSearching: false,
    isOpen: false,
    selectedCategory: "all",
    focusedIndex: -1,
    error: null,

    // Actions
    search: (searchQuery) => {
      set({
        query: searchQuery,
        isSearching: true,
        error: null,
        focusedIndex: -1,
      });

      if (!searchQuery.trim()) {
        set({ results: null, isOpen: false, isSearching: false });
        return;
      }

      debouncedSearchFn(searchQuery, get().selectedCategory);
    },

    closeSearch: () => set({ isOpen: false }),

    setSelectedCategory: (category) => {
      set({ selectedCategory: category });

      // If we have a query and change category, rerun the search
      const { query } = get();
      if (query.trim()) {
        set({ isSearching: true });
        debouncedSearchFn(query, category);
      }
    },

    navigateResults: (direction) => {
      const { results, selectedCategory, focusedIndex } = get();

      if (!results) return;

      const totalResults = [
        ...(selectedCategory === "all" || selectedCategory === "tasks"
          ? results.tasks || []
          : []),
        ...(selectedCategory === "all" || selectedCategory === "notes"
          ? results.notes || []
          : []),
        ...(selectedCategory === "all" || selectedCategory === "habits"
          ? results.habits || []
          : []),
      ].length;

      if (totalResults === 0) return;

      if (direction === "down") {
        set({ focusedIndex: (focusedIndex + 1) % totalResults });
      } else if (direction === "up") {
        set({ focusedIndex: (focusedIndex - 1 + totalResults) % totalResults });
      }
    },
  };
});
