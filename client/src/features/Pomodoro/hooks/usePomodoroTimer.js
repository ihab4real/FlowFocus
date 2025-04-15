import { useEffect, useRef } from "react";
import { TIMER_MODES } from "../constants";
import usePomodoroStore from "@/stores/pomodoroStore";
import {
  usePomodoroSettings,
  useCreatePomodoroSession,
  useUpdatePomodoroSession,
} from "./usePomodoroQueries";

const usePomodoroTimer = () => {
  // React Query hooks for server state
  const { data: settings, isLoading: isLoadingSettings } =
    usePomodoroSettings();
  const { mutate: createSession } = useCreatePomodoroSession();
  const { mutate: updateSession } = useUpdatePomodoroSession();

  // Zustand store for local timer state
  const {
    mode,
    isActive,
    timeLeft,
    sessionCount,
    sessionsUntilLongBreak,
    setMode,
    setIsActive,
    setTimeLeft,
    setSessionCount,
    setSessionsUntilLongBreak,
    startTimer,
    pauseTimer,
    resetTimer,
    switchToNextMode,
    initializeTimer,
  } = usePomodoroStore();

  const timerRef = useRef(null);
  const currentSessionRef = useRef(null);

  // Initialize timer when settings are loaded
  useEffect(() => {
    if (settings && !isLoadingSettings) {
      initializeTimer(settings);
    }
  }, [settings, isLoadingSettings, initializeTimer]);

  // Start the timer
  const handleStartTimer = async () => {
    if (!settings) return;

    const success = startTimer();
    if (!success) return;

    // Create a new session
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
          }
        },
      });
    } catch (error) {
      console.error("Failed to create session:", error);
      pauseTimer();
    }
  };

  // Pause the timer
  const handlePauseTimer = () => {
    if (!currentSessionRef.current?._id) return;

    pauseTimer();

    // Update the session with end time
    updateSession({
      id: currentSessionRef.current._id,
      sessionData: {
        endTime: new Date().toISOString(),
        completed: false,
      },
    });
  };

  // Reset the timer
  const handleResetTimer = () => {
    if (!settings) return;

    resetTimer();
    setTimeLeft(settings.focusDuration * 60);

    if (currentSessionRef.current?._id) {
      updateSession({
        id: currentSessionRef.current._id,
        sessionData: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
      currentSessionRef.current = null;
    }
  };

  // Handle timer tick
  useEffect(() => {
    if (!isActive || !settings) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleTimerComplete();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, mode, settings]);

  // Handle timer completion
  const handleTimerComplete = () => {
    if (!settings || !currentSessionRef.current?._id) return;

    // Update the current session
    updateSession({
      id: currentSessionRef.current._id,
      sessionData: {
        endTime: new Date().toISOString(),
        completed: true,
      },
    });

    // Switch to next mode
    switchToNextMode(settings);
    currentSessionRef.current = null;
  };

  // Format time for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    mode,
    isActive,
    timeLeft: formatTime(timeLeft || 0),
    sessionCount,
    sessionsUntilLongBreak,
    settings,
    isLoadingSettings,
    startTimer: handleStartTimer,
    pauseTimer: handlePauseTimer,
    resetTimer: handleResetTimer,
  };
};

export default usePomodoroTimer;
