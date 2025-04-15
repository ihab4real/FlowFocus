import React, { useState, useEffect } from "react";
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
import usePomodoroStore from "@/stores/pomodoroStore";
import {
  usePomodoroSettings,
  useUpdatePomodoroSettings,
} from "./hooks/usePomodoroQueries";
import { KEYBOARD_SHORTCUTS } from "./constants";

const PomodoroContainer = () => {
  // React Query hooks
  const { isLoading: isLoadingSettings } = usePomodoroSettings();
  const { mutate: updateServerSettings } = useUpdatePomodoroSettings();

  // Zustand store
  const {
    settings,
    isActive,
    mode,
    loadSettings,
    initializeTimer,
    setSettings: setStoreSettings,
    startSession,
    pauseTimer,
    endSession,
    switchToNextMode,
  } = usePomodoroStore();

  // Local UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const isFullscreen = location.pathname === "/dashboard/pomodoro";

  // Sound management - using the fixed TimerSound component
  // Wrap in try/catch to handle potential errors
  let timerSoundResult = { playEndSound: () => {} };
  try {
    timerSoundResult = TimerSound() || { playEndSound: () => {} };
  } catch (error) {
    console.error("Error initializing TimerSound:", error);
  }
  const { playEndSound = () => {} } = timerSoundResult;

  // Load settings from server on component mount
  useEffect(() => {
    try {
      loadSettings();
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings. Using defaults.");
    }
  }, []);

  // Initialize timer with settings when they're loaded
  useEffect(() => {
    if (settings && !isLoadingSettings) {
      try {
        initializeTimer(settings);
      } catch (error) {
        console.error("Error initializing timer:", error);
      }
    }
  }, [settings, isLoadingSettings]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest("input, textarea, [contenteditable]")) return;

      try {
        switch (e.code) {
          case KEYBOARD_SHORTCUTS.TOGGLE_TIMER:
            e.preventDefault();
            if (isActive) {
              pauseTimer();
            } else {
              startSession();
            }
            break;
          case KEYBOARD_SHORTCUTS.RESET_TIMER:
            if (isActive) {
              pauseTimer();
              endSession();
            }
            break;
          case KEYBOARD_SHORTCUTS.SKIP_SESSION:
            pauseTimer();
            endSession();
            switchToNextMode(settings);
            break;
          case KEYBOARD_SHORTCUTS.TOGGLE_FULLSCREEN:
            toggleFullscreen();
            break;
          case KEYBOARD_SHORTCUTS.EXIT_FULLSCREEN:
            if (isFullscreen) navigate("/dashboard");
            break;
        }
      } catch (error) {
        console.error("Error handling keyboard shortcut:", error);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, mode, settings, navigate, isActive]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/pomodoro");
    }
  };

  // Handle settings save
  const handleSaveSettings = (newSettings) => {
    try {
      // Update settings in store and on server
      setStoreSettings(newSettings);
      updateServerSettings(newSettings);
      setIsSettingsOpen(false);

      toast.success("Settings updated", {
        icon: "⚙️",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  // Show loading state while settings are being fetched
  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading timer settings...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        isFullscreen ? "p-8" : ""
      }`}
    >
      <Card className={`shadow-sm w-full ${isFullscreen ? "max-w-lg" : ""}`}>
        <TimerHeader
          setIsSettingsOpen={setIsSettingsOpen}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />

        <CardContent
          className={`flex flex-col items-center ${
            isFullscreen ? "pt-4" : "pt-2 pb-4"
          }`}
        >
          <TimerDisplay isFullscreen={isFullscreen} />

          {/* Session counter */}
          {isFullscreen && (
            <div className="mb-6">
              <SessionCounter />
            </div>
          )}

          <ModeSelector isFullscreen={isFullscreen} />

          <TimerControls isFullscreen={isFullscreen} />

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
