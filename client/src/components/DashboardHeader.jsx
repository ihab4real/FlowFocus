import React, { useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { UserProfileMenu } from "./UserProfileMenu";
import { SearchResults } from "./SearchResults";
import { useSearchStore } from "@/store/useSearchStore";

export function DashboardHeader() {
  const { user } = useAuth();
  const { search, isOpen, navigateResults } = useSearchStore();
  const inputRef = useRef(null);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateResults("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateResults("up");
      } else if (e.key === "Escape") {
        e.preventDefault();
        inputRef.current?.blur();
      } else if (e.key === "Enter") {
        // The enter behavior is handled by the focused item in SearchResults
      }
    }
  };

  const handleChange = (e) => {
    search(e.target.value);
  };

  return (
    <header className="border-b border-border p-4 flex items-center justify-between bg-background fixed top-0 left-0 right-0 z-30 md:relative md:top-auto md:z-auto">
      <div className="flex items-center w-full max-w-md relative">
        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search tasks, notes..."
          className="bg-background text-sm md:text-base"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <SearchResults />
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
