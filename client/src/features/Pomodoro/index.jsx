import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PomodoroSettingsModal from "./components/PomodoroSettingsModal";
import SessionCounter from "./components/SessionCounter";
import TimerDisplay from "./components/TimerDisplay";
import TimerControls from "./components/TimerControls";
import ModeSelector from "./components/ModeSelector";
import TimerHeader from "./components/TimerHeader";
import TimerFooter from "./components/TimerFooter";
import TimerSound from "./components/TimerSound";
import {
  TIMER_MODES,
  DEFAULT_SETTINGS,
  TIMER_COLORS,
  TIMER_TITLES,
  BUTTON_CLASSES,
  TIMER_COMPLETION,
  KEYBOARD_SHORTCUTS,
  STORAGE_KEYS
} from "./constants";

const PomodoroContainer = () => {
  // Settings state
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return DEFAULT_SETTINGS;
  });

  // Timer state
  const [mode, setMode] = useState(TIMER_MODES.FOCUS);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(settings.longBreakInterval);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const isFullscreen = location.pathname === "/dashboard/pomodoro";
  
  // Calculate durations in seconds
  const totalTime = useCallback(() => {
    if (mode === TIMER_MODES.FOCUS) return settings.focusDuration * 60;
    if (mode === TIMER_MODES.SHORT_BREAK) return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  }, [mode, settings]);
  
  // Calculate progress
  const progress = (timeLeft / totalTime()) * 100;
  
  // Sound management
  const { playEndSound } = TimerSound({ settings, mode, isActive });
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest('input, textarea, [contenteditable]')) return;
      
      switch (e.code) {
        case KEYBOARD_SHORTCUTS.TOGGLE_TIMER:
          e.preventDefault();
          setIsActive(prev => !prev);
          break;
        case KEYBOARD_SHORTCUTS.RESET_TIMER:
          resetTimer();
          break;
        case KEYBOARD_SHORTCUTS.SKIP_SESSION:
          skipToNextSession();
          break;
        case KEYBOARD_SHORTCUTS.TOGGLE_FULLSCREEN:
          toggleFullscreen();
          break;
        case KEYBOARD_SHORTCUTS.EXIT_FULLSCREEN:
          if (isFullscreen) navigate("/dashboard");
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, mode, settings, navigate]);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
  }, [settings]);
  
  // Main timer effect
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, mode, settings]);
  
  // Handle timer completion
  const handleTimerComplete = () => {
    setIsActive(false);
    playEndSound();
    
    if (mode === TIMER_MODES.FOCUS) {
      toast.success("Focus session completed! Take a break.", {
        icon: "🎉",
        duration: TIMER_COMPLETION.TOAST_DURATION,
      });
      
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (sessionsUntilLongBreak === 1) {
        setMode(TIMER_MODES.LONG_BREAK);
        setTimeLeft(settings.longBreakDuration * 60);
        setSessionsUntilLongBreak(settings.longBreakInterval);
        if (settings.autoStartBreaks) setIsActive(true);
      } else {
        setMode(TIMER_MODES.SHORT_BREAK);
        setTimeLeft(settings.shortBreakDuration * 60);
        setSessionsUntilLongBreak(prev => prev - 1);
        if (settings.autoStartBreaks) setIsActive(true);
      }
    } else {
      toast.success("Break completed! Ready to focus?", {
        icon: "🚀",
        duration: TIMER_COMPLETION.TOAST_DURATION,
      });
      
      setMode(TIMER_MODES.FOCUS);
      setTimeLeft(settings.focusDuration * 60);
      if (settings.autoStartPomodoros) setIsActive(true);
    }
  };

  // Toggle timer between active and paused
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Reset the current timer
  const resetTimer = () => {
    setIsActive(false);
    if (mode === TIMER_MODES.FOCUS) {
      setTimeLeft(settings.focusDuration * 60);
    } else if (mode === TIMER_MODES.SHORT_BREAK) {
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      setTimeLeft(settings.longBreakDuration * 60);
    }
  };
  
  // Skip to the next session
  const skipToNextSession = () => {
    setIsActive(false);
    
    if (mode === TIMER_MODES.FOCUS) {
      if (sessionsUntilLongBreak === 1) {
        setMode(TIMER_MODES.LONG_BREAK);
        setTimeLeft(settings.longBreakDuration * 60);
        setSessionCount(sessionCount + 1);
        setSessionsUntilLongBreak(settings.longBreakInterval);
      } else {
        setMode(TIMER_MODES.SHORT_BREAK);
        setTimeLeft(settings.shortBreakDuration * 60);
        setSessionCount(sessionCount + 1);
        setSessionsUntilLongBreak(prev => prev - 1);
      }
    } else {
      setMode(TIMER_MODES.FOCUS);
      setTimeLeft(settings.focusDuration * 60);
    }
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/pomodoro");
    }
  };
  
  // Toggle sounds
  const toggleSound = () => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
    
    toast.success(settings.soundEnabled ? "Sound disabled" : "Sound enabled", {
      icon: settings.soundEnabled ? "🔇" : "🔊",
      duration: TIMER_COMPLETION.SOUND_TOAST_DURATION,
    });
  };
  
  // Determine if the timer is near completion
  const isNearCompletion = timeLeft <= TIMER_COMPLETION.NEAR_COMPLETION_THRESHOLD && timeLeft > 0 && isActive;
  
  // Get title class based on mode and near completion state
  const getTitleClass = () => {
    if (isNearCompletion) {
      return "animate-pulse";
    }
    return "";
  };
  
  // Get timer color based on mode
  const getTimerColor = () => {
    if (mode === TIMER_MODES.FOCUS) return TIMER_COLORS.FOCUS;
    if (mode === TIMER_MODES.SHORT_BREAK) return TIMER_COLORS.SHORT_BREAK;
    return TIMER_COLORS.LONG_BREAK;
  };
  
  // Get button color based on mode
  const getButtonClass = () => {
    if (mode === TIMER_MODES.FOCUS) return BUTTON_CLASSES.FOCUS;
    if (mode === TIMER_MODES.SHORT_BREAK) return BUTTON_CLASSES.SHORT_BREAK;
    return BUTTON_CLASSES.LONG_BREAK;
  };
  
  // Get title based on mode
  const getTitle = () => {
    if (mode === TIMER_MODES.FOCUS) return TIMER_TITLES.FOCUS;
    if (mode === TIMER_MODES.SHORT_BREAK) return TIMER_TITLES.SHORT_BREAK;
    return TIMER_TITLES.LONG_BREAK;
  };
  
  // Handle settings save
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
    
    setTimeLeft(
      mode === TIMER_MODES.FOCUS
        ? newSettings.focusDuration * 60
        : mode === TIMER_MODES.SHORT_BREAK
        ? newSettings.shortBreakDuration * 60
        : newSettings.longBreakDuration * 60
    );
    
    if (newSettings.longBreakInterval !== settings.longBreakInterval) {
      setSessionsUntilLongBreak(
        mode === TIMER_MODES.FOCUS ? newSettings.longBreakInterval : settings.longBreakInterval
      );
    }
    
    toast.success("Settings updated", {
      icon: "⚙️",
      duration: TIMER_COMPLETION.SOUND_TOAST_DURATION,
    });
  };

  return (
    <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'p-8' : ''}`}>
      <Card className={`shadow-sm w-full ${isFullscreen ? 'max-w-lg' : ''}`}>
        <TimerHeader
          getTitle={getTitle}
          getTitleClass={getTitleClass}
          toggleSound={toggleSound}
          settings={settings}
          setIsSettingsOpen={setIsSettingsOpen}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
        
        <CardContent className={`flex flex-col items-center ${isFullscreen ? 'pt-4' : 'pt-2 pb-4'}`}>
          <TimerDisplay
            timeLeft={timeLeft}
            progress={progress}
            isNearCompletion={isNearCompletion}
            isFullscreen={isFullscreen}
            getTimerColor={getTimerColor}
          />

          {/* Session counter */}
          {isFullscreen && (
            <div className="mb-6">
              <SessionCounter 
                sessionCount={sessionCount} 
                longBreakInterval={settings.longBreakInterval} 
                sessionsUntilLongBreak={sessionsUntilLongBreak} 
                currentMode={mode}
              />
            </div>
          )}

          <ModeSelector
            mode={mode}
            setMode={setMode}
            setTimeLeft={setTimeLeft}
            setIsActive={setIsActive}
            settings={settings}
            isFullscreen={isFullscreen}
          />

          <TimerControls
            isActive={isActive}
            toggleTimer={toggleTimer}
            resetTimer={resetTimer}
            skipToNextSession={skipToNextSession}
            getButtonClass={getButtonClass}
            isFullscreen={isFullscreen}
          />
          
          <TimerFooter isFullscreen={isFullscreen} />
        </CardContent>
      </Card>
      
      {isSettingsOpen && (
        <PomodoroSettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
};

export default PomodoroContainer; 