import React, { useMemo } from "react";
import {
  TIMER_DIMENSIONS,
  TIMER_PROGRESS,
  TIMER_MODES,
  TIMER_COLORS,
  TIMER_COMPLETION,
} from "../constants";
import usePomodoroStore from "@/stores/pomodoroStore";

const TimerDisplay = ({ isFullscreen }) => {
  const {
    timeLeft = 0,
    mode = TIMER_MODES.FOCUS,
    isActive = false,
  } = usePomodoroStore();

  // Format the time display
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, [timeLeft]);

  // Calculate the total time based on the current mode
  const totalTime = useMemo(() => {
    const { settings } = usePomodoroStore.getState();
    if (mode === TIMER_MODES.FOCUS) return settings.focusDuration * 60;
    if (mode === TIMER_MODES.SHORT_BREAK)
      return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  }, [mode]);

  // Calculate the progress percentage
  const progress = (timeLeft / totalTime) * 100;

  // Determine if the timer is near completion
  const isNearCompletion =
    timeLeft <= TIMER_COMPLETION.NEAR_COMPLETION_THRESHOLD &&
    timeLeft > 0 &&
    isActive;

  // Get the timer color based on the current mode
  const getTimerColor = () => {
    if (mode === TIMER_MODES.FOCUS) return TIMER_COLORS.FOCUS;
    if (mode === TIMER_MODES.SHORT_BREAK) return TIMER_COLORS.SHORT_BREAK;
    return TIMER_COLORS.LONG_BREAK;
  };

  const dimensions = isFullscreen
    ? TIMER_DIMENSIONS.FULLSCREEN
    : TIMER_DIMENSIONS.DEFAULT;

  return (
    <div
      className={`relative ${dimensions.WIDTH} ${dimensions.HEIGHT} ${
        dimensions.MARGIN
      } ${isNearCompletion ? "animate-pulse" : ""}`}
    >
      {/* Background circle */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={TIMER_PROGRESS.CIRCLE_RADIUS}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={TIMER_PROGRESS.CIRCLE_STROKE_WIDTH}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={TIMER_PROGRESS.CIRCLE_RADIUS}
          fill="none"
          stroke={getTimerColor()}
          strokeWidth={TIMER_PROGRESS.CIRCLE_STROKE_WIDTH}
          strokeDasharray={TIMER_PROGRESS.CIRCLE_DASHARRAY}
          strokeDashoffset={
            TIMER_PROGRESS.CIRCLE_DASHARRAY -
            (TIMER_PROGRESS.CIRCLE_DASHARRAY * progress) / 100
          }
          strokeLinecap="round"
          transform={`rotate(${TIMER_PROGRESS.CIRCLE_ROTATION} 50 50)`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`${dimensions.TEXT_SIZE} font-bold ${
            isNearCompletion ? "text-red-600 dark:text-red-400" : ""
          }`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
