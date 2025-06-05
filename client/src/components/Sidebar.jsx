import React, { useState, useEffect } from "react";
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
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

function NavItem({
  icon,
  label,
  collapsed,
  active = false,
  to,
  isMobile = false,
  onClick,
}) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      className={cn(
        "w-full flex items-center",
        collapsed && !isMobile ? "justify-center px-2" : "justify-start px-4",
        active && "bg-[#6C63FF] hover:bg-[#6C63FF]/90",
        isMobile && "h-12 text-left"
      )}
      asChild
    >
      <Link to={to} onClick={onClick}>
        {icon}
        {(!collapsed || isMobile) && <span className="ml-2">{label}</span>}
      </Link>
    </Button>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleMouseEnter = () => {
    if (collapsed && !isMobile) {
      setIsHoverExpanded(true);
      setCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (isHoverExpanded && !isMobile) {
      setIsHoverExpanded(false);
      setCollapsed(true);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border p-4 flex items-center justify-between md:hidden">
          <Logo collapsed={false} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileMenuToggle}
            className="h-10 w-10"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={closeMobileMenu}
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r border-border transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Logo collapsed={false} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileMenu}
                  className="h-10 w-10"
                >
                  <X />
                </Button>
              </div>

              <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                <NavItem
                  icon={<Home />}
                  label="Dashboard"
                  collapsed={false}
                  active={location.pathname === "/dashboard"}
                  to="/dashboard"
                  isMobile={true}
                  onClick={closeMobileMenu}
                />
                <NavItem
                  icon={<CalendarCheck />}
                  label="Habits Tracker"
                  collapsed={false}
                  active={location.pathname === "/dashboard/habits"}
                  to="/dashboard/habits"
                  isMobile={true}
                  onClick={closeMobileMenu}
                />
                <NavItem
                  icon={<Trello />}
                  label="Task Board"
                  collapsed={false}
                  active={location.pathname === "/dashboard/taskboard"}
                  to="/dashboard/taskboard"
                  isMobile={true}
                  onClick={closeMobileMenu}
                />
                <NavItem
                  icon={<FileText />}
                  label="Note Panel"
                  collapsed={false}
                  active={location.pathname === "/dashboard/notepanel"}
                  to="/dashboard/notepanel"
                  isMobile={true}
                  onClick={closeMobileMenu}
                />
                <NavItem
                  icon={<Clock />}
                  label="Pomodoro"
                  collapsed={false}
                  active={location.pathname === "/dashboard/pomodoro"}
                  to="/dashboard/pomodoro"
                  isMobile={true}
                  onClick={closeMobileMenu}
                />
                <NavItem
                  icon={<Settings />}
                  label="Settings"
                  collapsed={false}
                  active={location.pathname === "/dashboard/settings"}
                  to="/dashboard/settings"
                  isMobile={true}
                  onClick={closeMobileMenu}
                />
              </nav>

              <div className="p-4 mt-auto border-t border-border">
                <div className="rounded-lg bg-gradient-to-r from-[#6C63FF]/10 to-[#4FD1C5]/10 border border-[#6C63FF]/20 p-3">
                  <p className="text-xs text-center font-medium">
                    Organize. Focus. Flow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop layout
  return (
    <div
      className={cn(
        "h-screen border-r border-border transition-all duration-500 ease-in-out flex flex-col md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border transition-all duration-500 ease-in-out",
          collapsed ? "justify-center py-2" : "justify-center p-4"
        )}
      >
        <Logo collapsed={collapsed} />
      </div>

      <nav
        className="p-2 space-y-2 flex-1 overflow-y-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <NavItem
          icon={<Home />}
          label="Dashboard"
          collapsed={collapsed}
          active={location.pathname === "/dashboard"}
          to="/dashboard"
        />
        <NavItem
          icon={<CalendarCheck />}
          label="Habits Tracker"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/habits"}
          to="/dashboard/habits"
        />
        <NavItem
          icon={<Trello />}
          label="Task Board"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/taskboard"}
          to="/dashboard/taskboard"
        />
        <NavItem
          icon={<FileText />}
          label="Note Panel"
          collapsed={collapsed}
          active={location.pathname === "/dashboard/notepanel"}
          to="/dashboard/notepanel"
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
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "text-primary transition-all duration-500",
              "hover:scale-110 hover:bg-[#6C63FF]/10",
              collapsed ? "rotate-180" : "rotate-0"
            )}
          >
            {collapsed ? <Menu /> : <X />}
          </Button>
        </div>
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
