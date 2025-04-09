import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TIMER_MODES, DEFAULT_SETTINGS } from "@/features/Pomodoro/constants";
import { pomodoroService } from "@/services/api/pomodoroService";

const usePomodoroStore = create(
  persist(
    (set, get) => ({
      // Timer state
      mode: TIMER_MODES.FOCUS,
      isActive: false,
      timeLeft: 0,
      sessionCount: 0,
      sessionsUntilLongBreak: DEFAULT_SETTINGS.LONG_BREAK_INTERVAL,

      // Settings
      settings: DEFAULT_SETTINGS,
      isLoadingSettings: false,
      settingsError: null,

      // Current session
      currentSession: null,
      interruptions: 0,

      // Timer actions
      setMode: (mode) => set({ mode }),
      setIsActive: (isActive) => set({ isActive }),
      setTimeLeft: (timeLeft) => set({ timeLeft }),
      setSessionCount: (sessionCount) => set({ sessionCount }),
      setSessionsUntilLongBreak: (sessionsUntilLongBreak) =>
        set({ sessionsUntilLongBreak }),

      // Timer controls
      startTimer: () => {
        const { isActive, timeLeft } = get();
        if (isActive || timeLeft <= 0) return false;
        set({ isActive: true });
        return true;
      },

      pauseTimer: () => {
        set({ isActive: false });
      },

      resetTimer: () => {
        set({ isActive: false });
      },

      // Mode switching
      switchToNextMode: (settings) => {
        if (!settings) return;

        const { mode, sessionCount } = get();

        if (mode === TIMER_MODES.FOCUS) {
          const newSessionCount = sessionCount + 1;
          const isLongBreak =
            newSessionCount % settings.longBreakInterval === 0;

          set({
            sessionCount: newSessionCount,
            mode: isLongBreak
              ? TIMER_MODES.LONG_BREAK
              : TIMER_MODES.SHORT_BREAK,
            timeLeft: isLongBreak
              ? (settings.longBreakDuration || 15) * 60
              : (settings.shortBreakDuration || 5) * 60,
            sessionsUntilLongBreak: isLongBreak
              ? settings.longBreakInterval
              : get().sessionsUntilLongBreak - 1,
          });
        } else {
          set({
            mode: TIMER_MODES.FOCUS,
            timeLeft: (settings.focusDuration || 25) * 60,
          });
        }
      },

      // Initialize timer with settings
      initializeTimer: (settings) => {
        if (!settings) return;

        set({
          timeLeft: (settings.focusDuration || 25) * 60,
          sessionsUntilLongBreak: settings.longBreakInterval || 4,
        });
      },

      // Actions
      setInterruptions: (count) => set({ interruptions: count }),

      // Settings actions
      setSettings: (newSettings) => set({ settings: newSettings }),

      loadSettings: async () => {
        set({ isLoadingSettings: true, settingsError: null });
        try {
          const response = await pomodoroService.getSettings();
          if (response?.data?.settings) {
            set({
              settings: response.data.settings,
              isLoadingSettings: false,
            });
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

      // Session actions
      startSession: async () => {
        const { mode, settings } = get();

        // Start the timer first for better UX
        const success = get().startTimer();
        if (!success) return false;

        const sessionData = {
          startTime: new Date().toISOString(),
          type: mode,
          category: null,
          tags: [],
          notes: "",
          interruptions: 0,
        };

        try {
          const response = await pomodoroService.createSession(sessionData);
          if (response?.data?.session) {
            set({ currentSession: response.data.session });
            return true;
          }
          throw new Error("Invalid session format");
        } catch (error) {
          console.error("Failed to start session:", error);
          // Don't pause the timer - let it continue even if the API call failed
          return false;
        }
      },

      endSession: async () => {
        const { currentSession, interruptions } = get();
        if (!currentSession || !currentSession._id) return;

        const endTime = new Date();
        const sessionData = {
          endTime: endTime.toISOString(),
          completed: true,
          interruptions,
        };

        try {
          await pomodoroService.updateSession(currentSession._id, sessionData);
          set({
            currentSession: null,
            interruptions: 0,
            isActive: false,
          });
          return true;
        } catch (error) {
          console.error("Failed to end session:", error);
          // Still reset the UI state even if the API call failed
          set({
            currentSession: null,
            interruptions: 0,
            isActive: false,
          });
          return false;
        }
      },

      recordInterruption: () => {
        set((state) => ({ interruptions: state.interruptions + 1 }));
      },
    }),
    {
      name: "pomodoro-timer-storage",
      partialize: (state) => ({
        mode: state.mode,
        sessionCount: state.sessionCount,
        sessionsUntilLongBreak: state.sessionsUntilLongBreak,
      }),
    }
  )
);

export default usePomodoroStore;
