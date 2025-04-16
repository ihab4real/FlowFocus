import { useEffect, useRef, useCallback } from "react";
import { TIMER_MODES, DEFAULT_SETTINGS } from "../constants";
import usePomodoroStore from "@/stores/pomodoroStore";
import {
  usePomodoroSettings,
  useCreatePomodoroSession,
  useUpdatePomodoroSession,
} from "./usePomodoroQueries";

/**
 * Main hook for the Pomodoro timer logic
 * This is the single source of truth for timer behavior
 */
const usePomodoroTimer = () => {
  // React Query hooks for server state
  const { data: serverSettings, isLoading: isLoadingServerSettings } =
    usePomodoroSettings();
  const { mutate: createSession } = useCreatePomodoroSession();
  const { mutate: updateSession } = useUpdatePomodoroSession();

  // Refs
  const timerRef = useRef(null);
  const currentSessionRef = useRef(null);

  // Get store state and actions
  const {
    // State
    mode,
    isActive,
    timeLeft,
    totalTime,
    sessionCount,
    sessionsUntilLongBreak,
    settings,
    currentSession,
    isLoadingSettings,

    // Setters
    setMode,
    setIsActive,
    setTimeLeft,
    setTotalTime,
    setFormattedTime,
    setSessionCount,
    setSessionsUntilLongBreak,
    setCurrentSession,
    setInterruptions,
    incrementInterruptions,
    setSettings,
    loadSettings,
  } = usePomodoroStore();

  // Ref to track if initial load has occurred to prevent multiple initializations
  const initialLoadComplete = useRef(false);

  // Format time for display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Initialize timer based on settings and current mode
  const initializeTimer = useCallback(
    (newSettings) => {
      if (!newSettings) {
        console.warn("initializeTimer called with invalid settings");
        return; // Prevent NaN if settings are somehow invalid
      }

      // Determine duration based on the CURRENT mode
      let duration;
      if (mode === TIMER_MODES.FOCUS) {
        duration = newSettings.focusDuration * 60;
      } else if (mode === TIMER_MODES.SHORT_BREAK) {
        duration = newSettings.shortBreakDuration * 60;
      } else if (mode === TIMER_MODES.LONG_BREAK) {
        duration = newSettings.longBreakDuration * 60;
      } else {
        // Default to focus duration if mode is unknown (should not happen)
        console.warn(
          `Unknown timer mode: ${mode}, defaulting to focus duration`
        );
        duration = newSettings.focusDuration * 60;
      }

      // Ensure duration is a non-negative number
      duration = Math.max(0, duration || 0);

      // Update total time based on the mode's duration
      setTotalTime(duration);
      // Only set time left if timer is not currently active
      if (!isActive) {
        setTimeLeft(duration);
      }
      // Update sessionsUntilLongBreak based on the interval setting
      setSessionsUntilLongBreak(newSettings.longBreakInterval);
    },
    [mode, isActive, setTimeLeft, setTotalTime, setSessionsUntilLongBreak]
  );

  // Update formatted time whenever timeLeft changes
  useEffect(() => {
    if (typeof timeLeft === "number") {
      setFormattedTime(formatTime(timeLeft));
    }
  }, [timeLeft, formatTime, setFormattedTime]);

  // Effect 1: Sync settings from React Query to Zustand store
  useEffect(() => {
    if (serverSettings?.data?.settings && !isLoadingServerSettings) {
      // Check if the settings from the server are actually different from the store
      // to avoid unnecessary updates and potential loops.
      // This requires a deep comparison or comparing a key property like updatedAt if available.
      // For simplicity now, we'll just set it, assuming React Query handles staleness well.
      setSettings(serverSettings.data.settings);
    }
  }, [serverSettings, isLoadingServerSettings, setSettings]);

  // Effect 2: Initialize timer state when settings are loaded for the first time
  useEffect(() => {
    // Ensure settings are loaded (not default/empty) and initial load hasn't happened yet
    const settingsAreLoaded =
      settings &&
      Object.keys(settings).length > 0 &&
      settings !== DEFAULT_SETTINGS;

    if (settingsAreLoaded && !initialLoadComplete.current) {
      // Call initializeTimer with the loaded settings
      initializeTimer(settings);
      // Mark initial load as complete
      initialLoadComplete.current = true;
    }
  }, [settings, initializeTimer]); // Run when settings change

  // Effect 3: Handle initial fetch if settings aren't available from cache/persistence
  useEffect(() => {
    const needsFetching =
      (!settings ||
        Object.keys(settings).length === 0 ||
        settings === DEFAULT_SETTINGS) &&
      !serverSettings?.data?.settings;

    if (needsFetching && !isLoadingServerSettings) {
      loadSettings().catch((error) => {
        console.error("Initial settings load failed:", error);
        // If loading fails, initialize with defaults to ensure timer is usable
        if (!initialLoadComplete.current) {
          initializeTimer(DEFAULT_SETTINGS);
          initialLoadComplete.current = true;
        }
      });
    }
    // This effect should run primarily once on mount or if dependencies indicate a need to fetch.
  }, [
    settings,
    serverSettings,
    isLoadingServerSettings,
    loadSettings,
    initializeTimer,
  ]);

  // Switch to the next mode (focus -> break or break -> focus)
  const switchToNextMode = useCallback(
    (settings) => {
      if (!settings) return;

      if (mode === TIMER_MODES.FOCUS) {
        // After focus: switch to break
        const newSessionCount = sessionCount + 1;
        const isLongBreak = newSessionCount % settings.longBreakInterval === 0;

        const breakDuration = isLongBreak
          ? settings.longBreakDuration * 60
          : settings.shortBreakDuration * 60;

        setSessionCount(newSessionCount);
        setMode(isLongBreak ? TIMER_MODES.LONG_BREAK : TIMER_MODES.SHORT_BREAK);
        setTimeLeft(breakDuration);
        setTotalTime(breakDuration);

        if (isLongBreak) {
          setSessionsUntilLongBreak(settings.longBreakInterval);
        } else {
          setSessionsUntilLongBreak((prev) => Math.max(0, prev - 1));
        }
      } else {
        // After break: switch to focus
        const focusDuration = settings.focusDuration * 60;
        setMode(TIMER_MODES.FOCUS);
        setTimeLeft(focusDuration);
        setTotalTime(focusDuration);
      }
    },
    [
      mode,
      sessionCount,
      setSessionCount,
      setMode,
      setTimeLeft,
      setTotalTime,
      setSessionsUntilLongBreak,
    ]
  );

  // Pause the timer
  const pauseTimer = useCallback(() => {
    setIsActive(false);

    if (currentSessionRef.current?._id) {
      updateSession({
        id: currentSessionRef.current._id,
        sessionData: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
    }
  }, [setIsActive, updateSession]);

  // Start the timer
  const startTimer = useCallback(async () => {
    // Don't start if already active or no time left
    if (isActive || timeLeft <= 0 || !settings) return false;

    setIsActive(true);

    // Create a new session on the server
    const sessionData = {
      startTime: new Date().toISOString(),
      type: mode,
      category: "default",
      tags: [],
      notes: "",
      interruptions: 0,
    };

    try {
      createSession(sessionData, {
        onSuccess: (response) => {
          if (response?.data?.session) {
            currentSessionRef.current = response.data.session;
            setCurrentSession(response.data.session);
          }
        },
      });
      return true;
    } catch (error) {
      console.error("Failed to create session:", error);
      pauseTimer();
      return false;
    }
  }, [
    isActive,
    timeLeft,
    settings,
    setIsActive,
    mode,
    createSession,
    setCurrentSession,
    pauseTimer,
  ]);

  // Reset the timer to initial state for current mode
  const resetTimer = useCallback(() => {
    setIsActive(false);

    // Set time based on current mode
    if (!settings) return;

    let duration;
    if (mode === TIMER_MODES.FOCUS) {
      duration = settings.focusDuration * 60;
    } else if (mode === TIMER_MODES.SHORT_BREAK) {
      duration = settings.shortBreakDuration * 60;
    } else {
      duration = settings.longBreakDuration * 60;
    }

    setTimeLeft(duration);
    setTotalTime(duration);

    // End current session if any
    if (currentSessionRef.current?._id) {
      updateSession({
        id: currentSessionRef.current._id,
        sessionData: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
      currentSessionRef.current = null;
      setCurrentSession(null);
    }

    // Reset interruptions
    setInterruptions(0);
  }, [
    settings,
    mode,
    setIsActive,
    setTimeLeft,
    setTotalTime,
    updateSession,
    setCurrentSession,
    setInterruptions,
  ]);

  // Skip to next mode
  const skipToNextMode = useCallback(() => {
    // End current session
    if (isActive) {
      pauseTimer();
    }

    if (currentSessionRef.current?._id) {
      updateSession({
        id: currentSessionRef.current._id,
        sessionData: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
      currentSessionRef.current = null;
      setCurrentSession(null);
    }

    // Switch to next mode
    if (settings) {
      switchToNextMode(settings);
    }

    // Reset interruptions
    setInterruptions(0);
  }, [
    isActive,
    pauseTimer,
    updateSession,
    settings,
    switchToNextMode,
    setCurrentSession,
    setInterruptions,
  ]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (!settings) return;

    // Ensure timer is stopped
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update the current session
    if (currentSessionRef.current?._id) {
      updateSession({
        id: currentSessionRef.current._id,
        sessionData: {
          endTime: new Date().toISOString(),
          completed: true,
        },
      });
      currentSessionRef.current = null;
      setCurrentSession(null);
    }

    // Play end sound
    // We're not calling a local function to play sound here
    // because the TimerSound component is initialized in the PomodoroContainer
    // and will be called from there

    // Switch to next mode
    switchToNextMode(settings);

    // Reset interruptions
    setInterruptions(0);

    // Auto-start next session if settings allow it
    const shouldAutoStart =
      (mode === TIMER_MODES.FOCUS && settings.autoStartBreaks) ||
      ((mode === TIMER_MODES.SHORT_BREAK || mode === TIMER_MODES.LONG_BREAK) &&
        settings.autoStartPomodoros);

    if (shouldAutoStart) {
      // Small delay to ensure state updates before starting
      setTimeout(() => {
        startTimer();
      }, 500);
    }
  }, [
    settings,
    mode,
    updateSession,
    switchToNextMode,
    setCurrentSession,
    setInterruptions,
    startTimer,
  ]);

  // Record an interruption
  const recordInterruption = useCallback(() => {
    incrementInterruptions();
  }, [incrementInterruptions]);

  // Handle timer tick
  useEffect(() => {
    if (!isActive || !settings) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        // Ensure prevTime is a valid number
        const currentTime =
          typeof prevTime === "number" && !isNaN(prevTime)
            ? Math.max(0, prevTime)
            : 0;

        if (currentTime <= 1) {
          // Clear the interval BEFORE calling handleTimerComplete to prevent race condition
          clearInterval(timerRef.current);
          timerRef.current = null;

          // Use setTimeout to ensure state updates are processed before completion handler runs
          setTimeout(() => {
            handleTimerComplete();
          }, 0);
          return 0;
        }
        return currentTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, settings, setTimeLeft, handleTimerComplete]);

  // Return state and actions
  return {
    // State
    mode,
    isActive,
    timeLeft,
    totalTime,
    sessionCount,
    sessionsUntilLongBreak,
    settings,
    isLoadingSettings,
    currentSession,

    // Actions
    startTimer,
    pauseTimer,
    resetTimer,
    skipToNextMode,
    switchToNextMode,
    recordInterruption,
    initializeTimer,
  };
};

export default usePomodoroTimer;
