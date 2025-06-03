import React, { useEffect } from "react";
import { useTaskBoard } from "@/features/Tasks/hooks/useTaskBoard";
import { useDeviceDetection } from "@/features/Tasks/hooks/useDeviceDetection";
import MobileTaskBoardLayout from "@/features/Tasks/layouts/MobileTaskBoardLayout";
import DesktopTaskBoardLayout from "@/features/Tasks/layouts/DesktopTaskBoardLayout";

/**
 * This is the main entry point that handles business logic via hooks and
 * delegates rendering to device-specific layout components
 */
function TaskBoard() {
  // Get device detection info
  const { isMobile, isTablet } = useDeviceDetection();

  // Get all task board business logic from hook
  const taskBoardState = useTaskBoard();

  // Destructure the specific function we need to avoid dependency warnings
  const { handleEditTask } = taskBoardState;

  // Listen for edit task events from TaskCard (for desktop drag & drop)
  useEffect(() => {
    const handleEditTaskEvent = (event) => {
      handleEditTask(event.detail);
    };

    window.addEventListener("editTask", handleEditTaskEvent);

    return () => {
      window.removeEventListener("editTask", handleEditTaskEvent);
    };
  }, [handleEditTask]);

  // Determine which layout to render based on device detection
  const shouldUseMobileLayout = isMobile || isTablet;

  if (shouldUseMobileLayout) {
    return (
      <MobileTaskBoardLayout
        // Data props
        groupedTasks={taskBoardState.groupedTasks}
        taskCounts={taskBoardState.taskCounts}
        availableTags={taskBoardState.availableTags}
        isLoading={taskBoardState.isLoading}
        tasksError={taskBoardState.tasksError}
        tasks={taskBoardState.tasks}
        filteredTasks={taskBoardState.filteredTasks}
        isTabletSize={isTablet}
        // Search state
        searchText={taskBoardState.searchText}
        setSearchText={taskBoardState.setSearchText}
        // Filter state
        filters={taskBoardState.filters}
        showOverdueTasks={taskBoardState.showOverdueTasks}
        // Modal state
        isModalOpen={taskBoardState.isModalOpen}
        selectedTask={taskBoardState.selectedTask}
        selectedColumnId={taskBoardState.selectedColumnId}
        // Handlers
        onAddTask={taskBoardState.handleAddTask}
        onEditTask={taskBoardState.handleEditTask}
        onMoveTask={taskBoardState.handleMoveTask}
        onFilterChange={taskBoardState.handleFilterChange}
        onOverdueToggle={taskBoardState.handleOverdueToggle}
        onCloseModal={taskBoardState.handleCloseModal}
        onTaskSubmit={taskBoardState.handleTaskSubmit}
        // Utilities
        getPriorityColor={taskBoardState.getPriorityColor}
      />
    );
  }

  return (
    <DesktopTaskBoardLayout
      // Data props
      columns={taskBoardState.columns}
      tasks={taskBoardState.tasks}
      filteredTasks={taskBoardState.filteredTasks}
      taskStats={taskBoardState.taskStats}
      overdueTasks={taskBoardState.overdueTasks}
      availableTags={taskBoardState.availableTags}
      isLoading={taskBoardState.isLoading}
      tasksError={taskBoardState.tasksError}
      isFullscreen={taskBoardState.isFullscreen}
      newColumnId={taskBoardState.newColumnId}
      mirroredDrag={taskBoardState.mirroredDrag}
      // Modal state
      isModalOpen={taskBoardState.isModalOpen}
      selectedTask={taskBoardState.selectedTask}
      selectedColumnId={taskBoardState.selectedColumnId}
      // Handlers
      onAddTask={taskBoardState.handleAddTask}
      onEditTask={taskBoardState.handleEditTask}
      onMoveTask={taskBoardState.handleMoveTask}
      onFilterChange={taskBoardState.handleFilterChange}
      onOverdueToggle={taskBoardState.handleOverdueToggle}
      onTaskDragStart={taskBoardState.handleTaskDragStart}
      onTaskDragMove={taskBoardState.handleTaskDragMove}
      onTaskDragEnd={taskBoardState.handleTaskDragEnd}
      onAddColumn={taskBoardState.handleAddColumn}
      onEditColumn={taskBoardState.handleEditColumn}
      onDeleteColumn={taskBoardState.handleDeleteColumn}
      onToggleFullscreen={taskBoardState.toggleFullscreen}
      onCloseModal={taskBoardState.handleCloseModal}
      onTaskSubmit={taskBoardState.handleTaskSubmit}
      getColumnLayoutClasses={taskBoardState.getColumnLayoutClasses}
      // Utilities
      getPriorityColor={taskBoardState.getPriorityColor}
    />
  );
}

export default TaskBoard;
