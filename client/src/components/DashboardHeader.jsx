import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { UserProfileMenu } from "./UserProfileMenu";

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b border-border p-4 flex items-center justify-between bg-background md:relative fixed top-16 left-0 right-0 z-30 md:top-auto md:z-auto">
      <div className="flex items-center w-full max-w-md">
        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
        <Input
          placeholder="Search tasks, notes..."
          className="bg-background text-sm md:text-base"
        />
      </div>

      <div className="flex items-center ml-4">
        {/* <Avatar>
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar> */}
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
