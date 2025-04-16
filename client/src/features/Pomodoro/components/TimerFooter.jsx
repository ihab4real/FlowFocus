import React from "react";
import { KEYBOARD_SHORTCUTS } from "../constants";

const TimerFooter = ({ isFullscreen }) => {
  if (!isFullscreen) return null;

  return (
    <div className="mt-6 text-sm text-muted-foreground">
      <p className="text-center">
        <kbd className="px-2 py-1 bg-muted rounded">
          {KEYBOARD_SHORTCUTS.TOGGLE_TIMER}
        </kbd>{" "}
        to start/pause,{" "}
        <kbd className="px-2 py-1 bg-muted rounded">
          {KEYBOARD_SHORTCUTS.RESET_TIMER}
        </kbd>{" "}
        to reset,{" "}
        <kbd className="px-2 py-1 bg-muted rounded">
          {KEYBOARD_SHORTCUTS.SKIP_SESSION}
        </kbd>{" "}
        to skip,{" "}
        <kbd className="px-2 py-1 bg-muted rounded">
          {KEYBOARD_SHORTCUTS.EXIT_FULLSCREEN}
        </kbd>{" "}
        to exit fullscreen
      </p>
    </div>
  );
};

export default TimerFooter;
