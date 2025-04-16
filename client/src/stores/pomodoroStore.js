import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TIMER_MODES, DEFAULT_SETTINGS } from "@/features/Pomodoro/constants";
import { pomodoroService } from "@/services/api/pomodoroService";

/**
 * Pomodoro store: Responsible for holding state only
 * No timer logic or side effects should be here
 */
const usePomodoroStore = create(
  persist(
    (set) => ({
      // Timer state
      mode: TIMER_MODES.FOCUS,
      isActive: false,
      timeLeft: 0,
      totalTime: 0, // Track the total time for the current mode (for progress calculation)
      sessionCount: 0,
      sessionsUntilLongBreak: DEFAULT_SETTINGS.LONG_BREAK_INTERVAL,
      formattedTime: "00:00", // Pre-formatted time string for display

      // Settings
      settings: DEFAULT_SETTINGS,
      isLoadingSettings: false,
      settingsError: null,

      // Current session
      currentSession: null,
      interruptions: 0,

      // Simple setters (no logic)
      setMode: (mode) => set({ mode }),
      setIsActive: (isActive) => set({ isActive }),
      setTimeLeft: (timeLeft) =>
        set((state) =>
          typeof timeLeft === "function"
            ? { timeLeft: timeLeft(state.timeLeft) }
            : { timeLeft }
        ),
      setTotalTime: (totalTime) =>
        set((state) =>
          typeof totalTime === "function"
            ? { totalTime: totalTime(state.totalTime) }
            : { totalTime }
        ),
      setFormattedTime: (formattedTime) => set({ formattedTime }),
      setSessionCount: (sessionCount) =>
        set((state) =>
          typeof sessionCount === "function"
            ? { sessionCount: sessionCount(state.sessionCount) }
            : { sessionCount }
        ),
      setSessionsUntilLongBreak: (sessionsUntilLongBreak) =>
        set((state) =>
          typeof sessionsUntilLongBreak === "function"
            ? {
                sessionsUntilLongBreak: sessionsUntilLongBreak(
                  state.sessionsUntilLongBreak
                ),
              }
            : { sessionsUntilLongBreak }
        ),
      setSettings: (settings) => set({ settings }),
      setCurrentSession: (currentSession) => set({ currentSession }),
      setInterruptions: (interruptions) => set({ interruptions }),
      incrementInterruptions: () =>
        set((state) => ({ interruptions: state.interruptions + 1 })),
      setIsLoadingSettings: (isLoading) =>
        set({ isLoadingSettings: isLoading }),
      setSettingsError: (error) => set({ settingsError: error }),

      // API methods (these stay in the store as they directly update store state)
      loadSettings: async () => {
        set({ isLoadingSettings: true, settingsError: null });
        try {
          const response = await pomodoroService.getSettings();
          if (response?.data?.settings) {
            set({
              settings: response.data.settings,
              isLoadingSettings: false,
            });
            return response.data.settings;
          } else {
            throw new Error("Invalid settings format");
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
          set({
            settingsError: error.message || "Failed to load settings",
            isLoadingSettings: false,
            settings: DEFAULT_SETTINGS, // Fall back to default settings
          });
          return DEFAULT_SETTINGS;
        }
      },

      updateSettings: async (newSettings) => {
        try {
          const response = await pomodoroService.updateSettings(newSettings);
          if (response?.data?.settings) {
            set({ settings: response.data.settings });
            return true;
          }
          throw new Error("Invalid settings format");
        } catch (error) {
          console.error("Failed to update settings:", error);
          set({ settingsError: error.message || "Failed to update settings" });
          return false;
        }
      },
    }),
    {
      name: "pomodoro-timer-storage",
      partialize: (state) => ({
        mode: state.mode,
        sessionCount: state.sessionCount,
        sessionsUntilLongBreak: state.sessionsUntilLongBreak,
        settings: state.settings,
      }),
    }
  )
);

export default usePomodoroStore;
