import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthProvider";

function RootLayout() {
  useEffect(() => {
    console.log("🚀 Ready to focus? Let's build something great!");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default RootLayout;
