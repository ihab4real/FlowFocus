import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";
import { hexToRgba } from "../../utils/habitUtils";

/**
 * StreakDisplay component for showing habit streak information
 * @param {Object} props - Component props
 * @param {Object} props.streakData - Streak data from analytics
 * @param {string} props.habitColor - Habit color for theming
 * @param {boolean} props.compact - Whether to show compact view
 * @param {boolean} props.isLoading - Loading state
 */
const StreakDisplay = ({
  streakData,
  habitColor = "#6C63FF",
  compact = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className={compact ? "h-24" : "h-32"}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!streakData) {
    return (
      <Card className={compact ? "h-24" : "h-32"}>
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          No streak data available
        </CardContent>
      </Card>
    );
  }

  const {
    current = 0,
    best = 0,
    isActive = false,
    milestones = {},
    consistencyScore = 0,
  } = streakData;

  const {
    nextMilestone,
    daysToNextMilestone = 0,
    completionPercentage = 0,
    achievedMilestones = [],
  } = milestones;

  // Compact view for dashboard panel
  if (compact) {
    return (
      <Card className="border-l-4" style={{ borderLeftColor: habitColor }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: hexToRgba(habitColor, 0.1) }}
              >
                <Flame
                  className="w-5 h-5"
                  style={{ color: isActive ? habitColor : "#9CA3AF" }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-bold"
                    style={{ color: habitColor }}
                  >
                    {current}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    day streak
                  </span>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      🔥 Active
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Best: {best} days • Score: {consistencyScore}%
                </div>
              </div>
            </div>

            {nextMilestone && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Next goal</div>
                <div className="text-sm font-medium">
                  {daysToNextMilestone} days
                </div>
              </div>
            )}
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
          <Flame className="w-4 h-4" style={{ color: habitColor }} />
          Streak Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: habitColor }}
              >
                {current}
              </span>
              <span className="text-muted-foreground">
                day{current !== 1 ? "s" : ""}
              </span>
              {isActive && (
                <Badge variant="secondary" className="ml-2">
                  🔥 Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Current streak</p>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold text-muted-foreground">
              {best}
            </div>
            <p className="text-sm text-muted-foreground">Best streak</p>
          </div>
        </div>

        {/* Milestone Progress */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {nextMilestone} days</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress
              value={completionPercentage}
              className="h-2"
              style={{
                background: hexToRgba(habitColor, 0.1),
              }}
            />
            <p className="text-xs text-muted-foreground">
              {daysToNextMilestone} more day
              {daysToNextMilestone !== 1 ? "s" : ""} to reach your next
              milestone
            </p>
          </div>
        )}

        {/* Achievements */}
        {achievedMilestones.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Achievements
            </div>
            <div className="flex flex-wrap gap-1">
              {achievedMilestones.slice(-5).map((milestone) => (
                <Badge
                  key={milestone}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: habitColor, color: habitColor }}
                >
                  {milestone}d
                </Badge>
              ))}
              {achievedMilestones.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{achievedMilestones.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Consistency Score */}
        <div
          className="flex items-center justify-between p-3 rounded-lg"
          style={{ backgroundColor: hexToRgba(habitColor, 0.05) }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: habitColor }} />
            <span className="text-sm font-medium">Consistency Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: habitColor }}>
              {consistencyScore}%
            </span>
            <div className="text-xs text-muted-foreground">
              {consistencyScore >= 80
                ? "Excellent"
                : consistencyScore >= 60
                  ? "Good"
                  : consistencyScore >= 40
                    ? "Fair"
                    : "Needs Improvement"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakDisplay;
