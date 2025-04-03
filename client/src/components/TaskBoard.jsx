import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Pencil,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import TaskModal from "@/components/TaskModal";
import taskService from "@/services/api/taskService";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Define item types for drag and drop
const ItemTypes = {
  TASK: "task",
};

export function TaskBoard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([
    {
      id: "todo",
      title: "To Do",
      tasks: [
        {
          id: "task-1",
          title: "Research MongoDB schemas",
          description: "Plan data structure for the app",
          priority: "high",
          dueDate: "2024-02-10T00:00:00Z",
          tags: ["backend", "database"],
        },
        {
          id: "task-2",
          title: "Set up authentication",
          description: "Implement JWT auth flow",
          priority: "medium",
          dueDate: "2024-02-15T00:00:00Z",
          tags: ["backend", "security"],
        },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        {
          id: "task-3",
          title: "Design dashboard UI",
          description: "Create wireframes in Figma",
          priority: "medium",
          dueDate: "2024-02-08T00:00:00Z",
          tags: ["design", "frontend"],
        },
      ],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        {
          id: "task-4",
          title: "Project setup",
          description: "Initialize MERN stack project",
          priority: "high",
          dueDate: "2024-02-01T00:00:00Z",
          tags: ["setup"],
        },
      ],
    },
  ]);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await taskService.getTasks();
        const tasks = response.data;

        // Group tasks by status
        const todoTasks = tasks.filter((task) => task.status === "Todo");
        const doingTasks = tasks.filter((task) => task.status === "Doing");
        const doneTasks = tasks.filter((task) => task.status === "Done");

        setColumns([
          {
            id: "todo",
            title: "To Do",
            tasks: todoTasks,
          },
          {
            id: "in-progress",
            title: "In Progress",
            tasks: doingTasks,
          },
          {
            id: "done",
            title: "Done",
            tasks: doneTasks,
          },
        ]);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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

  const handleTaskSubmit = (taskData) => {
    // Refresh task list after adding/editing
    const fetchTasks = async () => {
      try {
        const response = await taskService.getTasks();
        const tasks = response.data;

        // Group tasks by status
        const todoTasks = tasks.filter((task) => task.status === "Todo");
        const doingTasks = tasks.filter((task) => task.status === "Doing");
        const doneTasks = tasks.filter((task) => task.status === "Done");

        setColumns([
          {
            id: "todo",
            title: "To Do",
            tasks: todoTasks,
          },
          {
            id: "in-progress",
            title: "In Progress",
            tasks: doingTasks,
          },
          {
            id: "done",
            title: "Done",
            tasks: doneTasks,
          },
        ]);
      } catch (err) {
        console.error("Error refreshing tasks:", err);
      }
    };

    fetchTasks();
  };

  const getPriorityColor = (priority) => {
    // Convert priority to lowercase for case-insensitive comparison
    const lowerPriority = priority.toLowerCase();
    switch (lowerPriority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Handle moving a task to a different column
  const handleMoveTask = useCallback(async (taskId, newStatus) => {
    try {
      // Map column id to task status
      const statusMap = {
        todo: "Todo",
        "in-progress": "Doing",
        done: "Done",
      };

      // Call API to update task status
      await taskService.moveTask(taskId, statusMap[newStatus]);

      // Refresh tasks after moving
      const response = await taskService.getTasks();
      const tasks = response.data;

      // Group tasks by status
      const todoTasks = tasks.filter((task) => task.status === "Todo");
      const doingTasks = tasks.filter((task) => task.status === "Doing");
      const doneTasks = tasks.filter((task) => task.status === "Done");

      setColumns([
        {
          id: "todo",
          title: "To Do",
          tasks: todoTasks,
        },
        {
          id: "in-progress",
          title: "In Progress",
          tasks: doingTasks,
        },
        {
          id: "done",
          title: "Done",
          tasks: doneTasks,
        },
      ]);
    } catch (err) {
      console.error("Error moving task:", err);
      setError("Failed to move task. Please try again.");
    }
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="h-full shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Task Board</CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
              onClick={handleAddTask}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
            <Button size="sm" className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
              <Plus className="w-4 h-4 mr-1" />
              Add Column
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column) => (
                <TaskColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={column.tasks}
                  getPriorityColor={getPriorityColor}
                  onAddTask={handleAddTask}
                  onMoveTask={handleMoveTask}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </DndProvider>
  );
}

// TaskColumn component - serves as a drop target for tasks
function TaskColumn({ id, title, tasks, getPriorityColor, onMoveTask }) {
  // Set up drop target
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item) => {
      // Only move if the column is different
      if (item.columnId !== id) {
        onMoveTask(item.id, id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 w-72 rounded-lg p-2 ${
        isOver ? "bg-[#6C63FF]/10" : "bg-muted"
      } transition-colors duration-200`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 min-h-[100px]">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task._id || task.id}
              task={task}
              columnId={id}
              getPriorityColor={getPriorityColor}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-sm border border-dashed border-muted-foreground/30 rounded-md p-4">
            <p>No tasks yet</p>
            <p>Tasks will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// TaskCard component - draggable task item
function TaskCard({ task, columnId, getPriorityColor }) {
  // Set up drag source
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.TASK,
    item: { id: task._id || task.id, columnId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const handleClick = (e) => {
    // Prevent click when dragging
    if (isDragging) return;

    // This function would be passed down from TaskBoard
    // to handle editing the task
    if (typeof window !== "undefined") {
      const event = new CustomEvent("editTask", { detail: task });
      window.dispatchEvent(event);
    }
  };

  return (
    <div
      ref={preview}
      className={`bg-card rounded-md p-3 shadow-sm border border-border hover:border-[#6C63FF]/30 transition-colors cursor-pointer ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div ref={drag} className="cursor-grab mt-1">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <h4 className="font-medium">{task.title}</h4>
        </div>
        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-1 ml-6">
        {task.description}
      </p>
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap ml-6">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {task.dueDate && (
        <div className="flex items-center mt-2 text-xs text-muted-foreground ml-6">
          <Calendar className="w-3 h-3 mr-1" />
          {format(new Date(task.dueDate), "MMM d, yyyy")}
        </div>
      )}
    </div>
  );
}
