import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

/**
 * PomodoroSettingsModal component
 * Allows users to customize their pomodoro timer settings
 */
const PomodoroSettingsModal = ({ settings, onClose, onSave }) => {
  // Local state for settings
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // Handle input changes
  const handleNumberChange = (key, value, min, max) => {
    // Parse to number and clamp between min and max
    const numValue = Math.min(Math.max(parseInt(value) || min, min), max);
    setLocalSettings((prev) => ({ ...prev, [key]: numValue }));
  };

  // Handle switch changes
  const handleSwitchChange = (key) => {
    setLocalSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle volume change
  const handleVolumeChange = (value) => {
    setLocalSettings((prev) => ({ ...prev, soundVolume: value[0] }));
  };

  // Handle save
  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
          <DialogDescription>
            Customize your pomodoro timer to match your workflow
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="focusDuration">Focus duration (minutes)</Label>
            <Input
              id="focusDuration"
              type="number"
              min="1"
              max="120"
              value={localSettings.focusDuration}
              onChange={(e) =>
                handleNumberChange("focusDuration", e.target.value, 1, 120)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreakDuration">
              Short break duration (minutes)
            </Label>
            <Input
              id="shortBreakDuration"
              type="number"
              min="1"
              max="30"
              value={localSettings.shortBreakDuration}
              onChange={(e) =>
                handleNumberChange("shortBreakDuration", e.target.value, 1, 30)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreakDuration">
              Long break duration (minutes)
            </Label>
            <Input
              id="longBreakDuration"
              type="number"
              min="5"
              max="60"
              value={localSettings.longBreakDuration}
              onChange={(e) =>
                handleNumberChange("longBreakDuration", e.target.value, 5, 60)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreakInterval">
              Sessions before long break
            </Label>
            <Input
              id="longBreakInterval"
              type="number"
              min="2"
              max="10"
              value={localSettings.longBreakInterval}
              onChange={(e) =>
                handleNumberChange("longBreakInterval", e.target.value, 2, 10)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoStartBreaks">Auto-start breaks</Label>
            <Switch
              id="autoStartBreaks"
              checked={localSettings.autoStartBreaks}
              onCheckedChange={() => handleSwitchChange("autoStartBreaks")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoStartPomodoros">
              Auto-start focus sessions
            </Label>
            <Switch
              id="autoStartPomodoros"
              checked={localSettings.autoStartPomodoros}
              onCheckedChange={() => handleSwitchChange("autoStartPomodoros")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="soundEnabled">Sound notifications</Label>
            <Switch
              id="soundEnabled"
              checked={localSettings.soundEnabled}
              onCheckedChange={() => handleSwitchChange("soundEnabled")}
            />
          </div>

          {localSettings.soundEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="soundVolume">Sound volume</Label>
                <span className="text-sm text-muted-foreground">
                  {localSettings.soundVolume}%
                </span>
              </div>
              <Slider
                id="soundVolume"
                min={0}
                max={100}
                step={5}
                value={[localSettings.soundVolume]}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroSettingsModal;
