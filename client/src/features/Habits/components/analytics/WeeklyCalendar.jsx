import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Circle } from "lucide-react";
import { hexToRgba, getLast7Days } from "../../utils/habitUtils";

/**
 * WeeklyCalendar component for showing 7-day habit completion pattern
 * @param {Object} props - Component props
 * @param {Array} props.entries - Habit entries for the week
 * @param {string} props.habitColor - Habit color for theming
 * @param {boolean} props.compact - Whether to show compact view
 * @param {boolean} props.isLoading - Loading state
 */
const WeeklyCalendar = ({
  entries = [],
  habitColor = "#6C63FF",
  compact = false,
  isLoading = false,
}) => {
  const last7Days = getLast7Days();

  if (isLoading) {
    return (
      <Card className={compact ? "h-24" : "h-32"}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Create a map of entries by date for quick lookup
  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {});

  // Calculate completion data for each day
  const weekData = last7Days.map((day) => {
    const entry = entriesByDate[day.date];
    const completed = entry?.completed || false;
    const hasEntry = !!entry;

    return {
      ...day,
      completed,
      hasEntry,
      entry,
    };
  });

  const completedDays = weekData.filter((day) => day.completed).length;
  const completionRate = Math.round((completedDays / 7) * 100);

  // Compact view for dashboard panel
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: habitColor }} />
                <span className="text-sm font-medium">This Week</span>
              </div>
              <div
                className="text-sm font-medium"
                style={{ color: habitColor }}
              >
                {completedDays}/7 days
              </div>
            </div>

            <div className="flex gap-1">
              {weekData.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {day.dayName}
                  </div>
                  <div
                    className={`
                      w-full h-6 rounded flex items-center justify-center text-xs font-medium
                      ${
                        day.completed
                          ? "text-white"
                          : day.hasEntry
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                      }
                      ${day.isToday ? "ring-2 ring-offset-1" : ""}
                    `}
                    style={{
                      backgroundColor: day.completed ? habitColor : undefined,
                      ringColor: day.isToday ? habitColor : undefined,
                    }}
                  >
                    {day.completed ? "✓" : day.hasEntry ? "✗" : "·"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view for main page
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: habitColor }} />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Summary */}
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-lg font-semibold"
              style={{ color: habitColor }}
            >
              {completionRate}% Complete
            </div>
            <p className="text-sm text-muted-foreground">
              {completedDays} out of 7 days this week
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Streak</div>
            <div className="text-lg font-semibold">
              {(() => {
                // Calculate current week streak from the end
                let streak = 0;
                for (let i = weekData.length - 1; i >= 0; i--) {
                  if (weekData[i].completed) {
                    streak++;
                  } else {
                    break;
                  }
                }
                return streak;
              })()}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((day) => {
            const today = new Date();
            const dayDate = new Date(day.date);
            const isFuture = dayDate > today;

            return (
              <div key={day.date} className="text-center">
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  {day.dayName}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {day.dayNumber}
                </div>
                <div className="flex justify-center">
                  {isFuture ? (
                    <Circle className="w-8 h-8 text-gray-300" />
                  ) : day.completed ? (
                    <CheckCircle
                      className="w-8 h-8"
                      style={{ color: habitColor }}
                    />
                  ) : day.hasEntry ? (
                    <XCircle className="w-8 h-8 text-red-500" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {day.isToday && (
                  <div
                    className="w-2 h-2 rounded-full mx-auto mt-1"
                    style={{ backgroundColor: habitColor }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" style={{ color: habitColor }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-gray-400" />
            <span>No data</span>
          </div>
        </div>

        {/* Week Insights */}
        {completedDays > 0 && (
          <div
            className="p-3 rounded-lg space-y-1"
            style={{ backgroundColor: hexToRgba(habitColor, 0.05) }}
          >
            <div className="text-sm font-medium">Week Insights</div>
            <div className="text-xs text-muted-foreground">
              {completionRate >= 85
                ? "🎉 Excellent week! You're building a strong habit."
                : completionRate >= 70
                  ? "👍 Good progress this week. Keep it up!"
                  : completionRate >= 50
                    ? "📈 You're halfway there. Push for more consistency."
                    : completedDays > 0
                      ? "💪 Every day counts. Focus on building momentum."
                      : "🎯 Fresh start ahead. You've got this!"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyCalendar;
