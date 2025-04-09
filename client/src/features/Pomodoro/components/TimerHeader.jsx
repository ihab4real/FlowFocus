import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Volume2, VolumeX, Maximize2 } from "lucide-react";

const TimerHeader = ({ 
  getTitle, 
  getTitleClass, 
  toggleSound, 
  settings, 
  setIsSettingsOpen, 
  toggleFullscreen, 
  isFullscreen 
}) => {
  return (
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
  );
};

export default TimerHeader; 