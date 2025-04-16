import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import PomodoroContainer from "@/features/Pomodoro";

/**
 * PomodoroPage component
 * Renders a fullscreen version of the Pomodoro Timer with the sidebar and header
 * Includes an entrance animation and a fullscreen toggle button
 */
const PomodoroPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in fullscreen mode
  const isFullscreen = location.pathname === "/dashboard/pomodoro";

  useEffect(() => {
    // Apply entrance animation after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/pomodoro");
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-500 ease-in-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
      >
        <DashboardHeader />
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute top-2 right-4 z-10">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              className={`
                transition-all duration-300 ease-in-out 
                group overflow-hidden border-[#6C63FF]/30
                hover:border-[#6C63FF] hover:bg-[#6C63FF]/5
                ${isFullscreen ? "bg-[#6C63FF]/10 text-[#6C63FF]" : ""}
              `}
              title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              <span className="absolute inset-0 bg-[#6C63FF]/0 group-hover:bg-[#6C63FF]/5 transition-all duration-300"></span>
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 relative z-10 group-hover:scale-95 transition-transform" />
              ) : (
                <Maximize2 className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
              )}
            </Button>
          </div>
          <PomodoroContainer />
        </div>
      </main>
    </div>
  );
};

export default PomodoroPage;
