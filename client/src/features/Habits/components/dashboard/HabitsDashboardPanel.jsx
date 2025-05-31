import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, Flame, TrendingUp, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProgressRing from "../ui/ProgressRing";
import HabitCard from "../tracking/HabitCard";
import HabitForm from "../forms/HabitForm";
import HabitTemplateSelector from "../forms/HabitTemplateSelector";
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
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useDeleteHabitMutation,
} from "../../hooks/useHabitQueries";

const HabitsDashboardPanel = () => {
  // State for habit creation dialogs
  const [showAddHabitDialog, setShowAddHabitDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Queries and mutations
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
  const createHabitMutation = useCreateHabitMutation();
  const updateHabitMutation = useUpdateHabitMutation();
  const deleteHabitMutation = useDeleteHabitMutation();

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

  // Habit creation handlers
  const handleCreateHabit = async (data) => {
    try {
      await createHabitMutation.mutateAsync(data);
      setShowAddHabitDialog(false);
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleSelectTemplate = (template) => {
    // Directly create habit from template
    setTimeout(() => {
      handleCreateHabit(template);
    }, 0);
  };

  // Edit and delete handlers (following HabitsPage pattern)
  const openEditHabitDialog = (habit) => {
    setEditingHabit(habit);
    setShowAddHabitDialog(true);
  };

  const closeHabitDialog = () => {
    setShowAddHabitDialog(false);
    setEditingHabit(null);
  };

  const handleUpdateHabit = async (data) => {
    await updateHabitMutation.mutateAsync({
      id: editingHabit._id,
      data,
    });
    closeHabitDialog();
  };

  const handleDeleteClick = (habit) => {
    setHabitToDelete(habit);
    setShowDeleteAlert(true);
  };

  const handleDeleteHabit = async () => {
    if (habitToDelete) {
      await deleteHabitMutation.mutateAsync(habitToDelete._id);
      setShowDeleteAlert(false);
      setHabitToDelete(null);
    }
  };

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
            <Link to="/dashboard/habits">
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
            <Link to="/dashboard/habits">Get Started</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxStreak = Math.max(...currentStreaks.map((s) => s.current), 0);

  return (
    <Card className="h-full shadow-sm border-l-4 border-l-primary/20 hover:shadow-md transition-shadow flex flex-col max-h-[360px]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Today's Habits
        </CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Habit
                <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowAddHabitDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Habit
              </DropdownMenuItem>
              <div className="p-2">
                <HabitTemplateSelector
                  onSelectTemplate={handleSelectTemplate}
                  trigger={
                    <button className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors">
                      <Target className="h-4 w-4 mr-2" />
                      Use Template
                    </button>
                  }
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/5"
            asChild
          >
            <Link to="/dashboard/habits">View All</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <ProgressRing
                progress={todayProgress.percentage}
                size={40}
                strokeWidth={4}
                color={getProgressColor(todayProgress.percentage)}
                showPercentage={true}
                className="flex-shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Today's Progress</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-primary">
                    {todayProgress.completed}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of {todayProgress.total} habits completed
                  </span>
                </div>
              </div>
            </div>

            {maxStreak > 0 && (
              <div className="border-l pl-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <div>
                  <span className="text-lg font-bold text-amber-500">
                    {maxStreak}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    day streak
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-medium text-muted-foreground flex-shrink-0">
            Today's Habits ({habits.length})
          </h4>

          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="space-y-3">
              {habits.map((habit) => {
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
                    onEdit={() => openEditHabitDialog(habit)}
                    onDelete={() => handleDeleteClick(habit)}
                    isToday={true}
                    showActions={true}
                    compact={true}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Edit Habit Dialog */}
      <Dialog open={showAddHabitDialog} onOpenChange={setShowAddHabitDialog}>
        <DialogContent className="sm:max-w-[550px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingHabit ? "Edit Habit" : "Create New Habit"}
            </DialogTitle>
          </DialogHeader>
          <HabitForm
            key={editingHabit?._id || "new"}
            defaultValues={editingHabit}
            onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
            onCancel={closeHabitDialog}
            isEditing={!!editingHabit}
            isLoading={
              editingHabit
                ? updateHabitMutation.isPending
                : createHabitMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>

      {/* Delete Habit Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habitToDelete?.name}"? This
              action cannot be undone and all tracking history will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHabit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default HabitsDashboardPanel;
