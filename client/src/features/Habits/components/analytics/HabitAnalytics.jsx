import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Award,
} from "lucide-react";
import StreakDisplay from "./StreakDisplay";
import WeeklyCalendar from "./WeeklyCalendar";
import {
  useHabitStreakQuery,
  useWeeklyAnalyticsQuery,
} from "../../hooks/useHabitAnalytics";
import { useHabitEntriesQuery } from "../../hooks/useHabitQueries";
import { hexToRgba, getDaysAgo } from "../../utils/habitUtils";

/**
 * HabitAnalytics component for comprehensive habit analytics display
 * @param {Object} props - Component props
 * @param {Object} props.habit - Habit object
 * @param {boolean} props.compact - Whether to show compact view
 */
const HabitAnalytics = ({ habit, compact = false }) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data
  const { data: streakData, isLoading: streakLoading } = useHabitStreakQuery(
    habit?._id
  );

  const { data: weeklyData, isLoading: weeklyLoading } =
    useWeeklyAnalyticsQuery(habit?._id, 4);

  // Fetch recent entries for calendar view
  const { data: recentEntries = [], isLoading: entriesLoading } =
    useHabitEntriesQuery({
      habitId: habit?._id,
      startDate: getDaysAgo(6),
      endDate: getDaysAgo(0),
    });

  if (!habit) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Select a habit to view analytics
        </CardContent>
      </Card>
    );
  }

  const isLoading = streakLoading || weeklyLoading || entriesLoading;

  // Compact view for dashboard panel
  if (compact) {
    return (
      <div className="space-y-3">
        <StreakDisplay
          streakData={streakData}
          habitColor={habit.color}
          compact={true}
          isLoading={streakLoading}
        />
        <WeeklyCalendar
          entries={recentEntries}
          habitColor={habit.color}
          compact={true}
          isLoading={entriesLoading}
        />
      </div>
    );
  }

  // Full view for main page
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: habit.color }} />
            Analytics for "{habit.name}"
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StreakDisplay
              streakData={streakData}
              habitColor={habit.color}
              isLoading={streakLoading}
            />
            <WeeklyCalendar
              entries={recentEntries}
              habitColor={habit.color}
              isLoading={entriesLoading}
            />
          </div>

          {/* Quick Stats */}
          {streakData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity
                    className="w-4 h-4"
                    style={{ color: habit.color }}
                  />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: hexToRgba(habit.color, 0.05) }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: habit.color }}
                    >
                      {streakData.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Days
                    </div>
                  </div>

                  <div
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: hexToRgba(habit.color, 0.05) }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: habit.color }}
                    >
                      {streakData.best}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Best Streak
                    </div>
                  </div>

                  <div
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: hexToRgba(habit.color, 0.05) }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: habit.color }}
                    >
                      {streakData.consistencyScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Consistency
                    </div>
                  </div>

                  <div
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: hexToRgba(habit.color, 0.05) }}
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: habit.color }}
                    >
                      {streakData.milestones?.achievedMilestones?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Milestones
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <WeeklyCalendar
            entries={recentEntries}
            habitColor={habit.color}
            isLoading={entriesLoading}
          />

          {/* Recent Streak History */}
          {streakData?.streakHistory?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: habit.color }} />
                  Recent Streaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {streakData.streakHistory.slice(0, 5).map((streak, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium">{streak.length} days</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(streak.start).toLocaleDateString()} -{" "}
                          {new Date(streak.end).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        style={{ borderColor: habit.color, color: habit.color }}
                      >
                        {streak.length >= 30
                          ? "🏆"
                          : streak.length >= 14
                            ? "🥈"
                            : streak.length >= 7
                              ? "🥉"
                              : "🎯"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {/* Weekly Trends */}
          {weeklyData && weeklyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: habit.color }}
                  />
                  Weekly Completion Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyData.slice(0, 4).map((week, index) => {
                    const isCurrentWeek = index === weeklyData.length - 1;
                    return (
                      <div
                        key={week.weekStart}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {week.weekLabel}
                            {isCurrentWeek && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {week.completedDays}/{week.totalDays} days completed
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-lg font-bold"
                            style={{ color: habit.color }}
                          >
                            {week.completionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {week.completionRate >= 85
                              ? "Excellent"
                              : week.completionRate >= 70
                                ? "Good"
                                : week.completionRate >= 50
                                  ? "Fair"
                                  : "Needs work"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading state for trends */}
          {weeklyLoading && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Loading overlay for entire component */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              <span>Loading analytics...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HabitAnalytics;
