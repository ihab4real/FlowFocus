import React, { useRef, useEffect } from "react";
import { SOUND_FILES, TIMER_MODES } from "../constants";
import usePomodoroStore from "@/stores/pomodoroStore";

const TimerSound = () => {
  // Get data from the store
  const { settings, mode, isActive } = usePomodoroStore();

  const startSoundRef = useRef(
    typeof Audio !== "undefined" ? new Audio(SOUND_FILES.START) : null
  );
  const endSoundRef = useRef(
    typeof Audio !== "undefined" ? new Audio(SOUND_FILES.END) : null
  );
  const breakEndSoundRef = useRef(
    typeof Audio !== "undefined" ? new Audio(SOUND_FILES.BREAK_END) : null
  );

  // Update volume when settings change
  useEffect(() => {
    if (startSoundRef.current) {
      startSoundRef.current.volume = settings?.soundVolume / 100 || 0.8;
    }
    if (endSoundRef.current) {
      endSoundRef.current.volume = settings?.soundVolume / 100 || 0.8;
    }
    if (breakEndSoundRef.current) {
      breakEndSoundRef.current.volume = settings?.soundVolume / 100 || 0.8;
    }
  }, [settings?.soundVolume]);

  // Play start sound when timer starts
  useEffect(() => {
    if (isActive && settings?.soundEnabled) {
      startSoundRef.current
        ?.play()
        .catch((err) => console.log("Sound play error:", err));
    }
  }, [isActive, settings?.soundEnabled]);

  const playEndSound = () => {
    if (settings?.soundEnabled) {
      if (mode === TIMER_MODES.FOCUS) {
        endSoundRef.current
          ?.play()
          .catch((err) => console.log("Sound play error:", err));
      } else {
        breakEndSoundRef.current
          ?.play()
          .catch((err) => console.log("Sound play error:", err));
      }
    }
  };

  return { playEndSound };
};

export default TimerSound;
