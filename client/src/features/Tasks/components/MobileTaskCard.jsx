import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  AlertTriangle,
  Clock,
  MoreVertical,
  Edit,
  ArrowRight,
} from "lucide-react";
import { format, isAfter, parseISO, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function MobileTaskCard({
  task,
  columnId,
  getPriorityColor,
  onEdit,
  onMove,
  availableStatuses = ["todo", "in-progress", "done"],
}) {
  const taskId = task._id || task.id;

  // Check if task is overdue
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

  // Get relative time for due date
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

  // Format due date for display
  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) return "";
    try {
      return format(parseISO(task.dueDate), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting due date:", error);
      return "";
    }
  }, [task.dueDate]);

  const handleMoveTask = (newStatus) => {
    if (onMove && newStatus !== columnId) {
      onMove(taskId, newStatus);
    }
  };

  const handleEditTask = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "todo":
        return "⏳";
      case "in-progress":
        return "🔄";
      case "done":
        return "✅";
      default:
        return "📝";
    }
  };

  // Filter out current status from available moves
  const availableMoves = availableStatuses.filter(
    (status) => status !== columnId
  );

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        "active:scale-[0.98] active:shadow-sm",
        isOverdue &&
          "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight line-clamp-2 mb-1">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-2 flex-shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleEditTask}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </DropdownMenuItem>

            {availableMoves.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    {availableMoves.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleMoveTask(status)}
                      >
                        <span className="mr-2">{getStatusIcon(status)}</span>
                        {getStatusDisplayName(status)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Priority Badge */}
      {task.priority && (
        <div className="mb-3">
          <Badge
            variant="outline"
            className={cn("text-xs", getPriorityColor(task.priority))}
          >
            {task.priority}
          </Badge>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-0.5"
            >
              {tag}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div
          className={cn(
            "flex items-center text-xs gap-2 p-2 rounded-md",
            isOverdue
              ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
              : "text-muted-foreground bg-muted/50"
          )}
        >
          {isOverdue ? (
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          ) : (
            <Calendar className="h-3 w-3 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate">{formattedDueDate}</div>
            {dueTimeString && (
              <div className="truncate text-xs opacity-75">{dueTimeString}</div>
            )}
          </div>
        </div>
      )}

      {/* Created/Updated Time */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {task.updatedAt
                ? `Updated ${formatDistanceToNow(parseISO(task.updatedAt))} ago`
                : task.createdAt
                  ? `Created ${formatDistanceToNow(parseISO(task.createdAt))} ago`
                  : ""}
            </span>
          </div>

          {/* Current Status Indicator */}
          <div className="flex items-center gap-1">
            <span>{getStatusIcon(columnId)}</span>
            <span className="text-xs font-medium">
              {getStatusDisplayName(columnId)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileTaskCard;
