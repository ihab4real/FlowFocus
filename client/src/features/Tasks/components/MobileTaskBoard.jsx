import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, MoreVertical } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAfter, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import TaskModal from "@/features/Tasks/components/TaskModal";
import TaskFilters from "@/features/Tasks/components/TaskFilters";
import MobileTaskCard from "./MobileTaskCard";
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
import { onTaskEvent, offTaskEvent } from "@/services/socketService";
import { useQueryClient } from "@tanstack/react-query";

function MobileTaskBoard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [activeTab, setActiveTab] = useState("todo");
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [isTabletSize, setIsTabletSize] = useState(false);
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

  // Detect tablet size for UI adaptations
  useEffect(() => {
    const checkTabletSize = () => {
      const width = window.innerWidth;
      setIsTabletSize(width >= 640 && width < 1024); // sm to lg breakpoint
    };

    checkTabletSize();
    window.addEventListener("resize", checkTabletSize);

    return () => window.removeEventListener("resize", checkTabletSize);
  }, []);

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

    // Text search filter
    if (filters.searchText || searchText) {
      const searchLower = (filters.searchText || searchText).toLowerCase();
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

  const handleAddTask = (columnId = null) => {
    setSelectedTask(null);
    setSelectedColumnId(columnId || activeTab);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setSelectedColumnId(null);
    setIsModalOpen(true);
  };

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

  const handleTaskSubmit = () => {
    // Handled by mutation hook
  };

  // Calculate task counts
  const taskCounts = useMemo(
    () => ({
      todo: groupedTasks.todo.length,
      "in-progress": groupedTasks["in-progress"].length,
      done: groupedTasks.done.length,
    }),
    [groupedTasks]
  );

  const getTabLabel = (status, count) => (
    <div className="flex items-center gap-2">
      <span className="capitalize">
        {status === "in-progress" ? "In Progress" : status}
      </span>
      <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
        {count}
      </span>
    </div>
  );

  return (
    <Card
      className={`shadow-sm ${isFullscreen ? "h-screen rounded-none border-0" : "h-full"}`}
    >
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
                <DropdownMenuItem onClick={() => handleAddTask()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </DropdownMenuItem>
                {isTabletSize && (
                  <DropdownMenuItem onClick={() => handleAddTask()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Quick Add
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/taskboard")}
                >
                  View Full Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isTabletSize ? "Search tasks..." : "Search..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`pl-10 ${isTabletSize ? "h-10" : ""}`}
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <TaskFilters
            onFilter={handleFilterChange}
            availableTags={availableTags}
            onShowOverdue={handleOverdueToggle}
          />
        )}
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
            <p className="text-muted-foreground text-center mb-2">
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
                setSearchText("");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          /* Main content */
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <TabsList
              className={`grid w-full grid-cols-3 rounded-none border-b ${isTabletSize ? "h-12" : ""}`}
            >
              <TabsTrigger
                value="todo"
                className={`${isTabletSize ? "text-sm" : "text-xs"}`}
              >
                {getTabLabel("todo", taskCounts.todo)}
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className={`${isTabletSize ? "text-sm" : "text-xs"}`}
              >
                {getTabLabel("in-progress", taskCounts["in-progress"])}
              </TabsTrigger>
              <TabsTrigger
                value="done"
                className={`${isTabletSize ? "text-sm" : "text-xs"}`}
              >
                {getTabLabel("done", taskCounts.done)}
              </TabsTrigger>
            </TabsList>

            {Object.entries(groupedTasks).map(([status, tasks]) => (
              <TabsContent key={status} value={status} className="m-0 h-full">
                <div
                  className={`${isTabletSize ? "p-6" : "p-4"} space-y-3 h-full overflow-y-auto`}
                >
                  {tasks.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center ${isTabletSize ? "h-40" : "h-32"} text-center`}
                    >
                      <p
                        className={`text-muted-foreground ${isTabletSize ? "text-base" : "text-sm"} mb-2`}
                      >
                        No tasks in{" "}
                        {status === "in-progress" ? "progress" : status}
                      </p>
                      <Button
                        size={isTabletSize ? "default" : "sm"}
                        variant="outline"
                        onClick={() => handleAddTask(status)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  ) : (
                    <>
                      {isTabletSize ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {tasks.map((task) => (
                            <MobileTaskCard
                              key={task._id || task.id}
                              task={task}
                              columnId={status}
                              getPriorityColor={getPriorityColor}
                              onEdit={handleEditTask}
                              onMove={handleMoveTask}
                              availableStatuses={[
                                "todo",
                                "in-progress",
                                "done",
                              ]}
                            />
                          ))}
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <MobileTaskCard
                            key={task._id || task.id}
                            task={task}
                            columnId={status}
                            getPriorityColor={getPriorityColor}
                            onEdit={handleEditTask}
                            onMove={handleMoveTask}
                            availableStatuses={["todo", "in-progress", "done"]}
                          />
                        ))
                      )}
                      <Button
                        variant="ghost"
                        size={isTabletSize ? "default" : "sm"}
                        onClick={() => handleAddTask(status)}
                        className={`w-full border-2 border-dashed border-muted-foreground/25 ${isTabletSize ? "h-14" : "h-12"}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedTask}
        selectedColumnId={selectedColumnId}
        onSubmit={handleTaskSubmit}
      />
    </Card>
  );
}

export default MobileTaskBoard;
