import React from "react";
import TaskBoard from "@/features/Tasks/components/TaskBoard";

/**
 * TaskBoard component
 * This is now a simple wrapper around the modularized TaskBoard components
 */
export function MiniScreenTaskBoard() {
  return (
    <div className="relative group">
      <TaskBoard />
      <div className="absolute top-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs bg-black/70 text-white p-1 rounded">
        Use fullscreen for better workflow
      </div>
    </div>
  );
}
