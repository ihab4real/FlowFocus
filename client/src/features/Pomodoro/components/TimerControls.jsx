import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

const TimerControls = ({ 
  isActive, 
  toggleTimer, 
  resetTimer, 
  skipToNextSession, 
  getButtonClass, 
  isFullscreen 
}) => {
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