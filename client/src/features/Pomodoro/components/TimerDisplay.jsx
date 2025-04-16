import React from "react";
import {
  TIMER_DIMENSIONS,
  TIMER_PROGRESS,
  TIMER_MODES,
  TIMER_COLORS,
  TIMER_COMPLETION,
} from "../constants";
import usePomodoroStore from "@/stores/pomodoroStore";

/**
 * TimerDisplay component
 * Handles only the display of timer information
 * All calculations are done in the store/hook
 */
const TimerDisplay = ({ isFullscreen }) => {
  // Get all necessary state from the store
  const {
    timeLeft = 0,
    totalTime = 1, // Avoid division by zero
    formattedTime = "00:00",
    mode = TIMER_MODES.FOCUS,
    isActive = false,
  } = usePomodoroStore();

  // Calculate progress percentage for the SVG circle
  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;

  // Determine if the timer is near completion for visual feedback
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

  // Get size dimensions based on fullscreen state
  const dimensions = isFullscreen
    ? TIMER_DIMENSIONS.FULLSCREEN
    : TIMER_DIMENSIONS.DEFAULT;

  // Safely calculate strokeDashoffset to avoid NaN
  const getStrokeDashoffset = () => {
    const validProgress = Number.isFinite(progress)
      ? Math.max(0, Math.min(100, progress))
      : 100;
    return (
      TIMER_PROGRESS.CIRCLE_DASHARRAY -
      (TIMER_PROGRESS.CIRCLE_DASHARRAY * validProgress) / 100
    );
  };

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
          strokeDashoffset={getStrokeDashoffset()}
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
