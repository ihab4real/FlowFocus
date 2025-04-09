import React from 'react';
import { Button } from "@/components/ui/button";
import { TIMER_MODES, BUTTON_CLASSES } from '../constants';

const ModeSelector = ({ 
  mode, 
  setMode, 
  setTimeLeft, 
  setIsActive, 
  settings, 
  isFullscreen 
}) => {
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === TIMER_MODES.FOCUS) {
      setTimeLeft(settings.focusDuration * 60);
    } else if (newMode === TIMER_MODES.SHORT_BREAK) {
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      setTimeLeft(settings.longBreakDuration * 60);
    }
    setIsActive(false);
  };

  return (
    <div className={`flex gap-3 ${isFullscreen ? 'mb-6' : 'mb-4'}`}>
      <Button
        variant={mode === TIMER_MODES.FOCUS ? "default" : "outline"}
        onClick={() => handleModeChange(TIMER_MODES.FOCUS)}
        className={mode === TIMER_MODES.FOCUS ? BUTTON_CLASSES.FOCUS : ""}
        size={isFullscreen ? "default" : "sm"}
      >
        Focus
      </Button>
      <Button
        variant={mode === TIMER_MODES.SHORT_BREAK ? "default" : "outline"}
        onClick={() => handleModeChange(TIMER_MODES.SHORT_BREAK)}
        className={mode === TIMER_MODES.SHORT_BREAK ? BUTTON_CLASSES.SHORT_BREAK : ""}
        size={isFullscreen ? "default" : "sm"}
      >
        Short Break
      </Button>
      <Button
        variant={mode === TIMER_MODES.LONG_BREAK ? "default" : "outline"}
        onClick={() => handleModeChange(TIMER_MODES.LONG_BREAK)}
        className={mode === TIMER_MODES.LONG_BREAK ? BUTTON_CLASSES.LONG_BREAK : ""}
        size={isFullscreen ? "default" : "sm"}
      >
        Long Break
      </Button>
    </div>
  );
};

export default ModeSelector; 