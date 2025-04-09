import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TIMER_MODES, DEFAULT_SETTINGS } from '@/features/Pomodoro/constants';
import { pomodoroService } from '@/services/api/pomodoroService';

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
      setSessionsUntilLongBreak: (sessionsUntilLongBreak) => set({ sessionsUntilLongBreak }),

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
        const { mode, sessionCount } = get();
        
        if (mode === TIMER_MODES.FOCUS) {
          const newSessionCount = sessionCount + 1;
          const isLongBreak = newSessionCount % settings.longBreakInterval === 0;
          
          set({
            sessionCount: newSessionCount,
            mode: isLongBreak ? TIMER_MODES.LONG_BREAK : TIMER_MODES.SHORT_BREAK,
            timeLeft: isLongBreak ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60,
            sessionsUntilLongBreak: isLongBreak ? settings.longBreakInterval : get().sessionsUntilLongBreak - 1
          });
        } else {
          set({
            mode: TIMER_MODES.FOCUS,
            timeLeft: settings.focusDuration * 60
          });
        }
      },

      // Initialize timer with settings
      initializeTimer: (settings) => {
        set({
          timeLeft: settings.focusDuration * 60,
          sessionsUntilLongBreak: settings.longBreakInterval
        });
      },
      
      // Actions
      setInterruptions: (count) => set({ interruptions: count }),
      
      // Settings actions
      loadSettings: async () => {
        set({ isLoadingSettings: true, settingsError: null });
        try {
          const response = await pomodoroService.getSettings();
          set({ 
            settings: response.data.settings,
            isLoadingSettings: false 
          });
        } catch (error) {
          set({ 
            settingsError: error.message,
            isLoadingSettings: false 
          });
        }
      },
      
      updateSettings: async (newSettings) => {
        try {
          const response = await pomodoroService.updateSettings(newSettings);
          set({ settings: response.data.settings });
          return true;
        } catch (error) {
          set({ settingsError: error.message });
          return false;
        }
      },
      
      // Session actions
      startSession: async () => {
        const { mode, settings } = get();
        const startTime = new Date();
        const sessionData = {
          startTime,
          type: mode,
          category: null,
          tags: [],
          notes: '',
          interruptions: 0
        };
        
        try {
          const response = await pomodoroService.createSession(sessionData);
          set({ 
            currentSession: response.data.session,
            isActive: true 
          });
          return true;
        } catch (error) {
          console.error('Failed to start session:', error);
          return false;
        }
      },
      
      endSession: async () => {
        const { currentSession, interruptions } = get();
        if (!currentSession) return;
        
        const endTime = new Date();
        const sessionData = {
          endTime,
          completed: true,
          interruptions
        };
        
        try {
          await pomodoroService.updateSession(currentSession._id, sessionData);
          set({ 
            currentSession: null,
            interruptions: 0,
            isActive: false 
          });
          return true;
        } catch (error) {
          console.error('Failed to end session:', error);
          return false;
        }
      },
      
      recordInterruption: () => {
        set((state) => ({ interruptions: state.interruptions + 1 }));
      }
    }),
    {
      name: 'pomodoro-timer-storage',
      partialize: (state) => ({
        mode: state.mode,
        sessionCount: state.sessionCount,
        sessionsUntilLongBreak: state.sessionsUntilLongBreak
      })
    }
  )
);

export default usePomodoroStore; 