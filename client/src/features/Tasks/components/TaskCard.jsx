import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical, AlertTriangle, Clock } from "lucide-react";
import { format, isAfter, parseISO, formatDistanceToNow } from "date-fns";
import { useDrag } from "react-dnd";
import { ItemTypes } from "@/features/Tasks/utils/constants";

// TaskCard component - draggable task item
function TaskCard({
  task,
  columnId,
  getPriorityColor,
  onDragStart,
  onDragMove,
  onDragEnd,
}) {
  const cardRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastPositionRef = useRef(null);
  const taskId = task._id || task.id;

  // Check if task is overdue - memoize to avoid recalculations
  const isOverdue = useMemo(() => {
    if (!task.dueDate) return false;
    try {
      const now = new Date();
      const dueDate = parseISO(task.dueDate);
      return isAfter(now, dueDate) && task.status !== "Done";
    } catch (error) {
      console.error("Error parsing due date:", error);
      return false;
    }
  }, [task.dueDate, task.status]);

  // Get relative time for due date - memoize to avoid recalculations
  const dueTimeString = useMemo(() => {
    if (!task.dueDate) return "";
    try {
      const dueDate = parseISO(task.dueDate);
      const now = new Date();
      if (isAfter(now, dueDate) && task.status !== "Done") {
        return `Overdue by ${formatDistanceToNow(dueDate)}`;
      }
      return `Due ${formatDistanceToNow(dueDate)} from now`;
    } catch (error) {
      console.error("Error formatting due date:", error);
      return "";
    }
  }, [task.dueDate, task.status]);

  // Format due date for display - memoize to avoid recalculations
  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) return "";
    try {
      return format(parseISO(task.dueDate), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting due date:", error);
      return "";
    }
  }, [task.dueDate]);

  // Set up drag source
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.TASK,
    item: (monitor) => {
      // When drag starts, emit the event with initial position and task details
      if (onDragStart && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const boardRect =
          document
            .querySelector(".task-column-content")
            ?.getBoundingClientRect() ||
          document
            .querySelector("#task-board-container")
            ?.getBoundingClientRect();

        // Calculate both absolute and relative positions
        const absolutePosition = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };

        // Calculate relative position (as percentage of board dimensions)
        const relativePosition = boardRect
          ? {
              x: (absolutePosition.x - boardRect.left) / boardRect.width,
              y: (absolutePosition.y - boardRect.top) / boardRect.height,
            }
          : { x: 0.5, y: 0.5 };

        lastPositionRef.current = absolutePosition;

        // Include task details for better mirroring
        onDragStart(taskId, {
          absolute: absolutePosition,
          relative: relativePosition,
          task: {
            id: taskId,
            title: task.title,
            priority: task.priority,
            description: task.description,
            tags: task.tags,
            dueDate: task.dueDate,
            isOverdue: isOverdue,
            dueTimeString: dueTimeString,
            formattedDueDate: formattedDueDate,
            columnId,
          },
          dimensions: {
            width: rect.width,
            height: rect.height,
          },
        });
      }
      return { id: taskId, columnId };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // When drag ends, cancel the animation frame and emit the end event
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (onDragEnd) {
        onDragEnd(taskId);
      }
    },
  });

  // Track position during drag using requestAnimationFrame for smooth updates
  const trackPosition = useCallback(() => {
    if (isDragging && onDragMove && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const boardRect =
        document
          .querySelector(".task-column-content")
          ?.getBoundingClientRect() ||
        document
          .querySelector("#task-board-container")
          ?.getBoundingClientRect();

      const absolutePosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      // Calculate relative position
      const relativePosition = boardRect
        ? {
            x: (absolutePosition.x - boardRect.left) / boardRect.width,
            y: (absolutePosition.y - boardRect.top) / boardRect.height,
          }
        : { x: 0.5, y: 0.5 };

      // Always update position for smooth mirroring
      lastPositionRef.current = absolutePosition;

      // Send all necessary data for accurate mirroring
      onDragMove(taskId, {
        absolute: absolutePosition,
        relative: relativePosition,
        task: {
          id: taskId,
          title: task.title,
          priority: task.priority,
          description: task.description,
          tags: task.tags,
          dueDate: task.dueDate,
          isOverdue: isOverdue,
          dueTimeString: dueTimeString,
          formattedDueDate: formattedDueDate,
          columnId,
        },
        dimensions: {
          width: rect.width,
          height: rect.height,
        },
      });

      // Continue tracking in the next animation frame
      animationFrameRef.current = requestAnimationFrame(trackPosition);
    }
  }, [
    isDragging,
    onDragMove,
    taskId,
    task.title,
    task.priority,
    columnId,
    task.description,
    task.tags,
    task.dueDate,
    isOverdue,
    dueTimeString,
    formattedDueDate,
  ]);

  // Set up position tracking during drag
  useEffect(() => {
    if (isDragging && onDragMove) {
      // Start tracking position with requestAnimationFrame
      animationFrameRef.current = requestAnimationFrame(trackPosition);
    } else if (animationFrameRef.current) {
      // Stop tracking if not dragging
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isDragging, onDragMove, trackPosition]);

  const handleClick = useCallback(() => {
    // Prevent click when dragging
    if (isDragging) return;

    // This function would be passed down from TaskBoard
    // to handle editing the task
    if (typeof window !== "undefined") {
      const event = new CustomEvent("editTask", { detail: task });
      window.dispatchEvent(event);
    }
  }, [isDragging, task]);

  return (
    <div
      ref={(el) => {
        preview(el);
        cardRef.current = el;
      }}
      data-task-id={taskId}
      data-column-id={columnId}
      className={`
        bg-card 
        rounded-md 
        p-3 
        shadow-sm 
        border 
        ${isOverdue ? "border-red-300 dark:border-red-800" : "border-border"}
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
          className={`${getPriorityColor(task.priority)} flex-shrink-0 whitespace-nowrap flex items-center gap-1`}
        >
          {task.priority === "High" && <AlertTriangle className="w-3 h-3" />}
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
            <Badge
              key={tag}
              variant="outline"
              className="text-xs truncate max-w-[100px]"
            >
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
        <div
          className={`flex items-center mt-2 text-xs ml-6 ${
            isOverdue
              ? "text-red-500 dark:text-red-400 font-medium"
              : "text-muted-foreground"
          }`}
        >
          {isOverdue ? (
            <>
              <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
              {dueTimeString}
            </>
          ) : (
            <>
              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
              {formattedDueDate}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(TaskCard);
