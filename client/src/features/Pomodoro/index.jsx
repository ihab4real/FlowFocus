import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Settings, 
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Maximize2
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PomodoroSettingsModal from "./components/PomodoroSettingsModal";
import SessionCounter from "./components/SessionCounter";

// Sound URLs
const startSound = "/sounds/start.mp3";
const endSound = "/sounds/complete.mp3";
const breakEndSound = "/sounds/break-end.mp3";

const PomodoroContainer = () => {
  // Settings state
  const [settings, setSettings] = useState(() => {
    // Try to load from localStorage
    const savedSettings = localStorage.getItem("pomodoroSettings");
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    // Default settings
    return {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      soundEnabled: true,
      soundVolume: 80
    };
  });

  // Timer state
  const [mode, setMode] = useState("focus"); // focus, shortBreak, or longBreak
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(settings.longBreakInterval);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Sound refs
  const startSoundRef = useRef(typeof Audio !== 'undefined' ? new Audio(startSound) : null);
  const endSoundRef = useRef(typeof Audio !== 'undefined' ? new Audio(endSound) : null);
  const breakEndSoundRef = useRef(typeof Audio !== 'undefined' ? new Audio(breakEndSound) : null);

  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const isFullscreen = location.pathname === "/dashboard/pomodoro";
  
  // Calculate durations in seconds
  const totalTime = useCallback(() => {
    if (mode === "focus") return settings.focusDuration * 60;
    if (mode === "shortBreak") return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60; // longBreak
  }, [mode, settings]);
  
  // Calculate progress
  const progress = (timeLeft / totalTime()) * 100;
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space - toggle timer
      if (e.code === "Space" && !e.target.closest('input, textarea, [contenteditable]')) {
        e.preventDefault();
        setIsActive(prev => !prev);
      }
      
      // R - reset timer
      if (e.code === "KeyR" && !e.target.closest('input, textarea, [contenteditable]')) {
        resetTimer();
      }
      
      // S - skip to next session
      if (e.code === "KeyS" && !e.target.closest('input, textarea, [contenteditable]')) {
        skipToNextSession();
      }
      
      // F - toggle fullscreen
      if (e.code === "KeyF" && !e.target.closest('input, textarea, [contenteditable]')) {
        toggleFullscreen();
      }
      
      // Escape - exit fullscreen
      if (e.code === "Escape" && isFullscreen) {
        navigate("/dashboard");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, mode, settings, navigate]);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  }, [settings]);
  
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
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  
  // Handle timer completion
  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Play appropriate sound
    if (settings.soundEnabled) {
      if (mode === "focus") {
        endSoundRef.current?.play();
        toast.success("Focus session completed! Take a break.", {
          icon: "🎉",
          duration: 3000,
        });
        
        // Update session count
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);
        
        // Check if it's time for a long break
        if (sessionsUntilLongBreak === 1) {
          // Time for a long break
          setMode("longBreak");
          setTimeLeft(settings.longBreakDuration * 60);
          setSessionsUntilLongBreak(settings.longBreakInterval);
          
          if (settings.autoStartBreaks) {
            setIsActive(true);
          }
        } else {
          // Short break
          setMode("shortBreak");
          setTimeLeft(settings.shortBreakDuration * 60);
          setSessionsUntilLongBreak(prev => prev - 1);
          
          if (settings.autoStartBreaks) {
            setIsActive(true);
          }
        }
      } else {
        // Break ended
        breakEndSoundRef.current?.play();
        toast.success("Break completed! Ready to focus?", {
          icon: "🚀",
          duration: 3000,
        });
        
        // Back to focus mode
        setMode("focus");
        setTimeLeft(settings.focusDuration * 60);
        
        if (settings.autoStartPomodoros) {
          setIsActive(true);
        }
      }
    }
  };

  // Toggle timer between active and paused
  const toggleTimer = () => {
    // Play start sound when starting
    if (!isActive && settings.soundEnabled) {
      startSoundRef.current?.play();
    }
    setIsActive(!isActive);
  };

  // Reset the current timer
  const resetTimer = () => {
    setIsActive(false);
    if (mode === "focus") {
      setTimeLeft(settings.focusDuration * 60);
    } else if (mode === "shortBreak") {
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      setTimeLeft(settings.longBreakDuration * 60);
    }
  };
  
  // Skip to the next session
  const skipToNextSession = () => {
    setIsActive(false);
    
    if (mode === "focus") {
      // If in focus mode, skip to appropriate break
      if (sessionsUntilLongBreak === 1) {
        // Time for a long break
        setMode("longBreak");
        setTimeLeft(settings.longBreakDuration * 60);
        setSessionCount(sessionCount + 1);
        setSessionsUntilLongBreak(settings.longBreakInterval);
      } else {
        // Short break
        setMode("shortBreak");
        setTimeLeft(settings.shortBreakDuration * 60);
        setSessionCount(sessionCount + 1);
        setSessionsUntilLongBreak(prev => prev - 1);
      }
    } else {
      // If in break mode, go back to focus
      setMode("focus");
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
      duration: 2000,
    });
  };
  
  // Determine if the timer is near completion (last 10 seconds)
  const isNearCompletion = timeLeft <= 10 && timeLeft > 0 && isActive;
  
  // Get title class based on mode and near completion state
  const getTitleClass = () => {
    if (isNearCompletion) {
      return "animate-pulse";
    }
    return "";
  };
  
  // Get timer color based on mode
  const getTimerColor = () => {
    if (mode === "focus") return "#6C63FF"; // Primary purple
    if (mode === "shortBreak") return "#4FD1C5"; // Teal
    return "#FF6584"; // Pink for long breaks
  };
  
  // Get button color based on mode
  const getButtonClass = () => {
    if (mode === "focus") return "bg-[#6C63FF] hover:bg-[#6C63FF]/90";
    if (mode === "shortBreak") return "bg-[#4FD1C5] hover:bg-[#4FD1C5]/90";
    return "bg-[#FF6584] hover:bg-[#FF6584]/90";
  };
  
  // Get title based on mode
  const getTitle = () => {
    if (mode === "focus") return "Focus Session";
    if (mode === "shortBreak") return "Short Break";
    return "Long Break";
  };
  
  // Handle settings save
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
    
    // Reset timer with new durations
    setTimeLeft(
      mode === "focus"
        ? newSettings.focusDuration * 60
        : mode === "shortBreak"
        ? newSettings.shortBreakDuration * 60
        : newSettings.longBreakDuration * 60
    );
    
    // Update sessions until long break interval if needed
    if (newSettings.longBreakInterval !== settings.longBreakInterval) {
      setSessionsUntilLongBreak(
        mode === "focus" ? newSettings.longBreakInterval : settings.longBreakInterval
      );
    }
    
    toast.success("Settings updated", {
      icon: "⚙️",
      duration: 2000,
    });
  };

  return (
    <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'p-8' : ''}`}>
      <Card className={`shadow-sm w-full ${isFullscreen ? 'max-w-lg' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={getTitleClass()}>{getTitle()}</CardTitle>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              title={settings.soundEnabled ? "Disable sound" : "Enable sound"}
              className="h-8 w-8"
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {!isFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                title="Open in Full Screen"
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={`flex flex-col items-center ${isFullscreen ? 'pt-4' : 'pt-2 pb-4'}`}>
          <div className={`relative ${isFullscreen ? 'w-64 h-64 mb-6' : 'w-40 h-40 mb-4'} ${isNearCompletion ? 'animate-pulse' : ''}`}>
            {/* Background circle */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getTimerColor()}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${isFullscreen ? 'text-6xl' : 'text-4xl'} font-bold ${isNearCompletion ? 'text-red-600 dark:text-red-400' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

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

          <div className={`flex gap-3 ${isFullscreen ? 'mb-6' : 'mb-4'}`}>
            <Button
              variant={mode === "focus" ? "default" : "outline"}
              onClick={() => {
                setMode("focus");
                setTimeLeft(settings.focusDuration * 60);
                setIsActive(false);
              }}
              className={mode === "focus" ? "bg-[#6C63FF] hover:bg-[#6C63FF]/90" : ""}
              size={isFullscreen ? "default" : "sm"}
            >
              Focus
            </Button>
            <Button
              variant={mode === "shortBreak" ? "default" : "outline"}
              onClick={() => {
                setMode("shortBreak");
                setTimeLeft(settings.shortBreakDuration * 60);
                setIsActive(false);
              }}
              className={mode === "shortBreak" ? "bg-[#4FD1C5] hover:bg-[#4FD1C5]/90" : ""}
              size={isFullscreen ? "default" : "sm"}
            >
              Short Break
            </Button>
            <Button
              variant={mode === "longBreak" ? "default" : "outline"}
              onClick={() => {
                setMode("longBreak");
                setTimeLeft(settings.longBreakDuration * 60);
                setIsActive(false);
              }}
              className={mode === "longBreak" ? "bg-[#FF6584] hover:bg-[#FF6584]/90" : ""}
              size={isFullscreen ? "default" : "sm"}
            >
              Long Break
            </Button>
          </div>

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
          
          {isFullscreen && (
            <div className="mt-6 text-sm text-muted-foreground">
              <p className="text-center">
                <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to start/pause,{" "}
                <kbd className="px-2 py-1 bg-muted rounded">R</kbd> to reset,{" "}
                <kbd className="px-2 py-1 bg-muted rounded">S</kbd> to skip,{" "}
                <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> to exit fullscreen
              </p>
            </div>
          )}
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