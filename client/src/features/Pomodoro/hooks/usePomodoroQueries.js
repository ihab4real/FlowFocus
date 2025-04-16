import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pomodoroService } from "@/services/api/pomodoroService";
import { toast } from "react-hot-toast";

export const usePomodoroSettings = () => {
  return useQuery({
    queryKey: ["pomodoroSettings"],
    queryFn: () => pomodoroService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdatePomodoroSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) => pomodoroService.updateSettings(settings),
    // Optimistically update the cache
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["pomodoroSettings"] });

      // Snapshot the previous value
      const previousSettingsData = queryClient.getQueryData([
        "pomodoroSettings",
      ]);

      // Optimistically update to the new value
      // Assuming the query data structure is { data: { settings: { ... } } }
      queryClient.setQueryData(["pomodoroSettings"], (oldData) => {
        if (!oldData || !oldData.data || !oldData.data.settings) {
          // Handle case where cache is empty or has unexpected structure
          // Return a structure matching the expected format with new settings
          return { data: { settings: newSettings } };
        }
        return {
          ...oldData,
          data: {
            ...oldData.data,
            settings: { ...oldData.data.settings, ...newSettings },
          },
        };
      });

      // Return a context object with the snapshotted value
      return { previousSettingsData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newSettings, context) => {
      if (context?.previousSettingsData) {
        queryClient.setQueryData(
          ["pomodoroSettings"],
          context.previousSettingsData
        );
      }
      // Keep the specific error toast
      toast.error("Failed to update settings");
      console.error("Settings update error:", err);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pomodoroSettings"] });
    },
    // onSuccess can be removed or used for specific success actions if needed
    // Let's remove the generic toast here to avoid duplication if the component adds its own
    // onSuccess: () => {
    //   toast.success("Settings updated", {
    //     icon: "⚙️",
    //     duration: TIMER_COMPLETION.SOUND_TOAST_DURATION,
    //   });
    // },
  });
};

export const usePomodoroSessions = (params = {}) => {
  return useQuery({
    queryKey: ["pomodoroSessions", params],
    queryFn: () => pomodoroService.getSessions(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreatePomodoroSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionData) => pomodoroService.createSession(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pomodoroSessions"] });
      queryClient.invalidateQueries({ queryKey: ["pomodoroStats"] });
    },
    onError: (error) => {
      toast.error("Failed to create session");
      console.error("Session creation error:", error);
    },
  });
};

export const useUpdatePomodoroSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sessionData }) =>
      pomodoroService.updateSession(id, sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pomodoroSessions"] });
      queryClient.invalidateQueries({ queryKey: ["pomodoroStats"] });
    },
    onError: (error) => {
      toast.error("Failed to update session");
      console.error("Session update error:", error);
    },
  });
};

export const usePomodoroStats = (params = {}) => {
  return useQuery({
    queryKey: ["pomodoroStats", params],
    queryFn: () => pomodoroService.getSessionStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
