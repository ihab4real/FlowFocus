import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import habitService from "../services/habitService";
import { toast } from "react-hot-toast";

/**
 * Helper function to get current user ID from auth storage
 * @returns {string|null} User ID or null if not authenticated
 */
const getCurrentUserId = () => {
  try {
    const authStorage = JSON.parse(localStorage.getItem("auth-storage"));
    return authStorage?.state?.user?.id || null;
  } catch (e) {
    console.error("Error getting current user ID:", e);
    return null;
  }
};

/**
 * Habit query keys for proper cache management
 * All keys are user-specific to prevent data leakage between users
 */
export const habitKeys = {
  all: (userId) => ["habits", userId],
  lists: (userId) => [...habitKeys.all(userId), "list"],
  list: (userId, filters) => [...habitKeys.lists(userId), { filters }],
  details: (userId) => [...habitKeys.all(userId), "detail"],
  detail: (userId, id) => [...habitKeys.details(userId), id],
  entries: (userId) => [...habitKeys.all(userId), "entries"],
  entriesList: (userId, filters) => [...habitKeys.entries(userId), { filters }],
  todayEntries: (userId) => [...habitKeys.entries(userId), "today"],
};

/**
 * Hook for fetching all habits with optional filters
 */
export const useHabitsQuery = (filters = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: habitKeys.list(userId, filters),
    queryFn: async () => {
      const response = await habitService.getHabits(filters);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    networkMode: "online",
  });
};

/**
 * Hook for fetching a single habit by ID
 */
export const useHabitQuery = (id) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: habitKeys.detail(userId, id),
    queryFn: async () => {
      const response = await habitService.getHabit(id);
      return response.data;
    },
    enabled: !!id && !!userId,
    staleTime: 60 * 1000,
  });
};

/**
 * Hook for fetching habit entries with optional filters
 */
export const useHabitEntriesQuery = (filters = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: habitKeys.entriesList(userId, filters),
    queryFn: async () => {
      const response = await habitService.getEntries(filters);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    networkMode: "online",
  });
};

/**
 * Hook for fetching today's habit entries
 */
export const useTodayHabitEntriesQuery = () => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: habitKeys.todayEntries(userId),
    queryFn: async () => {
      const response = await habitService.getTodayEntries();
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    networkMode: "online",
  });
};

/**
 * Hook for creating a new habit
 */
export const useCreateHabitMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (data) => {
      const response = await habitService.createHabit(data);
      return response.data;
    },
    onSuccess: (newHabit) => {
      if (!userId) return;

      // Invalidate all habit lists to refresh data
      queryClient.invalidateQueries({ queryKey: habitKeys.lists(userId) });

      // Optionally add the new habit to existing cache for immediate UI update
      queryClient.setQueriesData(
        { queryKey: habitKeys.lists(userId) },
        (oldData) => {
          if (oldData) {
            return [newHabit, ...oldData];
          }
          return [newHabit];
        }
      );

      toast.success("Habit created");
    },
    onError: (error) => {
      console.error("Error creating habit:", error);
      toast.error("Failed to create habit");
    },
  });
};

/**
 * Hook for updating an existing habit
 */
export const useUpdateHabitMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await habitService.updateHabit(id, data);
      return response.data;
    },
    onSuccess: (updatedHabit, variables) => {
      if (!userId) return;

      // Update the specific habit in cache
      queryClient.setQueryData(
        habitKeys.detail(userId, variables.id),
        updatedHabit
      );

      // Update the habit in all list caches
      queryClient.setQueriesData(
        { queryKey: habitKeys.lists(userId) },
        (oldData) => {
          if (oldData) {
            return oldData.map((habit) =>
              habit._id === variables.id ? updatedHabit : habit
            );
          }
          return oldData;
        }
      );

      toast.success("Habit updated");
    },
    onError: (error) => {
      console.error("Error updating habit:", error);
      toast.error("Failed to update habit");
    },
  });
};

/**
 * Hook for deleting a habit
 */
export const useDeleteHabitMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (id) => {
      const response = await habitService.deleteHabit(id);
      return response.data;
    },
    onSuccess: (_, habitId) => {
      if (!userId) return;

      // Remove the habit from all caches
      queryClient.removeQueries({
        queryKey: habitKeys.detail(userId, habitId),
      });

      // Remove from all list caches
      queryClient.setQueriesData(
        { queryKey: habitKeys.lists(userId) },
        (oldData) => {
          if (oldData) {
            return oldData.filter((habit) => habit._id !== habitId);
          }
          return oldData;
        }
      );

      // Invalidate entries since the habit is deleted
      queryClient.invalidateQueries({ queryKey: habitKeys.entries(userId) });

      toast.success("Habit deleted");
    },
    onError: (error) => {
      console.error("Error deleting habit:", error);
      toast.error("Failed to delete habit");
    },
  });
};

/**
 * Hook for logging habit entries
 */
export const useLogHabitEntryMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (data) => {
      const response = await habitService.logEntry(data);
      return response.data;
    },
    onSuccess: () => {
      if (!userId) return;

      // Invalidate all entry queries to refresh data
      queryClient.invalidateQueries({ queryKey: habitKeys.entries(userId) });
    },
    onError: (error) => {
      console.error("Error logging habit entry:", error);
      toast.error("Failed to log habit entry");
    },
  });
};

/**
 * Hook for updating habit entries
 */
export const useUpdateHabitEntryMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async ({ habitId, date, data }) => {
      const response = await habitService.updateEntry(habitId, date, data);
      return response.data;
    },
    onSuccess: () => {
      if (!userId) return;

      // Invalidate all entry queries to refresh data
      queryClient.invalidateQueries({ queryKey: habitKeys.entries(userId) });
    },
    onError: (error) => {
      console.error("Error updating habit entry:", error);
      toast.error("Failed to update habit entry");
    },
  });
};

/**
 * Hook for batch updating habit entries
 */
export const useBatchUpdateHabitEntriesMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (entries) => {
      const response = await habitService.batchUpdateEntries(entries);
      return response.data;
    },
    onSuccess: () => {
      if (!userId) return;

      // Invalidate all entry queries to refresh data
      queryClient.invalidateQueries({ queryKey: habitKeys.entries(userId) });

      toast.success("Habits updated");
    },
    onError: (error) => {
      console.error("Error batch updating habit entries:", error);
      toast.error("Failed to update habits");
    },
  });
};
