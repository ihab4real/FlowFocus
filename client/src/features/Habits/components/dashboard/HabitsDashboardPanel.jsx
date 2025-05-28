import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, Flame, TrendingUp } from "lucide-react";
import ProgressRing from "../ui/ProgressRing";
import HabitCard from "../tracking/HabitCard";
import {
  calculateStreak,
  getProgressColor,
  getTodayProgress,
} from "../../utils/habitUtils";
import { HABIT_CATEGORIES } from "../../constants/habitConstants";
import {
  useHabitsQuery,
  useTodayHabitEntriesQuery,
  useLogHabitEntryMutation,
  useHabitEntriesQuery,
} from "../../hooks/useHabitQueries";

const HabitsDashboardPanel = () => {
  const { data: habits = [], isLoading: habitsLoading } = useHabitsQuery();
  const { data: todayEntries = [], isLoading: entriesLoading } =
    useTodayHabitEntriesQuery();

  // Get recent entries for streak calculation (last 30 days)
  const { data: recentEntries = [] } = useHabitEntriesQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const logEntryMutation = useLogHabitEntryMutation();

  const loading = habitsLoading || entriesLoading;

  // Calculate today's progress
  const todayProgress = React.useMemo(() => {
    return getTodayProgress(habits, todayEntries);
  }, [habits, todayEntries]);

  // Calculate current streaks
  const currentStreaks = React.useMemo(() => {
    return habits.map((habit) => {
      const streak = calculateStreak(recentEntries, habit._id);
      return {
        habitId: habit._id,
        name: habit.name,
        current: streak,
        color: habit.color,
      };
    });
  }, [habits, recentEntries]);

  // Props for HabitCard that match the expected interface
  const handleToggleComplete = async (habitId, completed) => {
    const today = new Date().toISOString().split("T")[0];
    await logEntryMutation.mutateAsync({
      habitId,
      date: today,
      completed,
      currentValue: completed ? 1 : 0,
    });
  };

  const handleUpdateProgress = async (habitId, currentValue, completed) => {
    const today = new Date().toISOString().split("T")[0];
    await logEntryMutation.mutateAsync({
      habitId,
      date: today,
      currentValue,
      completed,
    });
  };

  if (loading) {
    return (
      <Card className="h-full shadow-sm border-l-4 border-l-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Today's Habits
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (habits.length === 0) {
    return (
      <Card className="h-full shadow-sm border-l-4 border-l-primary/20">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Today's Habits
          </CardTitle>
          <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
            <Link to="/habits">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-72">
          <div className="text-center text-muted-foreground mb-4">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium mb-1">No habits yet</p>
            <p className="text-sm">Start building healthy routines!</p>
          </div>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
            asChild
          >
            <Link to="/habits">Get Started</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxStreak = Math.max(...currentStreaks.map((s) => s.current), 0);

  return (
    <Card className="h-full shadow-sm border-l-4 border-l-primary/20 hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Today's Habits
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/5"
          asChild
        >
          <Link to="/habits">View All</Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <ProgressRing
              progress={todayProgress.percentage}
              size={50}
              strokeWidth={5}
              color={getProgressColor(todayProgress.percentage)}
              showPercentage={true}
              className="flex-shrink-0"
            />
            <div>
              <p className="text-xs text-muted-foreground">Daily Progress</p>
              <p className="font-semibold text-sm">
                {todayProgress.completed}/{todayProgress.total}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Flame className="h-3 w-3" />
                Best Streak
              </div>
              <p className="text-xl font-bold text-primary">{maxStreak}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 flex-1 flex flex-col">
          <h4 className="text-sm font-medium text-muted-foreground flex-shrink-0">
            Quick Actions
          </h4>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 flex-1 overflow-y-auto">
            {habits.slice(0, 6).map((habit) => {
              const entry = todayEntries.find(
                (e) => (e.habit._id || e.habit) === habit._id
              );

              return (
                <HabitCard
                  key={habit._id}
                  habit={habit}
                  entry={entry}
                  onToggleComplete={handleToggleComplete}
                  onUpdateProgress={handleUpdateProgress}
                  isToday={true}
                  showActions={true}
                />
              );
            })}
          </div>

          {habits.length > 6 && (
            <div className="pt-2 border-t flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:bg-primary/5"
                asChild
              >
                <Link to="/habits">View {habits.length - 6} more habits →</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitsDashboardPanel;
