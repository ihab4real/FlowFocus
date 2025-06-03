import React from "react";
import ResponsiveTaskBoard from "@/features/Tasks/components/ResponsiveTaskBoard";

/**
 * MiniScreenTaskBoard component
 * This is now a wrapper around the ResponsiveTaskBoard that automatically
 * adapts to different screen sizes and device capabilities
 */
export function MiniScreenTaskBoard() {
  return (
    <div className="relative group">
      <ResponsiveTaskBoard />
      <div className="absolute top-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs bg-black/70 text-white p-1 rounded hidden lg:block">
        Use fullscreen for better workflow
      </div>
    </div>
  );
}
