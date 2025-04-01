import React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader() {
  return (
    <header className="border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center w-full max-w-sm">
        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
        <Input placeholder="Search tasks, notes..." className="bg-background" />
      </div>

      <div className="flex items-center gap-4">
        <Button className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
        <Avatar>
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
