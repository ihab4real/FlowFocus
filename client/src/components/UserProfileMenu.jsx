import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";

export function UserProfileMenu({ user: userProp }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user: contextUser, logout } = useAuth();

  // Use the prop if provided, otherwise fall back to context
  const user = userProp || contextUser;

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
          <span className="text-xs font-medium">{getInitials(user?.name)}</span>
        </Avatar>
        <span className="text-sm font-medium hidden md:inline-block">
          {user?.name}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border z-50">
            <div
              className="py-1 rounded-md bg-card"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <button
                  className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </button>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </button>
              </div>
              <div className="py-1 border-t border-border">
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-accent"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
