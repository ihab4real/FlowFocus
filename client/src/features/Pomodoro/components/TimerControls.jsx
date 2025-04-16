import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import usePomodoroStore from "@/stores/pomodoroStore";
import { BUTTON_CLASSES, TIMER_MODES } from "../constants";

/**
 * Timer Controls component
 * Shows timer control buttons (start, pause, reset, skip)
 * Gets timer actions from props and display state from store
 */
const TimerControls = ({
  isFullscreen,
  startTimer,
  pauseTimer,
  resetTimer,
  skipToNextMode,
}) => {
  // Get display state from store
  const { isActive = false, mode = TIMER_MODES.FOCUS } = usePomodoroStore();

  // Toggle between start and pause
  const toggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  // Handle reset button click
  const handleReset = () => {
    resetTimer();
  };

  // Handle skip button click
  const handleSkip = () => {
    skipToNextMode();
  };

  // Get the appropriate button class based on current mode
  const getButtonClass = () => {
    if (mode === TIMER_MODES.FOCUS) return BUTTON_CLASSES.FOCUS;
    if (mode === TIMER_MODES.SHORT_BREAK) return BUTTON_CLASSES.SHORT_BREAK;
    return BUTTON_CLASSES.LONG_BREAK;
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={toggleTimer}
        className={getButtonClass()}
        size={isFullscreen ? "default" : "sm"}
      >
        {isActive ? (
          <>
            <Pause className="mr-1 h-4 w-4" />
            Pause
          </>
        ) : (
          <>
            <Play className="mr-1 h-4 w-4" />
            Start
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={handleReset}
        size={isFullscreen ? "default" : "sm"}
      >
        <RotateCcw className="mr-1 h-4 w-4" />
        Reset
      </Button>
      <Button
        variant="outline"
        onClick={handleSkip}
        size={isFullscreen ? "default" : "sm"}
      >
        <SkipForward className="mr-1 h-4 w-4" />
        Skip
      </Button>
    </div>
  );
};

export default TimerControls;
