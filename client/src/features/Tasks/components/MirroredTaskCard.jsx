import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, Clock } from "lucide-react";

function MirroredTaskCard({ mirroredDragData, getPriorityColor }) {
  if (
    !mirroredDragData ||
    !mirroredDragData.isDragging ||
    !mirroredDragData.taskInfo
  ) {
    return null;
  }

  const {
    relativePosition,
    dimensions,
    taskInfo,
    position: absolutePosition, // Fallback position
  } = mirroredDragData;

  const displayTask = taskInfo;

  let calculatedLeft = 0;
  let calculatedTop = 0;
  let finalLeft = 0;
  let finalTop = 0;

  const mirrorWidth = dimensions?.width || 240;
  // Adjust height based on content that will be shown
  let mirrorHeight = 50; // Base height for title + priority
  if (displayTask.description) mirrorHeight += 20; // Approx height for description line
  if (displayTask.tags && displayTask.tags.length > 0) mirrorHeight += 25; // Approx height for tags
  if (displayTask.dueDate) mirrorHeight += 20; // Approx height for due date
  mirrorHeight += 15; // For the "Being moved..." text
  mirrorHeight = Math.max(dimensions?.height || 80, mirrorHeight); // Ensure it's at least original height or a min

  const boardContainerElement = document.querySelector("#task-board-container");

  if (relativePosition && boardContainerElement) {
    const boardRect = boardContainerElement.getBoundingClientRect();
    const targetCenterX = boardRect.left + relativePosition.x * boardRect.width;
    const targetCenterY = boardRect.top + relativePosition.y * boardRect.height;
    calculatedLeft = targetCenterX - mirrorWidth / 2;
    calculatedTop = targetCenterY - mirrorHeight / 2;
    finalLeft = Math.max(
      boardRect.left,
      Math.min(calculatedLeft, boardRect.right - mirrorWidth)
    );
    finalTop = Math.max(
      boardRect.top,
      Math.min(calculatedTop, boardRect.bottom - mirrorHeight)
    );
  } else if (absolutePosition) {
    const targetCenterX = absolutePosition.x;
    const targetCenterY = absolutePosition.y;
    calculatedLeft = targetCenterX - mirrorWidth / 2;
    calculatedTop = targetCenterY - mirrorHeight / 2;
    finalLeft = Math.max(
      0,
      Math.min(calculatedLeft, window.innerWidth - mirrorWidth)
    );
    finalTop = Math.max(
      0,
      Math.min(calculatedTop, window.innerHeight - mirrorHeight)
    );
  } else {
    // Cannot determine position, don't render
    return null;
  }

  const positionStyle = {
    left: `${finalLeft}px`,
    top: `${finalTop}px`,
    width: `${mirrorWidth}px`,
    height: `${mirrorHeight}px`,
    opacity: 0.85, // Slightly more opaque
  };

  const priorityStyle = getPriorityColor(displayTask.priority);
  const { isOverdue, dueTimeString, formattedDueDate } = displayTask;

  return (
    <div
      className="fixed pointer-events-none bg-card shadow-xl rounded-md border border-[#6C63FF]/50 p-3 z-50 flex flex-col gap-1.5 text-sm"
      style={positionStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold truncate">{displayTask.title}</h4>
        <Badge
          variant="secondary"
          className={`${priorityStyle} flex-shrink-0 whitespace-nowrap flex items-center gap-1 text-xs`}
        >
          {displayTask.priority === "High" && (
            <AlertTriangle className="w-3 h-3" />
          )}
          {displayTask.priority}
        </Badge>
      </div>
      {displayTask.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {displayTask.description}
        </p>
      )}
      {displayTask.tags && displayTask.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {displayTask.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs truncate max-w-[70px]"
            >
              {tag}
            </Badge>
          ))}
          {displayTask.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{displayTask.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
      {displayTask.dueDate && (formattedDueDate || dueTimeString) && (
        <div
          className={`flex items-center text-xs font-medium ${
            isOverdue
              ? "text-red-500 dark:text-red-400"
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
              {formattedDueDate || dueTimeString}
            </>
          )}
        </div>
      )}
      <p className="text-xs text-blue-500 dark:text-blue-400 mt-auto pt-1">
        Being moved in another window...
      </p>
    </div>
  );
}

export default React.memo(MirroredTaskCard);
