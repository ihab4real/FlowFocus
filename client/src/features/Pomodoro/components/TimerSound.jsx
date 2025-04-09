import React, { useRef, useEffect } from 'react';
import { SOUND_FILES, TIMER_MODES } from '../constants';
import usePomodoroStore from '@/stores/pomodoroStore';

const TimerSound = ({
  startSound = SOUND_FILES.START, 
  endSound = SOUND_FILES.END, 
  breakEndSound = SOUND_FILES.BREAK_END 
}) => {
  // Get data from the store
  const { settings, mode, isActive } = usePomodoroStore();
  
  const startSoundRef = useRef(typeof Audio !== 'undefined' ? new Audio(startSound) : null);
  const endSoundRef = useRef(typeof Audio !== 'undefined' ? new Audio(endSound) : null);
  const breakEndSoundRef = useRef(typeof Audio !== 'undefined' ? new Audio(breakEndSound) : null);

  // Update volume when settings change
  useEffect(() => {
    if (startSoundRef.current) {
      startSoundRef.current.volume = settings.soundVolume / 100;
    }
    if (endSoundRef.current) {
      endSoundRef.current.volume = settings.soundVolume / 100;
    }
    if (breakEndSoundRef.current) {
      breakEndSoundRef.current.volume = settings.soundVolume / 100;
    }
  }, [settings.soundVolume]);

  // Play start sound when timer starts
  useEffect(() => {
    if (isActive && settings.soundEnabled) {
      startSoundRef.current?.play();
    }
  }, [isActive, settings.soundEnabled]);

  const playEndSound = () => {
    if (settings.soundEnabled) {
      if (mode === TIMER_MODES.FOCUS) {
        endSoundRef.current?.play();
      } else {
        breakEndSoundRef.current?.play();
      }
    }
  };

  return { playEndSound };
};

export default TimerSound; 