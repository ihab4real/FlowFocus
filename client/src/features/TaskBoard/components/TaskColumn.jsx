import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { useDrop } from "react-dnd";
import TaskCard from "./TaskCard";
import { ItemTypes } from "../constants";
import { useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

// TaskColumn component - serves as a drop target for tasks
function TaskColumn({
  id,
  title,
  tasks,
  getPriorityColor,
  onMoveTask,
  onAddTask,
  onDeleteColumn,
  onEditColumn,
  isNewColumn,
}) {
  const location = useLocation();
  const isFullscreen = location.pathname === "/dashboard/taskboard";
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const titleInputRef = useRef(null);

  // Auto-focus and enter edit mode for new columns
  useEffect(() => {
    if (isNewColumn) {
      setIsEditing(true);
      // Focus the input field after mounting
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }
      }, 100);
    }
  }, [isNewColumn]);

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

  const handleAddTaskInColumn = () => {
    if (onAddTask) {
      onAddTask(id);
    }
  };

  const handleDeleteColumn = () => {
    if (onDeleteColumn) {
      onDeleteColumn(id);
    }
    setShowDeleteAlert(false);
  };

  const handleEditColumn = () => {
    setIsEditing(true);
    // Focus the input field after a brief delay to ensure the DOM is updated
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 50);
  };

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (editedTitle.trim() !== "" && onEditColumn) {
      onEditColumn(id, editedTitle);
    } else {
      setEditedTitle(title); // Reset if empty
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (editedTitle.trim() !== "" && onEditColumn) {
        onEditColumn(id, editedTitle);
      } else {
        setEditedTitle(title); // Reset if empty
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setEditedTitle(title); // Reset on escape
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={drop}
      className={`
        flex-shrink-0 
        rounded-lg 
        p-2 
        flex 
        flex-col 
        ${isOver ? "bg-[#6C63FF]/10" : "bg-muted"}
        transition-colors duration-200 
        ${isFullscreen ? "h-full flex-1 min-w-[280px]" : "w-72"}
        border border-border
        relative
        overflow-hidden
      `}
    >
      <div className="flex items-center justify-between mb-2">
        {isEditing ? (
          <Input
            ref={titleInputRef}
            value={editedTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="font-medium h-8 py-1"
            placeholder="Column name"
            autoFocus
          />
        ) : (
          <h3 className="font-medium">{title}</h3>
        )}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF]"
            onClick={handleAddTaskInColumn}
          >
            <Plus className="h-4 w-4" />
          </Button>
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditColumn}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Column Name
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteAlert(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div
        className={`
          task-column-content
          space-y-2 
          min-h-[100px] 
          overflow-y-auto 
          ${isFullscreen ? "flex-1 pr-2" : "max-h-[60vh]"}
        `}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style jsx global>{`
          .task-column-content::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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

      {/* Bottom edge area with border */}
      <div className="h-4 mt-2 flex-shrink-0 border-t border-border/50 pt-2"></div>

      {/* Delete column alert dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the column and all tasks within it. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TaskColumn;
