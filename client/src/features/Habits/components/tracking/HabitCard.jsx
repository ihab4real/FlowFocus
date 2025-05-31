import React, { useState } from "react";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { HABIT_CATEGORIES } from "../../constants/habitConstants";
import {
  calculateProgress,
  formatProgress,
  hexToRgba,
} from "../../utils/habitUtils";
import ProgressRing from "../ui/ProgressRing";

const HabitCard = ({
  habit,
  entry,
  onToggleComplete,
  onUpdateProgress,
  onEdit,
  onDelete,
  isToday = true,
  showActions = true,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const progress = calculateProgress(habit, entry);
  const progressText = formatProgress(habit, entry);
  const category = HABIT_CATEGORIES[habit.category] || HABIT_CATEGORIES.Custom;
  const isCompleted = entry?.completed || false;

  const handleToggleComplete = async () => {
    if (habit.type === "simple") {
      setIsUpdating(true);
      await onToggleComplete?.(habit._id, !isCompleted);
      setIsUpdating(false);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleProgressUpdate = async (newValue) => {
    setIsUpdating(true);
    const completed = newValue >= habit.targetValue;
    await onUpdateProgress?.(habit._id, newValue, completed);
    setIsUpdating(false);
  };

  const incrementProgress = () => {
    const currentValue = entry?.currentValue || 0;
    const newValue = Math.min(currentValue + 1, habit.targetValue);
    handleProgressUpdate(newValue);
  };

  const decrementProgress = () => {
    const currentValue = entry?.currentValue || 0;
    const newValue = Math.max(currentValue - 1, 0);
    handleProgressUpdate(newValue);
  };

  // Compact mode layout
  if (compact) {
    return (
      <div
        className={`
        group relative bg-card border border-border rounded-lg p-3 
        transition-all duration-200 hover:shadow-md
        ${isCompleted ? "ring-1" : ""}
      `}
        style={{
          ringColor: isCompleted ? habit.color : "transparent",
          backgroundColor: isCompleted
            ? hexToRgba(habit.color, 0.03)
            : undefined,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left side - Icon, name, and progress info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Category Icon */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm flex-shrink-0"
              style={{
                backgroundColor: hexToRgba(habit.color, 0.1),
                color: habit.color,
              }}
            >
              {category.icon}
            </div>

            {/* Habit Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h3 className="font-medium text-card-foreground truncate text-sm">
                  {habit.name}
                </h3>
                {habit.type !== "simple" && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {entry?.currentValue || 0}/{habit.targetValue} {habit.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Ring */}
            <ProgressRing
              progress={progress}
              size={32}
              strokeWidth={3}
              color={habit.color}
              showPercentage={false}
              className="flex-shrink-0"
            />

            {/* Status Badge */}
            {isCompleted ? (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full whitespace-nowrap">
                ✓ Done
              </span>
            ) : (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full whitespace-nowrap">
                {Math.round(progress)}%
              </span>
            )}
          </div>

          {/* Center - Action buttons */}
          {showActions && isToday && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {habit.type === "simple" ? (
                <button
                  onClick={handleToggleComplete}
                  disabled={isUpdating}
                  className={`
                    px-3 py-1 text-xs rounded-md font-medium transition-all duration-200
                    ${
                      isCompleted
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                        : "text-white hover:opacity-90"
                    }
                    ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  style={{
                    backgroundColor: !isCompleted ? habit.color : undefined,
                  }}
                >
                  {isUpdating ? "⏳" : isCompleted ? "Undo" : "Done"}
                </button>
              ) : (
                <>
                  <button
                    onClick={decrementProgress}
                    disabled={isUpdating || (entry?.currentValue || 0) === 0}
                    className="w-7 h-7 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center"
                  >
                    −
                  </button>
                  <button
                    onClick={incrementProgress}
                    disabled={
                      isUpdating ||
                      (entry?.currentValue || 0) >= habit.targetValue
                    }
                    className="w-7 h-7 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center"
                  >
                    +
                  </button>
                </>
              )}
            </div>
          )}

          {/* Right side - Edit/Delete Actions (Permanent) */}
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit?.(habit)}
                className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Edit habit"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete?.(habit)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete habit"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original full-size layout
  return (
    <div
      className={`
      group relative bg-card border border-border rounded-lg p-4 
      transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
      ${isCompleted ? "ring-2" : ""}
    `}
      style={{
        ringColor: isCompleted ? habit.color : "transparent",
        backgroundColor: isCompleted ? hexToRgba(habit.color, 0.05) : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {/* Category Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shadow-sm"
            style={{
              backgroundColor: hexToRgba(habit.color, 0.1),
              color: habit.color,
            }}
          >
            {category.icon}
          </div>

          {/* Habit Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">
              {habit.name}
            </h3>
            {habit.description && (
              <p className="text-sm text-muted-foreground truncate">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Ring */}
        <ProgressRing
          progress={progress}
          size={60}
          strokeWidth={6}
          color={habit.color}
          showPercentage={habit.type === "simple"}
        >
          {habit.type !== "simple" && (
            <div className="text-center">
              <div className="text-xs font-bold" style={{ color: habit.color }}>
                {entry?.currentValue || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                /{habit.targetValue}
              </div>
            </div>
          )}
        </ProgressRing>
      </div>

      {/* Progress Text */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{progressText}</span>
        {isToday && (
          <span
            className={`
            text-xs px-2 py-1 rounded-full font-medium
            ${
              isCompleted
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            }
          `}
          >
            {isCompleted ? "Completed" : "In Progress"}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && isToday && (
        <div className="flex items-center space-x-2">
          {habit.type === "simple" ? (
            <button
              onClick={handleToggleComplete}
              disabled={isUpdating}
              className={`
                flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200
                ${
                  isCompleted
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    : "text-white hover:opacity-90 focus:ring-2 focus:ring-offset-2"
                }
                ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
              `}
              style={{
                backgroundColor: !isCompleted ? habit.color : undefined,
                focusRingColor: habit.color,
              }}
            >
              {isUpdating ? "⏳" : isCompleted ? "✓ Done" : "Mark Done"}
            </button>
          ) : (
            <>
              <button
                onClick={decrementProgress}
                disabled={isUpdating}
                className="p-2 w-12 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 text-lg font-medium"
              >
                −
              </button>

              <button
                onClick={handleToggleComplete}
                className={`
                  flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200
                  text-white hover:opacity-90 hover:scale-105 focus:ring-2 focus:ring-offset-2
                  ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
                `}
                style={{
                  backgroundColor: habit.color,
                  focusRingColor: habit.color,
                }}
              >
                {isUpdating ? "⏳" : "Update"}
              </button>

              <button
                onClick={incrementProgress}
                disabled={
                  isUpdating || (entry?.currentValue || 0) >= habit.targetValue
                }
                className="p-2 w-12 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 text-lg font-medium"
              >
                +
              </button>
            </>
          )}
        </div>
      )}

      {/* Expanded Content for complex habits */}
      {isExpanded && habit.type !== "simple" && (
        <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-card-foreground">
              Progress:
            </label>
            <div className="relative flex-1 flex items-center">
              <button
                onClick={decrementProgress}
                disabled={isUpdating}
                className="absolute left-0 h-full px-2.5 flex items-center justify-center border-r border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max={habit.targetValue}
                value={entry?.currentValue || 0}
                onChange={(e) =>
                  handleProgressUpdate(parseInt(e.target.value) || 0)
                }
                className="w-full h-9 pl-10 pr-10 text-center border border-border rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary focus-visible:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={incrementProgress}
                disabled={
                  isUpdating || (entry?.currentValue || 0) >= habit.targetValue
                }
                className="absolute right-0 h-full px-2.5 flex items-center justify-center border-l border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                +
              </button>
            </div>
            <span className="text-sm font-medium">{habit.unit}</span>
          </div>
        </div>
      )}

      {/* Hover Actions */}
      {showActions && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit?.(habit)}
              className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Edit habit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(habit)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete habit"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitCard;
