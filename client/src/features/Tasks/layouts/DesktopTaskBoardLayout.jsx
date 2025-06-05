import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Maximize2, Minimize2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TaskModal from "@/features/Tasks/components/TaskModal";
import TaskFilters from "@/features/Tasks/components/TaskFilters";
import TaskColumn from "@/features/Tasks/components/TaskColumn";
import MirroredTaskCard from "@/features/Tasks/components/MirroredTaskCard";

/**
 * Pure presentation component for desktop task board layout
 * Receives all state and handlers via props from useTaskBoard hook
 */
function DesktopTaskBoardLayout({
  // Data props
  columns,
  tasks,
  filteredTasks,
  taskStats,
  overdueTasks,
  availableTags,
  isLoading,
  tasksError,
  isFullscreen,
  newColumnId,
  mirroredDrag,

  // Modal state
  isModalOpen,
  selectedTask,
  selectedColumnId,

  // Handlers
  onAddTask,
  onEditTask,
  onMoveTask,
  onFilterChange,
  onOverdueToggle,
  onTaskDragStart,
  onTaskDragMove,
  onTaskDragEnd,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onToggleFullscreen,
  onCloseModal,
  onTaskSubmit,
  getColumnLayoutClasses,

  // Utilities
  getPriorityColor,
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Card
        className={`
          shadow-sm
          ${isFullscreen ? "h-screen rounded-none border-0" : "h-full"}
          transition-all duration-500 ease-in-out
        `}
      >
        <CardHeader className="flex flex-col space-y-3 border-b">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Task Board</CardTitle>
            <div className="flex space-x-2">
              <Button
                size="sm"
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                onClick={() => onAddTask()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
              <Button
                size="sm"
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                onClick={onAddColumn}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Column
              </Button>
              <div className="relative ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleFullscreen}
                  className={`
                    transition-all duration-300 ease-in-out 
                    group overflow-hidden border-[#6C63FF]/30
                    hover:border-[#6C63FF] hover:bg-[#6C63FF]/5
                    ${isFullscreen ? "bg-[#6C63FF]/10 text-[#6C63FF]" : ""}
                  `}
                  title={
                    isFullscreen ? "Exit Full Screen" : "Enter Full Screen"
                  }
                >
                  <span className="absolute inset-0 bg-[#6C63FF]/0 group-hover:bg-[#6C63FF]/5 transition-all duration-300"></span>
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 relative z-10 group-hover:scale-95 transition-transform" />
                  ) : (
                    <Maximize2 className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Task board statistics */}
          {isFullscreen && (
            <div className="flex flex-wrap gap-3 mt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-3 py-1 rounded-full bg-gray-100 text-xs font-medium dark:bg-gray-800">
                      Total: {taskStats.total}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300">
                      To Do: {taskStats.todo}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasks waiting to be started</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium dark:bg-purple-900/30 dark:text-purple-300">
                      In Progress: {taskStats.inProgress}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasks currently in progress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                      Done: {taskStats.done}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Completed tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {overdueTasks.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium dark:bg-red-900/30 dark:text-red-300">
                        Overdue: {taskStats.overdue}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tasks past their due date</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {taskStats.highPriority > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium dark:bg-red-900/30 dark:text-red-300">
                        High Priority: {taskStats.highPriority}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tasks with high priority</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* Task filters */}
          <TaskFilters
            onFilter={onFilterChange}
            availableTags={availableTags}
            onShowOverdue={onOverdueToggle}
          />
        </CardHeader>

        <CardContent
          id="task-board-container"
          className={`p-4 ${isFullscreen ? "h-[calc(100vh-13rem)] overflow-hidden" : ""}`}
        >
          {tasksError && (
            <div className="mb-4 p-3 text-sm bg-red-100 text-red-800 rounded-md">
              {tasksError.message}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
            </div>
          ) : filteredTasks.length === 0 && tasks.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                No tasks match your current filters.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  onFilterChange({
                    searchText: "",
                    priorities: [],
                    tags: [],
                    sort: null,
                  });
                  onOverdueToggle(false);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className={getColumnLayoutClasses()}>
              {columns.map((column) => (
                <TaskColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={column.tasks}
                  getPriorityColor={getPriorityColor}
                  onMoveTask={onMoveTask}
                  onAddTask={onAddTask}
                  onDeleteColumn={onDeleteColumn}
                  onEditColumn={onEditColumn}
                  isNewColumn={column.id === newColumnId}
                  onDragStart={onTaskDragStart}
                  onDragMove={onTaskDragMove}
                  onDragEnd={onTaskDragEnd}
                />
              ))}
            </div>
          )}

          {/* Render mirrored task if being dragged in another window */}
          {mirroredDrag && mirroredDrag.isDragging && (
            <MirroredTaskCard
              mirroredDragData={mirroredDrag}
              getPriorityColor={getPriorityColor}
            />
          )}
        </CardContent>
      </Card>

      <TaskModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        initialData={selectedTask}
        selectedColumnId={selectedColumnId}
        onSubmit={onTaskSubmit}
      />
    </DndProvider>
  );
}

export default DesktopTaskBoardLayout;
