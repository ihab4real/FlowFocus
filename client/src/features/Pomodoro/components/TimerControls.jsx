import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import usePomodoroStore from '@/stores/pomodoroStore';
import { BUTTON_CLASSES, TIMER_MODES } from '../constants';

const TimerControls = ({ isFullscreen }) => {
  const { 
    isActive, 
    mode,
    startSession,
    pauseTimer,
    resetTimer: storeResetTimer, 
    endSession,
    switchToNextMode,
    settings
  } = usePomodoroStore();

  const toggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startSession();
    }
  };

  const resetTimer = () => {
    storeResetTimer();
    endSession();
  };

  const skipToNextSession = () => {
    pauseTimer();
    endSession();
    switchToNextMode(settings);
  };

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
        onClick={resetTimer}
        size={isFullscreen ? "default" : "sm"}
      >
        <RotateCcw className="mr-1 h-4 w-4" />
        Reset
      </Button>
      <Button 
        variant="outline" 
        onClick={skipToNextSession}
        size={isFullscreen ? "default" : "sm"}
      >
        <SkipForward className="mr-1 h-4 w-4" />
        Skip
      </Button>
    </div>
  );
};

export default TimerControls; 