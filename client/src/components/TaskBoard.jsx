import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";

export function TaskBoard() {
  // Sample data - in a real app, this would come from your API
  const [columns, setColumns] = useState([
    {
      id: "todo",
      title: "To Do",
      tasks: [
        {
          id: "task-1",
          title: "Research MongoDB schemas",
          description: "Plan data structure for the app",
        },
        {
          id: "task-2",
          title: "Set up authentication",
          description: "Implement JWT auth flow",
        },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        {
          id: "task-3",
          title: "Design dashboard UI",
          description: "Create wireframes in Figma",
        },
      ],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        {
          id: "task-4",
          title: "Project setup",
          description: "Initialize MERN stack project",
        },
      ],
    },
  ]);

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Board</CardTitle>
        <Button size="sm" className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
          <Plus className="w-4 h-4 mr-1" />
          Add Column
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-muted rounded-lg p-2"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{column.title}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {column.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-2 justify-start text-[#6C63FF]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task }) {
  return (
    <div className="bg-card rounded-md p-3 shadow-sm border border-border hover:border-[#6C63FF]/30 transition-colors">
      <h4 className="font-medium">{task.title}</h4>
      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
    </div>
  );
}
