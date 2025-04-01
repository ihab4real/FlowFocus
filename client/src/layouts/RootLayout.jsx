import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";

function RootLayout() {
  useEffect(() => {
    console.log("🚀 Ready to focus? Let's build something great!");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </div>
  );
}

export default RootLayout;
