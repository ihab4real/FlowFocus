import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { TaskBoard } from "@/components/TaskBoard";
import { NotesPanel } from "@/components/NotesPanel";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { ThemeToggle } from "@/components/ThemeToggle";

function Dashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div className="lg:col-span-2">
            <TaskBoard />
          </div>
          <div className="space-y-4">
            <PomodoroTimer />
            <NotesPanel />
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
