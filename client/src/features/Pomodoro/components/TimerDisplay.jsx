import React from 'react';
import { TIMER_DIMENSIONS, TIMER_PROGRESS } from '../constants';

const TimerDisplay = ({ timeLeft, progress, isNearCompletion, isFullscreen, getTimerColor }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const dimensions = isFullscreen ? TIMER_DIMENSIONS.FULLSCREEN : TIMER_DIMENSIONS.DEFAULT;

  return (
    <div className={`relative ${dimensions.WIDTH} ${dimensions.HEIGHT} ${dimensions.MARGIN} ${isNearCompletion ? 'animate-pulse' : ''}`}>
      {/* Background circle */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={TIMER_PROGRESS.CIRCLE_RADIUS}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={TIMER_PROGRESS.CIRCLE_STROKE_WIDTH}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={TIMER_PROGRESS.CIRCLE_RADIUS}
          fill="none"
          stroke={getTimerColor()}
          strokeWidth={TIMER_PROGRESS.CIRCLE_STROKE_WIDTH}
          strokeDasharray={TIMER_PROGRESS.CIRCLE_DASHARRAY}
          strokeDashoffset={TIMER_PROGRESS.CIRCLE_DASHARRAY - (TIMER_PROGRESS.CIRCLE_DASHARRAY * progress) / 100}
          strokeLinecap="round"
          transform={`rotate(${TIMER_PROGRESS.CIRCLE_ROTATION} 50 50)`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${dimensions.TEXT_SIZE} font-bold ${isNearCompletion ? 'text-red-600 dark:text-red-400' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay; 