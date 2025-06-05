import { useState, useEffect } from "react";

/**
 * Hook for detecting device type and screen size
 * Returns device information for responsive layout decisions
 */
export function useDeviceDetection() {
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

    // Store the orientationchange handler in a variable for proper cleanup
    const orientationChangeHandler = () => {
      // Delay check to allow for orientation change to complete
      setTimeout(checkDevice, 100);
    };

    // Check on mount
    checkDevice();

    // Add resize listener
    window.addEventListener("resize", checkDevice);

    // Add orientation change listener for mobile devices
    window.addEventListener("orientationchange", orientationChangeHandler);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", orientationChangeHandler);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
  };
}
