import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Maximize2, Minimize2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskModal from "./components/TaskModal";
import taskService from "@/services/api/taskService";
import TaskColumn from "./components/TaskColumn";
import { getPriorityColor, groupTasksByStatus, statusMap } from "./taskUtils";
import { useNavigate, useLocation } from "react-router-dom";

function TaskBoard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [customColumnCount, setCustomColumnCount] = useState(0);
  const [newColumnId, setNewColumnId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in fullscreen mode
  const isFullscreen = location.pathname === "/dashboard/taskboard";

  // Reset new column ID after a delay to avoid keeping columns in edit mode
  useEffect(() => {
    if (newColumnId) {
      const timer = setTimeout(() => {
        setNewColumnId(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [newColumnId]);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await taskService.getTasks();
      const tasks = response.data;
      
      // Get standard columns 
      const standardColumns = groupTasksByStatus(tasks);
      
      // Add any custom columns from state if they exist
      const mergedColumns = [...standardColumns];
      
      // Add custom columns from local storage or state
      const savedCustomColumns = localStorage.getItem('customColumns');
      if (savedCustomColumns) {
        const customCols = JSON.parse(savedCustomColumns);
        mergedColumns.push(...customCols);
        setCustomColumnCount(customCols.length);
      }
      
      setColumns(mergedColumns);
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

  // Add a new column
  const handleAddColumn = () => {
    const newColumnCount = customColumnCount + 1;
    const newColId = `custom-${Date.now()}`;
    const newColumn = {
      id: newColId,
      title: `New Column`,
      tasks: [],
      custom: true
    };
    
    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    setCustomColumnCount(newColumnCount);
    setNewColumnId(newColId);
    
    // Save custom columns to localStorage
    const customColumns = updatedColumns.filter(col => col.custom);
    localStorage.setItem('customColumns', JSON.stringify(customColumns));
  };

  // Edit column title
  const handleEditColumn = (columnId, newTitle) => {
    const updatedColumns = columns.map(col => {
      if (col.id === columnId) {
        return { ...col, title: newTitle };
      }
      return col;
    });
    
    setColumns(updatedColumns);
    
    // Update local storage
    const customColumns = updatedColumns.filter(col => col.custom);
    localStorage.setItem('customColumns', JSON.stringify(customColumns));
  };

  // Delete a column
  const handleDeleteColumn = (columnId) => {
    // Check if it's a standard column
    const isStandardColumn = ['todo', 'in-progress', 'done'].includes(columnId);
    if (isStandardColumn) {
      setError("Cannot delete standard columns");
      return;
    }
    
    const updatedColumns = columns.filter(col => col.id !== columnId);
    setColumns(updatedColumns);
    
    // Update local storage
    const customColumns = updatedColumns.filter(col => col.custom);
    localStorage.setItem('customColumns', JSON.stringify(customColumns));
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
    fetchTasks();
  };

  // Handle moving a task to a different column
  const handleMoveTask = useCallback(
    async (taskId, newStatus) => {
      try {
        // Call API to update task status
        await taskService.moveTask(taskId, statusMap[newStatus] || newStatus);
        // Refresh tasks after moving
        fetchTasks();
      } catch (err) {
        console.error("Error moving task:", err);
        setError("Failed to move task. Please try again.");
      }
    },
    [fetchTasks]
  );

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

  return (
    <DndProvider backend={HTML5Backend}>
      <Card 
        className={`
          shadow-sm
          ${isFullscreen ? "h-screen rounded-none border-0" : "h-full"}
          transition-all duration-500 ease-in-out
        `}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
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
                  ${isFullscreen ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : ''}
                `}
                title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
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
        </CardHeader>
        <CardContent className={`p-4 ${isFullscreen ? "h-[calc(100vh-5rem)] overflow-hidden" : ""}`}>
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
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedColumnId(null);
        }}
        initialData={selectedTask}
        selectedColumnId={selectedColumnId}
        onSubmit={handleTaskSubmit}
      />
    </DndProvider>
  );
}

export default TaskBoard;
