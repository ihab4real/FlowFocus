import React, { useState, useEffect } from "react";
import TaskBoard from "./TaskBoard";
import MobileTaskBoard from "./MobileTaskBoard";

/**
 * ResponsiveTaskBoard - Smart component that renders different task board layouts
 * based on screen size and device capabilities
 */
function ResponsiveTaskBoard() {
  const [isMobile, setIsMobile] = useState(false); // Phone size
  const [isTablet, setIsTablet] = useState(false); // Tablet size

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Phone: width < 640px (sm breakpoint)
      const isPhoneSize = width < 640;

      // Tablet: width between 640px and 1024px (sm to lg breakpoint)
      const isTabletSize = width >= 640 && width < 1024;

      // Apply touch device consideration for edge cases
      setIsMobile(isPhoneSize || (isTouchDevice && width < 768));
      setIsTablet(
        isTabletSize || (isTouchDevice && width >= 640 && width < 1280)
      );
    };

    // Check on mount
    checkDevice();

    // Add resize listener
    window.addEventListener("resize", checkDevice);

    // Add orientation change listener for mobile devices
    window.addEventListener("orientationchange", () => {
      // Delay check to allow for orientation change to complete
      setTimeout(checkDevice, 100);
    });

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  // Phone: Use mobile task board with phone-optimized UI
  if (isMobile) {
    return <MobileTaskBoard />;
  }

  // Tablet: Use mobile task board but with tablet considerations
  if (isTablet) {
    return <MobileTaskBoard />; // For now, but we can create TabletTaskBoard later -> TODO:
  }

  // Desktop: Use full desktop task board
  return <TaskBoard />;
}

export default ResponsiveTaskBoard;
