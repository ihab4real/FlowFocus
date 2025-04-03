import React from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import { useDrop } from "react-dnd";
import TaskCard from "./TaskCard";
import { ItemTypes } from "../constants";
import { useLocation } from "react-router-dom";

// TaskColumn component - serves as a drop target for tasks
function TaskColumn({ id, title, tasks, getPriorityColor, onMoveTask }) {
  const location = useLocation();
  const isFullscreen = location.pathname === "/dashboard/taskboard";

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
      className={`
        flex-shrink-0 
        w-72 
        rounded-lg 
        p-2 
        flex 
        flex-col 
        ${isOver ? "bg-[#6C63FF]/10" : "bg-muted"}
        transition-colors duration-200 
        ${isFullscreen ? "h-full flex-1 max-w-[350px] min-w-[280px]" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF]">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF]">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
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
    </div>
  );
}

export default TaskColumn;
