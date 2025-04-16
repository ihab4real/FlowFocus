import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Volume2, VolumeX, Maximize2, Square } from "lucide-react";
import usePomodoroStore from "@/stores/pomodoroStore";
import { useUpdatePomodoroSettings } from "../hooks/usePomodoroQueries";
import { TIMER_MODES, TIMER_TITLES, TIMER_COMPLETION } from "../constants";
import { toast } from "react-hot-toast";

const TimerHeader = ({
  setIsSettingsOpen,
  toggleFullscreen,
  isFullscreen,
  isPlaying,
  stopSound,
}) => {
  const {
    mode = TIMER_MODES.FOCUS,
    settings = {},
    isActive = false,
    timeLeft = 0,
    setSettings: setStoreSettings,
  } = usePomodoroStore();
  const { mutate: updateServerSettings } = useUpdatePomodoroSettings();

  // Get title based on mode
  const getTitle = () => {
    if (mode === TIMER_MODES.FOCUS) return TIMER_TITLES.FOCUS;
    if (mode === TIMER_MODES.SHORT_BREAK) return TIMER_TITLES.SHORT_BREAK;
    return TIMER_TITLES.LONG_BREAK;
  };

  // Get title class based on near completion state
  const getTitleClass = () => {
    const isNearCompletion =
      timeLeft <= TIMER_COMPLETION.NEAR_COMPLETION_THRESHOLD &&
      timeLeft > 0 &&
      isActive;
    if (isNearCompletion) {
      return "animate-pulse";
    }
    return "";
  };

  // Toggle sound settings
  const toggleSound = () => {
    const newSettings = {
      ...settings,
      soundEnabled: !settings.soundEnabled,
    };

    updateServerSettings(newSettings);

    toast.success(settings.soundEnabled ? "Sound disabled" : "Sound enabled", {
      icon: settings.soundEnabled ? "🔇" : "🔊",
      duration: TIMER_COMPLETION.SOUND_TOAST_DURATION,
    });
  };

  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className={getTitleClass()}>{getTitle()}</CardTitle>
      <div className="flex space-x-1">
        {isPlaying && (
          <Button
            variant="ghost"
            size="icon"
            onClick={stopSound}
            title="Stop sound"
            className="h-8 w-8 text-red-500"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}
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
  );
};

export default TimerHeader;
