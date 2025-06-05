import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAfter, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  getPriorityColor,
  groupTasksByStatus,
  statusMap,
} from "@/features/Tasks/utils/taskUtils";
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

export function useTaskBoard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [customColumnCount, setCustomColumnCount] = useState(0);
  const [newColumnId, setNewColumnId] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [mirroredDrag, setMirroredDrag] = useState(null);
  const [filters, setFilters] = useState({
    searchText: "",
    priorities: [],
    tags: [],
    sort: null,
  });
  const [showOverdueTasks, setShowOverdueTasks] = useState(false);
  const [searchText, setSearchText] = useState(""); // For mobile search
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
    const handleTaskUpdated = (taskId) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(taskId),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    };

    onTaskEvent("task:updated", handleTaskUpdated);

    return () => {
      offTaskEvent("task:updated", handleTaskUpdated);
    };
  }, [queryClient]);

  // Setup WebSocket listeners for drag mirroring
  useEffect(() => {
    const handleDragStart = (data) => {
      setMirroredDrag({
        taskId: data.task.id,
        position: data.absolute,
        relativePosition: data.relative,
        dimensions: data.dimensions,
        taskInfo: data.task,
        isDragging: true,
      });
    };

    const handleDragMove = (data) => {
      setMirroredDrag((prev) =>
        prev && prev.taskId === data.task.id
          ? {
              ...prev,
              position: data.absolute,
              relativePosition: data.relative,
              dimensions: data.dimensions,
              taskInfo: data.task,
              isDragging: true,
            }
          : prev
      );
    };

    const handleDragEnd = () => {
      setMirroredDrag(null);
    };

    onTaskEvent("task:drag-start", handleDragStart);
    onTaskEvent("task:drag-move", handleDragMove);
    onTaskEvent("task:drag-end", handleDragEnd);

    return () => {
      offTaskEvent("task:drag-start", handleDragStart);
      offTaskEvent("task:drag-move", handleDragMove);
      offTaskEvent("task:drag-end", handleDragEnd);
    };
  }, []);

  // Reset new column ID after a delay
  useEffect(() => {
    if (newColumnId) {
      const timer = setTimeout(() => {
        setNewColumnId(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [newColumnId]);

  // Extract all unique tags from tasks
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

  // Filter and sort tasks
  const filterAndSortTasks = useCallback(() => {
    if (tasks.length === 0) return [];

    let result = [...tasks];

    // Text search filter (supporting both filter object and direct search)
    const searchQuery = filters.searchText || searchText;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
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
        if (!a[field] && !b[field]) return 0;
        if (!a[field]) return order === "asc" ? 1 : -1;
        if (!b[field]) return order === "asc" ? -1 : 1;

        if (field === "priority") {
          const priorityValues = { High: 3, Medium: 2, Low: 1 };
          const valA = priorityValues[a.priority] || 0;
          const valB = priorityValues[b.priority] || 0;
          return order === "asc" ? valA - valB : valB - valA;
        }

        if (field === "dueDate") {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return order === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }

        const valA = String(a[field]).toLowerCase();
        const valB = String(b[field]).toLowerCase();
        return order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
    }

    return result;
  }, [tasks, filters, showOverdueTasks, searchText]);

  // Update filtered tasks when filters or tasks change
  useEffect(() => {
    setFilteredTasks(filterAndSortTasks());
  }, [filterAndSortTasks]);

  // Generate columns with custom column support
  const generateColumns = useCallback(() => {
    const standardColumns = groupTasksByStatus(filteredTasks);
    const mergedColumns = [...standardColumns];

    const savedCustomColumns = localStorage.getItem("customColumns");
    if (savedCustomColumns) {
      try {
        const customCols = JSON.parse(savedCustomColumns);
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

    const customCols = newColumns.filter((col) => col.custom);
    setCustomColumnCount(customCols.length);
  }, [generateColumns]);

  // Group tasks by status for mobile tabs
  const groupedTasks = useMemo(() => {
    const grouped = groupTasksByStatus(filteredTasks);
    return {
      todo: grouped.find((col) => col.id === "todo")?.tasks || [],
      "in-progress":
        grouped.find((col) => col.id === "in-progress")?.tasks || [],
      done: grouped.find((col) => col.id === "done")?.tasks || [],
    };
  }, [filteredTasks]);

  // Calculate task counts
  const taskCounts = useMemo(
    () => ({
      todo: groupedTasks.todo.length,
      "in-progress": groupedTasks["in-progress"].length,
      done: groupedTasks.done.length,
    }),
    [groupedTasks]
  );

  // Check for overdue tasks
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

  // Get task statistics
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

  // Event handlers
  const handleAddTask = useCallback((columnId = null) => {
    setSelectedTask(null);
    setSelectedColumnId(columnId);
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task) => {
    setSelectedTask(task);
    setSelectedColumnId(null);
    setIsModalOpen(true);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleOverdueToggle = useCallback((showOverdue) => {
    setShowOverdueTasks(showOverdue);
  }, []);

  const handleMoveTask = useCallback(
    async (taskId, newStatus) => {
      try {
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

  const handleTaskDragStart = useCallback((taskId, dragData) => {
    emitTaskDragStart(dragData);
  }, []);

  const handleTaskDragMove = useCallback((taskId, dragData) => {
    emitTaskDragMove(dragData);
  }, []);

  const handleTaskDragEnd = useCallback((taskId) => {
    emitTaskDragEnd({ taskId });
  }, []);

  const handleAddColumn = useCallback(() => {
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

    const customColumns = updatedColumns.filter((col) => col.custom);
    localStorage.setItem("customColumns", JSON.stringify(customColumns));
  }, [customColumnCount, columns]);

  const handleEditColumn = useCallback((columnId, newTitle) => {
    setColumns((prevColumns) => {
      const updatedColumns = prevColumns.map((col) => {
        if (col.id === columnId) {
          return { ...col, title: newTitle };
        }
        return col;
      });

      const customColumns = updatedColumns.filter((col) => col.custom);
      localStorage.setItem("customColumns", JSON.stringify(customColumns));

      return updatedColumns;
    });
  }, []);

  const handleDeleteColumn = useCallback((columnId) => {
    const isStandardColumn = ["todo", "in-progress", "done"].includes(columnId);
    if (isStandardColumn) {
      console.error("Cannot delete standard columns");
      return;
    }

    setColumns((prevColumns) => {
      const updatedColumns = prevColumns.filter((col) => col.id !== columnId);
      const customColumns = updatedColumns.filter((col) => col.custom);
      localStorage.setItem("customColumns", JSON.stringify(customColumns));
      return updatedColumns;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/taskboard");
    }
  }, [isFullscreen, navigate]);

  const handleTaskSubmit = useCallback(() => {
    // Handled by mutation hook
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Calculate column layout classes for desktop
  const getColumnLayoutClasses = useCallback(() => {
    if (!isFullscreen) {
      return "flex gap-4 overflow-x-auto pb-4 h-full";
    }

    const columnCount = columns.length;
    if (columnCount <= 4) {
      return "flex gap-3 pb-4 h-full justify-between";
    } else {
      return "flex gap-3 pb-4 h-full overflow-x-auto";
    }
  }, [isFullscreen, columns.length]);

  return {
    // State
    tasks,
    filteredTasks,
    columns,
    groupedTasks,
    taskCounts,
    taskStats,
    overdueTasks,
    availableTags,
    isLoading,
    tasksError,
    isFullscreen,
    newColumnId,
    mirroredDrag,
    searchText,
    setSearchText,
    filters,
    showOverdueTasks,

    // Modal state
    isModalOpen,
    selectedTask,
    selectedColumnId,

    // Handlers
    handleAddTask,
    handleEditTask,
    handleMoveTask,
    handleFilterChange,
    handleOverdueToggle,
    handleTaskDragStart,
    handleTaskDragMove,
    handleTaskDragEnd,
    handleAddColumn,
    handleEditColumn,
    handleDeleteColumn,
    toggleFullscreen,
    handleTaskSubmit,
    handleCloseModal,
    getColumnLayoutClasses,

    // Utilities
    getPriorityColor,
  };
}
