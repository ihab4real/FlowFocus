import React, { useState } from "react";
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
                disabled={isUpdating || (entry?.currentValue || 0) === 0}
                className="p-2 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
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
                className="p-2 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
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
            <input
              type="number"
              min="0"
              max={habit.targetValue}
              value={entry?.currentValue || 0}
              onChange={(e) =>
                handleProgressUpdate(parseInt(e.target.value) || 0)
              }
              className="flex-1 px-3 py-1 border border-border rounded-md bg-background"
            />
            <span className="text-sm text-muted-foreground">{habit.unit}</span>
          </div>
        </div>
      )}

      {/* Hover Actions */}
      {showActions && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit?.(habit)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-card-foreground"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete?.(habit._id)}
              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitCard;
