import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../constants";

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

  const handleClick = () => {
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
      className={`
        bg-card 
        rounded-md 
        p-3 
        shadow-sm 
        border 
        border-border 
        hover:border-[#6C63FF]/30 
        hover:shadow-md
        transition-all
        duration-200
        cursor-pointer 
        w-full
        ${isDragging ? "opacity-50 scale-95" : "opacity-100"}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div ref={drag} className="cursor-grab mt-1 flex-shrink-0">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <h4 className="font-medium truncate">{task.title}</h4>
        </div>
        <Badge 
          variant="secondary" 
          className={`${getPriorityColor(task.priority)} flex-shrink-0 whitespace-nowrap`}
        >
          {task.priority}
        </Badge>
      </div>
      {task.description && (
        <p className="text-sm text-muted-foreground mt-1 ml-6 line-clamp-2">
          {task.description}
        </p>
      )}
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap ml-6">
          {task.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs truncate max-w-[100px]">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
      {task.dueDate && (
        <div className="flex items-center mt-2 text-xs text-muted-foreground ml-6">
          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
          {format(new Date(task.dueDate), "MMM d, yyyy")}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
