import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { UserProfileMenu } from "./UserProfileMenu";

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center w-full max-w-md">
        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
        <Input placeholder="Search tasks, notes..." className="bg-background" />
      </div>

      <div className="flex items-center">
        {/* <Avatar>
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar> */}
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
