import React, { useRef, useEffect, useState } from "react";
import { SOUND_FILES } from "../constants";
import usePomodoroStore from "@/stores/pomodoroStore";

const TimerSound = () => {
  // Get data from the store
  const { settings } = usePomodoroStore();
  const [isPlaying, setIsPlaying] = useState(false);

  // Use only one sound reference
  const soundRef = useRef(
    typeof Audio !== "undefined" ? new Audio(SOUND_FILES.END) : null
  );

  // Update volume when settings change
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume = settings?.soundVolume / 100 || 0.8;
    }
  }, [settings?.soundVolume]);

  // Add event listener to handle when audio finishes playing
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
    };

    if (soundRef.current) {
      soundRef.current.addEventListener("ended", handleEnded);
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, []);

  const playEndSound = () => {
    if (settings?.soundEnabled && soundRef.current) {
      // Reset the sound to the beginning if it's already playing
      if (isPlaying) {
        soundRef.current.currentTime = 0;
      }

      soundRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => console.log("Sound play error:", err));
    }
  };

  const stopSound = () => {
    if (soundRef.current && isPlaying) {
      soundRef.current.pause();
      soundRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return { playEndSound, stopSound, isPlaying };
};

export default TimerSound;
