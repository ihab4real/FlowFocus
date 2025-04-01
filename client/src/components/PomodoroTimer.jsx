import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

export function PomodoroTimer() {
  const [mode, setMode] = useState("focus"); // focus or break
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds

  const totalTime = mode === "focus" ? 25 * 60 : 5 * 60;
  const progress = (timeLeft / totalTime) * 100;

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsActive(false);
            // Switch modes
            if (mode === "focus") {
              setMode("break");
              setTimeLeft(5 * 60); // 5 minute break
            } else {
              setMode("focus");
              setTimeLeft(25 * 60); // 25 minute focus
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, mode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Pomodoro Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
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
              stroke={mode === "focus" ? "#6C63FF" : "#4FD1C5"}
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold">{formatTime(timeLeft)}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "focus" ? "default" : "outline"}
            onClick={() => {
              setMode("focus");
              setTimeLeft(25 * 60);
              setIsActive(false);
            }}
            className={
              mode === "focus" ? "bg-[#6C63FF] hover:bg-[#6C63FF]/90" : ""
            }
          >
            Focus
          </Button>
          <Button
            variant={mode === "break" ? "default" : "outline"}
            onClick={() => {
              setMode("break");
              setTimeLeft(5 * 60);
              setIsActive(false);
            }}
            className={
              mode === "break" ? "bg-[#4FD1C5] hover:bg-[#4FD1C5]/90" : ""
            }
          >
            Break
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={toggleTimer}
            className={
              mode === "focus"
                ? "bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                : "bg-[#4FD1C5] hover:bg-[#4FD1C5]/90"
            }
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
          <Button variant="outline" onClick={resetTimer}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
