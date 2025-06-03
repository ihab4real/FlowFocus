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
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <DashboardHeader />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <PomodoroContainer />
            </div>

            <div className="lg:col-span-3">
              <HabitsDashboardPanel />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <MiniScreenTaskBoard />
            </div>

            <div className="lg:col-span-1">
              <NotesDashboardPanel />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-30">
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Dashboard;
