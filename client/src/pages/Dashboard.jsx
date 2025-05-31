import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { MiniScreenTaskBoard } from "@/features/Tasks/pages/MiniScreenTaskBoard";
import NotesDashboardPanel from "@/features/Notes/components/dashboard/NotesDashboardPanel";
import HabitsDashboardPanel from "@/features/Habits/components/dashboard/HabitsDashboardPanel";
import PomodoroContainer from "@/features/Pomodoro";
import { ThemeToggle } from "@/components/ThemeToggle";

function Dashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-2">
              <PomodoroContainer />
            </div>

            <div className="xl:col-span-3">
              <HabitsDashboardPanel />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="lg:col-span-2">
              <MiniScreenTaskBoard />
            </div>

            <div className="lg:col-span-1">
              <NotesDashboardPanel />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Dashboard;
