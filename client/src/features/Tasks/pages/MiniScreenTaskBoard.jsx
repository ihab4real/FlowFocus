import React from "react";
import TaskBoard from "@/features/Tasks/components/TaskBoard";

/**
 * Mini task board view for dashboard - optimized for mobile responsiveness
 * This is a wrapper around the TaskBoard that automatically
 * detects device type and renders the appropriate layout
 */
function MiniScreenTaskBoard() {
  return <TaskBoard />;
}

export default MiniScreenTaskBoard;
