import React from 'react';
import { Button } from "@/components/ui/button";
import { TIMER_MODES, BUTTON_CLASSES, DEFAULT_SETTINGS } from '../constants';
import usePomodoroStore from '@/stores/pomodoroStore';

const ModeSelector = ({ isFullscreen }) => {
  // Get values and functions from the store with default values
  const { 
    mode = TIMER_MODES.FOCUS, 
    setMode = () => {}, 
    setTimeLeft = () => {}, 
    setIsActive = () => {}, 
    settings = { 
      focusDuration: DEFAULT_SETTINGS.FOCUS_DURATION,
      shortBreakDuration: DEFAULT_SETTINGS.SHORT_BREAK_DURATION,
      longBreakDuration: DEFAULT_SETTINGS.LONG_BREAK_DURATION
    } 
  } = usePomodoroStore();

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === TIMER_MODES.FOCUS) {
      setTimeLeft((settings?.focusDuration || DEFAULT_SETTINGS.FOCUS_DURATION) * 60);
    } else if (newMode === TIMER_MODES.SHORT_BREAK) {
      setTimeLeft((settings?.shortBreakDuration || DEFAULT_SETTINGS.SHORT_BREAK_DURATION) * 60);
    } else {
      setTimeLeft((settings?.longBreakDuration || DEFAULT_SETTINGS.LONG_BREAK_DURATION) * 60);
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