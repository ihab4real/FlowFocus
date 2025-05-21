import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Maximize2, Minimize2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskModal from "@/features/Tasks/components/TaskModal";
import TaskFilters from "@/features/Tasks/components/TaskFilters";
import TaskColumn from "@/features/Tasks/components/TaskColumn";
import MirroredTaskCard from "@/features/Tasks/components/MirroredTaskCard";
import {
  getPriorityColor,
  groupTasksByStatus,
  statusMap,
} from "@/features/Tasks/utils/taskUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { isAfter, parseISO } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTasksQuery,
  useMoveTaskMutation,
  taskKeys,
} from "@/features/Tasks/hooks/useTaskQueries";
import {
  onTaskEvent,
  offTaskEvent,
  emitTaskDragStart,
  emitTaskDragMove,
  emitTaskDragEnd,
} from "@/services/socketService";
import { useQueryClient } from "@tanstack/react-query";

function TaskBoard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]); // Store filtered tasks
  const [columns, setColumns] = useState([]);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [customColumnCount, setCustomColumnCount] = useState(0);
  const [newColumnId, setNewColumnId] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [mirroredDrag, setMirroredDrag] = useState(null); // For mirroring drag across instances
  const [filters, setFilters] = useState({
    searchText: "",
    priorities: [],
    tags: [],
    sort: null,
  });
  const [showOverdueTasks, setShowOverdueTasks] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Use React Query to fetch tasks
  const { data: tasksResponse, isLoading, error: tasksError } = useTasksQuery();
  const moveTaskMutation = useMoveTaskMutation();

  // Extract tasks from the query response
  const tasks = useMemo(() => tasksResponse || [], [tasksResponse]);

  // Check if we're in fullscreen mode
  const isFullscreen = location.pathname === "/dashboard/taskboard";

  // Setup WebSocket listeners for task updates
  useEffect(() => {
    // Task updated event handler
    const handleTaskUpdated = (taskId) => {
      // Invalidate the specific task
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(taskId),
      });
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    };

    // Listen for task:updated events
    onTaskEvent("task:updated", handleTaskUpdated);

    // Cleanup
    return () => {
      offTaskEvent("task:updated", handleTaskUpdated);
    };
  }, [queryClient]);

  // Setup WebSocket listeners for drag mirroring
  useEffect(() => {
    // Task drag event handlers
    const handleDragStart = (data) => {
      setMirroredDrag({
        taskId: data.task.id,
        position: data.absolute, // Keep for potential fallback, though relative is preferred
        relativePosition: data.relative,
        dimensions: data.dimensions,
        taskInfo: data.task, // Ensure taskInfo is captured
        isDragging: true,
      });
    };

    const handleDragMove = (data) => {
      // Ensure we're updating the state correctly for the moving task
      setMirroredDrag(
        (prev) =>
          prev && prev.taskId === data.task.id
            ? {
                ...prev, // Keep previous state like taskId
                position: data.absolute,
                relativePosition: data.relative,
                dimensions: data.dimensions,
                taskInfo: data.task, // Crucially, update taskInfo if it can change (e.g., columnId if that's part of taskInfo)
                isDragging: true, // Ensure isDragging remains true
              }
            : prev // If it's not the task we're tracking, don't change state
      );
    };

    const handleDragEnd = () => {
      setMirroredDrag(null); // Clear mirror data
    };

    // Listen for drag events
    onTaskEvent("task:drag-start", handleDragStart);
    onTaskEvent("task:drag-move", handleDragMove);
    onTaskEvent("task:drag-end", handleDragEnd);

    // Cleanup
    return () => {
      offTaskEvent("task:drag-start", handleDragStart);
      offTaskEvent("task:drag-move", handleDragMove);
      offTaskEvent("task:drag-end", handleDragEnd);
    };
  }, []);

  // Reset new column ID after a delay to avoid keeping columns in edit mode
  useEffect(() => {
    if (newColumnId) {
      const timer = setTimeout(() => {
        setNewColumnId(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [newColumnId]);

  // Extract all unique tags from tasks - memoize this operation
  const extractTags = useCallback(() => {
    if (tasks.length === 0) return [];

    const tagSet = new Set();
    tasks.forEach((task) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Update available tags when tasks change
  useEffect(() => {
    setAvailableTags(extractTags());
  }, [extractTags]);

  // Memoize the filtering and sorting logic
  const filterAndSortTasks = useCallback(() => {
    if (tasks.length === 0) return [];

    let result = [...tasks];

    // Text search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower))
      );
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter((task) =>
        filters.priorities.includes(task.priority)
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(
        (task) =>
          task.tags && filters.tags.some((tag) => task.tags.includes(tag))
      );
    }

    // Overdue filter
    if (showOverdueTasks) {
      const now = new Date();
      result = result.filter(
        (task) =>
          task.dueDate &&
          isAfter(now, parseISO(task.dueDate)) &&
          task.status !== "Done"
      );
    }

    // Sorting
    if (filters.sort) {
      const { field, order } = filters.sort;
      result.sort((a, b) => {
        // Handle empty values
        if (!a[field] && !b[field]) return 0;
        if (!a[field]) return order === "asc" ? 1 : -1;
        if (!b[field]) return order === "asc" ? -1 : 1;

        // Sort by priority
        if (field === "priority") {
          const priorityValues = { High: 3, Medium: 2, Low: 1 };
          const valA = priorityValues[a.priority] || 0;
          const valB = priorityValues[b.priority] || 0;
          return order === "asc" ? valA - valB : valB - valA;
        }

        // Sort by due date
        if (field === "dueDate") {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return order === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }

        // Sort by text fields (title, etc)
        const valA = String(a[field]).toLowerCase();
        const valB = String(b[field]).toLowerCase();
        return order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
    }

    return result;
  }, [tasks, filters, showOverdueTasks]);

  // Update filtered tasks when filters or tasks change
  useEffect(() => {
    setFilteredTasks(filterAndSortTasks());
  }, [filterAndSortTasks]);

  // Memoize column generation to avoid unnecessary recalculations
  const generateColumns = useCallback(() => {
    // Always generate standard columns even if there are no tasks
    const standardColumns = groupTasksByStatus(filteredTasks);

    // Add any custom columns from state if they exist
    const mergedColumns = [...standardColumns];

    // Add custom columns from local storage
    const savedCustomColumns = localStorage.getItem("customColumns");
    if (savedCustomColumns) {
      try {
        const customCols = JSON.parse(savedCustomColumns);

        // Filter tasks for each custom column
        customCols.forEach((col) => {
          col.tasks = filteredTasks.filter((task) => task.status === col.id);
        });

        mergedColumns.push(...customCols);
      } catch (error) {
        console.error("Error parsing custom columns:", error);
      }
    }

    return mergedColumns;
  }, [filteredTasks]);

  // Update columns when filtered tasks change
  useEffect(() => {
    const newColumns = generateColumns();
    setColumns(newColumns);

    // Update custom column count
    const customCols = newColumns.filter((col) => col.custom);
    setCustomColumnCount(customCols.length);
  }, [generateColumns]);

  const handleAddTask = (columnId = null) => {
    setSelectedTask(null);
    setSelectedColumnId(columnId);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setSelectedColumnId(null);
    setIsModalOpen(true);
  };

  // Apply filters from the filter component - use a stable reference
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Toggle overdue tasks display - use a stable reference
  const handleOverdueToggle = useCallback((showOverdue) => {
    setShowOverdueTasks(showOverdue);
  }, []);

  // Handle moving a task to a different column
  const handleMoveTask = useCallback(
    async (taskId, newStatus) => {
      try {
        // Use the mutation hook to update task status
        await moveTaskMutation.mutateAsync({
          id: taskId,
          status: statusMap[newStatus] || newStatus,
        });
      } catch (err) {
        console.error("Error moving task:", err);
      }
    },
    [moveTaskMutation]
  );

  // Handlers for drag operations with WebSocket broadcasting
  const handleTaskDragStart = useCallback((taskId, dragData) => {
    // Emit drag start event
    emitTaskDragStart(dragData);
  }, []);

  const handleTaskDragMove = useCallback((taskId, dragData) => {
    // Emit drag move event
    emitTaskDragMove(dragData);
  }, []);

  const handleTaskDragEnd = useCallback((taskId) => {
    // Emit drag end event
    emitTaskDragEnd({ taskId });
  }, []);

  // Add a new column
  const handleAddColumn = () => {
    const newColumnCount = customColumnCount + 1;
    const newColId = `custom-${Date.now()}`;
    const newColumn = {
      id: newColId,
      title: `New Column`,
      tasks: [],
      custom: true,
    };

    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    setCustomColumnCount(newColumnCount);
    setNewColumnId(newColId);

    // Save custom columns to localStorage
    const customColumns = updatedColumns.filter((col) => col.custom);
    localStorage.setItem("customColumns", JSON.stringify(customColumns));
  };

  // Edit column title
  const handleEditColumn = (columnId, newTitle) => {
    const updatedColumns = columns.map((col) => {
      if (col.id === columnId) {
        return { ...col, title: newTitle };
      }
      return col;
    });

    setColumns(updatedColumns);

    // Update local storage
    const customColumns = updatedColumns.filter((col) => col.custom);
    localStorage.setItem("customColumns", JSON.stringify(customColumns));
  };

  // Delete a column
  const handleDeleteColumn = (columnId) => {
    // Check if it's a standard column
    const isStandardColumn = ["todo", "in-progress", "done"].includes(columnId);
    if (isStandardColumn) {
      console.error("Cannot delete standard columns");
      return;
    }

    const updatedColumns = columns.filter((col) => col.id !== columnId);
    setColumns(updatedColumns);

    // Update local storage
    const customColumns = updatedColumns.filter((col) => col.custom);
    localStorage.setItem("customColumns", JSON.stringify(customColumns));
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/taskboard");
    }
  };

  // Listen for edit task events from TaskCard
  useEffect(() => {
    const handleEditTaskEvent = (event) => {
      handleEditTask(event.detail);
    };

    window.addEventListener("editTask", handleEditTaskEvent);

    return () => {
      window.removeEventListener("editTask", handleEditTaskEvent);
    };
  }, []);

  const handleTaskSubmit = () => {
    // Refresh task list after adding/editing
    // This is handled by the mutation hook
  };

  // Calculate column layout classes based on number of columns and fullscreen mode
  const getColumnLayoutClasses = () => {
    if (!isFullscreen) {
      return "flex gap-4 overflow-x-auto pb-4 h-full";
    }

    const columnCount = columns.length;
    if (columnCount <= 4) {
      // For 4 or fewer columns, distribute them evenly with small gaps
      return "flex gap-3 pb-4 h-full justify-between";
    } else {
      // For more than 4 columns, allow horizontal scrolling
      return "flex gap-3 pb-4 h-full overflow-x-auto";
    }
  };

  // Check for tasks that are overdue - memoize this calculation
  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.dueDate &&
          isAfter(new Date(), parseISO(task.dueDate)) &&
          task.status !== "Done"
      ),
    [tasks]
  );

  // Get statistics for the task board - memoize this calculation
  const taskStats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "Todo").length,
      inProgress: tasks.filter((task) => task.status === "Doing").length,
      done: tasks.filter((task) => task.status === "Done").length,
      overdue: overdueTasks.length,
      highPriority: tasks.filter((task) => task.priority === "High").length,
    }),
    [tasks, overdueTasks]
  );

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
                onClick={() => handleAddTask()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
              <Button
                size="sm"
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                onClick={handleAddColumn}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Column
              </Button>
              <div className="relative ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
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
            onFilter={handleFilterChange}
            availableTags={availableTags}
            onShowOverdue={handleOverdueToggle}
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
                  setFilters({
                    searchText: "",
                    priorities: [],
                    tags: [],
                    sort: null,
                  });
                  setShowOverdueTasks(false);
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
                  onMoveTask={handleMoveTask}
                  onAddTask={handleAddTask}
                  onDeleteColumn={handleDeleteColumn}
                  onEditColumn={handleEditColumn}
                  isNewColumn={column.id === newColumnId}
                  onDragStart={handleTaskDragStart}
                  onDragMove={handleTaskDragMove}
                  onDragEnd={handleTaskDragEnd}
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
        onClose={() => setIsModalOpen(false)}
        initialData={selectedTask}
        selectedColumnId={selectedColumnId}
        onSubmit={handleTaskSubmit}
      />
    </DndProvider>
  );
}

export default TaskBoard;
