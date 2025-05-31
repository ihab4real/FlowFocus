import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  Filter,
  RefreshCw,
  Target,
  LayoutGrid,
  List,
  Minimize2,
  BarChart3,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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

import HabitForm from "../components/forms/HabitForm";
import HabitTemplateSelector from "../components/forms/HabitTemplateSelector";
import HabitCard from "../components/tracking/HabitCard";
import HabitAnalytics from "../components/analytics/HabitAnalytics";
import { HABIT_CATEGORIES } from "../constants/habitConstants";
import {
  useHabitsQuery,
  useTodayHabitEntriesQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useDeleteHabitMutation,
  useLogHabitEntryMutation,
} from "../hooks/useHabitQueries";

const HabitsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showAddHabitDialog, setShowAddHabitDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(
    Object.keys(HABIT_CATEGORIES)
  );
  const [showInactive, setShowInactive] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Analytics panel state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedHabitForAnalytics, setSelectedHabitForAnalytics] =
    useState(null);

  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Apply entrance animation after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Check if we should open create dialog from query param
    if (searchParams.get("action") === "create") {
      setShowAddHabitDialog(true);
    }

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Query hooks
  const { data: habits = [], isLoading: habitsLoading } = useHabitsQuery();
  const { data: todayEntries = [], isLoading: entriesLoading } =
    useTodayHabitEntriesQuery();

  // Mutation hooks
  const createHabitMutation = useCreateHabitMutation();
  const updateHabitMutation = useUpdateHabitMutation();
  const deleteHabitMutation = useDeleteHabitMutation();
  const logEntryMutation = useLogHabitEntryMutation();

  const loading = habitsLoading || entriesLoading;

  // Filter habits based on selected categories, active state, and current tab
  const filteredHabits = habits.filter((habit) => {
    // Filter by active state
    if (!showInactive && !habit.isActive) return false;

    // Filter by selected categories
    if (!selectedCategories.includes(habit.category)) return false;

    // Filter by tab
    if (activeTab !== "all") {
      const isCompleted = todayEntries.some(
        (entry) =>
          (entry.habit._id || entry.habit) === habit._id && entry.completed
      );

      if (activeTab === "completed" && !isCompleted) return false;
      if (activeTab === "incomplete" && isCompleted) return false;
    }

    return true;
  });

  // Dialog handlers
  const openAddHabitDialog = () => {
    setEditingHabit(null);
    setShowAddHabitDialog(true);
  };

  const openEditHabitDialog = (habit) => {
    setEditingHabit(habit);
    setShowAddHabitDialog(true);
  };

  const closeHabitDialog = () => {
    setShowAddHabitDialog(false);
    setEditingHabit(null);
  };

  // Form submit handlers
  const handleCreateHabit = async (data) => {
    await createHabitMutation.mutateAsync(data);
    closeHabitDialog();
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

  const handleTemplateSelect = (template) => {
    setEditingHabit(null);
    setShowAddHabitDialog(true);
    setTimeout(() => {
      // Use setTimeout to ensure the form is mounted
      // before we try to populate it with the template data
      handleCreateHabit(template);
    }, 0);
  };

  // Category filter toggle
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Toggle all categories
  const toggleAllCategories = () => {
    if (selectedCategories.length === Object.keys(HABIT_CATEGORIES).length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(Object.keys(HABIT_CATEGORIES));
    }
  };

  // Handler for the minimize button
  const handleMinimize = () => {
    // Navigate back to the dashboard
    navigate("/dashboard");
  };

  // Analytics handlers
  const handleToggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    if (!showAnalytics && filteredHabits.length > 0) {
      setSelectedHabitForAnalytics(filteredHabits[0]);
    }
  };

  const handleSelectHabitForAnalytics = (habit) => {
    setSelectedHabitForAnalytics(habit);
    if (!showAnalytics) {
      setShowAnalytics(true);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-500 ease-in-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        <DashboardHeader />

        <div className="p-6 space-y-6 flex-1 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Habit Tracking
              </h1>
              <p className="text-muted-foreground">
                Build consistency with daily habits
              </p>
            </div>

            <div className="flex items-center gap-2">
              <HabitTemplateSelector
                onSelectTemplate={handleTemplateSelect}
                trigger={
                  <Button variant="outline" size="sm">
                    Templates
                  </Button>
                }
              />
              <Button
                onClick={handleToggleAnalytics}
                size="sm"
                variant={showAnalytics ? "default" : "outline"}
                className={
                  showAnalytics
                    ? ""
                    : "border-primary/30 text-primary hover:bg-primary/5"
                }
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
              <Button onClick={openAddHabitDialog} size="sm">
                <PlusCircle className="h-4 w-4 mr-1" />
                New Habit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMinimize}
                className={`
                  transition-all duration-300 ease-in-out 
                  group overflow-hidden border-[#6C63FF]/30
                  hover:border-[#6C63FF] hover:bg-[#6C63FF]/5
                `}
                title="Minimize to Dashboard"
              >
                <Minimize2 className="w-4 h-4 group-hover:scale-95 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div
            className={`flex gap-6 ${showAnalytics ? "min-h-[calc(100vh-200px)]" : ""}`}
          >
            {/* Left Panel - Habits List */}
            <div
              className={`${showAnalytics ? "w-1/2" : "w-full"} space-y-6 transition-all duration-300`}
            >
              {/* Filters and Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Tabs
                  defaultValue="all"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full sm:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="all">All Habits</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-1" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Categories
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={toggleAllCategories}
                          >
                            {selectedCategories.length ===
                            Object.keys(HABIT_CATEGORIES).length
                              ? "Clear All"
                              : "Select All"}
                          </Button>
                        </div>
                        {Object.entries(HABIT_CATEGORIES).map(
                          ([key, category]) => (
                            <DropdownMenuCheckboxItem
                              key={key}
                              checked={selectedCategories.includes(key)}
                              onCheckedChange={() => toggleCategory(key)}
                            >
                              <span className="mr-2">{category.icon}</span>
                              {key}
                            </DropdownMenuCheckboxItem>
                          )
                        )}
                        <Separator className="my-2" />
                        <DropdownMenuCheckboxItem
                          checked={showInactive}
                          onCheckedChange={setShowInactive}
                        >
                          Show Inactive Habits
                        </DropdownMenuCheckboxItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!showAnalytics && (
                    <div className="border rounded-md overflow-hidden flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none px-3 h-9 ${
                          viewMode === "grid"
                            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none px-3 h-9 ${
                          viewMode === "list"
                            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Habits Grid/List */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredHabits.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      No habits found
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      {habits.length === 0
                        ? "You haven't created any habits yet. Get started by creating your first habit!"
                        : "No habits match your current filters. Try adjusting your filter settings."}
                    </p>
                    {habits.length === 0 ? (
                      <div className="flex gap-2">
                        <HabitTemplateSelector
                          onSelectTemplate={handleTemplateSelect}
                          trigger={
                            <Button variant="outline">Use a Template</Button>
                          }
                        />
                        <Button onClick={openAddHabitDialog}>
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Create Habit
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedCategories(Object.keys(HABIT_CATEGORIES));
                          setActiveTab("all");
                          setShowInactive(true);
                        }}
                      >
                        Reset Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div
                  className={
                    showAnalytics || viewMode === "list"
                      ? "space-y-3"
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  }
                >
                  {filteredHabits.map((habit) => {
                    const entry = todayEntries.find(
                      (e) => (e.habit._id || e.habit) === habit._id
                    );
                    const isSelectedForAnalytics =
                      selectedHabitForAnalytics?._id === habit._id;

                    return (
                      <div
                        key={habit._id}
                        className={`${
                          showAnalytics && isSelectedForAnalytics
                            ? "ring-2 ring-primary ring-offset-2 transition-all duration-200"
                            : ""
                        }`}
                        onClick={() =>
                          showAnalytics && handleSelectHabitForAnalytics(habit)
                        }
                      >
                        <HabitCard
                          habit={habit}
                          entry={entry}
                          onToggleComplete={handleToggleComplete}
                          onUpdateProgress={handleUpdateProgress}
                          onEdit={openEditHabitDialog}
                          onDelete={handleDeleteClick}
                          isToday={true}
                          showActions={!showAnalytics}
                          compact={showAnalytics}
                          onClick={
                            showAnalytics
                              ? () => handleSelectHabitForAnalytics(habit)
                              : undefined
                          }
                          className={
                            showAnalytics
                              ? "cursor-pointer hover:shadow-md transition-shadow"
                              : ""
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Panel - Analytics */}
            {showAnalytics && (
              <div className="w-1/2 border-l pl-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Analytics</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalytics(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <HabitAnalytics habit={selectedHabitForAnalytics} />
              </div>
            )}
          </div>
        </div>

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

        {/* Add/Edit Habit Dialog */}
        <Dialog open={showAddHabitDialog} onOpenChange={setShowAddHabitDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingHabit ? "Edit Habit" : "Create New Habit"}
              </DialogTitle>
              <DialogDescription>
                {editingHabit
                  ? "Update your habit details"
                  : "Define a new habit to track daily"}
              </DialogDescription>
            </DialogHeader>

            <HabitForm
              key={editingHabit?._id || "new"}
              defaultValues={editingHabit}
              onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
              onCancel={closeHabitDialog}
              isEditing={!!editingHabit}
              isLoading={
                createHabitMutation.isPending || updateHabitMutation.isPending
              }
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default HabitsPage;
