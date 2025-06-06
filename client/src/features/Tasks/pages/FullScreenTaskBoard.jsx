import React, { useState, useEffect } from "react";
import TaskBoard from "@/features/Tasks/components/TaskBoard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";

/**
 * FullScreenTaskBoard component
 * Renders a fullscreen version of the TaskBoard with the sidebar and header
 * Includes an entrance animation
 */
export function FullScreenTaskBoard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Apply entrance animation after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main
        className={`
          flex-1 overflow-auto pt-16 md:pt-0
          transition-all duration-500 ease-in-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        <DashboardHeader />
        <div className="p-4 md:p-6">
          <TaskBoard />
        </div>
      </main>
    </div>
  );
}

export default FullScreenTaskBoard;
