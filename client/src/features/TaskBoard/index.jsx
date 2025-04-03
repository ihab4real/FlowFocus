import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskModal from "./components/TaskModal";
import taskService from "@/services/api/taskService";
import TaskColumn from "./components/TaskColumn";
import { getPriorityColor, groupTasksByStatus, statusMap } from "./taskUtils";

function TaskBoard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await taskService.getTasks();
      const tasks = response.data;
      setColumns(groupTasksByStatus(tasks));
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const handleTaskSubmit = () => {
    // Refresh task list after adding/editing
    fetchTasks();
  };

  // Handle moving a task to a different column
  const handleMoveTask = useCallback(
    async (taskId, newStatus) => {
      try {
        // Call API to update task status
        await taskService.moveTask(taskId, statusMap[newStatus]);
        // Refresh tasks after moving
        fetchTasks();
      } catch (err) {
        console.error("Error moving task:", err);
        setError("Failed to move task. Please try again.");
      }
    },
    [fetchTasks]
  );

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

export default TaskBoard;
