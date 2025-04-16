import { useEffect, useRef, useCallback } from "react";
import { TIMER_MODES } from "../constants";
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

  // Format time for display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Update formatted time whenever timeLeft changes
  useEffect(() => {
    if (typeof timeLeft === "number") {
      setFormattedTime(formatTime(timeLeft));
    }
  }, [timeLeft, formatTime, setFormattedTime]);

  // Initialize timer with settings
  const initializeTimer = useCallback(
    (settings) => {
      if (!settings) return;

      const duration = settings.focusDuration * 6;
      setTimeLeft(duration);
      setTotalTime(duration);
      setSessionsUntilLongBreak(settings.longBreakInterval);
    },
    [setTimeLeft, setTotalTime, setSessionsUntilLongBreak]
  );

  // Load settings from server and initialize timer
  useEffect(() => {
    const initialize = async () => {
      try {
        // If we already have the settings from React Query
        if (serverSettings && !isLoadingServerSettings) {
          setSettings(serverSettings);
          initializeTimer(serverSettings);
          return;
        }

        // Otherwise load settings from API through the store
        const loadedSettings = await loadSettings();
        if (loadedSettings) {
          initializeTimer(loadedSettings);
        }
      } catch (error) {
        console.error("Failed to initialize timer:", error);
      }
    };

    initialize();
  }, [
    serverSettings,
    isLoadingServerSettings,
    loadSettings,
    setSettings,
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
