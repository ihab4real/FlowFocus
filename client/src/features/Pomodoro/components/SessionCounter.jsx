import React from "react";

/**
 * SessionCounter component
 * Displays visual indicators for completed and upcoming pomodoro sessions
 */
const SessionCounter = ({ 
  sessionCount, 
  longBreakInterval, 
  sessionsUntilLongBreak,
  currentMode 
}) => {
  // Create an array representing all sessions in the current cycle
  const totalSessionsInCycle = Array.from({ length: longBreakInterval }, (_, i) => {
    const sessionNumber = sessionCount - (sessionsUntilLongBreak - 1) + i;
    const isCompleted = i < longBreakInterval - sessionsUntilLongBreak;
    const isCurrent = i === longBreakInterval - sessionsUntilLongBreak && currentMode === "focus";
    
    return { 
      sessionNumber: sessionNumber >= 0 ? sessionNumber + 1 : 1, 
      isCompleted,
      isCurrent
    };
  });
  
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {sessionsUntilLongBreak === 1 ? (
          "Next session: Long Break"
        ) : (
          `Sessions until long break: ${sessionsUntilLongBreak}`
        )}
      </h3>
      <div className="flex space-x-2 items-center">
        {totalSessionsInCycle.map((session, index) => (
          <div
            key={index}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              transition-all duration-300
              ${session.isCompleted 
                ? "bg-[#6C63FF] text-white" 
                : session.isCurrent
                  ? "bg-[#6C63FF]/20 border-2 border-[#6C63FF] text-[#6C63FF]" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}
            `}
            title={session.isCompleted 
              ? `Session ${session.sessionNumber} (Completed)` 
              : session.isCurrent
                ? `Session ${session.sessionNumber} (Current)`
                : `Session ${session.sessionNumber} (Upcoming)`}
          >
            {session.sessionNumber}
          </div>
        ))}
        <div 
          className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
            transition-all duration-300
            ${currentMode === "longBreak" 
              ? "bg-[#FF6584] text-white"
              : "bg-[#FF6584]/20 text-[#FF6584]"}
          `}
          title="Long Break"
        >
          <span className="text-lg">
            ☕
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionCounter; 