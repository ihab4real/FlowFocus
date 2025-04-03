import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  CheckSquare,
  FileText,
  Clock,
  Settings,
  Menu,
  X,
  Trello,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

function NavItem({ icon, label, collapsed, active = false, to }) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      className={cn(
        "w-full justify-start",
        collapsed ? "px-2" : "px-4",
        active && "bg-[#6C63FF] hover:bg-[#6C63FF]/90"
      )}
      asChild
    >
      <Link to={to}>
        {icon}
        {!collapsed && <span className="ml-2">{label}</span>}
      </Link>
    </Button>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div
      className={cn(
        "h-screen border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Logo collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-primary"
        >
          {collapsed ? <Menu /> : <X />}
        </Button>
      </div>

      <nav className="p-2 space-y-2 flex-1 overflow-y-auto">
        <NavItem
          icon={<Home />}
          label="Dashboard"
          collapsed={collapsed}
          active={location.pathname === "/dashboard"}
          to="/dashboard"
        />
        <NavItem
          icon={<Trello />}
          label="Task Board"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/taskboard"}
          to="/dashboard/taskboard"
        />
        <NavItem
          icon={<CheckSquare />}
          label="Tasks"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/tasks"}
          to="/dashboard/tasks"
        />
        <NavItem
          icon={<FileText />}
          label="Notes"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/notes"}
          to="/dashboard/notes"
        />
        <NavItem
          icon={<Clock />}
          label="Pomodoro"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/pomodoro"}
          to="/dashboard/pomodoro"
        />
        <NavItem
          icon={<Settings />}
          label="Settings"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/settings"}
          to="/dashboard/settings"
        />
      </nav>

      {!collapsed && (
        <div className="p-4 mt-auto">
          <div className="rounded-lg bg-gradient-to-r from-[#6C63FF]/10 to-[#4FD1C5]/10 border border-[#6C63FF]/20 p-3">
            <p className="text-xs text-center font-medium">
              Organize. Focus. Flow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
