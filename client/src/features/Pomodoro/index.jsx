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
import usePomodoroTimer from "./hooks/usePomodoroTimer";
import { useUpdatePomodoroSettings } from "./hooks/usePomodoroQueries";
import { KEYBOARD_SHORTCUTS } from "./constants";
import { useCallback } from "react";

/**
 * Main container for the Pomodoro feature
 * Uses the usePomodoroTimer hook for all timer logic
 */
const PomodoroContainer = () => {
  // Get all timer logic and state from the hook
  const {
    isActive,
    settings,
    isLoadingSettings,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToNextMode,
  } = usePomodoroTimer();

  // React Query hooks
  const { mutate: updateServerSettings } = useUpdatePomodoroSettings();

  // Local UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const isFullscreen = location.pathname === "/dashboard/pomodoro";

  // Get the store's setSettings function for updating settings
  const { setSettings: setStoreSettings } = usePomodoroStore();

  // Sound management - using the fixed TimerSound component
  // Wrap in try/catch to handle potential errors
  let timerSoundResult = { playEndSound: () => {} };
  try {
    timerSoundResult = TimerSound() || { playEndSound: () => {} };
  } catch (error) {
    console.error("Error initializing TimerSound:", error);
  }
  const { playEndSound = () => {} } = timerSoundResult;

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/pomodoro");
    }
  }, [isFullscreen, navigate]);

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
              startTimer();
            }
            break;
          case KEYBOARD_SHORTCUTS.RESET_TIMER:
            if (isActive) {
              resetTimer();
            }
            break;
          case KEYBOARD_SHORTCUTS.SKIP_SESSION:
            skipToNextMode();
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
  }, [
    isFullscreen,
    toggleFullscreen,
    isActive,
    navigate,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToNextMode,
  ]);

  // Handle settings save
  const handleSaveSettings = (newSettings) => {
    try {
      // Update settings in store
      setStoreSettings(newSettings);

      // Update settings on server
      updateServerSettings(newSettings);

      // Close settings modal
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

          <TimerControls
            isFullscreen={isFullscreen}
            startTimer={startTimer}
            pauseTimer={pauseTimer}
            resetTimer={resetTimer}
            skipToNextMode={skipToNextMode}
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
