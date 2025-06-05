import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Filter,
  Plus,
  Search,
  X,
  MoreVertical,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import TaskModal from "@/features/Tasks/components/TaskModal";
import MobileTaskCard from "@/features/Tasks/components/MobileTaskCard";
import TaskFilters from "@/features/Tasks/components/TaskFilters";

/**
 * Pure presentation component for mobile task board layout
 * Receives all state and handlers via props from useTaskBoard hook
 */
function MobileTaskBoardLayout({
  // Data props
  groupedTasks,
  taskCounts,
  availableTags,
  isLoading,
  tasksError,
  tasks,
  filteredTasks,
  isTabletSize,

  // Search state
  searchText,
  setSearchText,

  // Filter state
  filters,
  showOverdueTasks,

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
  onCloseModal,
  onTaskSubmit,

  // Utilities
  getPriorityColor,
}) {
  // Local UI state
  const [activeTab, setActiveTab] = useState("todo");
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    onFilterChange({
      searchText: "",
      priorities: [],
      tags: [],
      sort: null,
    });
    setSearchText("");
    onOverdueToggle(false);
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  const getTasksForActiveTab = () => {
    return groupedTasks[activeTab] || [];
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-col space-y-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className={`${isTabletSize ? "text-xl" : "text-lg"}`}>
              Tasks
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`${isTabletSize ? "h-10 w-10" : "h-8 w-8"} p-0`}
              >
                <Filter className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${isTabletSize ? "h-10 w-10" : "h-8 w-8"} p-0`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAddTask()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`pl-10 ${isTabletSize ? "h-12" : "h-10"}`}
            />
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Filters</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFilters(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <TaskFilters
                onFilter={onFilterChange}
                availableTags={availableTags}
                onShowOverdue={onOverdueToggle}
                compact={true}
              />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            {Object.entries(taskCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`flex-1 ${
                  isTabletSize ? "py-3 px-4" : "py-2 px-3"
                } text-sm font-medium rounded-md transition-colors ${
                  activeTab === status
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{getStatusDisplayName(status)}</span>
                  <Badge
                    variant={activeTab === status ? "default" : "secondary"}
                    className="mt-1 text-xs"
                  >
                    {count}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Error handling */}
          {tasksError && (
            <div className="m-4 p-3 text-sm bg-red-100 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-300">
              {tasksError.message}
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
            </div>
          ) : filteredTasks.length === 0 && tasks.length > 0 ? (
            /* Empty state due to filters */
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <p className="text-muted-foreground text-sm mb-3">
                No tasks match your current filters.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            /* Task List */
            <div className="flex-1 overflow-y-auto min-h-0">
              <div
                className={`p-4 space-y-3 ${
                  isTabletSize ? "grid grid-cols-2 gap-4" : ""
                }`}
              >
                {getTasksForActiveTab().map((task) => (
                  <MobileTaskCard
                    key={task._id || task.id}
                    task={task}
                    columnId={activeTab}
                    onEdit={onEditTask}
                    onMove={onMoveTask}
                    isTabletSize={isTabletSize}
                    getPriorityColor={getPriorityColor}
                  />
                ))}

                {/* Empty state for active tab */}
                {getTasksForActiveTab().length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-muted-foreground text-sm mb-3">
                      No {getStatusDisplayName(activeTab).toLowerCase()} tasks
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddTask(activeTab)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        initialData={selectedTask}
        selectedColumnId={selectedColumnId}
        onSubmit={onTaskSubmit}
      />
    </>
  );
}

export default MobileTaskBoardLayout;
